# Remix Deployment Guide for GasGuard Contracts

## 📋 Prerequisites

1. **Remix IDE**: https://remix.ethereum.org
2. **MetaMask**: Connected to Flare Coston2 Testnet (Chain ID: 114)
3. **Test FLR**: Get from https://faucet.flare.network/coston2

## 🔗 Flare Coston2 Contract Addresses

```
ContractRegistry: 0x1000000000000000000000000000000000000001
FTSOv2 (Test): Get via ContractRegistry.getTestFtsoV2()
```

## 📝 Deployment Steps

### Step 1: Open Remix IDE

1. Go to https://remix.ethereum.org
2. Create new workspace: "GasGuard"

### Step 2: Add Contract Files

Create these files in Remix:

#### File 1: `IFTSOv2.sol`
Copy content from `contracts/interfaces/IFTSOv2.sol`

#### File 2: `PriceVerifier.sol`
Copy content from `contracts/core/PriceVerifier.sol`

#### File 3: `GasGuard.sol`
Copy content from `contracts/core/GasGuard.sol`

#### File 4: `SmartAccount.sol`
Copy content from `contracts/core/SmartAccount.sol`

#### File 5: `SmartAccountFactory.sol`
Copy content from `contracts/core/SmartAccountFactory.sol`

### Step 3: Compile Contracts

1. Select Solidity compiler version: **0.8.20**
2. Click "Compile" button
3. Check for errors

### Step 4: Deploy Contracts

#### 4.1 Deploy PriceVerifier

1. Go to "Deploy & Run Transactions"
2. Select "PriceVerifier" from dropdown
3. **Constructor Parameters:**
   - `_ftsoV2`: `0x1000000000000000000000000000000000000003` (FTSOv2 address)
   - `_contractRegistry`: `0x1000000000000000000000000000000000000001` (ContractRegistry)
4. Environment: "Injected Provider - MetaMask"
5. Network: Flare Coston2 (Chain ID: 114)
6. Click "Deploy"
7. **Save deployed address** ✅

#### 4.2 Deploy GasGuard

1. Select "GasGuard" from dropdown
2. **Constructor Parameter:**
   - `_priceVerifier`: (PriceVerifier address from step 4.1)
3. Click "Deploy"
4. **Save deployed address** ✅

#### 4.3 Deploy SmartAccountFactory

1. Select "SmartAccountFactory" from dropdown
2. No constructor parameters needed
3. Click "Deploy"
4. **Save deployed address** ✅

### Step 5: Update Environment Files

Add deployed addresses to your `.env` files:

**Root `.env`:**
```env
VITE_FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
VITE_CONTRACT_REGISTRY_ADDRESS=0x1000000000000000000000000000000000000001
VITE_GASGUARD_CONTRACT_ADDRESS=<deployed_address>
VITE_FACTORY_ADDRESS=<deployed_address>
```

**Backend `.env`:**
```env
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
CONTRACT_REGISTRY_ADDRESS=0x1000000000000000000000000000000000000001
GASGUARD_CONTRACT_ADDRESS=<deployed_address>
FACTORY_ADDRESS=<deployed_address>
```

## 🧪 Testing After Deployment

### Test PriceVerifier

1. In Remix, go to deployed PriceVerifier contract
2. Call `getCurrentFLRPrice()` function
3. Should return FLR/USD price in Wei

### Test GasGuard

1. Go to deployed GasGuard contract
2. Call `getExecutionStatus()` with a test execution ID
3. Should return execution details

## 📚 Important Notes

- **FTSOv2 Address**: Use `0x1000000000000000000000000000000000000003` for Coston2
- **ContractRegistry**: Use `0x1000000000000000000000000000000000000001`
- **Gas Price**: Set to 25 gwei for Coston2
- **Network**: Must be Flare Coston2 (Chain ID: 114)

## 🔍 Verify Contracts

After deployment, verify on Flare Explorer:
- Coston2 Explorer: https://coston2-explorer.flare.network

## 🆘 Troubleshooting

**Error: "Invalid FTSOv2 address"**
- Check FTSOv2 address is correct: `0x1000000000000000000000000000000000000003`

**Error: "Price too stale"**
- FTSOv2 price must be < 2 minutes old
- Wait and retry

**Error: "Insufficient funds"**
- Get test FLR from faucet: https://faucet.flare.network/coston2

---

**Deployment Order:**
1. PriceVerifier (needs FTSOv2 + ContractRegistry)
2. GasGuard (needs PriceVerifier)
3. SmartAccountFactory (no dependencies)

