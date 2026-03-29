import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TrendingUp, Zap, BarChart3, Hash, FileText, Eye, 
  ArrowRight, Star, Search, Wand2, 
  MessageSquare, Target
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: TrendingUp, title: "Viral Score Prediction", desc: "Analyzes your reel against thousands of viral patterns to predict performance." },
  { icon: Zap, title: "Hook Strength Analysis", desc: "Get scored on your opening 3 seconds — the make-or-break moment for viewers." },
  { icon: BarChart3, title: "Engagement Metrics", desc: "Compare your likes, comments, shares and saves against category benchmarks." },
  { icon: Hash, title: "Hashtag Optimization", desc: "Smart hashtag strategy analysis with competition levels and reach estimates." },
  { icon: FileText, title: "Caption SEO", desc: "Optimize your captions for Instagram's search algorithm with keyword analysis." },
  { icon: Eye, title: "Thumbnail & Visual Analysis", desc: "Reviews your video quality, scene cuts, motion intensity and visual appeal." },
];

export const FeaturesSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F8F7FF 40%, #F0EDFF 100%)" }}>
    {/* Decorative glow */}
    <div className="absolute left-[-200px] top-[20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
    <div className="absolute right-[-150px] bottom-[10%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
    <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
      <div className="text-center mb-16">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">5 Free Credits Every Month</span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">Powerful Analysis Features</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">Everything you need to understand and improve your reel performance — start free.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
            <Card className="p-6 h-full border border-border bg-card/80 backdrop-blur-sm hover-lift">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TOOLS = [
  { path: "/", title: "Reel Analyzer", desc: "Full analysis of any Instagram reel", icon: Search },
  { path: "/seo-optimizer", title: "SEO Optimizer", desc: "Optimize titles, captions & hashtags", icon: Target },
  { path: "/reel-hashtag-generator", title: "Hashtag Generator", desc: "Generate strategic hashtag sets", icon: Hash },
  { path: "/reel-viral-checker", title: "Viral Checker", desc: "Check viral probability of your reel", icon: TrendingUp },
  { path: "/reel-caption-generator", title: "Caption Generator", desc: "Smart caption suggestions", icon: MessageSquare },
  { path: "/reel-engagement-calculator", title: "Engagement Calculator", desc: "Calculate your engagement rate", icon: BarChart3 },
];

export const ToolsSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F0EDFF 0%, #F5F3FF 50%, #FAFAFF 100%)" }}>
    <div className="absolute right-[-200px] top-[30%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)" }} />
    <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">Free Tools for Creators</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">Smart tools to level up your Instagram content strategy — 5 free credits monthly.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TOOLS.map((tool, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
            <Link to={tool.path}>
              <Card className="p-6 border border-border bg-card/80 backdrop-blur-sm hover-lift group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <tool.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{tool.title}</h3>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const STEPS = [
  { num: "01", title: "Paste Your Reel URL", desc: "Copy the link of any Instagram reel and paste it into the analyzer." },
  { num: "02", title: "We Analyze Your Reel", desc: "Our system extracts data, analyzes patterns, and scores every aspect of your reel." },
  { num: "03", title: "Get Detailed Report", desc: "Receive a comprehensive report with scores, charts, and actionable recommendations." },
];

export const HowItWorksSection = () => (
  <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FAFAFF 0%, #F5F3FF 50%, #F0EDFF 100%)" }}>
    <div className="absolute left-[-150px] bottom-[20%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)" }} />
    <div className="max-w-4xl mx-auto px-4 sm:px-8 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">How It Works</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Three simple steps to analyze any Instagram reel.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {STEPS.map((step, i) => (
          <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
            <div className="w-14 h-14 rounded-2xl border-2 border-primary/20 bg-primary/5 flex items-center justify-center mx-auto mb-4 shadow-low">
              <span className="text-primary font-semibold text-lg">{step.num}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const TESTIMONIALS = [
  { name: "Priya S.", role: "Content Creator", text: "This tool helped me understand why some reels go viral. My engagement doubled in 2 weeks!", rating: 5 },
  { name: "Rahul M.", role: "Social Media Manager", text: "I use the hashtag analyzer daily. It's like having an Instagram strategist on call.", rating: 5 },
  { name: "Ananya K.", role: "Influencer", text: "The viral score prediction is surprisingly accurate. Great for planning content.", rating: 4 },
  { name: "Emily W.", role: "Creator", text: "Decent tool but scores didn't always match my actual reel performance. Ok for beginners.", rating: 3 },
  { name: "Vikram J.", role: "Brand Manager", text: "Useful for quick checks before posting. Loading could be faster though.", rating: 4 },
];

export const TestimonialsSection = () => (
  <section className="py-16 sm:py-24 border-t border-border">
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div className="text-center mb-16">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">What Creators Say</h2>
        <p className="text-muted-foreground text-sm sm:text-base">Trusted by thousands of Instagram creators.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className="p-6 border border-border bg-card h-full hover-lift">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < t.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export const CTASection = ({ onCTAClick }: { onCTAClick: () => void }) => (
  <section className="py-16 sm:py-24 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F0EDFF 0%, #E8E4FF 50%, #F0EDFF 100%)" }}>
    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
    <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">Start analyzing for free</h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Sign in with Google and get 5 free credits every month — no payment required.</p>
        <Button onClick={onCTAClick} size="lg" className="cta-gradient text-primary-foreground font-semibold px-8">
          <Wand2 className="w-4 h-4 mr-2" />
          Get 5 Free Credits
        </Button>
      </motion.div>
    </div>
  </section>
);
