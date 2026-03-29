import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

let _cachedDbKeys: string[] | null = null;
let _cacheTs = 0;

async function getApiKeysFromDb(supabase: any): Promise<string[]> {
  if (_cachedDbKeys && Date.now() - _cacheTs < 60000) return _cachedDbKeys;
  try {
    const { data } = await supabase
      .from("site_config")
      .select("config_key, config_value")
      .in("config_key", ["gemini_api_keys"]);
    if (data) {
      for (const row of data) {
        if (row.config_key === "gemini_api_keys" && row.config_value) {
          const keys = row.config_value.split(",").map((k: string) => k.trim()).filter(Boolean);
          if (keys.length > 0) {
            _cachedDbKeys = keys;
            _cacheTs = Date.now();
            return keys;
          }
        }
      }
    }
  } catch (e) { console.warn("Failed to load keys from DB:", e); }
  const singleKey = Deno.env.get("GEMINI_API_KEY");
  if (singleKey) return [singleKey];
  return [];
}

let currentKeyIndex = 0;

async function callGemini(body: Record<string, unknown>, supabase: any): Promise<Response> {
  const keys = await getApiKeysFromDb(supabase);
  if (keys.length === 0) throw new Error("No Gemini API keys configured.");

  const startIndex = currentKeyIndex % keys.length;
  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const key = keys[idx];
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 429 || response.status === 402 || response.status === 403) {
        console.warn(`Gemini key #${idx + 1} hit limit (${response.status}), trying next...`);
        lastError = new Error(`Key #${idx + 1} rate limited`);
        continue;
      }
      currentKeyIndex = idx;
      return response;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  currentKeyIndex = (startIndex + 1) % keys.length;
  throw lastError || new Error("All API keys exhausted");
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();

  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Topic is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (topic.trim().length > 1000 || topic.trim().length < 3) {
      return new Response(JSON.stringify({ success: false, error: "Topic must be 3-1000 chars" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = await hashString(clientIp);
    const { data: allowed } = await supabase.rpc("check_rate_limit", {
      p_ip_hash: ipHash, p_function_name: "seo-analyze", p_max_requests: 15, p_window_minutes: 60,
    });
    if (allowed === false) {
      return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user (credit already deducted on frontend)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Login required to use SEO optimizer" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting SEO analysis for topic:", topic);

    // AI Analysis
    const systemPrompt = `You are a world-class Instagram Reels & YouTube Shorts SEO expert and content strategist.

You MUST respond with a valid JSON object (no markdown, no code fences). Follow this EXACT structure:

{
  "title": "A highly optimized, catchy reel title (under 60 chars)",
  "caption": "An SEO-optimized caption/description with strategic keyword placement (150-300 chars). Include relevant emojis and a CTA.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "hashtags": {
    "high_volume": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "medium_volume": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "niche": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
  },
  "music_type": "Description of the best music type/genre for this reel",
  "best_posting_time": "Best time to post with timezone",
  "posting_rationale": "Brief explanation of why this posting time works",
  "top_reels": [
    { "title": "Title", "creator": "@handle", "estimated_views": "2.5M", "engagement": "high", "category": "entertainment", "why_viral": "Reason", "search_url": "https://www.instagram.com/explore/tags/relevant/" }
  ],
  "top_youtube_shorts": [
    { "title": "Title", "channel": "@channel", "estimated_views": "1.8M", "engagement": "high", "category": "entertainment", "why_trending": "Reason", "search_url": "https://www.youtube.com/results?search_query=query" }
  ],
  "content_tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "hook_suggestions": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "keyword_analysis": {
    "primary_keywords": ["k1", "k2", "k3"],
    "secondary_keywords": ["k1", "k2", "k3"],
    "long_tail_keywords": ["phrase1", "phrase2", "phrase3"],
    "trending_keywords": ["k1", "k2", "k3"]
  },
  "competitor_analysis": {
    "top_creators": [{ "name": "@creator", "followers": "500K", "avg_views": "200K", "strength": "Strong hooks", "content_style": "Entertainment" }],
    "content_gaps": ["gap1", "gap2", "gap3"],
    "winning_formats": ["format1", "format2", "format3"]
  },
  "score_breakdown": { "title_seo_score": 85, "caption_seo_score": 78, "hashtag_effectiveness": 82, "trend_alignment": 75, "content_potential": 80, "overall_seo_score": 80 },
  "platform_distribution": { "instagram_reels": 45, "youtube_shorts": 30, "tiktok": 25 },
  "engagement_prediction": { "estimated_reach": "10K-50K", "estimated_likes": "500-2K", "estimated_comments": "50-200", "estimated_shares": "100-500", "confidence": "medium" },
  "description_seo": "A 2-3 line SEO-optimized description"
}

Generate 10 realistic top_reels and 5 top_youtube_shorts. Scores 0-100. Platform distribution sums to 100.`;

    const userMessage = `Analyze this topic for Instagram Reels & YouTube Shorts SEO: "${topic}"`;

    const response = await callGemini({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }, supabase);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Service is busy, please try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Analysis failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let seoResult;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      seoResult = JSON.parse(jsonMatch[1].trim());
    } catch (parseErr) {
      console.error("Failed to parse response:", content.substring(0, 500));
      throw new Error("Failed to parse SEO analysis");
    }

    const durationMs = Date.now() - startTime;
    await supabase.from("api_usage_logs").insert({
      function_name: "seo-analyze", is_ai_call: true, estimated_cost: 0.005,
      status_code: 200, duration_ms: durationMs, ai_model: "gemini-2.5-flash", ai_provider: "google-direct",
    });

    return new Response(JSON.stringify({ success: true, data: seoResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seo-analyze error:", error);
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supabase.from("api_usage_logs").insert({
        function_name: "seo-analyze", is_ai_call: true, estimated_cost: 0, status_code: 500, duration_ms: Date.now() - startTime,
      });
    } catch {}
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
