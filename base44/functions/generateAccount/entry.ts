import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ACCOUNT_CREATION_ROLES = new Set([
  'admin',
  'super_administrator',
  'administrator',
  'operations_manager',
]);

const ACCOUNT_TYPES = new Set([
  'Checking',
  'Savings',
  'Money Market',
  'CD',
  'Joint',
  'Business',
]);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!ACCOUNT_CREATION_ROLES.has(user.role)) {
      return Response.json({ error: 'Forbidden: account creation requires an authorized operator' }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'A valid JSON object is required' }, { status: 400 });
    }

    const { user_id, account_type, account_name, application_id } = body;
    if (typeof user_id !== 'string' || !user_id.trim() ||
        typeof application_id !== 'string' || !application_id.trim() ||
        typeof account_name !== 'string' || !account_name.trim() ||
        account_name.length > 120 ||
        !ACCOUNT_TYPES.has(account_type)) {
      return Response.json({
        error: 'A valid target user, application, account type, and account name are required',
      }, { status: 400 });
    }

    // The application must exist, belong to the target member, and already be approved.
    const application = await base44.asServiceRole.entities.Application.get(application_id);
    if (!application || application.user_id !== user_id ||
        application.application_status !== 'approved') {
      return Response.json({
        error: 'An approved application for this member is required',
      }, { status: 409 });
    }

    // Make retries safe: return the already-created account for this exact
    // approved application instead of reporting a misleading failure.
    const existingForApplication = await base44.asServiceRole.entities.Account.filter({
      application_id,
    });
    if (existingForApplication?.length) {
      const existing = existingForApplication[0];
      if (existing.user_id !== user_id || existing.application_id !== application_id) {
        return Response.json({ error: 'An account record conflicts with this application' }, { status: 409 });
      }
      return Response.json({
        success: true,
        already_created: true,
        account_id: existing.id,
        account_number: existing.account_number,
        account_type: existing.account_type,
        account_name: existing.account_name,
        balance: existing.balance ?? null,
        currency: existing.currency || null,
      });
    }

    // Opening balances are not accepted from callers. Funding requires a separate
    // authorized ledger/provider workflow and must never be created by this endpoint.
    // Base44 supports at most 5,000 records per list request. Read every
    // page (up to a safety ceiling) so accounts older than the first page are
    // included in the collision check.
    const existingNumbers = new Set<string>();
    const pageSize = 5000;
    const maximumScannedAccounts = 100000;
    let offset = 0;
    while (true) {
      const page = await base44.asServiceRole.entities.Account.list(
        '-created_date',
        pageSize,
        offset,
        ['account_number'],
      );
      if (!Array.isArray(page)) {
        return Response.json({
          error: 'Account-number records could not be verified; manual review is required',
        }, { status: 503 });
      }
      for (const record of page) {
        if (record.account_number) existingNumbers.add(record.account_number);
      }
      if (page.length < pageSize) break;
      offset += page.length;
      if (offset >= maximumScannedAccounts) {
        return Response.json({
          error: 'Account-number verification limit reached; manual review is required',
        }, { status: 503 });
      }
    }

    let accountNumber = '';
    for (let attempts = 0; attempts < 100; attempts++) {
      // BigInt preserves all 64 random bits; Number arithmetic would lose
      // integer precision when combining two Uint32 values.
      const random = new Uint32Array(2);
      crypto.getRandomValues(random);
      const random64 = (BigInt(random[0]) << 32n) | BigInt(random[1]);
      const candidate = (1000000000n + (random64 % 9000000000n)).toString();
      if (!existingNumbers.has(candidate)) {
        accountNumber = candidate;
        break;
      }
    }
    if (!accountNumber) {
      return Response.json({ error: 'Could not issue a unique account number; retry later' }, { status: 503 });
    }

    const account = await base44.asServiceRole.entities.Account.create({
      user_id,
      account_type,
      account_name: account_name.trim(),
      account_number: accountNumber,
      balance: 0,
      currency: 'USD',
      status: 'active',
      application_id,
    });

    // Account creation is already committed at this point. Treat notification
    // and audit writes as separate outcomes so a retry cannot obscure the
    // account's existence or cause an operator to attempt a duplicate opening.
    const followUpResults = await Promise.allSettled([
      base44.asServiceRole.entities.Notification.create({
        user_id,
        title: 'Account Opened',
        message: `Your ${account_type} account has been opened. Account ending in ${accountNumber.slice(-4)}.`,
        type: 'success',
      }),
      base44.asServiceRole.entities.AuditLog.create({
        action_type: 'account_created',
        description: `Account created for approved application ${application_id}`,
        details: `Account ending in ${accountNumber.slice(-4)}; opening balance: 0`,
        target_user_id: user_id,
        user_id: user.id,
        admin_name: user.full_name || user.email || 'Authorized operator',
      }),
    ]);
    const notificationRecorded = followUpResults[0].status === 'fulfilled';
    const auditRecorded = followUpResults[1].status === 'fulfilled';

    return Response.json({
      success: true,
      account_id: account.id,
      account_number: accountNumber,
      account_type,
      account_name: account_name.trim(),
      balance: 0,
      currency: 'USD',
      notification_recorded: notificationRecorded,
      audit_recorded: auditRecorded,
      follow_up_attention_required: !notificationRecorded || !auditRecorded,
    });
  } catch {
    return Response.json({ error: 'Account creation failed; no success can be confirmed' }, { status: 500 });
  }
});
