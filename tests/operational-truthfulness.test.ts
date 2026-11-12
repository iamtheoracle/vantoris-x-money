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

Deno.test("bulk transaction intake does not upload or import fabricated rows", async () => {
  const source = await Deno.readTextFile("src/pages/operations/BulkTransactionImport.jsx");
  assert(!source.includes("UploadFile") && !source.includes("ExtractDataFromUploadedFile"), "bulk intake must not upload records before its workflow is verified");
  assert(!source.includes("bulkImportTransactions"), "no unverified import function may be called");
  assert(!source.includes("1234567890") && !source.includes("9876543210"), "CSV template must not contain fabricated account records");
  assert(source.toLowerCase().includes("header-only"), "the template must be explicitly header-only");
});

Deno.test("transaction export is read-only until the export service is verified", async () => {
  const source = await Deno.readTextFile("src/pages/operations/TransactionExportDashboard.jsx");
  assert(!source.includes("functions.invoke('exportTransactionLedger'"), "missing export service must not be invoked");
  assert(source.includes("Export unavailable"), "export action must remain disabled");
  assert(source.includes("newest 20 records"), "bounded export history must disclose its limit");
});

Deno.test("investment signal errors are not presented as an empty signal list", async () => {
  const source = await Deno.readTextFile("src/pages/operations/InvestmentSignals.jsx");
  assert(source.includes("Investment signal records are unavailable"), "signal query errors must be visible");
  assert(source.includes("No signal records were returned by the current query"), "empty state must describe the query, not all records");
});

Deno.test("member profile does not infer private-client tiers from mixed account balances", async () => {
  const profile = await Deno.readTextFile("src/pages/Profile.jsx");
  const relationship = await Deno.readTextFile("src/components/vantoris/profile/RelationshipOverview.jsx");
  const timeline = await Deno.readTextFile("src/components/vantoris/profile/UnifiedTimeline.jsx");
  assert(!profile.includes("totalAssets = accounts.reduce"), "profile must not sum mixed or incomplete account balances");
  assert(!profile.includes("generateReferralCode"), "referral codes must not be invented in the browser");
  assert(profile.includes("Tier not assigned"), "tier must come from a recorded source or remain unassigned");
  assert(relationship.includes("formatCurrency(account.balance, account.currency || account.currency_code || null)"), "member account cards must preserve currency provenance");
  assert(timeline.includes("Value unavailable"), "missing timeline amounts must not display as zero");
});

Deno.test("member money screens do not coerce missing account balances to zero", async () => {
  const source = await Deno.readTextFile("src/pages/MoveMoney.jsx");
  assert(!source.includes("account.balance || 0") && !source.includes("a.balance||0"), "member money screens must preserve missing balances");
  assert(source.includes("account.currency || account.currency_code || null"), "member money screens must use source currency");
});

Deno.test("notification and approval inboxes cannot mutate financial records", async () => {
  const notifications = await Deno.readTextFile("src/pages/operations/OperationsNotifications.jsx");
  const approvals = await Deno.readTextFile("src/pages/operations/Approvals.jsx");
  assert(!/entities\.(Account|Transaction)\.(create|update|delete)\s*\(/.test(notifications), "notification screen must not mutate account or transaction records");
  assert(!/entities\.(Account|Transaction)\.(create|update|delete)\s*\(/.test(approvals), "approval inbox must remain read-only");
  assert(notifications.includes("cannot approve, decline, or post"), "notification UI must disclose read-only behavior");
});

Deno.test("referral operations do not expose referred members' financial balances", async () => {
  const source = await Deno.readTextFile("src/pages/operations/Referrals.jsx");
  assert(!source.includes("base44.entities.Account.list"), "referral reporting must not query referred-member account balances");
  assert(!source.includes("referredBalance"), "referral reporting must not aggregate referred-member assets");
  assert(source.includes("account balances and private financial details are never exposed"), "privacy boundary must be explicit");
});


Deno.test("member-to-member transfer screen does not depend on an external payment network", async () => {
  const source = await Deno.readTextFile("src/pages/MoveMoney.jsx");
  assert(!source.includes("findZelleRecipient") && !source.includes("ZelleProfile"), "member transfers must not use an external-network recipient directory");
  assert(source.includes("Private member-to-member transfers are not enabled yet"), "member transfer availability must be explicit");
  assert(source.replace(/\s+/g, " ").includes("No recipient search, payment instruction, transfer request, or account change has been created from this screen."), "unavailable member transfers must not imply a request was recorded");
});

Deno.test("payment functions cannot read another product's clearing or database secrets", async () => {
  const store = await Deno.readTextFile("base44/functions/_shared/paymentStore.ts");
  const receipt = await Deno.readTextFile("base44/functions/recordIncomingBankReceipt/entry.ts");
  const reconcile = await Deno.readTextFile("base44/functions/reconcileBankTransfers/entry.ts");
  const sync = await Deno.readTextFile("base44/functions/syncPlaidTransferEvents/entry.ts");
  assert(store.includes("VANTORIS_LEDGER_DATABASE_URL") && !store.includes("AVCU_LEDGER_DATABASE_URL"), "ledger adapter must use only the Vantoris database secret");
  assert(receipt.includes("VANTORIS_ACH_CLEARING_LEDGER_ACCOUNT_ID") && !receipt.includes("AVCU_"), "incoming receipts must not read another institution's clearing account IDs");
  assert(reconcile.includes("VANTORIS_FEDWIRE_CLEARING_LEDGER_ACCOUNT_ID") && !reconcile.includes("AVCU_"), "reconciliation must use Vantoris-specific clearing configuration");
  assert(sync.includes("VANTORIS_INTERNAL_SYNC_SECRET") && !sync.includes("AVCU_"), "internal provider sync must use Vantoris-specific secret");
});

Deno.test("U.S. account currency is explicit before any external transfer or receipt", async () => {
  const accountSchema = await Deno.readTextFile("base44/entities/Account.jsonc");
  const issuance = await Deno.readTextFile("base44/functions/generateAccount/entry.ts");
  const outgoing = await Deno.readTextFile("base44/functions/createTransferRequest/entry.ts");
  const incoming = await Deno.readTextFile("base44/functions/recordIncomingBankReceipt/entry.ts");
  assert(accountSchema.includes('"currency"') && accountSchema.includes('"USD"'), "account schema must record USD explicitly");
  assert(issuance.includes("currency: 'USD'"), "new account issuance must set USD");
  assert(outgoing.includes("account.currency !== 'USD'"), "outgoing requests must reject accounts without verified USD currency");
  assert(incoming.includes("account.currency!=='USD'"), "incoming receipts must reject accounts without verified USD currency");
});

Deno.test("external ACH and Fedwire submission remains disabled without explicit institution authorization", async () => {
  const submit = await Deno.readTextFile("base44/functions/submitApprovedTransfer/entry.ts");
  const readiness = await Deno.readTextFile("src/pages/operations/PaymentRailOperations.jsx");
  assert(submit.includes("Deno.env.get('VANTORIS_PROVIDER_SUBMISSION_ENABLED') !== 'true'"), "provider submission must fail closed by default");
  assert(submit.includes("No bank request was sent"), "disabled provider submission must state that no bank request was sent");
  assert(readiness.includes("processing disabled"), "rail readiness page must not imply live processing");
});
