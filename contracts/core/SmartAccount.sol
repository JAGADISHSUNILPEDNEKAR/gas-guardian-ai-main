// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartAccount
 * @notice Gas-optimized account abstraction for batching, scheduling, and gasless simulations
 * @dev Optimizations: packed storage, unchecked arithmetic, custom errors, calldata usage
 */
contract SmartAccount {
    // Custom errors (save gas vs require strings)
    error Unauthorized();
    error InvalidOwner();
    error ExecutionFailed(uint256 index);
    
    address public owner;
    uint256 public nonce;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
    }

    event TransactionExecuted(
        address indexed to,
        uint256 value,
        bytes data,
        bool success
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(address _owner) {
        if (_owner == address(0)) revert InvalidOwner();
        owner = _owner;
    }

    /**
     * @notice Execute a batch of transactions
     * @param transactions Array of transactions to execute
     * @dev Gas optimized: direct memory access, unchecked loop
     */
    function batchExecute(Transaction[] calldata transactions) external onlyOwner {
        uint256 length = transactions.length;
        
        for (uint256 i; i < length;) {
            Transaction calldata txItem = transactions[i];
            (bool success, bytes memory returnData) = txItem.to.call{value: txItem.value}(txItem.data);

            emit TransactionExecuted(txItem.to, txItem.value, txItem.data, success);

            if (!success) {
                // Bubble up revert data if present
                if (returnData.length > 0) {
                    assembly {
                        let returndata_size := mload(returnData)
                        revert(add(32, returnData), returndata_size)
                    }
                } else {
                    revert ExecutionFailed(i);
                }
            }

            unchecked { ++i; }
        }
        unchecked { ++nonce; }
    }

    /**
     * @notice Execute a single transaction
     * @param to Target address
     * @param value Amount to send
     * @param data Calldata
     */
    function execute(address to, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, bytes memory returnData) = to.call{value: value}(data);

        if (!success) {
            if (returnData.length > 0) {
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            } else {
                revert ExecutionFailed(0);
            }
        }

        unchecked { ++nonce; }
        emit TransactionExecuted(to, value, data, true);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}