import { motion } from "framer-motion";
import { ShieldCheck, Zap, Lock, BarChart3 } from "lucide-react";

const BADGES_DEFAULT = [
  { icon: ShieldCheck, label: "Trusted by", highlight: "5,000+ Creators", iconColor: "#22C55E", iconBg: "rgba(34,197,94,0.1)" },
  { icon: Zap, label: "10x Faster", highlight: "Results", iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.1)" },
  { icon: Lock, label: "100%", highlight: "Private & Secure", iconColor: "#6366F1", iconBg: "rgba(99,102,241,0.1)" },
];

const BADGES_SEO = [
  { icon: ShieldCheck, label: "Trusted by", highlight: "5,000+ Creators", iconColor: "#22C55E", iconBg: "rgba(34,197,94,0.15)" },
  { icon: BarChart3, label: "Boost Reel", highlight: "Visibility", iconColor: "#F59E0B", iconBg: "rgba(245,158,11,0.12)" },
  { icon: Lock, label: "100% Private", highlight: "& Secure", iconColor: "#8B5CF6", iconBg: "rgba(139,92,246,0.12)" },
];

interface TrustBadgesProps {
  variant?: "default" | "seo";
}

const TrustBadges = ({ variant = "default" }: TrustBadgesProps) => {
  const badges = variant === "seo" ? BADGES_SEO : BADGES_DEFAULT;

  return (
    <motion.div
      className="relative z-10 max-w-[900px] mx-auto px-6 py-8 sm:py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.label}
            className={`flex items-center gap-3 px-6 sm:px-8 py-3 ${i > 0 ? "sm:border-l border-border" : ""}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + i * 0.12 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: badge.iconBg }}
            >
              <badge.icon className="w-5 h-5" style={{ color: badge.iconColor }} />
            </div>
            <div className="text-[14px] whitespace-nowrap text-muted-foreground">
              {badge.label}{" "}
              <span className="font-bold text-foreground">{badge.highlight}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TrustBadges;
