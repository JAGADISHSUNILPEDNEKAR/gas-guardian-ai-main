// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SmartAccount.sol";

/**
 * @title SmartAccountFactory
 * @notice Factory for creating SmartAccount instances
 */
contract SmartAccountFactory {
    mapping(address => address) public accounts; // owner => account address
    address[] public allAccounts;

    event AccountCreated(address indexed owner, address indexed account);

    /**
     * @notice Create a new SmartAccount for the caller
     * @return account Address of the created account
     */
    function createAccount() external returns (address account) {
        require(accounts[msg.sender] == address(0), "Account already exists");
        
        SmartAccount newAccount = new SmartAccount(msg.sender);
        account = address(newAccount);
        
        accounts[msg.sender] = account;
        allAccounts.push(account);
        
        emit AccountCreated(msg.sender, account);
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
}

