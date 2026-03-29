import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, Coins, History, ChevronDown, CreditCard, Receipt, AlertTriangle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import CreditBadge from "@/components/CreditBadge";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import logoImg from "@/assets/logo.webp";

const NAV_LINKS = [
  { path: "/", label: "Analyzer" },
  { path: "/youtube-analyzer", label: "YouTube Analyzer" },
  { path: "/seo-optimizer", label: "SEO Optimizer" },
  { path: "/pricing", label: "Pricing" },
  { path: "/blog", label: "Blog" },
  { path: "/contact", label: "Contact" },
];

type MenuTab = "overview" | "credits" | "transactions";

const Header = ({ onCTAClick }: { onCTAClick?: () => void }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [menuTab, setMenuTab] = useState<MenuTab>("overview");
  const { user, signInWithGoogle, signOut, analyses, loading } = useAuth();
  const { totalCredits, freeCredits, paidCredits } = useCredits();
  const menuRef = useRef<HTMLDivElement>(null);

  // Credit history & transactions
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load data when menu opens
  useEffect(() => {
    if (!userMenuOpen || !user) return;
    setLoadingData(true);
    Promise.all([
      supabase.from("credit_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]).then(([credRes, payRes]) => {
      setCreditHistory((credRes.data as any[]) || []);
      setTransactions((payRes.data as any[]) || []);
      setLoadingData(false);
    });
  }, [userMenuOpen, user]);

  const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0] || "U";
  const userAvatar = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  const maskUrl = (url: string) => {
    const match = url.match(/\/(reel|reels|p|shorts)\/([^/?]+)/);
    if (match) return `${match[1]}/${match[2].slice(0, 4)}...${match[2].slice(-3)}`;
    return url.slice(0, 25) + "...";
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/60 shadow-low">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14 sm:h-16">
        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
            <img src={logoImg} alt="Reel Analyzer Logo" width={36} height={36} loading="eager" decoding="async" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-foreground text-base sm:text-lg tracking-tight leading-none">Reel<span className="gradient-primary">Analyzer</span></span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link key={l.path} to={l.path} className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === l.path ? "text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && <CreditBadge />}

          {/* User area */}
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => { setUserMenuOpen(!userMenuOpen); setMenuTab("overview"); }} className="flex items-center gap-1.5 p-1 rounded-full hover:bg-muted transition-colors">
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-primary/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {userInitial.toUpperCase()}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-high"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Tab navigation */}
                    <div className="flex border-b border-border bg-muted/10">
                      {([
                        { key: "overview" as MenuTab, label: "Overview", icon: Coins },
                        { key: "credits" as MenuTab, label: "Credits", icon: History },
                        { key: "transactions" as MenuTab, label: "Payments", icon: Receipt },
                      ]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setMenuTab(tab.key)}
                          className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors border-b-2 ${
                            menuTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <tab.icon className="w-3 h-3" />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="max-h-72 overflow-y-auto">
                      {menuTab === "overview" && (
                        <div>
                          {/* Credit summary */}
                          <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center gap-2 mb-1">
                              <Coins className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs text-foreground font-medium">{totalCredits} credits</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>Free: {freeCredits}</span>
                              <span>Paid: {paidCredits}</span>
                            </div>
                            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, totalCredits > 0 ? 100 : 0)}%` }} />
                            </div>
                          </div>

                          {/* Recent analyses */}
                          {analyses.length > 0 && (
                            <div className="border-b border-border">
                              <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Recent Analyses</div>
                              {analyses.slice(0, 4).map((a: any) => (
                                <div key={a.id} className="px-4 py-2 hover:bg-muted/30 transition-colors">
                                  <p className="text-[11px] text-foreground truncate">{maskUrl(a.reel_url)}</p>
                                  <div className="flex items-center justify-between mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                                    {a.viral_score != null && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        a.viral_score >= 80 ? "bg-[hsl(var(--viral-high))]/10 text-[hsl(var(--viral-high))]" :
                                        a.viral_score >= 60 ? "bg-[hsl(var(--viral-mid))]/10 text-[hsl(var(--viral-mid))]" :
                                        "bg-[hsl(var(--viral-low))]/10 text-[hsl(var(--viral-low))]"
                                      }`}>{a.viral_score}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <Link
                            to="/pricing"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full px-4 py-2.5 text-left text-xs text-primary hover:bg-primary/5 flex items-center gap-2 transition-colors border-b border-border"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Buy Credits
                          </Link>
                        </div>
                      )}

                      {menuTab === "credits" && (
                        <div>
                          <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Credit Usage History</div>
                          {loadingData ? (
                            <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</div>
                          ) : creditHistory.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No credit history yet</div>
                          ) : (
                            creditHistory.map((c) => (
                              <div key={c.id} className="px-4 py-2 border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-foreground truncate flex-1">{c.description || "Credit usage"}</span>
                                  <span className={`text-[11px] font-bold ml-2 ${c.amount > 0 ? "text-green-600" : "text-red-500"}`}>
                                    {c.amount > 0 ? "+" : ""}{c.amount}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{c.credit_type}</span>
                                  {c.tool_used && <span className="text-[10px] text-primary">{c.tool_used}</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {menuTab === "transactions" && (
                        <div>
                          <div className="px-4 py-2 text-[10px] font-semibold text-muted-foreground uppercase">Payment Transactions</div>
                          {loadingData ? (
                            <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading...</div>
                          ) : transactions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No transactions yet</div>
                          ) : (
                            transactions.map((t) => (
                              <div key={t.id} className="px-4 py-2.5 border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-foreground">{t.plan_id} Pack</span>
                                  <span className={`text-[11px] font-bold ${t.status === "SUCCESS" ? "text-green-600" : t.status === "PENDING" ? "text-amber-500" : "text-red-500"}`}>
                                    ₹{t.amount}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.status === "SUCCESS" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                                    {t.status}
                                  </span>
                                  {t.credits_added > 0 && <span className="text-[10px] text-primary">+{t.credits_added} credits</span>}
                                </div>
                                {t.order_id && (
                                  <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono truncate">ID: {t.order_id}</p>
                                )}
                                {t.txn_id && (
                                  <p className="text-[9px] text-muted-foreground/60 font-mono truncate">TXN: {t.txn_id}</p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Sign out */}
                    <button
                      onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors border-t border-border"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-sm font-medium text-foreground transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      {/* AI tagline strip */}
      <div className="border-t border-border/40 bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-1">
          <p className="text-[11px] sm:text-xs text-center text-amber-600 font-medium flex items-center justify-center gap-2 bg-amber-100 rounded-full px-4 py-1.5 border border-amber-300 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Currently in development — some features, including payments, may be unavailable</span>
          </p>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div className="md:hidden bg-background border-b border-border px-4 pb-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <nav className="flex flex-col gap-3 pt-2">
            {NAV_LINKS.map((l) => (
              <Link key={l.path} to={l.path} onClick={() => setMobileOpen(false)} className={`text-sm font-medium py-1 ${location.pathname === l.path ? "text-primary" : "text-muted-foreground"}`}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => { setMobileOpen(false); onCTAClick?.(); }} className="mt-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold text-center">
              Analyze Reel
            </button>
          </nav>
        </motion.div>
      )}
    </header>
  );
};

export default Header;
