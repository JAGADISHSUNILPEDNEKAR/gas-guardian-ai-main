import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Shield, Clock, Zap, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import { useWallet } from "@/hooks/useWallet";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  actions?: {
    label: string;
    variant: "default" | "success" | "warning" | "secondary";
    icon: typeof Zap;
  }[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "👋 Welcome to Mempool Mentor! I'm your AI-powered gas optimization copilot for Flare Network.\n\nI can help you:\n• Analyze the best time to execute transactions\n• Calculate gas costs in real FLR and USD\n• Set up GasGuard protection for your swaps\n• Compare costs across different chains\n\nWhat would you like to do today?",
    timestamp: new Date(),
  },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, loading: isLoading, error } = useChat();
  const { address, connected } = useWallet();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");

    try {
      // Generate JWT token from wallet address (simple approach)
      let token = localStorage.getItem('token');
      if (!token && address) {
        // Simple token generation (in production, use proper JWT)
        token = btoa(JSON.stringify({ walletAddress: address, timestamp: Date.now() }));
        localStorage.setItem('token', token);
      }

      const response = await sendMessage(userInput, address || undefined);
      
      // Format response
      let content = response.reasoning || '';
      if (response.currentConditions) {
        content = `**Current Gas:** ${response.currentConditions.gasPrice} gwei (~$${response.currentConditions.gasPriceUSD?.toFixed(2)})\n**FLR Price:** $${response.currentConditions.flrPrice?.toFixed(4)} (via FTSOv2)\n**Network Load:** ${response.currentConditions.congestion}%\n\n📊 **Recommendation: ${response.recommendation}**\n\n${response.reasoning}`;
        
        if (response.prediction) {
          content += `\n\n**Prediction:**\n- Target Gas: ${response.prediction.targetGas} gwei\n- Target Time: ${response.prediction.targetTime}\n- Confidence: ${response.prediction.confidence}%`;
        }
        
        if (response.savings) {
          content += `\n\n💰 **Potential Savings:** $${response.savings.amount?.toFixed(2)} (${response.savings.percentage?.toFixed(1)}%)`;
        }
      }

      const actions = response.actions?.map((action: any) => ({
        label: action.label,
        variant: action.type === 'EXECUTE_NOW' ? 'warning' : action.type === 'SCHEDULE' ? 'default' : 'secondary',
        icon: action.type === 'EXECUTE_NOW' ? Zap : action.type === 'SCHEDULE' ? Shield : Clock,
      })) || [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${err.message || 'Failed to get AI response. Please make sure:\n1. Backend server is running\n2. OpenAI API key is configured\n3. Wallet is connected'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const quickPrompts = [
    "Should I swap 1000 FLR to USDC now?",
    "What's the cheapest time to deploy a contract today?",
    "Compare swap costs across chains",
    "Show me my gas savings history",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <Card variant="glass" className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary glow-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">AI Copilot</CardTitle>
                <p className="text-sm text-muted-foreground">Powered by FTSOv2 & FDC</p>
              </div>
            </div>
            <Badge variant="glow">Online</Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.role === "user" && "flex-row-reverse"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-2 max-w-[80%]",
                  message.role === "user" && "items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.actions && (
                  <div className="flex flex-wrap gap-2">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant}
                        size="sm"
                        className="gap-2"
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-slide-up">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="border-t border-border/50 p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about gas optimization..."
              className="flex-1 rounded-lg border border-border bg-muted px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="px-6">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
