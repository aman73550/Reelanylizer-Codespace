import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  IndianRupee, TrendingUp, TrendingDown, Loader2, RefreshCw,
  PieChart, BarChart3, Users, Percent, ArrowUpRight, ArrowDownRight,
  Server, Globe, Cpu, Settings, Save, Plus, Trash2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";

interface CampaignProfit {
  campaign_name: string;
  creator_name: string;
  total_revenue: number;
  commission_percent: number;
  commission_amount: number;
  net_profit: number;
  status: string;
}

interface OperationalCost {
  name: string;
  monthly_cost: number;
}

interface ApiUsageStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  todayCalls: number;
  todayCost: number;
  avgCostPerCall: number;
  monthlyCost: number;
}

const DEFAULT_COSTS: OperationalCost[] = [
  { name: "Hosting (Vercel/Lovable)", monthly_cost: 0 },
  { name: "Domain", monthly_cost: 0 },
  { name: "Other Services", monthly_cost: 0 },
];

const AdminProfitAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [campaignProfits, setCampaignProfits] = useState<CampaignProfit[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0, totalCommissions: 0, netProfit: 0, profitMargin: 0,
    activeCampaigns: 0, todayRevenue: 0, todayCommissions: 0, todayProfit: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [apiUsage, setApiUsage] = useState<ApiUsageStats>({
    totalCalls: 0, totalTokens: 0, totalCost: 0,
    todayCalls: 0, todayCost: 0, avgCostPerCall: 0, monthlyCost: 0,
  });
  const [operationalCosts, setOperationalCosts] = useState<OperationalCost[]>(DEFAULT_COSTS);
  const [showCostEditor, setShowCostEditor] = useState(false);
  const [savingCosts, setSavingCosts] = useState(false);
  const [totalOperationalMonthly, setTotalOperationalMonthly] = useState(0);

  useEffect(() => {
    loadProfitData();
  }, []);

  const loadOperationalCosts = async () => {
    const { data } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "operational_costs")
      .single();
    if (data?.config_value) {
      try {
        const parsed = JSON.parse(data.config_value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOperationalCosts(parsed);
          return parsed;
        }
      } catch { /* use defaults */ }
    }
    return DEFAULT_COSTS;
  };

  const saveOperationalCosts = async () => {
    setSavingCosts(true);
    try {
      const value = JSON.stringify(operationalCosts);
      const { data: existing } = await supabase
        .from("site_config")
        .select("id")
        .eq("config_key", "operational_costs")
        .single();

      if (existing) {
        await supabase.from("site_config")
          .update({ config_value: value, updated_at: new Date().toISOString() })
          .eq("config_key", "operational_costs");
      } else {
        await supabase.from("site_config")
          .insert({ config_key: "operational_costs", config_value: value } as any);
      }
      toast.success("Operational costs saved!");
      loadProfitData();
    } catch {
      toast.error("Failed to save costs");
    } finally {
      setSavingCosts(false);
    }
  };

  const loadApiUsage = async () => {
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [allUsage, todayUsage, monthUsage] = await Promise.all([
      supabase.from("api_usage_logs").select("estimated_cost, tokens_used, is_ai_call, function_name"),
      supabase.from("api_usage_logs").select("estimated_cost, tokens_used, is_ai_call").gte("created_at", today + "T00:00:00.000Z"),
      supabase.from("api_usage_logs").select("estimated_cost, tokens_used, is_ai_call").gte("created_at", monthStart),
    ]);

    const all = (allUsage.data || []);
    const aiCalls = all.filter((l: any) => l.is_ai_call);
    const todayAi = (todayUsage.data || []).filter((l: any) => l.is_ai_call);
    const monthAi = (monthUsage.data || []).filter((l: any) => l.is_ai_call);

    const totalCost = aiCalls.reduce((s: number, l: any) => s + Number(l.estimated_cost || 0), 0);
    const totalTokens = aiCalls.reduce((s: number, l: any) => s + Number(l.tokens_used || 0), 0);
    const todayCost = todayAi.reduce((s: number, l: any) => s + Number(l.estimated_cost || 0), 0);
    const monthlyCost = monthAi.reduce((s: number, l: any) => s + Number(l.estimated_cost || 0), 0);

    return {
      totalCalls: aiCalls.length,
      totalTokens,
      totalCost: Math.round(totalCost * 1000) / 1000,
      todayCalls: todayAi.length,
      todayCost: Math.round(todayCost * 1000) / 1000,
      avgCostPerCall: aiCalls.length > 0 ? Math.round((totalCost / aiCalls.length) * 1000) / 1000 : 0,
      monthlyCost: Math.round(monthlyCost * 1000) / 1000,
    };
  };

  const loadProfitData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, paymentsRes, costs, apiStats] = await Promise.all([
        supabase.from("campaigns").select("*, creators(name)"),
        supabase.from("payments").select("amount, created_at, status").eq("status", "SUCCESS").order("created_at", { ascending: true }),
        loadOperationalCosts(),
        loadApiUsage(),
      ]);

      if (campaignsRes.error) throw campaignsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setApiUsage(apiStats);

      const allPayments = paymentsRes.data || [];
      const allCampaigns = campaignsRes.data || [];
      const totalRevenue = allPayments.reduce((s, p) => s + Number(p.amount), 0);

      const today = new Date().toISOString().split("T")[0];
      const todayPayments = allPayments.filter(p => p.created_at.startsWith(today));
      const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0);

      let totalCommissions = 0;
      let todayCommissions = 0;
      const profits: CampaignProfit[] = [];

      for (const campaign of allCampaigns) {
        const endDateTime = `${campaign.end_date}T23:59:59.999Z`;
        const campaignPayments = allPayments.filter(
          p => p.created_at >= campaign.start_date && p.created_at <= endDateTime
        );
        const campaignRevenue = campaignPayments.reduce((s, p) => s + Number(p.amount), 0);
        const commissionAmount = Math.round(campaignRevenue * (campaign.revenue_share_percent / 100) * 100) / 100;
        totalCommissions += commissionAmount;

        const todayCampaignPayments = campaignPayments.filter(p => p.created_at.startsWith(today));
        const todayCampaignRevenue = todayCampaignPayments.reduce((s, p) => s + Number(p.amount), 0);
        todayCommissions += Math.round(todayCampaignRevenue * (campaign.revenue_share_percent / 100) * 100) / 100;

        profits.push({
          campaign_name: campaign.campaign_name,
          creator_name: (campaign as any).creators?.name || "Unknown",
          total_revenue: campaignRevenue,
          commission_percent: campaign.revenue_share_percent,
          commission_amount: commissionAmount,
          net_profit: Math.round((campaignRevenue - commissionAmount) * 100) / 100,
          status: campaign.status,
        });
      }

      // Calculate operational costs impact
      const opCosts = (costs as OperationalCost[]);
      const monthlyOpCost = opCosts.reduce((s, c) => s + c.monthly_cost, 0);
      setTotalOperationalMonthly(monthlyOpCost);

      // Get months of operation (from first payment to now)
      const firstPaymentDate = allPayments.length > 0 ? new Date(allPayments[0].created_at) : new Date();
      const now = new Date();
      const monthsActive = Math.max(1,
        (now.getFullYear() - firstPaymentDate.getFullYear()) * 12 +
        (now.getMonth() - firstPaymentDate.getMonth()) + 1
      );
      const totalOpCost = monthlyOpCost * monthsActive;
      const totalApiCost = apiStats.totalCost;
      const totalDeductions = totalCommissions + totalOpCost + totalApiCost;

      const netProfit = Math.round((totalRevenue - totalDeductions) * 100) / 100;
      const todayProfit = Math.round((todayRevenue - todayCommissions - (monthlyOpCost / 30) - apiStats.todayCost) * 100) / 100;
      const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 100;

      setCampaignProfits(profits);
      setTotals({
        totalRevenue,
        totalCommissions: Math.round(totalCommissions * 100) / 100,
        netProfit,
        profitMargin,
        activeCampaigns: allCampaigns.filter(c => c.status === "active").length,
        todayRevenue,
        todayCommissions: Math.round(todayCommissions * 100) / 100,
        todayProfit,
      });

      // Monthly breakdown with all costs
      const monthMap: Record<string, { revenue: number; commissions: number; apiCost: number }> = {};
      for (const p of allPayments) {
        const month = p.created_at.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { revenue: 0, commissions: 0, apiCost: 0 };
        monthMap[month].revenue += Number(p.amount);
      }

      for (const campaign of allCampaigns) {
        const endDateTime = `${campaign.end_date}T23:59:59.999Z`;
        for (const p of allPayments) {
          if (p.created_at >= campaign.start_date && p.created_at <= endDateTime) {
            const month = p.created_at.substring(0, 7);
            if (monthMap[month]) {
              monthMap[month].commissions += Number(p.amount) * (campaign.revenue_share_percent / 100);
            }
          }
        }
      }

      const monthly = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => {
          const totalCosts = Math.round(data.commissions) + monthlyOpCost + Math.round(apiStats.monthlyCost);
          return {
            month: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
            revenue: Math.round(data.revenue),
            commissions: Math.round(data.commissions),
            opCosts: monthlyOpCost,
            apiCosts: Math.round(apiStats.monthlyCost),
            profit: Math.round(data.revenue - totalCosts),
          };
        });

      setMonthlyData(monthly);

      // Pie chart with all deductions
      setPieData([
        { name: "Net Profit", value: Math.max(0, netProfit) },
        { name: "Creator Commissions", value: Math.max(0, Math.round(totalCommissions)) },
        { name: "Operational Costs", value: Math.max(0, Math.round(totalOpCost)) },
        { name: "AI/API Costs", value: Math.max(0, Math.round(totalApiCost * 100) / 100) },
      ].filter(d => d.value > 0));

    } catch (err: any) {
      console.error("Profit analysis error:", err);
      toast.error("Failed to load profit data");
    } finally {
      setLoading(false);
    }
  };

  const addCostItem = () => {
    setOperationalCosts(prev => [...prev, { name: "", monthly_cost: 0 }]);
  };

  const removeCostItem = (idx: number) => {
    setOperationalCosts(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCostItem = (idx: number, field: keyof OperationalCost, value: string | number) => {
    setOperationalCosts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const PIE_COLORS = [
    "hsl(var(--viral-high))",
    "hsl(var(--destructive))",
    "hsl(var(--viral-mid))",
    "hsl(var(--accent))",
  ];

  const summaryCards = [
    { label: "Total Revenue", value: `₹${totals.totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary", sub: `Today: ₹${totals.todayRevenue}` },
    { label: "Creator Commissions", value: `₹${totals.totalCommissions.toLocaleString("en-IN")}`, icon: Users, color: "text-destructive", sub: `Today: ₹${totals.todayCommissions}` },
    { label: "Operational Costs", value: `₹${totalOperationalMonthly}/mo`, icon: Server, color: "text-[hsl(var(--viral-mid))]", sub: `API: ₹${apiUsage.monthlyCost}/mo` },
    { label: "Net Profit", value: `₹${totals.netProfit.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-[hsl(var(--viral-high))]", sub: `Margin: ${totals.profitMargin}%` },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Profit & Loss Analysis
        </h2>
        <Button variant="outline" size="sm" onClick={loadProfitData} className="h-7 text-[10px] sm:text-xs">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {summaryCards.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color} flex-shrink-0`} />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</span>
              </div>
              <p className="text-base sm:text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI/Gemini API Usage Section */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            AI (Gemini) API Usage & Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Total AI Calls</p>
              <p className="text-sm font-bold text-foreground">{apiUsage.totalCalls.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Total Tokens</p>
              <p className="text-sm font-bold text-foreground">{apiUsage.totalTokens.toLocaleString()}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Total API Cost</p>
              <p className="text-sm font-bold text-destructive">₹{apiUsage.totalCost}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Today's Calls</p>
              <p className="text-sm font-bold text-foreground">{apiUsage.todayCalls}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Today's Cost</p>
              <p className="text-sm font-bold text-destructive">₹{apiUsage.todayCost}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-[9px] text-muted-foreground">Avg Cost/Call</p>
              <p className="text-sm font-bold text-foreground">₹{apiUsage.avgCostPerCall}</p>
            </div>
          </div>
          <div className="mt-3 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">This Month's AI Cost</span>
              </div>
              <span className="text-sm font-bold text-destructive">₹{apiUsage.monthlyCost}</span>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              {apiUsage.totalCalls > 0
                ? `Estimated monthly: ₹${Math.round(apiUsage.avgCostPerCall * (apiUsage.totalCalls / Math.max(1, Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (30 * 86400000)))) * 100) / 100} based on current usage`
                : "No AI calls tracked yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Operational Costs Editor */}
      <Card className="border-border bg-card">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-[hsl(var(--viral-mid))]" />
              Monthly Operational Costs
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowCostEditor(!showCostEditor)} className="h-7 text-[10px]">
              {showCostEditor ? "Close" : "Edit Costs"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {/* Cost Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {operationalCosts.map((c, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-muted/20">
                <p className="text-[9px] text-muted-foreground truncate">{c.name || "Unnamed"}</p>
                <p className="text-sm font-bold text-foreground">₹{c.monthly_cost}/mo</p>
              </div>
            ))}
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-[9px] text-destructive">Total Monthly</p>
              <p className="text-sm font-bold text-destructive">₹{totalOperationalMonthly}/mo</p>
            </div>
          </div>

          {/* Editor */}
          {showCostEditor && (
            <div className="space-y-2 mt-3 p-3 rounded-lg border border-border bg-muted/10">
              {operationalCosts.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={c.name}
                    onChange={e => updateCostItem(i, "name", e.target.value)}
                    placeholder="Cost name (e.g. Hosting)"
                    className="h-8 text-xs flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={c.monthly_cost}
                      onChange={e => updateCostItem(i, "monthly_cost", Number(e.target.value))}
                      className="h-8 text-xs w-24"
                      min="0"
                    />
                    <span className="text-[9px] text-muted-foreground">/mo</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeCostItem(i)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addCostItem} className="h-7 text-[10px]">
                  <Plus className="w-3 h-3 mr-1" /> Add Cost
                </Button>
                <Button size="sm" onClick={saveOperationalCosts} disabled={savingCosts} className="h-7 text-[10px]">
                  {savingCosts ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                  Save Costs
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Monthly P&L Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--viral-high))]" />
              Monthly P&L Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(value: number, name: string) => [`₹${value}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="commissions" name="Commissions" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opCosts" name="Op. Costs" fill="hsl(var(--viral-mid))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="apiCosts" name="AI Costs" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="hsl(var(--viral-high))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No payment data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Split Pie */}
        <Card className="border-border bg-card">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Revenue Split (All Deductions)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {pieData.length > 0 && totals.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <RechartsPie>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "11px" }}
                    formatter={(value: number) => [`₹${value}`]} />
                  <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(value) => <span className="text-muted-foreground">{value}</span>} />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No revenue data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full P&L Statement */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-primary" />
            Complete P&L Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Item</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-right p-2 sm:p-3 font-medium text-muted-foreground">% of Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 bg-primary/5">
                  <td className="p-2 sm:p-3 font-bold text-foreground">💰 Total Revenue</td>
                  <td className="p-2 sm:p-3 text-right font-bold text-primary">₹{totals.totalRevenue.toLocaleString("en-IN")}</td>
                  <td className="p-2 sm:p-3 text-right text-muted-foreground">100%</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-2 sm:p-3 text-foreground pl-6">👥 Creator Commissions</td>
                  <td className="p-2 sm:p-3 text-right text-destructive">-₹{totals.totalCommissions.toLocaleString("en-IN")}</td>
                  <td className="p-2 sm:p-3 text-right text-muted-foreground">{totals.totalRevenue > 0 ? Math.round((totals.totalCommissions / totals.totalRevenue) * 100) : 0}%</td>
                </tr>
                {operationalCosts.filter(c => c.monthly_cost > 0).map((c, i) => {
                  const firstPayment = campaignProfits.length > 0 ? 1 : 0;
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="p-2 sm:p-3 text-foreground pl-6">🏢 {c.name}</td>
                      <td className="p-2 sm:p-3 text-right text-[hsl(var(--viral-mid))]">-₹{c.monthly_cost}/mo</td>
                      <td className="p-2 sm:p-3 text-right text-muted-foreground">
                        {totals.totalRevenue > 0 ? Math.round((c.monthly_cost / totals.totalRevenue) * 100) : 0}%
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b border-border/50">
                  <td className="p-2 sm:p-3 text-foreground pl-6">🤖 AI/Gemini API Costs</td>
                  <td className="p-2 sm:p-3 text-right text-[hsl(var(--viral-mid))]">-₹{apiUsage.totalCost}</td>
                  <td className="p-2 sm:p-3 text-right text-muted-foreground">{totals.totalRevenue > 0 ? Math.round((apiUsage.totalCost / totals.totalRevenue) * 100) : 0}%</td>
                </tr>
                <tr className="bg-muted/20 font-bold border-t-2 border-border">
                  <td className="p-2 sm:p-3 text-foreground">✅ NET PROFIT</td>
                  <td className={`p-2 sm:p-3 text-right ${totals.netProfit >= 0 ? "text-[hsl(var(--viral-high))]" : "text-destructive"}`}>
                    ₹{totals.netProfit.toLocaleString("en-IN")}
                  </td>
                  <td className={`p-2 sm:p-3 text-right font-bold ${totals.profitMargin >= 50 ? "text-[hsl(var(--viral-high))]" : "text-destructive"}`}>
                    {totals.profitMargin}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Campaign-wise Breakdown */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Campaign-wise Breakdown ({campaignProfits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {campaignProfits.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4">No campaigns found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] sm:text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Campaign</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Creator</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Revenue</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Commission</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Your Share</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignProfits.map((cp, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="p-2 sm:p-3 text-foreground font-medium">{cp.campaign_name}</td>
                      <td className="p-2 sm:p-3 text-foreground">{cp.creator_name}</td>
                      <td className="p-2 sm:p-3 text-foreground">₹{cp.total_revenue.toLocaleString("en-IN")}</td>
                      <td className="p-2 sm:p-3 text-destructive">-₹{cp.commission_amount} ({cp.commission_percent}%)</td>
                      <td className="p-2 sm:p-3 font-bold text-[hsl(var(--viral-high))]">₹{cp.net_profit.toLocaleString("en-IN")}</td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          cp.status === "active" ? "bg-[hsl(var(--viral-high))]/15 text-[hsl(var(--viral-high))]" : "bg-muted text-muted-foreground"
                        }`}>{cp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profit Insights */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">💡 Profit Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-1">Profit After All Costs</p>
              <p className={`text-sm font-bold ${totals.profitMargin >= 50 ? "text-[hsl(var(--viral-high))]" : "text-destructive"}`}>{totals.profitMargin}%</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {totals.profitMargin >= 80 ? "Excellent! 🎉" : totals.profitMargin >= 50 ? "Healthy margin 👍" : "Review your costs ⚠️"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-1">AI Cost per Analysis</p>
              <p className="text-sm font-bold text-foreground">₹{apiUsage.avgCostPerCall}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                {apiUsage.avgCostPerCall < 0.5 ? "Very cheap! 💚" : apiUsage.avgCostPerCall < 2 ? "Reasonable cost" : "Consider cheaper model"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-1">Monthly Burn Rate</p>
              <p className="text-sm font-bold text-destructive">₹{totalOperationalMonthly + Math.round(apiUsage.monthlyCost)}/mo</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Fixed ₹{totalOperationalMonthly} + API ₹{Math.round(apiUsage.monthlyCost)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/20">
              <p className="text-[10px] text-muted-foreground mb-1">Today's Profit</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-1">
                ₹{totals.todayProfit}
                {totals.todayProfit > 0 ? <ArrowUpRight className="w-3 h-3 text-[hsl(var(--viral-high))]" /> : <ArrowDownRight className="w-3 h-3 text-muted-foreground" />}
              </p>
              <p className="text-[9px] text-muted-foreground mt-0.5">After all deductions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfitAnalysis;
