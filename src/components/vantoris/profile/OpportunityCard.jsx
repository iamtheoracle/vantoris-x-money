import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function OpportunityCard({ icon: Icon, title, description, actions = [] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="vantoris-glass-flat p-6 text-center"
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-navy/5 border border-navy/8 flex items-center justify-center mx-auto mb-3">
          <Icon size={24} className="text-navy/40" strokeWidth={1.5} />
        </div>
      )}
      <h4 className="text-foreground font-semibold text-sm mb-1">{title}</h4>
      {description && <p className="text-gray text-xs mb-4 max-w-xs mx-auto leading-relaxed">{description}</p>}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions.map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className={`inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                action.primary
                  ? 'bg-navy text-white hover:bg-navy/90'
                  : 'bg-slate-100 text-gray hover:bg-slate-200'
              }`}
            >
              {action.label}
              {action.primary && <ChevronRight size={12} />}
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}