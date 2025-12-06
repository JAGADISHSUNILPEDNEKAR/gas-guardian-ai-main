// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";

/**
 * @title PriceVerifier
 * @notice Verifies asset prices using FTSOv2 oracle
 */
contract PriceVerifier {
    IFTSOFeedPublisher public immutable ftsoFeed;
    uint256 public constant MAX_PRICE_AGE = 120; // 2 minutes

    constructor(address _ftsoFeed) {
        require(_ftsoFeed != address(0), "Invalid FTSO address");
        ftsoFeed = IFTSOFeedPublisher(_ftsoFeed);
    }

    /**
     * @notice Get current FLR/USD price from FTSOv2
     * @return price Current price scaled by decimals
     * @return decimals Number of decimal places
     */
    function getCurrentFLRPrice() public view returns (uint256 price, uint8 decimals) {
        bytes32 feedId = keccak256(abi.encodePacked("FLR/USD"));
        
        (int256 value, uint256 timestamp, uint8 dec) = ftsoFeed.getCurrentPrice(feedId);
        require(value > 0, "Invalid price");
        require(block.timestamp - timestamp < MAX_PRICE_AGE, "Price too stale");
        
        return (uint256(value), dec);
    }

    /**
     * @notice Verify price is above minimum threshold
     * @param minPrice Minimum acceptable price (scaled)
     * @return bool True if current price >= minPrice
     */
    function verifyPriceFloor(uint256 minPrice) public view returns (bool) {
        (uint256 currentPrice,) = getCurrentFLRPrice();
        return currentPrice >= minPrice;
    }

    /**
     * @notice Get price for any feed
     * @param feedId Feed identifier (e.g., "ETH/USD")
     * @return price Current price scaled by decimals
     * @return decimals Number of decimal places
     */
    function getPrice(bytes32 feedId) public view returns (uint256 price, uint8 decimals) {
        (int256 value, uint256 timestamp, uint8 dec) = ftsoFeed.getCurrentPrice(feedId);
        require(value > 0, "Invalid price");
        require(block.timestamp - timestamp < MAX_PRICE_AGE, "Price too stale");
        
        return (uint256(value), dec);
    }
}

