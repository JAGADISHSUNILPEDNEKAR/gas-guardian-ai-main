import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const FLARE_RPC = import.meta.env.VITE_FLARE_RPC_URL || 'https://flare-api.flare.network/ext/bc/C/rpc';

// SmartAccountFactory ABI (simplified)
const FACTORY_ABI = [
  'function createAccount() external returns (address)',
  'function getAccount(address owner) external view returns (address)',
];

// SmartAccount ABI (simplified)
const SMART_ACCOUNT_ABI = [
  'function batchExecute(tuple(address to, uint256 value, bytes data)[] transactions) external',
  'function execute(address to, uint256 value, bytes data) external',
  'function owner() external view returns (address)',
];

export function useSmartAccount() {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [factory, setFactory] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const p = new ethers.JsonRpcProvider(FLARE_RPC);
    setProvider(p);

    const factoryAddress = import.meta.env.VITE_FACTORY_ADDRESS;
    if (factoryAddress && factoryAddress !== '0x0000000000000000000000000000000000000000') {
      const f = new ethers.Contract(factoryAddress, FACTORY_ABI, p);
      setFactory(f);
    }
  }, []);

  const createAccount = async (signer: ethers.Signer): Promise<string> => {
    if (!factory) {
      throw new Error('Factory contract not configured');
    }

    setLoading(true);
    setError(null);

    try {
      const factoryWithSigner = factory.connect(signer);
      const tx = await factoryWithSigner.createAccount();
      await tx.wait();

      const ownerAddress = await signer.getAddress();
      const account = await factory.getAccount(ownerAddress);
      setAccountAddress(account);
      return account;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAccount = async (ownerAddress: string): Promise<string | null> => {
    if (!factory) {
      return null;
    }

    try {
      const account = await factory.getAccount(ownerAddress);
      if (account && account !== ethers.ZeroAddress) {
        setAccountAddress(account);
        return account;
      }
      return null;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  };

  const batchExecute = async (
    signer: ethers.Signer,
    transactions: Array<{ to: string; value: bigint; data: string }>
  ) => {
    if (!accountAddress) {
      throw new Error('Smart account not created');
    }

    const account = new ethers.Contract(accountAddress, SMART_ACCOUNT_ABI, signer);
    const tx = await account.batchExecute(transactions);
    await tx.wait();
    return tx.hash;
  };

  const execute = async (
    signer: ethers.Signer,
    to: string,
    value: bigint,
    data: string
  ) => {
    if (!accountAddress) {
      throw new Error('Smart account not created');
    }

    const account = new ethers.Contract(accountAddress, SMART_ACCOUNT_ABI, signer);
    const tx = await account.execute(to, value, data);
    await tx.wait();
    return tx.hash;
  };

  return {
    accountAddress,
    loading,
    error,
    createAccount,
    getAccount,
    batchExecute,
    execute,
    provider,
  };
}

