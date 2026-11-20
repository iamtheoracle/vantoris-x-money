import React from 'react';
import { Heart, Droplets, GraduationCap, Stethoscope, Globe } from 'lucide-react';

const causes = [
  {
    icon: Droplets,
    name: 'Clean Water Initiative',
    desc: 'Providing safe drinking water to underserved communities worldwide.',
    color: 'text-champagne',
    bg: 'bg-champagne/12',
  },
  {
    icon: GraduationCap,
    name: 'Education Access Fund',
    desc: 'Scholarships and learning resources for children in need.',
    color: 'text-brass',
    bg: 'bg-brass/12',
  },
  {
    icon: Stethoscope,
    name: 'Global Health Foundation',
    desc: 'Supporting medical care and health programs in vulnerable regions.',
    color: 'text-mint',
    bg: 'bg-mint/12',
  },
  {
    icon: Globe,
    name: 'Sustainable Futures Trust',
    desc: 'Environmental conservation and climate resilience projects.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/12',
  },
];

export default function SupportedCauses() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Heart size={16} className="text-brass" />
        <h3 className="text-foreground font-semibold text-sm">Causes We Support</h3>
      </div>
      <div className="vantoris-glass-flat p-4 mb-3">
        <p className="text-gray text-xs leading-relaxed">
          Vantoris is committed to creating lasting impact. A portion of our institutional proceeds supports verified
          charitable organizations and community initiatives aligned with our values of trust, structure, and purpose.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {causes.map((cause, i) => {
          const Icon = cause.icon;
          return (
            <div key={i} className="vantoris-glass-flat p-4">
              <div className={`w-9 h-9 rounded-xl ${cause.bg} flex items-center justify-center mb-2`}>
                <Icon size={18} className={cause.color} />
              </div>
              <p className="text-foreground font-medium text-xs mb-1">{cause.name}</p>
              <p className="text-gray text-[11px] leading-relaxed">{cause.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}