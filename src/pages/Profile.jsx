import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import DeleteAccountDialog from '@/components/vantoris/DeleteAccountDialog';
import ProfileHeader from '@/components/vantoris/profile/ProfileHeader';
import RelationshipOverview from '@/components/vantoris/profile/RelationshipOverview';
import ActionStrip from '@/components/vantoris/profile/ActionStrip';
import UnifiedTimeline from '@/components/vantoris/profile/UnifiedTimeline';
import DocumentsSection from '@/components/vantoris/profile/DocumentsSection';
import SecuritySection from '@/components/vantoris/profile/SecuritySection';
import SettingsSection from '@/components/vantoris/profile/SettingsSection';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [application, setApplication] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [heroProfile, setHeroProfile] = useState(null);
  const [heroRequests, setHeroRequests] = useState([]);
  const [heroActivities, setHeroActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [showDelete, setShowDelete] = useState(false);
  const [referralLink, setReferralLink] = useState('');
  const [phase, setPhase] = useState(0);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    // Phase 1: User + Application (immediate)
    const me = await base44.auth.me();
    if (me && me.role === 'user' && !me.referral_code) {
      const code = generateReferralCode(me.id);
      await base44.auth.updateMe({ referral_code: code });
      me.referral_code = code;
    }
    setUser(me);
    setReferralLink(`${window.location.origin}/register?ref=${me.referral_code || ''}`);

    const apps = await base44.entities.Application.filter({ user_id: me.id });
    setApplication(apps[0] || null);
    setPhase(1);

    // Phase 2: Products (accounts, herobox)
    const [accts, heroProfs, heroReqs] = await Promise.all([
      base44.entities.Account.filter({ user_id: me.id }),
      base44.entities.HeroBoxProfile.filter({ user_id: me.id }),
      base44.entities.HeroBoxRequest.filter({ user_id: me.id }),
    ]);
    setAccounts(accts);
    setHeroProfile(heroProfs[0] || null);
    setHeroRequests(heroReqs);
    setPhase(2);

    // Phase 3: Activity (transactions, hero activities, notifications, audit logs)
    const accountIds = accts.map(a => a.id);
    const txnPromises = accountIds.slice(0, 5).map(id =>
      base44.entities.Transaction.filter({ account_id: id }, '-created_date', 5)
    );
    const [txnResults, heroActs, notifs, auditEntries] = await Promise.all([
      Promise.all(txnPromises),
      base44.entities.HeroBoxActivity.filter({ user_id: me.id }, '-created_date', 10),
      base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 5),
      base44.entities.AuditLog.filter({ target_user_id: me.id }, '-created_date', 5).catch(() => []),
    ]);
    setTransactions(txnResults.flat());
    setHeroActivities(heroActs);
    setNotifications(notifs);
    setAuditLogs(auditEntries);
    setPhase(3);

    // Phase 4: Secondary (documents — lazy)
    const docs = await base44.entities.Document.filter({ user_id: me.id }).catch(() => []);
    setDocuments(docs);
    setPhase(4);
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const isMember = user.role === 'user';
  const hasAccounts = accounts.length > 0;
  const hasHeroBox = !!heroProfile;
  const hasDocuments = documents.length > 0;

  const totalAssets = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  const bankingTier = totalAssets >= 50000 ? 'Private Client'
    : totalAssets >= 10000 ? 'Premier'
    : totalAssets >= 1000 ? 'Preferred'
    : 'Member';

  const profileCompletion = [
    user.full_name ? 25 : 0,
    application?.kyc_status === 'approved' ? 25 : 0,
    hasAccounts ? 25 : 0,
    hasHeroBox ? 25 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="px-5 pt-6 pb-8">
      {/* 1. Profile Header — loads immediately */}
      <ProfileHeader
        user={user}
        application={application}
        profileCompletion={profileCompletion}
        bankingTier={bankingTier}
      />

      {/* 2. Relationship Overview — premium product cards */}
      {phase >= 2 && (
        <RelationshipOverview
          accounts={accounts}
          heroProfile={heroProfile}
          heroRequests={heroRequests}
        />
      )}

      {/* 3. Action Strip — embedded beneath account summary, context-aware */}
      {phase >= 2 && (
        <ActionStrip
          hasAccounts={hasAccounts}
          hasHeroBox={hasHeroBox}
          isMember={isMember}
          hasDocuments={hasDocuments}
        />
      )}

      {/* 4. Activity Timeline — unified, progressive */}
      {phase >= 3 && (
        <UnifiedTimeline
          transactions={transactions}
          heroActivities={heroActivities}
          notifications={notifications}
          auditLogs={auditLogs}
        />
      )}

      {/* 5. Documents — only if they exist */}
      {phase >= 4 && <DocumentsSection documents={documents} />}

      {/* 6. Security & Verification */}
      {phase >= 3 && (
        <SecuritySection
          application={application}
          auditLogs={auditLogs}
          notifications={notifications}
        />
      )}

      {/* 7. Settings — at the bottom */}
      <SettingsSection
        user={user}
        referralLink={referralLink}
        onDeleteAccount={() => setShowDelete(true)}
      />

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center">
        <ShieldLogo size={28} className="mb-2 opacity-40" />
        <p className="text-gray/40 text-[10px] tracking-widest uppercase">Secure. Trusted. Tailored for you.</p>
      </div>
    </div>
  );
}

function generateReferralCode(userId) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}