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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 });
    }

    // Verify admin role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ success: false, message: "Admin access required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create_creator") {
      const { name, email, password, platform, username, followers, is_top_partner, profile_image, tags, promo_video_url, social_url, monthly_views, instagram_url, youtube_url } = body;
      if (!name || !email || !password) {
        return new Response(JSON.stringify({ success: false, message: "Name, email, and password required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      const passwordHash = await hashPassword(password);

      const { data: creator, error } = await supabase.from("creators").insert({
        name, email: email.toLowerCase(), password_hash: passwordHash,
        platform: platform || "instagram", username: username || null,
        followers: followers || "0", is_top_partner: is_top_partner || false,
        profile_image: profile_image || null, tags: tags || [],
        promo_video_url: promo_video_url || null,
        social_url: social_url || null,
        monthly_views: monthly_views || null,
        instagram_url: instagram_url || null,
        youtube_url: youtube_url || null,
      }).select().single();

      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      // Log
      await supabase.from("activity_logs").insert({
        actor_type: "admin", actor_id: user.id,
        action: "create_creator", target_type: "creator", target_id: creator.id,
        details: { name, email },
      });

      return new Response(JSON.stringify({ success: true, creator }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_creator") {
      const { creator_id, name, email, platform, username, followers, is_top_partner, profile_image, tags, promo_video_url, social_url, monthly_views, instagram_url, youtube_url, new_password } = body;
      if (!creator_id) {
        return new Response(JSON.stringify({ success: false, message: "creator_id required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      const updates: Record<string, any> = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = String(email).toLowerCase();
      if (platform !== undefined) updates.platform = platform;
      if (username !== undefined) updates.username = username;
      if (followers !== undefined) updates.followers = followers;
      if (monthly_views !== undefined) updates.monthly_views = monthly_views;
      if (instagram_url !== undefined) updates.instagram_url = instagram_url;
      if (youtube_url !== undefined) updates.youtube_url = youtube_url;
      if (profile_image !== undefined) updates.profile_image = profile_image;
      if (promo_video_url !== undefined) updates.promo_video_url = promo_video_url;
      if (social_url !== undefined) updates.social_url = social_url;
      if (Array.isArray(tags)) updates.tags = tags;
      if (is_top_partner !== undefined) updates.is_top_partner = !!is_top_partner;
      if (new_password) updates.password_hash = await hashPassword(new_password);

      if (Object.keys(updates).length === 0) {
        return new Response(JSON.stringify({ success: false, message: "No fields to update" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      const { error } = await supabase.from("creators").update(updates).eq("id", creator_id);
      if (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      await supabase.from("activity_logs").insert({
        actor_type: "admin", actor_id: user.id,
        action: new_password ? "update_creator_with_password" : "update_creator",
        target_type: "creator", target_id: creator_id,
        details: { updated_fields: Object.keys(updates) },
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "add_bonus") {
      const { payout_id, bonus_amount } = body;
      if (!payout_id || !bonus_amount) {
        return new Response(JSON.stringify({ success: false, message: "Payout ID and bonus amount required" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
      }

      const { error } = await supabase.from("creator_payouts")
        .update({ bonus: bonus_amount })
        .eq("id", payout_id);

      if (error) throw error;

      await supabase.from("activity_logs").insert({
        actor_type: "admin", actor_id: user.id,
        action: "add_bonus", target_type: "payout", target_id: payout_id,
        details: { bonus_amount },
      });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate_payouts") {
      // Get all active/completed campaigns
      const { data: activeCampaigns } = await supabase
        .from("campaigns")
        .select("id, creator_id, campaign_name, start_date, end_date, revenue_share_percent, status")
        .in("status", ["active", "completed"]);

      if (!activeCampaigns || activeCampaigns.length === 0) {
        return new Response(JSON.stringify({ success: true, message: "No active campaigns found", generated: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let generated = 0;

      for (const camp of activeCampaigns) {
        // Get total successful payments during campaign period
        const { data: payments } = await supabase
          .from("payments")
          .select("amount")
          .eq("status", "TXN_SUCCESS")
          .gte("created_at", camp.start_date)
          .lte("created_at", camp.end_date + "T23:59:59Z");

        const totalRevenue = payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
        const payoutAmount = Math.round((totalRevenue * camp.revenue_share_percent / 100) * 100) / 100;

        if (payoutAmount <= 0) continue;

        // Check if payout already exists for this campaign
        const { data: existingPayout } = await supabase
          .from("creator_payouts")
          .select("id, amount")
          .eq("campaign_id", camp.id)
          .eq("creator_id", camp.creator_id);

        if (existingPayout && existingPayout.length > 0) {
          // Update existing payout amount if changed
          if (existingPayout[0].amount !== payoutAmount) {
            await supabase.from("creator_payouts")
              .update({ amount: payoutAmount })
              .eq("id", existingPayout[0].id)
              .eq("status", "pending"); // Only update if still pending
          }
        } else {
          // Create new payout
          await supabase.from("creator_payouts").insert({
            campaign_id: camp.id,
            creator_id: camp.creator_id,
            amount: payoutAmount,
            status: "pending",
          });
          generated++;
        }
      }

      await supabase.from("activity_logs").insert({
        actor_type: "admin", actor_id: user.id,
        action: "generate_payouts",
        details: { campaigns_processed: activeCampaigns.length, payouts_generated: generated },
      });

      return new Response(JSON.stringify({ success: true, generated, processed: activeCampaigns.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "auto_lock_campaigns") {
      const today = new Date().toISOString().split("T")[0];
      const { data: expired } = await supabase
        .from("campaigns")
        .select("id")
        .eq("status", "active")
        .lt("end_date", today);

      if (expired && expired.length > 0) {
        for (const camp of expired) {
          await supabase.from("campaigns").update({ status: "completed" }).eq("id", camp.id);
          await supabase.from("activity_logs").insert({
            actor_type: "system", action: "auto_lock_campaign",
            target_type: "campaign", target_id: camp.id,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, locked: expired?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: false, message: "Unknown action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
