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
