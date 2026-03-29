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
import CreditPaywall from "@/components/CreditPaywall";
import { useCredits } from "@/hooks/useCredits";

import TrustedReviewsCarousel from "@/components/TrustedReviewsCarousel";
import LoginPrompt from "@/components/LoginPrompt";
import { useAuth } from "@/hooks/useAuth";
import type { ReelAnalysis } from "@/lib/types";
// History panel moved into Header dropdown
import CreatorPartnersCarousel from "@/components/CreatorPartnersCarousel";
import { Loader2, Link as LinkIcon, Wand2, TrendingUp, ChevronDown, ChevronUp, ShieldCheck, Crown, LogIn, User, Zap } from "lucide-react";
import SEOHead from "@/components/SEOHead";

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

const YoutubeAnalyzer = () => {
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
    const trimmedUrl = url.trim();

    // Check session cache first — same URL returns same result (consistent scoring)
    const cached = getCachedAnalysis(trimmedUrl);
    if (cached && !paymentToken) {
      setAnalysis(cached);
      setLoading(false);
      setAnalyzeDisabled(false);
      toast({ title: "Cached Result", description: "Showing saved analysis for this URL. Use a different URL for a new analysis." });
      return;
    }

    try {
      const bodyPayload: any = {
        url: trimmedUrl,
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

      // Cache the result for consistent scoring
      setCachedAnalysis(trimmedUrl, data.analysis);

      // Save analysis for logged-in user
      if (user) {
        await supabase.from("user_analyses" as any).insert({
          user_id: user.id,
          reel_url: trimmedUrl,
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
        : (err.message || "Analysis could not be completed right now. Please try a valid YouTube Shorts link again.");
      toast({ title: t.analysisFailed, description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setAnalyzeDisabled(false);
    }
  }, [url, caption, hashtags, likes, comments, views, shares, saves, sampleComments, lang, t, toast, user, refreshUsage, refreshCredits, loadAnalyses]);

  const handlePaymentSuccess = (paymentToken: string) => {
    setShowPaymentPopup(false);
    setPendingPaymentToken(paymentToken);
    setShowInterstitial(true);
    runAnalysis(paymentToken);
  };

  const [analyzeDisabled, setAnalyzeDisabled] = useState(false);

  const handleAnalyze = async () => {
    if (loading || analyzeDisabled) return;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) { toast({ title: t.enterUrl, variant: "destructive" }); return; }
    const ytPattern = /^https?:\/\/(www\.)?(m\.)?(youtube\.com\/(shorts\/|watch\?v=)|youtu\.be\/)/i;
    if (!ytPattern.test(trimmedUrl)) {
      toast({ title: "Invalid URL", description: "Please enter a valid YouTube Shorts URL", variant: "destructive" });
      return; 
    }
    if (trimmedUrl.length > 500) { toast({ title: "URL too long", variant: "destructive" }); return; }

    // === COOLDOWN CHECK (1 analysis per 60 seconds) ===
    const timeSinceLast = Date.now() - lastAnalysisTime;
    if (lastAnalysisTime > 0 && timeSinceLast < COOLDOWN_MS) {
      const waitSec = Math.ceil((COOLDOWN_MS - timeSinceLast) / 1000);
      toast({ title: "Please Wait", description: `You can analyze again in ${waitSec} seconds.`, variant: "destructive" });
      return;
    }

    // === CHECK SESSION CACHE — same URL gives same score ===
    const cached = getCachedAnalysis(trimmedUrl);
    if (cached) {
      setAnalysis(cached);
      toast({ title: "Cached Result", description: "Showing saved analysis for this URL (same score guaranteed)." });
      return;
    }

    // YouTube Shorts length check
    const isYTShorts = ytPattern.test(trimmedUrl);
    if (isYTShorts) {
      try {
        const dateCheckRes = await supabase.functions.invoke("check-reel-date", { body: { url: trimmedUrl } });
        if (dateCheckRes.error) {
          console.error("YouTube length check failed:", dateCheckRes.error);
        } else if (dateCheckRes.data?.isTooLong) {
          toast({ 
            title: "Video Too Long", 
            description: "YouTube Shorts analysis is only available for videos up to 50 seconds. This video is longer — please try a shorter one.", 
            variant: "destructive" 
          });
          return;
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
    
    // Deduct credits before running analysis
    const deducted = await deductCredits("reel_analysis");
    if (!deducted) {
      setAnalyzeDisabled(false);
      return;
    }

    setShowInterstitial(true);
    runAnalysis();
  };

  const handleTriggerRetry = async () => {
    dismissTrigger();
    const deducted = await deductCredits("reel_analysis");
    if (!deducted) return;
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
        title="Free YouTube Shorts Analyzer – Viral Score & Growth Tips | ReelAnalyzer"
        description="Analyze YouTube Shorts for viral potential, hook strength, YouTube algorithm compatibility & monetization readiness. Get free analysis with 5 monthly credits."
        keywords="youtube shorts analyzer, shorts viral checker, youtube algorithm, shorts analysis tool, viral score predictor, youtube monetization check, shorts engagement analyzer, youtube growth tool, shorts performance tracker, youtube policy compliance"
        canonical="https://reelsanylizer.in/youtube-analyzer"
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
      <section className="relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 hero-bg" />
        
        {/* Decorative glows */}
        <div className="absolute right-[-120px] top-[15%] w-[450px] h-[450px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.05) 40%, transparent 65%)" }} />
        <div className="absolute right-[5%] bottom-[-50px] w-[350px] h-[350px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)" }} />
        <div className="absolute left-[-80px] top-[10%] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 65%)" }} />

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-12 sm:pb-16 md:pb-20 lg:pb-28">
          {/* Top Badge - centered */}
          <motion.div 
            className="flex justify-center mb-8 sm:mb-10 md:mb-12 lg:mb-14"
            initial={{ opacity: 0, y: -15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.08, duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium border border-indigo-200 shadow-sm" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
              <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>5 Free Credits Every Month — No Card Required</span>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 sm:gap-8 md:gap-10 lg:gap-12 xl:gap-16">
            {/* Left Column: Title + Subtitle + Input */}
            <div className="flex-1 w-full">
              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 sm:mb-5 md:mb-6 tracking-[-0.02em] leading-[1.08] text-center lg:text-left"
                initial={{ opacity: 0, y: 25 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                Free YouTube Shorts{" "}
                <span className="gradient-primary">Analyzer</span>
              </motion.h1>
              
              <motion.p 
                className="text-base sm:text-lg md:text-[17px] text-center lg:text-left mb-8 sm:mb-10 md:mb-12 leading-relaxed text-muted-foreground max-w-none lg:max-w-xl"
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.25, duration: 0.6 }}
              >
                Paste your YouTube Shorts link and get a smart viral potential score with instant, actionable insights. Get 5 free credits every month — no payment required.
              </motion.p>

              {/* Input Card */}
              <motion.div 
                ref={inputRef} 
                className="w-full"
                initial={{ opacity: 0, y: 25 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.35, duration: 0.6 }}
              >
                <div className="p-5 sm:p-6 md:p-8 space-y-3 sm:space-y-4 rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-white/95 to-indigo-50/30 backdrop-blur-md" style={{ boxShadow: "0 8px 32px -4px rgba(99,102,241,0.12), 0 2px 4px rgba(0,0,0,0.03)" }}>
                  {/* Input with icon */}
                  <div className="relative group">
                    <LinkIcon className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                    <Input 
                      placeholder="https://www.youtube.com/shorts/..." 
                      value={url} 
                      onChange={(e) => setUrl(e.target.value)} 
                      className="pl-10 sm:pl-12 border-indigo-100/60 text-sm sm:text-[15px] rounded-xl input-focus-glow bg-white/70" 
                      style={{ height: '48px', minHeight: '48px' }} 
                    />
                  </div>

                  {/* Collapsible details button */}
                  <button 
                    type="button" 
                    onClick={() => setShowDetails(!showDetails)} 
                    className="w-full flex items-center justify-between px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-indigo-100/50 text-xs sm:text-sm transition-all duration-200 bg-indigo-50/40 hover:bg-indigo-50/70 text-muted-foreground hover:text-foreground group"
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 group-hover:scale-110 transition-transform" /> 
                      <span className="hidden sm:inline">Boost Accuracy — Add Details</span>
                      <span className="sm:hidden">Add Details</span>
                    </span>
                    {showDetails ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div className="space-y-3 pt-1" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                        <Input 
                          placeholder={t.captionPlaceholder} 
                          value={caption} 
                          onChange={(e) => setCaption(e.target.value)} 
                          className="border-indigo-100/50 h-10 sm:h-11 text-xs sm:text-sm rounded-lg sm:rounded-xl input-focus-glow bg-white/70" 
                        />
                        <Input 
                          placeholder={t.hashtagPlaceholder} 
                          value={hashtags} 
                          onChange={(e) => setHashtags(e.target.value)} 
                          className="border-indigo-100/50 h-10 sm:h-11 text-xs sm:text-sm rounded-lg sm:rounded-xl input-focus-glow bg-white/70" 
                        />
                        
                        {/* Metrics trigger */}
                        <button 
                          type="button" 
                          onClick={() => setShowMetrics(!showMetrics)} 
                          className="w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-indigo-100/50 text-xs sm:text-sm font-medium transition-all duration-200 bg-indigo-50/30 hover:bg-indigo-50/60 text-muted-foreground hover:text-foreground"
                        >
                          <span>{t.metricsLabel}</span>
                          {showMetrics ? <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                        
                        <AnimatePresence>
                          {showMetrics && (
                            <motion.div className="space-y-2 pt-1" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
                              <div className="grid grid-cols-2 gap-2">
                                <Input 
                                  type="number" 
                                  placeholder={t.likesPlaceholder} 
                                  value={likes} 
                                  onChange={(e) => setLikes(e.target.value)} 
                                  className="border-indigo-100/50 h-9 text-xs rounded-lg input-focus-glow bg-white/70" 
                                />
                                <Input 
                                  type="number" 
                                  placeholder={t.commentsPlaceholder} 
                                  value={comments} 
                                  onChange={(e) => setComments(e.target.value)} 
                                  className="border-indigo-100/50 h-9 text-xs rounded-lg input-focus-glow bg-white/70" 
                                />
                                <Input 
                                  type="number" 
                                  placeholder={t.viewsPlaceholder} 
                                  value={views} 
                                  onChange={(e) => setViews(e.target.value)} 
                                  className="border-indigo-100/50 h-9 text-xs rounded-lg input-focus-glow bg-white/70" 
                                />
                                <Input 
                                  type="number" 
                                  placeholder={t.sharesPlaceholder} 
                                  value={shares} 
                                  onChange={(e) => setShares(e.target.value)} 
                                  className="border-indigo-100/50 h-9 text-xs rounded-lg input-focus-glow bg-white/70" 
                                />
                                <Input 
                                  type="number" 
                                  placeholder={t.savesPlaceholder} 
                                  value={saves} 
                                  onChange={(e) => setSaves(e.target.value)} 
                                  className="border-indigo-100/50 h-9 text-xs rounded-lg input-focus-glow bg-white/70 col-span-2 sm:col-span-1" 
                                />
                              </div>
                              <Textarea 
                                placeholder={t.sampleCommentsPlaceholder} 
                                value={sampleComments} 
                                onChange={(e) => setSampleComments(e.target.value)} 
                                className="border-indigo-100/50 text-xs min-h-[65px] sm:min-h-[70px] resize-none rounded-lg sm:rounded-xl input-focus-glow bg-white/70" 
                                rows={3} 
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button 
                    onClick={handleAnalyze} 
                    disabled={loading || analyzeDisabled} 
                    className="w-full cta-gradient text-white font-semibold text-sm sm:text-base rounded-lg sm:rounded-xl border-0 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30"
                    style={{ height: '48px', minHeight: '48px' }}
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /><span className="hidden sm:inline">{t.analyzing}</span><span className="sm:hidden">Analyzing...</span></>
                    ) : (
                      <><TrendingUp className="w-4 h-4 mr-2" />{t.analyzeBtn}</>
                    )}
                  </Button>

                  <p className="text-center text-[10px] sm:text-[11px] pt-1.5 sm:pt-2 text-muted-foreground/60 flex items-center justify-center gap-1 leading-relaxed">
                    <Zap className="w-3 h-3 flex-shrink-0" />
                    <span>This analysis costs <strong>2 credits</strong></span>
                  </p>

                  {user ? (
                    <p className="text-center text-xs sm:text-[13px] pt-1.5 sm:pt-2 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{totalCredits > 0 ? `${totalCredits} credit${totalCredits !== 1 ? "s" : ""} available` : "No credits remaining"}</span>
                      </span>
                    </p>
                  ) : (
                    <button 
                      onClick={() => setShowLoginPrompt(true)} 
                      className="w-full text-center text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center justify-center gap-1.5 pt-1.5 sm:pt-2 font-medium transition-colors"
                    >
                      <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Sign in with Google to get 5 free credits</span>
                      <span className="sm:hidden">Sign in to get credits</span>
                    </button>
                  )}
                  <p className="text-center text-[10px] sm:text-[11px] pt-0.5 sm:pt-1 text-muted-foreground/60 leading-relaxed">Auto-extracts data if you skip optional fields</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Illustration - Responsive on all screens */}
            <motion.div 
              className="w-full md:w-auto lg:flex-1 flex flex-shrink-0 items-center justify-center relative"
              initial={{ opacity: 0, x: 50, scale: 0.85 }} 
              animate={{ opacity: 1, x: 0, scale: 1 }} 
              transition={{ delay: 0.45, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <img 
                src={heroIllustration} 
                alt="YouTube Shorts analysis illustration — magnifying glass analyzing YouTube video metrics and viral potential" 
                width="480" 
                height="420" 
                loading="eager" 
                decoding="async" 
                className="w-full max-w-sm md:max-w-md lg:max-w-none lg:w-[500px] h-auto object-contain drop-shadow-lg" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Partners Carousel */}
      {!analysis && <CreatorPartnersCarousel />}

      {/* Trust Badges */}
      {!analysis && <TrustBadges />}

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
              <p className="text-sm text-muted-foreground">Want to check another YouTube Shorts? <span className="text-foreground font-medium">Share this tool with a friend.</span></p>
              <ShareToolPopup />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-analysis sections */}
      {!analysis && (
        <div className="relative z-10">
          {/* YouTube-Specific Features */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Why Analyze Your YouTube Shorts?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">Get data-driven insights to make your Shorts go viral on YouTube's algorithm</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-foreground mb-2">Hook Analysis</h3>
                <p className="text-sm text-muted-foreground">Check if your first 2-3 seconds grab attention on YouTube</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold text-foreground mb-2">Caption & Metadata</h3>
                <p className="text-sm text-muted-foreground">Optimize titles and descriptions for YouTube search</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-semibold text-foreground mb-2">Viral Prediction</h3>
                <p className="text-sm text-muted-foreground">Get a 0-100 viral score based on YouTube algorithm patterns</p>
              </div>
              <div className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-semibold text-foreground mb-2">Policy Check</h3>
                <p className="text-sm text-muted-foreground">Ensure your Shorts meet YouTube monetization requirements</p>
              </div>
            </div>
          </section>

          {/* How It Works - YouTube Specific */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8 border-t border-border">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How to Use YouTube Shorts Analyzer</h2>
              <p className="text-muted-foreground">3 simple steps to get viral insights</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-primary">1</div>
                <h3 className="font-semibold text-foreground mb-2">Copy Your Shorts URL</h3>
                <p className="text-sm text-muted-foreground">Paste any YouTube Shorts link (youtube.com/shorts/...)</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-primary">2</div>
                <h3 className="font-semibold text-foreground mb-2">Add Optional Details</h3>
                <p className="text-sm text-muted-foreground">Include caption, hashtags, or engagement metrics for accuracy</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-primary">3</div>
                <h3 className="font-semibold text-foreground mb-2">Get Viral Score</h3>
                <p className="text-sm text-muted-foreground">Receive detailed analysis with actionable YouTube tips</p>
              </div>
            </div>
          </section>

          {/* YouTube Specific Tips */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8 border-t border-border">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">YouTube Shorts Growth Tips</h2>
              <p className="text-muted-foreground">What successful creators know about the algorithm</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">🚀 First 2 Seconds Matter</h3>
                <p className="text-sm text-muted-foreground">YouTube tracks retention from the very start. Hook viewers immediately or your Shorts won't reach the algorithm's test audience.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">🔄 Replay Rate is Gold</h3>
                <p className="text-sm text-muted-foreground">When viewers watch your Shorts multiple times, YouTube treats it as a strong engagement signal and pushes it to more people.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">⏱️ Shorter is Better</h3>
                <p className="text-sm text-muted-foreground">Keep Shorts between 15-35 seconds for high completion rates. YouTube rewards videos people finish watching.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">💰 Monetization Ready?</h3>
                <p className="text-sm text-muted-foreground">Our analyzer checks if your Shorts meet YouTube Partner Program requirements and community guidelines.</p>
              </div>
            </div>
          </section>

          <TrustedReviewsCarousel />

          {/* CTA Section */}
          <section className="max-w-2xl mx-auto px-4 sm:px-6 py-14 text-center space-y-4 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground">Ready to Grow Your YouTube Shorts?</h2>
            <p className="text-muted-foreground">Get free analysis with 5 monthly credits. No payment required.</p>
            <Button 
              onClick={scrollToInput}
              className="cta-gradient text-white font-semibold rounded-xl border-0"
              style={{ height: '50px', width: '100%', maxWidth: '300px', margin: '0 auto', display: 'block' }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze Your Shorts Now
            </Button>
          </section>

          {/* About Section */}
          <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
            <h2 className="text-lg font-bold text-foreground">YouTube Shorts Analyzer Tool</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ReelAnalyzer is a free YouTube Shorts analyzer tool that helps creators understand what makes videos go viral on YouTube. Get instant analysis on your Shorts' viral potential, hook strength, YouTube algorithm compatibility, and monetization readiness — all in seconds.
            </p>
            <h3 className="text-base font-semibold text-foreground">How Does YouTube Shorts Analysis Help Creators?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YouTube Shorts creators who analyze their content before posting see 2-3x better performance on average. Our YouTube Shorts analyzer checks hook effectiveness, content length optimization, caption quality, hashtag strategy, and YouTube policy compliance. Get specific, actionable recommendations to improve retention, increase replays, boost engagement signals, and meet YouTube's monetization requirements.
            </p>
            <h3 className="text-base font-semibold text-foreground">Why YouTube Shorts Analysis Matters in 2026</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YouTube is increasingly pushing Shorts as a competitor to TikTok and Instagram Reels. The algorithm is ruthless — if your first 2-3 seconds don't grab attention, your Shorts never leave YouTube's test phase. Our analyzer helps you optimize every aspect before posting, so you don't waste time on content that won't perform or might violate monetization guidelines.
            </p>
          </section>

          <InternalLinks currentPath="/youtube-analyzer" />

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

export default YoutubeAnalyzer;
