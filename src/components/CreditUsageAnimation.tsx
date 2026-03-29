import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface CreditUsageAnimationProps {
  show: boolean;
  amount: number;
  onComplete?: () => void;
}

const CreditUsageAnimation = ({ show, amount, onComplete }: CreditUsageAnimationProps) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onComplete?.(), 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-xl"
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 15 }}
        >
          <Zap className="w-4 h-4" />
          <span>-{amount} credit{amount > 1 ? "s" : ""} used</span>
          <motion.span
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            ⚡
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreditUsageAnimation;
