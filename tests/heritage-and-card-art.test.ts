function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("four original card editions remain vector-scalable and credential-free", async () => {
  const editions = ["obsidian", "ivory", "meridian", "atelier"];
  for (const edition of editions) {
    const svg = await Deno.readTextFile(`public/card-art/${edition}.svg`);
    assert(svg.includes('viewBox="0 0 1050 660"'), `${edition} must preserve the 1050×660 vector canvas`);
    assert(!/\b(?:VISA|MASTERCARD|AMEX|CVV|PAN|EMV)\b/i.test(svg), `${edition} must not imply a network or contain payment credentials`);
    assert(!/\b\d{13,19}\b/.test(svg), `${edition} must not contain a payment-card number`);
  }
});

Deno.test("heritage collection includes four dated historical finance notes with sources", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/FinancialHeritage.jsx");
  for (const marker of ["Giovanni di Bicci de' Medici", "Sir Francis Baring", "Mayer Amschel Rothschild", "J. Pierpont Morgan", "1397", "1762", "1769", "1871", "imageCredit", "sourceLabel"]) {
    assert(source.includes(marker), `financial history collection must include ${marker}`);
  }
});

Deno.test("Hambros remembrance is a separate historical tribute, not an affiliation claim", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/HambrosTribute.jsx");
  for (const year of ["1839", "1921", "1926", "1998"]) {
    assert(source.includes(year), `Hambros chronology must include ${year}`);
  }
  assert(/no claim of succession, ownership, partnership, endorsement or affiliation/i.test(source), "tribute must disclaim succession and affiliation");
});

Deno.test("card gallery exposes four editions and an issuance disclaimer", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/PrivateInvestmentCardGallery.jsx");
  for (const edition of ["Obsidian", "Ivory", "Meridian", "Atelier"]) {
    assert(source.includes(edition), `gallery must include ${edition}`);
  }
  assert(/not represent an issued payment card/i.test(source), "gallery must distinguish artwork from an issued card");
});

Deno.test("print actions isolate the requested card and heritage collections", async () => {
  const cardGallery = await Deno.readTextFile("src/components/vantoris/PrivateInvestmentCardGallery.jsx");
  const heritage = await Deno.readTextFile("src/components/vantoris/FinancialHeritage.jsx");
  const css = await Deno.readTextFile("src/index.css");
  assert(cardGallery.includes("print-private-card-art"), "card gallery must enable its dedicated print layout");
  assert(heritage.includes("print-financial-heritage"), "heritage collection must enable its dedicated print layout");
  assert(css.includes("3.375in") && css.includes("2.125in"), "print CSS must preserve card-face dimensions");
});

Deno.test("public design surfaces do not publish fabricated staff or contact identities", async () => {
  const brand = await Deno.readTextFile("src/pages/BrandIdentity.jsx");
  const landing = await Deno.readTextFile("src/pages/Landing.jsx");
  const marketing = await Deno.readTextFile("src/pages/DiscoverMarketing.jsx");
  assert(!brand.includes("5421 88") && !brand.includes("Alexandra M. Whitmore"), "brand identity must not show fabricated card or staff details");
  assert(!landing.includes("+447404767964") && !landing.includes("+12055688741"), "public landing must not publish unverified contact numbers");
  assert(!marketing.includes("images.unsplash.com"), "brand communications page must use approved platform assets, not stock placeholders");
});

Deno.test("founder field notes are dated, sourced, and clearly independent of Vantoris", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/FounderStories.jsx");
  for (const marker of ["Madam C. J. Walker", "Sara Blakely", "James Dyson", "1905", "1910", "$5,000", "5,127 prototypes", "National Park Service", "National Inventors Hall of Fame", "James Dyson Foundation", "not Vantoris clients, partners or endorsements"]) {
    assert(source.includes(marker), `founder story collection must include ${marker}`);
  }
});

Deno.test("member Home account overview maintains readable contrast on its light surface", async () => {
  const source = await Deno.readTextFile("src/pages/Home.jsx");
  assert(source.includes("bg-white text-navy p-7"), "account overview must retain the approved light surface");
  assert(source.includes("text-slate-600\">Individual recorded balances"), "account explanatory copy must use a readable dark neutral on white");
  assert(source.includes("border-t border-slate-200 w-full"), "investment workspace divider must remain visible on white");
  assert(!source.includes("text-white/65\">Individual recorded balances"), "light-surface explanatory copy must not use low-contrast white text");
  assert(!source.includes("border-t border-white/10 w-full text-left"), "light-surface divider must not use a white-on-white border");
});
