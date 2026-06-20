"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export default function Card({ children, className, delay = 0, hover = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -2, boxShadow: "0 8px 32px rgba(28,58,42,0.10)" } : undefined}
      className={cn(
        "bg-white border border-[#1C3A2A]/10 transition-shadow",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
