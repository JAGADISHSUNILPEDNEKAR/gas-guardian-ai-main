// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";

/**
 * @title MockFTSO
 * @notice Mock FTSOv2 feed for testing
 */
contract MockFTSO is IFTSOFeedPublisher {
    mapping(bytes32 => int256) public prices;
    mapping(bytes32 => uint8) public decimals;
    uint256 public currentTimestamp;

    constructor() {
        currentTimestamp = block.timestamp;
        // Set default FLR/USD price
        bytes32 flrFeedId = keccak256(abi.encodePacked("FLR/USD"));
        prices[flrFeedId] = 1480000; // $0.0148 with 8 decimals
        decimals[flrFeedId] = 8;
    }

    function getCurrentPrice(bytes32 feedId) external view override returns (
        int256 value,
        uint256 timestamp,
        uint8 dec
    ) {
        return (prices[feedId], currentTimestamp, decimals[feedId]);
    }

    function getPrice(bytes32 feedId, uint256 epoch) external view override returns (
        int256 value,
        uint256 timestamp,
        uint8 dec
    ) {
        return (prices[feedId], currentTimestamp, decimals[feedId]);
    }

    function setPrice(bytes32 feedId, int256 price, uint8 dec) external {
        prices[feedId] = price;
        decimals[feedId] = dec;
        currentTimestamp = block.timestamp;
    }
}

