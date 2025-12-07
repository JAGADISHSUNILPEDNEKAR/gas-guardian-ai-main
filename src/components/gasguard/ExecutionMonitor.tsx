import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, AlertTriangle, Fuel, DollarSign, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuardStatus = "idle" | "waiting" | "executing" | "completed" | "failed";

export interface GuardConfig {
    maxGasPrice: number;
    minFlrPrice: number;
    slippage: number;
    deadline: number;
}

interface ExecutionMonitorProps {
    status: GuardStatus;
    executionId: string | null;
    config: GuardConfig;
    currentGas: number;
    currentFlrPrice: number;
    gasLoading: boolean;
    revertReason?: string;
}

export function ExecutionMonitor({
    status,
    executionId,
    config,
    currentGas,
    currentFlrPrice,
    gasLoading,
    revertReason
}: ExecutionMonitorProps) {

    const statusConfig = {
        idle: {
            icon: Shield,
            label: "Ready",
            color: "text-muted-foreground",
            bg: "bg-muted"
        },
        waiting: {
            icon: Loader2,
            label: "Monitoring",
            color: "text-warning",
            bg: "bg-warning/10 animate-pulse"
        },
        executing: {
            icon: Loader2,
            label: "Executing",
            color: "text-primary",
            bg: "bg-primary/20 animate-pulse"
        },
        completed: {
            icon: CheckCircle2,
            label: "Success",
            color: "text-success",
            bg: "bg-success/20 glow-success"
        },
        failed: {
            icon: AlertTriangle,
            label: "Reverted",
            color: "text-destructive",
            bg: "bg-destructive/20"
        },
    };

    const currentStatus = statusConfig[status];
    const StatusIcon = currentStatus.icon;

    // Calculate savings (mock logic for demo if not computed)
    // Assuming standard transaction cost ~ 21000 gas
    // Savings = (Current - Max) * 21000 * 1e-9 (gwei to eth) * ETH Price (approx)
    // Just simplified for UI demo as requested
    const estimatedSavings = (currentGas > config.maxGasPrice)
        ? ((currentGas - config.maxGasPrice) * 0.15).toFixed(2) // Mock formula
        : "0.00";

    return (
        <Card variant={status === "completed" ? "glow" : "glass"} className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Execution Monitor</CardTitle>
                <CardDescription>Real-time status of your protected transaction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">

                {/* BIG STATUS INDICATOR */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[180px]">
                    <div
                        className={cn(
                            "flex h-24 w-24 items-center justify-center rounded-full mb-6 transition-all duration-500",
                            currentStatus.bg
                        )}
                    >
                        <StatusIcon
                            className={cn(
                                "h-10 w-10 transition-all",
                                currentStatus.color,
                                (status === "waiting" || status === "executing") && "animate-spin"
                            )}
                        />
                    </div>

                    <Badge
                        variant={
                            status === "completed" ? "success" : status === "failed" ? "destructive" : "outline"
                        }
                        className="text-lg px-6 py-1.5 h-auto rounded-full font-semibold uppercase tracking-wider"
                    >
                        {currentStatus.label}
                    </Badge>

                    {status === "failed" && revertReason && (
                        <p className="mt-4 text-xs text-destructive bg-destructive/10 px-3 py-1 rounded border border-destructive/20 max-w-[80%] text-center">
                            {revertReason}
                        </p>
                    )}

                    {status === "idle" && (
                        <p className="mt-4 text-sm text-center text-muted-foreground max-w-[80%]">
                            Configure parameters to start GasGuard protection
                        </p>
                    )}
                </div>

                {/* CONDITION STATUS */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">Condition Status</h4>

                    {/* GAS PRICE ROW */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="flex items-center gap-3">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Gas Price</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {gasLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-sm font-bold font-mono block",
                                            currentGas <= config.maxGasPrice ? "text-success" : "text-destructive"
                                        )}>
                                            {currentGas.toFixed(0)} <span className="text-muted-foreground font-normal">/ {config.maxGasPrice} gwei</span>
                                        </span>
                                    </div>
                                    {currentGas <= config.maxGasPrice ? (
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-destructive" />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* FLR PRICE ROW */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">FLR Price (FTSOv2)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className={cn(
                                    "text-sm font-bold font-mono block",
                                    currentFlrPrice >= config.minFlrPrice ? "text-success" : "text-destructive"
                                )}>
                                    ${currentFlrPrice.toFixed(4)} <span className="text-muted-foreground font-normal">/ ${config.minFlrPrice.toFixed(4)}</span>
                                </span>
                            </div>
                            {currentFlrPrice >= config.minFlrPrice ? (
                                <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            )}
                        </div>
                    </div>

                    {executionId && (
                        <div className="flex items-center justify-between px-2 pt-1">
                            <span className="text-xs text-muted-foreground">ID: <span className="font-mono">{executionId.slice(0, 8)}...</span></span>
                        </div>
                    )}
                </div>

                {/* SAVINGS CARD */}
                {(status !== "idle" && status !== "failed") && (
                    <div className="bg-success/5 border border-success/20 rounded-xl p-4 mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-success">Estimated Savings</span>
                            <span className="text-xl font-bold text-success">${estimatedSavings}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Compared to executing at peak gas prices</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
