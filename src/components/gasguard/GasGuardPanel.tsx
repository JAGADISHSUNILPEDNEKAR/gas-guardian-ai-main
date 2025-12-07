import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Shield, Fuel, DollarSign, Clock, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGasPrice } from "@/hooks/useGasPrice";
import { useFTSOv2 } from "@/hooks/useFTSOv2";
import { useGasGuard } from "@/hooks/useGasGuard";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";

type TransactionType = "swap" | "deploy" | "mint";
type GuardStatus = "idle" | "waiting" | "executing" | "completed" | "failed";

interface GuardConfig {
  maxGasPrice: number;
  minFlrPrice: number;
  slippage: number;
  deadline: number;
}

export function GasGuardPanel() {
  const { address, connected } = useWallet();
  const { data: gasData, isLoading: gasLoading } = useGasPrice();
  const { getPrice } = useFTSOv2();
  const { scheduleExecution, loading: guardLoading } = useGasGuard();
  
  const [txType, setTxType] = useState<TransactionType>("swap");
  const [status, setStatus] = useState<GuardStatus>("idle");
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [config, setConfig] = useState<GuardConfig>({
    maxGasPrice: 15,
    minFlrPrice: 0.02,
    slippage: 0.5,
    deadline: 30,
  });
  const [flrPrice, setFlrPrice] = useState<number>(0.025);

  // Fetch real-time FLR price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const priceData = await getPrice('FLR/USD');
        setFlrPrice(priceData.price);
      } catch (error) {
        console.error('Error fetching FLR price:', error);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 12000); // Every 12 seconds
    return () => clearInterval(interval);
  }, [getPrice]);

  const currentGas = gasData?.data?.gasPrice?.gwei || 0;
  const currentFlrPrice = flrPrice;

  const conditionsMet = currentGas <= config.maxGasPrice && currentFlrPrice >= config.minFlrPrice;

  const handleActivate = async () => {
    if (!connected || !address) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setStatus("waiting");

    try {
      // Prepare transaction data based on type
      let targetAddress = "";
      let transactionData = "0x";
      let value = "0";

      // For demo, we'll use a simple transaction
      // In production, this would be based on actual swap/deploy/mint logic
      if (txType === "swap") {
        targetAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
        transactionData = "0x"; // Placeholder swap data
      } else if (txType === "deploy") {
        targetAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
        transactionData = "0x"; // Contract bytecode
      } else if (txType === "mint") {
        targetAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
        transactionData = "0x"; // Mint function call
      }

      // Calculate deadline timestamp
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (config.deadline * 60);

      // Schedule execution via GasGuard contract
      const result = await scheduleExecution(
        {
          target: targetAddress,
          data: transactionData,
          value: value,
          type: txType.toUpperCase(),
        },
        {
          maxGasPrice: config.maxGasPrice * 1e9, // Convert to wei
          minFlrPrice: config.minFlrPrice * 1e8, // Scale for contract
          maxSlippage: config.slippage * 100, // Convert to basis points
          deadline: deadlineTimestamp,
        },
        address
      );

      if (result?.executionId) {
        setExecutionId(result.executionId);
        setStatus("waiting");
        toast({
          title: "GasGuard Activated",
          description: `Execution scheduled. ID: ${result.executionId.slice(0, 10)}...`,
        });
      } else {
        throw new Error("Failed to schedule execution");
      }
    } catch (error: any) {
      console.error("Error activating GasGuard:", error);
      setStatus("failed");
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate GasGuard protection",
        variant: "destructive",
      });
    }
  };

  const statusConfig = {
    idle: { icon: Shield, label: "Ready", color: "text-muted-foreground" },
    waiting: { icon: Loader2, label: "Monitoring...", color: "text-warning" },
    executing: { icon: Loader2, label: "Executing...", color: "text-primary" },
    completed: { icon: CheckCircle2, label: "Success!", color: "text-success" },
    failed: { icon: AlertTriangle, label: "Reverted", color: "text-destructive" },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>GasGuard Configuration</CardTitle>
              <CardDescription>Set your protection parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">
              Transaction Type
            </label>
            <div className="flex gap-2">
              {(["swap", "deploy", "mint"] as TransactionType[]).map((type) => (
                <Button
                  key={type}
                  variant={txType === type ? "default" : "outline"}
                  onClick={() => setTxType(type)}
                  className="flex-1 capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Gas Price */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Max Gas Price
              </label>
              <span className="text-sm font-mono text-primary">{config.maxGasPrice} gwei</span>
            </div>
            <Slider
              value={[config.maxGasPrice]}
              onValueChange={([value]) => setConfig({ ...config, maxGasPrice: value })}
              max={50}
              min={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>5 gwei</span>
              <span>50 gwei</span>
            </div>
          </div>

          {/* Min FLR Price */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Min FLR Price (FTSOv2)
              </label>
              <span className="text-sm font-mono text-primary">${config.minFlrPrice.toFixed(4)}</span>
            </div>
            <Slider
              value={[config.minFlrPrice * 1000]}
              onValueChange={([value]) => setConfig({ ...config, minFlrPrice: value / 1000 })}
              max={50}
              min={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>$0.01</span>
              <span>$0.05</span>
            </div>
          </div>

          {/* Slippage */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground">Slippage Tolerance</label>
              <span className="text-sm font-mono text-primary">{config.slippage}%</span>
            </div>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <Button
                  key={val}
                  variant={config.slippage === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, slippage: val })}
                  className="flex-1"
                >
                  {val}%
                </Button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Deadline
              </label>
              <span className="text-sm font-mono text-primary">{config.deadline} minutes</span>
            </div>
            <Slider
              value={[config.deadline]}
              onValueChange={([value]) => setConfig({ ...config, deadline: value })}
              max={120}
              min={5}
              step={5}
              className="w-full"
            />
          </div>

          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleActivate}
            disabled={status !== "idle" || !connected || guardLoading}
          >
            {guardLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Activate GasGuard Protection
              </>
            )}
          </Button>
          
          {!connected && (
            <p className="text-sm text-center text-muted-foreground">
              Connect your wallet to activate GasGuard
            </p>
          )}
        </CardContent>
      </Card>

      {/* Status Monitor */}
      <Card variant={status === "completed" ? "glow" : "glass"}>
        <CardHeader>
          <CardTitle>Execution Monitor</CardTitle>
          <CardDescription>Real-time status of your protected transaction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div
                className={cn(
                  "flex h-24 w-24 items-center justify-center rounded-full mx-auto mb-4 transition-all duration-300",
                  status === "idle" && "bg-muted",
                  status === "waiting" && "bg-warning/20 animate-pulse",
                  status === "executing" && "bg-primary/20 animate-pulse",
                  status === "completed" && "bg-success/20 glow-success",
                  status === "failed" && "bg-destructive/20"
                )}
              >
                <StatusIcon
                  className={cn(
                    "h-12 w-12 transition-all",
                    statusConfig[status].color,
                    (status === "waiting" || status === "executing") && "animate-spin"
                  )}
                />
              </div>
              <Badge
                variant={
                  status === "completed" ? "success" : status === "failed" ? "destructive" : "outline"
                }
                className="text-lg px-4 py-1"
              >
                {statusConfig[status].label}
              </Badge>
            </div>
          </div>

          {/* Conditions Check */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Condition Status</h4>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Gas Price</span>
              </div>
              <div className="flex items-center gap-2">
                {gasLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span className={cn(
                      "text-sm font-mono",
                      currentGas <= config.maxGasPrice ? "text-success" : "text-destructive"
                    )}>
                      {currentGas.toFixed(2)} / {config.maxGasPrice} gwei
                    </span>
                    {currentGas <= config.maxGasPrice ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">FLR Price (FTSOv2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-mono",
                  currentFlrPrice >= config.minFlrPrice ? "text-success" : "text-destructive"
                )}>
                  ${currentFlrPrice.toFixed(4)} / ${config.minFlrPrice.toFixed(4)}
                </span>
                {currentFlrPrice >= config.minFlrPrice ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            
            {executionId && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-xs text-muted-foreground mb-1">Execution ID</div>
                <div className="text-sm font-mono break-all">{executionId}</div>
              </div>
            )}
          </div>

          {/* Estimated Savings */}
          {status !== "idle" && (
            <div className="p-4 rounded-xl bg-success/10 border border-success/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-success">Estimated Savings</span>
                <span className="text-2xl font-bold text-success">$2.47</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Compared to executing at peak gas prices
              </p>
            </div>
          )}

          {status === "idle" && (
            <p className="text-sm text-center text-muted-foreground">
              Configure your protection parameters and activate GasGuard to start monitoring.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
