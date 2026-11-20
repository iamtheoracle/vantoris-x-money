import React, { useEffect } from "react";
import { motion } from "framer-motion";
import ShieldLogo from "@/components/vantoris/ShieldLogo";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2600);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#071A2D] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(30,86,160,0.15) 0%, transparent 60%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.75, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <ShieldLogo size={72} theme="dark" variant="metallic" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 mt-7 text-2xl font-bold tracking-[0.22em] text-white"
      >
        VANTORIS
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 mt-2 text-[10px] tracking-[0.32em] uppercase text-[#AAB4C3]"
      >
        Private Investment & Payments
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        className="absolute bottom-14"
      >
        <div className="w-7 h-7 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 2.2, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent origin-center"
      />
    </div>
  );
}