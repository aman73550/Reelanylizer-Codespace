import { motion, AnimatePresence } from "framer-motion";
import { Coins, AlertTriangle, Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";

const CreditBadge = () => {
  const { user } = useAuth();
  const { totalCredits, freeCredits, paidCredits, daysUntilReset, loading } = useCredits();

  if (!user || loading) return null;

  const isLow = totalCredits <= 2 && totalCredits > 0;
  const isEmpty = totalCredits === 0;

  return (
    <div className="relative group">
      <button
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isEmpty
            ? "bg-red-50 text-red-600 border border-red-200"
            : isLow
            ? "bg-amber-50 text-amber-600 border border-amber-200"
            : "bg-primary/10 text-primary border border-primary/20"
        }`}
      >
        {isEmpty ? (
          <AlertTriangle className="w-3.5 h-3.5" />
        ) : (
          <Coins className="w-3.5 h-3.5" />
        )}
        <span>{totalCredits}</span>
      </button>

      {/* Tooltip */}
      <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <p className="text-[11px] font-semibold text-foreground mb-2">Credit Balance</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Free credits</span>
            <span className="font-medium text-foreground">{freeCredits}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Paid credits</span>
            <span className="font-medium text-foreground">{paidCredits}</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-primary">{totalCredits}</span>
          </div>
        </div>
        {daysUntilReset > 0 && freeCredits > 0 && (
          <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Free credits reset in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""}
          </p>
        )}
        {isEmpty && (
          <p className="text-[10px] text-red-500 mt-2 font-medium">
            ⚠️ You're out of credits
          </p>
        )}
        {isLow && !isEmpty && (
          <p className="text-[10px] text-amber-500 mt-2 font-medium">
            ⚠️ Only {totalCredits} credit{totalCredits !== 1 ? "s" : ""} left
          </p>
        )}
      </div>
    </div>
  );
};

export default CreditBadge;
