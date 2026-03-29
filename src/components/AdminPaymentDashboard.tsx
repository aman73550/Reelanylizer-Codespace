import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  IndianRupee, TrendingUp, Clock, XCircle, CheckCircle, Filter,
  Loader2, RefreshCw, CreditCard, Users, ChevronLeft, ChevronRight
} from "lucide-react";

interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  txn_id: string | null;
  amount: number;
  plan_id: string;
  credits_added: number;
  status: string;
  payment_method: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "bg-[hsl(var(--viral-high))]/15 text-[hsl(var(--viral-high))]",
  PENDING: "bg-[hsl(var(--viral-mid))]/15 text-[hsl(var(--viral-mid))]",
  FAILED: "bg-destructive/15 text-destructive",
};

const PAGE_SIZE = 15;

const AdminPaymentDashboard = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [stats, setStats] = useState({ revenue: 0, success: 0, pending: 0, failed: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => { loadPayments(); }, []);

  const loadPayments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Load payments error:", error);
      toast.error("Failed to load payments");
    }

    const all = (data || []) as Payment[];
    setPayments(all);

    const revenue = all.filter(p => p.status === "SUCCESS").reduce((s, p) => s + Number(p.amount), 0);
    const success = all.filter(p => p.status === "SUCCESS").length;
    const pending = all.filter(p => p.status === "PENDING").length;
    const failed = all.filter(p => p.status === "FAILED").length;
    setStats({ revenue, success, pending, failed });
    setLoading(false);
  };

  const handleMarkSuccess = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      const { error: updateErr } = await supabase.from("payments")
        .update({ status: "SUCCESS", txn_id: `ADMIN_${Date.now()}`, updated_at: new Date().toISOString() } as any)
        .eq("id", payment.id);
      if (updateErr) throw updateErr;

      const { data: userCredits } = await supabase.from("user_credits")
        .select("paid_credits").eq("user_id", payment.user_id).single();

      if (userCredits) {
        await supabase.from("user_credits").update({
          paid_credits: (userCredits.paid_credits || 0) + payment.credits_added,
          updated_at: new Date().toISOString(),
        }).eq("user_id", payment.user_id);
      }

      await supabase.from("credit_transactions").insert({
        user_id: payment.user_id,
        amount: payment.credits_added,
        credit_type: "purchase",
        description: `Admin approved: ${payment.plan_id} Pack - ${payment.credits_added} credits`,
        payment_id: payment.order_id,
      });

      toast.success(`Payment marked SUCCESS, ${payment.credits_added} credits added`);
      await loadPayments();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayments = filter === "all" ? payments : payments.filter(p => p.status === filter);
  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);
  const paginatedPayments = filteredPayments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  useEffect(() => { setPage(0); }, [filter]);

  const summaryCards = [
    { label: "Total Revenue", value: `₹${stats.revenue}`, icon: IndianRupee, color: "text-[hsl(var(--viral-high))]" },
    { label: "Successful", value: stats.success, icon: CheckCircle, color: "text-[hsl(var(--viral-high))]" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-[hsl(var(--viral-mid))]" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-destructive" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color} flex-shrink-0`} />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{s.label}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {["all", "SUCCESS", "PENDING", "FAILED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={loadPayments} className="h-7 text-[10px] sm:text-xs ml-auto">
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </div>

      {/* Payments Table */}
      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Payment Transactions ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4">No payments found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] sm:text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Credits</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-2 sm:p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/10">
                      <td className="p-2 sm:p-3 text-foreground font-mono truncate max-w-[100px]">{p.order_id.slice(-12)}</td>
                      <td className="p-2 sm:p-3 text-foreground capitalize">{p.plan_id}</td>
                      <td className="p-2 sm:p-3 text-foreground font-medium">₹{p.amount}</td>
                      <td className="p-2 sm:p-3 text-foreground">{p.credits_added}</td>
                      <td className="p-2 sm:p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold ${STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-2 sm:p-3">
                        {p.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[9px] sm:text-[10px] px-2"
                            onClick={() => handleMarkSuccess(p)}
                            disabled={actionLoading === p.id}
                          >
                            {actionLoading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "✅ Approve"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentDashboard;
