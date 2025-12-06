// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SmartAccount
 * @notice Account abstraction for batching, scheduling, and gasless simulations
 */
contract SmartAccount {
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
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }

    /**
     * @notice Execute a batch of transactions
     * @param transactions Array of transactions to execute
     */
    function batchExecute(Transaction[] calldata transactions) external onlyOwner {
        for (uint256 i = 0; i < transactions.length; i++) {
            Transaction memory tx = transactions[i];
            (bool success, bytes memory returnData) = tx.to.call{value: tx.value}(tx.data);
            
            emit TransactionExecuted(tx.to, tx.value, tx.data, success);
            
            if (!success) {
                // Continue with other transactions even if one fails
                assembly {
                    let returndata_size := mload(returnData)
                    revert(add(32, returnData), returndata_size)
                }
            }
        }
        nonce++;
    }

    /**
     * @notice Execute a single transaction
     * @param to Target address
     * @param value Amount to send
     * @param data Calldata
     */
    function execute(address to, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, bytes memory returnData) = to.call{value: value}(data);
        require(success, string(returnData));
        nonce++;
        
        emit TransactionExecuted(to, value, data, success);
    }

    /**
     * @notice Receive ETH
     */
    receive() external payable {}
}

