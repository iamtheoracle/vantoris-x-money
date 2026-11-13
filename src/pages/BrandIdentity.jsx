import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VantorisMonogram, { VANTORIS_COLORS } from '@/components/vantoris/brand/VantorisMonogram';
import VantorisLogo from '@/components/vantoris/brand/VantorisLogo';
import VantorisSeal from '@/components/vantoris/brand/VantorisSeal';
import VantorisAppIcon from '@/components/vantoris/brand/VantorisAppIcon';
import PrivateInvestmentCardGallery from '@/components/vantoris/PrivateInvestmentCardGallery';

const PALETTE = [
  { name: 'Midnight Navy', hex: '#071A2D', role: 'Primary', text: '#F8FAFC' },
  { name: 'Executive Blue', hex: '#123A6E', role: 'Secondary', text: '#F8FAFC' },
  { name: 'Royal Blue', hex: '#2E5BFF', role: 'Accent', text: '#F8FAFC' },
  { name: 'Champagne Gold', hex: '#D4AF37', role: 'Metal', text: '#071A2D' },
  { name: 'Brushed Gold', hex: '#C7A34A', role: 'Metal', text: '#071A2D' },
  { name: 'White', hex: '#F8FAFC', role: 'Neutral', text: '#071A2D' },
  { name: 'Slate Gray', hex: '#6B7280', role: 'Neutral', text: '#F8FAFC' },
];

const VARIANTS = ['flat', 'metallic', 'glass', 'monochrome', 'outline', 'foil', 'embossed'];

/** @param {{ title: string, subtitle: string, dark?: boolean, children?: import('react').ReactNode }} param0 */
function Section({ title, subtitle, dark, children }) {
  return (
    <section className={`rounded-3xl p-6 sm:p-10 ${dark ? 'bg-[#071A2D]' : 'bg-white border border-slate-200'}`}>
      <div className="mb-8">
        <p className={`text-[10px] uppercase tracking-[0.3em] font-semibold mb-2 ${dark ? 'text-[#D4AF37]' : 'text-[#123A6E]'}`}>
          {subtitle}
        </p>
        <h2 className={`text-2xl font-bold ${dark ? 'text-white' : 'text-[#071A2D]'}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

/** @param {{ children?: import('react').ReactNode, className?: string, dark?: boolean }} param0 */
function Card({ children, className = '', dark }) {
  return (
    <div className={`rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-all ${dark ? 'bg-white/[0.04] border border-white/10' : 'bg-slate-50 border border-slate-200'} ${className}`}>
      {children}
    </div>
  );
}

export default function BrandIdentity() {
  const [selectedVariant, setSelectedVariant] = useState('metallic');

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      <div className="max-w-6xl mx-auto px-5 py-10 sm:py-16 space-y-8">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-[#071A2D] p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(46,91,255,0.4) 0%, transparent 60%)' }} />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <VantorisLogo layout="vertical" size={88} variant="metallic" theme="dark" showTagline />
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              A timeless brand identity for a world-class private institution —
              engineered with precision, restraint, and institutional confidence.
            </p>
          </div>
        </motion.div>

        {/* Primary Logo */}
        <Section title="Primary Logo" subtitle="01 — Core Identity" dark>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card dark>
              <VantorisLogo layout="horizontal" size={44} variant="metallic" theme="dark" showTagline />
              <span className="text-white/40 text-xs">Horizontal · Metallic · Dark</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="horizontal" size={44} variant="flat" theme="dark" />
              <span className="text-white/40 text-xs">Horizontal · Flat · Dark</span>
            </Card>
          </div>
        </Section>

        {/* Monogram Variants */}
        <Section title="The Monogram" subtitle="02 — Arch over River">
          <p className="text-slate-500 text-sm mb-6 max-w-2xl">
            An architectural arch rising above flowing river lines — communicating enduring structure,
            continuity, movement and stewardship through a restrained, original mark.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {VARIANTS.map((v) => (
              <Card key={v} dark={v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed'}>
                <VantorisMonogram size={56} variant={v} theme={v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed' ? 'dark' : 'light'} />
                <span className={`text-xs capitalize ${v === 'glass' || v === 'metallic' || v === 'foil' || v === 'embossed' ? 'text-white/40' : 'text-slate-400'}`}>{v}</span>
              </Card>
            ))}
          </div>

          {/* Interactive viewer */}
          <div className="rounded-2xl bg-[#071A2D] p-8 flex flex-col items-center gap-5">
            <VantorisMonogram size={120} variant={selectedVariant} theme="dark" />
            <div className="flex flex-wrap justify-center gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    selectedVariant === v ? 'bg-[#D4AF37] text-[#071A2D]' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Logo Lockups */}
        <Section title="Logo System" subtitle="03 — Lockups & Treatments">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <VantorisLogo layout="horizontal" size={40} variant="flat" theme="light" />
              <span className="text-slate-400 text-xs">Horizontal · Light</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="horizontal" size={40} variant="flat" theme="dark" />
              <span className="text-white/40 text-xs">Horizontal · Dark</span>
            </Card>
            <Card>
              <VantorisLogo layout="vertical" size={48} variant="metallic" theme="light" showTagline />
              <span className="text-slate-400 text-xs">Vertical · With Tagline</span>
            </Card>
            <Card dark>
              <VantorisLogo layout="vertical" size={48} variant="metallic" theme="dark" showTagline />
              <span className="text-white/40 text-xs">Vertical · Dark</span>
            </Card>
            <Card>
              <VantorisMonogram size={64} variant="flat" theme="light" />
              <span className="text-slate-400 text-xs">Standalone Monogram</span>
            </Card>
            <Card dark className="relative overflow-hidden">
              <VantorisLogo layout="watermark" size={80} variant="metallic" theme="dark" className="absolute inset-0 flex items-center justify-center" />
              <VantorisMonogram size={64} variant="glass" theme="dark" />
              <span className="text-white/40 text-xs relative z-10">Watermark + Glass</span>
            </Card>
          </div>
        </Section>

        {/* App Icon */}
        <Section title="App Icon" subtitle="04 — Mobile & Desktop">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[32, 48, 72, 120].map((s) => (
              <Card key={s}>
                <VantorisAppIcon size={s} />
                <span className="text-slate-400 text-xs">{s}px</span>
              </Card>
            ))}
          </div>
        </Section>

        {/* Executive Seal */}
        <Section title="Executive Seal" subtitle="05 — Institutional Mark">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <VantorisSeal size={180} theme="light" />
              <span className="text-slate-400 text-xs">Light Seal</span>
            </Card>
            <Card dark>
              <VantorisSeal size={180} theme="dark" />
              <span className="text-white/40 text-xs">Dark Seal</span>
            </Card>
          </div>
        </Section>

        {/* Color Palette */}
        <Section title="Color Palette" subtitle="06 — Institutional Spectrum">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PALETTE.map((c) => (
              <div key={c.name} className="rounded-2xl overflow-hidden border border-slate-200">
                <div className="h-24 flex items-end p-3" style={{ background: c.hex }}>
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: c.text }}>{c.role}</span>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-sm font-semibold text-[#071A2D]">{c.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography" subtitle="07 — Geometric · Legible · Premium">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <p className="text-[#071A2D] font-heading" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '0.24em' }}>VANTORIS</p>
              <p className="text-slate-400 text-xs">Inter · 800 · 0.24em tracking · Heading</p>
            </Card>
            <Card>
              <p className="text-[#071A2D] font-body" style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.6 }}>
                The quick brown fox jumps over the lazy dog. 0123456789 — Institutional clarity for executive correspondence and member-facing communications.
              </p>
              <p className="text-slate-400 text-xs">Inter · 400 · Body</p>
            </Card>
          </div>
        </Section>

        {/* Applications */}
        <Section title="Brand Applications" subtitle="08 — Across Touchpoints" dark>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 rounded-2xl bg-[#0C2438] p-4 sm:p-6">
              <PrivateInvestmentCardGallery className="brand-card-gallery" />
            </div>

            {/* Statement Header */}
            <div className="rounded-2xl bg-white p-5 h-44 border border-slate-200">
              <VantorisLogo layout="horizontal" size={22} variant="flat" theme="light" showTagline />
              <div className="mt-4 h-px bg-slate-200" />
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-3">Quarterly Statement</p>
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 bg-slate-100 rounded w-full" />
                <div className="h-1.5 bg-slate-100 rounded w-4/5" />
                <div className="h-1.5 bg-slate-100 rounded w-3/5" />
              </div>
            </div>

            {/* Business Card */}
            <div className="rounded-2xl bg-white p-5 h-44 border border-slate-200 flex flex-col justify-between">
              <VantorisMonogram size={28} variant="metallic" theme="light" />
              <div>
                <p className="text-[#071A2D] font-semibold text-sm">Client Services</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest">Private Client Office</p>
                <p className="text-slate-400 text-[10px] mt-1">Verified contact details are provided through configured channels.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center py-10">
          <VantorisMonogram size={36} variant="flat" theme="light" className="mx-auto" />
          <p className="text-slate-400 text-xs mt-4 tracking-widest uppercase">Vantoris Private Institution · Brand Identity</p>
          <p className="text-slate-300 text-[10px] mt-1">Trust · Structure · Purpose</p>
        </div>
      </div>
    </div>
  );
}