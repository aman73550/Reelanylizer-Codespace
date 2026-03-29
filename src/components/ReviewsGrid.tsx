import { Star, CheckCircle, MapPin } from "lucide-react";

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
];

const ReviewCard = ({ review }: { review: Review }) => (
  <div
    className="bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 flex flex-col gap-3"
    style={{
      boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      minHeight: 200,
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
          <span className="font-semibold text-sm" style={{ color: "#111827" }}>
            {review.name}
          </span>
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
      <span className="text-[11px] font-medium" style={{ color: "#9CA3AF" }}>
        {review.time}
      </span>
    </div>

    {/* Review text */}
    <p
      className="text-sm leading-relaxed flex-1"
      style={{
        color: "#374151",
        display: "-webkit-box",
        WebkitLineClamp: 4,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      "{review.text}"
    </p>
  </div>
);

export default function ReviewsGrid() {
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
        <div className="text-center mb-12">
          <h2 className="font-bold mb-2" style={{ fontSize: "clamp(22px, 4vw, 28px)", color: "#111827" }}>
            Trusted by Thousands of Creators
          </h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Real reviews from creators who've used our tools
          </p>
        </div>

        {/* Reviews Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REVIEWS.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}
