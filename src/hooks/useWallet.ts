import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

const FLARE_COSTON2_CHAIN_ID = 114;
const FLARE_COSTON2_RPC = 'https://coston2-api.flare.network/ext/C/rpc';
const FLARE_COSTON2_NAME = 'Flare Coston2 Testnet';
const FLARE_COSTON2_CURRENCY = 'FLR';

interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connected: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    connected: false,
    provider: null,
    signer: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum === 'undefined') {
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const network = await provider.getNetwork();
          const balance = await provider.getBalance(address);

          setState({
            address,
            balance: ethers.formatEther(balance),
            chainId: Number(network.chainId),
            connected: true,
            provider,
            signer,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setState({
            address: null,
            balance: null,
            chainId: null,
            connected: false,
            provider: null,
            signer: null,
          });
        } else {
          checkConnection();
        }
      });

      window.ethereum.on('chainChanged', () => {
        checkConnection();
      });
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask or compatible wallet not found. Please install MetaMask.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      // Check/switch to Flare Coston2
      await switchToFlare(provider);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(address);

      setState({
        address,
        balance: ethers.formatEther(balance),
        chainId: Number(network.chainId),
        connected: true,
        provider,
        signer,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchToFlare = useCallback(async (provider?: ethers.BrowserProvider) => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not found');
    }

    const ethProvider = provider || new ethers.BrowserProvider(window.ethereum);
    
    try {
      // Try to switch to Flare Coston2
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${FLARE_COSTON2_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If chain doesn't exist, add it
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${FLARE_COSTON2_CHAIN_ID.toString(16)}`,
                chainName: FLARE_COSTON2_NAME,
                nativeCurrency: {
                  name: FLARE_COSTON2_CURRENCY,
                  symbol: FLARE_COSTON2_CURRENCY,
                  decimals: 18,
                },
                rpcUrls: [FLARE_COSTON2_RPC],
                blockExplorerUrls: ['https://coston2-explorer.flare.network/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Flare Coston2 network:', addError);
          throw new Error('Failed to add Flare Coston2 network to MetaMask');
        }
      } else {
        throw switchError;
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: null,
      chainId: null,
      connected: false,
      provider: null,
      signer: null,
    });
    setError(null);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.provider || !state.address) {
      return;
    }

    try {
      const balance = await state.provider.getBalance(state.address);
      setState((prev) => ({
        ...prev,
        balance: ethers.formatEther(balance),
      }));
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  }, [state.provider, state.address]);

  return {
    ...state,
    connectWallet,
    disconnect,
    switchToFlare,
    refreshBalance,
    loading,
    error,
  };
}

