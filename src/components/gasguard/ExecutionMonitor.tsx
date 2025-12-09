import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle2, AlertTriangle, Fuel, DollarSign, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GuardStatus = "idle" | "waiting" | "executing" | "completed" | "failed" | "refunded" | "monitoring" | "scheduled";

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
    // Historical data
    actualGasPrice?: number;
    actualFlrPrice?: number;
    savedUsd?: number;
    txHash?: string;
    mode?: 'live' | 'historical';
    onClose?: () => void;
}

export function ExecutionMonitor({
    status: propStatus,
    executionId,
    config,
    currentGas,
    currentFlrPrice,
    gasLoading,
    revertReason,
    actualGasPrice,
    actualFlrPrice,
    savedUsd,
    txHash,
    mode = 'live',
    onClose
}: ExecutionMonitorProps) {

    // Map backend statuses to UI statuses
    let status: GuardStatus = propStatus;
    if (propStatus === 'monitoring' || propStatus === 'scheduled') status = 'waiting';
    if (propStatus === 'refunded') status = 'failed';

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
        monitoring: {
            icon: Loader2,
            label: "Monitoring",
            color: "text-warning",
            bg: "bg-warning/10 animate-pulse"
        },
        scheduled: {
            icon: Loader2,
            label: "Scheduled",
            color: "text-blue-500",
            bg: "bg-blue-500/10"
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
            label: mode === 'historical' ? "Failed" : "Reverted",
            color: "text-destructive",
            bg: "bg-destructive/20"
        },
        refunded: {
            icon: XCircle,
            label: "Refunded",
            color: "text-muted-foreground",
            bg: "bg-muted/20"
        }
    };

    const currentStatus = statusConfig[status] || statusConfig.idle;
    const StatusIcon = currentStatus.icon;

    // Use actual values for historical, current values for live
    const displayGas = mode === 'historical' && actualGasPrice ? actualGasPrice : currentGas;
    const displayFlr = mode === 'historical' && actualFlrPrice ? actualFlrPrice : currentFlrPrice;

    // Calculate savings
    const savingsDisplay = savedUsd
        ? savedUsd.toFixed(4)
        : (currentGas > config.maxGasPrice && status !== 'idle')
            ? ((currentGas - config.maxGasPrice) * 0.15).toFixed(2) // Estimate
            : "0.00";

    return (
        <Card variant={status === "completed" ? "glow" : "glass"} className="h-full flex flex-col relative transition-all duration-300">
            {mode === 'historical' && onClose && (
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs bg-muted/50 px-2 py-1 rounded">
                        Close Details
                    </button>
                </div>
            )}
            <CardHeader>
                <CardTitle>Execution Monitor</CardTitle>
                <CardDescription>
                    {mode === 'historical' ? "Historical Execution Details" : "Real-time status of your protected transaction"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 flex flex-col">

                {/* BIG STATUS INDICATOR */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
                    <div
                        className={cn(
                            "flex h-24 w-24 items-center justify-center rounded-full mb-4 transition-all duration-500",
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

                    {(status === "failed" || status === "refunded") && revertReason && (
                        <p className="mt-4 text-xs text-destructive bg-destructive/10 px-3 py-1 rounded border border-destructive/20 max-w-[80%] text-center break-words">
                            {revertReason}
                        </p>
                    )}

                    {status === "completed" && txHash && (
                        <a href={`https://coston2-explorer.flare.network/tx/${txHash}`} target="_blank" rel="noreferrer" className="mt-2 text-xs text-blue-500 hover:underline flex items-center">
                            View Transaction <ArrowRight className="h-3 w-3 ml-1" />
                        </a>
                    )}

                    {status === "idle" && (
                        <p className="mt-4 text-sm text-center text-muted-foreground max-w-[80%]">
                            Configure parameters to start GasGuard protection
                        </p>
                    )}
                </div>

                {/* CONDITION STATUS */}
                <div className="space-y-4">
                    <h4 className="font-medium text-muted-foreground uppercase tracking-wider text-xs">Condition Status</h4>

                    {/* GAS PRICE ROW */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
                        <div className="flex items-center gap-3">
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Gas Price</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {gasLoading && mode === 'live' ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <>
                                    <div className="text-right">
                                        <span className={cn(
                                            "text-sm font-bold font-mono block",
                                            displayGas <= config.maxGasPrice ? "text-success" : "text-destructive"
                                        )}>
                                            {displayGas.toFixed(0)} <span className="text-muted-foreground font-normal">/ {config.maxGasPrice} gwei</span>
                                        </span>
                                    </div>
                                    {displayGas <= config.maxGasPrice ? (
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
                            <span className="text-sm font-medium">FLR Price</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <span className={cn(
                                    "text-sm font-bold font-mono block",
                                    displayFlr >= config.minFlrPrice ? "text-success" : "text-destructive"
                                )}>
                                    ${displayFlr.toFixed(4)} <span className="text-muted-foreground font-normal">/ ${config.minFlrPrice.toFixed(4)}</span>
                                </span>
                            </div>
                            {displayFlr >= config.minFlrPrice ? (
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
                            <span className="text-sm font-medium text-success">
                                {status === 'completed' ? 'Total Savings' : 'Estimated Savings'}
                            </span>
                            <span className="text-xl font-bold text-success">${savingsDisplay}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Compared to execution at peak market conditions</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
