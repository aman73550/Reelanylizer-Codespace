import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Wand2, Coins, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CreditPaywallProps {
  tool: "reel_analysis" | "seo_optimizer";
  open: boolean;
  onClose: () => void;
}

const DEFAULT_PLANS_MINI = [
  { name: "Starter", id: "starter", price: 49, credits: 15, color: "text-emerald-600 bg-emerald-50" },
  { name: "Popular", id: "popular", price: 99, credits: 45, color: "text-primary bg-primary/10", badge: true },
  { name: "Pro", id: "pro", price: 199, credits: 120, color: "text-violet-600 bg-violet-50" },
];

const CreditPaywall = ({ tool, open, onClose }: CreditPaywallProps) => {
  const { totalCredits, creditCosts } = useCredits();
  const navigate = useNavigate();
  const cost = creditCosts[tool];
  const toolName = tool === "reel_analysis" ? "Reel Analysis" : "SEO Optimizer";
  const [PLANS_MINI, setPlans] = useState(DEFAULT_PLANS_MINI);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("config_key, config_value")
        .like("config_key", "pack_%");
      if (data && data.length > 0) {
        const cm: Record<string, string> = {};
        for (const r of data) cm[r.config_key] = r.config_value;
        setPlans(DEFAULT_PLANS_MINI.map(p => {
          const np = cm[`pack_${p.id}_price`] ? parseInt(cm[`pack_${p.id}_price`]) : p.price;
          const nc = cm[`pack_${p.id}_credits`] ? parseInt(cm[`pack_${p.id}_credits`]) : p.credits;
          return { ...p, price: np || p.price, credits: nc || p.credits };
        }));
      }
    };
    load();
  }, [open]);

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="max-w-sm w-full p-6 sm:p-8 text-center border border-border bg-card shadow-2xl rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary" />
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1.5">Not Enough Credits</h3>
          <p className="text-sm text-muted-foreground mb-5">
            <strong>{toolName}</strong> needs <strong className="text-primary">{cost} credit{cost > 1 ? "s" : ""}</strong>, but you have{" "}
            <strong className="text-foreground">{totalCredits}</strong>.
          </p>

          {/* Credit comparison */}
          <div className="flex items-center justify-center gap-4 mb-5 p-3 rounded-xl bg-muted/50 border border-border">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Have</p>
              <p className="text-xl font-bold text-foreground">{totalCredits}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Need</p>
              <p className="text-xl font-bold text-primary">{cost}</p>
            </div>
          </div>

          {/* Mini plans */}
          <div className="space-y-2 mb-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Quick top-up options</p>
            {PLANS_MINI.map((p) => (
              <button
                key={p.name}
                onClick={() => { onClose(); navigate("/pricing"); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border hover:border-primary/30 transition-colors text-left ${p.badge ? "ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.color}`}>{p.credits}</span>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                  {p.badge && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">BEST</span>}
                </div>
                <span className="text-sm font-bold text-foreground">₹{p.price}</span>
              </button>
            ))}
          </div>

          <Button
            onClick={() => { onClose(); navigate("/pricing"); }}
            className="w-full cta-gradient text-white font-semibold h-11 rounded-xl text-sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            View All Credit Packs
          </Button>

          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground mt-3 block mx-auto transition-colors">
            Maybe later
          </button>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CreditPaywall;
