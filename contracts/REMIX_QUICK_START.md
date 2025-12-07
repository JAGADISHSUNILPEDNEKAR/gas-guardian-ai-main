# 🚀 Remix Quick Start - GasGuard Contracts

## ⚡ Fast Deployment Steps

### 1. Open Remix IDE
- Go to: https://remix.ethereum.org
- Create workspace: "GasGuard"

### 2. Copy Contract Files

Copy these files to Remix (in order):

#### File 1: `IFTSOv2.sol`
```solidity
// Copy from: contracts/interfaces/IFTSOv2.sol
```

#### File 2: `PriceVerifier.sol`
```solidity
// Copy from: contracts/core/PriceVerifier.sol
```

#### File 3: `GasGuard.sol`
```solidity
// Copy from: contracts/core/GasGuard.sol
```

#### File 4: `SmartAccount.sol`
```solidity
// Copy from: contracts/core/SmartAccount.sol
```

#### File 5: `SmartAccountFactory.sol`
```solidity
// Copy from: contracts/core/SmartAccountFactory.sol
```

### 3. Compile

1. Select compiler: **0.8.20**
2. Click **"Compile"**
3. Check for errors ✅

### 4. Connect MetaMask

1. Environment: **"Injected Provider - MetaMask"**
2. Network: **Flare Coston2** (Chain ID: 114)
3. Get test FLR: https://faucet.flare.network/coston2

### 5. Deploy Contracts

#### Deploy PriceVerifier

**Constructor Parameters:**
```
_ftsoV2: 0x1000000000000000000000000000000000000003
_contractRegistry: 0x1000000000000000000000000000000000000001
```

Click **"Deploy"** → Save address ✅

#### Deploy GasGuard

**Constructor Parameter:**
```
_priceVerifier: <PriceVerifier_address_from_above>
```

Click **"Deploy"** → Save address ✅

#### Deploy SmartAccountFactory

**Constructor Parameters:** None

Click **"Deploy"** → Save address ✅

### 6. Update .env Files

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

## ✅ Done!

Restart backend and frontend, then test GasGuard features!

---

**Important Addresses:**
- ContractRegistry: `0x1000000000000000000000000000000000000001`
- FTSOv2 (Coston2): `0x1000000000000000000000000000000000000003`
- FLR/USD Feed ID: `0x01464c522f55534400000000000000000000000000`

