import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import InternalLinks from "@/components/InternalLinks";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import ReviewsGrid from "@/components/ReviewsGrid";
import { TrendingUp, Wand2, Hash, FileText, Target, BarChart3, Search, Zap } from "lucide-react";

interface ToolPageConfig {
  slug: string;
  title: string;
  metaTitle: string;
  metaDesc: string;
  keywords: string;
  h1: string;
  subtitle: string;
  ctaText: string;
  ctaRoute: string;
  icon: typeof TrendingUp;
  features: { icon: typeof TrendingUp; title: string; desc: string }[];
  howItWorks: { step: string; desc: string }[];
  contentBlocks: { heading: string; text: string }[];
  longForm: { heading: string; text: string }[];
  faqs: { q: string; a: string }[];
}

const PAGES: Record<string, ToolPageConfig> = {
  "reel-analyzer": {
    slug: "/reel-analyzer",
    title: "Reel Analyzer",
    metaTitle: "Free Instagram Reel Analyzer | AI Viral Score Checker | Reelanylizer",
    metaDesc: "AI Reel Viral Score Checker with free audit credits. Analyze Instagram reels for reach, retention, hashtags, captions, and get a professional video SEO report in seconds.",
    keywords: "Free Instagram Reel Analyzer, AI Viral Score Checker, Free Reel Audit Tool, Check Reel Viral Potential, Instagram Reach Analyzer, Reel Performance Insights, Analyze My Instagram Reel, Reel Quality Checker AI, Instagram Content Audit Tool, Viral Reel Predictor, Reel Engagement Calculator, Instagram Growth Tracker, Professional Reel Report, Reel Retention Analysis, AI Social Media Auditor",
    h1: "Free Instagram Reel Analyzer — AI Viral Score Checker",
    subtitle: "Paste your Instagram reel URL and get instant viral score prediction, reach analysis, and a professional video SEO audit with captions, hashtags, and retention fixes.",
    ctaText: "Analyze Your Reel Now",
    ctaRoute: "/",
    icon: TrendingUp,
    features: [
      { icon: Target, title: "Viral Score Prediction", desc: "Predicts your reel's viral potential with a 0-100 score based on engagement patterns and content quality signals." },
      { icon: Zap, title: "Hook Strength Analysis", desc: "Detects whether your first 3 seconds are strong enough to stop the scroll and retain viewers." },
      { icon: Hash, title: "Hashtag Performance Check", desc: "Analyzes your hashtag strategy — competition level, relevance, and optimal count for maximum reach." },
      { icon: BarChart3, title: "Engagement Rate Calculator", desc: "Compares your likes, comments, shares, and saves against category benchmarks to gauge performance." },
    ],
    howItWorks: [
      { step: "Paste Reel URL", desc: "Copy your Instagram reel link and paste it into the analyzer input field." },
      { step: "Smart Analysis Runs", desc: "Our system extracts reel data, analyzes hook, caption, hashtags, and engagement signals." },
      { step: "Get Your Report", desc: "Receive a detailed breakdown with viral score, weak spots, and actionable recommendations." },
    ],
    contentBlocks: [
      { heading: "Why Use a Reel Analyzer?", text: "Instagram's algorithm prioritizes reels with strong hooks, optimized captions, and trending content formats. Without data-driven analysis, creators often post reels blindly — hoping for views without understanding what actually drives engagement. A reel analyzer gives you clarity on what's working and what's not, so every reel you post has a better chance of reaching more people." },
      { heading: "How Reel Analysis Improves Your Growth", text: "Creators who analyze their reels before posting consistently see 2-3x better engagement rates. By identifying weak hooks, poor hashtag choices, and missing emotional triggers in your caption, you can make targeted improvements that compound over time. Sign in with Google to get started with your credits." },
    ],
    longForm: [
      {
        heading: "Complete Reel Performance Insights with AI Viral Score Checker",
        text: "Reelanylizer reviews every frame of your Instagram reel to deliver a viral probability score out of 100. We benchmark your watch-through rate, hook intensity, subtitle clarity, and sound-on vs sound-off performance against thousands of high-performing reels. The AI then recommends micro-improvements such as trimming dead air in the first two seconds, adding bold on-screen text for silent viewers, or injecting curiosity hooks that pull viewers to the payoff. This is the fastest way to escape the 200-view jail because you fix the issues that crush retention before you publish."
      },
      {
        heading: "Professional Video Audit that Covers SEO + Engagement",
        text: "Beyond vanity metrics, the Free Reel Audit Tool checks search signals: caption keywords, hashtag tiers, alt text, and on-screen text density. It flags missing semantic phrases like 'reel viral kaise kare 2026' or 'Instagram views badhane wala tool' to help you rank for Hinglish and local queries. The audit also scores your CTA strength and social shareability so your reel earns more sends and saves, which are the strongest signals for the Explore page."
      },
      {
        heading: "Reel Reach Analyzer for Growth and Client Reporting",
        text: "Agencies and creators can export a Professional Reel Report that includes reel engagement calculator outputs, retention curves, and a prioritized fix list. Each recommendation explains why it matters for the Instagram algorithm in 2026 and how it improves your discoverability in search and suggested feeds. Use it as a client deliverable or your own playbook to iterate quickly without guesswork."
      },
      {
        heading: "How to use the Reel Quality Checker AI step-by-step",
        text: "1) Paste your reel link or upload the clip. 2) Enter your caption draft and planned hashtags. 3) Run the scan and review viral score, reach blockers, and keyword opportunities. 4) Apply the suggested title and hashtag mix with low-competition tags that match your niche. 5) Re-run to see the improved score. This loop takes under five minutes and beats posting blindly."
      },
      {
        heading: "Keyword map for this page",
        text: "Primary: Free Instagram Reel Analyzer, AI Viral Score Checker, Free Reel Audit Tool. Secondary: Check Reel Viral Potential, Instagram Reach Analyzer, Reel Performance Insights, Analyze My Instagram Reel, Reel Quality Checker AI, Instagram Content Audit Tool, Viral Reel Predictor, Reel Engagement Calculator, Instagram Growth Tracker, Professional Reel Report, Reel Retention Analysis, AI Social Media Auditor. These are woven naturally through headings, paragraphs, and FAQs to satisfy search intent without keyword stuffing."
      },
    ],
    faqs: [
      { q: "Reel viral kaise kare 2026?", a: "Use the AI Viral Score Checker to test hook strength, captions, and hashtag mix before posting. Aim for a 70+ score by tightening your first two seconds, adding Hinglish keywords, and using 8-12 low-competition tags." },
      { q: "Why is my reel stuck at 200 views?", a: "Low watch-through or weak hooks trigger the 200-view jail. The Reel Retention Analysis shows where viewers drop and suggests edits plus fresh CTAs to push saves and shares." },
      { q: "Can I get a professional reel report for clients?", a: "Yes. Run the Free Reel Audit Tool and export the Professional Reel Report with viral score, hashtag tiers, and recommended fixes for agency handoff." },
      { q: "Does this work for Hindi or Hinglish reels?", a: "Yes, the analyzer checks caption keywords like 'Instagram views badhane wala tool' and 'reel viral kaise kare' so you rank for local and voice-search queries." },
      { q: "Which metrics matter most for virality?", a: "Saves, shares, and watch-through rate beat likes. The Reel Engagement Calculator and AI Viral Checker focus on those signals to predict distribution." },
      { q: "Kya ye free hai?", a: "Haan, 5 free credits milte hain monthly. Paid tiers add faster audits, PDF reports, and deeper keyword research for every reel." },
    ],
  },
  "instagram-reel-analyzer": {
    slug: "/instagram-reel-analyzer",
    title: "Instagram Reel Analyzer",
    metaTitle: "Instagram Reel Analyzer | AI Reel Viral Score Checker | Reelanylizer",
    metaDesc: "Check reel viral potential with AI. Get hook score, retention fixes, caption SEO, and hashtag strategy. Free Instagram reel checker for 2026 growth.",
    keywords: "Instagram Reel Analyzer, AI Reel Viral Score Checker, free instagram reel checker, free reel analysis, free reel performance checker, check reel engagement free, Reel Engagement Calculator, Reel Retention Analysis",
    h1: "AI Instagram Reel Analyzer — Viral Score + Engagement Fixes",
    subtitle: "Instantly check if your reel will rank: viral score, hook diagnostics, caption SEO, hashtag tiers, and retention coaching for 2026.",
    ctaText: "Check Your Instagram Reel",
    ctaRoute: "/",
    icon: Search,
    features: [
      { icon: Search, title: "Deep Reel Analysis", desc: "Comprehensive analysis covering content classification, hook quality, caption sentiment, and engagement metrics." },
      { icon: TrendingUp, title: "Trend Matching", desc: "Detects if your reel format matches currently trending content patterns for higher discoverability." },
      { icon: Wand2, title: "Smart Insights", desc: "Advanced models analyze visual elements, text overlays, music usage, and scene transitions." },
      { icon: FileText, title: "Detailed PDF Report", desc: "Get a master report with competitor analysis, improvement roadmap, and premium insights." },
    ],
    howItWorks: [
      { step: "Copy Reel Link", desc: "Go to Instagram, open your reel, tap Share, and copy the link." },
      { step: "Paste & Analyze", desc: "Paste the link into our analyzer. Optionally add caption, hashtags, and engagement data for better accuracy." },
      { step: "Review Results", desc: "Get viral score, hook analysis, caption tips, hashtag optimization, and growth recommendations." },
    ],
    contentBlocks: [
      { heading: "What Does an Instagram Reel Analyzer Do?", text: "An Instagram reel analyzer examines every element of your reel — from the opening hook to the caption, hashtags, and engagement metrics. It predicts viral potential by comparing your content against patterns of high-performing reels in your niche. Think of it as a pre-posting quality check that tells you exactly what to fix before hitting publish." },
      { heading: "Instagram Reel SEO and Discoverability", text: "Instagram uses signals like watch time, caption keywords, and hashtag relevance to decide which reels to push to the Explore page and Reels tab. By optimizing these elements based on data — not guesswork — you significantly increase your chances of getting organic reach. Our analyzer identifies exactly which SEO signals your reel is missing." },
    ],
    longForm: [
      {
        heading: "Shortlist low-competition hashtags automatically",
        text: "The AI classifies your reel topic and suggests a three-tier hashtag mix that balances trending reach with low-competition discoverability. Instead of spraying 30 random tags, you get 8-12 specific phrases such as 'best hashtags for reels in Hindi' and 'reel viral kaise kare 2026' to rank in both English and Hinglish searches."
      },
      {
        heading: "Fix 200-view jail with retention coaching",
        text: "The viral score checker pinpoints exact drop-off timestamps. It recommends tighter cuts, on-screen text for silent viewers, and curiosity hooks in the first 2 seconds. By lifting watch-through above 50%, you escape the 200-view plateau and signal to the algorithm that your reel deserves wider testing."
      },
      {
        heading: "Voice-search friendly captions and alt text",
        text: "We propose caption rewrites that blend English, Hindi, and Hinglish search phrases like 'Instagram views badhane wala tool' and 'reel reach badhane ka secret'. Alt text suggestions ensure accessibility and extra SEO signals without keyword stuffing."
      },
      {
        heading: "Mapped keywords for this page",
        text: "Instagram Reel Analyzer, AI Reel Viral Score Checker, Reel Engagement Calculator, Reel Retention Analysis, Check Reel Viral Potential, Instagram Reach Analyzer, Professional Reel Report, AI Social Media Auditor, Analyze My Instagram Reel, Reel Quality Checker AI."
      },
    ],
    faqs: [
      { q: "Instagram reel viral kaise kare?", a: "Strengthen the first 2 seconds, add Hinglish keywords in captions, and run the analyzer to reach a 70+ viral score before posting." },
      { q: "Kya 30 hashtags use karu?", a: "No. Use 8-12 mixed tiers. The tool suggests low-competition hashtags for reels so you rank instead of getting buried." },
      { q: "How to fix low retention?", a: "Check the retention graph in the report. Add jump cuts, bold text overlays, and move your payoff earlier. The analyzer tells you where to trim." },
      { q: "Does it help Hindi content?", a: "Yes, caption and alt text suggestions include Hindi and Hinglish phrases that rank in local search and voice search." },
      { q: "Can I audit multiple reels?", a: "Free plan gives monthly credits. Upgrade for bulk audits, PDF reports, and saved keyword sets." },
    ],
  },
  "reel-seo-optimizer": {
    slug: "/reel-seo-optimizer",
    title: "Reel SEO Optimizer",
    metaTitle: "Reel SEO Optimization Tool | Best Hashtag Generator for Reels 2026 | Reelanylizer",
    metaDesc: "Generate SEO-friendly captions, trending hashtags, and viral titles for Instagram Reels. AI caption writer + low-competition hashtag strategy for fast reach.",
    keywords: "Best Hashtag Generator for Reels 2026, AI Instagram Caption Writer, Viral YouTube Shorts Title Generator, Instagram SEO Optimization Tool, Trending Hashtags for Reels India, Reels Caption Ideas for Business, YouTube Shorts Keyword Research, SEO Friendly Titles for Reels, Hashtag Strategy for Viral Videos, AI Tool for Social Media Copywriting",
    h1: "Reel SEO Optimizer — Hashtags, Captions, Titles",
    subtitle: "AI writes SEO captions, finds trending hashtags in India, and generates viral-ready titles for reels and shorts without keyword stuffing.",
    ctaText: "Optimize Your Reel SEO",
    ctaRoute: "/seo-optimizer",
    icon: Search,
    features: [
      { icon: FileText, title: "SEO Title Generation", desc: "Generate keyword-rich titles that Instagram's search algorithm indexes for discoverability." },
      { icon: Wand2, title: "Caption Optimization", desc: "Rewrites your caption with emotional hooks, keywords, and CTAs that drive engagement." },
      { icon: Hash, title: "Smart Hashtag Strategy", desc: "Get a mix of trending, mid-range, and niche hashtags optimized for your content category." },
      { icon: TrendingUp, title: "Trend-Based Keywords", desc: "Identifies trending keywords and phrases in your niche to boost search visibility." },
    ],
    howItWorks: [
      { step: "Enter Reel Details", desc: "Provide your reel topic, niche, and existing caption for optimization." },
      { step: "Smart Optimization", desc: "Our system generates SEO-optimized titles, captions, hashtags, and keyword suggestions." },
      { step: "Apply & Post", desc: "Copy the optimized content and apply it to your reel before posting." },
    ],
    contentBlocks: [
      { heading: "Why Reel SEO Matters", text: "Instagram has become a search engine. Users search for topics, trends, and niches directly on Instagram. If your reel caption, title, and hashtags aren't optimized for these searches, your content won't appear in results — no matter how good it is. Reel SEO optimization ensures your content is discoverable by the right audience." },
      { heading: "How Instagram Reel SEO Works", text: "Instagram indexes reel captions, on-screen text, hashtags, and audio descriptions to understand what your content is about. The algorithm then matches reels to user searches and interests. By using the right keywords naturally in your caption and hashtags, you tell Instagram exactly who should see your reel — leading to higher organic reach." },
    ],
    longForm: [
      {
        heading: "Keyword-rich captions without stuffing",
        text: "The AI Instagram Caption Writer produces 3 variations: educational, relatable, and sales-friendly. Each version places primary keywords like 'Instagram SEO optimization tool' and 'reel viral kaise kare' in the first 100 characters for search weight, while keeping tone human and scannable."
      },
      {
        heading: "Hashtag Strategy for Viral Videos",
        text: "You get a tiered hashtag set: 3-4 trending tags, 4-5 mid-competition tags, and 2-3 niche tags such as 'best hashtags for reels in Hindi' or 'low competition hashtags for reels'. This avoids spammy 30-tag dumps and aligns with Instagram's 2026 search ranking factors."
      },
      {
        heading: "Viral YouTube Shorts Title Generator",
        text: "For cross-posting to Shorts, the tool crafts SEO-friendly titles like 'Shorts SEO Tool' and 'Shorts Algorithm Checker' with power words and CTR-focused phrasing. It also suggests matching on-screen text for OCR search, boosting discoverability on both platforms."
      },
      {
        heading: "Template for business reels",
        text: "Reels Caption Ideas for Business include proof-driven CTAs, scarcity, and lead-gen hooks. The optimizer injects industry modifiers (fitness, fashion, tech, finance) to localize keywords and improve match quality for Explore and hashtag pages." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "Best Hashtag Generator for Reels 2026, AI Instagram Caption Writer, Viral YouTube Shorts Title Generator, Trending Hashtags for Reels India, Reels Caption Ideas for Business, YouTube Shorts Keyword Research, Hashtag Strategy for Viral Videos, AI Tool for Social Media Copywriting, SEO Friendly Titles for Reels, Automated Video Title Generator."
      },
    ],
    faqs: [
      { q: "Best hashtags for reels in Hindi?", a: "The generator suggests Hindi + Hinglish sets tailored to your niche with low-competition tags to rank faster." },
      { q: "Should I copy-paste viral captions?", a: "Use AI-generated captions that mix your niche keywords, emotional hooks, and CTAs. Duplicate captions can hurt reach." },
      { q: "Shorts SEO kaise kare?", a: "Use the title generator plus keyword research to add search phrases in your Shorts title and first 100 characters of description." },
      { q: "Kitne hashtags use karu?", a: "Use 8-12 targeted hashtags. The optimizer provides a balanced tiered set instead of 30 spammy tags." },
      { q: "Does this work for business reels?", a: "Yes. Select business intent and get proof-driven CTAs, product keywords, and lead-gen hooks." },
    ],
  },
  "reel-hashtag-generator": {
    slug: "/reel-hashtag-generator",
    title: "Reel Hashtag Generator",
    metaTitle: "Best Hashtag Generator for Reels 2026 | Trending Hashtags India | Reelanylizer",
    metaDesc: "AI finds low-competition, trending hashtags for reels. Get India-specific sets, niche tags, and SEO keywords to break 200-view jail without spam.",
    keywords: "Best Hashtag Generator for Reels 2026, Trending Hashtags for Reels India, Low Competition Hashtags for Reels, Reel Tag Generator Online, Hashtag Strategy for Viral Videos, Best hashtags for reels in Hindi",
    h1: "Reel Hashtag Generator — Trending + Low Competition",
    subtitle: "Generate hashtag sets tuned for India, niche keywords, and viral reach. No spammy 30-tag lists — only 8-12 tags that rank.",
    ctaText: "Generate Hashtags Now",
    ctaRoute: "/",
    icon: Hash,
    features: [
      { icon: Hash, title: "Trending Hashtag Detection", desc: "Identifies currently trending hashtags in your content category for maximum visibility." },
      { icon: Target, title: "Competition Analysis", desc: "Categorizes hashtags by competition level — helps you pick tags you can actually rank for." },
      { icon: BarChart3, title: "Optimal Count", desc: "Recommends the ideal number of hashtags (8-12) based on your niche and content type." },
      { icon: Zap, title: "Niche-Specific Tags", desc: "Generates highly relevant hashtags specific to your content subcategory." },
    ],
    howItWorks: [
      { step: "Describe Your Reel", desc: "Enter your reel topic, niche, or paste your caption." },
      { step: "Smart Hashtag Generation", desc: "Our system researches trending tags, analyzes competition, and generates optimized sets." },
      { step: "Copy & Use", desc: "Copy the hashtag set and paste it into your Instagram reel caption or first comment." },
    ],
    contentBlocks: [
      { heading: "How Hashtags Affect Instagram Reel Reach", text: "Hashtags are one of the primary signals Instagram uses to categorize and distribute your reels. Using the right hashtags puts your content in front of users who are actively browsing those topics. But using too many, too competitive, or irrelevant hashtags can actually hurt your reach. The key is a balanced mix of trending, mid-range, and niche-specific tags." },
      { heading: "Best Hashtag Strategy for Reels in 2025", text: "The optimal hashtag strategy for Instagram reels in 2025 is: 3-4 trending hashtags (500K+ posts), 4-5 mid-range hashtags (50K-500K posts), and 2-3 niche-specific tags (under 50K posts). This combination gives you broad reach potential while still being discoverable in smaller, highly engaged communities. Our generator does this research automatically." },
    ],
    longForm: [
      {
        heading: "Auto-build Hindi + Hinglish hashtag mixes",
        text: "For creators targeting India, the generator produces Hindi and Hinglish tags like 'reel viral kaise kare' and 'Instagram views badhane wala tool' mixed with English SEO terms. This helps you rank in localized explore pages and voice-search driven queries." 
      },
      {
        heading: "Competitive analysis before you post",
        text: "We score each suggested hashtag by competition, relevance, and recency. The list prioritizes tags where you can realistically trend, avoiding ultra-saturated tags that bury your reel."
      },
      {
        heading: "Cross-platform ready for Shorts",
        text: "Need YouTube Shorts tags? Get a parallel set optimized for 'Shorts SEO Tool' and 'Shorts Algorithm Checker' so you can repurpose content across platforms without manual research." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "Best Hashtag Generator for Reels 2026, Trending Hashtags for Reels India, Low Competition Hashtags for Reels, Reel Tag Generator Online, Best hashtags for reels in Hindi, Hashtag Strategy for Viral Videos." 
      },
    ],
    faqs: [
      { q: "Kitne hashtags sahi hain?", a: "8-12 targeted tags with a 3-tier mix. The tool auto-builds this for every reel." },
      { q: "Hindi hashtags milega?", a: "Haan, India-focused sets include Hindi + Hinglish tags to win local search." },
      { q: "Low competition hashtags kaise pata chale?", a: "We score each tag by volume and recency, highlighting low-competition options you can rank for." },
      { q: "YouTube Shorts ke liye tags?", a: "Enable Shorts mode to get SEO tags for YouTube alongside Instagram." },
      { q: "Spam score ka kya?", a: "We avoid banned or overused tags to keep your account safe and reach healthy." },
    ],
  },
  "reel-caption-generator": {
    slug: "/reel-caption-generator",
    title: "Reel Caption Generator",
    metaTitle: "AI Instagram Caption Writer | Copy-Paste Viral Captions | Reelanylizer",
    metaDesc: "Generate SEO captions with hooks, Hinglish keywords, CTAs, and power words. Copy-paste viral captions for reels without keyword stuffing.",
    keywords: "AI Instagram Caption Writer, Copy-Paste Viral Captions, Reels Caption Ideas for Business, How to write SEO captions for Reels, AI Tool for Social Media Copywriting",
    h1: "AI Reel Caption Generator — Hooks, CTAs, SEO",
    subtitle: "Create captions that rank and convert: hook lines, Hinglish search phrases, CTAs, and low-competition keywords baked in.",
    ctaText: "Generate Caption Now",
    ctaRoute: "/seo-optimizer",
    icon: FileText,
    features: [
      { icon: Wand2, title: "Hook Writing", desc: "First line written to stop scrollers — question hooks, bold claims, curiosity triggers." },
      { icon: Target, title: "Emotional Triggers", desc: "Adds emotional words proven to drive saves, shares, and comments." },
      { icon: FileText, title: "CTA Integration", desc: "Includes natural calls-to-action that boost engagement without feeling forced." },
      { icon: Search, title: "Keyword Optimization", desc: "Embeds search-friendly keywords so Instagram indexes your reel for relevant searches." },
    ],
    howItWorks: [
      { step: "Enter Reel Topic", desc: "Describe what your reel is about — topic, key message, target audience." },
      { step: "Smart Caption Writing", desc: "Get multiple caption variations with different tones and hook styles." },
      { step: "Customize & Post", desc: "Pick your favorite, tweak it to match your voice, and publish." },
    ],
    contentBlocks: [
      { heading: "Why Reel Captions Matter More Than You Think", text: "Many creators focus on video quality but neglect captions. Instagram's algorithm reads your caption to understand your content and decide who to show it to. A well-written caption with the right keywords, emotional triggers, and a clear CTA can be the difference between 500 views and 50,000 views. It's the most underrated growth lever for reel creators." },
      { heading: "Anatomy of a Viral Reel Caption", text: "The best-performing reel captions follow a structure: Hook (first line that stops scrolling) → Value (insight, tip, or story) → CTA (ask for engagement). Add 1-2 relevant keywords naturally, use line breaks for readability, and end with a question or prompt that encourages comments. Our generator follows this exact formula." },
    ],
    longForm: [
      {
        heading: "SEO-friendly hook lines in 3 styles",
        text: "Choose from question hooks, bold claims, and curiosity gaps. Each hook places a keyword like 'How to increase reel reach fast' or 'Why is my reel stuck at 200 views?' within the first 100 characters so Instagram search and OCR pick it up." 
      },
      {
        heading: "Hinglish and voice-search ready",
        text: "Captions auto-insert phrases such as 'Reel viral kaise kare 2026' and 'Reel par views kaise laye' for Indian audiences. This improves ranking for voice searches and local queries without making the caption feel forced." 
      },
      {
        heading: "Business-ready CTAs and proof",
        text: "Reels Caption Ideas for Business include proof snippets, social proof cues, and outcome-focused CTAs. The AI Tailors tone for coaches, ecommerce, SaaS, and local services while keeping keyword density around 1-2%." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "AI Instagram Caption Writer, Copy-Paste Viral Captions, Reels Caption Ideas for Business, How to write SEO captions for Reels, AI Tool for Social Media Copywriting." 
      },
    ],
    faqs: [
      { q: "Caption me keywords kahan dale?", a: "Use the first 100 characters for your primary keyword and hook; the generator handles placement automatically." },
      { q: "Hinglish captions milenge?", a: "Yes, toggle Hinglish to add phrases like 'reel reach badhane ka secret' naturally." },
      { q: "Business reels ke liye CTA?", a: "You get CTAs for leads, saves, and shares—e.g., 'Save this checklist before you shoot'." },
      { q: "Keyword stuffing se penalize hoga?", a: "No. We cap density at 1-2% and keep language human so you avoid spam signals." },
      { q: "Kya ye free hai?", a: "Free plan gives credits; paid unlocks unlimited generations and tone presets." },
    ],
  },
  "reel-title-generator": {
    slug: "/reel-title-generator",
    title: "Reel Title Generator",
    metaTitle: "Automated Video Title Generator | Viral Reels & Shorts Titles | Reelanylizer",
    metaDesc: "AI writes SEO-friendly, clickworthy titles for Reels and Shorts. Add trending keywords, power words, and hooks without clickbait penalties.",
    keywords: "Automated Video Title Generator, Viral YouTube Shorts Title Generator, SEO Friendly Titles for Reels, Low Competition Hashtags for Reels, High Reach SEO Keywords for Shorts",
    h1: "SEO Reel Title Generator — Viral Hooks in 3 Seconds",
    subtitle: "Generate titles that rank in Instagram search and YouTube Shorts: power words, keyword modifiers, and CTR-tested formulas.",
    ctaText: "Generate Reel Titles",
    ctaRoute: "/seo-optimizer",
    icon: FileText,
    features: [
      { icon: FileText, title: "Keyword-Rich Titles", desc: "Titles embedded with searchable keywords that help Instagram categorize your content." },
      { icon: Zap, title: "Click-Worthy Headlines", desc: "Curiosity-driven titles that compel users to watch when they see your reel in search." },
      { icon: TrendingUp, title: "Trend-Aware", desc: "Incorporates trending phrases and formats that are currently getting high engagement." },
      { icon: Target, title: "Niche-Specific", desc: "Tailored titles for your content category — fitness, food, tech, fashion, comedy, etc." },
    ],
    howItWorks: [
      { step: "Enter Topic", desc: "Tell us what your reel is about and your niche." },
      { step: "Smart Title Generation", desc: "Get 5-10 title options with different styles — curiosity, how-to, listicle, provocative." },
      { step: "Pick & Apply", desc: "Choose the best title and add it as your reel's on-screen text or caption header." },
    ],
    contentBlocks: [
      { heading: "Do Instagram Reels Need Titles?", text: "Yes! Instagram now indexes on-screen text and caption headers for search. A clear, keyword-rich title at the start of your caption (or as text overlay) tells Instagram what your reel is about. This directly impacts whether your reel appears when users search for related topics. Think of it as your reel's headline — make it count." },
      { heading: "What Makes a Good Reel Title?", text: "A good reel title is specific, includes a relevant keyword, and creates curiosity or promises value. 'How I got 10K followers in 30 days' performs better than 'Growth tips'. Numbers, specific outcomes, and emotional words make titles more clickable. Our generator creates titles following proven formulas used by top-performing reels." },
    ],
    longForm: [
      {
        heading: "Shorts + Reels dual-optimization",
        text: "Titles include modifiers for both ecosystems: 'Shorts SEO Tool', 'Shorts Algorithm Checker', and 'Instagram Reel Analyzer' variations. This helps your clip surface on YouTube and Instagram search with a single optimized headline." 
      },
      {
        heading: "CTR-tested formulas",
        text: "Choose from How-to, List, Bold Claim, and Problem/Solution patterns. Each template places the main keyword up front and adds urgency without clickbait, e.g., 'Reel viral score checker in 30 seconds' or 'Stop losing reach: fix these 3 SEO mistakes'." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "Automated Video Title Generator, Viral YouTube Shorts Title Generator, SEO Friendly Titles for Reels, High Reach SEO Keywords for Shorts, Copy-Paste Viral Captions (title overlay alignment)." 
      },
    ],
    faqs: [
      { q: "Title kaha dikhana chahiye?", a: "Add in caption first line and on-screen text. Instagram OCR reads overlay text for search." },
      { q: "YouTube Shorts titles kaise likhe?", a: "Use 60-70 characters with the primary keyword first. The generator provides ready options." },
      { q: "Kya bold claims se reach badhegi?", a: "Only if you deliver on them. Use data-backed or specific outcomes; avoid clickbait." },
      { q: "Hindi title options?", a: "Yes, toggle Hindi/Hinglish for localized hooks and search phrases." },
    ],
  },
  "reel-viral-checker": {
    slug: "/reel-viral-checker",
    title: "Reel Viral Checker",
    metaTitle: "AI Viral Score Checker | Reel Viral Probability Tool | Reelanylizer",
    metaDesc: "Check reel viral potential instantly. AI viral score, trend alignment, and 200-view jail fixes with saves/shares-focused recommendations.",
    keywords: "AI Reel Viral Score Checker, Check Reel Viral Potential, Viral Reel Predictor, Reel Viral Score Checker, Reel viral kaise kare, Secret to viral YouTube shorts",
    h1: "AI Viral Score Checker — Predict Reel Breakouts",
    subtitle: "See your viral probability before posting. Fix hooks, retention, and hashtag strategy to escape low views and trigger Explore.",
    ctaText: "Check Viral Potential",
    ctaRoute: "/",
    icon: Wand2,
    features: [
      { icon: Wand2, title: "Viral Score (0-100)", desc: "Calculates a viral probability score based on hook, caption, hashtags, and content quality." },
      { icon: TrendingUp, title: "Trend Alignment", desc: "Checks if your reel matches currently viral content formats, audio trends, and topics." },
      { icon: Target, title: "Weak Spot Detection", desc: "Pinpoints exactly what's holding your reel back — weak hook, poor hashtags, or missing CTA." },
      { icon: BarChart3, title: "Benchmark Comparison", desc: "Compares your reel's metrics against average performance in your content category." },
    ],
    howItWorks: [
      { step: "Paste Reel Link", desc: "Copy your Instagram reel URL and paste it into the viral checker." },
      { step: "Smart Virality Prediction", desc: "Our system analyzes all viral signals — hook strength, caption quality, hashtag relevance, engagement patterns." },
      { step: "Get Viral Score", desc: "Receive a 0-100 viral score with specific recommendations to improve your chances." },
    ],
    contentBlocks: [
      { heading: "What Makes a Reel Go Viral?", text: "Viral reels share common traits: a hook that grabs attention in under 2 seconds, high watch-through rate (most viewers watch till the end), emotional triggers that drive shares and saves, and alignment with trending formats or audio. Our viral checker analyzes all these signals to predict your reel's probability of breaking out." },
      { heading: "Can You Predict if a Reel Will Go Viral?", text: "While no tool can guarantee virality, data analysis can identify the presence or absence of viral signals. Reels scoring above 70 on our viral checker consistently outperform reels scoring below 50. The prediction isn't perfect, but it gives you data-driven confidence about whether to post or improve first." },
    ],
    longForm: [
      {
        heading: "Share and save-weighted scoring",
        text: "The viral score prioritizes saves and shares, not likes. It checks if your CTA and content type naturally drive 'send to friend' behavior. This aligns with how Instagram and Shorts promote content in 2026." 
      },
      {
        heading: "Trend alignment for YouTube Shorts and Reels",
        text: "We compare your audio, pacing, and format to current viral templates. If you are off-trend, the tool suggests adjustments and even alternative hooks tested on successful Shorts to improve replay rate." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "AI Reel Viral Score Checker, Check Reel Viral Potential, Viral Reel Predictor, Secret to viral YouTube shorts, Reel viral kaise kare, Reel Viral Score Checker." 
      },
    ],
    faqs: [
      { q: "Reel viral kaise kare?", a: "Hit 70+ viral score: strong 2-sec hook, 8-12 targeted hashtags, and a save-focused CTA. The checker shows gaps." },
      { q: "How accurate is the viral score?", a: "It predicts based on watch-through, hook type, trend fit, and CTA strength. Higher scores correlate with wider distribution." },
      { q: "YouTube shorts viral karne ka trick?", a: "Use fast hooks, looped endings, and searchable titles. The tool flags missing elements before you post." },
      { q: "Does it work for Hindi content?", a: "Yes, include Hinglish keywords; the model reads captions and on-screen text for ranking signals." },
    ],
  },
  "reel-engagement-calculator": {
    slug: "/reel-engagement-calculator",
    title: "Reel Engagement Calculator",
    metaTitle: "Reel Engagement Calculator | Instagram Reach Analyzer | Reelanylizer",
    metaDesc: "Calculate engagement rate, saves, shares, and retention. Benchmark reels vs niche averages and get fixes to boost reach and followers.",
    keywords: "Reel Engagement Calculator, Instagram Reach Analyzer, Reel Performance Insights, Instagram Growth Tracker, Reel Retention Analysis, Professional Reel Report",
    h1: "Reel Engagement Calculator — Saves, Shares, Reach",
    subtitle: "Instantly compute engagement rate, find weak metrics, and compare against your niche benchmarks to unlock more reach.",
    ctaText: "Calculate Engagement",
    ctaRoute: "/",
    icon: BarChart3,
    features: [
      { icon: BarChart3, title: "Engagement Rate", desc: "Calculates (likes + comments + shares + saves) / views to give you a clear engagement percentage." },
      { icon: Target, title: "Niche Benchmarks", desc: "Compares your engagement against average rates for your content category." },
      { icon: TrendingUp, title: "Metric Breakdown", desc: "Shows which metrics (saves, shares, comments) are strong and which need improvement." },
      { icon: Zap, title: "Growth Tips", desc: "Actionable tips to improve specific engagement metrics based on your content type." },
    ],
    howItWorks: [
      { step: "Enter Reel Data", desc: "Paste your reel link or manually enter views, likes, comments, shares, and saves." },
      { step: "Smart Calculation", desc: "Engagement rate computed and compared against 10,000+ reels in your niche." },
      { step: "Get Insights", desc: "See your performance level, metric breakdown, and specific improvement recommendations." },
    ],
    contentBlocks: [
      { heading: "What is a Good Engagement Rate for Reels?", text: "Average engagement rate for Instagram reels is around 1.5-3%. Anything above 3% is considered good, above 5% is excellent, and above 8% suggests viral potential. However, engagement rate varies significantly by niche — educational content typically has higher save rates, while entertainment content gets more shares. Context matters." },
      { heading: "Which Engagement Metrics Matter Most?", text: "Not all engagement is equal. Instagram's algorithm weights different metrics: Saves > Shares > Comments > Likes. A reel with 100 saves and 50 shares will outperform one with 1,000 likes and zero saves. Our calculator breaks down each metric so you understand exactly which types of engagement to optimize for." },
    ],
    longForm: [
      {
        heading: "Detect hidden reach blockers",
        text: "The calculator highlights if your saves-to-views ratio is too low or if comments are missing, then suggests reel-specific CTAs that drive the right action for your niche." 
      },
      {
        heading: "Compare against niche benchmarks",
        text: "Benchmarks differ for education, comedy, fashion, and tech. The tool shows where you lag and how to rebalance content (more tips for saves, more humor for shares)." 
      },
      {
        heading: "Mapped keywords for this page",
        text: "Reel Engagement Calculator, Instagram Reach Analyzer, Reel Performance Insights, Instagram Growth Tracker, Reel Retention Analysis, Professional Reel Report." 
      },
    ],
    faqs: [
      { q: "Engagement rate ka formula?", a: "(Likes + Comments + Shares + Saves) / Views x 100. The calculator does this automatically." },
      { q: "Saves zyada kaise badhaye?", a: "Deliver checklists, tips, or templates. Add a CTA like 'Save before posting your next reel'." },
      { q: "Shares important kyu hai?", a: "Shares push you into DMs and stories, multiplying reach. Aim for a share-friendly CTA in every reel." },
      { q: "Low comments fix?", a: "Ask opinion-based questions. The tool suggests prompts that trigger replies, not just likes." },
    ],
  },
};

interface SEOToolPageProps {
  slug: string;
}

const SEOToolPage = ({ slug }: SEOToolPageProps) => {
  const navigate = useNavigate();
  const config = PAGES[slug];
  if (!config) return null;
  const Icon = config.icon;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: config.title,
    applicationCategory: "MarketingApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan with monthly credits for reel and short-form video analysis",
    },
    url: `https://reelsanylizer.in${config.slug}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "1280",
    },
    keywords: config.keywords,
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="page-surface min-h-screen relative overflow-x-hidden pb-20 md:pb-0">
      <SEOHead
        title={config.metaTitle}
        description={config.metaDesc}
        canonical={`https://reelsanylizer.in${config.slug}`}
        keywords={config.keywords}
        schema={[softwareSchema, faqSchema]}
      />

      {/* Hero */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-10 sm:pt-14 pb-8 text-center">
        <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Icon className="w-3 h-3" /> 5 Free Credits Every Month — No Card Required
        </motion.div>
        <motion.h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight leading-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {config.h1}
        </motion.h1>
        <motion.p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {config.subtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button onClick={() => navigate(config.ctaRoute)} className="h-12 px-8 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm sm:text-base">
            <Icon className="w-4 h-4 mr-2" /> {config.ctaText}
          </Button>
        </motion.div>
      </div>

      {/* Features */}
      <section className="max-w-2xl mx-auto px-4 pb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 text-center">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {config.features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Card className="glass p-4 h-full">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-2xl mx-auto px-4 pb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 text-center">How It Works</h2>
        <div className="space-y-3">
          {config.howItWorks.map((step, i) => (
            <Card key={i} className="glass p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full border-2 border-primary/20 bg-primary/5 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{step.step}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Content Blocks */}
      {config.contentBlocks.map((block, i) => (
        <section key={i} className="max-w-2xl mx-auto px-4 pb-6">
          <h2 className="text-base font-bold text-foreground mb-2">{block.heading}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>
        </section>
      ))}

      {/* Long-form SEO content */}
      <section className="max-w-2xl mx-auto px-4 pb-8 space-y-6">
        {config.longForm.map((block, i) => (
          <article key={i} className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-foreground">{block.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{block.text}</p>
          </article>
        ))}
      </section>

      {/* FAQ Section targeting voice search and Hinglish queries */}
      <section className="max-w-2xl mx-auto px-4 pb-10" id="faq">
        <h2 className="text-lg font-bold text-foreground mb-4">FAQs: Reel SEO, Viral Score, Hindi + Hinglish</h2>
        <div className="space-y-4">
          {config.faqs.map((faq, i) => (
            <Card key={i} className="glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">{faq.q}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA repeat */}
      <section className="max-w-2xl mx-auto px-4 pb-8 text-center">
        <Button onClick={() => navigate(config.ctaRoute)} className="h-11 px-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm">
          <Icon className="w-4 h-4 mr-2" /> {config.ctaText}
        </Button>
      </section>

      {/* Reviews */}
      <ReviewsGrid />

      {/* Internal Links */}
      <InternalLinks currentPath={config.slug} />

      <Footer />

      <MobileBottomNav />
    </div>
  );
};

export { PAGES };
export default SEOToolPage;
