import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "reel_analyzer_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new TextDecoder().decode(encodeHex(new Uint8Array(hashBuffer)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, message: "Email and password required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: creator, error } = await supabase
      .from("creators")
      .select("id, name, email, password_hash, status")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (error || !creator) {
      return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    if (creator.status !== "active") {
      return new Response(JSON.stringify({ success: false, message: "Account deactivated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    // Hash the input password and compare
    const inputHash = await hashPassword(password);
    if (creator.password_hash !== inputHash) {
      return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    // Generate token with expiry
    const token = btoa(JSON.stringify({ id: creator.id, exp: Date.now() + 86400000 })); // 24hr

    // Log activity
    await supabase.from("activity_logs").insert({
      actor_type: "creator", actor_id: creator.id,
      action: "login", target_type: "creator", target_id: creator.id,
    });

    return new Response(JSON.stringify({
      success: true,
      creator: { id: creator.id, name: creator.name, email: creator.email },
      token,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
