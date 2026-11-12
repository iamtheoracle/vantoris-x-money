function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

Deno.test("ACH and Fedwire require two different staff approvals before submission", async () => {
  const review = await Deno.readTextFile("base44/functions/reviewTransferRequest/entry.ts");
  const submit = await Deno.readTextFile("base44/functions/submitApprovedTransfer/entry.ts");
  const manual = await Deno.readTextFile("base44/functions/recordManualTransferEvent/entry.ts");
  assert(review.includes("status: 'awaiting_dual_approval'"), "first review must leave external transfers awaiting a second approval");
  assert(review.includes("!['ACH', 'FEDWIRE'].includes(request.rail)"), "second approval must support only approved domestic rails");
  assert(submit.includes("!['ACH', 'FEDWIRE'].includes(transfer.rail)"), "provider submission must require an approved domestic rail");
  assert(submit.includes("transfer.reviewer_user_id === transfer.approver_user_id"), "provider submission must reject the same reviewer and approver");
  assert(manual.includes("transfer.reviewer_user_id === transfer.approver_user_id"), "manual submission must reject the same reviewer and approver");
});

Deno.test("approval inbox never infers pending from a missing status", async () => {
  const source = await Deno.readTextFile("src/pages/operations/Approvals.jsx");
  assert(source.includes("new Set(['pending', 'requested', 'review'])"), "only explicit pending states are recognized");
  assert(source.includes("item?.status || ''"), "missing status must remain missing");
  assert(!source.includes("item?.status || 'pending'"), "missing status must not be silently classified as pending");
});

Deno.test("bounded deposit and portfolio views do not fabricate zero totals", async () => {
  const deposits = await Deno.readTextFile("src/pages/operations/Deposits.jsx");
  const portfolios = await Deno.readTextFile("src/pages/operations/InvestmentPortfolios.jsx");
  assert(!deposits.includes("totalAmount"), "bounded deposits must not calculate an institution-wide total");
  assert(deposits.includes("transaction.amount, transaction.currency || transaction.currency_code || null"), "deposit rows must preserve source currency");
  assert(!portfolios.includes("p.total_value || 0") && !portfolios.includes("p.cash_balance || 0"), "missing portfolio values must not become zero");
  assert(portfolios.includes("Status not supplied"), "missing portfolio status must remain explicit");
});

Deno.test("security monitoring does not label bounded query results as secure", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/widgets/SecurityStatusWidget.jsx");
  assert(source.includes("Limited snapshot"), "security widget must label its bounded data");
  assert(!source.includes("label: 'Secure'") && !source.includes("status === 'secure'"), "bounded results must never create a secure-state claim");
  assert(source.includes("Unavailable"), "failed security sources must be represented as unavailable");
});

Deno.test("withdrawal audit labels bounded records and does not sum mixed currencies", async () => {
  const source = await Deno.readTextFile("src/pages/operations/WithdrawalAuditLog.jsx");
  assert(source.includes("Audit records returned · max 300"), "audit count must disclose the query bound");
  assert(!source.includes("totalApproved"), "mixed-currency approved amounts must not be summed in the browser");
  assert(source.includes("acct?.currency || acct?.currency_code || null"), "audit values must use source currency");
});

Deno.test("withdrawal policy configuration cannot be mutated from the browser", async () => {
  const source = await Deno.readTextFile("src/pages/operations/WithdrawalLimits.jsx");
  assert(!/entities\.WithdrawalLimit\.(create|update|delete)\s*\(/.test(source), "withdrawal policy must not be written directly from the browser");
  assert(!source.includes("enabled: true") && !source.includes("daily_limit: 0"), "missing policy records must not receive invented defaults");
  assert(source.includes("server-authorized dual-approval workflow"), "policy writes must remain held pending server authorization");
});

Deno.test("withdrawal audit output masks account numbers", async () => {
  const source = await Deno.readTextFile("src/pages/operations/WithdrawalAuditLog.jsx");
  assert(source.includes("maskAccountNumber(acct?.account_number)"), "audit views and exports must mask account identifiers");
});
