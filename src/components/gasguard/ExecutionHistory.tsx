import React from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Execution } from "@/hooks/useExecutions";

interface ExecutionHistoryProps {
    executions: Execution[];
    loading: boolean;
    onRefresh: () => void;
    onSelect?: (execution: Execution) => void;
    isAuthenticated?: boolean;
}

export function ExecutionHistory({ executions, loading, onRefresh, onSelect, isAuthenticated = false }: ExecutionHistoryProps) {

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return <Badge variant="success" className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Success</Badge>;
            case "FAILED":
                return <Badge variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">Failed</Badge>;
            case "SCHEDULED":
                return <Badge variant="outline" className="border-blue-500 text-blue-500">Scheduled</Badge>;
            case "MONITORING":
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 animate-pulse">Running</Badge>;
            case "REFUNDED":
                return <Badge variant="outline" className="text-gray-400">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
                <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="rounded-md border border-border/50 bg-card/50 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Saved</TableHead>
                            <TableHead className="hidden md:table-cell">Time</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isAuthenticated ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Please activate GasGuard or sign in to view execution history.
                                </TableCell>
                            </TableRow>
                        ) : executions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {loading ? "Loading executions..." : "No executions found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            executions.map((exec) => (
                                <TableRow key={exec.id} className="cursor-pointer hover:bg-muted/50 border-border/50" onClick={() => onSelect && onSelect(exec)}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="uppercase text-xs font-bold text-muted-foreground">{exec.transactionType}</span>
                                            <span className="text-xs text-muted-foreground font-mono truncate w-16" title={exec.executionId}>
                                                #{exec.executionId.slice(0, 6)}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(exec.status)}</TableCell>
                                    <TableCell>
                                        {exec.savedUsd ? (
                                            <span className="text-green-500 font-mono font-bold">+${exec.savedUsd.toFixed(4)}</span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                        {format(new Date(exec.scheduledAt), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {exec.txHash ? (
                                            <a
                                                href={`https://coston2-explorer.flare.network/tx/${exec.txHash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-full"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="h-4 w-4 text-primary" />
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground px-2">-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
