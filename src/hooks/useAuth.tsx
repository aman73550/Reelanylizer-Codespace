import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

interface AnalysisRecord {
  id: string;
  reel_url: string;
  viral_score: number | null;
  created_at: string;
  analysis_data: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  credits: number;
  maxCredits: number;
  canUseCredit: boolean;
  isBlocked: boolean;
  refreshUsage: () => Promise<void>;
  analyses: AnalysisRecord[];
  loadAnalyses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  credits: 0,
  maxCredits: 3,
  canUseCredit: false,
  isBlocked: false,
  refreshUsage: async () => {},
  analyses: [],
  loadAnalyses: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedCredits, setUsedCredits] = useState(0);
  const [maxCredits, setMaxCredits] = useState(3);
  const [unlimitedCredits, setUnlimitedCredits] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [extraCredits, setExtraCredits] = useState(0);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadLimit = async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("config_key, config_value")
        .in("config_key", ["user_analysis_limit", "unlimited_credits"]);

      if (error) {
        console.error("Failed to load credit config:", error);
        return;
      }

      if (data) {
        for (const row of data) {
          if (row.config_key === "user_analysis_limit") {
            const nextLimit = Number.parseInt(row.config_value ?? "3", 10);
            setMaxCredits(Number.isFinite(nextLimit) && nextLimit > 0 ? nextLimit : 3);
          }
          if (row.config_key === "unlimited_credits") {
            setUnlimitedCredits(row.config_value === "true");
          }
        }
      }
    };

    loadLimit();
  }, []);

  const refreshUsage = useCallback(async () => {
    if (!user) {
      setUsedCredits(0);
      return;
    }

    const [usageResult, mgmtResult] = await Promise.all([
      supabase
        .from("user_analyses" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_management" as any)
        .select("is_blocked, extra_credits")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (usageResult.error) {
      console.error("Failed to refresh usage:", usageResult.error);
      return;
    }

    setUsedCredits(usageResult.count || 0);

    const mgmt = mgmtResult.data as any;
    if (mgmt) {
      setIsBlocked(mgmt.is_blocked || false);
      setExtraCredits(mgmt.extra_credits || 0);
    } else {
      setIsBlocked(false);
      setExtraCredits(0);
    }
  }, [user]);

  const loadAnalyses = useCallback(async () => {
    if (!user) {
      setAnalyses([]);
      return;
    }

    const { data, error } = await supabase
      .from("user_analyses" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Failed to load analyses:", error);
      return;
    }

    setAnalyses((data as any[]) || []);
  }, [user]);

  useEffect(() => {
    refreshUsage();
    loadAnalyses();
  }, [refreshUsage, loadAnalyses]);

  const signInWithGoogle = async () => {
    setLoading(true);

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          prompt: "select_account",
        },
      });

      if (result?.error) {
        throw result.error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google sign-in failed";
      console.error("Google sign-in error:", error);
      toast.error(message);
      setLoading(false);
      throw error;
    }
  };

  const signOutFn = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    setUser(null);
    setSession(null);
    setUsedCredits(0);
    setAnalyses([]);
  };

  const credits = unlimitedCredits ? 999 : Math.max(0, (maxCredits + extraCredits) - usedCredits);
  const canUseCredit = Boolean(user) && !isBlocked && (unlimitedCredits || credits > 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signOut: signOutFn,
        credits,
        maxCredits,
        canUseCredit,
        isBlocked,
        refreshUsage,
        analyses,
        loadAnalyses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
