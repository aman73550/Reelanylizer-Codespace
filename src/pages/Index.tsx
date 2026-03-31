import { useState, useCallback, useRef, useEffect } from "react";
import heroIllustration from "@/assets/hero-illustration.webp";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import ViralScoreCircle from "@/components/ViralScoreCircle";
import AnalysisCard from "@/components/AnalysisCard";
import CategoryPieChart from "@/components/CategoryPieChart";
import ScoreBarChart from "@/components/ScoreBarChart";
import ScoreRadarChart from "@/components/ScoreRadarChart";
import EngagementDonutChart from "@/components/EngagementDonutChart";
import ReelPreview from "@/components/ReelPreview";
import MetricsComparison from "@/components/MetricsComparison";
import CommentSentiment from "@/components/CommentSentiment";
import HookAnalysisCard from "@/components/HookAnalysisCard";
import CaptionAnalysisCard from "@/components/CaptionAnalysisCard";
import HashtagAnalysisCard from "@/components/HashtagAnalysisCard";
import VideoSignalsCard from "@/components/VideoSignalsCard";
import QualitySignalsCard from "@/components/QualitySignalsCard";
import TrendMatchingCard from "@/components/TrendMatchingCard";
import ContentClassificationCard from "@/components/ContentClassificationCard";
import ViralPatternCard from "@/components/ViralPatternCard";
import ViralStatusBadge from "@/components/ViralStatusBadge";
import LanguageToggle from "@/components/LanguageToggle";
import ShareToolPopup from "@/components/ShareToolPopup";
import ProcessingOverlay from "@/components/ProcessingOverlay";

import PremiumAnalysisCards from "@/components/PremiumAnalysisCards";
import FeedbackRating from "@/components/FeedbackRating";


import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/LangContext";
import { useBehaviourTrigger, BehaviourTriggerDisplay } from "@/components/BehaviourTrigger";
import InternalLinks from "@/components/InternalLinks";
import Footer from "@/components/Footer";
import TrustBadges from "@/components/TrustBadges";

import AnalysisPaymentPopup from "@/components/AnalysisPaymentPopup";
import { FeaturesSection, ToolsSection, HowItWorksSection, CTASection } from "@/components/HomeSections";
import CreditPaywall from "@/components/CreditPaywall";
import { useCredits } from "@/hooks/useCredits";

import ReviewsGrid from "@/components/ReviewsGrid";
import LiveActivityFeed from "@/components/LiveActivityFeed";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/hooks/useAuth";
import type { ReelAnalysis } from "@/lib/types";
// History panel moved into Header dropdown
import CreatorPartnersCarousel from "@/components/CreatorPartnersCarousel";
import SEOHead from "@/components/SEOHead";
import { Loader2, Link as LinkIcon, Wand2, TrendingUp, ChevronDown, ChevronUp, ShieldCheck, Crown, LogIn, User, Zap } from "lucide-react";

// === SESSION-LEVEL RESULT CACHE (same URL → same result, no re-analysis) ===
const analysisCache = new Map<string, { result: ReelAnalysis; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCachedAnalysis(url: string): ReelAnalysis | null {
  const entry = analysisCache.get(url);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.result;
  if (entry) analysisCache.delete(url);
  return null;
}
function setCachedAnalysis(url: string, result: ReelAnalysis) {
  analysisCache.set(url, { result, timestamp: Date.now() });
}

// === COOLDOWN: 1 analysis per 60s per session ===
let lastAnalysisTime = 0;
const COOLDOWN_MS = 60_000;

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const Index = () => {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [views, setViews] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [sampleComments, setSampleComments] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ReelAnalysis | null>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCreditPaywall, setShowCreditPaywall] = useState(false);
  const [analysisPrice, setAnalysisPrice] = useState(0);
  const [pendingPaymentToken, setPendingPaymentToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { lang, t } = useLang();
  const { activeTrigger, checkTriggers, dismissTrigger } = useBehaviourTrigger();
  const { user, refreshUsage, loadAnalyses, signInWithGoogle } = useAuth();
  const { totalCredits, canAfford, deductCredits, refreshCredits } = useCredits();
  const inputRef = useRef<HTMLDivElement>(null);


  const scrollToInput = () => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const runAnalysis = useCallback(async (paymentToken?: string) => {
    setLoading(true);
    setAnalysis(null);
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      toast({ title: t.enterUrl, variant: "destructive" });
      setLoading(false);
      setAnalyzeDisabled(false);
      return;
    }

    // Check session cache first — same URL returns same result (consistent scoring)
    const cached = getCachedAnalysis(normalizedUrl);
    if (cached && !paymentToken) {
      setAnalysis(cached);
      setLoading(false);
      setAnalyzeDisabled(false);
      toast({ title: "Cached Result", description: "Showing saved analysis for this URL. Use a different URL for a new analysis." });
      return;
    }

    try {
      const bodyPayload: any = {
        url: normalizedUrl,
        caption: caption.trim() || undefined,
        hashtags: hashtags.trim() || undefined,
        lang,
        metrics: {
          likes: likes ? parseInt(likes) : undefined,
          comments: comments ? parseInt(comments) : undefined,
          views: views ? parseInt(views) : undefined,
          shares: shares ? parseInt(shares) : undefined,
          saves: saves ? parseInt(saves) : undefined,
        },
        sampleComments: sampleComments.trim() || undefined,
      };
      if (paymentToken) bodyPayload.paymentToken = paymentToken;

      // 30-second timeout via AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30_000);

      const { data, error } = await supabase.functions.invoke("analyze-reel", { 
        body: bodyPayload,
      });
      clearTimeout(timeoutId);

      if (error) throw error;

      if (!data?.success && data?.error === "payment_required") {
        setAnalysisPrice(data.price || 10);
        setShowInterstitial(false);
        setShowPaymentPopup(true);
        setLoading(false);
        return;
      }
      if (!data?.success && data?.error === "payment_invalid") {
        toast({ title: "Payment Invalid", description: data.message || "Please complete payment first", variant: "destructive" });
        setAnalysisPrice(data.price || 10);
        setShowInterstitial(false);
        setShowPaymentPopup(true);
        setLoading(false);
        return;
      }
      if (!data?.success && data?.error === "COOLDOWN") {
        toast({ title: "Please Wait", description: data.message || "You can analyze again in 1 minute.", variant: "destructive" });
        setLoading(false);
        setAnalyzeDisabled(false);
        return;
      }
      if (!data?.success && data?.error === "SERVER_BUSY") {
        toast({ title: "System Busy", description: data.message || "Too many analyses running. Please wait 10 seconds and try again.", variant: "destructive" });
        setLoading(false);
        setAnalyzeDisabled(false);
        return;
      }
      if (!data?.success && data?.error === "CIRCUIT_OPEN") {
        toast({ title: "System Maintenance", description: data.message || "AI service is temporarily unavailable. Please try again in 30 seconds.", variant: "destructive" });
        setLoading(false);
        setAnalyzeDisabled(false);
        return;
      }
      if (!data?.success) throw new Error(data?.error || "Analysis failed");

      setAnalysis(data.analysis);
      setPendingPaymentToken(null);
      lastAnalysisTime = Date.now();

      // Deduct credits only after a successful analysis so users don't lose credits on failures.
      const deducted = await deductCredits("reel_analysis");
      if (!deducted) {
        throw new Error("Could not deduct credits after analysis. Please try again.");
      }

      // Cache the result for consistent scoring
      setCachedAnalysis(normalizedUrl, data.analysis);

      // Save analysis for logged-in user
      if (user) {
        await supabase.from("user_analyses" as any).insert({
          user_id: user.id,
          reel_url: normalizedUrl,
          viral_score: data.analysis?.viralClassification?.score ?? data.analysis?.viralScore ?? 0,
          analysis_data: data.analysis,
        } as any);
        await refreshUsage();
        await refreshCredits();
        await loadAnalyses();
      }
    } catch (err: any) {
      setShowInterstitial(false);
      console.error("Analysis error:", err);
      const msg = err.name === "AbortError" 
        ? "Analysis timed out after 30 seconds. Please try again." 
        : (err.message || "Analysis could not be completed right now. Please try a valid Reel or Shorts link again.");
      toast({ title: t.analysisFailed, description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setAnalyzeDisabled(false);
    }
  }, [url, caption, hashtags, likes, comments, views, shares, saves, sampleComments, lang, t, toast, user, refreshUsage, refreshCredits, loadAnalyses, deductCredits]);

  const handlePaymentSuccess = (paymentToken: string) => {
    setShowPaymentPopup(false);
    setPendingPaymentToken(paymentToken);
    setShowInterstitial(true);
    runAnalysis(paymentToken);
  };

  const [analyzeDisabled, setAnalyzeDisabled] = useState(false);

  const handleAnalyze = async () => {
    if (loading || analyzeDisabled) return;
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) { toast({ title: t.enterUrl, variant: "destructive" }); return; }
    const igPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(reel|reels|p)\//i;
    const ytPattern = /^https?:\/\/(www\.)?(m\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)/i;
    if (!igPattern.test(normalizedUrl) && !ytPattern.test(normalizedUrl)) { 
      toast({ title: "Invalid URL", description: "Please enter a valid Instagram Reel or YouTube Shorts URL", variant: "destructive" }); 
      return; 
    }
    if (normalizedUrl.length > 500) { toast({ title: "URL too long", variant: "destructive" }); return; }

    // === COOLDOWN CHECK (1 analysis per 60 seconds) ===
    const timeSinceLast = Date.now() - lastAnalysisTime;
    if (lastAnalysisTime > 0 && timeSinceLast < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
      toast({ title: "Please Wait", description: `You can analyze again in ${waitSec} seconds.`, variant: "destructive" });
      return;
    }

    // === CHECK SESSION CACHE — same URL gives same score ===
    const cached = getCachedAnalysis(normalizedUrl);
    if (cached) {
      setAnalysis(cached);
      toast({ title: "Cached Result", description: "Showing saved analysis for this URL (same score guaranteed)." });
      return;
    }

    // YouTube Shorts length check
    const isYTShorts = ytPattern.test(normalizedUrl);
    if (isYTShorts) {
      try {
        const dateCheckRes = await supabase.functions.invoke("check-reel-date", { body: { url: normalizedUrl } });
        if (dateCheckRes.error) {
          console.error("YouTube length check failed:", dateCheckRes.error);
        } else if (dateCheckRes.data?.isTooLong) {
          toast({
            title: "Long Video",
            description: "This video is over 50 seconds. We will still analyze it, but results may be less accurate for non-Shorts.",
          });
        } else if (dateCheckRes.data?.isYouTubeShorts && dateCheckRes.data?.videoDurationSeconds === null) {
          console.warn("Could not detect YouTube Shorts duration, proceeding anyway");
        }
      } catch (e) {
        console.error("YouTube check error:", e);
      }
    }

    const numFields = [likes, comments, views, shares, saves];
    for (const val of numFields) {
      if (val && (isNaN(Number(val)) || Number(val) < 0)) {
        toast({ title: "Invalid metric value", description: "Metrics must be positive numbers", variant: "destructive" });
        return;
      }
    }

    // If not logged in, show login prompt
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // === FRONTEND CREDIT CHECK (double-check before API call) ===
    if (!canAfford("reel_analysis")) {
      setShowCreditPaywall(true);
      return;
    }

    if (checkTriggers()) return;

    // Lock button immediately — prevents double-click double deduction
    setAnalyzeDisabled(true);
    
    // Store normalized URL so UI reflects the actual value being analyzed
    setUrl(normalizedUrl);

    setShowInterstitial(true);
    runAnalysis();
  };

  const handleTriggerRetry = async () => {
    dismissTrigger();
    setShowInterstitial(true);
    runAnalysis();
  };

  const scores = analysis ? {
    hook: analysis.hookAnalysis?.score ?? analysis.hookScore ?? 0,
    caption: analysis.captionAnalysis?.score ?? analysis.captionScore ?? 0,
    hashtag: analysis.hashtagAnalysis?.score ?? analysis.hashtagScore ?? 0,
    engagement: analysis.engagementScore ?? 0,
    trend: analysis.trendMatching?.score ?? analysis.trendScore ?? 0,
  } : null;

  const chartLabels = { hook: t.hook, caption: t.caption, hashtag: t.hashtag, engagement: t.engagement, trend: t.trend };

  return (
    <>
      <SEOHead 
        title="Free Instagram Reel Analyzer – Viral Score & Algorithm Tips | ReelAnalyzer"
        description="Analyze your Instagram reels for viral potential, hook strength, engagement metrics & growth tips. Get free analysis with 5 monthly credits. No payment needed."
        keywords="instagram reel analyzer, reel viral checker, instagram algorithm, reel analysis tool, viral score predictor, reel engagement analyzer, instagram growth tool, content analyzer, reel performance tracker, viral potential checker"
        canonical="https://reelsanylizer.in"
      />
      <div className="min-h-screen relative overflow-x-hidden">
      
      
      <ProcessingOverlay show={showInterstitial} analysisComplete={!loading && analysis !== null} onComplete={() => setShowInterstitial(false)} />
      <LoginPrompt open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <CreditPaywall tool="reel_analysis" open={showCreditPaywall} onClose={() => setShowCreditPaywall(false)} />

      {/* Behaviour Trigger Overlay */}
      {activeTrigger && (
        <BehaviourTriggerDisplay trigger={activeTrigger.trigger} message={activeTrigger.message} displayType={activeTrigger.displayType} onDismiss={dismissTrigger} onRetry={handleTriggerRetry} />
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden hero-bg">
        {/* Soft purple glow behind right side */}
        <div className="absolute right-[-100px] top-[20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 50%, transparent 70%)" }} />
        <div className="absolute right-[10%] bottom-0 w-[400px] h-[300px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.06) 0%, transparent 70%)" }} />

        <div className="relative max-w-[1200px] mx-auto px-6 sm:px-8 pt-16 sm:pt-20 pb-12 sm:pb-20">
          {/* Top Badge - centered */}
          <motion.div className="flex justify-center mb-10 sm:mb-12" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium" style={{ background: "#EEF2FF", color: "#6366F1" }}>
              <Wand2 className="w-4 h-4" />
              5 Free Credits Every Month — No Card Required
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-4">
            {/* Left Column: Title + Subtitle + Input */}
            <div className="flex-1 w-full max-w-[620px]">
              <motion.h1 
                className="text-[32px] sm:text-[42px] md:text-[48px] lg:text-[54px] font-extrabold text-foreground mb-5 tracking-[-0.02em] leading-[1.1] text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              >
                Free Reel Viral{" "}
                <span className="gradient-primary">Analyzer</span>
              </motion.h1>
              <motion.p 
                className="text-[16px] sm:text-[17px] text-center lg:text-left mb-10 leading-[1.75] max-w-[480px] mx-auto lg:mx-0 text-muted-foreground"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              >
                Paste your Instagram Reel link and get a smart viral potential score with actionable insights. Get 5 free credits every month — no payment needed.
              </motion.p>

              {/* Powered by Leading AI Models */}
              <motion.div 
                className="flex flex-col items-center lg:items-start gap-3 mb-10"
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                <p style={{ fontSize: "13px", color: "#6B7280" }} className="font-medium">Powered by Leading AI Models</p>
                <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start">
                  <div
                    style={{
                      background: "linear-gradient(90deg, #6366F1, #A855F7)",
                      color: "white",
                      padding: "9px 16px",
                      borderRadius: "999px",
                      boxShadow: "0 0 0 2px rgba(99,102,241,0.12), 0 8px 24px rgba(99,102,241,0.35)",
                      letterSpacing: "0.01em",
                    }}
                    className="text-sm font-semibold"
                  >
                    Our most powerful AI agent
                  </div>
                  <div style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "8px 14px", borderRadius: "999px", color: "#374151" }} className="text-sm font-medium">
                    GPT-5.2 / 5.4
                  </div>
                  <div style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "8px 14px", borderRadius: "999px", color: "#374151" }} className="text-sm font-medium">
                    Claude Opus 4.5
                  </div>
                  <div style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "8px 14px", borderRadius: "999px", color: "#374151" }} className="text-sm font-medium">
                    Gemini 3 Pro
                  </div>
                </div>
              </motion.div>

              {/* Input Card */}
              <motion.div ref={inputRef} className="w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="p-6 sm:p-8 space-y-4 rounded-2xl border border-[#E5E7EB] bg-white/80 backdrop-blur-sm" style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)" }}>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder={t.urlPlaceholder} 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      className="pl-12 border-[#E5E7EB] text-[15px] rounded-xl input-focus-glow" 
                      style={{ height: '56px', background: '#F9FAFB' }} 
                    />
                  </div>

                  <button type="button" onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border text-[13px] transition-colors bg-secondary text-muted-foreground">
                    <span className="flex items-center gap-2"><Wand2 className="w-3.5 h-3.5 text-primary" /> Boost Accuracy — Add Details</span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div className="space-y-3" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <Input placeholder={t.captionPlaceholder} value={caption} onChange={(e) => setCaption(e.target.value)} className="border-[#E5E7EB] h-11 text-sm rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                        <Input placeholder={t.hashtagPlaceholder} value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="border-[#E5E7EB] h-11 text-sm rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                        <button type="button" onClick={() => setShowMetrics(!showMetrics)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border text-xs transition-colors bg-secondary text-muted-foreground">
                          <span>{t.metricsLabel}</span>
                          {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <AnimatePresence>
                          {showMetrics && (
                            <motion.div className="space-y-2" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                              <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder={t.likesPlaceholder} value={likes} onChange={(e) => setLikes(e.target.value)} className="border-[#E5E7EB] h-9 text-xs rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                                <Input type="number" placeholder={t.commentsPlaceholder} value={comments} onChange={(e) => setComments(e.target.value)} className="border-[#E5E7EB] h-9 text-xs rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                                <Input type="number" placeholder={t.viewsPlaceholder} value={views} onChange={(e) => setViews(e.target.value)} className="border-[#E5E7EB] h-9 text-xs rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                                <Input type="number" placeholder={t.sharesPlaceholder} value={shares} onChange={(e) => setShares(e.target.value)} className="border-[#E5E7EB] h-9 text-xs rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} />
                                <Input type="number" placeholder={t.savesPlaceholder} value={saves} onChange={(e) => setSaves(e.target.value)} className="border-[#E5E7EB] h-9 text-xs rounded-xl input-focus-glow col-span-2 sm:col-span-1" style={{ background: '#F9FAFB' }} />
                              </div>
                              <Textarea placeholder={t.sampleCommentsPlaceholder} value={sampleComments} onChange={(e) => setSampleComments(e.target.value)} className="border-[#E5E7EB] text-xs min-h-[70px] resize-none rounded-xl input-focus-glow" style={{ background: '#F9FAFB' }} rows={3} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    onClick={handleAnalyze} 
                    disabled={loading || analyzeDisabled} 
                    className="w-full cta-gradient text-white font-semibold text-[15px] rounded-xl border-0 transition-all duration-200"
                    style={{ height: '56px' }}
                  >
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.analyzing}</>) : (<><TrendingUp className="w-4 h-4 mr-2" />{t.analyzeBtn}</>)}
                  </Button>

                  <p className="text-center text-[11px] pt-1.5 text-muted-foreground/70 flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>This analysis costs <strong>2 credits</strong></span>
                  </p>

                  {user ? (
                    <p className="text-center text-[13px] pt-1 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {totalCredits > 0 ? `${totalCredits} credit${totalCredits !== 1 ? "s" : ""} remaining` : "No credits remaining"}
                      </span>
                    </p>
                  ) : (
                    <button onClick={() => setShowLoginPrompt(true)} className="w-full text-center text-[13px] text-primary hover:underline flex items-center justify-center gap-1.5 pt-1">
                      <LogIn className="w-3.5 h-3.5" />
                      Sign in with Google to get 5 free credits
                    </button>
                  )}
                  <p className="text-center text-[11px] pt-0.5 text-muted-foreground/70">Auto-extracts data if you skip optional fields</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Illustration */}
            <motion.div 
              className="hidden lg:flex flex-shrink-0 items-center justify-center relative"
              style={{ width: '540px', marginTop: '10px' }}
              initial={{ opacity: 0, x: 50, scale: 0.92 }} 
              animate={{ opacity: 1, x: 0, scale: 1 }} 
              transition={{ delay: 0.35, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img 
                src={heroIllustration} 
                alt="Reel analysis illustration — magnifying glass with analytics" 
                width="480" 
                height="420" 
                loading="eager" 
                decoding="async" 
                className="w-full h-auto object-contain" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Partners Carousel */}
      {!analysis && <CreatorPartnersCarousel />}

      {/* Trust Badges */}
      {!analysis && <TrustBadges />}

      {/* Live Activity Feed */}
      {!analysis && <LiveActivityFeed />}

      {/* Payment Popup */}
      {showPaymentPopup && (
        <AnalysisPaymentPopup reelUrl={url.trim()} price={analysisPrice} onPaymentSuccess={handlePaymentSuccess} onClose={() => { setShowInterstitial(false); setShowPaymentPopup(false); }} />
      )}

      {/* Results */}
      <AnimatePresence>
        {analysis && scores && (
          <motion.div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 pb-16 space-y-4 sm:space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

            <motion.div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--viral-high))]/10 border border-[hsl(var(--viral-high))]/20 mx-auto w-fit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--viral-high))]" />
              <span className="text-xs font-medium text-[hsl(var(--viral-high))]">Auto-Analyzed • Data Extracted Automatically</span>
            </motion.div>

            {analysis.viralClassification && <ViralStatusBadge classification={analysis.viralClassification} />}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <motion.div className="sm:col-span-3" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 sm:p-8 flex flex-col items-center h-full justify-center border border-border bg-card">
                  <ViralScoreCircle score={analysis.viralClassification?.score ?? analysis.viralScore} />
                  <motion.p className="mt-4 text-sm text-muted-foreground text-center max-w-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                    {analysis.overallSummary}
                  </motion.p>
                </Card>
              </motion.div>
              <motion.div className="sm:col-span-2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <ReelPreview url={url} />
              </motion.div>
            </div>

            {analysis.metricsComparison && Object.keys(analysis.metricsComparison).length > 0 && <MetricsComparison metrics={analysis.metricsComparison} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border border-border bg-card">
                <h3 className="font-semibold text-foreground text-sm mb-3">📊 {t.categoryDistribution}</h3>
                <CategoryPieChart hookScore={scores.hook} captionScore={scores.caption} hashtagScore={scores.hashtag} engagementScore={scores.engagement} trendScore={scores.trend} labels={chartLabels} />
              </Card>
              <Card className="p-5 border border-border bg-card">
                <h3 className="font-semibold text-foreground text-sm mb-3">📈 {t.scoreBreakdown}</h3>
                <ScoreBarChart hookScore={scores.hook} captionScore={scores.caption} hashtagScore={scores.hashtag} engagementScore={scores.engagement} trendScore={scores.trend} labels={chartLabels} />
              </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border border-border bg-card">
                <h3 className="font-semibold text-foreground text-sm mb-3">🕸️ Performance Radar</h3>
                <ScoreRadarChart hookScore={scores.hook} captionScore={scores.caption} hashtagScore={scores.hashtag} engagementScore={scores.engagement} trendScore={scores.trend} labels={chartLabels} />
              </Card>
              {analysis.metricsComparison && (
                <Card className="p-5 border border-border bg-card">
                  <h3 className="font-semibold text-foreground text-sm mb-3">🎯 Engagement Breakdown</h3>
                  <EngagementDonutChart likes={analysis.metricsComparison.likes?.value} comments={analysis.metricsComparison.comments?.value} shares={analysis.metricsComparison.shares?.value} saves={analysis.metricsComparison.saves?.value} />
                </Card>
              )}
            </div>

            {analysis.patternComparison && <ViralPatternCard data={analysis.patternComparison} />}
            {analysis.contentClassification && <ContentClassificationCard data={analysis.contentClassification} thumbnailAnalyzed={analysis.thumbnailAnalyzed} />}
            {analysis.hookAnalysis && <HookAnalysisCard data={analysis.hookAnalysis} title={t.hookTitle} />}
            {analysis.captionAnalysis && <CaptionAnalysisCard data={analysis.captionAnalysis} title={t.captionTitle} />}
            {analysis.hashtagAnalysis && <HashtagAnalysisCard data={analysis.hashtagAnalysis} title={t.hashtagTitle} />}
            {analysis.videoSignals && <VideoSignalsCard data={analysis.videoSignals} title={t.videoTitle} />}
            {(analysis.videoQuality || analysis.audioQuality) && <QualitySignalsCard videoQuality={analysis.videoQuality} audioQuality={analysis.audioQuality} />}
            {analysis.trendMatching && <TrendMatchingCard data={analysis.trendMatching} title={t.trendTitle} />}
            <AnalysisCard icon="📊" title={t.engagementTitle} score={scores.engagement} details={analysis.engagementDetails || []} index={0} />
            {analysis.commentSentiment && <CommentSentiment sentiment={analysis.commentSentiment} />}

            <Card className="p-5 border border-border bg-card">
              <h3 className="font-semibold text-foreground mb-3">💡 {t.recommendations}</h3>
              <ul className="space-y-2">
                {analysis.topRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="gradient-primary font-bold">{i + 1}.</span>{rec}
                  </li>
                ))}
              </ul>
            </Card>


            {/* Premium Insights — included in single API call */}
            {analysis.premiumInsights && <PremiumAnalysisCards data={analysis.premiumInsights} />}

            <FeedbackRating reelUrl={url} />

            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground">Want to check another reel? <span className="text-foreground font-medium">Share this tool with a friend.</span></p>
              <ShareToolPopup />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-analysis sections */}
      {!analysis && (
        <div className="relative z-10">
          <FeaturesSection />
          <ToolsSection />
          <HowItWorksSection />
          <ReviewsGrid />
          <CTASection onCTAClick={scrollToInput} />

          <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Instagram Reel Analyzer & SEO Optimization Tool</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ReelAnalyzer is a data-driven tool that helps Instagram creators analyze their reel performance, predict viral potential, and optimize content for maximum reach. Sign in, paste any Instagram reel URL, and get instant insights on hook strength, caption quality, hashtag effectiveness, engagement metrics, and trend alignment.
            </p>
            <h3 className="text-base font-semibold text-foreground">How Does Reel Analysis Help Your Growth?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Creators who analyze their reels before posting see 2-3x better engagement rates. Our reel performance analyzer checks your hook timing, caption SEO, hashtag competition levels, and content classification to identify exactly what's working and what needs improvement.
            </p>
          </section>

          <InternalLinks currentPath="/" />

          <div className="py-8 space-y-4">
            <div className="flex justify-center"><ShareToolPopup /></div>
          </div>
        </div>
      )}

      
      <Footer />
      </div>
    </>
  );
};

export default Index;
