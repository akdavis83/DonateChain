import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWallet } from "@/lib/walletContext.jsx";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import {
  callContract,
  ethSendTransaction,
  waitForReceipt,
  parseEther,
  getTxExplorerUrl,
} from "@/lib/ethersProvider";
import { CheckCircle2, EyeOff, Loader2, ExternalLink } from "lucide-react";

export default function DonateForm({ onDonationComplete }) {
  const { account, isConnected, refreshBalance } = useWallet();
  const [orgAddress, setOrgAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const donationAddr = CONTRACT_ADDRESSES.DonationManager;
  const isZeroAddress = donationAddr === "0x0000000000000000000000000000000000000000";

  const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);
  const isValidAmount = (amt) => {
    if (!amt) return false;
    const num = parseFloat(amt);
    return num > 0 && !isNaN(num);
  };

  const handleDonate = async () => {
    setError(null);
    setTxHash(null);
    setSuccess(false);

    if (!isValidAddress(orgAddress)) {
      setError("Invalid organization address");
      return;
    }
    if (!isValidAmount(amount)) {
      setError("Invalid amount");
      return;
    }

    setLoading(true);
    try {
      const weiValue = parseEther(amount);
      const tx = await callContract(
        donationAddr,
        "donate(address,bool)",
        [
          { type: "address", value: orgAddress },
          { type: "bool", value: anonymous },
        ],
        weiValue.toString()
      );
      const hash = await ethSendTransaction(tx, account);
      setTxHash(hash);
      await waitForReceipt(hash);
      setSuccess(true);
      setAmount("");
      await refreshBalance(account);
      onDonationComplete?.();
    } catch (err) {
      setError(err.message || "Donation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <img src="../../network_icon.svg" alt="Rootstock" className="w-4 h-4" />
          Make a Donation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isZeroAddress && (
          <p className="text-xs text-muted-foreground">
            Contract not deployed. Update addresses in <code className="font-mono text-accent-foreground">lib/contracts.js</code>
          </p>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Organization Address</Label>
          <Input
            placeholder="0x..."
            value={orgAddress}
            onChange={(e) => setOrgAddress(e.target.value)}
            className="h-9 text-sm bg-secondary border-border font-mono"
            disabled={loading || isZeroAddress}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Amount (tRBTC)</Label>
          <Input
            type="number"
            step="0.0001"
            min="0"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 text-sm bg-secondary border-border font-mono"
            disabled={loading || isZeroAddress}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground cursor-pointer">Anonymous donation</Label>
          </div>
          <Switch
            checked={anonymous}
            onCheckedChange={setAnonymous}
            disabled={loading || isZeroAddress}
          />
        </div>

        <Button
          onClick={handleDonate}
          disabled={loading || isZeroAddress || !orgAddress || !amount}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Donate
            </>
          )}
        </Button>

        {success && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs text-primary font-medium">Donation sent successfully!</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive p-2 rounded-md bg-destructive/10 border border-destructive/20">{error}</p>
        )}

        {txHash && (
          <a
            href={getTxExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View on explorer <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
