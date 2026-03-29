import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Delete old rate_limits (older than 7 days)
    const { count: rateLimits } = await supabase
      .from("rate_limits")
      .delete({ count: "exact" })
      .lt("window_start", sevenDaysAgo);

    // Delete old usage_logs (older than 30 days)
    const { count: usageLogs } = await supabase
      .from("usage_logs")
      .delete({ count: "exact" })
      .lt("created_at", thirtyDaysAgo);

    // Delete old traffic_sessions (older than 30 days)
    const { count: trafficSessions } = await supabase
      .from("traffic_sessions")
      .delete({ count: "exact" })
      .lt("created_at", thirtyDaysAgo);

    // Delete old ad_impressions (older than 30 days)
    const { count: adImpressions } = await supabase
      .from("ad_impressions")
      .delete({ count: "exact" })
      .lt("created_at", thirtyDaysAgo);

    // Delete old api_usage_logs (older than 30 days)
    const { count: apiLogs } = await supabase
      .from("api_usage_logs")
      .delete({ count: "exact" })
      .lt("created_at", thirtyDaysAgo);

    const summary = {
      rate_limits_deleted: rateLimits || 0,
      usage_logs_deleted: usageLogs || 0,
      traffic_sessions_deleted: trafficSessions || 0,
      ad_impressions_deleted: adImpressions || 0,
      api_usage_logs_deleted: apiLogs || 0,
    };

    console.log("Cleanup completed:", summary);

    return new Response(JSON.stringify({ success: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
