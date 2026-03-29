import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/LangContext";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Loader2 } from "lucide-react";

const Index = lazy(() => import("./pages/Index.tsx"));
const YoutubeAnalyzer = lazy(() => import("./pages/YoutubeAnalyzer.tsx"));
const SEOOptimizer = lazy(() => import("./pages/SEOOptimizer.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const SEOToolPage = lazy(() => import("./pages/SEOToolPage.tsx"));
const SEOArticlePage = lazy(() => import("./pages/SEOArticlePage.tsx"));
const BlogIndex = lazy(() => import("./pages/BlogIndex.tsx"));
const BlogArticle = lazy(() => import("./pages/BlogArticle.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const SitemapPage = lazy(() => import("./pages/SitemapPage.tsx"));
const PartnershipPage = lazy(() => import("./pages/PartnershipPage.tsx"));
const CollaborationPage = lazy(() => import("./pages/CollaborationPage.tsx"));
const PromotionPage = lazy(() => import("./pages/PromotionPage.tsx"));
const PricingPage = lazy(() => import("./pages/PricingPage.tsx"));
const CreatorLogin = lazy(() => import("./pages/CreatorLogin.tsx"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard.tsx"));
const UserLogin = lazy(() => import("./pages/UserLogin.tsx"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-6 h-6 text-primary animate-spin" />
  </div>
);

const PublicLayout = () => {
  const location = useLocation();
  const hideHeader = location.pathname.startsWith("/bosspage") ||
    location.pathname.startsWith("/creator-login") ||
    location.pathname.startsWith("/creator-dashboard");
  return (
    <>
      {!hideHeader && <Header />}
      <Outlet />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LangProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="ambient-blob ambient-blob--primary" aria-hidden="true" />
          <div className="ambient-blob ambient-blob--secondary" aria-hidden="true" />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/youtube-analyzer" element={<YoutubeAnalyzer />} />
                  <Route path="/seo-optimizer" element={<SEOOptimizer />} />

                  <Route path="/reel-analyzer" element={<SEOToolPage slug="reel-analyzer" />} />
                  <Route path="/instagram-reel-analyzer" element={<SEOToolPage slug="instagram-reel-analyzer" />} />
                  <Route path="/reel-seo-optimizer" element={<SEOToolPage slug="reel-seo-optimizer" />} />
                  <Route path="/reel-hashtag-generator" element={<SEOToolPage slug="reel-hashtag-generator" />} />
                  <Route path="/reel-caption-generator" element={<SEOToolPage slug="reel-caption-generator" />} />
                  <Route path="/reel-title-generator" element={<SEOToolPage slug="reel-title-generator" />} />
                  <Route path="/reel-viral-checker" element={<SEOToolPage slug="reel-viral-checker" />} />
                  <Route path="/reel-engagement-calculator" element={<SEOToolPage slug="reel-engagement-calculator" />} />

                  <Route path="/guides/:slug" element={<SEOArticlePage />} />

                  <Route path="/blog" element={<BlogIndex />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />

                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/sitemap-page" element={<SitemapPage />} />
                  <Route path="/partnership" element={<PartnershipPage />} />
                  <Route path="/collaboration" element={<CollaborationPage />} />
                  <Route path="/promotion" element={<PromotionPage />} />
                  <Route path="/pricing" element={<PricingPage />} />

                  <Route path="/login" element={<UserLogin />} />
                  <Route path="/bosspage-login" element={<AdminLogin />} />
                  <Route path="/bosspage" element={<AdminDashboard />} />
                  <Route path="/creator-login" element={<CreatorLogin />} />
                  <Route path="/creator-dashboard" element={<CreatorDashboard />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LangProvider>
  </QueryClientProvider>
);

export default App;
