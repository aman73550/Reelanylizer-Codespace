import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Wand2, Coins, Zap, Music, Hash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/LangContext";
import UserReviews from "@/components/UserReviews";
import SEOProcessingOverlay from "@/components/SEOProcessingOverlay";
import SEOResultsDisplay from "@/components/SEOResultsDisplay";
import LoginPrompt from "@/components/LoginPrompt";
import CreditPaywall from "@/components/CreditPaywall";
import TrustBadges from "@/components/TrustBadges";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import seoIllustration from "@/assets/seo-illustration.webp";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SEOOptimizerSection = () => {
  const [input, setInput] = useState("");
  const { lang } = useLang();
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [seoResults, setSeoResults] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCreditPaywall, setShowCreditPaywall] = useState(false);
  const { user, refreshUsage, loadAnalyses } = useAuth();
  const { canAfford, deductCredits, refreshCredits } = useCredits();

  const [submitDisabled, setSubmitDisabled] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (isProcessing || submitDisabled) return;
    if (!input.trim()) {
      toast.error(lang === "hi" ? "पहले अपना टॉपिक डालें" : "Please enter your topic first");
      return;
    }
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (!canAfford("seo_optimizer")) {
      setShowCreditPaywall(true);
      return;
    }
    setSubmitDisabled(true);
    // Deduct credit before running
    const deducted = await deductCredits("seo_optimizer");
    if (!deducted) { setSubmitDisabled(false); return; }
    setIsProcessing(true);
    setAnalysisComplete(false);
    setSeoResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("seo-analyze", { body: { topic: input.trim() } });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "SEO analysis failed");
      setSeoResults(data.data);
      setAnalysisComplete(true);
      if (user) {
        await supabase.from("user_analyses" as any).insert({
          user_id: user.id,
          reel_url: `seo:${input.trim().slice(0, 100)}`,
          viral_score: null,
          analysis_data: { type: "seo", topic: input.trim() },
        } as any);
        await refreshUsage();
        await refreshCredits();
        await loadAnalyses();
      }
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
      setIsProcessing(false);
    } finally {
      setSubmitDisabled(false);
    }
  }, [user, canAfford, deductCredits, input, lang, refreshUsage, refreshCredits, loadAnalyses, isProcessing, submitDisabled]);

  const handleProcessingComplete = useCallback(() => { setIsProcessing(false); }, []);

  return (
    <div className="relative z-10">
      <LoginPrompt open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      <CreditPaywall tool="seo_optimizer" open={showCreditPaywall} onClose={() => setShowCreditPaywall(false)} />
      <SEOProcessingOverlay show={isProcessing} analysisComplete={analysisComplete} onComplete={handleProcessingComplete} />

      {seoResults && !isProcessing ? (
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SEOResultsDisplay data={seoResults} topic={input} />
          </motion.div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="hero-bg relative overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-8 lg:pt-20 lg:pb-12">
              {/* Top Badge */}
              <motion.div
                className="flex justify-center mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-xs font-medium text-primary">
                  <Search className="w-3.5 h-3.5" />
                  {lang === "hi" ? "फ्री टूल — SEO ऑप्टिमाइज़ेशन (1 Credit)" : "Free Tool — SEO Optimization (1 Credit)"}
                </div>
              </motion.div>

              {/* Two Column Layout */}
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left Column */}
                <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
                  <motion.h1
                    className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-foreground leading-tight mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    Reel <span className="gradient-primary">SEO Optimizer</span>
                  </motion.h1>

                  <motion.p
                    className="text-base sm:text-lg text-muted-foreground mb-6 max-w-md mx-auto lg:mx-0"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {lang === "hi"
                      ? "ट्रेंडिंग टाइटल, हैशटैग, म्यूज़िक और कंटेंट सुधार टिप्स पाएं"
                      : "Unlock trending titles, hashtags, music, and content improvement tips for your Instagram Reels."}
                  </motion.p>

                  {/* Feature Icons */}
                  <motion.div
                    className="flex items-center justify-center lg:justify-start gap-3 mb-8"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    {[
                      { icon: Zap, bg: "bg-yellow-100", color: "text-yellow-500" },
                      { icon: Music, bg: "bg-blue-100", color: "text-blue-500" },
                      { icon: Hash, bg: "bg-purple-100", color: "text-purple-500" },
                    ].map((item, i) => (
                      <div key={i} className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                    ))}
                  </motion.div>

                  {/* Input Card */}
                  <motion.div
                    className="w-full max-w-lg mx-auto lg:mx-0"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  >
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={lang === "hi" ? "अपना रील कॉन्टेक्स्ट यहाँ डालें..." : "Enter your reel context, caption, or topic here..."}
                      className="min-h-[56px] max-h-[56px] bg-background border-border/60 text-foreground placeholder:text-muted-foreground/60 resize-none rounded-xl text-base px-5 py-4 shadow-low mb-4"
                    />

                    <Button
                      onClick={handleSubmit}
                      disabled={isProcessing || !input.trim()}
                      className="w-full py-6 text-base font-semibold rounded-xl cta-gradient text-primary-foreground"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      {isProcessing
                        ? "Analyzing..."
                        : user
                        ? "Start SEO Analysis (2 Credits)"
                        : "Login & Analyze"}
                    </Button>

                    {user && (
                      <div className="flex items-center justify-center lg:justify-start gap-2 mt-3 text-xs text-muted-foreground">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        SEO Optimizer costs 2 credits per use
                      </div>
                    )}

                    {!user && (
                      <p
                        className="text-center lg:text-left text-xs text-primary mt-3 cursor-pointer hover:underline"
                        onClick={() => setShowLoginPrompt(true)}
                      >
                        Sign in to get 5 free credits
                      </p>
                    )}

                    <p className="text-center lg:text-left text-[11px] text-muted-foreground/60 mt-2">
                      Auto extracts data if you skip optional fields
                    </p>
                  </motion.div>
                </div>

                {/* Right Column — Illustration */}
                <motion.div
                  className="hidden lg:flex flex-1 items-center justify-center relative"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <div
                    className="absolute inset-0 rounded-full blur-[80px] opacity-30"
                    style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)" }}
                  />
                  <img
                    src={seoIllustration}
                    alt="SEO Optimizer Illustration"
                    className="relative z-10 w-[420px] max-w-full drop-shadow-xl"
                    width={420}
                    height={420}
                    loading="eager"
                  />
                </motion.div>
              </div>
            </div>

            {/* Trust Badges */}
            <TrustBadges variant="seo" />
          </section>

          {/* Reviews */}
          <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <UserReviews title={lang === "hi" ? "SEO टूल रिव्यू" : "SEO Tool Reviews"} />
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default SEOOptimizerSection;
