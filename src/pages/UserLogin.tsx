import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoginPrompt from "@/components/LoginPrompt";

const UserLogin = () => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user } = useAuth();

  if (user) {
    return (
      <div className="page-surface min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <p className="text-lg font-semibold text-foreground">You're already signed in!</p>
            <p className="text-sm text-muted-foreground">Go back to the homepage to use the analyzer.</p>
            <a href="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600">
              Go to Analyzer →
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-surface min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl text-foreground">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">Get 5 free credits every month</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => setShowLoginPrompt(true)} 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white h-12"
          >
            <Mail className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            No password needed. Sign in securely with your Google account.
          </p>
          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-[11px] text-muted-foreground text-center">Other access:</p>
            <div className="flex justify-center gap-3">
              <a href="/creator-login" className="text-xs text-primary hover:underline">Creator Login</a>
              <span className="text-muted-foreground">·</span>
              <a href="/bosspage-login" className="text-xs text-muted-foreground hover:text-foreground">Admin</a>
            </div>
          </div>
        </CardContent>
      </Card>
      <LoginPrompt open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
    </div>
  );
};

export default UserLogin;
