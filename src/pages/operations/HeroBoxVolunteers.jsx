import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Search, Clock, Award, Building2, AlertTriangle } from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HeroBoxVolunteers() {
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState({});
  const [loadError, setLoadError] = useState(false);
  const [usersError, setUsersError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const safeList = async (request) => {
      try {
        const rows = await request;
        return { rows: Array.isArray(rows) ? rows : [], failed: !Array.isArray(rows) };
      } catch {
        return { rows: [], failed: true };
      }
    };
    (async () => {
      const [profileResult, userResult] = await Promise.all([
        safeList(base44.entities.HeroBoxProfile.filter({ role: 'volunteer' }, '-created_date', 200)),
        safeList(base44.entities.User.list('-created_date', 200)),
      ]);
      if (!active) return;
      setVolunteers(profileResult.rows);
      setLoadError(profileResult.failed);
      setUsersError(userResult.failed);
      const userMap = {};
      userResult.rows.forEach((user) => { userMap[user.id] = user; });
      setUsers(userMap);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => volunteers.filter((volunteer) => {
    const name = users[volunteer.user_id]?.full_name || '';
    const query = search.toLowerCase();
    const matchesSearch = !query || name.toLowerCase().includes(query) || (volunteer.mission_statement || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [volunteers, users, search, statusFilter]);

  const stats = [
    { label: 'Volunteer profile records returned', value: loadError ? 'Unavailable' : volunteers.length, icon: Users },
    { label: 'Active profile records in returned set', value: loadError ? 'Unavailable' : volunteers.filter((item) => item.status === 'active').length, icon: Users },
    { label: 'Profiles with hours field supplied', value: loadError ? 'Unavailable' : volunteers.filter((item) => item.volunteer_hours !== null && item.volunteer_hours !== undefined).length, icon: Clock },
    { label: 'Profiles with milestone field supplied', value: loadError ? 'Unavailable' : volunteers.filter((item) => item.mission_milestones !== null && item.mission_milestones !== undefined).length, icon: Award },
  ];

  return (
    <OperationsPageLayout title="Volunteer profiles" description="Read-only volunteer profile records. Hours and milestones are profile-entered and not independently verified." icon={Users} breadcrumb="HeroBox · People">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-800" />
        <p className="text-xs leading-5 text-amber-950">Volunteer hours, mission milestones, and organizations supported are profile-entered fields. They are not proof of attendance, completed service, or independently verified impact. Profile and user queries are bounded to 200 records.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray/50" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search volunteer profiles…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-gray/40 focus:border-brass/40 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'pending', 'inactive'].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={'rounded-xl px-3 py-2 text-xs font-medium capitalize ' + (statusFilter === status ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-gray')}>{status}</button>)}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="vantoris-glass p-3.5"><Icon size={15} className="text-brass" /><p className="mt-1.5 text-xl font-bold text-foreground">{stat.value}</p><p className="text-[10px] text-gray">{stat.label}</p></div>;
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Volunteer profile records are unavailable. This is not confirmation that no profiles exist.</p>
      ) : filtered.length === 0 ? (
        <div className="vantoris-glass p-8 text-center"><Users size={32} className="mx-auto mb-2 text-gray/30" /><p className="text-sm text-gray">No volunteer profile records matched this filter.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((volunteer, index) => {
            const name = users[volunteer.user_id]?.full_name || (usersError ? 'Member name unavailable' : 'Member name not returned');
            return (
              <motion.article key={volunteer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="vantoris-glass p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass/12"><Users size={18} className="text-brass" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{name}</p><p className="text-[10px] text-gray">{dateLabel(volunteer.created_date)}</p></div>
                  </div>
                  <StatusBadge status={volunteer.status || 'not_supplied'} />
                </div>
                {volunteer.mission_statement && <p className="mb-3 line-clamp-2 text-xs text-gray">{volunteer.mission_statement}</p>}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <div className="text-center"><Clock size={13} className="mx-auto mb-1 text-brass" /><p className="text-sm font-bold text-foreground">{volunteer.volunteer_hours ?? '—'}</p><p className="text-[9px] text-gray">Profile-entered hours</p></div>
                  <div className="text-center"><Award size={13} className="mx-auto mb-1 text-champagne" /><p className="text-sm font-bold text-foreground">{volunteer.mission_milestones ?? '—'}</p><p className="text-[9px] text-gray">Profile milestones</p></div>
                  <div className="text-center"><Building2 size={13} className="mx-auto mb-1 text-navy/60" /><p className="text-sm font-bold text-foreground">{volunteer.organizations_supported ?? '—'}</p><p className="text-[9px] text-gray">Organizations listed</p></div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}
