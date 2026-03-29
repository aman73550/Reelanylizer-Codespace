import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { planName, amount, credits, currency } = await req.json();

    if (!planName || !amount || !credits) {
      return new Response(JSON.stringify({ success: false, error: "Missing plan details" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid auth token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payment gateway config
    const { data: configData } = await supabase.from("site_config").select("config_key, config_value");
    const config: Record<string, string> = {};
    if (configData) for (const row of configData) config[row.config_key] = row.config_value;

    const gateway = config.payment_gateway || "razorpay";

    // Create a transaction record
    const { data: txn, error: txnError } = await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: credits,
      credit_type: "purchase",
      description: `${planName} Pack - ${credits} credits for ₹${amount}`,
      payment_id: "pending",
    }).select("id").single();

    if (txnError) throw txnError;

    if (gateway === "razorpay") {
      const razorpayKeyId = config.razorpay_key_id;
      const razorpayKeySecret = config.razorpay_key_secret;

      if (!razorpayKeyId || !razorpayKeySecret) {
        return new Response(JSON.stringify({ success: false, error: "Payment gateway not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authB64 = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
      const orderResp = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${authB64}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: currency || "INR",
          receipt: txn.id,
          notes: { user_id: user.id, credits, plan: planName, transaction_id: txn.id },
        }),
      });

      if (!orderResp.ok) {
        const errText = await orderResp.text();
        console.error("Razorpay order failed:", errText);
        throw new Error("Payment order creation failed");
      }

      const order = await orderResp.json();

      // Update transaction with order ID
      await supabase.from("credit_transactions")
        .update({ payment_id: order.id })
        .eq("id", txn.id);

      return new Response(JSON.stringify({
        success: true,
        gateway: "razorpay",
        orderId: order.id,
        keyId: razorpayKeyId,
        transactionId: txn.id,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No valid gateway configured — reject
    return new Response(JSON.stringify({
      success: false,
      error: "Payment gateway not configured. Contact support.",
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("purchase-credits error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
