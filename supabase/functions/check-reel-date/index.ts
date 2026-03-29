import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let publishDate: string | null = null;
    let videoDurationSeconds: number | null = null;
    
    const ytPattern = /^https?:\/\/(www\.)?(m\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)/i;
    const isYouTubeShorts = ytPattern.test(url);

    // Method 1: Fetch page and look for date/duration
    try {
      const pageResp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
      });

      if (pageResp.ok) {
        const html = await pageResp.text();

        // Try JSON-LD datePublished
        const jsonLdMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
        if (jsonLdMatch) publishDate = jsonLdMatch[1];

        // Try og:published_time
        if (!publishDate) {
          const metaMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:published_time|article:published_time)["'][^>]*content=["']([^"']+)["']/i);
          if (metaMatch) publishDate = metaMatch[1];
        }

        if (!publishDate) {
          const timeMatch = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
          if (timeMatch) publishDate = timeMatch[1];
        }

        if (!publishDate) {
          const timestampMatch = html.match(/["']uploadDate["']\s*:\s*["']([^"']+)["']/);
          if (timestampMatch) publishDate = timestampMatch[1];
        }

        if (!publishDate) {
          const isoMatch = html.match(/(?:publish|created|posted|upload)(?:ed|_at|Date|Time)["'\s:]*["'](\d{4}-\d{2}-\d{2}T[\d:.]+Z?)["']/i);
          if (isoMatch) publishDate = isoMatch[1];
        }

        // Extract video duration for YouTube Shorts length check
        if (isYouTubeShorts) {
          // Try ISO 8601 duration from JSON-LD (e.g. "PT30S", "PT1M5S")
          const durationMatch = html.match(/"duration"\s*:\s*"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1] || "0");
            const minutes = parseInt(durationMatch[2] || "0");
            const seconds = parseInt(durationMatch[3] || "0");
            videoDurationSeconds = hours * 3600 + minutes * 60 + seconds;
          }
          // Fallback: try lengthSeconds
          if (!videoDurationSeconds) {
            const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"?(\d+)"?/);
            if (lengthMatch) videoDurationSeconds = parseInt(lengthMatch[1]);
          }
        }
      }
    } catch (e) {
      console.log("Page fetch failed:", e);
    }

    // Validate the date if found
    let validDate: string | null = null;
    if (publishDate) {
      const parsed = new Date(publishDate);
      if (!isNaN(parsed.getTime())) {
        validDate = parsed.toISOString();
      }
    }

    // Calculate age
    let daysSincePost: number | null = null;
    let hoursSincePost: number | null = null;
    let isTooNew = false;

    if (validDate) {
      const posted = new Date(validDate);
      const now = new Date();
      hoursSincePost = (now.getTime() - posted.getTime()) / (1000 * 60 * 60);
      daysSincePost = hoursSincePost / 24;
      isTooNew = hoursSincePost < 48;
    }

    // Log usage
    const SB_URL = Deno.env.get("SUPABASE_URL");
    const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (SB_URL && SB_KEY) {
      const sb = createClient(SB_URL, SB_KEY);
      void (async () => {
        try {
          await sb.from("api_usage_logs").insert({
            function_name: "check-reel-date", is_ai_call: false, estimated_cost: 0, status_code: 200,
          });
        } catch {
          // Ignore logging failures so analysis/date checks still return normally.
        }
      })();
    }

    // Check YouTube Shorts length limit (50 seconds max)
    const isTooLong = isYouTubeShorts && videoDurationSeconds !== null && videoDurationSeconds > 50;

    return new Response(JSON.stringify({
      success: true,
      publishDate: validDate,
      daysSincePost: daysSincePost !== null ? Math.round(daysSincePost * 10) / 10 : null,
      hoursSincePost: hoursSincePost !== null ? Math.round(hoursSincePost) : null,
      isTooNew,
      dateFound: validDate !== null,
      isYouTubeShorts,
      videoDurationSeconds,
      isTooLong,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-reel-date error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
