import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  Settings,
  IndianRupee,
  FileText,
  MessageCircle,
  Key,
  Menu,
  X,
  Zap,
  Activity,
} from "lucide-react";
import AdminApiKeysManager from "@/components/AdminApiKeysManager";
import AdminUserManagement from "@/components/AdminUserManagement";
import AdminPaymentDashboard from "@/components/AdminPaymentDashboard";

type AdminSection = "dashboard" | "users" | "payments" | "config" | "api-keys";

const SIDEBAR_ITEMS: { id: AdminSection; label: string; icon: any; emoji: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, emoji: "📊" },
  { id: "users", label: "User Management", icon: Users, emoji: "👥" },
  { id: "payments", label: "Payments", icon: CreditCard, emoji: "💳" },
  { id: "config", label: "Payment & Config", icon: Settings, emoji: "⚙️" },
  { id: "api-keys", label: "API Keys", icon: Key, emoji: "🔑" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({ total: 0, today: 0, week: 0, month: 0 });
  const [paidStats, setPaidStats] = useState({ total: 0, revenue: 0, today: 0, todayRevenue: 0, pending: 0 });
  const [userStats, setUserStats] = useState({ totalUsers: 0, totalUserAnalyses: 0, premiumAnalyses: 0 });
  const [recentUserAnalyses, setRecentUserAnalyses] = useState<any[]>([]);

  const [config, setConfig] = useState<Record<string, string>>({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/bosspage-login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/bosspage-login");
      return;
    }

    await Promise.all([loadStats(), loadPaidStats(), loadUserStats(), loadConfig()]);
    setLoading(false);
  };

  const loadStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [total, today, week, month] = await Promise.all([
      supabase.from("usage_logs").select("id", { count: "exact", head: true }),
      supabase.from("usage_logs").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("usage_logs").select("id", { count: "exact", head: true }).gte("created_at", weekStart),
      supabase.from("usage_logs").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
    ]);

    setStats({
      total: total.count || 0,
      today: today.count || 0,
      week: week.count || 0,
      month: month.count || 0,
    });
  };

  const loadUserStats = async () => {
    const [userAnalyses, recentUA] = await Promise.all([
      supabase.from("user_analyses").select("id, user_id, analysis_data, viral_score", { count: "exact" }),
      supabase
        .from("user_analyses")
        .select("id, reel_url, viral_score, created_at, analysis_data")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const allUA = userAnalyses.data || [];
    const premiumCount = allUA.filter((a: any) => a.analysis_data?.premiumInsights).length;
    const uniqueUsers = new Set(allUA.map((a: any) => a.user_id)).size;

    setUserStats({
      totalUsers: uniqueUsers || userAnalyses.count || 0,
      totalUserAnalyses: userAnalyses.count || 0,
      premiumAnalyses: premiumCount,
    });

    setRecentUserAnalyses(recentUA.data || []);
  };

  const loadPaidStats = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [allPaid, todayPaid, pending] = await Promise.all([
      supabase.from("paid_reports" as any).select("amount, status").in("status", ["paid", "completed"]),
      supabase
        .from("paid_reports" as any)
        .select("amount, status")
        .in("status", ["paid", "completed"])
        .gte("created_at", todayStart),
      supabase.from("paid_reports" as any).select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const allData = (allPaid.data || []) as any[];
    const todayData = (todayPaid.data || []) as any[];

    setPaidStats({
      total: allData.length,
      revenue: allData.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
      today: todayData.length,
      todayRevenue: todayData.reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0),
      pending: pending.count || 0,
    });
  };

  const loadConfig = async () => {
    const { data } = await supabase.from("site_config" as any).select("config_key, config_value");
    if (data) {
      const c: Record<string, string> = {};
      for (const row of data as any[]) c[row.config_key] = row.config_value;
      setConfig(c);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      for (const [key, value] of Object.entries(config)) {
        const { data: existing } = await supabase.from("site_config" as any).select("id").eq("config_key", key).single();
        if (existing) {
          await supabase
            .from("site_config" as any)
            .update({ config_value: value, updated_at: new Date().toISOString() })
            .eq("config_key", key);
        } else {
          await supabase.from("site_config" as any).insert({ config_key: key, config_value: value } as any);
        }
      }
      toast.success("Configuration saved!");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCleanup = async () => {
    setCleaningUp(true);
    try {
      const { data, error } = await supabase.functions.invoke("cleanup-old-data");
      if (error) throw error;
      toast.success(
        `Cleanup done! Deleted: ${data.rate_limits_deleted} rate limits, ${data.usage_logs_deleted} usage logs, ${data.traffic_sessions_deleted} traffic sessions, ${data.api_usage_logs_deleted} API logs`
      );
    } catch (err: any) {
      toast.error("Cleanup failed: " + (err.message || "Unknown error"));
    } finally {
      setCleaningUp(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/bosspage-login");
  };

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const statCards = [
    { label: "Total Analyses", value: stats.total, icon: BarChart3, color: "text-primary" },
    { label: "Today", value: stats.today, icon: TrendingUp, color: "text-[hsl(var(--viral-high))]" },
    { label: "This Week", value: stats.week, icon: Calendar, color: "text-secondary" },
    { label: "This Month", value: stats.month, icon: Users, color: "text-accent" },
  ];

  const paidStatCards = [
    { label: "Reports Sold", value: paidStats.total, icon: FileText, color: "text-primary" },
    { label: "Total Revenue", value: `₹${paidStats.revenue}`, icon: IndianRupee, color: "text-[hsl(var(--viral-high))]" },
    { label: "Today Revenue", value: `₹${paidStats.todayRevenue}`, icon: TrendingUp, color: "text-accent" },
    { label: "Pending", value: paidStats.pending, icon: CreditCard, color: "text-[hsl(var(--viral-mid))]" },
  ];

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">📊 Free Analysis Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color} flex-shrink-0`} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">👤 Registered Users & Premium</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Registered Users</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{userStats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">User Analyses</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{userStats.totalUserAnalyses}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">With Premium Data</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{userStats.premiumAnalyses}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">💰 Paid Reports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {paidStatCards.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <s.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color} flex-shrink-0`} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</span>
                </div>
                <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">Analysis Mode</span>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              config.analysis_pricing_mode === "paid"
                ? "bg-primary/10 text-primary"
                : "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]"
            }`}
          >
            {config.analysis_pricing_mode === "paid" ? `PAID — ₹${config.analysis_price || "10"}` : "FREE"}
          </span>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1">Core analytics and payment configuration is active.</p>
      </div>

      <div className="p-3 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">🧹 Database Cleanup</span>
            <p className="text-[9px] text-muted-foreground mt-0.5">Delete old logs (30d), rate limits (7d), traffic sessions (30d)</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleCleanup} disabled={cleaningUp} className="h-8 text-xs">
            {cleaningUp ? "Cleaning..." : "Clean Now"}
          </Button>
        </div>
      </div>

      {recentUserAnalyses.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" /> Recent User Analyses (Logged-in)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1.5">
              {recentUserAnalyses.map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-[10px] sm:text-xs gap-2">
                  <span className="text-foreground truncate min-w-0 flex-1">{a.reel_url}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-primary">{a.viral_score || 0}</span>
                    {a.analysis_data?.premiumInsights && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-primary/10 text-primary font-medium">Premium</span>
                    )}
                    <span className="text-muted-foreground text-[9px]">{new Date(a.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderConfig = () => (
    <Card className="border-border bg-card">
      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          Payment & Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
        <div className="p-3 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-primary" />
                Analysis Pricing Control
              </Label>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                {config.analysis_pricing_mode === "paid"
                  ? "PAID MODE — Users must pay to analyze"
                  : "FREE MODE — Analysis is free for users"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">{config.analysis_pricing_mode === "paid" ? "Paid" : "Free"}</span>
              <Switch
                checked={config.analysis_pricing_mode === "paid"}
                onCheckedChange={(checked) => updateConfig("analysis_pricing_mode", checked ? "paid" : "free")}
              />
            </div>
          </div>
          {config.analysis_pricing_mode === "paid" && (
            <div className="space-y-1.5">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Analysis Price (₹)</Label>
              <Input
                type="number"
                value={config.analysis_price || "10"}
                onChange={(e) => updateConfig("analysis_price", e.target.value)}
                className="bg-background border-border h-8 sm:h-10 text-xs sm:text-sm"
                min="1"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[10px] sm:text-xs text-muted-foreground">Report Price (₹)</Label>
            <Input
              type="number"
              value={config.report_price || "29"}
              onChange={(e) => updateConfig("report_price", e.target.value)}
              className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] sm:text-xs text-muted-foreground">Gateway</Label>
            <select
              value={config.payment_gateway || "razorpay"}
              onChange={(e) => updateConfig("payment_gateway", e.target.value)}
              className="w-full h-8 sm:h-10 px-2 sm:px-3 rounded-md bg-muted/50 border border-border text-foreground text-xs sm:text-sm"
            >
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground">Razorpay Key ID</Label>
          <Input
            value={config.razorpay_key_id || ""}
            onChange={(e) => updateConfig("razorpay_key_id", e.target.value)}
            placeholder="rzp_live_..."
            className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground">Razorpay Key Secret</Label>
          <Input
            type="password"
            value={config.razorpay_key_secret || ""}
            onChange={(e) => updateConfig("razorpay_key_secret", e.target.value)}
            placeholder="••••••••"
            className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground">Stripe Key</Label>
          <Input
            type="password"
            value={config.stripe_key || ""}
            onChange={(e) => updateConfig("stripe_key", e.target.value)}
            placeholder="sk_live_..."
            className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> WhatsApp Number
          </Label>
          <Input
            value={config.whatsapp_number || ""}
            onChange={(e) => updateConfig("whatsapp_number", e.target.value)}
            placeholder="919876543210"
            className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <FileText className="w-3 h-3" /> Example PDF URL (Sample Report)
          </Label>
          <Input
            value={config.example_pdf_url || ""}
            onChange={(e) => updateConfig("example_pdf_url", e.target.value)}
            placeholder="https://drive.google.com/file/d/.../preview"
            className="bg-muted/50 border-border h-8 sm:h-10 text-xs sm:text-sm"
          />
        </div>

        <Button onClick={saveConfig} disabled={savingConfig} className="w-full gradient-primary-bg text-primary-foreground h-9 sm:h-10 text-xs sm:text-sm">
          {savingConfig ? "Saving..." : "Save Configuration"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return <AdminUserManagement />;
      case "payments":
        return <AdminPaymentDashboard />;
      case "config":
        return renderConfig();
      case "api-keys":
        return <AdminApiKeysManager />;
      default:
        return renderDashboard();
    }
  };

  const activeItem = SIDEBAR_ITEMS.find((i) => i.id === activeSection);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-56 border-r border-border bg-card/50 backdrop-blur-sm fixed inset-y-0 left-0 z-40">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
              <p className="text-[9px] text-muted-foreground">Control Center</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                activeSection === item.id
                  ? "bg-primary/10 text-primary font-medium border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-xs h-8">
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-[75vw] max-w-72 bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200 safe-area-inset">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground">Admin Panel</h1>
                  <p className="text-[9px] text-muted-foreground">Control Center</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="h-9 w-9 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto overscroll-contain">
              {SIDEBAR_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all active:scale-[0.97] ${
                    activeSection === item.id
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-xs h-10">
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-56 min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="lg:hidden h-9 w-9 p-0 flex-shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                {activeItem && <activeItem.icon className="w-4 h-4 text-primary flex-shrink-0" />}
                <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">{activeItem?.label || "Dashboard"}</h2>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="lg:hidden text-xs h-8 px-2 flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>

        <div className="p-3 sm:p-6 max-w-5xl pb-20 sm:pb-6 overflow-x-hidden">{renderActiveSection()}</div>
      </main>
    </div>
  );
};

export default AdminDashboard;
