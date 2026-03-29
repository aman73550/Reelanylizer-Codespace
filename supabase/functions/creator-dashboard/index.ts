import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { creator_id, token } = await req.json();
    if (!creator_id || !token) {
      return new Response(JSON.stringify({ success: false, message: "Missing credentials" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    // Validate token
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.id !== creator_id) throw new Error("Token mismatch");
      if (decoded.exp && Date.now() > decoded.exp) throw new Error("Token expired");
    } catch {
      return new Response(JSON.stringify({ success: false, message: "unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get active campaign for this creator
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("creator_id", creator_id)
      .eq("status", "active")
      .single();

    let earnings = null;
    if (campaign) {
      // Calculate revenue from SUCCESS payments during campaign period
      // end_date is a date column, so extend to end of that day
      const endDateTime = `${campaign.end_date}T23:59:59.999Z`;
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, plan_id, created_at")
        .eq("status", "SUCCESS")
        .gte("created_at", campaign.start_date)
        .lte("created_at", endDateTime);

      const totalRevenue = (payments || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const creatorEarnings = Math.round(totalRevenue * (campaign.revenue_share_percent / 100) * 100) / 100;

      // Today's revenue
      const today = new Date().toISOString().split("T")[0];
      const todayRevenue = (payments || [])
        .filter((p: any) => p.created_at.startsWith(today))
        .reduce((s: number, p: any) => s + Number(p.amount), 0);

      // Purchase breakdown
      const planCounts: Record<string, number> = {};
      (payments || []).forEach((p: any) => {
        const key = `₹${p.amount}`;
        planCounts[key] = (planCounts[key] || 0) + 1;
      });

      earnings = {
        total_revenue: totalRevenue,
        creator_earnings: creatorEarnings,
        today_revenue: todayRevenue,
        purchase_stats: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
      };
    }

    // Get payouts
    const { data: payouts } = await supabase
      .from("creator_payouts")
      .select("*")
      .eq("creator_id", creator_id)
      .order("created_at", { ascending: false });

    return new Response(JSON.stringify({
      success: true,
      campaign,
      earnings,
      payouts: payouts || [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
