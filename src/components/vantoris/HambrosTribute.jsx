import React from 'react';

const MILESTONES = [
  { year: '1839', title: 'A London beginning', text: 'Carl Joachim Hambro established C. J. Hambro & Son in London, building on the family’s Copenhagen merchant-banking background.' },
  { year: '1921', title: 'Hambros Bank takes its name', text: 'Following a merger with the British Bank of Northern Commerce, the institution became Hambros Bank.' },
  { year: '1926', title: 'A new City headquarters', text: 'The bank’s new head office at 41 Bishopsgate was documented in the Bedford Lemere photographic archive.' },
  { year: '1998', title: 'The end of its independent chapter', text: 'Société Générale acquired Hambros Bank. The Hambros name continued in later successor branding, but the independent institution did not continue unchanged.' },
];

export default function HambrosTribute() {
  return (
    <section id="hambros-tribute" className="scroll-mt-24 border-y border-[#C9A962]/25 bg-[#F1EDE3] py-20" aria-labelledby="hambros-tribute-title">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-[#B99B62]/40 bg-[#102638] p-7 text-[#F7F3E9] shadow-[0_24px_70px_rgba(7,26,45,.18)] sm:p-10">
            <div className="absolute inset-0 opacity-[0.12]" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(90deg, transparent 49.8%, #D8C18A 50%, transparent 50.2%), linear-gradient(0deg, transparent 49.8%, #D8C18A 50%, transparent 50.2%)', backgroundSize: '44px 44px' }} />
            <svg viewBox="0 0 560 390" role="img" aria-label="Original architectural illustration inspired by historic London banking halls" className="relative mx-auto block w-full max-w-[34rem]">
              <defs>
                <linearGradient id="hambros-stone" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E8D7B1"/><stop offset="1" stopColor="#B89A62"/></linearGradient>
              </defs>
              <path d="M55 132L280 42L505 132Z" fill="url(#hambros-stone)" opacity=".94"/>
              <path d="M78 139H482M92 151H468M70 315H490M54 333H506" stroke="#D8C18A" strokeWidth="5" fill="none"/>
              {[112,196,280,364,448].map((x) => <g key={x}><path d={`M${x-24} 304V178Q${x} 145 ${x+24} 178V304Z`} fill="none" stroke="#E8D7B1" strokeWidth="7"/><path d={`M${x-31} 174H${x+31}`} stroke="#D8C18A" strokeWidth="5"/></g>)}
              <path d="M280 42V20M267 20H293" stroke="#D8C18A" strokeWidth="4"/>
              <path d="M45 350H515" stroke="#D8C18A" strokeWidth="2" opacity=".65"/>
              <text x="280" y="378" textAnchor="middle" fill="#E8D7B1" fontSize="13" letterSpacing="5">LONDON · 41 BISHOPSGATE</text>
            </svg>
            <div className="relative mt-5 flex items-center justify-between border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#D8C18A]">
              <span>Historical tribute</span><span>Archive folio · 01</span>
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B6C35]">A separate corner of remembrance</p>
            <h2 id="hambros-tribute-title" className="mt-3 font-heading text-4xl leading-tight text-[#102638] sm:text-5xl">In honour of Hambros Bank</h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700">
              This corner respectfully records Hambros Bank’s London roots, merchant-banking tradition and place in the history of the City. It is an independent historical tribute and makes no claim of succession, ownership, partnership, endorsement or affiliation.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {MILESTONES.map((item) => (
                <article key={item.year} className="border-l-2 border-[#B99B62] pl-4">
                  <p className="font-mono text-xs font-semibold tracking-[0.16em] text-[#8B6C35]">{item.year}</p>
                  <h3 className="mt-1 text-sm font-bold text-[#102638]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p>
                </article>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <a href="https://historicengland.org.uk/images-books/photos/item/BL28492" target="_blank" rel="noreferrer" className="font-semibold text-[#102638] underline decoration-[#B99B62] underline-offset-4">View the 1926 banking hall archive ↗</a>
              <a href="https://atom.aim25.com/index.php/hambros-bank-limited?sf_culture=en" target="_blank" rel="noreferrer" className="font-semibold text-[#102638] underline decoration-[#B99B62] underline-offset-4">Explore the surviving bank records ↗</a>
            </div>
            <p className="mt-6 border-t border-[#B99B62]/35 pt-4 text-xs leading-relaxed text-slate-500">
              Vantoris is focused on the United States. This London history corner is editorial remembrance only; it does not describe a Vantoris office, service area or business relationship in the United Kingdom.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
