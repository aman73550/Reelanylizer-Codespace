import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");
    if (!roles || roles.length === 0) throw new Error("Admin access required");

    const body = await req.json();
    const { action } = body;

    if (action === "list") {
      // List all auth users
      const { data: authUsers, error: listErr } = await supabase.auth.admin.listUsers({
        page: body.page || 1,
        perPage: body.perPage || 50,
      });
      if (listErr) throw listErr;

      // Get management data
      const { data: mgmtData } = await supabase
        .from("user_management")
        .select("*");

      // Get analysis counts per user
      const { data: analysisCounts } = await supabase
        .from("user_analyses")
        .select("user_id");

      const countMap: Record<string, number> = {};
      for (const a of analysisCounts || []) {
        countMap[a.user_id] = (countMap[a.user_id] || 0) + 1;
      }

      const mgmtMap: Record<string, any> = {};
      for (const m of mgmtData || []) {
        mgmtMap[m.user_id] = m;
      }

      const users = authUsers.users.map((u: any) => ({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        avatar_url: u.user_metadata?.avatar_url || "",
        provider: u.app_metadata?.provider || "email",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        is_blocked: mgmtMap[u.id]?.is_blocked || false,
        extra_credits: mgmtMap[u.id]?.extra_credits || 0,
        analyses_count: countMap[u.id] || 0,
      }));

      return new Response(JSON.stringify({ success: true, users, total: authUsers.users.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "block" || action === "unblock") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");

      const isBlocked = action === "block";
      const { data: existing } = await supabase
        .from("user_management")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (existing) {
        await supabase
          .from("user_management")
          .update({ is_blocked: isBlocked, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      } else {
        await supabase
          .from("user_management")
          .insert({ user_id, is_blocked: isBlocked });
      }

      return new Response(JSON.stringify({ success: true, message: `User ${action}ed` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_credits") {
      const { user_id, extra_credits } = body;
      if (!user_id) throw new Error("user_id required");

      const { data: existing } = await supabase
        .from("user_management")
        .select("id")
        .eq("user_id", user_id)
        .single();

      if (existing) {
        await supabase
          .from("user_management")
          .update({ extra_credits: extra_credits || 0, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      } else {
        await supabase
          .from("user_management")
          .insert({ user_id, extra_credits: extra_credits || 0 });
      }

      return new Response(JSON.stringify({ success: true, message: "Credits updated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");

      // Delete from user_management
      await supabase.from("user_management").delete().eq("user_id", user_id);
      // Delete user analyses
      await supabase.from("user_analyses").delete().eq("user_id", user_id);
      // Delete auth user
      const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
