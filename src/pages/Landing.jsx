import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, ArrowRight, ShieldCheck, CreditCard, Wallet, Menu, X, Plus, Check, ChevronDown } from 'lucide-react';
import './banking.css';

const questions = [
  ['What can I do with Vantoris?', 'View your linked accounts, review activity, manage eligible cards, and access transfer and deposit options from your member workspace. Available services depend on your account and eligibility.'],
  ['How do I get started?', 'Create your member profile, complete the required verification, and follow the account application steps. Approval and product availability are subject to review.'],
  ['Where can I find rates and fees?', 'Review the terms, rates, and fee disclosures provided for your specific account before applying or making a transaction.'],
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  return <div className="banking-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="banking-header">
      <Link to="/welcome" className="wordmark" aria-label="Vantoris home"><span className="brand-symbol">v</span>vantoris<span className="wordmark-dot">.</span></Link>
      <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="public-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      <nav id="public-navigation" className={menuOpen ? 'public-nav open' : 'public-nav'} aria-label="Main navigation">
        <a href="#everyday" onClick={() => setMenuOpen(false)}>Everyday money</a><a href="#your-way" onClick={() => setMenuOpen(false)}>The Vantoris way</a><a href="#questions" onClick={() => setMenuOpen(false)}>Questions?</a>
        <Link className="login-link" to="/login">Log in <ArrowUpRight size={16} /></Link><Link className="pill pill-dark nav-cta" to="/register">Get started <ArrowRight size={16}/></Link>
      </nav>
    </header>
    <main id="main-content">
      <section className="banking-hero">
        <div className="hero-copy"><span className="eyebrow"><span/> A LITTLE CLARITY. A LOT OF POSSIBILITY.</span><h1>Your money.<br/>More <em>you.</em></h1><p>Less figuring it out. More living it up. Bring your everyday money together in one refreshingly simple place.</p><div className="hero-actions"><Link className="pill pill-dark" to="/register">Find your fresh start <ArrowUpRight size={19}/></Link><Link className="quiet-link" to="/login">Already a member? Log in <ArrowRight size={16}/></Link></div><div className="hero-note"><ShieldCheck size={18}/><span>Your next chapter starts with a clear view.</span></div></div>
        <div className="hero-visual" aria-label="Illustration of the Vantoris member experience">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="visual-caption">A little more in control.</span>
          <div className="phone-preview"><div className="phone-island"/><div className="preview-top"><span className="preview-brand">vantoris.</span><span className="preview-avatar"><Wallet size={16}/></span></div><p className="preview-greeting">Hello, possibility.</p><h2>Make room for<br/>what’s next.</h2><div className="preview-balance"><span>Your money, together</span><strong>••,•••<small>.••</small></strong><span className="preview-balance-note">A clear view of your linked accounts</span></div><div className="preview-actions"><span><i><Plus size={19}/></i>Add money</span><span><i><ArrowUpRight size={19}/></i>Send</span><span><i><ArrowDownLeft size={19}/></i>Request</span></div><div className="preview-account"><span className="mini-icon"><Wallet size={20}/></span><div><strong>Everyday spending</strong><small>For life as it happens</small></div><ArrowRight size={17}/></div><div className="preview-account"><span className="mini-icon savings"><Plus size={20}/></span><div><strong>Your next big thing</strong><small>Keep your goals in sight</small></div><ArrowRight size={17}/></div><span className="preview-label">MEMBER EXPERIENCE PREVIEW</span></div>
          <div className="floating-card"><span>vantoris.</span><CreditCard size={26}/><div className="card-bottom"><span>EVERYDAY, YOUR WAY</span><span>••••</span></div></div><div className="floating-note"><span><Check size={17}/></span>Small steps. Big possibilities.</div>
        </div>
      </section>
      <div className="value-strip"><span><Check size={18}/> Clarity at a glance</span><span><Check size={18}/> Everyday made easier</span><span><Check size={18}/> Space for your goals</span><span><Check size={18}/> Always within reach</span></div>
      <section id="everyday" className="everyday-section"><div className="section-heading"><div><span className="eyebrow">LESS FRICTION. MORE FORWARD.</span><h2>Life moves.<br/>Your money should too.</h2></div><p>From the everyday essentials to the plans you’re dreaming up. Find your next move, without the runaround.</p></div><div className="feature-grid"><article className="feature feature-spending"><span className="feature-icon"><Wallet/></span><span className="feature-number">01 / EVERYDAY</span><h3>A home for your<br/>day-to-day.</h3><p>See your linked accounts and recent activity in one place. Know where you stand before your next move.</p><Link to="/login">Explore your money <ArrowUpRight size={20}/></Link><div className="feature-art"><span>YOUR MONEY</span><div><i/><b>Spending</b><ArrowUpRight size={18}/></div><div><i/><b>Saving</b><Plus size={18}/></div></div></article><article className="feature feature-cards"><span className="feature-icon"><CreditCard/></span><span className="feature-number">02 / ON YOUR TERMS</span><h3>Your card.<br/>Your call.</h3><p>Find eligible cards and account controls in your member workspace. A little more confidence in your pocket.</p><Link to="/cards">Explore cards <ArrowUpRight size={20}/></Link><div className="small-bank-card" aria-hidden="true"><b>vantoris.</b><CreditCard/><span>MADE FOR YOUR EVERYDAY</span></div></article></div></section>
      <section id="your-way" className="your-way"><span className="eyebrow">THE VANTORIS WAY</span><h2>Big on possibility.<br/><em>Easy on your everyday.</em></h2><div className="way-details"><p>Good money habits start with understanding your money. We put the essentials up front, use words that make sense, and keep your next step close.</p><Link className="pill pill-dark" to="/register">Let’s make a start <ArrowUpRight size={18}/></Link></div></section>
      <section id="questions" className="faq-section"><div><span className="eyebrow">GOOD TO KNOW</span><h2>A little clarity<br/>goes a long way.</h2><p>A few answers before your next step.</p></div><div className="faq-list">{questions.map(([title, answer], i) => <div className="faq-item" key={title}><h3><button onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i} aria-controls={`answer-${i}`}>{title}<ChevronDown size={20} className={expanded === i ? 'rotated' : ''}/></button></h3><p id={`answer-${i}`} hidden={expanded !== i}>{answer}</p></div>)}</div></section>
    </main><footer className="banking-footer"><Link to="/welcome" className="wordmark"><span className="brand-symbol">v</span>vantoris.</Link><div><Link to="/login">Member login <ArrowUpRight size={14}/></Link><a href="#questions">Help & questions</a></div><p>© {new Date().getFullYear()} Vantoris. Product availability, eligibility, fees, and terms vary. Review the disclosures for your account. Interface illustrations do not represent an issued account or card. Vantoris is not affiliated with SoFi or Chime.</p></footer>
  </div>;
}
