import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Shield,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Zap,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/utils/web3";

function WalletStatus() {
  const { address, chainId, connected, connectWallet, loading } = useWallet();
  const isCoston2 = chainId === 114;

  if (connected && address) {
    return (
      <>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-success">Wallet Connected</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-mono">{formatAddress(address, 4, 4)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isCoston2 ? "Coston2 Testnet" : `Chain ${chainId}`}
          </span>
          <Zap className={cn("h-3 w-3", isCoston2 ? "text-primary" : "text-warning")} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-warning" />
        <span className="text-xs font-medium text-warning">Not Connected</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-2"
        onClick={connectWallet}
        disabled={loading}
      >
        <Wallet className="h-3 w-3 mr-2" />
        {loading ? "Connecting..." : "Connect"}
      </Button>
    </>
  );
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MessageSquare, label: "AI Chat", path: "/chat" },
  { icon: Shield, label: "GasGuard", path: "/gasguard" },
  { icon: BarChart3, label: "Compare Chains", path: "/compare" },
  { icon: TrendingUp, label: "Analytics", path: "/analytics" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary">
            <Fuel className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold gradient-text"> </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary border border-primary/30 glow-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-2"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Wallet Status Card */}
      {!collapsed && (
        <div className="m-3 rounded-xl glass p-4">
          <WalletStatus />
        </div>
      )}

      {/* Collapse Button */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
