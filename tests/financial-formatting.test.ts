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
});

Deno.test("does not turn missing or invalid financial values into zero", () => {
  for (const value of [null, undefined, "", "not-a-number", Number.NaN, Number.POSITIVE_INFINITY]) {
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
