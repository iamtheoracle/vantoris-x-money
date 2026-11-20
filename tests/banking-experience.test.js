import test from "node:test";
import assert from "node:assert/strict";
import {
  dollarsToCents,
  validRoutingNumber,
  filterActivity,
} from "../src/lib/banking-experience.js";

test("parses exact cents without floating point rounding errors", () => {
  assert.equal(dollarsToCents("0.29"), 29);
  assert.equal(dollarsToCents(".29"), 29);
  assert.equal(dollarsToCents("12."), 1200);
  assert.equal(dollarsToCents("125.10"), 12510);
  assert.equal(dollarsToCents(" 75 "), 7500);
  for (const value of [
    "0",
    "-1",
    "1.001",
    "1e4",
    "Infinity",
    "",
    "1,000",
    "9999999999999999",
  ])
    assert.equal(dollarsToCents(value), null);
});
test("validates ABA routing checksum and prefix", () => {
  assert.equal(validRoutingNumber("021000021"), true);
  for (const value of [
    "021000022",
    "000000000",
    "123",
    "999999999",
    "abcdefghi",
  ])
    assert.equal(validRoutingNumber(value), false);
});
test("activity filters combine search, status and date", () => {
  const now = Date.UTC(2026, 10, 20);
  const rows = [
    {
      id: "a",
      description: "Bookshop",
      status: "completed",
      created_date: "2026-11-19",
    },
    {
      id: "b",
      description: "Bookshop",
      status: "pending",
      created_date: "2026-11-18",
    },
    {
      id: "c",
      description: "Bookshop",
      status: "completed",
      created_date: "2026-06-01",
    },
  ];
  assert.deepEqual(
    filterActivity(rows, {
      query: "BOOK",
      status: "completed",
      period: "30",
      now,
    }).map((row) => row.id),
    ["a"],
  );
  assert.equal(filterActivity(rows, { query: "not found" }).length, 0);
  assert.equal(filterActivity(rows).length, 3);
});
