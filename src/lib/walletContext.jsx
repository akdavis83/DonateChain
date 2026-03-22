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
    const bal = await getBalance(addr);
    setBalance(formatWei(bal, 6));
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const accounts = await requestAccounts();
      const currentChain = await getChainId();
      setAccount(accounts[0]);
      setChainId(currentChain);

      if (currentChain !== NETWORK_CONFIG.chainIdDecimal) {
        await switchToRskTestnet();
        setChainId(NETWORK_CONFIG.chainIdDecimal);
      }

      await refreshBalance(accounts[0]);
    } catch (err) {
      setError(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setBalance(null);
  }, []);

  useEffect(() => {
    const mm = getMetaMaskProvider();
    if (!mm) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        refreshBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(parseInt(chainIdHex, 16));
    };

    mm.on("accountsChanged", handleAccountsChanged);
    mm.on("chainChanged", handleChainChanged);

    return () => {
      mm.removeListener("accountsChanged", handleAccountsChanged);
      mm.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, refreshBalance]);

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