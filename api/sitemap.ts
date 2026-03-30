import { createClient } from "@supabase/supabase-js";
import { SEO_ARTICLES } from "../src/lib/seoArticles";

const BASE_URL = "https://reelsanylizer.in";

const staticPages: string[] = [
  "/",
  "/youtube-analyzer",
  "/seo-optimizer",
  "/reel-analyzer",
  "/instagram-reel-analyzer",
  "/reel-seo-optimizer",
  "/reel-hashtag-generator",
  "/reel-caption-generator",
  "/reel-title-generator",
  "/reel-viral-checker",
  "/reel-engagement-calculator",
  "/blog",
  "/about",
  "/privacy-policy",
  "/terms",
  "/contact",
  "/sitemap-page",
  "/partnership",
  "/collaboration",
  "/promotion",
  "/pricing",
];

const staticBlogSlugs: string[] = [
  "best-reel-hooks-that-go-viral",
  "how-to-analyze-instagram-reels",
  "best-hashtags-for-instagram-reels",
  "instagram-reel-growth-strategy",
  "how-reel-seo-works",
];

const staticGuideSlugs = Object.keys(SEO_ARTICLES);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

async function fetchSupabaseSlugs(table: string, column: string): Promise<string[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from(table).select(column).not(column, "is", null);
    if (error || !data) return [];
    return data
      .map((row: Record<string, string | null>) => row[column])
      .filter((slug): slug is string => Boolean(slug));
  } catch (err) {
    console.error("Failed to fetch slugs", err);
    return [];
  }
}

function unique(list: string[]): string[] {
  return Array.from(new Set(list));
}

function buildUrlEntries(paths: string[]) {
  return paths.map(
    (path) =>
      `<url><loc>${BASE_URL}${path}</loc><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.7"}</priority></url>`
  );
}

export default async function handler(_req: any, res: any) {
  const [guideSlugsFromDb, blogSlugsFromDb] = await Promise.all([
    fetchSupabaseSlugs("guides", "slug"),
    fetchSupabaseSlugs("blog_posts", "slug"),
  ]);

  const guidePaths = unique(staticGuideSlugs.concat(guideSlugsFromDb)).map((slug) => `/guides/${slug}`);
  const blogPaths = unique(staticBlogSlugs.concat(blogSlugsFromDb)).map((slug) => `/blog/${slug}`);

  const urls = [
    ...buildUrlEntries(staticPages),
    ...buildUrlEntries(guidePaths),
    ...buildUrlEntries(blogPaths),
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
  res.status(200).send(xml);
}
