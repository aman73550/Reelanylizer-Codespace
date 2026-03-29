import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import InternalLinks from "@/components/InternalLinks";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import TrustedReviewsCarousel from "@/components/TrustedReviewsCarousel";
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
}

const PAGES: Record<string, ToolPageConfig> = {
  "reel-analyzer": {
    slug: "/reel-analyzer",
    title: "Reel Analyzer",
    metaTitle: "Free Reel Analyzer – Instagram Reel Analysis Tool | 3 Free Credits",
    metaDesc: "Free reel analyzer tool — get 3 free credits on signup. Analyze your Instagram reel performance instantly. Get viral score prediction, hook analysis, caption tips & engagement insights.",
    keywords: "free reel analyzer, free reel analyzer tool, free reel analytics tool, free reel performance analyzer, analyze instagram reel free",
    h1: "Free Reel Analyzer Tool",
    subtitle: "Paste your Instagram reel URL and get instant analysis with viral score prediction, hook strength detection, and engagement tips. 3 free credits on signup.",
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
  },
  "instagram-reel-analyzer": {
    slug: "/instagram-reel-analyzer",
    title: "Instagram Reel Analyzer",
    metaTitle: "Free Instagram Reel Analyzer – Check Reel Viral Potential | 3 Free Credits",
    metaDesc: "Free Instagram reel analyzer — 3 free credits on signup. Check your reel's viral potential, analyze engagement metrics, get hook score, caption tips & hashtag optimization.",
    keywords: "free instagram reel analyzer, free instagram reel checker, free reel analysis, free reel performance checker, check reel engagement free",
    h1: "Free Instagram Reel Analyzer — Check Your Reel's Viral Potential",
    subtitle: "The most comprehensive free Instagram reel analysis tool. Get 3 free credits on signup — smart insights on hook strength, caption quality, and viral probability.",
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
  },
  "reel-seo-optimizer": {
    slug: "/reel-seo-optimizer",
    title: "Reel SEO Optimizer",
    metaTitle: "Free Reel SEO Optimizer – Optimize Instagram Reel for Search | 3 Free Credits",
    metaDesc: "Free reel SEO optimization tool — 3 free credits on signup. Generate SEO-optimized titles, captions, and hashtags for Instagram reels. Improve discoverability free.",
    keywords: "free reel seo optimization tool, free reel seo analyzer, free instagram reel seo, reel title generator free, reel caption generator free",
    h1: "Free Reel SEO Optimization Tool",
    subtitle: "Generate SEO-optimized titles, captions, and hashtags for free. 3 free credits on signup — help Instagram's algorithm push your reels to more people.",
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
  },
  "reel-hashtag-generator": {
    slug: "/reel-hashtag-generator",
    title: "Reel Hashtag Generator",
    metaTitle: "Free Reel Hashtag Generator – Best Hashtags for Instagram Reels 2025",
    metaDesc: "Free hashtag generator for Instagram reels — 3 free credits on signup. AI finds trending, niche-specific hashtags to maximize your reel reach and engagement.",
    keywords: "free reel hashtag generator, free best hashtags for instagram reels, free instagram reel hashtags, free trending hashtags for reels, free hashtag generator",
    h1: "Free Reel Hashtag Generator",
    subtitle: "Generate the perfect hashtag mix for your Instagram reels for free. 3 free credits on signup — smart analysis finds trending & niche-specific hashtags.",
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
  },
  "reel-caption-generator": {
    slug: "/reel-caption-generator",
    title: "Reel Caption Generator",
    metaTitle: "Free Reel Caption Generator – Smart Instagram Caption Writer",
    metaDesc: "Free reel caption generator — 3 free credits on signup. Generate engaging, SEO-optimized captions for Instagram reels with hooks, emotional triggers & CTAs.",
    keywords: "free reel caption generator, free best reel caption generator, free instagram reel caption, free caption generator for reels, free reel caption ideas",
    h1: "Free Smart Reel Caption Generator",
    subtitle: "Generate scroll-stopping captions for your reels for free. 3 free credits on signup — captions with emotional hooks, trending keywords & CTAs.",
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
  },
  "reel-title-generator": {
    slug: "/reel-title-generator",
    title: "Reel Title Generator",
    metaTitle: "Free Reel Title Generator – SEO Optimized Titles for Instagram Reels",
    metaDesc: "Free reel title generator — 3 free credits on signup. AI creates clickable, keyword-rich titles that improve discoverability in Instagram search.",
    keywords: "free reel title generator, free instagram reel title, free reel title ideas, free seo reel title, free best titles for reels",
    h1: "Free SEO Reel Title Generator",
    subtitle: "Generate attention-grabbing titles for your reels for free. 3 free credits on signup — keyword-optimized titles that Instagram's search algorithm loves.",
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
  },
  "reel-viral-checker": {
    slug: "/reel-viral-checker",
    title: "Reel Viral Checker",
    metaTitle: "Free Reel Viral Checker – Check if Your Reel Can Go Viral | 3 Free Credits",
    metaDesc: "Free reel viral checker — 3 free credits on signup. Check your Instagram reel's viral probability instantly. Get viral score & improvement tips before posting.",
    keywords: "free reel viral checker, free reel viral score checker, free viral prediction tool, free viral reel strategy, how to make reels go viral free",
    h1: "Free Viral Checker — Check if Your Reel Can Go Viral",
    subtitle: "Predict your reel's viral probability for free before you post. 3 free credits on signup — get viral score, identify weak spots & fix them.",
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
  },
  "reel-engagement-calculator": {
    slug: "/reel-engagement-calculator",
    title: "Reel Engagement Calculator",
    metaTitle: "Free Reel Engagement Calculator – Calculate Instagram Reel Engagement Rate",
    metaDesc: "Free reel engagement calculator — 3 free credits on signup. Calculate your Instagram reel's engagement rate and compare against niche benchmarks for free.",
    keywords: "free reel engagement calculator, free reel engagement analyzer, free check reel engagement, free reel performance analytics, free instagram reel engagement",
    h1: "Free Instagram Reel Engagement Rate Calculator",
    subtitle: "Calculate your reel's engagement rate for free and compare against niche benchmarks. 3 free credits on signup — understand which metrics matter most.",
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

  return (
    <div className="page-surface min-h-screen relative overflow-x-hidden pb-20 md:pb-0">
      <SEOHead title={config.metaTitle} description={config.metaDesc} canonical={`https://reelsanylizer.in${config.slug}`} keywords={config.keywords} />

      {/* Hero */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-10 sm:pt-14 pb-8 text-center">
        <motion.div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Icon className="w-3 h-3" /> 3 Free Credits on Signup — No Card Required
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

      {/* CTA repeat */}
      <section className="max-w-2xl mx-auto px-4 pb-8 text-center">
        <Button onClick={() => navigate(config.ctaRoute)} className="h-11 px-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 text-sm">
          <Icon className="w-4 h-4 mr-2" /> {config.ctaText}
        </Button>
      </section>

      {/* Reviews */}
      <TrustedReviewsCarousel />

      {/* Internal Links */}
      <InternalLinks currentPath={config.slug} />

      <Footer />

      <MobileBottomNav />
    </div>
  );
};

export { PAGES };
export default SEOToolPage;
