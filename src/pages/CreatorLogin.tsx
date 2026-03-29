import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Wand2, ArrowLeft } from "lucide-react";

const CreatorLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("creator-auth", {
        body: { email: email.trim(), password: password.trim() },
      });

      if (error) throw error;
      if (!data?.success) {
        toast.error(data?.message || "Invalid credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("creator_session", JSON.stringify({
        id: data.creator.id,
        name: data.creator.name,
        email: data.creator.email,
        token: data.token,
      }));

      toast.success(`Welcome, ${data.creator.name}!`);
      navigate("/creator-dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a1035 40%, #2d1b69 70%, #1a1035 100%)" }}>
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to Home</span>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-sm relative">
        {/* Card glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-indigo-500/20 to-purple-600/20 rounded-3xl blur-xl pointer-events-none" />
        
        <div className="relative bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Creator Login</h1>
            <p className="text-sm text-white/50">Access your creator dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="creator-email" className="text-xs text-white/60 font-medium">Email</Label>
              <Input
                id="creator-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="creator-password" className="text-xs text-white/60 font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="creator-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 h-11 rounded-xl pr-11 focus:border-purple-500/50 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-purple-600/25 transition-all duration-200"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] text-white/30 mt-6">
            Creator accounts are managed by admin
          </p>
        </div>
      </div>

      {/* Branding */}
      <p className="mt-8 text-xs text-white/20">ReelAnalyzer • Creator Portal</p>
    </div>
  );
};

export default CreatorLogin;
