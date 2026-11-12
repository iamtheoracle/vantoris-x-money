import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  CreditCard,
  Landmark,
  TrendingUp,
  Heart,
  Users,
  Globe2,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  Plane,
  HandHeart,
  Lock,
  Smartphone,
  Building2,
  MapPin,
  Ban,
  BookOpen,
  Wallet,
  BadgeCheck,
  FileText,
  MessageCircle,
  Image,
  Share2,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import FinancialHeritage from '@/components/vantoris/FinancialHeritage';
import PrivateInvestmentCardGallery from '@/components/vantoris/PrivateInvestmentCardGallery';
import { PROVIDERS } from '@/lib/providers';

const NAV = [
  { label: 'Verified', href: '#verified' },
  { label: 'Services', href: '#service-availability' },
  { label: 'Cards', href: '#service-availability' },
  
  { label: 'About', href: '#about' },
  { label: 'Banking', href: '#banking' },
  { label: 'Invest', href: '#invest' },
  { label: 'Travel', href: '#travel' },
  { label: 'Property', href: '#property' },
  { label: 'AI & Chat', href: '#ai-ops' },
  { label: 'Community', href: '#community' },
  { label: 'Safety', href: '#fraud' },
  { label: 'Contact', href: '#contact' },
];

const BOA_PARITY = [
  ['Checking & savings', 'Everyday accounts with clear balances and statements'],
  ['Transfers & payments', 'Send, request, deposit, and move money between accounts'],
  ['Debit cards', 'Request, manage, and monitor eligible member cards'],
  ['Credit pathways', 'Eligible credit products after compliance review'],
  ['Direct deposit', 'Payroll routing and early-pay oriented workflows'],
  ['Bill pay style flows', 'Structured outbound payments from member accounts'],
  ['Mobile-first access', 'Full member workspace on phone-sized layouts'],
  ['Alerts & messages', 'In-app notifications and secure member messaging'],
  ['Document vault', 'Store ID, statements, and verification files'],
  ['Investment access', 'Portfolios, deposits, and withdrawal requests'],
  ['Fraud & security posture', 'Session controls, isolation of ops vs member views'],
  ['Advisor / assistant help', 'Guided support without exposing staff tools to members'],
];

const NGO_PARTNERS = [
  { name: 'UNHCR', focus: 'Refugees & forced displacement', note: 'Global protection and assistance under severe funding pressure in 2025–2026.', url: 'https://www.unhcr.org/' },
  { name: 'OCHA / CERF', focus: 'Underfunded emergencies', note: 'UN coordination and rapid pooled funding for neglected crises worldwide.', url: 'https://www.unocha.org/' },
  { name: 'Caritas Internationalis', focus: 'Local humanitarian response', note: 'Confederation supporting communities when aid budgets contract.', url: 'https://www.caritas.org/' },
  { name: 'CARE', focus: 'Poverty & crisis response', note: 'International NGO network active across conflict and climate emergencies.', url: 'https://www.care.org/' },
  { name: 'Médecins Sans Frontières', focus: 'Medical humanitarian', note: 'Emergency medical care in conflict and epidemic settings.', url: 'https://www.msf.org/' },
  { name: 'World Food Programme', focus: 'Hunger & logistics', note: 'Food assistance and supply chains for populations in acute need.', url: 'https://www.wfp.org/' },
];

const MILITARY_ORGS = [
  { name: 'Blue Star Families', focus: 'Military families', url: 'https://bluestarfam.org/' },
  { name: 'National Military Family Association', focus: 'Family advocacy', url: 'https://www.militaryfamily.org/' },
  { name: 'Operation Homefront', focus: 'Emergency financial aid', url: 'https://operationhomefront.org/' },
  { name: 'Operation Tango Mike', focus: 'Deployed care packages', url: 'https://operationtangomike.org/' },
  { name: 'Wounded Warriors Family Support', focus: 'Combat-wounded families', url: 'https://wwfs.org/' },
  { name: 'Friends Of The Troops', focus: 'Care packages & crisis aid', url: 'https://www.friendsofthetroops.org/' },
  { name: 'Royal British Legion', focus: 'UK armed forces community', url: 'https://www.britishlegion.org.uk/' },
  { name: 'Help for Heroes', focus: 'Wounded UK personnel', url: 'https://www.helpforheroes.org.uk/' },
];

const PILLARS = [
  {
    icon: Landmark,
    title: 'Private client services',
    body: 'A private member workspace for account records, statements, and activity. Live balances and payment execution appear only after an authorized core-banking and payments provider is connected.',
  },
  {
    icon: CreditCard,
    title: 'Debit & credit services',
    body: 'View card records and card activity when returned by an issuer integration. Issuance, spend authorization, and card controls require a connected, approved card processor.',
  },
  {
    icon: TrendingUp,
    title: 'Investment portfolios',
    body: 'Review portfolio information and investment requests. Trading, custody, funding, and withdrawals require an authorized investment provider and applicable approvals.',
  },
  {
    icon: HandHeart,
    title: 'HeroBox & humanitarian care',
    body: 'Support service members and communities through curated care packages, volunteer networks, and mission logistics.',
  },
];

const HELP = [
  {
    title: 'Working families',
    text: 'Clear account information, payment-request workflows, and activity history, with payment execution enabled only through approved providers.',
  },
  {
    title: 'Service members & veterans',
    text: 'Member support, HeroBox missions, and clear financial information for service members, veterans, and their families.',
  },
  {
    title: 'Builders & entrepreneurs',
    text: 'Business-oriented member tools, document organization, and access to support when decisions get complex.',
  },
  {
    title: 'Global citizens',
    text: 'Cross-border awareness, discovery tools, and support channels that don’t stop at a single zip code.',
  },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState('');

  const scrollToId = useCallback((hash) => {
    const id = (hash || '').replace(/^#/, '');
    if (!id) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveHash('');
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveHash('#' + id);
    try {
      window.history.replaceState(null, '', '#' + id);
    } catch (_) {}
  }, []);

  const onNavClick = useCallback(
    (e, href) => {
      e.preventDefault();
      setMenuOpen(false);
      scrollToId(href);
    },
    [scrollToId]
  );

  // Open with #hash in URL
  useEffect(() => {
    if (window.location.hash) {
      const t = window.setTimeout(() => scrollToId(window.location.hash), 80);
      return () => window.clearTimeout(t);
    }
  }, [scrollToId]);

  // Highlight active section while scrolling
  useEffect(() => {
    const ids = NAV.map((n) => n.href.replace('#', '')).filter(Boolean);
    const onScroll = () => {
      const y = window.scrollY + 96;
      let current = '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= y) current = '#' + id;
      }
      setActiveHash(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-navy scroll-smooth">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => scrollToId('top')}
            className="flex items-center gap-2.5 shrink-0 text-left"
            aria-label="Back to top"
          >
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
              <ShieldLogo size={20} />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-[15px] tracking-tight">Vantoris</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 hidden sm:block">
                Private investment · Stewardship
              </p>
            </div>
          </button>

          <nav
            className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-slate-600 max-w-[52%] overflow-x-auto"
            aria-label="Page sections"
          >
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={(e) => onNavClick(e, n.href)}
                className={`shrink-0 px-2.5 py-1.5 rounded-full transition-colors ${
                  activeHash === n.href
                    ? 'bg-navy text-white'
                    : 'hover:text-navy hover:bg-slate-100'
                }`}
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/login"
              className="text-[13px] font-semibold text-navy px-3 py-2 rounded-full hover:bg-slate-100 transition"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-[13px] font-semibold text-white bg-navy px-4 py-2.5 rounded-full hover:bg-navy/90 transition inline-flex items-center gap-1.5 shadow-sm"
            >
              Open account
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current" />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 max-h-[70vh] overflow-y-auto">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={(e) => onNavClick(e, n.href)}
                className={`block py-2.5 text-sm font-medium rounded-lg px-2 ${
                  activeHash === n.href ? 'bg-navy/5 text-navy font-semibold' : 'text-slate-700'
                }`}
              >
                {n.label}
              </a>
            ))}
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded-full border border-slate-200 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 rounded-full bg-navy text-white text-sm font-semibold"
              >
                Open account
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="top" className="scroll-mt-20">
        {/* Hero — cinematic */}
        <section className="relative overflow-hidden min-h-[92vh] flex flex-col justify-center">
          <div className="absolute inset-0 bg-[#050d18]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_40%,#0B3D5C55,transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_10%,#C9A22722,transparent)]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-brass/30 bg-brass/10 px-3 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[11px] text-brass tracking-wide">VANTORIS PRIVATE INVESTMENT</span>
              </div>
              <h1 className="font-heading text-white text-[2.75rem] sm:text-5xl lg:text-[3.75rem] font-extrabold leading-[1.02] tracking-tight">
                Capital, considered
                <br />
                <span className="font-display italic font-normal text-brass text-[1.05em]">with enduring perspective.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/65 max-w-xl leading-relaxed font-body">
                A private-client workspace for portfolio visibility, controlled capital requests, account records, statements and dedicated service. Investment trading, custody and external payment execution remain available only where an authorized provider and approval workflow are in place.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-brass text-navy font-bold px-7 py-3.5 text-[15px] hover:bg-[#d4b03a] transition shadow-[0_0_40px_rgba(201,162,39,0.25)]"
                >
                  Open membership
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white font-semibold px-6 py-3.5 text-[15px] hover:bg-white/10 transition backdrop-blur-sm"
                >
                  Sign in
                </Link>
                <a
                  href="#service-availability"
                  onClick={(e) => onNavClick(e, '#service-availability')}
                  className="inline-flex items-center gap-2 rounded-full text-white/70 font-medium px-4 py-3.5 text-[14px] hover:text-white transition"
                >
                  <Play size={16} className="text-brass" />
                  Peek the cards
                </a>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] text-white/40 uppercase tracking-wider">
                <span className="flex items-center gap-1.5"><BadgeCheck size={12} className="text-emerald-400" /> KYC gated</span>
                <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-brass" /> Ops isolated</span>
                <span className="flex items-center gap-1.5"><Lock size={12} /> Session secure</span>
              </div>
            </div>

            {/* Real supplied card concept art — avoid fabricated member balances on the public landing page. */}
            <div className="lg:col-span-5 relative">
              <figure className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#071C38] shadow-[0_30px_90px_rgba(0,0,0,.45)]">
                <img
                  src="/card-art/obsidian.svg"
                  alt="Vantoris Private Investment Obsidian card artwork"
                  className="block w-full h-auto object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </figure>
              <p className="mt-3 text-xs leading-relaxed text-white/45">
                Card artwork is illustrative. Card availability, network, and issuance depend on verified issuer partnerships.
              </p>
            </div>
          </div>

          {/* Trust marquee */}
          <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between gap-4 font-mono text-[10px] sm:text-[11px] text-white/45 uppercase tracking-[0.14em]">
              <span>Statements · member tools</span>
              <span>Transfers · dedicated tools</span>
              <span>Provider availability</span>
              <span>AI · member + ops</span>
              <span>HeroBox · impact tools</span>
            </div>
          </div>
        </section>



        {/* Platform directory — quick entry points without removing detailed sections below. */}
        <section id="explore-platform" className="border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">One platform, clear paths</p>
                <h2 className="mt-2 font-heading text-2xl sm:text-3xl font-bold tracking-tight text-navy">Explore Vantoris</h2>
                <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-600">
                  Start with what you need. Every area below has its own dedicated experience, and the full feature tour continues further down this page.
                </p>
              </div>
              <Link to="/more" className="inline-flex items-center gap-2 self-start sm:self-auto text-sm font-semibold text-navy hover:text-amber-700">
                Browse all services <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { title: 'Banking & accounts', detail: 'Accounts, balances, cards and statements', icon: Landmark, to: '/accounts' },
                { title: 'Transfers & payments', detail: 'Move money and review transactions', icon: Wallet, to: '/move-money' },
                { title: 'Markets & investing', detail: 'Market discovery and investment tools', icon: TrendingUp, to: '/investment' },
                { title: 'Flights & travel', detail: 'Flight discovery and travel services', icon: Plane, to: '/discover/flights' },
                { title: 'Foreign exchange', detail: 'Explore FX information and rates', icon: Globe2, to: '/discover/fx' },
                { title: 'Property', detail: 'Explore housing and property discovery', icon: Building2, to: '/discover/housing' },
                { title: 'News & discovery', detail: 'Browse news and platform discovery', icon: BookOpen, to: '/discover/news' },
                { title: 'AI & assistance', detail: 'Get guidance and find support', icon: Sparkles, to: '/assistant' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="group min-h-[148px] rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <ArrowRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-700" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-sm sm:text-base font-bold text-navy">{item.title}</h3>
                    <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">{item.detail}</p>
                  </Link>
                );
              })}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Availability varies by feature, account eligibility and provider integration. Market, flight and FX information may be informational; this directory does not imply that a transaction or booking is live.
            </p>
          </div>
        </section>

        {/* VERIFIED — public, no sign-in required */}
        <section id="verified" className="scroll-mt-24 border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                <BadgeCheck size={14} /> USD financial platform · Since 2015
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 text-navy border border-navy/10 px-3 py-1 text-[11px] font-semibold">
                <Fingerprint size={14} /> Identity · KYC · session isolation
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1 text-[11px] font-semibold">
                Institutional controls & statements
              </span>
            </div>
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-display text-4xl sm:text-5xl text-navy leading-[1.1]">
                  Obvious trust.<span className="italic text-brass"> Premium clarity.</span>
                </h2>
                <p className="mt-4 text-slate-600 leading-relaxed font-body">
                  Vantoris brings a considered private-investment experience to portfolio records, account services and dedicated support. Identity checks, document records and operator workflows remain separated from client screens. Sign in to access your authorized workspace and available services.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-navy font-body">
                  {[
                    'Member verification before full product access',
                    'Statements formatted for professional finance review',
                    'Cards, wires, and activity with audit-friendly records',
                    'AI assistants for guidance—not for sharing your secrets',
                  ].map((x) => (
                    <li key={x} className="flex gap-2">
                      <ShieldCheck size={16} className="text-brass shrink-0 mt-0.5" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[24px] bg-navy text-white p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-brass/20 blur-2xl" />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass">Institutional seal</p>
                <p className="font-heading text-2xl font-bold mt-3">Vantoris Private Investment</p>
                <p className="text-white/60 text-sm mt-2 font-body">
                  Trust · Structure · Purpose — a restrained navy, ivory and brass identity with an editorial approach to private capital.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                  {[
                    ['KYC', 'Identity checks'],
                    ['Docs', 'Vault & exports'],
                    ['Ops', 'Isolated staff'],
                    ['AI', 'Guided support'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-white/5 border border-white/10 py-3">
                      <p className="font-heading font-bold text-brass">{k}</p>
                      <p className="text-[11px] text-white/50 mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>


        <section id="service-availability" className="scroll-mt-24 bg-[#F7F5EF] border-y border-slate-200 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass mb-3">Provider connectivity</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy">Services, backed by real connections</h2>
            <p className="mt-4 max-w-3xl text-slate-600 leading-relaxed">
              AVCU displays a service as connected only when its production provider is configured and verified.
              Internal records, sample artwork, and design concepts are not presented as live banking or payment services.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(PROVIDERS).filter((provider) => ['financialAccount', 'payments', 'cards', 'statements', 'investment', 'flights', 'flightTracking', 'homes', 'shipping', 'donations', 'identity'].includes(provider.id)).map((provider) => (
                <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-navy">{provider.label}</h3>
                    <span className={provider.status === 'connected' ? 'rounded-full bg-emerald-50 text-emerald-800 px-2.5 py-1 text-[10px] font-bold uppercase' : 'rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 text-[10px] font-bold uppercase'}>
                      {provider.status === 'connected' ? 'Connected' : 'Not connected'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{provider.note}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="rounded-full bg-navy text-white px-5 py-3 text-sm font-bold">Create membership</Link>
              <Link to="/login" className="rounded-full border border-slate-300 bg-white text-navy px-5 py-3 text-sm font-semibold">Member sign in</Link>
            </div>
          </div>
        </section>

        {/* AI platform */}
        <section id="ai-platform" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="rounded-[28px] bg-navy text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-30 hidden sm:block">
              <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-navy" />
            </div>
            <div className="relative max-w-xl">
              <p className="font-mono text-[11px] text-brass uppercase tracking-wider">Self-operating AI platform</p>
              <h2 className="font-heading text-3xl font-bold mt-2">Assistants that run with the bank—not beside it</h2>
              <p className="mt-4 text-white/70 leading-relaxed font-body">
                Member AI, ops AI, and command divisions coordinate on the same membership data:
                balances, applications, HeroBox, and support threads—with isolation so staff tools
                never appear on member screens.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Member assistant', 'Ops command', 'Image & templates', 'Secure chat'].map((x) => (
                  <span key={x} className="rounded-full border border-white/20 px-3 py-1 text-xs font-medium">{x}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI OPS + IMAGE + CHAT — public explainer */}
        <section id="ai-ops" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass mb-3">AI operatives · active by design</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-navy">
            Assistants that <span className="font-display italic font-normal">scheme for clarity</span>
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl font-body">
            Member and operations AI stay on-task: answers, drafts, image prompts for HeroBox and campaigns,
            and routing into human support—never a replacement for compliance judgment.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageCircle, t: 'Member chat', d: 'Ask balances, products, next steps—with redaction of secrets.' },
              { icon: Share2, t: 'Support bridge', d: 'Escalate to humans; members and support share secure threads.' },
              { icon: Image, t: 'Image create / import', d: 'Generate or upload visuals for packages, posts, and templates.' },
              { icon: FileText, t: 'Template refresh', d: 'U.S. banking-style templates for statements, notices, and ops.' },
            ].map(({ icon: Icon, t: title, d }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Icon size={20} className="text-brass mb-3" />
                <p className="font-heading font-bold text-navy">{title}</p>
                <p className="text-sm text-slate-500 mt-1 font-body leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600 font-body">
            <strong className="text-navy">Content cadence:</strong> operators can refresh imported images and
            browsed reference info on a schedule (e.g. every 4 hours) for catalogs and templates—using approved
            sources and manual QA, not unauthorized site scraping.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-full bg-navy text-white px-5 py-2.5 text-sm font-bold">Open assistant (members)</Link>
            <Link to="/register" className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold">Join to chat</Link>
          </div>
        </section>

        {/* COMMUNITY / SOCIAL */}
        <section id="community" className="scroll-mt-24 bg-white border-y border-slate-200 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass mb-3">Connections</p>
            <h2 className="font-heading text-3xl font-bold text-navy">Members · support · impact—linked</h2>
            <p className="mt-3 text-slate-600 max-w-2xl font-body">
              Social proof and channels stay professional: follow official Vantoris presence, contact desks,
              and in-app messaging after verification. No spam growth hacks—real support paths.
            </p>
            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {[
                ['In-app messages', 'Secure member ↔ support threads', '/login'],
                ['Voice desks', 'US + UK lines on Contact', '#contact'],
                ['HeroBox network', 'Volunteers, shipping, funds in ops', '/login'],
              ].map(([t, d, href]) => (
                href.startsWith('#') ? (
                  <a key={t} href={href} onClick={(e) => onNavClick(e, href)} className="rounded-2xl border border-slate-200 p-5 hover:border-brass/40 transition block">
                    <p className="font-heading font-bold text-navy">{t}</p>
                    <p className="text-sm text-slate-500 mt-1">{d}</p>
                  </a>
                ) : (
                  <Link key={t} to={href} className="rounded-2xl border border-slate-200 p-5 hover:border-brass/40 transition block">
                    <p className="font-heading font-bold text-navy">{t}</p>
                    <p className="text-sm text-slate-500 mt-1">{d}</p>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">About Vantoris</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy leading-tight">
                A private investment experience built around clarity and stewardship.
              </h2>
              <p className="mt-5 text-slate-600 text-[16px] leading-relaxed">
                Vantoris combines institutional design with human outcomes. Clients review accounts, investment records and service requests in one place, while authorized operators manage verification, approvals and service workflows.
              </p>
              <p className="mt-4 text-slate-600 text-[16px] leading-relaxed">
                We built Vantoris for people who carry responsibility: households, founders,
                service members, and communities that deserve both security and solidarity.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Role-isolated member and operations experiences',
                  'Document vault, advisor access, and audit-ready trails',
                  'AI assistant for guided help—never a replacement for human judgment',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] text-navy">
                    <CheckCircle2 size={18} className="text-brass shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] bg-white border border-slate-200/80 shadow-sm p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center">
                  <Shield size={22} className="text-brass" />
                </div>
                <div>
                  <p className="font-bold text-navy">Trust architecture</p>
                  <p className="text-sm text-slate-500">Navy · brass · institutional clarity</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                From session safeguards to operations isolation, Vantoris is designed so member
                banking and staff mission control never collide. Your money view stays yours.
                Approvals and compliance stay with authorized operators.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { icon: Lock, label: 'Secure sessions' },
                  { icon: Users, label: 'Member-first UX' },
                  { icon: Globe2, label: 'Discovery network' },
                  { icon: Smartphone, label: 'Mobile-ready' },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-[#F7F5EF] px-3 py-3 flex items-center gap-2 text-sm font-medium text-navy"
                  >
                    <Icon size={16} className="text-brass" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FinancialHeritage className="py-20" />

        {/* Pillars */}
        <section id="banking" className="scroll-mt-24 bg-white border-y border-slate-200/80 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">What you can do</p>
            <h2 className="text-3xl font-bold text-navy max-w-xl">A considered private-client workspace</h2>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {PILLARS.map(({ icon: Icon, title, body }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200/80 bg-[#F7F5EF] p-6 hover:border-brass/40 transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-navy text-brass flex items-center justify-center mb-4">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-navy text-[16px]">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cards */}
        <section id="cards" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Private client card design</p>
              <h2 className="text-3xl font-bold text-navy">A considered identity in four editions</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Four print-scalable card artworks bring the institution’s visual language into a tangible format. Actual issuance, payment credentials and card-network availability remain subject to verified issuer arrangements.
              </p>
              <ul className="mt-6 space-y-2 text-[15px] text-navy">
                {['Card request & status tracking', 'Spend visibility in Activity', 'Operator review for eligible products'].map(
                  (t) => (
                    <li key={t} className="flex gap-2 items-center">
                      <ChevronRight size={16} className="text-brass" />
                      {t}
                    </li>
                  )
                )}
              </ul>
            </div>
            <PrivateInvestmentCardGallery compact />
          </div>
        </section>

        {/* Invest */}
        <section id="invest" className="scroll-mt-24 bg-navy text-white py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Investment</p>
              <h2 className="text-3xl font-bold leading-tight">Capital, considered with transparency</h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                Portfolio views, controlled deposit and withdrawal requests, and operator-reviewed signals give clients clarity while keeping every capital workflow accountable.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
              {[
                ['Portfolio overview', 'Balances and total value at a glance'],
                ['Capital movements', 'Deposits & withdrawals with audit trails'],
                ['Guidance', 'Advisor and assistant support when you need context'],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-4">
                  <TrendingUp className="text-brass shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="text-sm text-white/60">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

<section id="travel" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Travel & flights</p>
              <h2 className="text-3xl font-bold text-navy leading-tight">
                Flights with marketplace clarity—paid from your membership
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Search routes, compare total fares, and keep trip charges next to everyday banking.
                Inspired by how modern travel sites work (search → compare → book intent)—not a
                resale of any single brand’s inventory.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Round-trip and one-way search with flexible dates',
                  'Filter nonstop, cabin class, and baggage-aware totals',
                  'Pay with eligible Vantoris balance or card when enabled',
                  'Refunds and charges appear in Activity for tracking',
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] text-navy">
                    <CheckCircle2 size={18} className="text-brass shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[12px] text-slate-400 leading-relaxed">
                Partner inventory varies by market. Vantoris is not affiliated with Expedia Group
                or any airline. Always confirm fare rules before purchase.
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white shadow-lg p-6">
              <div className="flex items-center gap-2">
                <Plane size={18} className="text-brass" />
                <p className="text-navy font-semibold text-sm">Live flight data</p>
              </div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Search and tracking results are requested from connected live data sources. Fares,
                availability, and booking are shown only when a contracted provider returns verified results.
              </p>
              <Link to="/discover/flights" className="mt-5 block w-full text-center rounded-full bg-navy text-white py-3 text-sm font-bold hover:bg-navy/90 transition">
                Open live flight tracking
              </Link>
              <Link to="/login?intent=travel" className="mt-2 block w-full text-center rounded-full border border-slate-200 text-navy py-2.5 text-sm font-semibold hover:bg-slate-50 transition">
                Sign in
              </Link>
            </div>
          </div>
        </section>

<section id="property" className="scroll-mt-24 bg-white border-y border-slate-200/80 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-start mb-12">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">
                  Homes & investment property
                </p>
                <h2 className="text-3xl font-bold text-navy leading-tight">
                  Explore the market—then learn before you buy
                </h2>
                <p className="mt-4 text-slate-600 leading-relaxed">
                  Listing-style discovery (maps, filters, price context) with a banking lens: how a
                  purchase affects cash, reserves, and risk. Educational only until you work with
                  licensed professionals in your area.
                </p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-[#F7F5EF] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 size={18} className="text-brass" />
                  <p className="font-semibold text-navy text-sm">Property discovery</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Property listings, prices, and financing estimates will appear only from connected,
                  authorized data providers. No sample listing or estimated payment is presented as live market data.
                </p>
                <Link to="/login?intent=housing" className="mt-5 block w-full text-center rounded-full bg-navy text-white py-2.5 text-sm font-bold hover:bg-navy/90">
                  Sign in to AVCU
                </Link>
              </div>
            </div>
          </div>
        </section>

<section id="wires" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Wires & tracking</p>
          <h2 className="text-3xl font-bold text-navy max-w-2xl">Send with care. Track every step.</h2>
          <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
            Domestic and international wire-style transfers sit next to everyday Send / Request.
            Members initiate, review beneficiary details, and follow status in Activity—so large
            moves are never a black box.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Initiate', 'Amount, beneficiary, bank identifiers, purpose of payment'],
              ['Verify', 'Confirm names and account details before release'],
              ['Track', 'Pending → processing → completed (or returned) in Activity'],
              ['Record', 'Keep reference IDs for disputes and statements'],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5">
                <Wallet size={18} className="text-brass mb-2" />
                <p className="font-bold text-navy text-sm">{t}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </section>

<section id="fraud" className="scroll-mt-24 bg-[#FFF8F0] border-y border-amber-200/80 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-amber-800 mb-3 flex items-center gap-2">
              <Ban size={14} /> Safety · fraud awareness
            </p>
            <h2 className="text-3xl font-bold text-navy max-w-2xl">Beware of frauds—especially wires and “investment property” pitches</h2>
            <p className="mt-4 text-slate-700 max-w-3xl leading-relaxed">
              Criminals impersonate banks, realtors, travel agents, and even military charities.
              Vantoris will never ask you to move money via secrecy, gift cards, crypto ATMs, or
              unsolicited “account recovery” links.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 gap-4">
              {[
                ['Wire fraud', 'Always verify beneficiary details out-of-band. Fraudsters change account numbers on invoices at the last minute.'],
                ['Property scams', '“Guaranteed returns,” pressure to wire earnest money the same day, or sellers who refuse inspections are red flags.'],
                ['Travel phishing', 'Fake airline refunds and booking confirmations harvest cards—open airline sites yourself, don’t click cold emails.'],
                ['Impersonation', 'Vantoris staff will not demand your password, PIN, or one-time codes by phone or chat.'],
                ['Romance / advance-fee', 'Someone you met online asking you to receive or forward funds is a classic laundering trap—decline and report.'],
                ['Too-good listings', 'Luxury property or flights far below market often mean stolen cards or non-existent inventory.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl bg-white border border-amber-100 p-5">
                  <p className="font-bold text-navy text-sm">{t}</p>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-slate-600">
              If something feels wrong, stop the transfer and contact us at{' '}
              <a href="tel:+12055688741" className="font-semibold text-navy underline">
                +1 (205) 568-8741
              </a>{' '}
              or{' '}
              <a href="tel:+447404767964" className="font-semibold text-navy underline">
                +44 7404 767964
              </a>
              . Report suspected fraud to local authorities and, in the US, to reportfraud.ftc.gov where applicable.
            </p>
          </div>
        </section>



        {/* Military */}
        <section id="military" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="rounded-[28px] bg-gradient-to-br from-[#071C38] to-[#0A2744] text-white p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brass/10 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-2 gap-10">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3 flex items-center gap-2">
                  <Plane size={14} /> Military & heroes
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Built with service members and their families in mind
                </h2>
                <p className="mt-5 text-white/70 leading-relaxed">
                  Deployment, PCS moves, and transition to civilian life change how money and care
                  work. Vantoris supports military households with practical banking tools and
                  HeroBox missions that deliver tangible support—care packages, logistics, and
                  community coordination.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  {
                    t: 'HeroBox missions',
                    d: 'Catalog, orders, fulfillment, and destination management for care packages.',
                  },
                  {
                    t: 'Volunteer & logistics networks',
                    d: 'Coordinate people and routes so help arrives where it is needed.',
                  },
                  {
                    t: 'Member banking continuity',
                    d: 'Accounts, transfers, and documents that stay reachable when life moves fast.',
                  },
                ].map(({ t, d }) => (
                  <div key={t} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <p className="font-semibold text-brass">{t}</p>
                    <p className="text-sm text-white/65 mt-1">{d}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MILITARY_ORGS.map((m) => (
                <a
                  key={m.name}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/10 transition"
                >
                  <p className="font-semibold text-sm text-white">{m.name}</p>
                  <p className="text-[11px] text-brass mt-0.5">{m.focus}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Who we help */}
        <section id="impact" className="scroll-mt-24 bg-white border-y border-slate-200/80 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Who Vantoris helps</p>
            <h2 className="text-3xl font-bold text-navy mb-10">People first. Products second.</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {HELP.map(({ title, text }) => (
                <div key={title} className="rounded-2xl border border-slate-200 p-6 bg-[#F7F5EF]">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart size={18} className="text-brass" />
                    <h3 className="font-bold text-navy">{title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Full-service banking parity */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Full-service membership banking</p>
          <h2 className="text-3xl font-bold text-navy max-w-2xl">
            Built to cover the everyday ground a major retail bank covers—plus impact rails they don’t.
          </h2>
          <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
            Vantoris targets the practical surface area members expect from institutions like
            Bank of America: accounts, cards, payments, deposits, mobile access, alerts, and
            investments. On top of that stack we run HeroBox logistics, humanitarian discovery,
            and operator-grade compliance—so banking and NGO-style action share one platform.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {BOA_PARITY.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-navy text-sm">{t}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] text-slate-400">
            Feature availability depends on eligibility, verification, jurisdiction, and product terms.
            Vantoris is not affiliated with Bank of America.
          </p>
        </section>

        {/* NGO partners */}
        <section id="ngo" className="scroll-mt-24 bg-white border-y border-slate-200/80 py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Global need · real organizations</p>
            <h2 className="text-3xl font-bold text-navy max-w-2xl">Humanitarian partners and causes the world is underfunding</h2>
            <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
              International humanitarian assistance fell sharply through 2025, leaving record gaps in
              UN-coordinated appeals. Vantoris members and operators can learn from—and when policy
              allows, support—established organizations already serving people in crisis. Links below
              go to official sites; always verify before donating.
            </p>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {NGO_PARTNERS.map((n) => (
                <a
                  key={n.name}
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-slate-200 bg-[#F7F5EF] p-5 hover:border-brass/50 transition block"
                >
                  <p className="font-bold text-navy">{n.name}</p>
                  <p className="text-[12px] font-semibold text-brass mt-1">{n.focus}</p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{n.note}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Travel */}
                {/* Property */}
                {/* Wires & track */}
                {/* Fraud awareness */}
                {/* Contact */}
        <section id="contact" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 sm:p-10">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-brass mb-3">Contact us</p>
            <h2 className="text-2xl font-bold text-navy">Talk to Vantoris</h2>
            <p className="mt-2 text-slate-600">Membership, partnerships, and HeroBox logistics.</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <a
                href="tel:+12055688741"
                className="flex-1 rounded-2xl bg-navy text-white p-5 hover:bg-navy/90 transition"
              >
                <p className="text-xs text-white/60 uppercase tracking-wider">United States</p>
                <p className="text-xl font-bold mt-1 tabular-nums">+1 (205) 568-8741</p>
              </a>
              <a
                href="tel:+447404767964"
                className="flex-1 rounded-2xl border border-slate-200 bg-[#F7F5EF] text-navy p-5 hover:border-brass/40 transition"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider">United Kingdom</p>
                <p className="text-xl font-bold mt-1 tabular-nums">+44 7404 767964</p>
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-[28px] bg-gradient-to-r from-navy to-[#0E2A4A] px-8 py-12 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-bold">Ready when you are</h2>
              <p className="mt-3 text-white/70 max-w-xl mx-auto">
                Open a membership application or sign in to the account you already trust.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/register"
                  className="rounded-full bg-brass text-navy font-bold px-6 py-3.5 text-sm hover:bg-[#d4b03a]"
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-white/30 text-white font-semibold px-6 py-3.5 text-sm hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
              <ShieldLogo size={16} />
            </div>
            <div>
              <p className="font-bold text-navy text-sm">Vantoris</p>
              <p className="text-[11px] text-slate-500">Private investment with purpose</p>
            </div>
          </div>
          <p className="text-[12px] text-slate-400 max-w-md">
            Services depend on eligibility, verification, provider availability and applicable terms. This public information page is not an account statement or proof of investment custody, deposit-taking or payment-rail availability.
          </p>
        </div>
      </footer>
    </div>
  );
}
