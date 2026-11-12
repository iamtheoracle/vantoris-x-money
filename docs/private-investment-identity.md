# Vantoris Private Investment — Identity and Heritage

## Direction

The existing Vantoris application is being presented as **Vantoris Private Investment**. This is a visual and product-positioning evolution of the recovered application, not a replacement application.

Preserve existing member, operator, administrative, investment, messaging, HeroBox, travel, service and support capabilities. Do not represent a design change as proof of a regulated investment licence, custody arrangement, brokerage relationship, issuer partnership, live market feed or payment-rail activation.

## Visual system

- Core palette: midnight navy `#071A2D`, warm ivory `#F7F5EF`, antique brass `#C9A962`, and restrained slate neutrals.
- Typography: Inter for interface and body copy; Instrument Serif for editorial titles; IBM Plex Mono for dates, folios and numeric metadata.
- Surface language: warm paper-like backgrounds, quiet borders, restrained shadows, carefully spaced editorial cards.
- Responsive layouts must preserve legibility and usable controls at mobile, tablet and desktop widths.
- Print styles keep the four SVG card faces at a 3.375 × 2.125 inch card-face ratio. SVG artwork uses a 1050 × 660 viewBox and remains vector-scalable.

## Four card-art editions

The card faces are original Vantoris vector artwork in `public/card-art/`:

1. Obsidian — midnight navy, fine diagonal texture and concentric linework.
2. Ivory — warm paper, restrained gold geometry and double border.
3. Meridian — deep green-blue, navigation geometry and mapped linework.
4. Atelier — charcoal, ornamental pattern and antique-gold framing.

These are visual concepts only. They contain no PAN, CVV, expiry date, EMV credential or payment-network mark. They must not be represented as issued cards. Actual card issuance and network availability remain dependent on verified issuer arrangements.

## Financial-history collection

The four short editorial entries are independent historical notes. They do not imply endorsement, ownership, affiliation, partnership or institutional lineage between the historical people or firms and Vantoris.

### Giovanni di Bicci de' Medici

- Milestone: 1397, Florence.
- Note: the Medici Bank was established in 1397; its later branches handled deposits, exchange, bills of exchange and merchant finance.
- Historical reference: Raymond de Roover, *The Rise and Decline of the Medici Bank, 1397–1494* — https://www.fulcrum.org/concern/monographs/gh93gz54c
- Portrait: Agnolo Bronzino workshop portrait of Giovanni di Bicci de' Medici — Wikimedia Commons file page: https://commons.wikimedia.org/wiki/File:Giovanni_di_Bicci_de%27_Medici_Portrait_by_Agnolo_Bronzino.jpg

### Sir Francis Baring

- Milestone: 1762, London.
- Note: Francis Baring established the London trading house Barings in 1762; it became a major merchant-banking firm and an important government financial adviser.
- Historical reference: National Portrait Gallery — https://www.npg.org.uk/collections/search/person/mp00249/sir-francis-baring-1st-bt
- Portrait: Benjamin West, *Sir Francis Baring* — Wikimedia Commons file page: https://commons.wikimedia.org/wiki/File:Sir_Francis_Baring.jpg

### Mayer Amschel Rothschild

- Milestone: 1769, Frankfurt; partnership formalised in 1810.
- Note: a coin-trading business expanded into financial services; the partnership with his sons preceded the establishment of family banking houses in several European cities.
- Historical reference: The Rothschild Archive — https://www.rothschildarchive.org/exhibitions/timeline/
- Image: Moritz Daniel Oppenheim, *The Visit of William I, Elector of Hesse to Amschel Mayer de Rothschild* — Wikimedia Commons file page: https://commons.wikimedia.org/wiki/File:The_visit_of_William_I,_Elector_of_Hesse_to_Amschel_Mayer_de_Rothschild_(1744-1812).jpg

### J. Pierpont Morgan

- Milestone: 1871, New York; reorganisation in 1895.
- Note: Morgan and Anthony Drexel formed Drexel, Morgan & Co. in 1871. The firm was reorganised as J.P. Morgan & Co. in 1895 and participated in major railroad and corporate finance.
- Historical reference: The Morgan Library & Museum — https://www.themorgan.org/morgan-syndicate-books
- Portrait: J.P. Morgan studio portrait — Wikimedia Commons file page: https://commons.wikimedia.org/wiki/File:J.P._Morgan.jpg

## Image and print handling

The four card faces are original SVGs and are suitable for scalable print output. The historical portraits are separate editorial imagery and have different source resolutions. Before producing large-format physical prints of the heritage cards, verify the exact source-file resolution, reproduction terms and any jurisdiction-specific cultural-property restrictions; obtain higher-resolution licensed files where needed. Do not assume a web thumbnail is print-ready.

Keep source attribution available in the UI and in this document. Do not remove image credit when cropping or styling portraits.

## Current scope of implementation

This change adds the heritage collection to the public landing page, member dashboard and investment workspace; adds four vector card-art editions; and applies the warm ivory / navy / brass editorial system and print CSS. It does not change financial workflows, account records, provider configuration, permissions, operator approvals or deployment state.


## Deferred verification and next dependency

- `npm run lint`, `npm run typecheck` and `npm run build` have not been executed in this environment. The available container could not resolve `github.com`, so the repository could not be cloned and dependencies could not be installed.
- The draft pull request targets `recovery/merge-vantoris-live`. The existing `.github/workflows/recovery-build.yml` listens to pushes on that recovery branch and pull requests targeting `main`; it will not automatically run for this draft PR.
- Next verification step: use **Actions → Recovery build check → Run workflow** and select `feat/private-investment-heritage-design` as the branch. Review lint, typecheck, build and the workflow's existing security checks before changing the PR out of draft.
- After a successful build, perform browser QA on public landing, member dashboard, investment workspace and Brand Identity. Confirm all four SVG card faces render, the four historical images load, compact cards remain legible, and print preview preserves the 3.375 × 2.125 inch card-face geometry. Verify image reproduction terms and resolution before large-format portrait printing.
- No merge, provider activation, financial operation or production deployment has been performed.
