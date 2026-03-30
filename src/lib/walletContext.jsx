import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  requestAccounts,
  getChainId,
  switchToRskTestnet,
  getBalance,
  formatWei,
  getMetaMaskProvider,
} from "./ethersProvider";
import { NETWORK_CONFIG } from "./contracts";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectNetwork = chainId === NETWORK_CONFIG.chainIdDecimal;
  const isConnected = !!account && isCorrectNetwork;

  const refreshBalance = useCallback(async (addr) => {
    try {
      const bal = await getBalance(addr);
      setBalance(formatWei(bal, 6));
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      // Use eth_requestAccounts to prompt MetaMask account selection
      const accounts = await requestAccounts();
      const currentChain = await getChainId();
      const selectedAccount = accounts[0];
      
      setAccount(selectedAccount);
      setChainId(currentChain);

      if (currentChain !== NETWORK_CONFIG.chainIdDecimal) {
        await switchToRskTestnet();
        setChainId(NETWORK_CONFIG.chainIdDecimal);
      }

      await refreshBalance(selectedAccount);
    } catch (err) {
      if (err.code === 4001) {
        setError("Connection rejected. Please connect your wallet to continue.");
      } else {
        setError(err.message || "Connection failed");
      }
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setError(null);
    console.log("Disconnected from wallet");
  }, []);

  // Force disconnect from MetaMask completely (for account switching)
  const forceReconnect = useCallback(async () => {
    // First disconnect (clear our state)
    disconnect();
    
    // Wait a moment
    await new Promise(r => setTimeout(r, 500));
    
    // Then reconnect - this will prompt MetaMask to show account selector if needed
    await connect();
  }, [connect, disconnect]);

  // Handle account and chain changes from MetaMask
  useEffect(() => {
    const mm = getMetaMaskProvider();
    if (!mm) return;

    const handleAccountsChanged = (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // User disconnected or locked MetaMask
        disconnect();
      } else if (accounts[0] !== account) {
        // User switched account in MetaMask
        setAccount(accounts[0]);
        refreshBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      console.log("Chain changed:", chainIdHex);
      setChainId(parseInt(chainIdHex, 16));
    };

    mm.on("accountsChanged", handleAccountsChanged);
    mm.on("chainChanged", handleChainChanged);

    return () => {
      mm.removeListener("accountsChanged", handleAccountsChanged);
      mm.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, disconnect, refreshBalance]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        balance,
        isConnected,
        isCorrectNetwork,
        connecting,
        error,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
