import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useWallet } from "@/lib/walletContext.jsx";
import {
  callContract,
  ethCall,
  ethSendTransaction,
  decodeMultipleUint256,
  decodeUint256,
  formatWei,
  waitForReceipt,
  getTxExplorerUrl,
} from "@/lib/ethersProvider";
import { Building2, Search, Loader2, ArrowDownToLine, ExternalLink, Flame, CircleDot, Circle } from "lucide-react";

function getActivityState(lastDonationTime) {
  if (!lastDonationTime || lastDonationTime === 0) return { label: "No activity", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" };
  const now = Math.floor(Date.now() / 1000);
  const diff = now - lastDonationTime;
  if (diff < 300) return { label: "Live", icon: Flame, color: "text-chart-4", bg: "bg-chart-4/10" };
  if (diff < 3600) return { label: "Active", icon: CircleDot, color: "text-primary", bg: "bg-primary/10" };
  return { label: "Idle", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" };
}

function timeAgo(timestamp) {
  if (!timestamp) return "Never";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OrgStatusPanel({ refreshTrigger }) {
  const { account, isConnected } = useWallet();
  const [orgAddress, setOrgAddress] = useState("");
  const [stats, setStats] = useState(null);
  const [orgBalance, setOrgBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawTxHash, setWithdrawTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [tickKey, setTickKey] = useState(0);
  const tickRef = useRef(null);

  const donationAddr = CONTRACT_ADDRESSES.DonationManager;
  const isZeroAddress = donationAddr === "0x0000000000000000000000000000000000000000";

  // Tick every second to update "time ago"
  useEffect(() => {
    tickRef.current = setInterval(() => setTickKey((k) => k + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  const fetchStats = useCallback(async (addr) => {
    if (!addr || isZeroAddress) return;
    setLoading(true);
    setError(null);
    try {
      const statsTx = await callContract(donationAddr, "getOrgStats(address)", [
        { type: "address", value: addr },
      ]);
      const statsResult = await ethCall(statsTx);
      const [totalReceived, donationCount, lastDonationTime] = decodeMultipleUint256(statsResult, 3);

      const balTx = await callContract(donationAddr, "orgBalances(address)", [
        { type: "address", value: addr },
      ]);
      const balResult = await ethCall(balTx);
      const bal = decodeUint256(balResult);

      setStats({ totalReceived, donationCount: Number(donationCount), lastDonationTime: Number(lastDonationTime) });
      setOrgBalance(bal);
    } catch (err) {
      setError("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  }, [donationAddr, isZeroAddress]);

  // Re-fetch when refreshTrigger changes
  useEffect(() => {
    if (orgAddress && refreshTrigger) {
      fetchStats(orgAddress);
    }
  }, [refreshTrigger, orgAddress, fetchStats]);

  const handleSearch = () => {
    if (/^0x[a-fA-F0-9]{40}$/.test(orgAddress)) {
      fetchStats(orgAddress);
    } else {
      setError("Invalid address");
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawTxHash(null);
    try {
      const tx = await callContract(donationAddr, "withdraw()", []);
      const hash = await ethSendTransaction(tx, account);
      setWithdrawTxHash(hash);
      await waitForReceipt(hash);
      fetchStats(orgAddress);
    } catch (err) {
      setError(err.message || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  const activity = stats ? getActivityState(stats.lastDonationTime) : null;
  const ActivityIcon = activity?.icon;
  const isOwnOrg = account && orgAddress && account.toLowerCase() === orgAddress.toLowerCase();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Organization Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isZeroAddress && (
          <p className="text-xs text-muted-foreground">
            Contract not deployed. Update addresses in <code className="font-mono text-accent-foreground">lib/contracts.js</code>
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Organization address 0x..."
            value={orgAddress}
            onChange={(e) => setOrgAddress(e.target.value)}
            className="h-9 text-sm bg-secondary border-border font-mono"
            disabled={isZeroAddress}
          />
          <Button
            variant="secondary"
            size="sm"
            className="h-9 px-3"
            onClick={handleSearch}
            disabled={loading || isZeroAddress}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        {stats && (
          <div className="space-y-3 animate-slide-in">
            {/* Activity Badge */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`${activity.bg} ${activity.color} border-0 font-medium`}>
                <ActivityIcon className="w-3 h-3 mr-1" />
                {activity.label}
              </Badge>
              <span key={tickKey} className="text-xs text-muted-foreground font-mono">
                {timeAgo(stats.lastDonationTime)}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Received</p>
                <p className="text-sm font-bold font-mono text-foreground">{formatWei(stats.totalReceived, 6)} tRBTC</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Donations</p>
                <p className="text-sm font-bold font-mono text-foreground">{stats.donationCount}</p>
              </div>
              <div className="col-span-2 p-3 rounded-lg bg-secondary/50 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Available Balance</p>
                <p className="text-sm font-bold font-mono text-foreground">{formatWei(orgBalance || 0n, 6)} tRBTC</p>
              </div>
            </div>

            {/* Withdraw Button (only if connected as org) */}
            {isOwnOrg && isConnected && orgBalance > 0n && (
              <Button
                onClick={handleWithdraw}
                disabled={withdrawing}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
              >
                {withdrawing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                )}
                Withdraw Funds
              </Button>
            )}

            {withdrawTxHash && (
              <a
                href={getTxExplorerUrl(withdrawTxHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View withdrawal tx <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}