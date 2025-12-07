import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Wallet, Bell, Shield, Zap, ExternalLink, Copy, Check } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/utils/web3";
import { useState } from "react";

const Settings = () => {
  const { address, balance, chainId, connected, connectWallet, disconnect, loading, error } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCoston2 = chainId === 114;

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-muted-foreground">
          Configure your Mempool Mentor preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet Connection */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Wallet</CardTitle>
                <CardDescription>Connect your wallet to use GasGuard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {connected && address ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm text-success">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{formatAddress(address)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {balance && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">Balance</p>
                      <span className="text-sm font-medium">{parseFloat(balance).toFixed(4)} FLR</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Network</p>
                    <Badge variant={isCoston2 ? "success" : "warning"}>
                      {isCoston2 ? "Coston2" : `Chain ${chainId}`}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={disconnect} className="w-full">
                  Disconnect
                </Button>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-2 w-2 rounded-full bg-warning" />
                      <span className="text-sm">Not connected</span>
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-destructive mb-3">{error}</p>
                )}
                <Button 
                  variant="default" 
                  onClick={connectWallet}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Connecting..." : "Connect Wallet"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Settings */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Network</CardTitle>
                <CardDescription>Flare network configuration</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Network</p>
                <p className="text-sm text-muted-foreground">
                  {isCoston2 ? "Coston2 Testnet" : chainId ? `Chain ${chainId}` : "Not connected"}
                </p>
              </div>
              <Badge variant={isCoston2 ? "success" : "warning"}>
                {isCoston2 ? "Connected" : "Wrong Network"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">FTSOv2 Feed</p>
                <p className="text-sm text-muted-foreground">FLR/USD pair</p>
              </div>
              <Badge variant="glow">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">FDC Connector</p>
                <p className="text-sm text-muted-foreground">Cross-chain data</p>
              </div>
              <Badge variant="glow">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Alert preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Gas Price Alerts</p>
                <p className="text-sm text-muted-foreground">Notify when gas drops below target</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Execution Updates</p>
                <p className="text-sm text-muted-foreground">GasGuard transaction status</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Recommendations</p>
                <p className="text-sm text-muted-foreground">Proactive optimization tips</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card variant="glass">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>GasGuard contract settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">GasGuard Contract</p>
                <p className="text-xs text-muted-foreground font-mono">0x1234...5678</p>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-revert on failure</p>
                <p className="text-sm text-muted-foreground">Protect funds if conditions aren't met</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Simulation before execution</p>
                <p className="text-sm text-muted-foreground">Dry-run transactions</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Settings;
