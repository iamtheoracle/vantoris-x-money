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


Deno.test("member-to-member transfer uses Vantoris internal ledger posting", async () => {
  const source = await Deno.readTextFile("src/pages/MoveMoney.jsx");
  assert(!source.includes("findZelleRecipient") && !source.includes("ZelleProfile"), "member transfers must not use an external-network recipient directory");
  assert(source.includes("action: 'transfer'"), "member transfers must call the Vantoris-owned internal transfer endpoint");
  assert(source.includes("result.transfer?.status !== 'posted'") && source.includes("result.transfer?.journalId"), "the UI must require a confirmed posted journal before reporting success");
  assert(source.includes("idempotency-key"), "member transfer retries must carry an idempotency key");
  assert(source.includes("This transfer does not use a sponsor bank, Plaid, ACH, Fedwire"), "member transfers must disclose that they remain internal to Vantoris");
});

Deno.test("payment functions cannot read another product's clearing or database secrets", async () => {
  const store = await Deno.readTextFile("base44/functions/_shared/paymentStore.ts");
  const receipt = await Deno.readTextFile("base44/functions/recordIncomingBankReceipt/entry.ts");
  const reconcile = await Deno.readTextFile("base44/functions/reconcileBankTransfers/entry.ts");
  const sync = await Deno.readTextFile("base44/functions/syncPlaidTransferEvents/entry.ts");
  assert(store.includes("VANTAGE_LEDGER_DATABASE_URL") && !store.includes("AVCU_LEDGER_DATABASE_URL"), "ledger adapter must use only the Vantoris database secret");
  assert(receipt.includes("VANTAGE_ACH_CLEARING_LEDGER_ACCOUNT_ID") && !receipt.includes("AVCU_"), "incoming receipts must not read another institution's clearing account IDs");
  assert(reconcile.includes("VANTAGE_FEDWIRE_CLEARING_LEDGER_ACCOUNT_ID") && !reconcile.includes("AVCU_"), "reconciliation must use Vantoris-specific clearing configuration");
  assert(sync.includes("VANTAGE_INTERNAL_SYNC_SECRET") && !sync.includes("AVCU_"), "internal provider sync must use Vantoris-specific secret");
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
  assert(submit.includes("Deno.env.get('VANTAGE_PROVIDER_SUBMISSION_ENABLED') !== 'true'"), "provider submission must fail closed by default");
  assert(submit.includes("No bank request was sent"), "disabled provider submission must state that no bank request was sent");
  assert(readiness.includes("processing disabled"), "rail readiness page must not imply live processing");
});

Deno.test("member bank transfer form only offers active accounts with verified USD currency", async () => {
  const source = await Deno.readTextFile("src/pages/MoveMoney.jsx");
  const memberAuth = await Deno.readTextFile("netlify/functions/member-auth.mjs");
  assert(source.includes("accounts.filter(account => account.currency === 'USD' && account.account_type === 'member_liability' && account.memberStatus === 'active')"), "internal transfer form must filter to active verified USD member-liability accounts");
  assert(source.includes("No active account with a verified USD currency record"), "member must see why no eligible account is available");
  assert(memberAuth.includes("memberStatus: rows[0].status"), "eligibility status must originate from the authenticated server-side member record");
});

Deno.test("public brand uses Vantoris Private Institution and the arch-over-river identity", async () => {
  const landing = await Deno.readTextFile("src/pages/Landing.jsx");
  const logo = await Deno.readTextFile("src/components/vantoris/brand/VantorisLogo.jsx");
  const mark = await Deno.readTextFile("src/components/vantoris/brand/VantorisMonogram.jsx");
  const tribute = await Deno.readTextFile("src/components/vantoris/HambrosTribute.jsx");
  const html = await Deno.readTextFile("index.html");
  const brandIdentity = await Deno.readTextFile("src/pages/BrandIdentity.jsx");
  const appIcon = await Deno.readTextFile("src/components/vantoris/brand/VantorisAppIcon.jsx");
  assert(landing.includes("Vantoris Private Institution"), "public landing page must use approved Vantoris identity");
  assert(logo.includes("VANTORIS") && logo.includes("PRIVATE&nbsp;INSTITUTION"), "wordmark must use Vantoris Private Institution identity");
  assert(mark.includes("ARCH_PATH") && mark.includes("RIVER_PATH"), "logo mark must use arch-over-river direction");
  assert(brandIdentity.includes("VANTORIS") && brandIdentity.includes("Vantoris Private Institution"), "brand identity page must use the approved institution name");
  assert(appIcon.includes("Vantoris app icon"), "app icon accessibility name must use the approved institution identity");
  assert(tribute.includes("Vantoris Private Institution is focused on the United States"), "Hambros tribute must remain an independent historical corner");
  assert(html.includes("Vantoris Private Institution") && !html.includes("Vantage Private Investment"), "document metadata must use Vantoris identity");
});

Deno.test("member QR screen clearly reports that QR payments are unavailable", async () => {
  const source = await Deno.readTextFile("src/pages/MemberQR.jsx");
  assert(source.includes("A payment QR is not enabled"), "the QR screen must state its actual availability");
  assert(!source.includes("api.qrserver.com") && !source.includes("vantage://pay"), "member identifiers must not be sent to external QR services or legacy schemes");
});

Deno.test("Vantoris Intelligence is first-party, member-authenticated and informational only", async () => {
  const client = await Deno.readTextFile("src/lib/oracleAssistant.js");
  const adapter = await Deno.readTextFile("src/lib/privateLlm.js");
  const server = await Deno.readTextFile("netlify/functions/oracle.mjs");
  const legacyAsk = await Deno.readTextFile("netlify/functions/ask.mjs");
  const chat = await Deno.readTextFile("src/components/vantoris/AgentChat.jsx");
  assert(client.includes("fetch('/api/oracle'") && !client.includes("base44"), "browser assistant must call only the first-party Vantoris endpoint");
  assert(adapter.includes("askOracle") && !adapter.includes("base44"), "legacy assistant adapter must delegate to the Vantoris client");
  assert(server.includes("resolve_member_session") && server.includes("verify_auth_csrf"), "assistant requests must require a verified member session and CSRF");
  assert(server.includes("consume_member_assistant_request"), "assistant requests must use database-owned rate limits");
  assert(server.includes("VANTORIS_PRIVATE_LLM_URL") && server.includes("VANTORIS_PRIVATE_LLM_MODEL"), "only the configured Vantoris private model may be used");
  assert(legacyAsk.includes("import oracle from './oracle.mjs'") && !legacyAsk.includes("@base44/sdk"), "legacy ask route must remain a compatibility alias to the first-party endpoint");
  assert(!server.includes("@base44/sdk") && !server.includes("UPSTASH_"), "assistant server must not depend on Base44 or an external usage store");
  assert(!chat.includes("base44") && !chat.includes("executeElevatedCommand") && !chat.includes("inspectCommandInput"), "assistant UI must not access Base44 or execute privileged commands");
});

Deno.test("investment workspace does not invent unverified holdings or balances", async () => {
  const source = await Deno.readTextFile("src/pages/Investment.jsx");
  assert(source.includes("No investment balance is currently available"), "unverified holdings must remain explicitly unavailable");
  assert(source.includes("verified the underlying asset records"), "investment figures require verified underlying assets");
  assert(source.includes("No third-party portfolio figure is treated as a Vantoris balance"), "third-party portfolio totals must not be represented as institutional balances");
  assert(!/\$[0-9]|€[0-9]|£[0-9]/.test(source), "investment page must not contain fabricated balances");
});

Deno.test("transaction history preserves source currency and neutral direction", async () => {
  const source = await Deno.readTextFile("src/pages/Transactions.jsx");
  assert(source.includes("formatCurrency(presentation.amount, item.currency || item.currency_code || null)"), "transaction amounts must retain their source currency without a default");
  assert(source.includes("Status not supplied"), "missing transaction status must remain explicit");
  assert(source.includes("Date not supplied"), "missing transaction dates must remain explicit");
  assert(source.includes("transactionPresentation(decimalAmount, item.type)"), "unknown transaction direction must remain neutral");
  assert(source.includes("centsToDecimal(cents)"), "ledger cents must be converted without floating-point arithmetic");
});

Deno.test("card artwork does not claim payment-card issuance", async () => {
  const source = await Deno.readTextFile("src/components/vantoris/PrivateInvestmentCardGallery.jsx");
  assert(source.includes("Illustrative design artwork only"), "card artwork must be distinguished from issued payment cards");
  assert(source.includes("It does not represent an issued payment card"), "card artwork must not imply issuance");
  assert(!source.includes("VANTAGE"), "legacy Vantage branding must not remain on card artwork");
});

Deno.test("inventoried public, member and operations routes remain registered or behind the staff gate", async () => {
  const register = await Deno.readTextFile("docs/route-preservation-register.md");
  const app = await Deno.readTextFile("src/App.jsx");
  const inventoriedRoutes = [...register.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((match) => match[1]);
  const registeredRoutes = new Set([...app.matchAll(/<Route path="([^"]+)"/g)].map((match) => match[1]));
  assert(inventoriedRoutes.length >= 100, "route preservation register must retain the full public/member/operations inventory");
  for (const route of inventoriedRoutes) {
    const explicitlyRegistered = registeredRoutes.has(route);
    const coveredByOperationsGate = route.startsWith("/operations/") && registeredRoutes.has("/operations/*");
    assert(explicitlyRegistered || coveredByOperationsGate, `inventoried route must remain registered or covered by the staff authorization gate: ${route}`);
  }
});

