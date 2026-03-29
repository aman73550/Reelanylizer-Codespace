import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyChecksum(params: Record<string, string>, checksum: string, merchantKey: string): Promise<boolean> {
  const filteredParams = { ...params };
  delete filteredParams["CHECKSUMHASH"];
  
  const sortedKeys = Object.keys(filteredParams).sort();
  const data = sortedKeys.map(k => `${k}=${filteredParams[k]}`).join("&");
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(merchantKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const generated = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return generated === checksum;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const PAYTM_MERCHANT_KEY = Deno.env.get("PAYTM_MERCHANT_KEY");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let params: Record<string, string>;

    // Handle both form-encoded (Paytm callback) and JSON (manual verify)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      params = {};
      formData.forEach((value, key) => { params[key] = value.toString(); });
    } else {
      params = await req.json();
    }

    const orderId = params.ORDERID || params.orderId;
    const txnId = params.TXNID || params.txnId;
    const status = params.STATUS || params.status;
    const checksumHash = params.CHECKSUMHASH || params.checksumHash;

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "Missing order ID" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already processed
    const { data: existingPayment } = await supabase.from("payments")
      .select("*").eq("order_id", orderId).single();

    if (!existingPayment) {
      return new Response(JSON.stringify({ success: false, error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent duplicate processing
    if (existingPayment.status === "SUCCESS") {
      return new Response(JSON.stringify({ success: true, message: "Already processed", status: "SUCCESS" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify checksum if merchant key available
    if (PAYTM_MERCHANT_KEY && checksumHash) {
      const isValid = await verifyChecksum(params, checksumHash, PAYTM_MERCHANT_KEY);
      if (!isValid) {
        await supabase.from("payments").update({
          status: "FAILED",
          gateway_response: params,
          updated_at: new Date().toISOString(),
        }).eq("order_id", orderId);

        return new Response(JSON.stringify({ success: false, error: "Checksum verification failed" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Map Paytm status
    let finalStatus: "SUCCESS" | "PENDING" | "FAILED";
    if (status === "TXN_SUCCESS") finalStatus = "SUCCESS";
    else if (status === "PENDING") finalStatus = "PENDING";
    else finalStatus = "FAILED";

    // Update payment record
    await supabase.from("payments").update({
      status: finalStatus,
      txn_id: txnId || null,
      gateway_response: params,
      updated_at: new Date().toISOString(),
    }).eq("order_id", orderId);

    // If SUCCESS, add credits
    if (finalStatus === "SUCCESS") {
      const creditsToAdd = existingPayment.credits_added;
      const userId = existingPayment.user_id;

      const { data: userCredits } = await supabase.from("user_credits")
        .select("paid_credits").eq("user_id", userId).single();

      if (userCredits) {
        await supabase.from("user_credits").update({
          paid_credits: (userCredits.paid_credits || 0) + creditsToAdd,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      } else {
        await supabase.from("user_credits").insert({
          user_id: userId,
          paid_credits: creditsToAdd,
        });
      }

      // Log credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: creditsToAdd,
        credit_type: "purchase",
        description: `${existingPayment.plan_id} Pack - ${creditsToAdd} credits for ₹${existingPayment.amount}`,
        payment_id: orderId,
      });
    }

    // For form callbacks, redirect user back to site
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const redirectUrl = `${req.headers.get("origin") || "https://reelanalyzer.com"}/?payment=${finalStatus.toLowerCase()}&order=${orderId}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: redirectUrl },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: finalStatus,
      credits: finalStatus === "SUCCESS" ? existingPayment.credits_added : 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("paytm-callback error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
