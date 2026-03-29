import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_MAP: Record<string, { amount: number; credits: number }> = {
  starter: { amount: 49, credits: 15 },
  popular: { amount: 99, credits: 45 },
  pro: { amount: 199, credits: 120 },
  power: { amount: 399, credits: 300 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { planId } = await req.json();
    if (!planId || !PLAN_MAP[planId.toLowerCase()]) {
      return new Response(JSON.stringify({ success: false, error: "Invalid plan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = PLAN_MAP[planId.toLowerCase()];
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth - mandatory
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated. Please login first." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Session expired. Please login again." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: max 5 payment attempts per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentOrders } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if ((recentOrders || 0) >= 5) {
      return new Response(JSON.stringify({ success: false, error: "Too many payment attempts. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing PENDING order for same plan (prevent duplicates)
    const { data: pendingOrder } = await supabase
      .from("payments")
      .select("order_id, created_at")
      .eq("user_id", user.id)
      .eq("plan_id", planId.toLowerCase())
      .eq("status", "PENDING")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If there's a recent pending order (within 10 min), reject to prevent spam
    if (pendingOrder) {
      return new Response(JSON.stringify({
        success: false,
        error: "You already have a pending order for this plan. Please complete or wait 10 minutes.",
      }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Paytm keys are REQUIRED in production
    const PAYTM_MID = Deno.env.get("PAYTM_MID");
    const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY");

    if (!PAYTM_MID || !PAYTM_MERCHANT_KEY) {
      console.error("FATAL: Paytm keys not configured");
      return new Response(JSON.stringify({ success: false, error: "Payment gateway not configured. Contact support." }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = `RA_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Insert payment record
    const { error: insertErr } = await supabase.from("payments").insert({
      user_id: user.id,
      order_id: orderId,
      amount: plan.amount,
      plan_id: planId.toLowerCase(),
      credits_added: plan.credits,
      status: "PENDING",
      payment_method: "UPI",
    });
    if (insertErr) throw insertErr;

    // Initiate Paytm transaction
    try {
      const paytmBody = {
        body: {
          requestType: "Payment",
          mid: PAYTM_MID,
          orderId: orderId,
          websiteName: "DEFAULT",
          txnAmount: { value: plan.amount.toFixed(2), currency: "INR" },
          userInfo: { custId: user.id },
          callbackUrl: `${SUPABASE_URL}/functions/v1/paytm-callback`,
          enablePaymentMode: [{ mode: "UPI" }],
        },
        head: {
          signature: "",
        },
      };

      // Generate HMAC-SHA256 signature
      const bodyString = JSON.stringify(paytmBody.body);
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(PAYTM_MERCHANT_KEY),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyString));
      paytmBody.head.signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

      const paytmResp = await fetch(
        `https://securegw.paytm.in/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paytmBody),
        }
      );

      const paytmData = await paytmResp.json();

      if (paytmData.body?.resultInfo?.resultStatus === "S" && paytmData.body?.txnToken) {
        return new Response(JSON.stringify({
          success: true,
          gateway: "paytm",
          orderId,
          txnToken: paytmData.body.txnToken,
          mid: PAYTM_MID,
          amount: plan.amount,
          credits: plan.credits,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Paytm rejected the request — mark order as FAILED
      console.error("Paytm initiate failed:", JSON.stringify(paytmData));

      await supabase.from("payments").update({
        status: "FAILED",
        gateway_response: paytmData,
        updated_at: new Date().toISOString(),
      }).eq("order_id", orderId);

      const errorMsg = paytmData.body?.resultInfo?.resultMsg || "Payment gateway error";
      return new Response(JSON.stringify({ success: false, error: `Payment gateway: ${errorMsg}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (paytmError) {
      console.error("Paytm API error:", paytmError);

      await supabase.from("payments").update({
        status: "FAILED",
        gateway_response: { error: String(paytmError) },
        updated_at: new Date().toISOString(),
      }).eq("order_id", orderId);

      return new Response(JSON.stringify({ success: false, error: "Payment gateway temporarily unavailable. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error) {
    console.error("create-paytm-order error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
