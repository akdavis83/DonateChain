import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useWallet } from "@/lib/walletContext.jsx";
import {
  getLogs,
  DONATION_MADE_TOPIC,
  parseDonationMadeLog,
  callContract,
  ethCall,
  decodeString,
} from "@/lib/ethersProvider";
import { Radio, Loader2 } from "lucide-react";
import DonationFeedItem from "./DonationFeedItem";

export default function LiveFeed({ refreshTrigger }) {
  const { isConnected } = useWallet();
  const [donations, setDonations] = useState([]);
  const [usernames, setUsernames] = useState({});
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [tickKey, setTickKey] = useState(0);
  const pollRef = useRef(null);
  const lastBlockRef = useRef("0x0");

  const donationAddr = CONTRACT_ADDRESSES.DonationManager;
  const registryAddr = CONTRACT_ADDRESSES.UserRegistry;
  const isZeroAddress = donationAddr === "0x0000000000000000000000000000000000000000";

  // Tick every second for time-ago
  useEffect(() => {
    const interval = setInterval(() => setTickKey((k) => k + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Resolve username for a donor address
  const resolveUsername = useCallback(async (addr) => {
    if (registryAddr === "0x0000000000000000000000000000000000000000") return "";
    try {
      const tx = await callContract(registryAddr, "getUsername(address)", [
        { type: "address", value: addr },
      ]);
      const result = await ethCall(tx);
      return decodeString(result);
    } catch {
      return "";
    }
  }, [registryAddr]);

  // Fetch historical logs
  const fetchHistory = useCallback(async () => {
    if (isZeroAddress) return;
    setLoading(true);
    try {
      const logs = await getLogs(donationAddr, DONATION_MADE_TOPIC);
      const parsed = logs.map(parseDonationMadeLog).sort((a, b) => b.id - a.id);
      setDonations(parsed);

      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        lastBlockRef.current = "0x" + (parseInt(lastLog.blockNumber, 16) + 1).toString(16);
      }

      // Resolve usernames for non-anonymous donations
      const usernameMap = {};
      for (const d of parsed) {
        if (!d.anonymous && !usernameMap[d.donor]) {
          const name = await resolveUsername(d.donor);
          if (name) usernameMap[d.donor] = name;
        }
      }
      setUsernames((prev) => ({ ...prev, ...usernameMap }));
    } catch (err) {
      console.error("Failed to fetch donation history:", err);
    } finally {
      setLoading(false);
    }
  }, [donationAddr, isZeroAddress, resolveUsername]);

  // Poll for new events
  const pollNewEvents = useCallback(async () => {
    if (isZeroAddress) return;
    try {
      const logs = await getLogs(donationAddr, DONATION_MADE_TOPIC, lastBlockRef.current);
      if (logs.length > 0) {
        const newDonations = logs.map(parseDonationMadeLog);
        const lastLog = logs[logs.length - 1];
        lastBlockRef.current = "0x" + (parseInt(lastLog.blockNumber, 16) + 1).toString(16);

        setDonations((prev) => {
          const existingIds = new Set(prev.map((d) => d.id));
          const unique = newDonations.filter((d) => !existingIds.has(d.id));
          return [...unique, ...prev];
        });

        // Resolve new usernames
        for (const d of newDonations) {
          if (!d.anonymous) {
            const name = await resolveUsername(d.donor);
            if (name) {
              setUsernames((prev) => ({ ...prev, [d.donor]: name }));
            }
          }
        }
      }
    } catch {
      // Silently retry next poll
    }
  }, [donationAddr, isZeroAddress, resolveUsername]);

  // Initial fetch
  useEffect(() => {
    if (isConnected && !isZeroAddress) {
      fetchHistory();
    }
  }, [isConnected, isZeroAddress, fetchHistory]);

  // Re-fetch on refreshTrigger
  useEffect(() => {
    if (refreshTrigger && isConnected && !isZeroAddress) {
      pollNewEvents();
    }
  }, [refreshTrigger, isConnected, isZeroAddress, pollNewEvents]);

  // Polling interval
  useEffect(() => {
    if (isConnected && !isZeroAddress) {
      setListening(true);
      pollRef.current = setInterval(pollNewEvents, 5000);
      return () => {
        clearInterval(pollRef.current);
        setListening(false);
      };
    }
  }, [isConnected, isZeroAddress, pollNewEvents]);

  return (
    <Card className="bg-card border-border flex flex-col h-full">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            Live Donation Feed
          </CardTitle>
          {listening && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow mr-1.5 inline-block" />
              Listening
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 px-4 pb-4">
        {isZeroAddress ? (
          <p className="text-xs text-muted-foreground px-2">
            Contract not deployed. Update addresses in <code className="font-mono text-accent-foreground">lib/contracts.js</code>
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading history...</span>
          </div>
        ) : donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Radio className="w-8 h-8 mb-3 opacity-30" />
            <p className="text-sm">No donations yet</p>
            <p className="text-xs mt-1">New donations will appear here in real time</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] lg:h-[500px]">
            <div className="space-y-2 pr-2">
              {donations.map((d) => (
                <DonationFeedItem
                  key={d.id}
                  donation={d}
                  username={usernames[d.donor]}
                  tickKey={tickKey}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}