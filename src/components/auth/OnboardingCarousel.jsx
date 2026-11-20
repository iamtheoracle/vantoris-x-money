import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ShieldLogo from "@/components/vantoris/ShieldLogo";
import {
  Landmark,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";

const SLIDES = [
  {
    icon: Landmark,
    title: "Welcome to VANTORIS",
    desc: "Private banking, checking, savings, and dedicated member support in one secure platform.",
    gradient: "from-navy/10 to-navy/5",
  },
  {
    icon: ArrowLeftRight,
    title: "Move Money With Confidence",
    desc: "Send money, ACH transfers, domestic wires, Zelle, and real-time payments from one secure banking platform.",
    gradient: "from-gold/10 to-gold/5",
  },
  {
    icon: TrendingUp,
    title: "Bank With Confidence",
    desc: "Manage checking, savings, and money market accounts with institutional-grade security.",
    gradient: "from-mint/10 to-mint/5",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    desc: "Multi-factor authentication, biometric login, fraud monitoring, encrypted communications, and continuous account protection.",
    gradient: "from-navy/10 to-mint/5",
  },
  {
    icon: Sparkles,
    title: "Designed Around You",
    desc: "Personalized dashboards, Member Advisor, AI insights, and private banking services.",
    gradient: "from-gold/10 to-navy/5",
  },
];

export default function OnboardingCarousel({ onGetStarted, onSignIn, onSkip }) {
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const Icon = slide.icon;

  function next() {
    if (isLast) return;
    setIndex(index + 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background vantoris-mesh-bg">
      <div className="h-1 bg-gradient-to-r from-navy via-gold to-navy" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 safe-top">
        <div className="flex items-center justify-between w-full max-w-md mb-8">
          <ShieldLogo size={32} />
          {!isLast && (
            <button onClick={onSkip} className="text-sm text-gray hover:text-foreground transition">
              Skip
            </button>
          )}
        </div>

        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center mx-auto mb-8 border border-slate-200`}
              >
                <Icon size={48} className="text-navy" strokeWidth={1.5} />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                {slide.title}
              </h2>
              <p className="text-gray text-sm leading-relaxed max-w-xs mx-auto">
                {slide.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-full max-w-md space-y-3">
          <div className="flex items-center justify-center gap-2 mb-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-navy" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <>
              <button
                onClick={onGetStarted}
                className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight size={18} />
              </button>
              <button
                onClick={onSignIn}
                className="w-full h-12 bg-white border border-slate-200 text-foreground font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Sign In
              </button>
            </>
          ) : (
            <button
              onClick={next}
              className="w-full h-12 bg-navy text-white font-semibold rounded-xl hover:bg-navy/90 transition flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="safe-bottom" />
    </div>
  );
}