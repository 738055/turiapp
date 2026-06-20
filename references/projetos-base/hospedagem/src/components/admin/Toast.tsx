"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "success", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 shadow-lg text-sm ${
        type === "success"
          ? "bg-[#1C3A2A] text-[#FAF7F2]"
          : "bg-red-600 text-white"
      }`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      {type === "success" ? (
        <CheckCircle className="w-4 h-4 text-[#B8963E]" strokeWidth={1.5} />
      ) : (
        <XCircle className="w-4 h-4" strokeWidth={1.5} />
      )}
      {message}
    </motion.div>
  );
}

export function ToastWrapper({ toast, clearToast }: {
  toast: { message: string; type: "success" | "error" } | null;
  clearToast: () => void;
}) {
  return (
    <AnimatePresence>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </AnimatePresence>
  );
}
