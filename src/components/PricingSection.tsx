import { motion } from "framer-motion";
import { Wand2, Shield, Zap, CreditCard, Check, Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

const PLANS = [
  {
    name: "Starter",
    id: "starter",
    price: 49,
    credits: 15,
    color: "from-emerald-400 to-emerald-500",
    borderColor: "border-emerald-200",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)",
    btnClass: "bg-emerald-500 hover:bg-emerald-600",
    highlight: false,
  },
  {
    name: "Popular",
    id: "popular",
    price: 99,
    credits: 45,
    color: "from-primary to-purple-500",
    borderColor: "border-primary/40",
    bgGradient: "linear-gradient(135deg, #f0f0ff 0%, #ede9fe 50%, #f0f0ff 100%)",
    btnClass: "bg-primary hover:bg-primary/90",
    highlight: true,
    badge: "BEST VALUE",
  },
  {
    name: "Pro",
    id: "pro",
    price: 199,
    credits: 120,
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-200",
    bgGradient: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f5f3ff 100%)",
    btnClass: "bg-violet-600 hover:bg-violet-700",
    highlight: false,
  },
  {
    name: "Power",
    id: "power",
    price: 399,
    credits: 300,
    color: "from-orange-400 to-orange-500",
    borderColor: "border-orange-200",
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%)",
    btnClass: "bg-orange-500 hover:bg-orange-600",
    highlight: false,
  },
];

const COIN_EMOJIS = ["🪙", "💰", "🏆", "⚡"];

const PricingSection = () => {
  const { user, signInWithGoogle } = useAuth();
  const { refreshCredits } = useCredits();
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Order creation failed");

      if (data.gateway === "free_test") {
        await refreshCredits();
        toast.success(`🎉 ${data.credits} credits added to your account!`);
        return;
      }

      if (data.gateway === "paytm" && data.txnToken) {
        // Load Paytm checkout JS
        const script = document.createElement("script");
        script.src = `https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${data.mid}.js`;
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
                // Verify via callback endpoint
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
    <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 30%, #E8E4FF 60%, #F0EDFF 100%)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-white/60 animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s` }} />
        ))}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 relative z-10">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-6" style={{ background: "#EEF2FF", color: "#6366F1" }}>
            <Wand2 className="w-4 h-4" />
            Get More Credits & <span className="font-bold text-primary">Boost Your Reels</span>
            <Wand2 className="w-4 h-4" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">Credit Packs</h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">Unlock full analysis reports, SEO tips & viral strategies with credit packs.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-[1100px] mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} className="relative" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold tracking-wider flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                    {plan.badge}
                  </div>
                </div>
              )}
              <Card className={`relative p-6 text-center border-2 ${plan.borderColor} ${plan.highlight ? "scale-[1.02] shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "shadow-sm"} transition-all hover:shadow-md hover:-translate-y-1 duration-300`} style={{ background: plan.bgGradient, borderRadius: "16px" }}>
                <div className="text-4xl mb-3">{COIN_EMOJIS[i]}</div>
                <h3 className={`text-lg font-bold mb-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-foreground">₹{plan.price}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5 flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{plan.credits}</span> Credits
                </p>
                <Button
                  onClick={() => handlePurchase(plan)}
                  disabled={purchasing === plan.id}
                  className={`w-full text-white font-semibold rounded-xl h-11 text-sm ${plan.btnClass} transition-all duration-200 hover:scale-[1.02] hover:shadow-md`}
                >
                  {purchasing === plan.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
                  ) : (
                    `Buy ${plan.name}`
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div className="text-center mt-8 space-y-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
          <p className="text-sm font-medium text-foreground">Credits never expire.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" />Free monthly credits reward</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" />No monthly limits</span>
            <span className="hidden sm:inline text-border">|</span>
            <span className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5 text-primary" />Secure UPI payments</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
