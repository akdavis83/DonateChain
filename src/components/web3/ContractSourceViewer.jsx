import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { USER_REGISTRY_SOL, DONATION_MANAGER_SOL, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Code2, Copy, CheckCircle2 } from "lucide-react";

export default function ContractSourceViewer() {
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          Smart Contracts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">UserRegistry:</span>
            <code className="font-mono text-accent-foreground text-[10px] truncate max-w-[200px]">
              {CONTRACT_ADDRESSES.UserRegistry}
            </code>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">DonationManager:</span>
            <code className="font-mono text-accent-foreground text-[10px] truncate max-w-[200px]">
              {CONTRACT_ADDRESSES.DonationManager}
            </code>
          </div>
        </div>

        <Tabs defaultValue="registry">
          <TabsList className="w-full bg-secondary">
            <TabsTrigger value="registry" className="flex-1 text-xs">UserRegistry.sol</TabsTrigger>
            <TabsTrigger value="donation" className="flex-1 text-xs">DonationManager.sol</TabsTrigger>
          </TabsList>
          <TabsContent value="registry" className="mt-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-10 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(USER_REGISTRY_SOL, "registry")}
              >
                {copied === "registry" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              <ScrollArea className="h-[300px] rounded-lg bg-secondary/50 border border-border">
                <pre className="p-4 text-[11px] font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {USER_REGISTRY_SOL}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="donation" className="mt-3">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 z-10 text-muted-foreground hover:text-foreground"
                onClick={() => handleCopy(DONATION_MANAGER_SOL, "donation")}
              >
                {copied === "donation" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </Button>
              <ScrollArea className="h-[300px] rounded-lg bg-secondary/50 border border-border">
                <pre className="p-4 text-[11px] font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {DONATION_MANAGER_SOL}
                </pre>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}