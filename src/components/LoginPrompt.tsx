import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, X, Shield, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logoImg from "@/assets/logo.webp";

interface LoginPromptProps {
  open: boolean;
  onClose: () => void;
}

const LoginPrompt = ({ open, onClose }: LoginPromptProps) => {
  const { signInWithGoogle, loading, user, maxCredits } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      onClose();
      setSubmitting(false);
    }
  }, [open, user, onClose]);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <Card className="space-y-5 border border-border bg-card p-6 shadow-2xl">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <img src={logoImg} alt="Reel Analyzer" width={40} height={40} className="w-10 h-10 object-contain" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-lg font-bold text-foreground">Login to Analyze</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sign in with Google to get <span className="font-semibold text-foreground">{maxCredits} free credits</span> for Reel Analyzer and SEO Optimizer.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wand2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Use credits across both tools with one login</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>Your analysis history stays private to your account</span>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={loading || submitting}
                className="h-12 w-full gap-2 bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {submitting || loading ? "Redirecting..." : "Continue with Google"}
              </Button>

              <p className="text-center text-[10px] text-muted-foreground/60">
                By signing in, you agree to our Terms of Service
              </p>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginPrompt;
