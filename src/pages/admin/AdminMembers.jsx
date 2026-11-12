import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Download, StickyNote, UserPlus, Trash2, History, AlertTriangle } from 'lucide-react';
import MemberActivityFeed from '@/components/vantoris/MemberActivityFeed';
import { exportToCsv } from '@/lib/exportCsv';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InviteUserDialog from '@/components/vantoris/InviteUserDialog';

function maskAccountNumber(value) {
  if (!value) return 'Not supplied';
  const digits = String(value).replace(/\s/g, '');
  return digits.length > 4 ? '•••• ' + digits.slice(-4) : '••••';
}

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [accountsError, setAccountsError] = useState(false);
  const [referralsError, setReferralsError] = useState(false);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [activityMember, setActivityMember] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    const [userResult, accountResult, referralResult] = await Promise.all([
      safeList(base44.entities.User.list('-created_date', 50)),
      safeList(base44.entities.Account.list('-created_date', 50)),
      safeList(base44.entities.Referral.list('-created_date', 200)),
    ]);
    setUsers(userResult.rows);
    setAccounts(accountResult.rows);
    setReferrals(referralResult.rows);
    setLoadError(userResult.failed);
    setAccountsError(accountResult.failed);
    setReferralsError(referralResult.failed);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const members = useMemo(() => users.filter((user) => user.role === 'user'), [users]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => (member.full_name || '').toLowerCase().includes(query) || (member.email || '').toLowerCase().includes(query));
  }, [members, search]);

  const referrerMap = useMemo(() => {
    const map = {};
    referrals.forEach((referral) => { if (referral.referred_id) map[referral.referred_id] = referral.referrer_id; });
    return map;
  }, [referrals]);

  const getReferrerName = (userId) => {
    if (referralsError) return 'Referrer data unavailable';
    const referrerId = referrerMap[userId];
    if (!referrerId) return '—';
    return users.find((user) => user.id === referrerId)?.full_name || 'Referrer record not returned';
  };

  function handleExportMembers() {
    const headers = ['Member Name', 'Email', 'Account Records Returned', 'Account Type', 'Account Number (masked)', 'Account Name', 'Account Status', 'Joined'];
    const rows = [];
    for (const member of members) {
      const memberAccounts = accounts.filter((account) => account.user_id === member.id);
      if (memberAccounts.length === 0) {
        rows.push({
          'Member Name': member.full_name || '',
          Email: member.email || '',
          'Account Records Returned': accountsError ? 'Unavailable' : 0,
          'Account Type': '—',
          'Account Number (masked)': '—',
          'Account Name': '—',
          'Account Status': '—',
          Joined: dateLabel(member.created_date),
        });
      } else {
        for (const account of memberAccounts) {
          rows.push({
            'Member Name': member.full_name || '',
            Email: member.email || '',
            'Account Records Returned': memberAccounts.length,
            'Account Type': account.account_type || 'Not supplied',
            'Account Number (masked)': maskAccountNumber(account.account_number),
            'Account Name': account.account_name || 'Not supplied',
            'Account Status': account.status || 'Not supplied',
            Joined: dateLabel(member.created_date),
          });
        }
      }
    }
    exportToCsv('vantoris_member_records', headers, rows);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-brass">Vantoris Private Institution</p>
          <h1 className="mb-1 text-2xl font-bold text-white">Members</h1>
          <p className="text-sm text-[#AAB4C3]">{loadError ? 'Member records unavailable' : members.length + ' member records returned · query limit 50'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 rounded-xl bg-brass px-4 py-3 text-xs font-semibold text-[#0E1A2B]">
            <UserPlus size={14} /> Invite
          </button>
          <button type="button" onClick={handleExportMembers} disabled={loadError} className="flex items-center gap-1.5 rounded-xl bg-olive/15 px-4 py-3 text-xs font-medium text-emerald-400 disabled:opacity-40">
            <Download size={14} /> Export records
          </button>
        </div>
      </div>

      <div role="status" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-800" />
        <p className="text-xs leading-5 text-amber-950">
          This workspace is read-only for privileged member changes. Account issuance, opening balances, internal notes, member deletion, and role changes require verified server-side authorization and audit workflows. No cross-currency member balance totals are calculated; exported account numbers are masked.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members…" className="w-full rounded-xl border border-[#242D38] bg-[#242D38] py-3 pl-10 pr-4 text-sm text-white focus:border-brass/50 focus:outline-none" />
        </div>
        <p className="text-xs text-[#AAB4C3]">{accountsError ? 'Account records unavailable' : accounts.length + ' account records returned · query limit 50 overall'}</p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Member records could not be retrieved. This is not confirmation that no members exist.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-[#242D38] bg-[#101C2C] md:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Referred by</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Account records</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#AAB4C3]">Review</th>
              </tr></thead>
              <tbody>
                {filtered.map((member) => {
                  const memberAccounts = accounts.filter((account) => account.user_id === member.id);
                  return (
                    <tr key={member.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15"><span className="text-xs font-bold text-brass">{(member.full_name || 'U').charAt(0)}</span></div><span className="font-medium text-white">{member.full_name || 'Name not supplied'}</span></div></td>
                      <td className="px-5 py-4 text-[#AAB4C3]">{member.email || 'Email not supplied'}</td>
                      <td className="px-5 py-4 text-xs text-brass">{getReferrerName(member.id)}</td>
                      <td className="px-5 py-4 text-white">{accountsError ? 'Unavailable' : memberAccounts.length}</td>
                      <td className="px-5 py-4 text-xs text-[#AAB4C3]">{dateLabel(member.created_date)}</td>
                      <td className="px-5 py-4"><div className="flex flex-wrap items-center gap-2">
                        <button type="button" disabled title="Account issuance requires a server-side ledger workflow" className="flex items-center gap-1 rounded-lg bg-[#242D38] px-3 py-1.5 text-xs text-[#AAB4C3]/50"><Plus size={12} /> Add account unavailable</button>
                        <button type="button" disabled title="Internal notes require an audited server-side workflow" className="flex items-center gap-1 rounded-lg bg-[#242D38] px-3 py-1.5 text-xs text-[#AAB4C3]/50"><StickyNote size={12} /> Notes unavailable</button>
                        <button type="button" onClick={() => setActivityMember(member)} className="flex items-center gap-1 rounded-lg bg-[#242D38] px-3 py-1.5 text-xs text-[#AAB4C3] hover:text-white"><History size={12} /> Activity</button>
                        <button type="button" disabled title="Member deletion requires an audited lifecycle workflow" className="rounded-lg bg-crimson/10 p-1.5 text-red-400/40"><Trash2 size={14} /></button>
                      </div></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No member records matched this search.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((member) => {
              const memberAccounts = accounts.filter((account) => account.user_id === member.id);
              return (
                <article key={member.id} className="vantoris-card space-y-3 p-4">
                  <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-brass/15"><span className="text-xs font-bold text-brass">{(member.full_name || 'U').charAt(0)}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{member.full_name || 'Name not supplied'}</p><p className="truncate text-xs text-[#AAB4C3]">{member.email || 'Email not supplied'}</p></div></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-[#AAB4C3]">Account records returned</span><span className="font-medium text-white">{accountsError ? 'Unavailable' : memberAccounts.length}</span></div>
                  <p className="text-xs text-[#AAB4C3]">Joined {dateLabel(member.created_date)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled className="rounded-lg bg-[#242D38] px-3 py-2 text-xs text-[#AAB4C3]/50">Add account unavailable</button>
                    <button type="button" disabled className="rounded-lg bg-[#242D38] px-3 py-2 text-xs text-[#AAB4C3]/50">Notes unavailable</button>
                    <button type="button" onClick={() => setActivityMember(member)} className="flex items-center gap-1 rounded-lg bg-[#242D38] px-3 py-2 text-xs text-[#AAB4C3]"><History size={12} /> Activity</button>
                    <button type="button" disabled className="rounded-lg bg-crimson/10 px-3 py-2 text-xs text-red-400/40">Delete unavailable</button>
                  </div>
                </article>
              );
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-[#AAB4C3]">No member records matched this search.</p>}
          </div>
        </>
      )}

      <InviteUserDialog open={showInvite} onOpenChange={setShowInvite} onInvited={loadData} />

      <Dialog open={!!activityMember} onOpenChange={() => setActivityMember(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto border-[#242D38] bg-[#0E1A2B]">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-white"><History size={18} className="text-brass" /> Activity Timeline — {activityMember?.full_name}</DialogTitle></DialogHeader>
          {activityMember && <div className="mt-2"><MemberActivityFeed memberId={activityMember.id} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
