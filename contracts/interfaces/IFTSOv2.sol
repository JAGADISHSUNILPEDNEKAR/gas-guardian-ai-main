// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IFTSOFeedPublisher {
    function getCurrentPrice(bytes32 feedId) external view returns (
        int256 value,
        uint256 timestamp,
        uint8 decimals
    );
    
    function getPrice(bytes32 feedId, uint256 epoch) external view returns (
        int256 value,
        uint256 timestamp,
        uint8 decimals
    );
}

