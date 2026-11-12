import React from 'react';

const FIGURES = [
  {
    name: "Giovanni di Bicci de' Medici",
    years: "c. 1360–1429",
    milestone: "1397 · Florence",
    title: "A banking house takes shape",
    story: "In 1397, Giovanni established the Medici Bank in Florence. Its later network of branches handled deposits, currency exchange, bills of exchange and merchant finance across major European trading centres.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Giovanni_di_Bicci_de%27_Medici_Portrait_by_Agnolo_Bronzino.jpg",
    imageAlt: "Renaissance portrait of Giovanni di Bicci de' Medici",
    imageCredit: "Portrait attributed to Cristofano dell'Altissimo · Wikimedia Commons",
    source: "https://gwern.net/doc/history/medici/1963-deroover-theriseanddeclineofthemedicibank.pdf",
    sourceLabel: "Raymond de Roover, The Rise and Decline of the Medici Bank",
  },
  {
    name: "Sir Francis Baring",
    years: "1740–1810",
    milestone: "1762 · London",
    title: "Merchant finance at scale",
    story: "Francis Baring established a London trading house in 1762. It grew into a major merchant-banking firm, advising governments and helping finance international trade and public borrowing.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Sir_Francis_Baring.jpg",
    imageAlt: "Portrait of Sir Francis Baring",
    imageCredit: "Benjamin West · Wikimedia Commons · Public domain",
    source: "https://www.npg.org.uk/collections/search/person/mp00249/sir-francis-baring-1st-bt",
    sourceLabel: "National Portrait Gallery · Sir Francis Baring",
  },
  {
    name: "Mayer Amschel Rothschild",
    years: "1744–1812",
    milestone: "1769 · Frankfurt",
    title: "A network across Europe",
    story: "A coin-trading business grew into a financial house serving clients across borders. In 1810, Mayer Amschel formalised a partnership with his sons; the family later established banking houses in London, Paris, Vienna and Naples.",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/The_visit_of_William_I%2C_Elector_of_Hesse_to_Amschel_Mayer_de_Rothschild_%281744-1812%29.jpg",
    imageAlt: "Historical painting depicting Mayer Amschel Rothschild receiving William I, Elector of Hesse",
    imageCredit: "Moritz Daniel Oppenheim · Wikimedia Commons · Public domain",
    source: "https://www.rothschildarchive.org/business/",
    sourceLabel: "The Rothschild Archive · Origins of the business",
  },
  {
    name: "J. Pierpont Morgan",
    years: "1837–1913",
    milestone: "1871 · New York",
    title: "Capital for an industrial age",
    story: "In 1871, Morgan and Anthony Drexel formed Drexel, Morgan & Co. The partnership was reorganised as J.P. Morgan & Co. in 1895 and became closely associated with the financing of railroads and major American enterprises.",
    image: "https://upload.wikimedia.org/wikipedia/commons/8/8b/J.P._Morgan.jpg",
    imageAlt: "Black-and-white studio portrait of J. Pierpont Morgan",
    imageCredit: "Historical studio portrait · Wikimedia Commons · Public domain",
    source: "https://www.themorgan.org/morgan-syndicate-books",
    sourceLabel: "The Morgan Library & Museum · Syndicate records",
  },
];

export default function FinancialHeritage({ compact = false, className = "" }) {
  return (
    <section className={`financial-heritage ${compact ? "financial-heritage--compact" : ""} ${className}`.trim()} aria-labelledby="financial-heritage-title">
      <div className="financial-heritage__heading">
        <div>
          <p className="financial-heritage__eyebrow">The history of capital</p>
          <h2 id="financial-heritage-title">Milestones in private finance</h2>
          <p className="financial-heritage__intro">Four chapters in the evolution of banking, merchant finance and international capital.</p>
        </div>
        <span className="financial-heritage__folio" aria-hidden="true">ARCHIVE · 01—04</span>
      </div>

      <div className="financial-heritage__grid">
        {FIGURES.map((figure, index) => (
          <article className="heritage-card" key={figure.name}>
            <div className="heritage-card__image-wrap">
              <img
                className="heritage-card__image"
                src={figure.image}
                alt={figure.imageAlt}
                loading="lazy"
                decoding="async"
              />
              <span className="heritage-card__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="heritage-card__date">{figure.milestone}</span>
            </div>
            <div className="heritage-card__body">
              <p className="heritage-card__years">{figure.years}</p>
              <h3>{figure.name}</h3>
              <p className="heritage-card__title">{figure.title}</p>
              <p className="heritage-card__story">{figure.story}</p>
              <div className="heritage-card__footer">
                <span>{figure.imageCredit}</span>
                <a href={figure.source} target="_blank" rel="noreferrer" aria-label={`Read source for ${figure.name}`}>Source ↗</a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
