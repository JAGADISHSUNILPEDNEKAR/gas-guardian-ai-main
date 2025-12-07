// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IFTSOv2.sol";

/**
 * @title PriceVerifier
 * @notice Gas-optimized price verification using Flare's FTSOv2
 * @dev Immutable storage, custom errors, optimized view functions
 */
contract PriceVerifier {
    // Custom errors
    error InvalidAddress();
    error InvalidPrice();
    error PriceTooStale();
    
    IFTSOv2 public immutable ftsoV2;
    IContractRegistry public immutable contractRegistry;
    
    // FLR/USD Feed ID (bytes21 format)
    bytes21 public constant FLR_USD_FEED_ID = bytes21(0x01464c522f55534400000000000000000000000000);
    
    uint256 private constant MAX_PRICE_AGE = 120; // 2 minutes
    
    /**
     * @notice Constructor - For Remix deployment
     * @param _ftsoV2 FTSOv2 contract address (0x1000000000000000000000000000000000000003 for Coston2)
     * @param _contractRegistry ContractRegistry address (0x1000000000000000000000000000000000000001)
     */
    constructor(address _ftsoV2, address _contractRegistry) {
        if (_ftsoV2 == address(0)) revert InvalidAddress();
        if (_contractRegistry == address(0)) revert InvalidAddress();
        ftsoV2 = IFTSOv2(_ftsoV2);
        contractRegistry = IContractRegistry(_contractRegistry);
    }
    
    /**
     * @notice Get current FLR/USD price from FTSOv2
     * @return price Current price in Wei (18 decimals)
     * @return timestamp Last update timestamp
     */
    function getCurrentFLRPrice() public view returns (uint256 price, uint64 timestamp) {
        (uint256 value, uint64 ts) = ftsoV2.getFeedByIdInWei(FLR_USD_FEED_ID);
        
        if (value == 0) revert InvalidPrice();
        
        unchecked {
            if (block.timestamp - uint256(ts) >= MAX_PRICE_AGE) revert PriceTooStale();
        }
        
        return (value, ts);
    }
    
    /**
     * @notice Get FLR/USD price with decimals
     * @return price Current price
     * @return decimals Number of decimal places
     * @return timestamp Last update timestamp
     */
    function getCurrentFLRPriceWithDecimals() public view returns (uint256 price, int8 decimals, uint64 timestamp) {
        (uint256 value, int8 dec, uint64 ts) = ftsoV2.getFeedById(FLR_USD_FEED_ID);
        
        if (value == 0) revert InvalidPrice();
        
        unchecked {
            if (block.timestamp - uint256(ts) >= MAX_PRICE_AGE) revert PriceTooStale();
        }
        
        return (value, dec, ts);
    }

    /**
     * @notice Verify price is above minimum threshold
     * @param minPrice Minimum acceptable price in Wei (18 decimals)
     * @return bool True if current price >= minPrice
     */
    function verifyPriceFloor(uint256 minPrice) public view returns (bool) {
        (uint256 currentPrice, ) = getCurrentFLRPrice();
        return currentPrice >= minPrice;
    }

    /**
     * @notice Get price for any feed by bytes21 feed ID
     * @param feedId Feed identifier in bytes21 format
     * @return price Current price in Wei
     * @return timestamp Last update timestamp
     */
    function getPrice(bytes21 feedId) public view returns (uint256 price, uint64 timestamp) {
        (uint256 value, uint64 ts) = ftsoV2.getFeedByIdInWei(feedId);
        
        if (value == 0) revert InvalidPrice();
        
        unchecked {
            if (block.timestamp - uint256(ts) >= MAX_PRICE_AGE) revert PriceTooStale();
        }
        
        return (value, ts);
    }
    
    /**
     * @notice Get multiple feed prices (batch operation for gas efficiency)
     * @param feedIds Array of feed identifiers
     * @return values Array of prices
     * @return decimalsArray Array of decimals
     * @return timestamp Last update timestamp
     */
    function getMultiplePrices(bytes21[] calldata feedIds) public view returns (
        uint256[] memory values,
        int8[] memory decimalsArray,
        uint64 timestamp
    ) {
        return ftsoV2.getFeedsById(feedIds);
    }
}