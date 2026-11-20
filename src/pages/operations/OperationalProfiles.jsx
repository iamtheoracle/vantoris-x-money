import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShieldCheck, Plus, Search, Mail, Phone, Building2, BadgeCheck, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ROLES = [
  'Super Administrator', 'Administrator', 'Executive', 'Operations Manager',
  'Operations Officer', 'Finance Officer', 'Compliance Officer', 'Risk Officer',
  'KYC Officer', 'Customer Support', 'Auditor', 'Document Officer',
  'Card Operations', 'Treasury Officer', 'IT Administrator',
];

const roleColors = {
  'Super Administrator': 'bg-crimson/20 text-red-400',
  'Administrator': 'bg-crimson/15 text-red-300',
  'Executive': 'bg-brass/15 text-brass',
  'Operations Manager': 'bg-brass/15 text-brass',
  'Finance Officer': 'bg-emerald-500/15 text-emerald-400',
  'Compliance Officer': 'bg-blue-500/15 text-blue-400',
  'Risk Officer': 'bg-orange-500/15 text-orange-400',
  'KYC Officer': 'bg-purple-500/15 text-purple-400',
  'Customer Support': 'bg-teal-500/15 text-teal-400',
  'Auditor': 'bg-slate-500/20 text-slate-300',
  'IT Administrator': 'bg-indigo-500/15 text-indigo-400',
};

export default function OperationalProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '', staff_id: '', employee_number: '', position: '', department: '',
    role: 'Operations Officer', work_email: '', work_phone: '', status: 'Active',
    mfa_status: 'Pending', date_joined: '', user_id: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [profs, usrs] = await Promise.all([
        base44.entities.OperationalProfile.list('-created_date', 200),
        base44.entities.User.list('-created_date', 200),
      ]);
      setProfiles(profs);
      setUsers(usrs);
      } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load profiles.', variant: 'destructive' });
      }
      setLoading(false);
  }

  const filtered = profiles.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.role?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({
      full_name: '', staff_id: '', employee_number: '', position: '', department: '',
      role: 'Operations Officer', work_email: '', work_phone: '', status: 'Active',
      mfa_status: 'Pending', date_joined: new Date().toISOString().split('T')[0], user_id: '',
    });
    setShowCreate(true);
  }

  function openEdit(profile) {
    setEditing(profile);
    setForm({
      full_name: profile.full_name || '', staff_id: profile.staff_id || '',
      employee_number: profile.employee_number || '', position: profile.position || '',
      department: profile.department || '', role: profile.role || 'Operations Officer',
      work_email: profile.work_email || '', work_phone: profile.work_phone || '',
      status: profile.status || 'Active', mfa_status: profile.mfa_status || 'Pending',
      date_joined: profile.date_joined || '', user_id: profile.user_id || '',
    });
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.OperationalProfile.update(editing.id, form);
      } else {
        await base44.entities.OperationalProfile.create(form);
      }
      setShowCreate(false);
      loadData();
      toast({ title: editing ? 'Profile updated' : 'Profile created', description: `${form.full_name}'s profile has been saved.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', description: e.message || 'Unable to save profile.', variant: 'destructive' });
    }
    setSaving(false);
  }

  async function updateStatus(profile, status) {
    try {
      await base44.entities.OperationalProfile.update(profile.id, { status });
      loadData();
      toast({ title: 'Status updated', description: `${profile.full_name} is now ${status}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Update failed', description: e.message || 'Unable to update status.', variant: 'destructive' });
    }
  }

  async function handleDeleteProfile(profile) {
    if (!confirm(`Delete operational profile for ${profile.full_name}? This cannot be undone.`)) return;
    try {
      await base44.entities.OperationalProfile.delete(profile.id);
      loadData();
      toast({ title: 'Profile deleted', description: `${profile.full_name}'s profile has been removed.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Delete failed', description: e.message || 'Unable to delete profile.', variant: 'destructive' });
    }
  }

  function getLinkedUser(id) {
    return users.find(u => u.id === id);
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Operational Profiles" description="Manage staff identities — separate from member accounts" icon={ShieldCheck}>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.status === 'Active').length,
    mfaEnabled: profiles.filter(p => p.mfa_status === 'Enabled').length,
    roles: [...new Set(profiles.map(p => p.role))].length,
  };

  return (
    <OperationsPageLayout title="Operational Profiles" description="Staff identities — completely separate from member accounts" icon={ShieldCheck}
      actions={
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all">
          <Plus size={16} /> Add Profile
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total Staff', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'MFA Enabled', value: stats.mfaEnabled },
          { label: 'Roles', value: stats.roles },
        ].map(card => (
          <div key={card.label} className="vantoris-card p-4 sm:p-5">
            <p className="text-2xl sm:text-3xl font-bold text-white">{card.value}</p>
            <p className="text-[#AAB4C3] text-xs mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, role, or department…"
          className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Name</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Position</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Contact</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(profile => (
              <tr key={profile.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                <td className="px-5 py-4">
                  <p className="text-white font-medium text-sm">{profile.full_name}</p>
                  {profile.staff_id && <p className="text-[#AAB4C3] text-xs">ID: {profile.staff_id}</p>}
                </td>
                <td className="px-5 py-4">
                  <p className="text-white text-sm">{profile.position || '—'}</p>
                  <p className="text-[#AAB4C3] text-xs">{profile.department || ''}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${roleColors[profile.role] || 'bg-[#242D38] text-[#AAB4C3]'}`}>
                    {profile.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {profile.work_email && <p className="text-white text-xs">{profile.work_email}</p>}
                  {profile.work_phone && <p className="text-[#AAB4C3] text-xs">{profile.work_phone}</p>}
                  {!profile.work_email && !profile.work_phone && <span className="text-[#AAB4C3] text-xs">—</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    profile.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                    profile.status === 'Suspended' ? 'bg-crimson/10 text-red-400' :
                    'bg-[#242D38] text-[#AAB4C3]'
                  }`}>
                    {profile.status}
                  </span>
                  {profile.mfa_status === 'Enabled' && <BadgeCheck size={12} className="inline ml-1 text-emerald-400" />}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(profile)} className="px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteProfile(profile)} className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-crimson/10 rounded-lg transition-all" title="Delete profile">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-[#AAB4C3]">No operational profiles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(profile => (
          <div key={profile.id} className="vantoris-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium text-sm">{profile.full_name}</p>
                {profile.staff_id && <p className="text-[#AAB4C3] text-xs">ID: {profile.staff_id}</p>}
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                profile.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                profile.status === 'Suspended' ? 'bg-crimson/10 text-red-400' :
                'bg-[#242D38] text-[#AAB4C3]'
              }`}>{profile.status}</span>
            </div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${roleColors[profile.role] || 'bg-[#242D38] text-[#AAB4C3]'}`}>
              {profile.role}
            </span>
            <p className="text-white text-xs">{profile.position || '—'} · {profile.department || ''}</p>
            {profile.work_email && <p className="text-[#AAB4C3] text-xs mt-1">{profile.work_email}</p>}
            {profile.work_phone && <p className="text-[#AAB4C3] text-xs">{profile.work_phone}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(profile)} className="flex-1 py-2 bg-brass/15 text-brass rounded-lg text-xs font-medium">
                Edit Profile
              </button>
              <button onClick={() => handleDeleteProfile(profile)} className="px-3 py-2 bg-crimson/10 text-red-400 rounded-lg text-xs font-medium">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-[#AAB4C3] py-8">No operational profiles found</p>}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editing ? 'Edit Operational Profile' : 'Add Operational Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-[70vh] overflow-y-auto vantoris-scroll pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Staff ID</label>
                <input value={form.staff_id} onChange={e => setForm({...form, staff_id: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Employee Number</label>
                <input value={form.employee_number} onChange={e => setForm({...form, employee_number: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Position</label>
                <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Department</label>
                <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Role *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Work Email</label>
                <input value={form.work_email} onChange={e => setForm({...form, work_email: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Work Phone</label>
                <input value={form.work_phone} onChange={e => setForm({...form, work_phone: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Status</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">MFA Status</label>
                <select value={form.mfa_status} onChange={e => setForm({...form, mfa_status: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Date Joined</label>
                <input type="date" value={form.date_joined} onChange={e => setForm({...form, date_joined: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Linked User</label>
                <select value={form.user_id} onChange={e => setForm({...form, user_id: e.target.value})} className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none">
                  <option value="">— None —</option>
                  {users.filter(u => u.role !== 'user').map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving || !form.full_name.trim()} className="flex-1 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Profile'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 bg-[#242D38] text-[#AAB4C3] rounded-xl text-sm font-medium hover:text-white">
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}