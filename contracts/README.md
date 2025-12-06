# GasGuard Smart Contracts

Solidity smart contracts for GasGuard Mentor.

## Contracts

- **GasGuard.sol**: Core safety execution contract
- **PriceVerifier.sol**: FTSOv2 price verification
- **SmartAccount.sol**: Account abstraction
- **SmartAccountFactory.sol**: Factory for creating accounts

## Setup

1. Install dependencies:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Configure networks in `hardhat.config.js`

3. Compile:
```bash
npx hardhat compile
```

4. Test:
```bash
npx hardhat test
```

## Deployment

```bash
# Testnet
npx hardhat run scripts/deploy/deployGasGuard.js --network coston2

# Mainnet
npx hardhat run scripts/deploy/deployGasGuard.js --network flare
```

## Security

⚠️ **Important**: Contracts should be audited before mainnet deployment.

