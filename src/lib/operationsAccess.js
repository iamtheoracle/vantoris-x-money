// ============================================================
// VANTORIS — Definitive Administrator Permission Matrix
// ============================================================
// SOURCE OF TRUTH for all administrator authorization.
//
// HIERARCHY:
//   SUPER ADMINISTRATOR
//       ├── Management (Operations + KYC + Compliance)
//       ├── Support
//       ├── HeroBox
//       └── Investment
//
// PRINCIPLES:
//   - Domain access ≠ full authority. Capability-level checks required.
//   - view ≠ approve. Financially consequential actions need explicit
//     approval capabilities.
//   - Super Administrator-exclusive capabilities (system.*) require
//     Exception Authentication via the existing exception-authentication secret.
//   - Frontend checks are a first line of defense, NOT a replacement for
//     server-side enforcement. Protected operations fail closed when
//     backend enforcement is unavailable.
// ============================================================

// ============================================================
// §1  CAPABILITY REGISTRY  (machine-readable source of truth)
// ============================================================
// Each capability has: domain, label, category, and flags.
// superAdminExclusive = true  → requires Exception Authentication.
// financiallyConsequential = true → explicit approval capability (view ≠ approve).

export const CAPABILITY_REGISTRY = {
  // ---- Management · Customers ----
  'management.customers.view':      { domain: 'management', category: 'Customers',  label: 'View customer profiles and account information' },
  'management.customers.manage':    { domain: 'management', category: 'Customers',  label: 'Manage permitted customer operational issues' },
  'management.customers.escalate': { domain: 'management', category: 'Customers',  label: 'Escalate customer issues' },

  // ---- Management · Operations ----
  'management.operations.view':              { domain: 'management', category: 'Operations', label: 'View operational dashboards and transactions' },
  'management.operations.manage':             { domain: 'management', category: 'Operations', label: 'Manage operational workflows' },
  'management.operations.review':             { domain: 'management', category: 'Operations', label: 'Review transactions, exceptions, and discrepancies' },
  'management.operations.correct':            { domain: 'management', category: 'Operations', label: 'Permitted operational corrections', financiallyConsequential: true },
  'management.operations.withdrawals.approve':{ domain: 'management', category: 'Operations', label: 'Approve ordinary banking withdrawal requests', financiallyConsequential: true },
  'management.operations.adjustments.manage': { domain: 'management', category: 'Operations', label: 'Correct balances and transaction records', financiallyConsequential: true },

  // ---- Management · KYC ----
  'management.kyc.view':     { domain: 'management', category: 'KYC', label: 'Review KYC applications and identity documents' },
  'management.kyc.review':   { domain: 'management', category: 'KYC', label: 'Review ID front/back and verification status' },
  'management.kyc.approve':  { domain: 'management', category: 'KYC', label: 'Approve or reject KYC', financiallyConsequential: true },
  'management.kyc.escalate': { domain: 'management', category: 'KYC', label: 'Escalate suspicious or incomplete KYC cases' },

  // ---- Management · Compliance ----
  'management.compliance.view':     { domain: 'management', category: 'Compliance', label: 'Review compliance cases and flags' },
  'management.compliance.manage':   { domain: 'management', category: 'Compliance', label: 'Manage compliance workflows' },
  'management.compliance.escalate': { domain: 'management', category: 'Compliance', label: 'Escalate compliance cases' },

  // ---- Support ----
  'support.customers.view':        { domain: 'support', category: 'Support', label: 'View customer profiles necessary for support' },
  'support.cases.view':            { domain: 'support', category: 'Support', label: 'View support cases' },
  'support.cases.manage':          { domain: 'support', category: 'Support', label: 'Create and update support cases' },
  'support.communication.manage':  { domain: 'support', category: 'Support', label: 'Communicate with customers' },
  'support.escalate':              { domain: 'support', category: 'Support', label: 'Escalate KYC/compliance/operations issues to Management' },

  // ---- HeroBox ----
  'herobox.catalog.view':        { domain: 'herobox', category: 'Catalog',      label: 'View HeroBox products and categories' },
  'herobox.catalog.manage':      { domain: 'herobox', category: 'Catalog',      label: 'Manage products, categories, packages, and availability' },
  'herobox.orders.view':         { domain: 'herobox', category: 'Orders',       label: 'Review HeroBox orders and recipients' },
  'herobox.orders.manage':       { domain: 'herobox', category: 'Orders',       label: 'Manage order states' },
  'herobox.fulfillment.manage':  { domain: 'herobox', category: 'Fulfillment',  label: 'Manage packing, shipping, and delivery' },
  'herobox.refunds.manage':      { domain: 'herobox', category: 'Refunds',      label: 'Process permitted refunds', financiallyConsequential: true },
  'herobox.destinations.manage': { domain: 'herobox', category: 'Destinations', label: 'Manage verified organizations and support destinations' },

  // ---- Investment ----
  'investment.portfolios.view':     { domain: 'investment', category: 'Portfolios',  label: 'View investment portfolios' },
  'investment.transactions.view':   { domain: 'investment', category: 'Transactions', label: 'View investment transactions' },
  'investment.deposits.review':     { domain: 'investment', category: 'Deposits',    label: 'Review investment deposit requests' },
  'investment.deposits.approve':    { domain: 'investment', category: 'Deposits',    label: 'Approve investment deposit requests', financiallyConsequential: true },
  'investment.withdrawals.review': { domain: 'investment', category: 'Withdrawals', label: 'Review investment withdrawal requests' },
  'investment.withdrawals.approve':{ domain: 'investment', category: 'Withdrawals', label: 'Approve investment withdrawal requests', financiallyConsequential: true },
  'investment.signals.manage':     { domain: 'investment', category: 'Signals',     label: 'Manage investment signals' },
  'investment.escalate':           { domain: 'investment', category: 'Investment',  label: 'Escalate compliance/security issues to Management' },

  // ---- Administrator Management ----
  'admin.users.view':         { domain: 'system', category: 'Admin Users', label: 'View administrator accounts', superAdminExclusive: true },
  'admin.users.create':       { domain: 'system', category: 'Admin Users', label: 'Create administrator accounts', superAdminExclusive: true },
  'admin.users.deactivate':   { domain: 'system', category: 'Admin Users', label: 'Deactivate administrator accounts', superAdminExclusive: true },
  'admin.permissions.view':   { domain: 'system', category: 'Admin Users', label: 'View administrator permissions', superAdminExclusive: true },
  'admin.permissions.modify': { domain: 'system', category: 'Admin Users', label: 'Modify administrator capabilities', superAdminExclusive: true },

  // ---- System (Super Administrator-exclusive — require Exception Authentication) ----
  'system.apis.manage':           { domain: 'system', category: 'System', label: 'Add, remove, or modify APIs', superAdminExclusive: true },
  'system.integrations.manage':   { domain: 'system', category: 'System', label: 'Manage protected integrations and providers', superAdminExclusive: true },
  'system.ai.manage':              { domain: 'system', category: 'System', label: 'Modify protected AI/LLM and Vantoris Assistant configuration', superAdminExclusive: true },
  'system.security.manage':        { domain: 'system', category: 'System', label: 'Modify security architecture', superAdminExclusive: true },
  'system.architecture.manage':    { domain: 'system', category: 'System', label: 'Modify authorization and Command architecture', superAdminExclusive: true },
  'system.application.modify':     { domain: 'system', category: 'System', label: 'Modify protected application functionality', superAdminExclusive: true },
  'system.data.modify':            { domain: 'system', category: 'System', label: 'Modify protected data and system configuration', superAdminExclusive: true },
};

// ============================================================
// §2  SUPER ADMINISTRATOR
// ============================================================

export const SUPER_ADMIN_EMAIL = 'itsandrewjack@gmail.com';

export function isSuperAdmin(user) {
  if (!user) return false;
  return user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || user.role === 'super_administrator';
}

// ============================================================
// §3  FOUR OPERATIONAL DOMAINS
// ============================================================

export const DOMAINS = {
  management: 'Management',
  support: 'Support',
  herobox: 'HeroBox',
  investment: 'Investment',
};

// ============================================================
// §4  ROLE → CAPABILITY MAPPING
// ============================================================
// Super Administrator: '*' (all capabilities, including system.*).
// Ordinary roles: explicit arrays of capability IDs.
// Existing roles are mapped to preserve their current authority.

const ROLE_CAPABILITIES = {
  // ---- Super Administrator ----
  super_administrator: '*',

  // ---- Management domain ----
  admin: [
    'management.customers.view', 'management.customers.manage', 'management.customers.escalate',
    'management.operations.view', 'management.operations.manage', 'management.operations.review',
    'management.operations.correct', 'management.operations.withdrawals.approve', 'management.operations.adjustments.manage',
    'management.kyc.view', 'management.kyc.review', 'management.kyc.approve', 'management.kyc.escalate',
    'management.compliance.view', 'management.compliance.manage', 'management.compliance.escalate',
  ],
  administrator: [
    'management.customers.view', 'management.customers.manage', 'management.customers.escalate',
    'management.operations.view', 'management.operations.manage', 'management.operations.review',
    'management.operations.correct', 'management.operations.withdrawals.approve', 'management.operations.adjustments.manage',
    'management.kyc.view', 'management.kyc.review', 'management.kyc.approve', 'management.kyc.escalate',
    'management.compliance.view', 'management.compliance.manage', 'management.compliance.escalate',
  ],
  executive: [
    'management.customers.view', 'management.customers.manage', 'management.customers.escalate',
    'management.operations.view', 'management.operations.manage', 'management.operations.review',
    'management.operations.correct', 'management.operations.withdrawals.approve', 'management.operations.adjustments.manage',
    'management.kyc.view', 'management.kyc.review', 'management.kyc.approve', 'management.kyc.escalate',
    'management.compliance.view', 'management.compliance.manage', 'management.compliance.escalate',
  ],
  operations_manager: [
    'management.customers.view', 'management.customers.manage',
    'management.operations.view', 'management.operations.manage', 'management.operations.review',
    'management.operations.correct', 'management.operations.withdrawals.approve',
  ],
  operations_officer: [
    'management.operations.view', 'management.operations.review',
    'management.operations.withdrawals.approve',
  ],
  finance_officer: [
    'management.operations.view', 'management.operations.review',
    'management.operations.withdrawals.approve',
  ],
  treasury_officer: [
    'management.operations.view', 'management.operations.review',
    'management.operations.withdrawals.approve', 'management.operations.adjustments.manage',
  ],
  compliance_officer: [
    'management.compliance.view', 'management.compliance.manage', 'management.compliance.escalate',
    'management.kyc.view', 'management.kyc.review', 'management.kyc.escalate',
  ],
  kyc_officer: [
    'management.kyc.view', 'management.kyc.review', 'management.kyc.approve', 'management.kyc.escalate',
  ],
  auditor: [
    'management.operations.view', 'management.operations.review',
    'management.kyc.view', 'management.kyc.review',
    'management.compliance.view',
  ],
  it_administrator: [
    'management.operations.view', 'management.operations.manage',
  ],
  risk_officer: [
    'management.operations.view', 'management.compliance.view',
  ],

  // ---- Support domain ----
  customer_support: [
    'support.customers.view', 'support.cases.view', 'support.cases.manage',
    'support.communication.manage', 'support.escalate',
  ],

  // ---- HeroBox domain ----
  herobox_manager: [
    'herobox.catalog.view', 'herobox.catalog.manage',
    'herobox.orders.view', 'herobox.orders.manage',
    'herobox.fulfillment.manage', 'herobox.refunds.manage', 'herobox.destinations.manage',
  ],
  volunteer_manager: [
    'herobox.catalog.view', 'herobox.orders.view',
    'herobox.destinations.manage',
  ],
  shipping_manager: [
    'herobox.orders.view', 'herobox.orders.manage', 'herobox.fulfillment.manage',
  ],

  // ---- Investment domain ----
  investment_manager: [
    'investment.portfolios.view', 'investment.transactions.view',
    'investment.deposits.review', 'investment.deposits.approve',
    'investment.withdrawals.review', 'investment.withdrawals.approve',
    'investment.signals.manage', 'investment.escalate',
  ],
  investment_officer: [
    'investment.portfolios.view', 'investment.transactions.view',
    'investment.deposits.review', 'investment.withdrawals.review',
    'investment.escalate',
  ],
};

// ============================================================
// §5  CORE PERMISSION CHECKS  (new capability-ID based)
// ============================================================

// Returns the full set of capability IDs for a role.
// Super Administrator: all capabilities in the registry.
export function getRoleCapabilities(role) {
  if (role === 'super_administrator') return Object.keys(CAPABILITY_REGISTRY);
  const caps = ROLE_CAPABILITIES[role];
  return caps === '*' ? Object.keys(CAPABILITY_REGISTRY) : (caps || []);
}

// Check if a role has a specific capability by its dotted ID.
// e.g. hasCapabilityById('admin', 'management.kyc.approve')
export function hasCapabilityById(role, capabilityId) {
  if (role === 'super_administrator') return true;
  const caps = getRoleCapabilities(role);
  return caps.includes(capabilityId);
}

// Check if a user object has a capability (resolves role from user).
export function userHasCapability(user, capabilityId) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return hasCapabilityById(user.role, capabilityId);
}

// Does this capability require Super Administrator Exception Authentication?
export function isSuperAdminExclusiveCapability(capabilityId) {
  const cap = CAPABILITY_REGISTRY[capabilityId];
  return !!(cap && cap.superAdminExclusive);
}

// Is this capability financially consequential (needs explicit approval cap)?
export function isFinanciallyConsequential(capabilityId) {
  const cap = CAPABILITY_REGISTRY[capabilityId];
  return !!(cap && cap.financiallyConsequential);
}

// Map a system.* capability to the Exception Authentication action key.
export const CAPABILITY_TO_EXCEPTION_ACTION = {
  'system.apis.manage':            'modify_api_config',
  'system.integrations.manage':    'change_integration_architecture',
  'system.ai.manage':              'change_ai_config',
  'system.security.manage':       'change_security_rules',
  'system.architecture.manage':    'change_authorization_architecture',
  'system.application.modify':     'edit_core_functionality',
  'system.data.modify':            'modify_protected_config',
  'admin.users.create':            'create_privileged_roles',
  'admin.users.deactivate':        'disable_admin_beyond_normal',
  'admin.permissions.modify':      'change_role_definitions',
};

export function getExceptionActionForCapability(capabilityId) {
  return CAPABILITY_TO_EXCEPTION_ACTION[capabilityId] || null;
}

export function requiresExceptionAuthForCapability(capabilityId) {
  return Object.prototype.hasOwnProperty.call(CAPABILITY_TO_EXCEPTION_ACTION, capabilityId);
}

// ============================================================
// §6  DOMAIN-LEVEL CHECKS
// ============================================================

export function getDomainsForRole(role) {
  if (role === 'super_administrator') return ['management', 'support', 'herobox', 'investment'];
  const caps = getRoleCapabilities(role);
  const domains = new Set();
  for (const capId of caps) {
    const entry = CAPABILITY_REGISTRY[capId];
    if (entry) domains.add(entry.domain);
  }
  // Map system-domain capabilities to management for domain-access purposes
  if (domains.has('system')) domains.add('management');
  return Array.from(domains);
}

export function hasDomainAccess(role, domain) {
  if (role === 'super_administrator') return true;
  return getDomainsForRole(role).includes(domain);
}

// ============================================================
// §7  BACKWARD-COMPATIBLE CAPABILITY CHECKS
// ============================================================
// Maps old-style domain+capability keys to the new granular model.
// Existing pages call hasCapability(role, 'management', 'operations') etc.

const LEGACY_CAPABILITY_MAP = {
  // Management
  operations: [
    'management.operations.view', 'management.operations.manage', 'management.operations.review',
    'management.operations.correct', 'management.operations.withdrawals.approve',
    'management.operations.adjustments.manage',
  ],
  kyc_compliance: [
    'management.kyc.view', 'management.kyc.review', 'management.kyc.approve', 'management.kyc.escalate',
    'management.compliance.view', 'management.compliance.manage', 'management.compliance.escalate',
  ],
  customer_accounts: [
    'management.customers.view', 'management.customers.manage', 'management.customers.escalate',
  ],
  security: [
    'management.compliance.view',
  ],
  system_admin: [
    'management.operations.view', 'management.operations.manage',
  ],
  administration: [
    'admin.users.view', 'admin.permissions.view',
  ],
  // Support
  customer_support: [
    'support.customers.view', 'support.cases.view', 'support.cases.manage',
    'support.communication.manage', 'support.escalate',
  ],
  // HeroBox
  catalog: ['herobox.catalog.view', 'herobox.catalog.manage'],
  orders: ['herobox.orders.view', 'herobox.orders.manage'],
  shipping: ['herobox.fulfillment.manage'],
  herobox_operations: ['herobox.destinations.manage'],
  // Investment
  portfolio_operations: ['investment.portfolios.view', 'investment.transactions.view'],
  deposits: ['investment.deposits.review', 'investment.deposits.approve'],
  withdrawals: ['investment.withdrawals.review', 'investment.withdrawals.approve'],
  investment_products: ['investment.portfolios.view'],
  signals: ['investment.signals.manage'],
  investment_operations: ['investment.portfolios.view', 'investment.transactions.view'],
};

// Old-style: hasCapability(role, domain, oldCapabilityKey)
// Returns true if the role has ANY of the mapped new capabilities.
export function hasCapability(role, domain, legacyCapability) {
  if (role === 'super_administrator') return true;
  const mapped = LEGACY_CAPABILITY_MAP[legacyCapability];
  if (!mapped) return false;
  const roleCaps = getRoleCapabilities(role);
  return mapped.some((capId) => roleCaps.includes(capId));
}

// Old-style: getCapabilitiesForRole(role, domain)
// Returns old-style capability keys that the role possesses.
export function getCapabilitiesForRole(role, domain) {
  if (role === 'super_administrator') return 'all';
  const roleCaps = getRoleCapabilities(role);
  if (roleCaps === '*') return 'all';
  // Return old-style keys whose mapped new caps overlap with the role's caps
  const result = [];
  for (const [oldKey, mapped] of Object.entries(LEGACY_CAPABILITY_MAP)) {
    if (mapped.some((capId) => roleCaps.includes(capId))) {
      // Check if this old key belongs to the requested domain
      const sampleCap = CAPABILITY_REGISTRY[mapped[0]];
      if (sampleCap && (sampleCap.domain === domain || (sampleCap.domain === 'system' && domain === 'management'))) {
        result.push(oldKey);
      }
    }
  }
  return result;
}

// ============================================================
// §8  DOMAIN CAPABILITIES (for display/UI — backward compat)
// ============================================================

export const DOMAIN_CAPABILITIES = {
  management: {
    operations: 'Operations — applications, accounts, transactions, statements, historical data',
    kyc: 'KYC — identity review, ID verification, KYC approval',
    compliance: 'Compliance — compliance cases, flags, workflows',
    customer_accounts: 'Customer & Account Management — profiles, account records',
    administration: 'Administration — admin accounts, roles, permissions, audit logs',
  },
  support: {
    customer_support: 'Customer Support — conversations, escalations, case management',
  },
  herobox: {
    catalog: 'Catalog — products, categories, packages',
    orders: 'Orders — order management, fulfillment',
    fulfillment: 'Fulfillment — packing, shipping, delivery',
    destinations: 'Destinations — verified organizations, support destinations',
  },
  investment: {
    portfolios: 'Portfolios — portfolio and position management',
    deposits: 'Deposits — review and approve investment deposit requests',
    withdrawals: 'Withdrawals — review and approve investment withdrawal requests',
    signals: 'Signals — manage investment signals',
  },
};

// ============================================================
// §9  CONVENIENCE HELPERS (backward compatible)
// ============================================================
// These map to the new granular capabilities. Financially consequential
// actions (approvals) use explicit approval capabilities, not view.

export function canManageAdmins(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'admin.users.view');
}

export function canManageSecurity(role) {
  if (role === 'super_administrator') return true;
  // Only Super Administrator can modify security architecture (system.security.manage)
  // Ordinary management can view compliance, not modify security architecture
  return false;
}

export function canManageSystemConfig(role) {
  if (role === 'super_administrator') return true;
  // Only Super Administrator can manage system config (system.* capabilities)
  return false;
}

export function canApproveKYC(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'management.kyc.approve');
}

export function canReviewKYC(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'management.kyc.view') || hasCapabilityById(role, 'management.kyc.review');
}

export function canApproveAccounts(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'management.operations.manage');
}

export function canApproveWithdrawals(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'management.operations.withdrawals.approve');
}

export function canManageHeroBoxCatalog(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'herobox.catalog.manage');
}

export function canManageHeroBoxOrders(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'herobox.orders.manage');
}

export function canManageHeroBoxFulfillment(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'herobox.fulfillment.manage');
}

export function canManageHeroBoxRefunds(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'herobox.refunds.manage');
}

export function canReviewInvestmentDeposits(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'investment.deposits.review');
}

export function canApproveInvestmentDeposits(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'investment.deposits.approve');
}

export function canReviewInvestmentWithdrawals(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'investment.withdrawals.review');
}

export function canApproveInvestmentWithdrawals(role) {
  if (role === 'super_administrator') return true;
  return hasCapabilityById(role, 'investment.withdrawals.approve');
}

// Backward compat aliases
export function canManageInvestmentDeposits(role) {
  return canReviewInvestmentDeposits(role);
}

export function canManageInvestmentWithdrawals(role) {
  return canReviewInvestmentWithdrawals(role);
}

export function canUseUltimateCommand(user) {
  return isSuperAdmin(user);
}

// ============================================================
// §10  OPERATOR GROUPS  (backward compat)
// ============================================================

export function getOperatorGroup(role) {
  if (role === 'super_administrator') return 'management';
  const domains = getDomainsForRole(role);
  if (domains.includes('management')) return 'management';
  if (domains.includes('support')) return 'support';
  if (domains.includes('herobox')) return 'herobox';
  if (domains.includes('investment')) return 'investment';
  return null;
}

export function isManagementOperator(role) {
  return getDomainsForRole(role).includes('management');
}

export function isCustomerSupportOperator(role) {
  return getDomainsForRole(role).includes('support');
}

export function isHeroBoxOperator(role) {
  return getDomainsForRole(role).includes('herobox');
}

export function isInvestmentOperator(role) {
  return getDomainsForRole(role).includes('investment');
}

// ============================================================
// §11  LEGACY ROLE-LIST COMPAT
// ============================================================

const OPERATIONS_ROLES = [
  'admin', 'operations_officer', 'finance_officer', 'compliance_officer',
  'executive', 'administrator', 'super_administrator', 'customer_support',
  'kyc_officer', 'operations_manager', 'treasury_officer', 'auditor',
  'it_administrator', 'risk_officer', 'herobox_manager', 'volunteer_manager',
  'shipping_manager', 'investment_manager', 'investment_officer',
];

export function hasOperationsAccess(role) {
  return OPERATIONS_ROLES.includes(role);
}

export function isOperationsRole(role) {
  return OPERATIONS_ROLES.includes(role) && role !== 'admin';
}

export function getRoleLabel(role) {
  const labels = {
    user: 'Member',
    operations_officer: 'Operations Officer',
    finance_officer: 'Finance Officer',
    compliance_officer: 'Compliance Officer',
    executive: 'Executive',
    administrator: 'Administrator',
    super_administrator: 'Super Administrator',
    admin: 'Administrator',
    customer_support: 'Customer Support',
    kyc_officer: 'KYC Officer',
    operations_manager: 'Operations Manager',
    treasury_officer: 'Treasury Officer',
    auditor: 'Auditor',
    it_administrator: 'IT Administrator',
    risk_officer: 'Risk Officer',
    herobox_manager: 'HeroBox Manager',
    volunteer_manager: 'Volunteer Manager',
    shipping_manager: 'Shipping Manager',
    investment_manager: 'Investment Manager',
    investment_officer: 'Investment Officer',
  };
  return labels[role] || 'Member';
}

// ============================================================
// §12  WORKSPACE COMPAT
// ============================================================

export const WORKSPACE_LABELS = {
  management: 'Management',
  support: 'Support',
  herobox: 'HeroBox',
  investment: 'Investment',
  // Legacy aliases
  executive: 'Management',
  operations: 'Management',
  security: 'Management',
};

export const WORKSPACE_ICONS = {
  management: 'Briefcase',
  support: 'Headphones',
  herobox: 'Radar',
  investment: 'TrendingUp',
};

export function getWorkspacesForRole(role) {
  return getDomainsForRole(role);
}

export function hasWorkspaceAccess(role, workspace) {
  const domainMap = { executive: 'management', operations: 'management', security: 'management' };
  const domain = domainMap[workspace] || workspace;
  return hasDomainAccess(role, domain);
}

export function getDefaultWorkspace(role) {
  const domains = getDomainsForRole(role);
  if (domains.length === 0) return null;
  if (domains.includes('management')) return 'management';
  return domains[0];
}

// ============================================================
// §13  PERMISSION MATRIX EXPORT  (machine-readable)
// ============================================================

export function getPermissionMatrix() {
  const matrix = {};
  for (const role of Object.keys(ROLE_CAPABILITIES)) {
    matrix[role] = {
      domains: getDomainsForRole(role),
      capabilities: getRoleCapabilities(role),
      isSuperAdmin: role === 'super_administrator',
    };
  }
  return matrix;
}

// Get all capabilities for a domain (for UI display / filtering)
export function getCapabilitiesByDomain(domain) {
  return Object.entries(CAPABILITY_REGISTRY)
    .filter(([, info]) => info.domain === domain || (domain === 'management' && info.domain === 'system' && !info.superAdminExclusive))
    .map(([id, info]) => ({ id, ...info }));
}

// Get all financially consequential capabilities
export function getFinanciallyConsequentialCapabilities() {
  return Object.entries(CAPABILITY_REGISTRY)
    .filter(([, info]) => info.financiallyConsequential)
    .map(([id, info]) => ({ id, ...info }));
}

// Get all Super Administrator-exclusive capabilities
export function getSuperAdminExclusiveCapabilities() {
  return Object.entries(CAPABILITY_REGISTRY)
    .filter(([, info]) => info.superAdminExclusive)
    .map(([id, info]) => ({ id, ...info }));
}