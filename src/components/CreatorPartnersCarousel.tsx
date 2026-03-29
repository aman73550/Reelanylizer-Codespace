import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, CheckCircle, Youtube, Instagram, Film, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Creator {
  id: string;
  name: string;
  username: string | null;
  profile_image: string | null;
  platform: string;
  followers: string | null;
  tags: string[] | null;
  promo_video_url: string | null;
  is_top_partner: boolean | null;
  monthly_views?: string | null;
  social_url?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
}

const DEMO_CREATORS: Creator[] = [
  {
    id: "1", name: "Priya Sharma", username: "@thatgirlpriya",
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
    platform: "instagram", followers: "320K", tags: ["🌿 Lifestyle", "📈 Instagram Growth"],
    promo_video_url: "https://youtube.com", is_top_partner: false, monthly_views: "4.2M+",
    social_url: "https://instagram.com/thatgirlpriya",
  },
  {
    id: "2", name: "Vikram Patel", username: "@vikram.edits",
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram",
    platform: "youtube", followers: "410K", tags: ["🎯 Reels Growth", "🔥 Viral Expert"],
    promo_video_url: "https://youtube.com", is_top_partner: true, monthly_views: "5M+",
    social_url: "https://youtube.com/@vikram.edits",
  },
  {
    id: "3", name: "Arjun Mehta", username: "@arjuncreates",
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
    platform: "instagram", followers: "280K", tags: ["💡 Tech & AI", "📊 Growth Tips"],
    promo_video_url: "https://youtube.com", is_top_partner: false, monthly_views: "3.8M+",
    social_url: "https://instagram.com/arjuncreates",
  },
  {
    id: "4", name: "Sneha Kapoor", username: "@sneha.buzz",
    profile_image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
    platform: "youtube", followers: "195K", tags: ["🎬 Content Pro", "✨ Educator"],
    promo_video_url: "https://youtube.com", is_top_partner: false, monthly_views: "2.1M+",
    social_url: "https://youtube.com/@sneha.buzz",
  },
];

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === "youtube") return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white shadow-md">
      <Youtube size={16} />
    </span>
  );
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full text-white shadow-md" style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}>
      <Instagram size={16} />
    </span>
  );
};

const CreatorCard = ({ creator, isCenter }: { creator: Creator; isCenter: boolean }) => {
  const hasBothPlatforms = creator.platform === "both" || (creator.instagram_url && creator.youtube_url);
  const socialLink = creator.social_url || (creator.platform === "youtube" ? `https://youtube.com/${creator.username}` : `https://instagram.com/${creator.username?.replace("@", "")}`);
  const platformLabel = creator.platform === "youtube" ? "YouTube Channel" : creator.platform === "both" ? "Social Media" : "Instagram Profile";

  return (
    <div
      className="transition-all duration-500 ease-out"
      style={{
        transform: isCenter ? "scale(1.04)" : "scale(0.94)",
        opacity: isCenter ? 1 : 0.8,
        filter: isCenter ? "none" : "brightness(0.97)",
      }}
    >
      <div
        className="relative rounded-[22px] overflow-hidden"
        style={{
          background: isCenter 
            ? "linear-gradient(180deg, #FFFFFF 0%, #F8F7FF 50%, #F0EDFF 100%)"
            : "linear-gradient(180deg, #FFFFFF 0%, #FAFAFE 100%)",
          boxShadow: isCenter
            ? "0 20px 60px rgba(108,99,255,0.18), 0 0 0 1.5px rgba(139,92,246,0.12)"
            : "0 8px 30px rgba(108,99,255,0.06), 0 0 0 1px rgba(139,92,246,0.06)",
        }}
      >
        {/* Top gradient strip */}
        <div
          className="flex items-center justify-center gap-1.5 text-white text-[11px] font-bold tracking-widest uppercase"
          style={{
            height: 38,
            background: "linear-gradient(90deg, #6C63FF, #8B5CF6, #A78BFA)",
          }}
        >
          <Star size={12} fill="white" /> OFFICIAL PARTNER
        </div>

        <div className="px-5 pb-5 pt-5 flex flex-col items-center text-center gap-3">
          {/* Profile image - increased size */}
          <div className="relative">
            <div className="rounded-full p-[3px]" style={{ background: "linear-gradient(135deg, #8B5CF6, #6C63FF, #A78BFA)" }}>
              <img
                src={creator.profile_image || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                alt={creator.name}
                width={104}
                height={104}
                loading="lazy"
                decoding="async"
                className="rounded-full"
                style={{ width: 104, height: 104, objectFit: "cover", aspectRatio: "1/1", background: "#F0EDFF" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=default"; }}
              />
            </div>
            {/* Platform icon */}
            <div className="absolute -bottom-0.5 left-0">
              <PlatformIcon platform={creator.platform} />
            </div>
            {/* Verification badge */}
            <CheckCircle
              className="absolute -bottom-0.5 right-0 text-white drop-shadow-sm"
              size={24}
              fill="#6C63FF"
            />
          </div>

          {/* Name */}
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <p className="font-bold" style={{ fontSize: isCenter ? 19 : 17, color: "#1E1B4B" }}>
                {creator.name}
              </p>
              <CheckCircle size={16} fill="#6C63FF" className="text-white" />
            </div>
            <p className="text-sm" style={{ color: "#7C3AED" }}>{creator.username}</p>
          </div>

          {/* Audience */}
          <div>
            <p className="font-bold" style={{ fontSize: isCenter ? 19 : 17, color: "#6C63FF" }}>
              {creator.followers}+ Audience
            </p>
            <p className="text-[13px]" style={{ color: "#6B7280" }}>
              {creator.monthly_views || "2M+"} monthly views
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {(creator.tags || []).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-3 py-1.5 rounded-full border"
                style={{ background: "#F5F3FF", borderColor: "#DDD6FE", color: "#5B21B6" }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA - Direct social media links */}
          {hasBothPlatforms ? (
            <div className="w-full flex gap-2 mt-1">
              {(creator.instagram_url || creator.platform !== "youtube") && (
                <a
                  href={creator.instagram_url || `https://instagram.com/${creator.username?.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-all hover:opacity-80"
                  style={{ height: 40, color: "#E1306C", border: "1.5px solid #E5E7EB", borderRadius: 12 }}
                >
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {(creator.youtube_url || creator.platform === "youtube" || creator.platform === "both") && (
                <a
                  href={creator.youtube_url || `https://youtube.com/${creator.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-xl transition-all hover:opacity-80"
                  style={{ height: 40, color: "#FF0000", border: "1.5px solid #E5E7EB", borderRadius: 12 }}
                >
                  <Youtube size={14} /> YouTube
                </a>
              )}
            </div>
          ) : (
            <a
              href={socialLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all mt-1 ${
                isCenter ? "text-white hover:shadow-lg hover:brightness-110" : "hover:opacity-80"
              }`}
              style={isCenter ? {
                height: 44,
                background: "linear-gradient(90deg, #6C63FF, #8B5CF6)",
              } : {
                height: 44,
                color: "#6C63FF",
                border: "1.5px solid #E5E7EB",
                borderRadius: 12,
              }}
            >
              {creator.platform === "youtube" ? <Youtube size={16} /> : <Instagram size={16} />}
              Visit {platformLabel} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* "Become a Partner" CTA card */
const PartnerCTACard = () => (
  <div className="transition-all duration-500 ease-out" style={{ transform: "scale(0.94)", opacity: 0.85 }}>
    <div
      className="bg-white rounded-[22px] overflow-hidden h-full flex flex-col items-center justify-center text-center px-6 py-10"
      style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.07)", minHeight: 380 }}
    >
      <span className="text-5xl mb-4">🤝</span>
      <h3 className="text-xl font-bold mb-2" style={{ color: "#111827" }}>
        Want to Earn From Your Audience?
      </h3>
      <p className="text-sm mb-6" style={{ color: "#6B7280", maxWidth: 220 }}>
        Join our creator revenue program and turn your influence into income.
      </p>
      <Link
        to="/collaboration"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:bg-purple-50"
        style={{ borderColor: "#6C63FF", color: "#6C63FF" }}
      >
        Apply for Partnership
      </Link>
    </div>
  </div>
);

const CreatorPartnersCarousel = () => {
  const [creators, setCreators] = useState<Creator[]>(DEMO_CREATORS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const totalSlides = creators.length + 1; // +1 for CTA card

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
  });

  const fetchCreators = useCallback(async () => {
    const { data } = await supabase
      .from("creators")
      .select("id, name, username, profile_image, platform, followers, tags, promo_video_url, is_top_partner, social_url, monthly_views, instagram_url, youtube_url")
      .eq("status", "active")
      .order("is_top_partner", { ascending: false });
    if (data && data.length > 0) setCreators(data as Creator[]);
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("creators-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "creators" },
        () => { fetchCreators(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCreators]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    const root = emblaApi.rootNode();
    const stop = () => clearInterval(interval);
    root.addEventListener("mouseenter", stop);
    return () => {
      clearInterval(interval);
      root.removeEventListener("mouseenter", stop);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      setSelectedIndex(idx);
      setScrollProgress(((idx + 1) / totalSlides) * 100);
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, totalSlides]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 30%, #EDE9FE 60%, #F5F3FF 85%, #FFFFFF 100%)",
        paddingTop: 72,
        paddingBottom: 72,
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full opacity-30 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)", transform: "translate(-40%, -30%)" }} />
      <div className="absolute top-10 right-0 w-[250px] h-[250px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%)", transform: "translate(30%, -20%)" }} />
      <div className="absolute bottom-0 left-[30%] w-[350px] h-[350px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", transform: "translateY(40%)" }} />
      <div className="absolute bottom-10 right-[10%] w-[200px] h-[200px] rounded-full opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Top badge */}
        <div className="flex justify-center mb-5">
          <span
            className="flex items-center gap-1.5 text-xs font-medium rounded-full border"
            style={{
              background: "white",
              color: "#6B7280",
              padding: "7px 16px",
              borderColor: "#E5E7EB",
            }}
          >
            <Star size={13} style={{ color: "#6C63FF" }} /> Limited creator slots each month
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-center font-extrabold mb-2" style={{ fontSize: "clamp(28px, 5vw, 40px)", color: "#111827", lineHeight: 1.2 }}>
          Official Creator Partners 🚀
        </h2>
        <p
          className="text-center font-bold mb-2"
          style={{
            fontSize: "clamp(18px, 3.5vw, 24px)",
            background: "linear-gradient(90deg, #6C63FF, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Trusted by 500K+ audience creators
        </p>
        <p className="text-center text-sm mb-12 max-w-md mx-auto" style={{ color: "#6B7280" }}>
          Top creators who rely on Reel Analyzer to create viral-worthy content
        </p>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-5">
              {creators.map((creator, index) => (
                <div
                  key={creator.id}
                  className="min-w-0 shrink-0 grow-0 pl-5 basis-[85%] sm:basis-1/2 lg:basis-[30%]"
                >
                  <CreatorCard creator={creator} isCenter={index === selectedIndex} />
                </div>
              ))}
              {/* CTA card */}
              <div className="min-w-0 shrink-0 grow-0 pl-5 basis-[85%] sm:basis-1/2 lg:basis-[30%]">
                <PartnerCTACard />
              </div>
            </div>
          </div>

          {/* Arrow buttons */}
          <button
            onClick={scrollPrev}
            className="absolute top-1/2 -translate-y-1/2 -left-1 sm:-left-5 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10 hover:bg-gray-50 transition-colors border border-gray-100"
            aria-label="Previous"
          >
            <ArrowLeft size={18} style={{ color: "#374151" }} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute top-1/2 -translate-y-1/2 -right-1 sm:-right-5 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center z-10 hover:bg-gray-50 transition-colors border border-gray-100"
            aria-label="Next"
          >
            <ArrowRight size={18} style={{ color: "#374151" }} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-8 max-w-[200px] mx-auto">
          <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "#E5E7EB" }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${scrollProgress}%`,
                background: "linear-gradient(90deg, #6C63FF, #8B5CF6)",
              }}
            />
          </div>
        </div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Used by growing creators on</p>
          <div className="flex items-center gap-5 sm:gap-8 flex-wrap justify-center" style={{ color: "#6B7280" }}>
            <span className="flex items-center gap-2 text-sm font-semibold opacity-50">
              <Youtube size={22} /> YouTube
            </span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-2 text-sm font-semibold opacity-50">
              <Instagram size={20} /> Instagram
            </span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-2 text-sm font-semibold opacity-50">
              <Film size={20} /> Shorts
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorPartnersCarousel;
