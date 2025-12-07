# Remix Deployment - Quick Steps

## ✅ Step 1: Environment Setup
1. Remix me "Deploy & Run Transactions" tab kholo
2. ENVIRONMENT: "Injected Provider - MetaMask" select karo
3. MetaMask connect karo
4. Network: Flare Coston2 (Chain ID: 114)

## ✅ Step 2: Deploy PriceVerifier
**Contract:** PriceVerifier
**Constructor Parameters:**
- `_ftsoV2`: `0x1000000000000000000000000000000000000003`
- `_contractRegistry`: `0x1000000000000000000000000000000000000001`

**Deployed Address:** _________________________

## ✅ Step 3: Deploy GasGuard
**Contract:** GasGuard
**Constructor Parameter:**
- `_priceVerifier`: (PriceVerifier address from Step 2)

**Deployed Address:** _________________________

## ✅ Step 4: Deploy SmartAccountFactory
**Contract:** SmartAccountFactory
**Constructor Parameters:** None

**Deployed Address:** _________________________

## 📝 Update .env Files

### Root `.env`:
```env
VITE_FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
VITE_CONTRACT_REGISTRY_ADDRESS=0x1000000000000000000000000000000000000001
VITE_GASGUARD_CONTRACT_ADDRESS=<GasGuard_address_from_step_3>
VITE_FACTORY_ADDRESS=<Factory_address_from_step_4>
```

### Backend `.env`:
```env
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
CONTRACT_REGISTRY_ADDRESS=0x1000000000000000000000000000000000000001
GASGUARD_CONTRACT_ADDRESS=<GasGuard_address_from_step_3>
FACTORY_ADDRESS=<Factory_address_from_step_4>
```

