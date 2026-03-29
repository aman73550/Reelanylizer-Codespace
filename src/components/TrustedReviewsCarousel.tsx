import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, Star, CheckCircle, MapPin } from "lucide-react";

interface Review {
  id: number;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  time: string;
  text: string;
}

const REVIEWS: Review[] = [
  { id: 1, name: "Priya S.", location: "Mumbai, IN", avatar: "priya", rating: 5, time: "2 min ago", text: "this tool is insane honestly!! my reels were getting like 200 views now im hitting 2k+ consistently. the hook analysis thing really opend my eyes 🔥" },
  { id: 2, name: "Rahul M.", location: "Delhi, IN", avatar: "rahul", rating: 4, time: "8 min ago", text: "pretty good tool ngl. hashtag suggestions are on point but sometimes the viral score feels little off? like it gave my reel 82 but it flopped lol. still using it tho" },
  { id: 3, name: "Ananya K.", location: "Bangalore, IN", avatar: "ananya", rating: 5, time: "15 min ago", text: "okk so i was skeptical at first but wow. the caption seo feature literally changed my game. getting so many more saves now its crazy" },
  { id: 4, name: "Emily W.", location: "London, UK", avatar: "emily", rating: 3, time: "22 min ago", text: "its decent i guess. took a while to understand all the metrics. wish there was a simpler view for beginers. the pdf report is nice tho" },
  { id: 5, name: "Vikram J.", location: "Pune, IN", avatar: "vikram2", rating: 5, time: "35 min ago", text: "bro this is the best free tool ive found for reels. used to pay some guy 500rs for analysis lmaooo. this gives way more detail for free 😂" },
  { id: 6, name: "Sneha R.", location: "Chennai, IN", avatar: "sneha2", rating: 5, time: "1 hr ago", text: "love love love this!! paste link get analysis thats literally it. no complicated stuff. my engagement went up like 60% in 3 weeks cant complain 💜" },
  { id: 7, name: "Arjun T.", location: "Hyderabad, IN", avatar: "arjunt", rating: 2, time: "1 hr ago", text: "idk man the loading takes forever sometimes and it gave error twice on my reel link. when it works the analysis is ok but reliability needs improvement" },
  { id: 8, name: "Meera D.", location: "Jaipur, IN", avatar: "meera", rating: 5, time: "2 hr ago", text: "tried like 4-5 other reel analyzers before this one. none of them even come close. the trend matching thing told me to use a sound and that reel got 50k views 🤯" },
  { id: 9, name: "Karan P.", location: "Kolkata, IN", avatar: "karanp", rating: 4, time: "3 hr ago", text: "im a social media manager and i use this for all my clients now. saves me hours of manual research tbh. only wish it had bulk analysis feature" },
  { id: 10, name: "Divya L.", location: "Ahmedabad, IN", avatar: "divya", rating: 4, time: "4 hr ago", text: "the free credits are enough for casual use which is great. bought the pro plan last week and the pdf reports look professional enough to send to brands 👍" },
  { id: 11, name: "Rohan S.", location: "Lucknow, IN", avatar: "rohan2", rating: 3, time: "5 hr ago", text: "its ok not great not bad. some suggestions were helpfull but i feel like the viral score doesnt account for niche audiences. my poetry reels always get low scores even tho they do well" },
  { id: 12, name: "Aisha N.", location: "Dubai, UAE", avatar: "aisha", rating: 5, time: "6 hr ago", text: "been using since 3 months and my account literally grew from 8k to 23k followers. not even joking. the quality signals card gives such specific tips every time" },
  { id: 13, name: "Manish G.", location: "Indore, IN", avatar: "manish", rating: 5, time: "7 hr ago", text: "finally something that actully works for indian creators. western tools never understand our content style but this one gets it 🙏" },
  { id: 14, name: "Tanya B.", location: "Noida, IN", avatar: "tanya", rating: 4, time: "8 hr ago", text: "my friend told me about this and im so glad she did!! the engagement calculator is super usefull. only complaint is it sometimes takes long to load on mobile" },
  { id: 15, name: "Sahil K.", location: "Chandigarh, IN", avatar: "sahil", rating: 2, time: "9 hr ago", text: "not sure about this tbh. gave my clearly viral reel (45k views) a score of 58?? how does that make sense. needs better calibration imo" },
  { id: 16, name: "Nisha P.", location: "Surat, IN", avatar: "nisha", rating: 5, time: "10 hr ago", text: "THIS IS SO GOOD!! sorry for caps but genuinely the hashtag generator alone saved me so much time. used to spend 30 min finding hashtags now its instant ❤️" },
];

const ReviewCard = ({ review }: { review: Review }) => (
  <div
    className="bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3"
    style={{
      boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      minHeight: 160,
    }}
  >
    {/* Top row: avatar, name, location, verified */}
    <div className="flex items-center gap-3">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.avatar}`}
        alt={review.name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full bg-gray-100 shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm" style={{ color: "#111827" }}>{review.name}</span>
          <CheckCircle size={14} fill="#22C55E" className="text-white shrink-0" />
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
          <MapPin size={11} />
          <span>{review.location}</span>
        </div>
      </div>
    </div>

    {/* Stars + time */}
    <div className="flex items-center justify-between">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < review.rating ? "text-amber-400" : "text-gray-200"}
            fill={i < review.rating ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>{review.time}</span>
    </div>

    {/* Review text */}
    <p
      className="text-sm leading-relaxed"
      style={{
        color: "#374151",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      "{review.text}"
    </p>
  </div>
);

const TrustedReviewsCarousel = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  // Auto-slide
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 5000);
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
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #F5F7FF 0%, #FFFFFF 100%)",
        paddingTop: 72,
        paddingBottom: 72,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-bold mb-2" style={{ fontSize: "clamp(22px, 4vw, 28px)", color: "#111827" }}>
            Trusted by 48,000+ Creators
          </h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Real reviews from our community — auto-refreshing
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex -ml-5">
              {REVIEWS.map((review) => (
                <div
                  key={review.id}
                  className="min-w-0 shrink-0 grow-0 pl-5 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>

          {/* Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute top-1/2 -translate-y-1/2 -left-1 sm:-left-5 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center z-10 hover:bg-gray-50 transition-colors border border-gray-100"
            aria-label="Previous review"
          >
            <ArrowLeft size={16} style={{ color: "#374151" }} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute top-1/2 -translate-y-1/2 -right-1 sm:-right-5 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center z-10 hover:bg-gray-50 transition-colors border border-gray-100"
            aria-label="Next review"
          >
            <ArrowRight size={16} style={{ color: "#374151" }} />
          </button>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={scrollPrev}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E5E7EB" }}
            aria-label="Previous"
          >
            <ArrowLeft size={14} style={{ color: "#6B7280" }} />
          </button>
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>
            {selectedIndex + 1} / {REVIEWS.length}
          </span>
          <button
            onClick={scrollNext}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 transition-colors"
            style={{ borderColor: "#E5E7EB" }}
            aria-label="Next"
          >
            <ArrowRight size={14} style={{ color: "#6B7280" }} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TrustedReviewsCarousel;
