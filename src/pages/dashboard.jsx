import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WalletProvider, useWallet } from "@/lib/walletContext.jsx";
import WalletConnect from "@/components/web3/WalletConnect";
import UsernameRegistration from "@/components/web3/UsernameRegistration";
import DonateForm from "@/components/web3/DonateForm";
import OrgStatusPanel from "@/components/web3/OrgStatusPanel";
import LiveFeed from "@/components/web3/LiveFeed";
import ContractSourceViewer from "@/components/web3/ContractSourceViewer";
import { Heart, Zap } from "lucide-react";

function DashboardContent() {
  const { isConnected } = useWallet();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDonationComplete = () => {
    setRefreshTrigger((t) => t + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight">DonateChain</h1>
                <p className="text-[10px] text-muted-foreground font-mono">RSK Testnet</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
          <div className="max-w-2xl">
            <Badge variant="secondary" className="mb-4 bg-accent/50 text-accent-foreground border border-primary/20 font-mono text-[10px]">
              <Zap className="w-3 h-3 mr-1" />
              On-Chain Transparency
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Transparent donations,
              <br />
              <span className="text-primary">verified on-chain.</span>
            </h2>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
              Every donation is recorded on the RSK blockchain. Track contributions in real time,
              verify organizational funding, and donate with full transparency — or anonymously.
            </p>
          </div>
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect your wallet to begin</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect MetaMask to the RSK Testnet to register a username, make donations, and view the live feed.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column — Actions */}
            <div className="lg:col-span-4 space-y-6">
              <UsernameRegistration />
              <DonateForm onDonationComplete={handleDonationComplete} />
              <OrgStatusPanel refreshTrigger={refreshTrigger} />
            </div>

            {/* Right Column — Feed & Contracts */}
            <div className="lg:col-span-8 space-y-6">
              <LiveFeed refreshTrigger={refreshTrigger} />
              <ContractSourceViewer />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            DonateChain Demo · Built on RSK Testnet
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://explorer.testnet.rootstock.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Block Explorer
            </a>
            <a
              href="https://faucet.rsk.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              RSK Faucet
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <WalletProvider>
      <DashboardContent />
    </WalletProvider>
  );
}