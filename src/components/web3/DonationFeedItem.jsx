import React from "react";
import { Badge } from "@/components/ui/badge";
import { formatWei, getTxExplorerUrl, getAddressExplorerUrl } from "@/lib/ethersProvider";
import { ExternalLink, EyeOff } from "lucide-react";

function shortenAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function timeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DonationFeedItem({ donation, username, tickKey }) {
  const { donor, organization, amount, anonymous, timestamp, txHash } = donation;

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/20 hover:bg-secondary/50 transition-all duration-200 animate-slide-in">
      {/* Amount pill */}
      <div className="shrink-0 px-2.5 py-1.5 rounded-md bg-primary/10 border border-primary/20">
        <span className="text-xs font-bold font-mono text-primary">{formatWei(amount, 4)}</span>
        <span className="text-[10px] text-primary/60 ml-0.5">tRBTC</span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {anonymous ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground italic">
              <EyeOff className="w-3 h-3" />
              Anonymous
            </span>
          ) : (
            <a
              href={getAddressExplorerUrl(donor)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-foreground hover:text-primary transition-colors"
            >
              {username || shortenAddr(donor)}
            </a>
          )}
          <span className="text-xs text-muted-foreground">→</span>
          <a
            href={getAddressExplorerUrl(organization)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-foreground hover:text-primary transition-colors"
          >
            {shortenAddr(organization)}
          </a>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span key={tickKey} className="text-[10px] text-muted-foreground font-mono">
            {timeAgo(timestamp)}
          </span>
          {txHash && (
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </a>
          )}
          {anonymous && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-muted text-muted-foreground border-0">
              anonymous
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}