// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockTarget
 * @notice Mock target contract for testing GasGuard execution
 */
contract MockTarget {
    uint256 public value;
    bool public shouldRevert;

    event Executed(uint256 value, bytes data);

    function execute(bytes calldata data) external payable {
        require(!shouldRevert, "Mock revert");
        value = msg.value;
        emit Executed(msg.value, data);
    }

    function setShouldRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }
}

