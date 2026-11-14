function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

import { centsToDecimal, formatCurrency, generateAccountNumber } from "../src/lib/formatCurrency.js";
import { transactionPresentation } from "../src/lib/transactionPresentation.js";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

Deno.test("formats a verified zero balance as zero, not unavailable", () => {
  assertEqual(formatCurrency(0), "$0.00", "zero balance");
});

Deno.test("formats a valid numeric amount", () => {
  assertEqual(formatCurrency(1234.5), "$1,234.50", "valid amount");
  assertEqual(formatCurrency(1234.5, "EUR"), "€1,234.50", "explicit currency");
});

Deno.test("does not assume a currency when the source omits it", () => {
  assertEqual(formatCurrency(1234.5, null), "Currency not supplied", "missing currency");
});

Deno.test("does not turn missing or invalid financial values into zero", () => {
  for (const value of [null, undefined, "", "   ", "not-a-number", Number.NaN, Number.POSITIVE_INFINITY]) {
    assertEqual(formatCurrency(value), "Value unavailable", "invalid amount");
  }
});

Deno.test("account numbers cannot be generated in the browser", () => {
  let threw = false;
  try {
    generateAccountNumber();
  } catch {
    threw = true;
  }
  assertEqual(threw, true, "server-issued account number guard");
});

Deno.test("transaction direction requires a recognized transaction type", () => {
  const unknownPositive = transactionPresentation(25, "unclassified");
  assertEqual(unknownPositive.amount, 25, "unknown amount remains visible");
  assertEqual(unknownPositive.sign, "", "unknown positive direction stays neutral");
  assertEqual(unknownPositive.tone, "text-slate-500", "unknown direction uses neutral tone");

  const unknownNegative = transactionPresentation(-25, "unclassified");
  assertEqual(unknownNegative.sign, "", "amount sign alone does not imply debit or credit");
  assertEqual(transactionPresentation(25, "debit").sign, "−", "recognized debit direction");
  assertEqual(transactionPresentation(25, "deposit").sign, "+", "recognized credit direction");
  assertEqual(transactionPresentation(null, "deposit").amount, null, "missing amount remains unavailable");
});

Deno.test("account detail uses exact integer-cent formatting", () => {
  assertEqual(centsToDecimal(0), "0.00", "zero cents");
  assertEqual(centsToDecimal(12345), "123.45", "positive cents");
  assertEqual(centsToDecimal(-12345), "-123.45", "negative cents");
  assertEqual(centsToDecimal(null), null, "missing cents");
  assertEqual(centsToDecimal(""), null, "blank cents");
  assertEqual(centsToDecimal("12x"), null, "invalid cents");
});

Deno.test("investment screen withholds unverified portfolio balances", async () => {
  const source = await Deno.readTextFile("src/pages/Investment.jsx");
  assert(source.includes("No investment balance is currently available"), "unverified investment balances must remain unavailable");
  assert(source.includes("verified the underlying asset records"), "investment holdings require verified source records");
  assert(source.includes("No third-party portfolio figure is treated as a Vantoris balance"), "external portfolio totals must not be represented as institutional balances");
  assert(!/\$[0-9]|€[0-9]|£[0-9]/.test(source), "the unavailable investment screen must not display a fabricated portfolio value");
});
