import React from 'react';
import { ArrowUpRight, Lightbulb, Route, Users } from 'lucide-react';

const STORIES = [
  {
    number: '01',
    name: 'Madam C. J. Walker',
    years: '1867–1919',
    origin: 'Denver → Indianapolis · 1905–1910',
    headline: 'A product became a platform for opportunity.',
    story: 'Walker began selling her hair-care formula door to door in 1905. She built a mail-order operation, trained a national network of agents and, in 1910, moved her headquarters to Indianapolis, where she established a factory, salon and training school. The business created routes to income and professional skills for thousands of Black women.',
    lesson: 'Build around a real need. Then build the distribution, training and opportunity around it.',
    source: 'https://www.nps.gov/articles/two-american-entrepreneurs-madam-c-j-walker-and-j-c-penney-teaching-with-historic-places.htm',
    sourceLabel: 'U.S. National Park Service',
    icon: Users,
    motif: 'WALKER · 1910',
  },
  {
    number: '02',
    name: 'Sara Blakely',
    years: 'Born 1971',
    origin: 'Atlanta · Spanx founded 2000',
    headline: 'A small frustration became a new category.',
    story: 'While working in sales, Blakely developed an idea for a footless undergarment that solved a problem she experienced herself. She founded Spanx with a $5,000 personal investment, secured a patent and built a consumer brand around a clear product insight.',
    lesson: 'Notice the friction people accept as normal. Test a practical solution before scaling the story.',
    source: 'https://www.gsb.stanford.edu/insights/sara-blakely-start-small-think-big-scale-fast',
    sourceLabel: 'Stanford Graduate School of Business · National Inventors Hall of Fame',
    icon: Lightbulb,
    motif: 'SPANX · 2000',
  },
  {
    number: '03',
    name: 'James Dyson',
    years: 'Born 1947',
    origin: 'Wiltshire, England · 1978–1993',
    headline: 'Iteration turned an idea into an invention.',
    story: 'After noticing how cyclone technology separated sawdust, Dyson explored whether the principle could improve a vacuum cleaner. The James Dyson Foundation records 5,127 prototypes over five years before the DC01 bagless cleaner was developed.',
    lesson: 'Treat each prototype as evidence. Improve the design, learn from failure and keep testing.',
    source: 'https://www.jamesdysonfoundation.co.uk/who-we-are/our-story',
    sourceLabel: 'James Dyson Foundation',
    icon: Route,
    motif: 'DYSON · 5,127 PROTOTYPES',
  },
];

export default function FounderStories() {
  return (
    <section aria-labelledby="founder-stories-title" className="rounded-[28px] border border-[#E7E3D9] bg-[#F8F7F2] p-5 sm:p-7 lg:p-9">
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#987744]">The builder's path · Field notes</p>
          <h2 id="founder-stories-title" className="font-serif text-3xl font-medium tracking-tight text-[#152532] sm:text-4xl">Ideas don't build themselves.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#66717A]">A look at the work behind enduring businesses: seeing a need, making the first version, finding customers, building a team and learning through the hard parts.</p>
        </div>
        <span className="w-fit rounded-full border border-[#D8CFBD] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7C6B4D]">Independent histories · 01—03</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {STORIES.map((story) => {
          const Icon = story.icon;
          return (
            <article key={story.name} className="group flex min-w-0 flex-col rounded-[20px] border border-[#E8E4DB] bg-white p-5 shadow-[0_2px_12px_rgba(22,34,43,0.035)] transition-shadow hover:shadow-[0_12px_30px_rgba(22,34,43,0.07)]">
              <div className="mb-5 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.18em] text-[#A18A63]">{story.number} / 03</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F0E8] text-[#80683F]"><Icon size={18} strokeWidth={1.7} /></span>
              </div>
              <div className="mb-5 flex min-h-[76px] items-end justify-between overflow-hidden rounded-xl bg-[#142532] p-4 text-[#F8F6F0]">
                <span className="font-serif text-xl tracking-wide">{story.motif}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#D8C49A]">Field note {story.number}</span>
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#A18A63]">{story.origin}</p>
              <h3 className="font-serif text-[26px] leading-tight text-[#152532]">{story.name}</h3>
              <p className="mt-1 text-[11px] text-[#879097]">{story.years}</p>
              <h4 className="mt-5 text-sm font-semibold leading-5 text-[#283A47]">{story.headline}</h4>
              <p className="mt-2 flex-1 text-[13px] leading-[1.75] text-[#68747C]">{story.story}</p>
              <div className="mt-5 rounded-xl bg-[#F7F6F1] p-3.5">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#9A7B48]">What the journey teaches</p>
                <p className="text-[12px] leading-5 text-[#394A55]">{story.lesson}</p>
              </div>
              <a href={story.source} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6F5936] hover:text-[#152532]">
                {story.sourceLabel}<ArrowUpRight size={13} />
              </a>
            </article>
          );
        })}
      </div>
      <p className="mt-5 border-t border-[#E6E0D4] pt-4 text-[10px] leading-5 text-[#899097]">These are independent historical and biographical profiles. They are not Vantoris clients, partners or endorsements, and their outcomes are not promises of investment or business results.</p>
    </section>
  );
}
