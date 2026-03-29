import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_COSTS: Record<string, number> = {
  reel: 2,
  seo: 1,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "NOT_AUTHENTICATED" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "INVALID_AUTH" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type } = await req.json();
    if (!type || !CREDIT_COSTS[type]) {
      return new Response(JSON.stringify({ success: false, error: "INVALID_TYPE", valid_types: ["reel", "seo"] }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load dynamic costs from site_config
    const configKey = type === "reel" ? "credit_cost_reel_analysis" : "credit_cost_seo_optimizer";
    const { data: configRow } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", configKey)
      .maybeSingle();
    
    const cost = configRow ? parseInt(configRow.config_value) || CREDIT_COSTS[type] : CREDIT_COSTS[type];

    // Reset expired free credits first
    await supabase.rpc("reset_free_credits_if_expired", { p_user_id: user.id });

    // Get current credits
    let { data: credits } = await supabase
      .from("user_credits")
      .select("free_credits, paid_credits")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!credits) {
      // Create default credits row
      const { data: newCredits } = await supabase
        .from("user_credits")
        .insert({ user_id: user.id })
        .select("free_credits, paid_credits")
        .single();
      credits = newCredits;
    }

    if (!credits) {
      return new Response(JSON.stringify({ success: false, error: "CREDIT_SETUP_FAILED" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalCredits = (credits.free_credits || 0) + (credits.paid_credits || 0);

    if (totalCredits < cost) {
      return new Response(JSON.stringify({
        success: false,
        error: "INSUFFICIENT_CREDITS",
        have: totalCredits,
        need: cost,
        free_credits: credits.free_credits || 0,
        paid_credits: credits.paid_credits || 0,
      }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct: free credits first, then paid
    const freeDeduct = Math.min(credits.free_credits || 0, cost);
    const paidDeduct = cost - freeDeduct;

    const { error: updateErr } = await supabase
      .from("user_credits")
      .update({
        free_credits: (credits.free_credits || 0) - freeDeduct,
        paid_credits: (credits.paid_credits || 0) - paidDeduct,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateErr) {
      return new Response(JSON.stringify({ success: false, error: "DEDUCTION_FAILED" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log transaction
    const toolName = type === "reel" ? "Reel Analysis" : "SEO Optimizer";
    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -cost,
      credit_type: freeDeduct > 0 ? "free" : "paid",
      description: `Used ${cost} credit${cost > 1 ? "s" : ""} for ${toolName}`,
      tool_used: type === "reel" ? "reel_analysis" : "seo_optimizer",
    });

    const newFree = (credits.free_credits || 0) - freeDeduct;
    const newPaid = (credits.paid_credits || 0) - paidDeduct;

    return new Response(JSON.stringify({
      success: true,
      credits_used: cost,
      free_used: freeDeduct,
      paid_used: paidDeduct,
      remaining: {
        free_credits: newFree,
        paid_credits: newPaid,
        total: newFree + newPaid,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("use-credit error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
