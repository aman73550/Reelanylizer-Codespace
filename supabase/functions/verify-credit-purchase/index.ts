import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits, transactionId } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Razorpay signature
    const { data: configData } = await supabase.from("site_config").select("config_key, config_value");
    const config: Record<string, string> = {};
    if (configData) for (const row of configData) config[row.config_key] = row.config_value;

    const secret = config.razorpay_key_secret;
    if (secret && razorpay_signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
      );
      const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`);
      const sig = await crypto.subtle.sign("HMAC", key, data);
      const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

      if (expectedSig !== razorpay_signature) {
        return new Response(JSON.stringify({ success: false, error: "Invalid signature" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Add credits to user
    const { data: existingCredits } = await supabase
      .from("user_credits")
      .select("paid_credits")
      .eq("user_id", user.id)
      .single();

    if (existingCredits) {
      await supabase
        .from("user_credits")
        .update({
          paid_credits: (existingCredits.paid_credits || 0) + credits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Update transaction
    if (transactionId) {
      await supabase
        .from("credit_transactions")
        .update({ payment_id: razorpay_payment_id || "verified" })
        .eq("id", transactionId);
    }

    return new Response(JSON.stringify({ success: true, credits_added: credits }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("verify-credit-purchase error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
