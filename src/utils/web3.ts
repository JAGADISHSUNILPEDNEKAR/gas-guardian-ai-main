import { ethers } from 'ethers';

const FLARE_RPC = import.meta.env.VITE_FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc';

// Get provider instance
export const getProvider = (): ethers.Provider => {
  return new ethers.JsonRpcProvider(FLARE_RPC);
};

// Get signer from window.ethereum
export const getSigner = async (): Promise<ethers.Signer | null> => {
  if (typeof window.ethereum === 'undefined') {
    console.error('MetaMask or compatible wallet not found');
    return null;
  }

  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

// Format address for display
export const formatAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// Format gas price
export const formatGasPrice = (gwei: number): string => {
  return `${gwei.toFixed(2)} Gwei`;
};

// Format FLR amount
export const formatFLR = (amount: bigint | number, decimals = 18): string => {
  const num = typeof amount === 'bigint' ? Number(amount) / Math.pow(10, decimals) : amount;
  return num.toFixed(4);
};

// Format USD amount
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
};

// Parse units (wei, gwei, etc.)
export const parseUnits = (value: string, unit: 'wei' | 'gwei' | 'ether' = 'ether'): bigint => {
  return ethers.parseUnits(value, unit);
};

// Format units
export const formatUnits = (value: bigint, unit: 'wei' | 'gwei' | 'ether' = 'ether'): string => {
  return ethers.formatUnits(value, unit);
};

// Check if address is valid
export const isValidAddress = (address: string): boolean => {
  return ethers.isAddress(address);
};

// Get block explorer URL
export const getExplorerUrl = (txHash: string, network: 'flare' | 'coston2' = 'flare'): string => {
  const baseUrl =
    network === 'flare'
      ? 'https://flare-explorer.flare.network'
      : 'https://coston2-explorer.flare.network';
  return `${baseUrl}/tx/${txHash}`;
};

// Wait for transaction confirmation
export const waitForTransaction = async (
  provider: ethers.Provider,
  txHash: string,
  confirmations = 1
): Promise<ethers.TransactionReceipt | null> => {
  try {
    return await provider.waitForTransaction(txHash, confirmations);
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    return null;
  }
};

