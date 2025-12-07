// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IFTSOv2 - Flare FTSOv2 Interface
 * @notice Official Flare FTSOv2 interface for price feeds
 * @dev Compatible with Flare's official FTSOv2 contracts
 * Gas optimized with view functions
 */
interface IFTSOv2 {
    /**
     * @notice Get feed value by feed ID
     * @param feedId Feed identifier (bytes21 format)
     * @return value Feed value
     * @return decimals Number of decimals
     * @return timestamp Last update timestamp
     */
    function getFeedById(bytes21 feedId) external view returns (
        uint256 value,
        int8 decimals,
        uint64 timestamp
    );
    
    /**
     * @notice Get feed value in Wei by feed ID
     * @param feedId Feed identifier (bytes21 format)
     * @return value Feed value in Wei (18 decimals)
     * @return timestamp Last update timestamp
     */
    function getFeedByIdInWei(bytes21 feedId) external view returns (
        uint256 value,
        uint64 timestamp
    );
    
    /**
     * @notice Get multiple feed values (batch operation)
     * @param feedIds Array of feed identifiers
     * @return values Array of feed values
     * @return decimalsArray Array of decimals
     * @return timestamp Last update timestamp
     */
    function getFeedsById(bytes21[] calldata feedIds) external view returns (
        uint256[] memory values,
        int8[] memory decimalsArray,
        uint64 timestamp
    );
}

/**
 * @title IFTSOFeedPublisher - Legacy interface for backwards compatibility
 * @notice Used by MockFTSO for testing
 */
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

/**
 * @title IContractRegistry - Flare Contract Registry Interface
 * @notice Interface for accessing Flare's contract registry
 */
interface IContractRegistry {
    /**
     * @notice Get production FTSOv2 address
     * @return FTSOv2 contract address
     */
    function getFtsoV2() external view returns (address);
    
    /**
     * @notice Get test FTSOv2 address
     * @return Test FTSOv2 contract address
     */
    function getTestFtsoV2() external view returns (address);
}