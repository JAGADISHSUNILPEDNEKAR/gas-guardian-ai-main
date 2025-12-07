# Remix Deployment - Contract Addresses Reference

## Flare Coston2 Testnet Addresses

### Official Flare Contracts

```
ContractRegistry: 0x1000000000000000000000000000000000000001
FTSOv2 (Test): 0x1000000000000000000000000000000000000003
```

### Feed IDs (bytes21 format)

```
FLR/USD: 0x01464c522f55534400000000000000000000000000
BTC/USD: 0x014254432f55534400000000000000000000000000
ETH/USD: 0x014554482f55534400000000000000000000000000
```

## Deployment Constructor Parameters

### PriceVerifier

```solidity
constructor(
    address _ftsoV2,           // 0x1000000000000000000000000000000000000003
    address _contractRegistry  // 0x1000000000000000000000000000000000000001
)
```

### GasGuard

```solidity
constructor(
    address _priceVerifier  // Deployed PriceVerifier address
)
```

### SmartAccountFactory

```solidity
constructor()  // No parameters
```

## Quick Remix Setup

1. **Open Remix**: https://remix.ethereum.org
2. **Select Environment**: "Injected Provider - MetaMask"
3. **Network**: Flare Coston2 (Chain ID: 114)
4. **Compiler**: Solidity 0.8.20
5. **Deploy Order**: PriceVerifier → GasGuard → SmartAccountFactory

## Testing Functions

### PriceVerifier

```solidity
// Get FLR/USD price in Wei
getCurrentFLRPrice() → (uint256 price, uint64 timestamp)

// Get FLR/USD price with decimals
getCurrentFLRPriceWithDecimals() → (uint256 price, int8 decimals, uint64 timestamp)

// Verify price floor
verifyPriceFloor(uint256 minPrice) → bool
```

### GasGuard

```solidity
// Schedule execution
scheduleExecution(SafetyParams params) → bytes32 executionId

// Execute if safe
executeIfSafe(bytes32 executionId) → bool

// Get execution status
getExecutionStatus(bytes32 executionId) → (bool exists, uint256 deadline, address target)
```

