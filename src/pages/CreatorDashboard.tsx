import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LayoutDashboard, IndianRupee, Calendar, LogOut, Loader2, Clock, TrendingUp,
  CreditCard, BarChart3, Menu, X, RefreshCw
} from "lucide-react";

type Section = "dashboard" | "earnings" | "payout";

interface CreatorSession {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface CampaignData {
  id: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  revenue_share_percent: number;
  status: string;
}

interface EarningsData {
  total_revenue: number;
  creator_earnings: number;
  today_revenue: number;
  purchase_stats: { plan: string; count: number }[];
}

interface PayoutRecord {
  id: string;
  amount: number;
  bonus: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

const SIDEBAR: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "earnings", label: "Earnings", icon: IndianRupee },
  { id: "payout", label: "Payouts", icon: CreditCard },
];

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("dashboard");
  const [session, setSession] = useState<CreatorSession | null>(null);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("creator_session");
    if (!stored) { navigate("/creator-login"); return; }
    try {
      const parsed = JSON.parse(stored) as CreatorSession;
      // Check token expiry
      const decoded = JSON.parse(atob(parsed.token));
      if (decoded.exp && Date.now() > decoded.exp) {
        toast.error("Session expired, please login again");
        localStorage.removeItem("creator_session");
        navigate("/creator-login");
        return;
      }
      setSession(parsed);
      loadData(parsed, true);
    } catch {
      localStorage.removeItem("creator_session");
      navigate("/creator-login");
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      loadData(session, false);
    }, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const loadData = useCallback(async (sess: CreatorSession, showLoader: boolean) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { data, error } = await supabase.functions.invoke("creator-dashboard", {
        body: { creator_id: sess.id, token: sess.token },
      });
      if (error) throw error;
      if (!data?.success) {
        if (data?.message === "unauthorized") {
          localStorage.removeItem("creator_session");
          navigate("/creator-login");
          toast.error("Session expired");
          return;
        }
        throw new Error(data?.message || "Failed to load");
      }

      setCampaign(data.campaign || null);
      setEarnings(data.earnings || null);
      setPayouts(data.payouts || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (showLoader) toast.error(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  const handleRefresh = () => {
    if (session && !refreshing) loadData(session, false);
  };

  const handleLogout = () => {
    localStorage.removeItem("creator_session");
    navigate("/creator-login");
  };

  const daysLeft = campaign ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / 86400000)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center">
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border flex flex-col transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-foreground text-lg">Creator Panel</h2>
          <p className="text-xs text-muted-foreground mt-1">{session?.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR.map((item) => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                section === item.id ? "bg-purple-50 text-purple-700" : "text-muted-foreground hover:bg-muted/50"
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8 overflow-auto">
        {/* Refresh bar */}
        <div className="flex items-center justify-between mb-6 max-w-4xl">
          <div />
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="h-8 px-2">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {section === "dashboard" && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

            {campaign ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{campaign.campaign_name}</CardTitle>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"}>{campaign.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Start</p>
                      <p className="text-sm font-semibold text-foreground">{campaign.start_date}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">End</p>
                      <p className="text-sm font-semibold text-foreground">{campaign.end_date}</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue Share</p>
                      <p className="text-sm font-semibold text-purple-600">{campaign.revenue_share_percent}%</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-purple-50">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days Left</p>
                      <p className="text-sm font-bold text-purple-700 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" /> {daysLeft}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6 text-center text-muted-foreground text-sm">No active campaign found.</Card>
            )}

            {earnings && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1"><IndianRupee className="w-5 h-5" />{earnings.total_revenue.toLocaleString()}</p>
                </Card>
                <Card className="p-5 text-center bg-purple-50/50">
                  <p className="text-xs text-muted-foreground mb-1">Your Earnings</p>
                  <p className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-1"><TrendingUp className="w-5 h-5" />₹{earnings.creator_earnings.toLocaleString()}</p>
                </Card>
                <Card className="p-5 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Today's Revenue</p>
                  <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1"><BarChart3 className="w-5 h-5" />₹{earnings.today_revenue.toLocaleString()}</p>
                </Card>
              </div>
            )}

            {earnings?.purchase_stats && earnings.purchase_stats.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Purchase Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {earnings.purchase_stats.map((ps) => (
                      <div key={ps.plan} className="text-center p-3 rounded-xl bg-muted/50">
                        <p className="text-xs text-muted-foreground">{ps.plan}</p>
                        <p className="text-lg font-bold text-foreground">{ps.count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {campaign && (
              <Card className="p-5">
                <h3 className="font-semibold text-foreground text-sm mb-2">🎬 Your Promotion</h3>
                <p className="text-xs text-muted-foreground mb-2">Share your promotion video with your audience to drive sign-ups during your campaign period.</p>
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-foreground font-mono break-all">
                  reelanalyzer.com (Active Campaign: {campaign.campaign_name})
                </div>
              </Card>
            )}

            <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-100">
              <span className="text-green-600 text-lg">✓</span>
              <p className="text-xs text-green-700 font-medium">All earnings are calculated from verified successful payments only</p>
            </div>
          </div>
        )}

        {section === "earnings" && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground">Earnings History</h1>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Total Revenue</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Your Share</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No earnings data yet</td></tr>
                      ) : payouts.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="p-4 text-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right text-foreground">₹{(p.amount + p.bonus).toLocaleString()}</td>
                          <td className="p-4 text-right font-semibold text-purple-700">₹{p.amount.toLocaleString()}</td>
                          <td className="p-4 text-right">
                            <Badge variant={p.status === "paid" ? "default" : "secondary"}>{p.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {section === "payout" && (
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-foreground">Payout Status</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5">
                <p className="text-xs text-muted-foreground mb-1">Pending Payout</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0).toLocaleString()}
                </p>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreatorDashboard;
