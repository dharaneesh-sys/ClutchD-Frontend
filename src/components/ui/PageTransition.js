"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
  },
};

const pageTransition = {
  type: "tween",
  ease: [0.23, 1, 0.32, 1],
  duration: 0.35,
};

export function PageTransition({ children, className }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="page"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className={cn("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
