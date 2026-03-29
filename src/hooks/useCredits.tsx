import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CreditState {
  freeCredits: number;
  paidCredits: number;
  totalCredits: number;
  freeCreditsResetAt: Date | null;
  daysUntilReset: number;
  referralCode: string;
  loading: boolean;
  creditCosts: { reel_analysis: number; seo_optimizer: number };
  creditCostDisplay: { reel: string; youtube: string; seo: string };
  canAfford: (tool: "reel_analysis" | "seo_optimizer") => boolean;
  deductCredits: (tool: "reel_analysis" | "seo_optimizer") => Promise<boolean>;
  refreshCredits: () => Promise<void>;
  addPaidCredits: (amount: number, paymentId?: string) => Promise<boolean>;
}

export const useCredits = (): CreditState => {
  const { user } = useAuth();
  const [freeCredits, setFreeCredits] = useState(0);
  const [paidCredits, setPaidCredits] = useState(0);
  const [freeCreditsResetAt, setFreeCreditsResetAt] = useState<Date | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [creditCosts, setCreditCosts] = useState({ reel_analysis: 2, seo_optimizer: 2 });

  // Load credit costs from config
  useEffect(() => {
    const loadCosts = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("config_key, config_value")
        .in("config_key", ["credit_cost_reel_analysis", "credit_cost_seo_optimizer"]);
      if (data) {
        const costs = { ...creditCosts };
        for (const row of data) {
          if (row.config_key === "credit_cost_reel_analysis") costs.reel_analysis = parseInt(row.config_value) || 2;
          if (row.config_key === "credit_cost_seo_optimizer") costs.seo_optimizer = parseInt(row.config_value) || 2;
        }
        setCreditCosts(costs);
      }
    };
    loadCosts();
  }, []);

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setFreeCredits(0);
      setPaidCredits(0);
      setLoading(false);
      return;
    }

    // First try to reset expired free credits
    await supabase.rpc("reset_free_credits_if_expired", { p_user_id: user.id });

    // Get or create user credits
    let { data, error } = await supabase
      .from("user_credits" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data && !error) {
      // First time user - create credits row
      const { data: newData } = await supabase
        .from("user_credits" as any)
        .insert({ user_id: user.id } as any)
        .select("*")
        .single();
      data = newData;
    }

    if (data) {
      const d = data as any;
      setFreeCredits(d.free_credits || 0);
      setPaidCredits(d.paid_credits || 0);
      setFreeCreditsResetAt(d.free_credits_reset_at ? new Date(d.free_credits_reset_at) : null);
      setReferralCode(d.referral_code || "");
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const totalCredits = freeCredits + paidCredits;

  const daysUntilReset = freeCreditsResetAt
    ? Math.max(0, Math.ceil((freeCreditsResetAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const canAfford = useCallback(
    (tool: "reel_analysis" | "seo_optimizer") => {
      const cost = creditCosts[tool];
      return totalCredits >= cost;
    },
    [totalCredits, creditCosts]
  );

  const deductCredits = useCallback(
    async (tool: "reel_analysis" | "seo_optimizer"): Promise<boolean> => {
      if (!user) return false;
      const cost = creditCosts[tool];
      if (totalCredits < cost) {
        toast.error(`Not enough credits! Need ${cost}, have ${totalCredits}`);
        return false;
      }

      // Deduct free credits first, then paid
      let freeDeduct = Math.min(freeCredits, cost);
      let paidDeduct = cost - freeDeduct;

      const { error } = await supabase
        .from("user_credits" as any)
        .update({
          free_credits: freeCredits - freeDeduct,
          paid_credits: paidCredits - paidDeduct,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to deduct credits");
        return false;
      }

      // Log transaction
      await supabase.from("credit_transactions" as any).insert({
        user_id: user.id,
        amount: -cost,
        credit_type: freeDeduct > 0 ? "free" : "paid",
        description: `Used ${cost} credit${cost > 1 ? "s" : ""} for ${tool === "reel_analysis" ? "Reel Analysis" : "SEO Optimizer"}`,
        tool_used: tool,
      } as any);

      setFreeCredits((prev) => prev - freeDeduct);
      setPaidCredits((prev) => prev - paidDeduct);

      return true;
    },
    [user, freeCredits, paidCredits, totalCredits, creditCosts]
  );

  const addPaidCredits = useCallback(
    async (amount: number, paymentId?: string): Promise<boolean> => {
      if (!user) return false;

      const { error } = await supabase
        .from("user_credits" as any)
        .update({
          paid_credits: paidCredits + amount,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      if (error) return false;

      await supabase.from("credit_transactions" as any).insert({
        user_id: user.id,
        amount,
        credit_type: "purchase",
        description: `Purchased ${amount} credits`,
        payment_id: paymentId,
      } as any);

      setPaidCredits((prev) => prev + amount);
      return true;
    },
    [user, paidCredits]
  );

  const creditCostDisplay = {
    reel: "2 credits",
    youtube: "2 credits",
    seo: "2 credits",
  };

  return {
    freeCredits,
    paidCredits,
    totalCredits,
    freeCreditsResetAt,
    daysUntilReset,
    referralCode,
    loading,
    creditCosts,
    creditCostDisplay,
    canAfford,
    deductCredits,
    refreshCredits,
    addPaidCredits,
  };
};
