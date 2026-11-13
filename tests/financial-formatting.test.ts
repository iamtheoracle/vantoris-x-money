import { formatCurrency, generateAccountNumber } from "../src/lib/formatCurrency.js";

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

Deno.test("member Home transaction direction stays neutral when amount and type do not establish direction", async () => {
  const source = await Deno.readTextFile("src/pages/Home.jsx");
  assert(source.includes("function transactionPresentation(amount, type)"), "Home activity must use a centralized direction classifier");
  assert(source.includes("return { amount: Number.isFinite(raw) ? 0 : null, sign: '', tone: 'text-slate-500' };"), "unknown transaction types must remain neutral");
  assert(source.includes("presentation.sign") && source.includes("presentation.tone"), "activity rows must render the classifier output");
  assert(!source.includes("const credit = hasAmount"), "Home must not classify every unknown type as a debit");
});

Deno.test("account detail formatter does not coerce absent amounts to zero", async () => {
  const source = await Deno.readTextFile("src/pages/AccountDetail.jsx");
  assert(source.includes("value === null || value === undefined || (typeof value === 'string' && value.trim() === '')"), "account detail must reject null and blank values before numeric coercion");
  assert(source.includes("if (!Number.isFinite(amount)) return 'Amount not supplied';"), "invalid account detail amounts must remain unavailable");
});
