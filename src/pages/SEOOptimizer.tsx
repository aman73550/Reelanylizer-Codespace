import SEOOptimizerSection from "@/components/SEOOptimizerSection";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const SEOOptimizer = () => {
  return (
    <div className="page-surface min-h-screen relative overflow-x-hidden pb-20 md:pb-0">
      <SEOHead
        title="Free Reel SEO Optimizer – Optimize Instagram Reels for Maximum Reach"
        description="Free Instagram Reel SEO optimizer — 3 free credits on signup. Optimize your reel captions, titles, and hashtags for SEO. Smart suggestions to boost discoverability."
        canonical="https://reelsanylizer.in/seo-optimizer"
        keywords="free reel seo optimizer, free instagram reel seo, free reel optimization tool, free reel caption optimizer, free reel title optimizer, free instagram seo tool"
      />
      <SEOOptimizerSection />
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default SEOOptimizer;
