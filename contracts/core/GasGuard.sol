// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";
import "./PriceVerifier.sol";

/**
 * @title GasGuard
 * @notice Gas-optimized on-chain safety net for transaction execution
 * @dev Uses Flare's FTSOv2 with packed storage and custom errors
 */
contract GasGuard {
    // Custom errors (save ~50 gas per revert vs require strings)
    error InvalidPriceVerifier();
    error DeadlineInPast();
    error InvalidTarget();
    error InsufficientValue();
    error ExecutionNotFound();
    error RefundFailed();
    
    PriceVerifier public immutable priceVerifier;

    struct SafetyParams {
        address target;           // 20 bytes
        address refundAddress;    // 20 bytes
        uint64 deadline;          // 8 bytes (packed with above)
        uint64 maxGasPrice;       // 8 bytes (sufficient for gas price)
        uint64 minAssetPrice;     // 8 bytes (price in scaled format)
        uint32 maxSlippage;       // 4 bytes (basis points, max 4.29B)
        uint96 value;             // 12 bytes (ETH/FLR amount, supports up to 79B ETH)
        bytes data;               // Dynamic
    }

    mapping(bytes32 => SafetyParams) public pendingExecutions;
    mapping(address => uint256) public userSavings;

    event ExecutionScheduled(bytes32 indexed executionId, address indexed user, uint64 deadline);
    event SafeExecutionCompleted(bytes32 indexed executionId, address indexed user, uint256 gasUsed, uint256 flrPrice, uint256 savingsUSD);
    event SafetyCheckFailed(bytes32 indexed executionId, string reason, uint256 currentValue, uint256 targetValue);
    event RefundIssued(bytes32 indexed executionId, address indexed user, uint256 amount);

    constructor(address _priceVerifier) {
        if (_priceVerifier == address(0)) revert InvalidPriceVerifier();
        priceVerifier = PriceVerifier(_priceVerifier);
    }

    /**
     * @notice Schedule a safe execution with protection parameters
     * @param params Safety parameters struct
     * @return executionId Unique identifier for this execution
     */
    function scheduleExecution(SafetyParams calldata params) external payable returns (bytes32) {
        if (params.deadline <= block.timestamp) revert DeadlineInPast();
        if (params.target == address(0)) revert InvalidTarget();
        if (msg.value < params.value) revert InsufficientValue();

        bytes32 executionId = keccak256(abi.encodePacked(
            msg.sender,
            params.target,
            params.data,
            block.timestamp,
            block.number
        ));

        pendingExecutions[executionId] = SafetyParams({
            target: params.target,
            refundAddress: msg.sender,
            deadline: params.deadline,
            maxGasPrice: params.maxGasPrice,
            minAssetPrice: params.minAssetPrice,
            maxSlippage: params.maxSlippage,
            value: params.value,
            data: params.data
        });

        emit ExecutionScheduled(executionId, msg.sender, params.deadline);
        return executionId;
    }

    /**
     * @notice Attempt to execute a scheduled transaction
     * @param executionId The execution to attempt
     * @return success Whether execution succeeded
     */
    function executeIfSafe(bytes32 executionId) external returns (bool success) {
        SafetyParams storage params = pendingExecutions[executionId];
        if (params.deadline == 0) revert ExecutionNotFound();

        // Check 1: Deadline not passed
        if (block.timestamp > params.deadline) {
            emit SafetyCheckFailed(executionId, "Deadline passed", block.timestamp, params.deadline);
            _issueRefund(executionId);
            return false;
        }

        // Check 2: Gas price acceptable (use tx.gasprice directly)
        uint256 currentGas = tx.gasprice;
        if (currentGas > params.maxGasPrice) {
            emit SafetyCheckFailed(executionId, "Gas too high", currentGas, params.maxGasPrice);
            return false;
        }

        // Check 3: Asset price acceptable (via FTSOv2)
        (uint256 flrPrice, ) = priceVerifier.getCurrentFLRPrice();
        if (flrPrice < params.minAssetPrice) {
            emit SafetyCheckFailed(executionId, "Price too low", flrPrice, params.minAssetPrice);
            return false;
        }

        // All checks passed - execute transaction
        uint256 gasBefore = gasleft();
        (bool execSuccess, bytes memory returnData) = params.target.call{value: params.value}(params.data);
        
        if (!execSuccess) {
            // Bubble up revert reason
            if (returnData.length > 0) {
                assembly {
                    revert(add(32, returnData), mload(returnData))
                }
            }
            revert("Execution failed");
        }
        
        uint256 gasUsed = gasBefore - gasleft();

        // Calculate savings
        uint256 savingsUSD = _calculateSavings(currentGas, flrPrice, gasUsed);
        unchecked {
            userSavings[params.refundAddress] += savingsUSD;
        }

        emit SafeExecutionCompleted(executionId, params.refundAddress, gasUsed, flrPrice, savingsUSD);

        // Clean up
        delete pendingExecutions[executionId];
        return true;
    }

    /**
     * @dev Calculate savings based on gas optimization
     */
    function _calculateSavings(uint256 actualGas, uint256 flrPriceInWei, uint256 gasUsed) internal pure returns (uint256) {
        // Estimate 30% savings vs immediate execution
        // Gas cost in Wei = actualGas * gasUsed
        // USD cost = (gasCostWei * flrPriceInWei) / 1e18
        uint256 gasCostWei = actualGas * gasUsed;
        uint256 gasCostUSD = (gasCostWei * flrPriceInWei) / 1e18;
        
        // Return 30% of cost as savings (in Wei with 6 decimal precision)
        return (gasCostUSD * 30) / 100;
    }

    /**
     * @dev Issue refund for expired/failed execution
     */
    function _issueRefund(bytes32 executionId) internal {
        SafetyParams storage params = pendingExecutions[executionId];
        uint256 refundAmount = params.value;
        
        // Deduct minimal processing fee
        if (refundAmount > 1000) {
            unchecked {
                refundAmount -= 1000;
            }
        }
        
        (bool success, ) = params.refundAddress.call{value: refundAmount}("");
        if (!success) revert RefundFailed();
        
        emit RefundIssued(executionId, params.refundAddress, refundAmount);
        delete pendingExecutions[executionId];
    }

    /**
     * @notice Get user's accumulated savings
     */
    function getUserSavings(address user) external view returns (uint256) {
        return userSavings[user];
    }

    /**
     * @notice Get execution status
     */
    function getExecutionStatus(bytes32 executionId) external view returns (
        bool exists,
        uint64 deadline,
        address target
    ) {
        SafetyParams storage params = pendingExecutions[executionId];
        return (params.deadline != 0, params.deadline, params.target);
    }
}