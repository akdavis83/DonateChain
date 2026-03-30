import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/walletContext.jsx";
import { Wallet, LogOut, AlertTriangle, Loader2, RefreshCw, ExternalLink, ChevronDown } from "lucide-react";
import { switchToRskTestnet, hasMetaMask, hasAnyWallet, getMetaMaskProvider } from "@/lib/ethersProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function shortenAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletConnect() {
  const { account, balance, isConnected, isCorrectNetwork, connecting, error, connect, disconnect, forceReconnect } = useWallet();
  const [showDialog, setShowDialog] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const handleConnectClick = () => {
    if (hasMetaMask()) {
      connect();
    } else {
      setShowDialog(true);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRetrying(false);
    if (hasMetaMask()) {
      setShowDialog(false);
      connect();
    }
  };

  const handleUseFallback = () => {
    setShowDialog(false);
    connect();
  };

  const handleChangeAccount = async () => {
    // Use forceReconnect to prompt MetaMask account selector
    await forceReconnect();
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
          <span className="text-xs font-mono text-muted-foreground">{balance} tRBTC</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 gap-2 text-muted-foreground hover:text-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs font-mono text-accent-foreground">{shortenAddress(account)}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            <DropdownMenuItem onClick={handleChangeAccount} className="cursor-pointer">
              <Wallet className="w-4 h-4 mr-2" />
              Change Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (account && !isCorrectNetwork) {
    return (
      <Button
        onClick={() => switchToRskTestnet()}
        variant="outline"
        className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
      >
        <AlertTriangle className="w-4 h-4 mr-2" />
        Switch to RSK Testnet
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs text-destructive max-w-48 truncate">{error}</span>
        )}
        <Button
          onClick={handleConnectClick}
          disabled={connecting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {connecting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4 mr-2" />
          )}
          {connecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">MetaMask Not Detected</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This app works best with MetaMask. Install it or retry if you just installed it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-2">
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-sm"
            >
              <span>Install MetaMask</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <Button
              variant="outline"
              className="w-full border-border"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {retrying ? "Checking..." : "I just installed MetaMask — Retry"}
            </Button>

            {hasAnyWallet() && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={handleUseFallback}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Continue with another wallet
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
