import React from "react";
import { motion } from "framer-motion";
import { User, Users, Building2, Landmark, KeyRound, Wallet, Check, ArrowLeft } from "lucide-react";

export const PRODUCTS = [
  { id: "personal", label: "Personal", accountType: "Checking", icon: User, desc: "Individual account for personal banking and transactions" },
  { id: "joint", label: "Joint", accountType: "Joint", icon: Users, desc: "Shared account access for partners or family" },
  { id: "business", label: "Business", accountType: "Business", icon: Building2, desc: "Operating accounts and treasury services" },
  { id: "organization", label: "Organization", accountType: "Business", icon: Landmark, desc: "Fund or organization accounts" },
  { id: "institutional", label: "Institutional", accountType: "Business", icon: Landmark, desc: "Custodial and administrative services" },
  { id: "private", label: "Private Banking", accountType: "Checking", icon: KeyRound, desc: "Dedicated relationship management and bespoke services" },
];

export default function ProductSelection({ selected, onSelect, onBack }) {
  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray mb-6 hover:text-foreground transition">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      )}
      <h2 className="text-lg font-semibold text-foreground mb-1">Choose Account Type</h2>
      <p className="text-gray text-sm mb-6">Select the account that best fits your financial needs.</p>
      <div className="space-y-3">
        {PRODUCTS.map((product, idx) => {
          const Icon = product.icon;
          const isSelected = selected?.id === product.id;
          return (
            <motion.button
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(product)}
              className={`relative w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                isSelected
                  ? "border-navy bg-navy/5 shadow-md"
                  : "border-slate-200 bg-white hover:border-navy/30 hover:bg-slate-50"
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isSelected ? "bg-navy text-white" : "bg-slate-100 text-navy"
              }`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{product.label}</p>
                <p className="text-[11px] text-gray mt-0.5 leading-snug">{product.desc}</p>
              </div>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}