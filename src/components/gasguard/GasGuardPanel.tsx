import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Shield, Fuel, DollarSign, Clock, Loader2 } from "lucide-react";
import { useGasPrice } from "@/hooks/useGasPrice";
import { useFTSOv2 } from "@/hooks/useFTSOv2";
import { useGasGuard } from "@/hooks/useGasGuard";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import { ExecutionMonitor, GuardStatus, GuardConfig } from "./ExecutionMonitor";

type TransactionType = "swap" | "deploy" | "mint";

export function GasGuardPanel() {
  const { address, connected, signer } = useWallet();
  const { data: gasData, isLoading: gasLoading } = useGasPrice();
  const { getPrice } = useFTSOv2();
  const { scheduleExecution, getTransactionStatus, loading: guardLoading } = useGasGuard();

  const [txType, setTxType] = useState<TransactionType>("swap");
  const [status, setStatus] = useState<GuardStatus>("idle");
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [revertReason, setRevertReason] = useState<string | undefined>(undefined);
  const [config, setConfig] = useState<GuardConfig>({
    maxGasPrice: 22,
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

  const handleActivate = async () => {
    if (!connected || !address || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    setStatus("waiting");
    setRevertReason(undefined);

    try {
      // Check for auth token
      let token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please sign the message to verify ownership",
        });

        const message = "Login to GasGuard";
        const signature = await signer.signMessage(message);

        const loginRes = await authApi.login(address, signature);
        if (loginRes.success) {
          token = loginRes.data.token;
          localStorage.setItem('token', token);
          toast({ title: "Authenticated", description: "Login successful" });
        } else {
          throw new Error("Login failed");
        }
      }

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
      const scheduleExecutionWithRetry = async (retry = false): Promise<any> => {
        try {
          return await scheduleExecution(
            {
              target: targetAddress,
              data: transactionData,
              value: value,
              type: txType.toUpperCase(),
            },
            {
              maxGasPrice: config.maxGasPrice, // Send in Gwei
              minFlrPrice: config.minFlrPrice, // Send in USD
              maxSlippage: config.slippage,
              deadline: deadlineTimestamp,
            },
            address
          );
        } catch (error: any) {
          // If 401 Unauthorized and haven't retried yet
          if (!retry && (error.message?.includes("401") || error.message?.includes("Unauthorized"))) {
            console.log("Token expired, re-authenticating...");
            localStorage.removeItem("token");

            // Re-authenticate
            const message = "Login to GasGuard";
            const signature = await signer!.signMessage(message);
            const loginRes = await authApi.login(address!, signature);

            if (loginRes.success) {
              localStorage.setItem("token", loginRes.data.token);
              // Retry execution
              return scheduleExecutionWithRetry(true);
            }
          }
          throw error;
        }
      };

      const result = await scheduleExecutionWithRetry();

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
      setRevertReason(error.message || "Activation Failed");
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate GasGuard protection",
        variant: "destructive",
      });
    }
  };

  // Poll for status updates
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (executionId && (status === "waiting" || status === "executing")) {
      const checkStatus = async () => {
        try {
          const txStatus = await getTransactionStatus(executionId);

          if (txStatus.status === "COMPLETED") {
            setStatus("completed");
          } else if (txStatus.status === "FAILED") {
            setStatus("failed");
            setRevertReason(txStatus.error || "Execution Reverted on-chain");
          } else if (txStatus.status === "SCHEDULED" || txStatus.status === "MONITORING") {
            // Keep waiting
            if (status !== "waiting" && status !== "executing") {
              setStatus("waiting");
            }
          }
        } catch (error) {
          console.error("Error polling status:", error);
        }
      };

      checkStatus(); // Initial check
      interval = setInterval(checkStatus, 5000); // Poll every 5s
    }
    return () => clearInterval(interval);
  }, [executionId, status, getTransactionStatus]);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start h-full">
      {/* Configuration Panel */}
      <Card variant="glass" className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary shrink-0">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">GasGuard Configuration</CardTitle>
              <CardDescription>Set your protection parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 flex-1">
          {/* Transaction Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground block">
              Transaction Type
            </label>
            <div className="flex bg-muted/30 p-1 rounded-lg gap-1">
              {(["swap", "deploy", "mint"] as TransactionType[]).map((type) => (
                <Button
                  key={type}
                  variant={txType === type ? "default" : "ghost"}
                  onClick={() => setTxType(type)}
                  className={`flex-1 capitalize text-sm h-9 ${txType === type ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Max Gas Price */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Max Gas Price
              </label>
              <span className="text-base font-bold font-mono text-primary">{config.maxGasPrice} gwei</span>
            </div>
            <Slider
              value={[config.maxGasPrice]}
              onValueChange={([value]) => setConfig({ ...config, maxGasPrice: value })}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>1 gwei</span>
              <span>100 gwei</span>
            </div>
          </div>

          {/* Min FLR Price */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Min FLR Price (FTSOv2)
              </label>
              <span className="text-base font-bold font-mono text-primary">${config.minFlrPrice.toFixed(4)}</span>
            </div>
            <Slider
              value={[config.minFlrPrice * 1000]}
              onValueChange={([value]) => setConfig({ ...config, minFlrPrice: value / 1000 })}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>$0.001</span>
              <span>$0.100</span>
            </div>
          </div>

          {/* Slippage */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">Slippage Tolerance</label>
              <span className="text-base font-bold font-mono text-primary">{config.slippage}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0.1, 0.5, 1.0, 2.0].map((val) => (
                <Button
                  key={val}
                  variant={config.slippage === val ? "default" : "outline"}
                  size="sm"
                  onClick={() => setConfig({ ...config, slippage: val })}
                  className="font-mono text-xs"
                >
                  {val}%
                </Button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Deadline
              </label>
              <span className="text-base font-bold font-mono text-primary">{config.deadline} minutes</span>
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
            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all mt-6"
            onClick={handleActivate}
            disabled={status === "waiting" || status === "executing" || !connected || guardLoading}
          >
            {guardLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Initializing...
              </>
            ) : status === "waiting" || status === "executing" ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Protection Active
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Activate GasGuard Protection
              </>
            )}
          </Button>

          {!connected && (
            <div className="flex justify-center mt-2">
              <span className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                Wallet disconnected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Monitor */}
      <div className="h-full">
        <ExecutionMonitor
          status={status}
          executionId={executionId}
          config={config}
          currentGas={currentGas}
          currentFlrPrice={currentFlrPrice}
          gasLoading={gasLoading}
          revertReason={revertReason}
        />
      </div>
    </div>
  );
}
