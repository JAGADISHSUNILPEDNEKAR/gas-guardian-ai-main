import { ethers } from 'ethers';

export const flareProvider = new ethers.JsonRpcProvider(
  process.env.FLARE_RPC_URL || 'https://flare-api.flare.network/ext/bc/C/rpc'
);

export const coston2Provider = new ethers.JsonRpcProvider(
  process.env.COSTON2_RPC_URL || 'https://coston2-api.flare.network/ext/bc/C/rpc'
);

export const getProvider = (network: 'flare' | 'coston2' = 'flare') => {
  return network === 'flare' ? flareProvider : coston2Provider;
};

