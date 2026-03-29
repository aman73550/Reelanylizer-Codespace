import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Loader, AlertCircle, Zap, Database, Settings, BarChart3 } from "lucide-react";

interface Message {
  role: "admin" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AdminAiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 Welcome! I'm your Super Admin AI Assistant. I have full access to the system. Ask me about statistics, user management, configuration, revenue, or any system diagnostics.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSystemHealth();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadSystemHealth = async () => {
    try {
      const { data: sessionCount } = await supabase
        .from("traffic_sessions")
        .select("id", { count: "exact", head: true });

      const { data: analysesCount } = await supabase
        .from("viral_patterns")
        .select("id", { count: "exact", head: true });

      const { data: usersCount } = await supabase
        .from("user_analyses")
        .select("id", { count: "exact", head: true });

      setSystemHealth({
        sessions: sessionCount?.count || 0,
        analyses: analysesCount?.count || 0,
        activeUsers: usersCount?.count || 0,
      });
    } catch (error) {
      console.error("Error loading system health:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "admin",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Unauthorized");
        return;
      }

      const { data, error } = await supabase.functions.invoke("admin-ai-chat", {
        body: {
          query: input,
          userId: user.id,
        },
      });

      if (error) {
        toast.error("Failed to get response");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Error processing request. Please try again.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.response || "No response received",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* System Health Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Active Sessions</p>
                <p className="text-2xl font-bold text-primary">{systemHealth?.sessions.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Analyses</p>
                <p className="text-2xl font-bold text-accent">{systemHealth?.analyses.toLocaleString()}</p>
              </div>
              <Database className="w-8 h-8 text-accent/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Unique Users</p>
                <p className="text-2xl font-bold text-green-500">{systemHealth?.activeUsers.toLocaleString()}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="border-border bg-card flex flex-col h-[600px]">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            AI System Assistant
          </CardTitle>
        </CardHeader>

        {/* Messages Container */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-muted/20"
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm ${
                  msg.role === "admin"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-background border border-border text-foreground rounded-bl-none"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-background border border-border text-foreground rounded-lg rounded-bl-none px-4 py-3 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-xs sm:text-sm">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-3 sm:p-4 bg-card space-y-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask me anything... (stats, users, config, etc.)"
              disabled={loading}
              className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm"
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              size="sm"
              className="gradient-primary-bg text-primary-foreground px-2 sm:px-4 h-8 sm:h-10"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            I have full access to user management, revenue reporting, configuration, and system diagnostics
          </p>
        </div>
      </Card>
    </div>
  );
}
