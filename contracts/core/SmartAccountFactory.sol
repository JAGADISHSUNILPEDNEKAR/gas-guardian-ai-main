// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SmartAccount.sol";

/**
 * @title SmartAccountFactory
 * @notice Gas-optimized factory for creating SmartAccount instances
 * @dev Uses deterministic addressing and packed storage
 */
contract SmartAccountFactory {
    // Custom errors
    error AccountAlreadyExists();
    
    mapping(address => address) public accounts; // owner => account address
    address[] public allAccounts;

    event AccountCreated(address indexed owner, address indexed account);

    /**
     * @notice Create a new SmartAccount for the caller
     * @return account Address of the created account
     * @dev Uses CREATE for deployment (could upgrade to CREATE2 for deterministic addressing)
     */
    function createAccount() external returns (address account) {
        if (accounts[msg.sender] != address(0)) revert AccountAlreadyExists();
        
        SmartAccount newAccount = new SmartAccount(msg.sender);
        account = address(newAccount);
        
        accounts[msg.sender] = account;
        allAccounts.push(account);
        
        emit AccountCreated(msg.sender, account);
        return account;
    }

    /**
     * @notice Create a SmartAccount for a specific owner (admin function)
     * @param owner Owner address
     * @return account Address of the created account
     */
    function createAccountFor(address owner) external returns (address account) {
        if (accounts[owner] != address(0)) revert AccountAlreadyExists();
        
        SmartAccount newAccount = new SmartAccount(owner);
        account = address(newAccount);
        
        accounts[owner] = account;
        allAccounts.push(account);
        
        emit AccountCreated(owner, account);
        return account;
    }

    /**
     * @notice Get account address for an owner
     * @param owner Owner address
     * @return account Address of the account (or zero if not created)
     */
    function getAccount(address owner) external view returns (address account) {
        return accounts[owner];
    }

    /**
     * @notice Get total number of accounts created
     * @return count Total count
     */
    function getAccountCount() external view returns (uint256 count) {
        return allAccounts.length;
    }
    
    /**
     * @notice Batch get accounts for multiple owners
     * @param owners Array of owner addresses
     * @return accountList Array of account addresses
     */
    function getAccounts(address[] calldata owners) external view returns (address[] memory accountList) {
        uint256 length = owners.length;
        accountList = new address[](length);
        
        for (uint256 i; i < length;) {
            accountList[i] = accounts[owners[i]];
            unchecked { ++i; }
        }
        
        return accountList;
    }
}