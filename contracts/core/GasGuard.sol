// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";
import "./PriceVerifier.sol";

/**
 * @title GasGuard
 * @notice On-chain safety net for transaction execution
 * @dev Uses FTSOv2 for price verification and enforces user-defined safety parameters
 */
contract GasGuard {
    IFTSOFeedPublisher public immutable ftsoFeed;
    PriceVerifier public immutable priceVerifier;

    struct SafetyParams {
        uint256 maxGasPrice;      // Maximum acceptable gas (in wei)
        uint256 minAssetPrice;    // Minimum FLR/USD price (scaled)
        uint256 maxSlippage;      // Max slippage in basis points (100 = 1%)
        uint256 deadline;         // Execution deadline timestamp
        address target;           // Target contract to call
        bytes data;               // Encoded function call
        uint256 value;            // ETH/FLR to send
        address refundAddress;    // Where to refund if conditions not met
    }

    mapping(bytes32 => SafetyParams) public pendingExecutions;
    mapping(address => uint256) public userSavings; // Track savings per user (in USD, scaled by 1e6)

    event ExecutionScheduled(
        bytes32 indexed executionId,
        address indexed user,
        uint256 deadline
    );

    event SafeExecutionCompleted(
        bytes32 indexed executionId,
        address indexed user,
        uint256 gasUsed,
        uint256 flrPrice,
        uint256 savingsUSD
    );

    event SafetyCheckFailed(
        bytes32 indexed executionId,
        string reason,
        uint256 currentValue,
        uint256 targetValue
    );

    event RefundIssued(
        bytes32 indexed executionId,
        address indexed user,
        uint256 amount
    );

    constructor(address _ftsoFeed, address _priceVerifier) {
        require(_ftsoFeed != address(0), "Invalid FTSO address");
        require(_priceVerifier != address(0), "Invalid PriceVerifier address");
        ftsoFeed = IFTSOFeedPublisher(_ftsoFeed);
        priceVerifier = PriceVerifier(_priceVerifier);
    }

    /**
     * @notice Schedule a safe execution with protection parameters
     * @param params Safety parameters struct
     * @return executionId Unique identifier for this execution
     */
    function scheduleExecution(SafetyParams calldata params)
        external
        payable
        returns (bytes32)
    {
        require(params.deadline > block.timestamp, "Deadline in past");
        require(params.target != address(0), "Invalid target");
        require(msg.value >= params.value, "Insufficient value");

        bytes32 executionId = keccak256(abi.encodePacked(
            msg.sender,
            params.target,
            params.data,
            block.timestamp,
            block.number
        ));

        pendingExecutions[executionId] = SafetyParams({
            maxGasPrice: params.maxGasPrice,
            minAssetPrice: params.minAssetPrice,
            maxSlippage: params.maxSlippage,
            deadline: params.deadline,
            target: params.target,
            data: params.data,
            value: params.value,
            refundAddress: msg.sender
        });

        emit ExecutionScheduled(executionId, msg.sender, params.deadline);
        return executionId;
    }

    /**
     * @notice Attempt to execute a scheduled transaction
     * @param executionId The execution to attempt
     * @return success Whether execution succeeded
     */
    function executeIfSafe(bytes32 executionId)
        external
        returns (bool success)
    {
        SafetyParams storage params = pendingExecutions[executionId];
        require(params.deadline != 0, "Execution not found");

        // Check 1: Deadline not passed
        if (block.timestamp > params.deadline) {
            emit SafetyCheckFailed(
                executionId,
                "Deadline passed",
                block.timestamp,
                params.deadline
            );
            _issueRefund(executionId);
            return false;
        }

        // Check 2: Gas price acceptable
        uint256 currentGas = block.basefee;
        if (currentGas == 0) {
            // Fallback for networks without EIP-1559
            (bool success2, bytes memory result) = address(0).staticcall("");
            // Try to get gas price from tx
            currentGas = tx.gasprice;
        }
        
        if (currentGas > params.maxGasPrice) {
            emit SafetyCheckFailed(
                executionId,
                "Gas too high",
                currentGas,
                params.maxGasPrice
            );
            return false; // Don't refund yet, can retry
        }

        // Check 3: Asset price acceptable (via FTSOv2)
        (uint256 flrPrice, uint8 decimals) = priceVerifier.getCurrentFLRPrice();
        uint256 minPriceScaled = params.minAssetPrice;
        
        // Adjust for decimals if needed
        if (decimals < 8) {
            minPriceScaled = minPriceScaled / (10 ** (8 - decimals));
        } else if (decimals > 8) {
            minPriceScaled = minPriceScaled * (10 ** (decimals - 8));
        }
        
        if (flrPrice < minPriceScaled) {
            emit SafetyCheckFailed(
                executionId,
                "Price too low",
                flrPrice,
                minPriceScaled
            );
            return false; // Don't refund yet, can retry
        }

        // All checks passed - execute transaction
        uint256 gasBefore = gasleft();
        (bool execSuccess, bytes memory returnData) = params.target.call{value: params.value}(
            params.data
        );
        require(execSuccess, string(returnData));
        uint256 gasUsed = gasBefore - gasleft();

        // Calculate savings (simplified - would need to store immediate cost)
        uint256 savingsUSD = _calculateSavings(executionId, currentGas, flrPrice, decimals);
        userSavings[params.refundAddress] += savingsUSD;

        emit SafeExecutionCompleted(
            executionId,
            params.refundAddress,
            gasUsed,
            flrPrice,
            savingsUSD
        );

        // Clean up
        delete pendingExecutions[executionId];
        return true;
    }

    function _calculateSavings(
        bytes32 executionId,
        uint256 actualGas,
        uint256 flrPrice,
        uint8 decimals
    ) internal view returns (uint256) {
        // Simplified calculation - in production, would compare with stored immediate cost
        // For now, estimate 30% savings
        uint256 gasCostWei = actualGas * 21000; // Standard transaction
        uint256 gasCostFlr = gasCostWei / 1e18;
        uint256 gasCostUSD = (gasCostFlr * flrPrice) / (10 ** decimals);
        return (gasCostUSD * 30) / 100; // 30% savings estimate
    }

    function _issueRefund(bytes32 executionId) internal {
        SafetyParams storage params = pendingExecutions[executionId];
        uint256 refundAmount = params.value;
        
        // Deduct minimal gas cost (1000 wei)
        if (refundAmount > 1000) {
            refundAmount -= 1000;
        }
        
        (bool success,) = params.refundAddress.call{value: refundAmount}("");
        require(success, "Refund failed");
        
        emit RefundIssued(executionId, params.refundAddress, refundAmount);
        delete pendingExecutions[executionId];
    }

    function getUserSavings(address user) external view returns (uint256) {
        return userSavings[user];
    }

    function getExecutionStatus(bytes32 executionId) external view returns (
        bool exists,
        uint256 deadline,
        address target
    ) {
        SafetyParams storage params = pendingExecutions[executionId];
        return (params.deadline != 0, params.deadline, params.target);
    }
}

