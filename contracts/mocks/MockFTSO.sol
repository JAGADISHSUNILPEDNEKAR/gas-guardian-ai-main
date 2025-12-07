// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";

/**
 * @title MockFTSO
 * @notice Mock FTSOv2 feed for testing
 * @dev Implements IFTSOv2 interface for testing purposes
 */
contract MockFTSO is IFTSOv2 {
    mapping(bytes21 => uint256) public prices;
    mapping(bytes21 => int8) public decimals;
    mapping(bytes21 => uint64) public timestamps;

    constructor() {
        // Set default FLR/USD price
        bytes21 flrFeedId = bytes21(keccak256(abi.encodePacked("FLR/USD")));
        prices[flrFeedId] = 1480000000000000000; // $0.0148 with 18 decimals (in Wei)
        decimals[flrFeedId] = 18;
        timestamps[flrFeedId] = uint64(block.timestamp);
    }

    function getFeedById(bytes21 feedId) external view override returns (
        uint256 value,
        int8 dec,
        uint64 timestamp
    ) {
        return (prices[feedId], decimals[feedId], timestamps[feedId]);
    }
    
    function getFeedByIdInWei(bytes21 feedId) external view override returns (
        uint256 value,
        uint64 timestamp
    ) {
        return (prices[feedId], timestamps[feedId]);
    }
    
    function getFeedsById(bytes21[] calldata feedIds) external view override returns (
        uint256[] memory values,
        int8[] memory decimalsArray,
        uint64 timestamp
    ) {
        values = new uint256[](feedIds.length);
        decimalsArray = new int8[](feedIds.length);
        timestamp = uint64(block.timestamp);
        
        for (uint256 i = 0; i < feedIds.length; i++) {
            values[i] = prices[feedIds[i]];
            decimalsArray[i] = decimals[feedIds[i]];
        }
    }

    // Helper function for testing
    function setPrice(bytes21 feedId, uint256 price, int8 dec) external {
        prices[feedId] = price;
        decimals[feedId] = dec;
        timestamps[feedId] = uint64(block.timestamp);
    }
}

