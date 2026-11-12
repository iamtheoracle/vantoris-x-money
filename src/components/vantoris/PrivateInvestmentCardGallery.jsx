import React from 'react';

const CARD_ART = [
  { name: 'Obsidian', edition: '01', src: '/card-art/obsidian.svg', alt: 'Vantoris Private Investment Obsidian card artwork in midnight navy and gold' },
  { name: 'Ivory', edition: '02', src: '/card-art/ivory.svg', alt: 'Vantoris Private Investment Ivory card artwork with warm ivory and gold detailing' },
  { name: 'Meridian', edition: '03', src: '/card-art/meridian.svg', alt: 'Vantoris Private Investment Meridian card artwork in deep green and gold' },
  { name: 'Atelier', edition: '04', src: '/card-art/atelier.svg', alt: 'Vantoris Private Investment Atelier card artwork in charcoal and antique gold' },
];

export default function PrivateInvestmentCardGallery({ compact = false, className = '' }) {
  return (
    <section className={`private-card-gallery ${compact ? 'private-card-gallery--compact' : ''} ${className}`.trim()} aria-label="Vantoris private investment card artwork">
      <div className="private-card-gallery__grid">
        {CARD_ART.map((card) => (
          <figure className="private-card-art" key={card.edition}>
            <img src={card.src} alt={card.alt} loading="eager" decoding="async" />
            {!compact && <figcaption><span>{card.name} Edition</span><span>VANTORIS · {card.edition}</span></figcaption>}
          </figure>
        ))}
      </div>
      <p className="private-card-gallery__note">Illustrative design artwork only. It does not represent an issued payment card, payment credential or confirmed card-network partnership.</p>
    </section>
  );
}
