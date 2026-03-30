import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/walletContext.jsx";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import {
  callContract,
  ethCall,
  ethSendTransaction,
  decodeString,
  decodeBool,
  waitForReceipt,
  getTxExplorerUrl,
} from "@/lib/ethersProvider";
import { User, Pencil, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";

export default function UsernameRegistration() {
  const { account, isConnected } = useWallet();
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const registryAddr = CONTRACT_ADDRESSES.UserRegistry;
  const isZeroAddress = registryAddr === "0x0000000000000000000000000000000000000000";

  const fetchUsername = useCallback(async () => {
    if (!isConnected || isZeroAddress) return;
    setChecking(true);
    try {
      const tx = await callContract(registryAddr, "getUsername(address)", [
        { type: "address", value: account },
      ]);
      const result = await ethCall(tx);
      const name = decodeString(result);
      setCurrentUsername(name);
    } catch {
      setCurrentUsername("");
    } finally {
      setChecking(false);
    }
  }, [account, isConnected, registryAddr, isZeroAddress]);

  useEffect(() => {
    fetchUsername();
  }, [fetchUsername]);

  const handleRegister = async () => {
    if (!newUsername.trim()) return;
    setLoading(true);
    setError(null);
    setTxHash(null);
    try {
      const tx = await callContract(registryAddr, "registerUsername(string)", [
        { type: "string", value: newUsername.trim() },
      ]);
      const hash = await ethSendTransaction(tx, account);
      setTxHash(hash);
      await waitForReceipt(hash);
      setCurrentUsername(newUsername.trim());
      setNewUsername("");
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) return null;

  if (isZeroAddress) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Username
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Contract not deployed yet. Update addresses in <code className="font-mono text-accent-foreground">lib/contracts.js</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Username
          </CardTitle>
          {currentUsername && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {checking ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Checking registration...</span>
          </div>
        ) : currentUsername && !isEditing ? (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-accent/50 text-accent-foreground border border-primary/20 font-mono">
              {currentUsername}
            </Badge>
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                placeholder={currentUsername ? "New username..." : "Choose a username..."}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                maxLength={32}
                className="h-9 text-sm bg-secondary border-border font-mono"
                disabled={loading}
              />
              <Button
                onClick={handleRegister}
                disabled={!newUsername.trim() || loading}
                size="sm"
                className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : currentUsername ? "Update" : "Register"}
              </Button>
            </div>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => { setIsEditing(false); setNewUsername(""); }}
              >
                Cancel
              </Button>
            )}
          </>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
        {txHash && (
          <a
            href={getTxExplorerUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View transaction <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
