import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// DB-first multi-key rotation: reads from site_config table, falls back to env vars
let _cachedDbKeys: string[] | null = null;
let _cacheTs = 0;

async function getApiKeysFromDb(supabase: any): Promise<string[]> {
  // Cache for 60s to avoid hitting DB on every request
  if (_cachedDbKeys && Date.now() - _cacheTs < 60000) return _cachedDbKeys;

  try {
    const { data } = await supabase
      .from("site_config")
      .select("config_key, config_value")
      .in("config_key", ["gemini_api_keys", "openai_api_keys"]);

    if (data) {
      for (const row of data) {
        if (row.config_key === "gemini_api_keys" && row.config_value) {
          const keys = row.config_value.split(",").map((k: string) => k.trim()).filter(Boolean);
          if (keys.length > 0) {
            _cachedDbKeys = keys;
            _cacheTs = Date.now();
            console.log(`Loaded ${keys.length} Gemini keys from DB`);
            return keys;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load keys from DB, falling back to env:", e);
  }

  // Fallback to environment variables
  return getApiKeysFromEnv();
}

function getApiKeysFromEnv(): string[] {
  const multiKeys = Deno.env.get("GEMINI_API_KEYS");
  if (multiKeys) {
    const keys = multiKeys.split(",").map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  const singleKey = Deno.env.get("GEMINI_API_KEY");
  if (singleKey) return [singleKey];
  return [];
}

let currentKeyIndex = 0;

// === CIRCUIT BREAKER: stops calls after 3 consecutive failures for 30s ===
let circuitFailures = 0;
let circuitOpenUntil = 0;
const CIRCUIT_MAX_FAILURES = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;

// === GLOBAL CONCURRENCY LIMITER ===
let activeAnalyses = 0;
const MAX_CONCURRENT = 20;

// === URL RESULT CACHE (24h, consistent scoring for same URL) ===
const urlCache = new Map<string, { result: any; timestamp: number }>();
const URL_CACHE_TTL = 24 * 60 * 60 * 1000;

// === PER-USER COOLDOWN (1 analysis per 60s) ===
const userCooldowns = new Map<string, number>();
const USER_COOLDOWN_MS = 60_000;

async function callGemini(body: Record<string, unknown>, supabase?: any): Promise<Response> {
  // Circuit breaker check
  if (Date.now() < circuitOpenUntil) {
    throw new Error("CIRCUIT_OPEN");
  }

  const keys = supabase ? await getApiKeysFromDb(supabase) : getApiKeysFromEnv();
  if (keys.length === 0) throw new Error("No Gemini API keys configured. Add keys in Admin Panel → API Keys Manager or set GEMINI_API_KEY env var.");

  const startIndex = currentKeyIndex % keys.length;
  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    const idx = (startIndex + i) % keys.length;
    const key = keys[idx];
    console.log(`Trying Gemini API key #${idx + 1}/${keys.length}`);

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 || response.status === 402 || response.status === 403) {
        console.warn(`Key #${idx + 1} hit limit (${response.status}), trying next...`);
        lastError = new Error(`Key #${idx + 1} rate limited (${response.status})`);
        continue;
      }

      // Success — reset circuit breaker
      circuitFailures = 0;
      currentKeyIndex = idx;
      return response;
    } catch (e) {
      console.error(`Key #${idx + 1} network error:`, e);
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  // All keys failed — increment circuit breaker
  circuitFailures++;
  if (circuitFailures >= CIRCUIT_MAX_FAILURES) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    console.error(`Circuit breaker OPEN for ${CIRCUIT_COOLDOWN_MS / 1000}s after ${circuitFailures} failures`);
  }

  currentKeyIndex = (startIndex + 1) % keys.length;
  throw lastError || new Error("All API keys exhausted");
}

// ========== REGEX-BASED DATA EXTRACTION (NO AI) ==========

function parseNumberString(s: string | undefined | null): number | null {
  if (!s) return null;
  s = s.replace(/,/g, "").trim();
  if (/k$/i.test(s)) return Math.round(parseFloat(s) * 1000);
  if (/m$/i.test(s)) return Math.round(parseFloat(s) * 1000000);
  if (/b$/i.test(s)) return Math.round(parseFloat(s) * 1000000000);
  if (/lakh/i.test(s)) return Math.round(parseFloat(s) * 100000);
  if (/cr/i.test(s)) return Math.round(parseFloat(s) * 10000000);
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

function extractDataFromMarkdown(markdown: string): {
  caption: string;
  hashtags: string;
  likes: number | null;
  comments: number | null;
  views: number | null;
  shares: number | null;
  saves: number | null;
  authorName: string;
  postDate: string | null;
  sampleComments: string[];
} {
  const result = {
    caption: "",
    hashtags: "",
    likes: null as number | null,
    comments: null as number | null,
    views: null as number | null,
    shares: null as number | null,
    saves: null as number | null,
    authorName: "",
    postDate: null as string | null,
    sampleComments: [] as string[],
  };

  if (!markdown || markdown.length < 20) return result;

  const text = markdown;

  // --- Extract likes ---
  const likesPatterns = [
    /(\d[\d,.\w]*)\s+likes?/i,
    /likes?\s*[:=]\s*(\d[\d,.\w]*)/i,
    /❤️\s*(\d[\d,.\w]*)/i,
    /(\d[\d,.\w]*)\s*❤/i,
  ];
  for (const pat of likesPatterns) {
    const m = text.match(pat);
    if (m) { result.likes = parseNumberString(m[1]); break; }
  }

  // --- Extract comments count ---
  const commentsPatterns = [
    /(\d[\d,.\w]*)\s+comments?/i,
    /comments?\s*[:=]\s*(\d[\d,.\w]*)/i,
    /💬\s*(\d[\d,.\w]*)/i,
  ];
  for (const pat of commentsPatterns) {
    const m = text.match(pat);
    if (m) { result.comments = parseNumberString(m[1]); break; }
  }

  // --- Extract views ---
  const viewsPatterns = [
    /(\d[\d,.\w]*)\s+views?/i,
    /views?\s*[:=]\s*(\d[\d,.\w]*)/i,
    /▶️?\s*(\d[\d,.\w]*)/i,
    /(\d[\d,.\w]*)\s+plays?/i,
  ];
  for (const pat of viewsPatterns) {
    const m = text.match(pat);
    if (m) { result.views = parseNumberString(m[1]); break; }
  }

  // --- Extract shares ---
  const sharesMatch = text.match(/(\d[\d,.\w]*)\s+shares?/i) || text.match(/shares?\s*[:=]\s*(\d[\d,.\w]*)/i);
  if (sharesMatch) result.shares = parseNumberString(sharesMatch[1]);

  // --- Extract saves ---
  const savesMatch = text.match(/(\d[\d,.\w]*)\s+saves?/i) || text.match(/saves?\s*[:=]\s*(\d[\d,.\w]*)/i);
  if (savesMatch) result.saves = parseNumberString(savesMatch[1]);

  // --- Extract hashtags ---
  const hashtagMatches = text.match(/#[\w\u0900-\u097F]+/g);
  if (hashtagMatches) {
    result.hashtags = [...new Set(hashtagMatches)].join(" ");
  }

  // --- Extract caption ---
  // Pattern 1: "on Instagram: "caption""
  const captionMatch1 = text.match(/on Instagram:\s*["""]?([\s\S]*?)(?:["""]?\s*$|#\w)/im);
  if (captionMatch1) {
    result.caption = captionMatch1[1].replace(/#[\w]+/g, "").trim();
  }
  // Pattern 2: Look for a long paragraph that's not a comment
  if (!result.caption) {
    const lines = text.split("\n").filter(l => l.trim().length > 30 && !l.trim().startsWith("@") && !l.trim().startsWith("http"));
    if (lines.length > 0) {
      // Pick the longest line as likely caption
      result.caption = lines.sort((a, b) => b.length - a.length)[0].trim();
    }
  }
  // Remove hashtags from caption
  if (result.caption) {
    result.caption = result.caption.replace(/#[\w\u0900-\u097F]+/g, "").trim();
  }

  // --- Extract author/username ---
  const authorPatterns = [
    /(?:@|by\s+)(\w[\w.]{1,29})/i,
    /^(.+?)\s+on\s+Instagram/im,
    /(?:Author|Username|Posted by):\s*(.+)/im,
  ];
  for (const pat of authorPatterns) {
    const m = text.match(pat);
    if (m) { result.authorName = m[1].trim(); break; }
  }

  // --- Extract post date ---
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2}T[\d:]+)/,  // ISO format
    /(\w+ \d{1,2},?\s*\d{4})/,      // "Jan 15, 2024"
    /(\d{1,2}\s+\w+\s+\d{4})/,      // "15 January 2024"
    /(\d{1,2}\/\d{1,2}\/\d{4})/,    // "01/15/2024"
    /(\d+)\s*(?:hours?|hrs?|h)\s*ago/i,
    /(\d+)\s*(?:days?|d)\s*ago/i,
    /(\d+)\s*(?:weeks?|w)\s*ago/i,
  ];
  for (const pat of datePatterns) {
    const m = text.match(pat);
    if (m) {
      // Handle relative dates
      if (/hours?\s*ago/i.test(m[0])) {
        const d = new Date(); d.setHours(d.getHours() - parseInt(m[1]));
        result.postDate = d.toISOString();
      } else if (/days?\s*ago/i.test(m[0])) {
        const d = new Date(); d.setDate(d.getDate() - parseInt(m[1]));
        result.postDate = d.toISOString();
      } else if (/weeks?\s*ago/i.test(m[0])) {
        const d = new Date(); d.setDate(d.getDate() - parseInt(m[1]) * 7);
        result.postDate = d.toISOString();
      } else {
        try {
          const d = new Date(m[1]);
          if (!isNaN(d.getTime())) result.postDate = d.toISOString();
        } catch { /* skip */ }
      }
      break;
    }
  }

  // --- Extract sample comments (lines starting with @username or short conversational lines) ---
  const commentLines = text.split("\n")
    .filter(l => /^@\w/.test(l.trim()) || (/^\w/.test(l.trim()) && l.trim().length < 150 && l.trim().length > 5))
    .slice(0, 5);
  result.sampleComments = commentLines.map(l => l.trim());

  return result;
}

// ========== LIGHTWEIGHT HEURISTIC SIGNALS (NO AI) ==========

function computeHeuristics(caption: string, hashtags: string, markdown: string): {
  hookStyleHint: string;
  textHookInCaption: boolean;
  estimatedTopicPopularity: string;
  captionLength: string;
  hashtagCount: number;
  hasCTA: boolean;
  hasEmoji: boolean;
  hasQuestion: boolean;
  languageHint: string;
} {
  const captionLower = caption.toLowerCase();
  const fullText = `${caption} ${hashtags}`.toLowerCase();

  // Hook style detection from caption
  let hookStyleHint = "unknown";
  if (/^(did you know|kya aapko pata|क्या आपको|have you ever|what if)/i.test(caption)) hookStyleHint = "question";
  else if (/^(shocking|unbelievable|you won't believe|😱|🤯)/i.test(caption)) hookStyleHint = "shock";
  else if (/^(story|let me tell|ek kahani|एक कहानी|once upon)/i.test(caption)) hookStyleHint = "storytelling";
  else if (/^(watch|look at|see this|dekho|देखो)/i.test(caption)) hookStyleHint = "visual";
  else if (/\d+%|\d+x|\d+ out of|\d+ million/i.test(caption.substring(0, 80))) hookStyleHint = "statistic";

  // Text hook presence
  const textHookInCaption = /^[A-Z🔥⚡💥😱🤯❗️].{5,60}[.!?…]/.test(caption.trim());

  // Topic popularity estimation
  const trendingKeywords = ["trend", "viral", "challenge", "grwm", "transformation", "recipe", "hack", "diy", "motivation", "gym", "fitness", "dance", "fashion", "festival", "wedding", "cricket", "ipl", "bollywood"];
  const matchedTrending = trendingKeywords.filter(k => fullText.includes(k));
  const estimatedTopicPopularity = matchedTrending.length >= 3 ? "high" : matchedTrending.length >= 1 ? "medium" : "low";

  // Caption length assessment
  const captionLen = caption.length;
  const captionLength = captionLen === 0 ? "missing" : captionLen < 30 ? "very_short" : captionLen < 100 ? "short" : captionLen < 300 ? "optimal" : "long";

  // Hashtag count
  const hashtagCount = (hashtags.match(/#/g) || []).length;

  // CTA detection
  const hasCTA = /follow|like|share|comment|save|subscribe|link in bio|swipe|tap|click|tag/i.test(captionLower);

  // Emoji presence
  const hasEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/u.test(caption);

  // Question in caption
  const hasQuestion = /\?|kya|क्या|kaise|कैसे|kyun|क्यों/.test(captionLower);

  // Language hint
  const languageHint = /[\u0900-\u097F]/.test(caption) ? "hindi" : /[a-zA-Z]/.test(caption) ? "english" : "unknown";

  return { hookStyleHint, textHookInCaption, estimatedTopicPopularity, captionLength, hashtagCount, hasCTA, hasEmoji, hasQuestion, languageHint };
}

// ========== SCRAPING FUNCTIONS ==========

async function scrapeMetaTags(url: string): Promise<{
  ogImage: string; ogDescription: string; ogTitle: string; authorName: string; videoUrl: string;
} | null> {
  try {
    console.log("Attempting direct meta tag scrape:", url);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const html = await response.text();
    const getMetaContent = (property: string): string => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, "i");
      const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, "i");
      return regex.exec(html)?.[1] || regex2.exec(html)?.[1] || "";
    };

    const ogImage = getMetaContent("og:image");
    const ogDescription = getMetaContent("og:description");
    const ogTitle = getMetaContent("og:title");

    // Extract video URL from meta tags
    let videoUrl = getMetaContent("og:video:secure_url") || getMetaContent("og:video");
    if (!videoUrl) {
      // Try video source tags in HTML
      const videoSrcMatch = html.match(/<video[^>]*src=["']([^"']+\.mp4[^"']*)["']/i)
        || html.match(/<source[^>]*src=["']([^"']+\.mp4[^"']*)["']/i)
        || html.match(/"video_url"\s*:\s*"([^"]+)"/i)
        || html.match(/"playable_url"\s*:\s*"([^"]+)"/i)
        || html.match(/"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/i);
      if (videoSrcMatch?.[1]) {
        videoUrl = videoSrcMatch[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
      }
    }

    let authorName = "";
    const authorMatch = ogTitle.match(/^(.+?)\s+on\s+Instagram/i);
    if (authorMatch) authorName = authorMatch[1];
    if (!authorName) {
      const descAuthor = ogDescription.match(/^(\d[\d,.KMBkmb]*)\s+likes?,\s+\d+\s+comments?\s+-\s+(.+?)\s+\(/i);
      if (descAuthor) authorName = descAuthor[2];
    }

    if (!ogImage && !ogDescription && !videoUrl) return null;
    return { ogImage, ogDescription, ogTitle, authorName, videoUrl: videoUrl || "" };
  } catch (e) {
    console.error("Direct meta scrape error:", e);
    return null;
  }
}

async function scrapeReelWithFirecrawl(url: string, firecrawlKey?: string): Promise<{ screenshots: string[]; markdown: string } | null> {
  const apiKey = firecrawlKey || Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;

  try {
    console.log("Scraping reel with Firecrawl (multi-screenshot):", url);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["screenshot", "markdown"],
        waitFor: 5000,
        actions: [
          { type: "wait", milliseconds: 3000 },
          { type: "screenshot", fullPage: false },
          { type: "wait", milliseconds: 10000 },
          { type: "screenshot", fullPage: false },
          { type: "scroll", direction: "down", amount: 600 },
          { type: "wait", milliseconds: 3000 },
          { type: "screenshot", fullPage: false },
          { type: "scroll", direction: "down", amount: 600 },
          { type: "wait", milliseconds: 3000 },
          { type: "screenshot", fullPage: false },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("Firecrawl actions failed, trying simple scrape...");
      // Fallback to simple scrape without actions
      const fallbackResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["screenshot", "markdown"], waitFor: 5000 }),
      });
      if (!fallbackResp.ok) return null;
      const fallbackData = await fallbackResp.json();
      const mainScreenshot = fallbackData.data?.screenshot || fallbackData.screenshot || "";
      return {
        screenshots: mainScreenshot ? [mainScreenshot] : [],
        markdown: fallbackData.data?.markdown || fallbackData.markdown || "",
      };
    }

    const data = await response.json();
    const allScreenshots: string[] = [];

    // Main screenshot
    const mainShot = data.data?.screenshot || data.screenshot || "";
    if (mainShot) allScreenshots.push(mainShot);

    // Action screenshots
    const actionScreenshots = data.data?.actions?.screenshots || [];
    for (const shot of actionScreenshots) {
      if (shot && !allScreenshots.includes(shot)) {
        allScreenshots.push(shot);
      }
    }

    console.log(`Captured ${allScreenshots.length} screenshots from Firecrawl`);

    return {
      screenshots: allScreenshots.slice(0, 4), // Max 4 screenshots
      markdown: data.data?.markdown || data.markdown || "",
    };
  } catch (e) {
    console.error("Firecrawl scrape error:", e);
    return null;
  }
}

// ========== NATIVE VIDEO ANALYSIS (Gemini File API) ==========

async function downloadVideo(videoUrl: string, maxSizeMB: number = 20): Promise<Uint8Array | null> {
  try {
    console.log("Downloading video from:", videoUrl.substring(0, 80) + "...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const resp = await fetch(videoUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!resp.ok) { console.log("Video download HTTP error:", resp.status); return null; }

    const contentLength = parseInt(resp.headers.get("content-length") || "0");
    if (contentLength > maxSizeMB * 1024 * 1024) {
      console.log(`Video too large: ${(contentLength / 1024 / 1024).toFixed(1)}MB > ${maxSizeMB}MB`);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    if (buffer.byteLength > maxSizeMB * 1024 * 1024) return null;
    if (buffer.byteLength < 1000) { console.log("Video too small, likely not a real video"); return null; }

    console.log(`Video downloaded: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);
    return new Uint8Array(buffer);
  } catch (e) {
    console.error("Video download failed:", e);
    return null;
  }
}

async function uploadToGeminiFileApi(videoData: Uint8Array, apiKey: string, mimeType: string = "video/mp4"): Promise<string | null> {
  try {
    console.log("Uploading video to Gemini File API...");
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
          "X-Goog-Upload-Protocol": "raw",
        },
        body: videoData,
      }
    );

    if (!resp.ok) {
      console.error("Gemini File API upload failed:", resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const fileName = data.file?.name;
    if (!fileName) { console.error("No file name in Gemini response"); return null; }

    console.log(`Uploaded to Gemini File API: ${fileName}, state: ${data.file?.state}`);
    return fileName;
  } catch (e) {
    console.error("Gemini File API upload error:", e);
    return null;
  }
}

async function waitForFileActive(fileName: string, apiKey: string, maxWaitMs: number = 20000): Promise<string | null> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
      if (!resp.ok) { console.error("File status check failed:", resp.status); return null; }
      const data = await resp.json();
      console.log(`File state: ${data.state}`);
      if (data.state === "ACTIVE") return data.uri;
      if (data.state === "FAILED") { console.error("File processing FAILED"); return null; }
      await new Promise(r => setTimeout(r, 2000));
    } catch (e) { console.error("File status check error:", e); return null; }
  }
  console.log("File wait timeout exceeded");
  return null;
}

async function deleteGeminiFile(fileName: string, apiKey: string) {
  try {
    await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`, { method: "DELETE" });
    console.log("Deleted Gemini file:", fileName);
  } catch { /* ignore cleanup errors */ }
}

async function callGeminiNativeVideo(
  fileUri: string,
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<any | null> {
  try {
    console.log("Calling Gemini with native video analysis...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { fileData: { fileUri, mimeType: "video/mp4" } },
              { text: prompt }
            ]
          }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          }
        })
      }
    );
    clearTimeout(timeout);

    if (!resp.ok) {
      console.error("Gemini native video call failed:", resp.status, await resp.text());
      return null;
    }

    const data = await resp.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) { console.error("No content in Gemini video response"); return null; }

    console.log("Native video analysis completed successfully");
    return safeParseAnalysisJson(content);
  } catch (e) {
    console.error("Gemini native video analysis error:", e);
    return null;
  }
}

// ========== PATTERN DB FUNCTIONS ==========

async function fetchViralPatterns(category: string, supabaseUrl: string, serviceKey: string): Promise<any[]> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase
      .from("viral_patterns")
      .select("*")
      .eq("primary_category", category)
      .gte("viral_score", 50)
      .order("viral_score", { ascending: false })
      .limit(20);
    if (error) { console.error("Error fetching patterns:", error); return []; }
    return data || [];
  } catch (e) { console.error("Pattern fetch error:", e); return []; }
}

async function storePattern(analysis: any, url: string, metrics: any, caption: string, hashtags: string, supabaseUrl: string, serviceKey: string) {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const cc = analysis.contentClassification;
    const hashtagCount = hashtags ? hashtags.split(/[#\s,]+/).filter((h: string) => h.length > 0).length : 0;
    const pattern = {
      reel_url: url,
      primary_category: cc?.primaryCategory || "other",
      sub_category: cc?.subCategory || null,
      content_type: cc?.contentType || null,
      hook_type: analysis.hookAnalysis?.openingType || null,
      hook_score: analysis.hookAnalysis?.score || null,
      caption_score: analysis.captionAnalysis?.score || null,
      hashtag_score: analysis.hashtagAnalysis?.score || null,
      engagement_score: analysis.engagementScore || null,
      trend_score: analysis.trendMatching?.score || null,
      viral_score: analysis.viralClassification?.score || analysis.viralScore || null,
      viral_status: analysis.viralClassification?.status || null,
      scene_cuts: analysis.videoSignals?.estimatedSceneCuts || null,
      face_presence: analysis.videoSignals?.facePresenceLikely || null,
      text_overlay: analysis.videoSignals?.textOverlayLikely || null,
      motion_intensity: analysis.videoSignals?.motionIntensity || null,
      video_quality_score: analysis.videoQuality?.qualityScore || null,
      audio_quality_score: analysis.audioQuality?.qualityScore || null,
      music_usage: analysis.audioQuality?.musicUsage || null,
      hashtag_count: hashtagCount,
      caption_length: caption?.length || 0,
      has_cta: analysis.captionAnalysis?.callToAction && analysis.captionAnalysis.callToAction !== "None detected",
      curiosity_level: analysis.captionAnalysis?.curiosityLevel || null,
      likes: metrics?.likes || null,
      comments: metrics?.comments || null,
      views: metrics?.views || null,
      shares: metrics?.shares || null,
      saves: metrics?.saves || null,
      engagement_rate: analysis.viralClassification?.engagementRate || null,
      matched_trends: analysis.trendMatching?.matchedTrends || [],
      emotional_triggers: analysis.captionAnalysis?.emotionalTriggers || [],
      thumbnail_analyzed: analysis.thumbnailAnalyzed || false,
    };
    const { error } = await supabase.from("viral_patterns").insert(pattern);
    if (error) console.error("Error storing pattern:", error);
    else console.log("Pattern stored successfully");
  } catch (e) { console.error("Pattern store error:", e); }
}

function compareWithPatterns(analysis: any, patterns: any[]): any {
  if (patterns.length === 0) {
    return {
      patternsCompared: 0, similarityScore: null, categoryAvgScore: null,
      insights: ["No viral patterns in database yet for this category. Your analysis will help build the pattern database!"],
      topPatternFeatures: null,
    };
  }

  const scores = patterns.map(p => p.viral_score).filter(Boolean);
  const categoryAvg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

  let matchCount = 0, totalChecks = 0;
  const currentHookType = analysis.hookAnalysis?.openingType?.toLowerCase();
  const currentCategory = analysis.contentClassification?.primaryCategory?.toLowerCase();
  const currentFace = analysis.videoSignals?.facePresenceLikely?.toLowerCase();
  const currentMotion = analysis.videoSignals?.motionIntensity?.toLowerCase();
  const currentSceneCuts = analysis.videoSignals?.estimatedSceneCuts?.toLowerCase();

  const viralPatterns = patterns.filter(p => (p.viral_score || 0) >= 70);

  for (const p of viralPatterns) {
    if (p.hook_type) { totalChecks++; if (p.hook_type.toLowerCase() === currentHookType) matchCount++; }
    if (p.face_presence) { totalChecks++; if (p.face_presence.toLowerCase().includes(currentFace?.split("/")[0] || "")) matchCount++; }
    if (p.motion_intensity) { totalChecks++; if (p.motion_intensity.toLowerCase() === currentMotion) matchCount++; }
    if (p.scene_cuts) { totalChecks++; if (p.scene_cuts.toLowerCase() === currentSceneCuts) matchCount++; }
  }

  const similarityScore = totalChecks > 0 ? Math.round((matchCount / totalChecks) * 100) : 50;

  const hookTypes: Record<string, number> = {};
  const facePresence: Record<string, number> = {};
  const motionLevels: Record<string, number> = {};

  for (const p of viralPatterns) {
    if (p.hook_type) hookTypes[p.hook_type] = (hookTypes[p.hook_type] || 0) + 1;
    if (p.face_presence) facePresence[p.face_presence] = (facePresence[p.face_presence] || 0) + 1;
    if (p.motion_intensity) motionLevels[p.motion_intensity] = (motionLevels[p.motion_intensity] || 0) + 1;
  }

  const topHook = Object.entries(hookTypes).sort((a, b) => b[1] - a[1])[0];
  const topFace = Object.entries(facePresence).sort((a, b) => b[1] - a[1])[0];
  const topMotion = Object.entries(motionLevels).sort((a, b) => b[1] - a[1])[0];

  const insights: string[] = [];
  const currentScore = analysis.viralClassification?.score || analysis.viralScore || 0;

  if (currentScore > categoryAvg) insights.push(`Your reel scores ${currentScore - categoryAvg} points above the category average (${categoryAvg})`);
  else if (currentScore < categoryAvg) insights.push(`Your reel scores ${categoryAvg - currentScore} points below the category average (${categoryAvg})`);
  else insights.push(`Your reel matches the category average score of ${categoryAvg}`);

  if (similarityScore >= 70) insights.push(`High similarity (${similarityScore}%) with proven viral patterns in ${currentCategory}`);
  else if (similarityScore >= 40) insights.push(`Moderate similarity (${similarityScore}%) with viral patterns — some features align`);
  else insights.push(`Low similarity (${similarityScore}%) with known viral patterns — unique approach detected`);

  if (topHook) insights.push(`Most viral hook type in ${currentCategory}: "${topHook[0]}" (${Math.round((topHook[1] / viralPatterns.length) * 100)}% of viral reels)`);
  if (topFace) insights.push(`Face presence in viral reels: "${topFace[0]}" is most common`);
  if (topMotion) insights.push(`Dominant motion style: "${topMotion[0]}" among top performers`);

  const avgHookScore = Math.round(viralPatterns.reduce((s, p) => s + (p.hook_score || 0), 0) / Math.max(viralPatterns.length, 1));
  const avgCaptionScore = Math.round(viralPatterns.reduce((s, p) => s + (p.caption_score || 0), 0) / Math.max(viralPatterns.length, 1));

  return {
    patternsCompared: patterns.length, viralPatternsCount: viralPatterns.length,
    similarityScore, categoryAvgScore: categoryAvg,
    categoryAvgHookScore: avgHookScore, categoryAvgCaptionScore: avgCaptionScore,
    insights,
    topPatternFeatures: { hookType: topHook?.[0] || null, facePresence: topFace?.[0] || null, motionIntensity: topMotion?.[0] || null },
  };
}

// Hash utility for rate limiting
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function safeParseAnalysisJson(content: string) {
  const normalized = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const attempts = [normalized];
  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    attempts.push(normalized.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  throw new Error("AI returned an invalid analysis format. Please try again.");
}

// ========== MAIN HANDLER ==========

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, lang = "en", caption: userCaption, hashtags: userHashtags, metrics: userMetrics, sampleComments: userComments } = body;
    const respondInHindi = lang === "hi";

    // === INPUT VALIDATION ===
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ success: false, error: "URL is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmedUrl = url.trim();
    if (trimmedUrl.length > 500) {
      return new Response(JSON.stringify({ success: false, error: "URL too long" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate URL format (Instagram reel or YouTube Shorts)
    const igPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|reels|p)\//i;
    const ytPattern = /^https?:\/\/(www\.)?(m\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)/i;
    const isYouTubeShorts = ytPattern.test(trimmedUrl);
    const isInstagramReel = igPattern.test(trimmedUrl);
    
    if (!isInstagramReel && !isYouTubeShorts) {
      return new Response(JSON.stringify({ success: false, error: "Invalid URL. Please provide a valid Instagram Reel or YouTube Shorts link." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate optional text fields
    if (userCaption && (typeof userCaption !== "string" || userCaption.length > 5000)) {
      return new Response(JSON.stringify({ success: false, error: "Caption too long (max 5000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userHashtags && (typeof userHashtags !== "string" || userHashtags.length > 2000)) {
      return new Response(JSON.stringify({ success: false, error: "Hashtags too long (max 2000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userComments && (typeof userComments !== "string" || userComments.length > 5000)) {
      return new Response(JSON.stringify({ success: false, error: "Sample comments too long (max 5000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Validate metrics are numbers if provided
    if (userMetrics && typeof userMetrics === "object") {
      for (const [key, val] of Object.entries(userMetrics)) {
        if (val !== undefined && val !== null && (typeof val !== "number" || val < 0 || val > 999999999999)) {
          return new Response(JSON.stringify({ success: false, error: `Invalid metric: ${key}` }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Create supabase client for DB access (keys, logging)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 
      : null;

    // === RATE LIMITING ===
    if (supabaseClient) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || "unknown";
      const ipHash = await hashString(clientIp);
      const { data: allowed } = await supabaseClient.rpc("check_rate_limit", {
        p_ip_hash: ipHash,
        p_function_name: "analyze-reel",
        p_max_requests: 20,
        p_window_minutes: 60,
      });
      if (allowed === false) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === CIRCUIT BREAKER CHECK ===
    if (Date.now() < circuitOpenUntil) {
      return new Response(JSON.stringify({ 
        success: false, error: "CIRCUIT_OPEN", 
        message: "AI service is temporarily unavailable due to repeated failures. Please try again in 30 seconds." 
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === GLOBAL CONCURRENCY LIMIT ===
    if (activeAnalyses >= MAX_CONCURRENT) {
      return new Response(JSON.stringify({ 
        success: false, error: "SERVER_BUSY", 
        message: "System is handling too many requests. Please wait 10 seconds and try again." 
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === PER-USER COOLDOWN (1 analysis per 60s) ===
    const authHeader2 = req.headers.get("authorization");
    if (authHeader2) {
      const token2 = authHeader2.replace("Bearer ", "");
      const userIdHash = await hashString(token2.slice(-20));
      const lastTime = userCooldowns.get(userIdHash) || 0;
      if (Date.now() - lastTime < USER_COOLDOWN_MS) {
        const waitSec = Math.ceil((USER_COOLDOWN_MS - (Date.now() - lastTime)) / 1000);
        return new Response(JSON.stringify({ 
          success: false, error: "COOLDOWN", 
          message: `Please wait ${waitSec} seconds before analyzing again.` 
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      userCooldowns.set(userIdHash, Date.now());
    }

    // === URL RESULT CACHE (24h — same URL → same score) ===
    const cacheKey = trimmedUrl.toLowerCase().replace(/\/$/, "");
    const cachedResult = urlCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < URL_CACHE_TTL) {
      console.log("Cache HIT for URL:", cacheKey);
      return new Response(JSON.stringify({ success: true, analysis: cachedResult.result, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ANALYSIS PRICING MODE CHECK ===
    let analysisPricingMode = "free";
    let analysisPrice = 0;
    if (supabaseClient) {
      try {
        const { data: pricingConfig } = await supabaseClient
          .from("site_config")
          .select("config_key, config_value")
          .in("config_key", ["analysis_pricing_mode", "analysis_price"]);
        if (pricingConfig) {
          for (const row of pricingConfig) {
            if (row.config_key === "analysis_pricing_mode") analysisPricingMode = row.config_value || "free";
            if (row.config_key === "analysis_price") analysisPrice = parseFloat(row.config_value) || 0;
          }
        }
      } catch (e) { console.warn("Pricing config read error:", e); }

      if (analysisPricingMode === "paid" && analysisPrice > 0) {
        // Check for payment token in request
        const paymentToken = body.paymentToken;
        const adminBypass = body.adminFree === true;

        // Admin bypass: verify JWT and admin role
        if (adminBypass) {
          const authHeader = req.headers.get("Authorization");
          if (authHeader?.startsWith("Bearer ")) {
            try {
              const anonClient = createClient(
                Deno.env.get("SUPABASE_URL")!,
                Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                { global: { headers: { Authorization: authHeader } } }
              );
              const { data: userData } = await anonClient.auth.getUser();
              if (userData?.user) {
                const { data: roleData } = await supabaseClient
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", userData.user.id)
                  .eq("role", "admin");
                if (!roleData || roleData.length === 0) {
                  return new Response(JSON.stringify({ success: false, error: "Admin verification failed" }), {
                    status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                }
                // Admin verified — proceed without payment
              }
            } catch (e) {
              console.error("Admin bypass verification error:", e);
              return new Response(JSON.stringify({ success: false, error: "Authentication failed" }), {
                status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        } else if (!paymentToken) {
          // No payment token — return pricing info so frontend can show payment popup
          // Use status 200 so supabase.functions.invoke returns data (not error)
          return new Response(JSON.stringify({
            success: false,
            error: "payment_required",
            pricingMode: "paid",
            price: analysisPrice,
            currency: "INR",
            message: `Analysis requires payment of ₹${analysisPrice}`,
          }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          // Verify payment token against paid_reports table
          const { data: paymentRecord } = await supabaseClient
            .from("paid_reports")
            .select("id, status, reel_url")
            .eq("id", paymentToken)
            .in("status", ["paid", "completed"])
            .single();

          if (!paymentRecord) {
            return new Response(JSON.stringify({
              success: false,
              error: "payment_invalid",
              message: "Payment verification failed. Please complete payment first.",
            }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Mark payment as used for analysis
          await supabaseClient
            .from("paid_reports")
            .update({ status: "completed", completed_at: new Date().toISOString() })
            .eq("id", paymentToken);
        }
      }
    }

    // === INCREMENT CONCURRENCY COUNTER ===
    activeAnalyses++;

    // Validate API keys (from DB or env)
    const apiKeys = supabaseClient ? await getApiKeysFromDb(supabaseClient) : getApiKeysFromEnv();
    if (apiKeys.length === 0) { activeAnalyses--; throw new Error("No Gemini API keys configured. Add keys in Admin Panel → API Keys Manager."); }

    // Log usage
    try {
      if (supabaseClient) {
        await supabaseClient.from("usage_logs").insert({
          reel_url: trimmedUrl,
          user_agent: req.headers.get("user-agent") || null,
        });
      }
    } catch (e) { console.error("Usage log error:", e); }

    // Load Firecrawl key from DB first, then env
    let FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (supabaseClient) {
      try {
        const { data: fcData } = await supabaseClient
          .from("site_config")
          .select("config_value")
          .eq("config_key", "firecrawl_api_key")
          .single();
        if (fcData?.config_value) {
          const fcKeys = fcData.config_value.split(",").map((k: string) => k.trim()).filter(Boolean);
          if (fcKeys.length > 0) FIRECRAWL_API_KEY = fcKeys[0]; // Use first available key
        }
      } catch {}
    }

    // ==============================
    // STEP 1: Scrape reel page (parallel meta + Firecrawl)
    // ==============================
    console.log("STEP 1: Scraping reel page...");
    const [metaResult, scrapeResult] = await Promise.all([
      scrapeMetaTags(trimmedUrl),
      scrapeReelWithFirecrawl(trimmedUrl, FIRECRAWL_API_KEY || undefined),
    ]);

    // ==============================
    // STEP 2: Parse with regex/parser (NO AI)
    // ==============================
    console.log("STEP 2: Regex-based extraction...");

    let caption = userCaption || "";
    let hashtags = userHashtags || "";
    let metrics: any = userMetrics || {};
    let sampleComments = userComments || "";
    let authorName = "";
    let thumbnailUrl = "";
    let screenshotUrls: string[] = [];
    let screenshotUrl = "";
    let postDate: string | null = null;
    let extractedVideoUrl = "";

    // Extract video URL from meta result
    if (metaResult?.videoUrl) {
      extractedVideoUrl = metaResult.videoUrl;
      console.log("Found video URL from meta tags:", extractedVideoUrl.substring(0, 80) + "...");
    }

    const userProvidedMetrics = userMetrics && Object.values(userMetrics).some((v: any) => v !== undefined && v !== null);

    // Layer 1: Meta tags
    if (metaResult) {
      if (!caption && metaResult.ogDescription) {
        const descMatch = metaResult.ogDescription.match(/on Instagram:\s*["""]?(.*)/is);
        if (descMatch) caption = descMatch[1].replace(/["""]$/, "").trim();
        else caption = metaResult.ogDescription;
      }
      if (!authorName && metaResult.authorName) authorName = metaResult.authorName;
      if (metaResult.ogImage) thumbnailUrl = metaResult.ogImage;

      // Extract metrics from og:description with regex
      if (!userProvidedMetrics && metaResult.ogDescription) {
        const likesMatch = metaResult.ogDescription.match(/([\d,.\w]+)\s+likes?/i);
        const commentsMatch = metaResult.ogDescription.match(/([\d,.\w]+)\s+comments?/i);
        if (likesMatch) metrics.likes = metrics.likes || parseNumberString(likesMatch[1]);
        if (commentsMatch) metrics.comments = metrics.comments || parseNumberString(commentsMatch[1]);
      }
    }

    // Layer 2: Firecrawl markdown — regex extraction (NO AI call)
    if (scrapeResult?.markdown) {
      console.log("Parsing Firecrawl markdown with regex...");
      const extracted = extractDataFromMarkdown(scrapeResult.markdown);

      if (!caption && extracted.caption) caption = extracted.caption;
      if (!hashtags && extracted.hashtags) hashtags = extracted.hashtags;
      if (!authorName && extracted.authorName) authorName = extracted.authorName;
      if (!sampleComments && extracted.sampleComments.length > 0) sampleComments = extracted.sampleComments.join("\n");
      if (extracted.postDate) postDate = extracted.postDate;
      if (!userProvidedMetrics && (!metrics.likes && !metrics.comments)) {
        metrics = {
          likes: extracted.likes,
          comments: extracted.comments,
          views: extracted.views,
          shares: extracted.shares,
          saves: extracted.saves,
        };
      }

      // Capture ALL screenshot URLs for multi-image vision
      if (scrapeResult.screenshots && scrapeResult.screenshots.length > 0) {
        for (const shot of scrapeResult.screenshots) {
          if (shot) {
            const shotUrl = shot.startsWith("data:")
              ? shot
              : shot.startsWith("http")
              ? shot
              : `data:image/png;base64,${shot}`;
            screenshotUrls.push(shotUrl);
          }
        }
        screenshotUrl = screenshotUrls[0] || "";
        console.log(`Prepared ${screenshotUrls.length} screenshot(s) for AI vision`);
      }
    }

    // Layer 3: oEmbed fallback (platform-specific)
    let metadata = "";
    if (isYouTubeShorts) {
      // YouTube oEmbed
      try {
        const ytOembedResp = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`);
        if (ytOembedResp.ok) {
          const ytOembed = await ytOembedResp.json();
          metadata = `Title: ${ytOembed.title || "N/A"}\nAuthor: ${ytOembed.author_name || "N/A"}`;
          if (!thumbnailUrl) thumbnailUrl = ytOembed.thumbnail_url || "";
          if (!authorName) authorName = ytOembed.author_name || "";
          if (!caption && ytOembed.title) caption = ytOembed.title;
        }
      } catch { console.log("YouTube oEmbed fetch failed"); }
    } else {
      // Instagram oEmbed
      if (!thumbnailUrl || !authorName) {
        try {
          const oembedResp = await fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`);
          if (oembedResp.ok) {
            const oembed = await oembedResp.json();
            metadata = `Title: ${oembed.title || "N/A"}\nAuthor: ${oembed.author_name || "N/A"}`;
            if (!thumbnailUrl) thumbnailUrl = oembed.thumbnail_url || "";
            if (!authorName) authorName = oembed.author_name || "";
            if (!caption && oembed.title) caption = oembed.title;
          }
        } catch { console.log("oEmbed fetch failed"); }
      }
    }

    // Layer 4: noembed fallback
    if (!thumbnailUrl) {
      try {
        const noembedResp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
        if (noembedResp.ok) {
          const noembed = await noembedResp.json();
          if (noembed.thumbnail_url) thumbnailUrl = noembed.thumbnail_url;
          if (!authorName && noembed.author_name) authorName = noembed.author_name;
          if (!caption && noembed.title) caption = noembed.title;
        }
      } catch { console.log("noembed fetch failed"); }
    }

    if (!metadata && authorName) metadata = `Author: ${authorName}`;

    // ==============================
    // STEP 3: Prepare structured input + heuristics
    // ==============================
    console.log("STEP 3: Computing heuristics...");
    const heuristics = computeHeuristics(caption, hashtags, scrapeResult?.markdown || "");

    // Extract hashtags from caption if not already found
    if (!hashtags && caption) {
      const captionHashtags = caption.match(/#[\w\u0900-\u097F]+/g);
      if (captionHashtags) hashtags = [...new Set(captionHashtags)].join(" ");
    }

    const hasMetrics = metrics && Object.values(metrics).some((v: any) => v !== undefined && v !== null && v !== 0);
    let metricsSection = "";
    if (hasMetrics) {
      const parts = [];
      if (metrics.likes) parts.push(`Likes: ${metrics.likes}`);
      if (metrics.comments) parts.push(`Comments: ${metrics.comments}`);
      if (metrics.views) parts.push(`Views: ${metrics.views}`);
      if (metrics.shares) parts.push(`Shares: ${metrics.shares}`);
      if (metrics.saves) parts.push(`Saves: ${metrics.saves}`);
      metricsSection = `\nEngagement Metrics (auto-extracted):\n${parts.join("\n")}`;
    }

    let commentsSection = "";
    if (sampleComments) commentsSection = `\nSample Comments (auto-extracted):\n${sampleComments}`;

    const heuristicsSection = `
=== PRE-COMPUTED HEURISTIC SIGNALS (use these as inputs) ===
Hook Style Hint (from caption text): ${heuristics.hookStyleHint}
Text Hook Present in Caption: ${heuristics.textHookInCaption}
Estimated Topic Popularity: ${heuristics.estimatedTopicPopularity}
Caption Length: ${heuristics.captionLength} (${caption.length} chars)
Hashtag Count: ${heuristics.hashtagCount}
CTA Detected: ${heuristics.hasCTA}
Emoji Present: ${heuristics.hasEmoji}
Question in Caption: ${heuristics.hasQuestion}
Language: ${heuristics.languageHint}
`;

    // ==============================
    // STEP 4: AI ANALYSIS — Native Video (preferred) → Screenshots → Text-only
    // ==============================
    console.log("STEP 4: AI analysis...");

    // Collect all available images for vision (screenshots + thumbnail)
    const allImagesForVision: string[] = [...screenshotUrls];
    if (thumbnailUrl && !allImagesForVision.includes(thumbnailUrl)) {
      allImagesForVision.push(thumbnailUrl);
    }
    const imagesForVision = allImagesForVision.slice(0, 4);
    const imageForVision = imagesForVision.length > 0 ? imagesForVision[0] : "";
    const isScreenshot = screenshotUrls.length > 0;
    const hasMultipleImages = imagesForVision.length > 1;
    console.log(`Images for AI vision: ${imagesForVision.length} (screenshots: ${screenshotUrls.length}, thumbnail: ${thumbnailUrl ? 1 : 0})`);

    const langInstruction = respondInHindi
      ? "\n\nCRITICAL: Write ALL text values in Hindi. Keep JSON keys in English."
      : "";

    const platformName = isYouTubeShorts ? "YouTube Shorts" : "Instagram";
    const contentType = isYouTubeShorts ? "Short" : "Reel";

    // === STRICT VIDEO ANALYSIS PROMPT ===
    const videoAnalysisDirective = `STRICT DIRECTIVE: You are analyzing an actual VIDEO file (visuals + audio). Watch the ENTIRE video carefully.

MANDATORY ANALYSIS STEPS:
1. WATCH the first 3 seconds — identify the exact hook (what you SEE and HEAR)
2. ANALYZE music/audio sync — does the beat match visual cuts/transitions?
3. COUNT scene transitions/cuts throughout the video
4. IDENTIFY faces, expressions, objects, text overlays, locations visible in the video
5. ASSESS motion intensity — camera movement, subject movement, zoom effects
6. LISTEN to audio — voiceover tone, music genre, sound effects, audio clarity
7. EVALUATE overall production quality — lighting, color grading, stability, resolution`;

    const screenshotAnalysisDirective = imagesForVision.length > 0 ? `VISUAL ANALYSIS from ${imagesForVision.length} screenshot(s):
${hasMultipleImages ? `- Multiple screenshots at different timestamps. Analyze ALL carefully.
- Extract: people, objects, actions, text overlays, scene setting, UI metrics (likes, comments, views).
- If metrics visible in screenshots differ from extracted data, use SCREENSHOT values.` : `- ${isScreenshot ? "Full page screenshot with UI metrics." : "Thumbnail image."} Use as primary visual signal.`}
Be SPECIFIC: describe what you see — people, actions, objects, text, setting, emotions.` : "No visual content — analyze from caption, hashtags, metrics only.";

    const prompt = `You are a world-class ${platformName} viral content analyst. Perform STRICT, PINPOINT analysis.

=== INPUT DATA ===
URL: ${url}
${metadata ? `Metadata: ${metadata}` : ""}
${caption ? `Caption: ${caption}` : "No caption"}
${hashtags ? `Hashtags: ${hashtags}` : "No hashtags"}${metricsSection}${commentsSection}
${heuristicsSection}

=== STRICT ANALYSIS RULES ===
- Score HONESTLY. Do NOT inflate scores. 7-8 = exceptional, 5-6 = good, 3-4 = average, 1-2 = poor.
- ALL sub-scores: 1-8 MAXIMUM. NEVER above 8.
- viralScore: 5-80 MAXIMUM. NEVER above 80.
- Be SPECIFIC in descriptions — no generic phrases like "good quality" or "nice content".
- Every insight MUST reference something ACTUALLY observed in the content.
- Do NOT make assumptions about things you cannot see/hear.

${isScreenshot ? `CRITICAL: If screenshot metrics differ from extracted data, use SCREENSHOT values.` : ""}

HOOK TYPE (classify exactly one): question | shock | storytelling | visual | statistic

VIRALITY FACTORS (strict detection — only mark true if CLEARLY evident):
- recognizablePerson: true ONLY if a verified celebrity/public figure is visible
- strongFacialExpression: true ONLY if dramatic/exaggerated expression visible
- strongVisualSubject: true ONLY if compelling subject (luxury, dramatic, beautiful)
- famousPlaceOrObject: true ONLY if iconic/famous location or object shown
- deepVoiceLikely: true ONLY if bass/deep narration voice detected
- trendingTopicRelevance: high/medium/low/none
- famousIncident: true ONLY if related to documented newsworthy event

CATEGORY IMPACT on ${platformName}:
- HIGH viral: comedy, entertainment, music, grwm, cars, bikes, dance, fashion, motivation
- LOW viral: education, tutorials, learning content
${isYouTubeShorts ? `
YOUTUBE POLICY CHECK (MANDATORY):
- Community Guidelines: violence, harassment, hate, nudity, dangerous content
- Copyright: music, audio clips, visual assets
- Advertiser-Friendly: controversial topics, profanity
- Monetization eligibility
- Age restriction risk
- Reused content risk
Be specific about WHAT triggers each concern.` : ""}
${langInstruction}

=== REQUIRED JSON OUTPUT (ONLY valid JSON, NO markdown, NO filler) ===
{
  "viralScore": <5-80>,
  "overallSummary": "<3-4 sentence summary referencing SPECIFIC observations>",

  "contentClassification": {
    "primaryCategory": "<education/motivation/comedy/marketing/fitness/lifestyle/cooking/beauty/tech/gaming/storytelling/news/entertainment/music/grwm/cars/bikes/dance/fashion/other>",
    "subCategory": "<specific niche>",
    "contentType": "<tutorial/entertainment/review/vlog/transformation/skit/montage/other>",
    "detectedElements": {
      "objects": ["<specific object>"],
      "people": "<specific description>",
      "actions": ["<specific action>"],
      "scene": "<specific scene>",
      "onScreenText": ["<exact text>"],
      "estimatedTopic": "<topic>"
    },
    "confidence": "<high/medium/low>",
    "reasoning": "<1-2 sentences>",
    "hashtagAlignment": "<yes/partially/no + why>"
  },

  "viralityFactors": {
    "recognizablePerson": false,
    "strongFacialExpression": false,
    "strongVisualSubject": false,
    "famousPlaceOrObject": false,
    "deepVoiceLikely": false,
    "trendingTopicRelevance": "none",
    "famousIncident": false
  },

  "hookAnalysis": {
    "score": <1-8>,
    "firstThreeSeconds": "<EXACT description of what happens>",
    "openingType": "<question/shock/storytelling/visual/statistic>",
    "attentionGrabber": "<specific element>",
    "details": ["<specific insight>", "<specific insight>", "<specific insight>"]
  },

  "captionAnalysis": {
    "score": <1-8>,
    "curiosityLevel": <1-10>,
    "emotionalTriggers": ["<trigger>"],
    "callToAction": "<specific CTA or 'None detected'>",
    "keywordDensity": "<assessment>",
    "lengthEffectiveness": "<assessment>",
    "details": ["<insight>", "<insight>", "<insight>"]
  },

  "hashtagAnalysis": {
    "score": <1-8>,
    "totalHashtags": <number>,
    "nicheTags": ["<tag>"],
    "broadTags": ["<tag>"],
    "trendingTags": ["<tag>"],
    "bannedOrSpammy": ["<tag or empty>"],
    "details": ["<insight>", "<insight>", "<insight>"]
  },

  "videoSignals": {
    "estimatedSceneCuts": "<few/moderate/many>",
    "facePresenceLikely": "<yes/no/partial>",
    "textOverlayLikely": "<yes/no>",
    "motionIntensity": "<low/medium/high>",
    "visualComplexity": "<simple/moderate/complex>",
    "dominantColors": ["<color>"],
    "estimatedDuration": "<short/medium/long>",
    "details": ["<specific observation>", "<specific observation>"]
  },

  "videoQuality": {
    "qualityScore": <1-8>,
    "resolution": "<estimated>",
    "lighting": "<assessment>",
    "stability": "<stable/shaky/mixed>",
    "colorGrading": "<assessment>",
    "details": ["<specific observation>"]
  },

  "audioQuality": {
    "qualityScore": <1-8>,
    "musicUsage": "<trending/original/popular/none>",
    "voiceoverPresent": true/false,
    "audioClarity": "<clear/muffled/mixed>",
    "musicBeatSync": "<synced/partially/not synced>",
    "details": ["<specific observation>"]
  },

  "trendMatching": {
    "score": <1-8>,
    "matchedTrends": ["<trend>"],
    "trendingFormats": ["<format>"],
    "timingRelevance": "<assessment>",
    "details": ["<insight>"]
  },

  "engagementScore": <1-8>,
  "engagementDetails": {
    "predictedSaves": "<low/medium/high>",
    "predictedShares": "<low/medium/high>",
    "commentPotential": "<low/medium/high>",
    "replayValue": "<low/medium/high>",
    "details": ["<insight>"]
  },

  ${sampleComments ? `"commentSentiment": {
    "overallSentiment": "<positive/negative/mixed/neutral>",
    "topThemes": ["<theme>"],
    "toxicityLevel": "<low/medium/high>",
    "engagementQuality": "<genuine/spam/mixed>",
    "details": ["<insight>"]
  },` : ""}

  "premiumInsights": {
    "captionRewrite": {
      "improvedCaption": "<rewritten caption with CTA and emojis>",
      "whyBetter": "<1 sentence>"
    },
    "hashtagStrategy": {
      "recommended": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>", "<tag6>", "<tag7>", "<tag8>"],
      "mix": {"niche": 3, "broad": 3, "trending": 2}
    },
    "competitorComparison": [
      {"trait": "<what top reels do>", "yourScore": "<Good/Average/Weak>", "tip": "<action>"},
      {"trait": "<trait 2>", "yourScore": "<>", "tip": "<>"},
      {"trait": "<trait 3>", "yourScore": "<>", "tip": "<>"}
    ],
    "contentCalendar": {
      "bestTimes": [
        {"day": "Monday", "time": "9-11 AM", "reason": "<why>"},
        {"day": "Wednesday", "time": "12-2 PM", "reason": "<why>"},
        {"day": "Friday", "time": "6-8 PM", "reason": "<why>"}
      ],
      "frequency": "<recommended>"
    },
    "improvementRoadmap": [
      {"step": 1, "title": "<>", "description": "<>", "impact": "high/medium/low", "effort": "easy/medium/hard"},
      {"step": 2, "title": "<>", "description": "<>", "impact": "<>", "effort": "<>"},
      {"step": 3, "title": "<>", "description": "<>", "impact": "<>", "effort": "<>"}
    ],
    "creatorChecklist": [
      {"item": "<>", "category": "Hook", "done": true},
      {"item": "<>", "category": "Audio", "done": false},
      {"item": "<>", "category": "Quality", "done": true},
      {"item": "<>", "category": "Caption", "done": false},
      {"item": "<>", "category": "Hashtags", "done": true}
    ],
    "commonMistakes": [
      {"mistake": "<>", "fix": "<>"},
      {"mistake": "<>", "fix": "<>"},
      {"mistake": "<>", "fix": "<>"}
    ],
    "engagementBoostTips": ["<tip 1>", "<tip 2>", "<tip 3>"],
    "viralFormula": {
      "whatWorked": ["<strength>", "<strength>", "<strength>"],
      "whatToImprove": ["<weakness>", "<weakness>", "<weakness>"],
      "quickWins": ["<win>", "<win>", "<win>"]
    }${isYouTubeShorts ? `,
    "youtubePolicyCheck": {
      "overallStatus": "<Safe/Warning/At Risk>",
      "monetizationEligible": true/false,
      "issues": [
        {
          "policy": "<policy name>",
          "status": "<Pass/Warning/Violation>",
          "detail": "<specific explanation>",
          "recommendation": "<action>"
        }
      ],
      "copyrightRisk": {
        "musicUsed": "<original/popular track/no music/unknown>",
        "riskLevel": "<Low/Medium/High>",
        "explanation": "<why>"
      },
      "ageRestrictionLikely": true/false,
      "shortsMonetizationTips": ["<tip>", "<tip>", "<tip>"],
      "summary": "<2-3 sentence policy summary>"
    }` : ""}
  }
}`;

    // === ATTEMPT 1: Native Video Analysis (Gemini File API) ===
    let analysis: any = null;
    let usedVideoAnalysis = false;
    let geminiFileName: string | null = null;

    if (extractedVideoUrl) {
      console.log("STEP 4A: Attempting NATIVE VIDEO analysis...");
      const apiKeys = supabaseClient ? await getApiKeysFromDb(supabaseClient) : getApiKeysFromEnv();
      const videoApiKey = apiKeys[0];

      if (videoApiKey) {
        try {
          // 40s timeout for entire video pipeline
          const videoTimeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 40000));
          const videoAnalysisPromise = (async () => {
            // Step A: Download video
            const videoData = await downloadVideo(extractedVideoUrl, 20);
            if (!videoData) { console.log("Video download failed, will fallback"); return null; }

            // Step B: Upload to Gemini File API
            geminiFileName = await uploadToGeminiFileApi(videoData, videoApiKey);
            if (!geminiFileName) { console.log("File API upload failed, will fallback"); return null; }

            // Step C: Wait for ACTIVE state
            const fileUri = await waitForFileActive(geminiFileName, videoApiKey, 20000);
            if (!fileUri) { console.log("File not active in time, will fallback"); return null; }

            // Step D: Analyze with native video
            const videoSystemPrompt = `Expert ${platformName} viral analyst. You have the ACTUAL VIDEO file. Watch it completely. Return ONLY valid JSON. ${videoAnalysisDirective}`;
            const result = await callGeminiNativeVideo(fileUri, prompt, videoSystemPrompt, videoApiKey);
            return result;
          })();

          analysis = await Promise.race([videoAnalysisPromise, videoTimeoutPromise]);

          if (analysis) {
            usedVideoAnalysis = true;
            console.log("✅ Native video analysis SUCCEEDED");
          } else {
            console.log("Native video analysis failed or timed out, falling back to screenshot method");
          }
        } catch (e) {
          console.error("Video analysis pipeline error:", e);
        } finally {
          // Cleanup: delete file from Gemini
          if (geminiFileName) {
            const cleanupKey = (supabaseClient ? await getApiKeysFromDb(supabaseClient) : getApiKeysFromEnv())[0];
            if (cleanupKey) deleteGeminiFile(geminiFileName, cleanupKey).catch(() => {});
          }
        }
      }
    }

    // === ATTEMPT 2: Screenshot/Image-based Analysis (fallback) ===
    if (!analysis) {
      console.log("STEP 4B: Screenshot/image-based analysis...");
      const systemMsg = { role: "system", content: `Expert ${platformName} viral analyst. ${screenshotAnalysisDirective} Return ONLY valid JSON. No filler. Be specific, concise, actionable.` };

      async function tryAICall(includeImages: boolean): Promise<Response> {
        const userContent: any[] = [{ type: "text", text: prompt }];
        if (includeImages && imagesForVision.length > 0) {
          for (const imgUrl of imagesForVision) {
            userContent.push({ type: "image_url", image_url: { url: imgUrl } });
          }
          console.log(`Sending ${imagesForVision.length} image(s) to AI`);
        }
        const model = includeImages && imagesForVision.length > 0 ? "gemini-2.5-pro" : "gemini-2.5-flash";
        return await callGemini({
          model,
          messages: [systemMsg, { role: "user", content: userContent }],
        }, supabaseClient || undefined);
      }

      let response = await tryAICall(imagesForVision.length > 0);

      if (!response.ok && imagesForVision.length > 0) {
        const errText = await response.text();
        console.warn("AI call failed with images, retrying without:", response.status, errText);
        response = await tryAICall(false);
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);
        throw new Error("AI analysis failed");
      }

      const aiData = await response.json();
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No AI response content");

      analysis = safeParseAnalysisJson(content);
    }

    // Mark analysis method
    analysis._analysisMethod = usedVideoAnalysis ? "native_video" : (imagesForVision.length > 0 ? "screenshot" : "text_only");

    if (isYouTubeShorts && !analysis.premiumInsights?.youtubePolicyCheck) {
      analysis.premiumInsights = {
        ...(analysis.premiumInsights || {}),
        youtubePolicyCheck: {
          overallStatus: "Warning",
          monetizationEligible: false,
          issues: [
            {
              policy: "Policy review incomplete",
              status: "Warning",
              detail: "Full YouTube policy extraction was incomplete in this run, so review the Short manually before publishing.",
              recommendation: "Check music rights, reused clips, sensitive topics, and advertiser-friendly content before posting.",
            },
          ],
          copyrightRisk: {
            musicUsed: "unknown",
            riskLevel: "Medium",
            explanation: "Audio and third-party footage could not be verified with full confidence from the available metadata.",
          },
          ageRestrictionLikely: false,
          shortsMonetizationTips: [
            "Use original footage or properly licensed media.",
            "Avoid reused content without meaningful transformation.",
            "Keep the Short advertiser-friendly and brand-safe.",
          ],
          summary: "Policy review completed with limited source confidence. Double-check copyright, reused content, and advertiser-friendly safety before uploading.",
        },
      };
    }

    // === HARD CAP: Clamp all AI sub-scores to max 8 ===
    if (analysis.hookAnalysis) analysis.hookAnalysis.score = Math.min(8, analysis.hookAnalysis.score ?? 5);
    if (analysis.captionAnalysis) analysis.captionAnalysis.score = Math.min(8, analysis.captionAnalysis.score ?? 5);
    if (analysis.hashtagAnalysis) analysis.hashtagAnalysis.score = Math.min(8, analysis.hashtagAnalysis.score ?? 5);
    if (analysis.trendMatching) analysis.trendMatching.score = Math.min(8, analysis.trendMatching.score ?? 5);
    if (analysis.videoQuality) analysis.videoQuality.qualityScore = Math.min(8, analysis.videoQuality.qualityScore ?? 5);
    if (analysis.audioQuality) analysis.audioQuality.qualityScore = Math.min(8, analysis.audioQuality.qualityScore ?? 5);
    if (analysis.engagementScore) analysis.engagementScore = Math.min(8, analysis.engagementScore);
    if (analysis.viralScore) analysis.viralScore = Math.min(80, analysis.viralScore);

    // === VIRAL CLASSIFICATION ENGINE ===
    const m = metrics || {};
    const likesVal = m.likes ?? 0;
    const commentsVal = m.comments ?? 0;
    const viewsVal = m.views ?? 0;
    const engRate = viewsVal > 0 ? (likesVal + commentsVal) / viewsVal : 0;

    const isAlreadyViral = viewsVal > 100000 || engRate > 0.07 || likesVal > 10000;
    const isGrowing = viewsVal > 10000 || engRate > 0.03 || likesVal > 1000;

    const reasons: string[] = [];

    if (analysis.contentClassification) {
      const cc = analysis.contentClassification;
      if (cc.confidence === "high") reasons.push(`Content identified as ${cc.primaryCategory} (${cc.subCategory}) with high confidence`);
    }

    if (hasMetrics) {
      if (viewsVal > 100000) reasons.push("High view count (100K+) indicates strong reach");
      else if (viewsVal > 10000) reasons.push("Growing view count shows expanding reach");
      if (engRate > 0.07) reasons.push(`Strong engagement rate (${(engRate * 100).toFixed(2)}%) well above average`);
      else if (engRate > 0.03) reasons.push(`Decent engagement rate (${(engRate * 100).toFixed(2)}%)`);
      if (likesVal > 10000) reasons.push("High like count signals strong audience approval");
      else if (likesVal > 1000) reasons.push("Growing likes indicate audience interest");
      if (commentsVal > 500) reasons.push("Active comment section shows high audience engagement");
      else if (commentsVal > 50) reasons.push("Good comment activity");
    }
    if (analysis.hookAnalysis?.score >= 7) reasons.push("Effective hook grabs attention in first 3 seconds");
    if (analysis.captionAnalysis?.score >= 7) reasons.push("Strong caption drives curiosity and engagement");
    if (analysis.hashtagAnalysis?.score >= 7) reasons.push("Well-optimized hashtag strategy");
    if (analysis.trendMatching?.score >= 7) reasons.push("Content aligns with current viral trends");

    // === VIRALITY INSIGHTS ===
    const viralityInsights: { factor: string; detected: boolean; impact: string; score: number; reason: string; solution: string }[] = [];

    // === QUALITY BONUS/PENALTY ===
    let qualityBonus = 0;
    const vq = analysis.videoQuality;
    if (vq) {
      const vqScore = vq.qualityScore ?? 5;
      if (vqScore >= 7) {
        qualityBonus += 5;
        reasons.push("High video quality boosts viewer retention");
        viralityInsights.push({ factor: "Video Quality", detected: true, impact: "positive", score: 5, reason: "High quality video keeps viewers watching longer", solution: "Maintain this quality. Use natural light or ring light." });
      } else if (vqScore >= 5) {
        qualityBonus += 2;
      } else {
        qualityBonus -= 5;
        reasons.push("Low video quality may reduce viewer retention");
        viralityInsights.push({ factor: "Video Quality", detected: true, impact: "negative", score: -5, reason: "Low quality footage causes viewers to scroll away", solution: "Record in HD (1080p), use stable mounting, ensure proper lighting." });
      }
    }
    const aq = analysis.audioQuality;
    if (aq) {
      const aqScore = aq.qualityScore ?? 5;
      if (aqScore >= 7) { qualityBonus += 4; reasons.push("Clean audio quality enhances engagement"); }
      else if (aqScore >= 5) { qualityBonus += 2; }
      else { qualityBonus -= 5; reasons.push("Poor audio quality may cause viewers to skip"); }
    }
    qualityBonus = Math.max(-10, Math.min(10, qualityBonus));

    // === CONTENT CATEGORY BONUS ===
    let categoryBonus = 0;
    const cc = analysis.contentClassification;
    if (cc) {
      const highViralCategories = ["comedy", "entertainment", "music", "grwm", "cars", "bikes", "dance", "fashion", "motivation", "fitness", "storytelling", "memes"];
      const lowViralCategories = ["education", "learning", "tutorial", "educational"];
      const catLower = cc.primaryCategory?.toLowerCase() || "";
      const contentTypeLower = cc.contentType?.toLowerCase() || "";

      if (highViralCategories.includes(catLower)) {
        categoryBonus += 5;
        reasons.push(`${cc.primaryCategory} content has higher viral potential on Instagram`);
        viralityInsights.push({ factor: "Content Category", detected: true, impact: "positive", score: 5, reason: `${cc.primaryCategory} is viral-friendly on Instagram`, solution: "Keep creating in this niche with trending formats." });
      } else if (lowViralCategories.includes(catLower) || lowViralCategories.includes(contentTypeLower)) {
        categoryBonus -= 4;
        reasons.push("Educational content has lower viral potential on Instagram");
        viralityInsights.push({ factor: "Content Category", detected: true, impact: "negative", score: -4, reason: "Educational content gets less shares on Instagram", solution: "Make it entertaining — use humor, storytelling, quick cuts, trending audio." });
      }
      if (cc.hashtagAlignment?.toLowerCase().startsWith("yes")) categoryBonus += 2;
      else if (cc.hashtagAlignment?.toLowerCase().startsWith("no")) {
        categoryBonus -= 3;
        reasons.push("Hashtags don't match actual content");
        viralityInsights.push({ factor: "Hashtag-Content Mismatch", detected: true, impact: "negative", score: -3, reason: "Unrelated hashtags confuse the algorithm", solution: "Use hashtags that match your video content directly." });
      }
    }
    categoryBonus = Math.max(-7, Math.min(7, categoryBonus));

    // === VIRALITY FACTORS BONUS (updated: no "attractivePresenter") ===
    let viralityFactorsBonus = 0;
    const vf = analysis.viralityFactors;
    if (vf) {
      if (vf.recognizablePerson) {
        viralityFactorsBonus += 8;
        reasons.push("Recognizable person detected — significantly increases viral potential");
        viralityInsights.push({ factor: "Recognizable Person", detected: true, impact: "positive", score: 8, reason: "Content featuring recognizable personalities gets 3-5x more shares", solution: "Tag the person, use their trending hashtags." });
      }
      if (vf.strongFacialExpression) {
        viralityFactorsBonus += 2;
        viralityInsights.push({ factor: "Strong Facial Expression", detected: true, impact: "positive", score: 2, reason: "Dramatic facial expressions create emotional connection and stop the scroll", solution: "Use expressive reactions — surprise, excitement, shock — in opening frames." });
      }
      if (vf.strongVisualSubject) {
        viralityFactorsBonus += 3;
        viralityInsights.push({ factor: "Strong Visual Subject", detected: true, impact: "positive", score: 3, reason: "Visually compelling subjects hold attention and increase saves/shares", solution: "Lead with the most visually striking element in the first frame." });
      }
      if (vf.famousPlaceOrObject) {
        viralityFactorsBonus += 5;
        reasons.push("Famous place/object detected — increases viewer interest");
        viralityInsights.push({ factor: "Famous Place/Object", detected: true, impact: "positive", score: 5, reason: "Iconic locations and objects create aspirational content", solution: "Use location tags and location-specific hashtags." });
      }
      if (vf.deepVoiceLikely) {
        viralityFactorsBonus += 3;
        reasons.push("Deep/bass voice narration enhances engagement");
      }
      if (vf.famousIncident) {
        viralityFactorsBonus += 6;
        reasons.push("Content relates to a trending incident — high share potential");
        viralityInsights.push({ factor: "Trending Incident", detected: true, impact: "positive", score: 6, reason: "Trending news drives massive search traffic and shares", solution: "Post as quickly as possible. First-mover advantage is key." });
      }
      const trendRelevance = vf.trendingTopicRelevance?.toLowerCase();
      if (trendRelevance === "high") {
        viralityFactorsBonus += 7;
        reasons.push("Highly relevant to current trending topics");
        viralityInsights.push({ factor: "Trending Topic", detected: true, impact: "positive", score: 7, reason: "Trending content gets algorithmic boost to Explore page", solution: "Ride this trend with multiple variations quickly." });
      } else if (trendRelevance === "medium") {
        viralityFactorsBonus += 4;
        reasons.push("Moderately relevant to trending topics");
      }
    }

    // Additional content signals from video signals
    const vs = analysis.videoSignals;
    if (vs) {
      if (vs.facePresenceLikely?.toLowerCase().includes("yes")) {
        viralityFactorsBonus += 2;
        viralityInsights.push({ factor: "Face in Thumbnail", detected: true, impact: "positive", score: 2, reason: "Reels with faces get 38% more clicks", solution: "Show your face clearly in the first frame." });
      }
      if (vs.textOverlayLikely?.toLowerCase().includes("yes")) {
        viralityFactorsBonus += 2;
        viralityInsights.push({ factor: "Text Overlay", detected: true, impact: "positive", score: 2, reason: "On-screen text stops the scroll", solution: "Keep text hooks 5-7 words max with bold fonts." });
      }
      if (vs.motionIntensity?.toLowerCase() === "high") {
        viralityFactorsBonus += 2;
      } else if (vs.motionIntensity?.toLowerCase() === "low") {
        viralityInsights.push({ factor: "Low Motion", detected: true, impact: "negative", score: -1, reason: "Static content has higher drop-off", solution: "Add camera movement, zoom transitions, or text animations." });
      }
    }

    if (aq?.musicUsage?.toLowerCase() === "trending") {
      viralityFactorsBonus += 3;
      reasons.push("Trending background music boosts reach");
      viralityInsights.push({ factor: "Trending Music", detected: true, impact: "positive", score: 3, reason: "Instagram algorithm promotes trending audio content 2-3x", solution: "Use audio within first 48 hours of it trending." });
    }

    // Humor/memes/pets detection
    if (cc) {
      const catLower = cc.primaryCategory?.toLowerCase() || "";
      const subCatLower = cc.subCategory?.toLowerCase() || "";
      const topicLower = cc.detectedElements?.estimatedTopic?.toLowerCase() || "";

      if (catLower.includes("meme") || subCatLower.includes("meme") || subCatLower.includes("humor") || topicLower.includes("funny")) {
        viralityFactorsBonus += 3;
      }
      if (topicLower.includes("pet") || topicLower.includes("dog") || topicLower.includes("cat") || topicLower.includes("animal")) {
        viralityFactorsBonus += 3;
      }
      if (topicLower.includes("challenge") || topicLower.includes("trend") || topicLower.includes("festival")) {
        viralityFactorsBonus += 3;
      }
    }

    viralityFactorsBonus = Math.max(0, Math.min(18, viralityFactorsBonus));

    // === AGE PENALTY ===
    let agePenalty = 0;
    let resolvedPostDate: Date | null = null;
    let daysSincePost: number | null = null;

    // Use regex-extracted postDate or AI's _postDate
    const dateStr = postDate || analysis._postDate;
    if (dateStr) {
      const pd = new Date(dateStr);
      if (!isNaN(pd.getTime())) resolvedPostDate = pd;
    }

    if (resolvedPostDate) {
      const now = new Date();
      daysSincePost = (now.getTime() - resolvedPostDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSincePost <= 2) {
        agePenalty = 0;
        viralityInsights.push({ factor: "Reel Age (Fresh)", detected: true, impact: "positive", score: 0, reason: "Reel is fresh (0-2 days) — peak viral window", solution: "Maximize engagement NOW. Reply to every comment, share to stories." });
      } else if (daysSincePost <= 5) {
        agePenalty = -Math.round((daysSincePost - 2) * 2);
        reasons.push(`Reel is ${Math.round(daysSincePost)} days old — viral window narrowing`);
      } else if (daysSincePost <= 7) {
        agePenalty = -Math.round(6 + (daysSincePost - 5) * 2);
        reasons.push(`Reel is ${Math.round(daysSincePost)} days old — viral potential declining`);
      } else if (daysSincePost <= 15) {
        agePenalty = -Math.round(10 + (daysSincePost - 7) * 1.5);
        reasons.push(`Reel is ${Math.round(daysSincePost)} days old — viral chance very low`);
      } else {
        agePenalty = -Math.round(Math.min(25, 22 + (daysSincePost - 15) * 0.3));
        reasons.push(`Reel is ${Math.round(daysSincePost)}+ days old — viral window passed`);
      }
    }

    if (daysSincePost !== null && daysSincePost > 7 && hasMetrics && !isAlreadyViral && !isGrowing) {
      agePenalty -= 5;
    }

    // === PATTERN MATCHING ===
    let patternBonus = 0;
    let patternComparison = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const category = cc?.primaryCategory?.toLowerCase() || "other";
      const patterns = await fetchViralPatterns(category, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      patternComparison = compareWithPatterns(analysis, patterns);

      if (patternComparison.similarityScore !== null) {
        if (patternComparison.similarityScore >= 70) { patternBonus = 8; reasons.push(`High match (${patternComparison.similarityScore}%) with proven viral patterns`); }
        else if (patternComparison.similarityScore >= 40) { patternBonus = 4; reasons.push(`Moderate match (${patternComparison.similarityScore}%) with viral patterns`); }
        else { patternBonus = -3; }
      }
    }
    patternBonus = Math.max(-8, Math.min(8, patternBonus));

    // Hook insights
    const hookScore = analysis.hookAnalysis?.score ?? 5;
    if (hookScore >= 7) {
      viralityInsights.push({ factor: "Strong Hook", detected: true, impact: "positive", score: 3, reason: "Powerful opening stops the scroll", solution: "Keep using strong hooks. Test question, shock, and visual types." });
    } else if (hookScore <= 3) {
      viralityInsights.push({ factor: "Weak Hook", detected: true, impact: "negative", score: -2, reason: "Weak opening causes 60-70% drop in first 2 seconds", solution: "Start with bold text, surprising visual, or provocative question." });
    }

    analysis._viralityInsights = viralityInsights;
    analysis._daysSincePost = daysSincePost;

    let viralStatus, viralScore, viralLabel;
    const totalBonus = qualityBonus + categoryBonus + patternBonus + viralityFactorsBonus + agePenalty;

    if (hasMetrics && isAlreadyViral) {
      viralStatus = "Already Viral";
      viralScore = Math.min(80, Math.max(55, Math.round(60 + (engRate * 100) + totalBonus)));
      viralLabel = "Viral Strength";
    } else if (hasMetrics && isGrowing) {
      viralStatus = "Growing";
      const hookS = (analysis.hookAnalysis?.score ?? 5) / 8;
      const capS = (analysis.captionAnalysis?.score ?? 5) / 8;
      const hashS = (analysis.hashtagAnalysis?.score ?? 5) / 8;
      const engS = Math.min(1, engRate / 0.07);
      const comS = Math.min(1, commentsVal / 500);
      viralScore = Math.min(80, Math.max(5, Math.round((hookS * 25 + capS * 15 + hashS * 10 + engS * 20 + comS * 10) + totalBonus)));
      viralLabel = "Viral Potential";
    } else {
      // Low metrics or no metrics — weight content quality much higher
      const hookS = (analysis.hookAnalysis?.score ?? 5) / 8;
      const capS = (analysis.captionAnalysis?.score ?? 5) / 8;
      const hashS = (analysis.hashtagAnalysis?.score ?? 5) / 8;
      const trendS = (analysis.trendMatching?.score ?? 5) / 8;

      if (hasMetrics) {
        // Has metrics but low — content quality is primary, metrics provide small signal
        // Use diminishing returns so low metrics don't crush the score
        const engS = Math.min(1, engRate / 0.04);
        const viewS = viewsVal > 0 ? Math.min(1, Math.log10(viewsVal + 1) / Math.log10(10000)) : 0;
        const likeS = likesVal > 0 ? Math.min(1, Math.log10(likesVal + 1) / Math.log10(5000)) : 0;
        const comS = commentsVal > 0 ? Math.min(1, Math.log10(commentsVal + 1) / Math.log10(500)) : 0;

        // Content quality weighted 70%, metrics 30% for low-metric reels
        viralScore = Math.min(80, Math.max(8, Math.round(
          (hookS * 20 + capS * 16 + hashS * 12 + trendS * 12 + engS * 8 + viewS * 6 + likeS * 4 + comS * 2) + totalBonus
        )));

        // More nuanced status for low-view reels
        if (viralScore >= 45) {
          viralStatus = "High Potential";
        } else if (viralScore >= 30) {
          viralStatus = "Growing Potential";
        } else {
          viralStatus = "Needs Improvement";
        }

        if (viewsVal > 0 && viewsVal < 1000) {
          reasons.push("Low view count — reel is still in early distribution phase, content quality can still push it");
        }
        if (likesVal > 0 && likesVal < 100 && engRate > 0.02) {
          reasons.push("Decent engagement rate despite low reach — algorithm may still push this content");
        } else if (likesVal > 0 && likesVal < 100) {
          reasons.push("Low engagement — stronger hook and better hashtags could improve reach");
        }
      } else {
        // No metrics at all — pure content quality analysis
        viralScore = Math.min(80, Math.max(12, Math.round(
          (hookS * 25 + capS * 20 + hashS * 15 + trendS * 20) + totalBonus
        )));
        if (viralScore >= 45) {
          viralStatus = "High Potential";
        } else if (viralScore >= 30) {
          viralStatus = "Growing Potential";
        } else {
          viralStatus = "Needs Improvement";
        }
        if (reasons.length === 0) {
          if (analysis.hookAnalysis?.score >= 5) reasons.push("Decent hook potential");
          if (analysis.captionAnalysis?.score >= 5) reasons.push("Caption has engagement potential");
          reasons.push("Metrics could not be extracted — score based on content analysis only");
        }
      }
      viralLabel = "Viral Potential";
    }

    viralScore = Math.min(80, viralScore);

    analysis.viralClassification = {
      status: viralStatus,
      score: viralScore,
      label: viralLabel,
      reasons: reasons.slice(0, 10),
      engagementRate: hasMetrics && viewsVal > 0 ? engRate : undefined,
    };

    analysis.thumbnailAnalyzed = !!imageForVision;
    analysis.patternComparison = patternComparison;

    // Store pattern + log in background
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      storePattern(analysis, url, metrics, caption || "", hashtags || "", SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        .catch(e => console.error("Background pattern store failed:", e));

      const logSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      logSupabase.from("api_usage_logs").insert({
        function_name: "analyze-reel",
        ai_model: usedVideoAnalysis ? "gemini-2.5-flash-video" : (imagesForVision.length > 0 ? "gemini-2.5-pro" : "gemini-2.5-flash"),
        ai_provider: "google",
        is_ai_call: true,
        estimated_cost: 0.002,
        tokens_used: 3000,
        status_code: 200,
        duration_ms: 0,
      }).then(() => {}).catch(e => console.error("Usage log failed:", e));
    }

    // === CACHE THE RESULT for consistent scoring ===
    urlCache.set(cacheKey, { result: analysis, timestamp: Date.now() });

    // === DECREMENT CONCURRENCY ===
    activeAnalyses = Math.max(0, activeAnalyses - 1);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // === DECREMENT CONCURRENCY ON ERROR ===
    activeAnalyses = Math.max(0, activeAnalyses - 1);

    console.error("analyze-reel error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    
    // Return specific error codes for circuit breaker
    if (errMsg === "CIRCUIT_OPEN") {
      return new Response(JSON.stringify({ 
        success: false, error: "CIRCUIT_OPEN", 
        message: "AI service temporarily unavailable. Please try again in 30 seconds." 
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
