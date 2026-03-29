import { useState } from "react";
import { Star, CheckCircle, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
];

const ReviewCard = ({ review }: { review: Review }) => {
  const initials = review.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col gap-4 border border-gray-100"
      style={{
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        minHeight: 240,
      }}
    >
      {/* Top row: initials, name, location, verified */}
      <div className="flex items-start gap-3">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          {initials}
        </div>
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
          WebkitLineClamp: 5,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {review.text}
      </p>
    </div>
  );
};

export default function ReviewsGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(REVIEWS.length / reviewsPerPage);
  
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = REVIEWS.slice(startIndex, endIndex);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #F5F7FF 0%, #FFFFFF 100%)",
        paddingTop: 72,
        paddingBottom: 72,
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm mb-2" style={{ color: "#6366F1" }}>Real feedback from our community</p>
          <h2 className="font-bold mb-2" style={{ fontSize: "clamp(22px, 4vw, 28px)", color: "#111827" }}>
            Trusted by Creators
          </h2>
        </div>

        {/* Reviews Grid - 3 per line on desktop, 2 on tablet, 1 on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span style={{ color: "#6B7280" }} className="text-sm font-medium">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
}
