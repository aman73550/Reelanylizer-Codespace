import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

import { Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppNumber } from "@/hooks/useWhatsAppNumber";

const ContactPage = () => {
  const { whatsappNumber, loading, openWhatsApp } = useWhatsAppNumber();

  return (
    <div className="page-surface min-h-screen text-foreground">
      <SEOHead 
        title="Contact Us – ReelAnalyzer Support & Business Inquiries"
        description="Contact the ReelAnalyzer team for support, feedback, partnership inquiries, or business collaboration. Quick responses via WhatsApp and email."
        keywords="contact reel analyzer, support, customer service, business inquiry, partnership, feedback, whatsapp support, creator tools support"
        canonical="https://reelsanylizer.in/contact" 
      />

      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-sm text-muted-foreground mb-8">Have a question, feedback, or business inquiry? Reach out to us directly on WhatsApp for a quick response.</p>

        <div className="text-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto">
            <MessageCircle className="w-10 h-10 text-[#25D366]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">Chat with us on WhatsApp</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Get instant support, share feedback, or discuss partnership & promotion opportunities.
            </p>
          </div>

          {loading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" />
          ) : whatsappNumber ? (
            <div className="space-y-3">
              <Button
                onClick={() => openWhatsApp("Hi! I need help with Reel Analyzer.")}
                className="gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-3 text-base"
                size="lg"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </Button>

              <div className="grid gap-2 sm:grid-cols-3 pt-4">
                {[
                  { label: "Support", msg: "Hi! I need support with Reel Analyzer." },
                  { label: "Feedback", msg: "Hi! I'd like to share feedback about Reel Analyzer." },
                  { label: "Business Inquiry", msg: "Hi! I have a business inquiry regarding Reel Analyzer." },
                ].map(({ label, msg }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => openWhatsApp(msg)}
                    className="text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">WhatsApp number not configured yet. Please check back later.</p>
          )}
        </div>
      </div>

      <Footer />
      <MobileBottomNav />
      
    </div>
  );
};

export default ContactPage;
