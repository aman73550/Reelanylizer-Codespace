import { motion } from "framer-motion";
import { Wand2, Shield, Zap, CreditCard, Check, Loader2, IndianRupee, ArrowRight, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const DEFAULT_PLANS = [
  {
    name: "Free",
    id: "free",
    price: 0,
    credits: 5,
    perCredit: "Free",
    icon: "🏛️",
    color: "from-slate-500 to-slate-600",
    accentBg: "bg-slate-50",
    accentText: "text-slate-600",
    accentBorder: "border-slate-200",
    btnClass: "bg-slate-500 hover:bg-slate-600",
    features: ["5 Monthly Credits (Rollover)", "Standard Video Analysis", "Standard SEO Audits", "Low Priority Processing", "Standard Support", "Monthly Reset"],
    highlight: false,
    badge: null,
  },
  {
    name: "Starter",
    id: "starter",
    price: 49,
    credits: 15,
    perCredit: "₹3.27",
    icon: "🏛️",
    color: "from-amber-500 to-yellow-500",
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
    accentBorder: "border-amber-200",
    btnClass: "bg-amber-500 hover:bg-amber-600",
    features: ["15 Analysis Credits", "Deep Video Analysis", "Comprehensive SEO Audits", "Priority Processing", "Premium Data Insights", "Priority Support", "No Expiry"],
    highlight: false,
    badge: null,
  },
  {
    name: "Pro",
    id: "pro",
    price: 199,
    credits: 120,
    perCredit: "₹1.66",
    icon: "🏆",
    color: "from-violet-500 to-purple-600",
    accentBg: "bg-violet-50",
    accentText: "text-violet-600",
    accentBorder: "border-violet-200",
    btnClass: "bg-violet-600 hover:bg-violet-700",
    features: ["120 Analysis Credits", "Deep Video Analysis", "Comprehensive SEO Audits", "Priority Processing", "Premium Data Insights", "Advanced Reporting", "Dedicated Support", "No Expiry"],
    highlight: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Power",
    id: "power",
    price: 399,
    credits: 300,
    perCredit: "₹1.33",
    icon: "⚡",
    color: "from-orange-500 to-amber-500",
    accentBg: "bg-orange-50",
    accentText: "text-orange-600",
    accentBorder: "border-orange-200",
    btnClass: "bg-orange-500 hover:bg-orange-600",
    features: ["300 Analysis Credits", "Deep Video Analysis", "Comprehensive SEO Audits", "Priority Processing", "Premium Data Insights", "Enterprise Reporting", "Dedicated Priority Support", "Team Use", "Lowest Cost per Credit", "No Expiry"],
    highlight: false,
    badge: "BEST VALUE",
  },
];

const FAQ = [
  { q: "Do credits expire?", a: "Paid credits (Starter, Pro, Power plans) never expire. Free plan credits (5/month) roll over and never expire." },
  { q: "How many credits does analysis cost?", a: "Instagram Reel Analysis costs 2 credits. YouTube Shorts Analysis costs 2 credits. SEO Optimizer costs 2 credits." },
  { q: "Can I get a refund?", a: "We offer refunds within 24 hours if no credits have been used. 100% money-back guarantee." },
  { q: "Is payment secure?", a: "Yes, all payments are processed securely via Razorpay with bank-grade encryption and SSL protection." },
  { q: "Do I need a credit card for Free plan?", a: "No card required for the Free plan! Get 5 monthly credits just by signing up — they roll over if unused." },
  { q: "Which plan is best for me?", a: "Free for trying it out, Starter for casual creators, Pro for active creators, Power for teams and agencies." },
];

const PricingPage = () => {
  const { user, signInWithGoogle } = useAuth();
  const { refreshCredits } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [PLANS, setPlans] = useState(DEFAULT_PLANS);

  // Load custom pack pricing from config
  useEffect(() => {
    const loadPackPricing = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("config_key, config_value")
        .like("config_key", "pack_%");
      if (data && data.length > 0) {
        const configMap: Record<string, string> = {};
        for (const row of data) configMap[row.config_key] = row.config_value;
        
        setPlans(DEFAULT_PLANS.map(plan => {
          const priceKey = `pack_${plan.id}_price`;
          const creditsKey = `pack_${plan.id}_credits`;
          const newPrice = configMap[priceKey] ? parseInt(configMap[priceKey]) : plan.price;
          const newCredits = configMap[creditsKey] ? parseInt(configMap[creditsKey]) : plan.credits;
          return {
            ...plan,
            price: newPrice || plan.price,
            credits: newCredits || plan.credits,
            perCredit: `₹${(newPrice / newCredits).toFixed(1)}`,
          };
        }));
      }
    };
    loadPackPricing();
  }, []);

  const handlePurchase = async (plan: typeof PLANS[0]) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    setPurchasing(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-paytm-order", {
        body: { planId: plan.id },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error("Payment service temporarily unavailable. Please try again.");
      }
      if (!data?.success) throw new Error(data?.error || "Order creation failed");

      if (data.gateway === "paytm" && data.txnToken) {
        const script = document.createElement("script");
        script.src = `https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/${data.mid}.js`;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          if (!(window as any).Paytm?.CheckoutJS) {
            toast.error("Payment gateway failed to load");
            return;
          }
          (window as any).Paytm.CheckoutJS.init({
            root: "",
            flow: "DEFAULT",
            data: {
              orderId: data.orderId,
              token: data.txnToken,
              tokenType: "TXN_TOKEN",
              amount: data.amount.toString(),
            },
            payMode: { labels: {}, filter: { include: ["UPI"] } },
            merchant: { mid: data.mid, redirect: false },
            handler: {
              transactionStatus: async (response: any) => {
                const { data: verifyData } = await supabase.functions.invoke("paytm-callback", {
                  body: {
                    orderId: data.orderId,
                    txnId: response.TXNID,
                    status: response.STATUS,
                    checksumHash: response.CHECKSUMHASH,
                  },
                });
                if (verifyData?.status === "SUCCESS") {
                  await refreshCredits();
                  toast.success(`🎉 ${plan.credits} credits added!`);
                } else if (verifyData?.status === "PENDING") {
                  toast("⏳ Payment pending. Credits will be added once confirmed.");
                } else {
                  toast.error("❌ Payment failed or cancelled.");
                }
                (window as any).Paytm.CheckoutJS.close();
              },
              notifyMerchant: (eventName: string) => {
                console.log("Paytm event:", eventName);
              },
            },
          }).then(() => {
            (window as any).Paytm.CheckoutJS.invoke();
          }).catch((err: any) => {
            console.error("Paytm init error:", err);
            toast.error("Payment initialization failed");
          });
        };
        document.body.appendChild(script);
        return;
      }

      throw new Error("Unsupported payment gateway");
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <>
      <SEOHead 
        title="Pricing Plans – Credit Packs for Reel & YouTube Shorts Analysis | ReelAnalyzer"
        description="Affordable credit packs for Instagram Reel and YouTube Shorts analysis. Unlock full reports, SEO optimization & viral strategies. Pay once, use anytime."
        keywords="reel analyzer pricing, analysis credits, instagram reel credits, youtube shorts credits, affordable analysis tool, reel analysis plans, viral content analysis, creator tools pricing"
        canonical="https://reelsanylizer.in/pricing"
      />
      <div className="page-surface min-h-screen">
      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-8 sm:pb-12 text-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-6" style={{ background: "#EEF2FF", color: "#6366F1" }}>
            <Wand2 className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            Credit Packs for <span className="gradient-primary">Creators</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Get more credits to unlock full analysis reports, SEO optimization, and viral strategies. Pay once, use anytime.
          </p>
        </motion.div>

        {/* Free tier callout */}
        <motion.div
          className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl border border-primary/20 bg-primary/5"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        >
          <Crown className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Get started free with <strong className="text-primary">5 monthly credits</strong> in the Free plan — no card required
          </span>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-md">
                    <Star className="w-3 h-3 fill-current" />
                    {plan.badge}
                  </div>
                </div>
              )}
              <Card
                className={`relative overflow-hidden border-2 ${plan.accentBorder} ${
                  plan.highlight
                    ? "scale-[1.03] shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                    : "shadow-sm hover:shadow-md"
                } transition-all duration-300 hover:-translate-y-1`}
                style={{ borderRadius: "20px" }}
              >
                {/* Gradient header strip */}
                <div className={`h-1.5 bg-gradient-to-r ${plan.color}`} />

                <div className="p-6 pt-5 text-center">
                  <div className="text-4xl mb-3">{plan.icon}</div>
                  <h3 className={`text-lg font-bold mb-1 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                    {plan.name}
                  </h3>

                  <div className="my-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold text-foreground">₹{plan.price}</span>
                    </div>
                    
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${plan.accentBg} ${plan.accentText} text-sm font-semibold mb-5`}>
                    <Zap className="w-3.5 h-3.5" />
                    {plan.credits} Credits
                  </div>

                  <ul className="space-y-2.5 mb-6 text-left">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.accentText}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(plan)}
                    disabled={purchasing === plan.id}
                    className={`w-full text-white font-semibold rounded-xl h-12 text-sm ${plan.btnClass} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
                  >
                    {purchasing === plan.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                    ) : (
                      <>Get {plan.name} <ArrowRight className="w-4 h-4 ml-1.5" /></>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust bar */}
        <motion.div
          className="text-center mt-10 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm font-medium text-foreground">Paid credits never expire. Use them anytime.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" />5 free credits every month — with rollover
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" />Secure UPI payments
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-primary" />Instant credit delivery
            </span>
          </div>
        </motion.div>
      </section>

      {/* Credit usage info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">How Credits Work</h2>
          <p className="text-muted-foreground text-sm">Simple credit-based system — no subscriptions, no hidden fees.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "🎯", title: "Reel Analysis", cost: "2 credits", desc: "Full report with viral score, hook analysis, and PDF export" },
            { icon: "🎬", title: "YouTube Shorts", cost: "2 credits", desc: "Viral potential score with YouTube algorithm insights" },
            { icon: "🔍", title: "SEO Optimizer", cost: "2 credits", desc: "Caption, hashtag, and keyword optimization" },
            { icon: "🎁", title: "Free Monthly", cost: "5 credits", desc: "Every user gets 5 free credits each month — credits roll over if unused" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="p-5 rounded-2xl border border-border bg-card/80 text-center"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{item.title}</h3>
              <p className="text-primary font-bold text-lg mb-2">{item.cost}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 sm:px-8 pb-20">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <button
              key={i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full text-left p-4 rounded-xl border border-border bg-card/80 hover:bg-card transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground text-sm">{item.q}</span>
                <span className="text-muted-foreground text-lg">{openFaq === i ? "−" : "+"}</span>
              </div>
              {openFaq === i && (
                <motion.p
                  className="text-sm text-muted-foreground mt-2 leading-relaxed"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  {item.a}
                </motion.p>
              )}
            </button>
          ))}
        </div>
      </section>

      <Footer />
      </div>
    </>
  );
};

export default PricingPage;
