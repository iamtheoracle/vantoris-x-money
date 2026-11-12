import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Shield, Search, Package, Mail, Users2, AlertTriangle } from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';

function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HeroBoxHeroes() {
  const [loading, setLoading] = useState(true);
  const [heroes, setHeroes] = useState([]);
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
        safeList(base44.entities.HeroBoxProfile.filter({ role: 'hero' }, '-created_date', 200)),
        safeList(base44.entities.User.list('-created_date', 200)),
      ]);
      if (!active) return;
      setHeroes(profileResult.rows);
      setLoadError(profileResult.failed);
      setUsersError(userResult.failed);
      const userMap = {};
      userResult.rows.forEach((user) => { userMap[user.id] = user; });
      setUsers(userMap);
    })().finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => heroes.filter((hero) => {
    const name = users[hero.user_id]?.full_name || '';
    const query = search.toLowerCase();
    const matchesSearch = !query || name.toLowerCase().includes(query) || (hero.mission_statement || '').toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || hero.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [heroes, users, search, statusFilter]);

  const stats = [
    { label: 'Hero profile records returned', value: loadError ? 'Unavailable' : heroes.length, icon: Shield, color: 'text-navy' },
    { label: 'Active profile records in returned set', value: loadError ? 'Unavailable' : heroes.filter((hero) => hero.status === 'active').length, icon: Shield, color: 'text-mint' },
    { label: 'Pending profile records in returned set', value: loadError ? 'Unavailable' : heroes.filter((hero) => hero.status === 'pending').length, icon: Shield, color: 'text-brass' },
    { label: 'Profiles with package field supplied', value: loadError ? 'Unavailable' : heroes.filter((hero) => hero.packages_delivered !== null && hero.packages_delivered !== undefined).length, icon: Package, color: 'text-champagne' },
  ];

  return (
    <OperationsPageLayout title="HeroBox profiles" description="Read-only hero profile records. Package and recipient metrics are profile-entered, not independently verified." icon={Shield} breadcrumb="HeroBox · People">
      <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-800" />
        <p className="text-xs leading-5 text-amber-950">Package counts, letters, and families assisted are displayed only as profile-entered fields. They are not proof of shipment, delivery, recipient identity, or verified impact. Profile and user queries are bounded to 200 records.</p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray/50" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hero profiles…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-gray/40 focus:border-brass/40 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'pending', 'inactive'].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={'rounded-xl px-3 py-2 text-xs font-medium capitalize ' + (statusFilter === status ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-gray')}>{status}</button>)}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <div key={stat.label} className="vantoris-glass p-3.5"><Icon size={15} className={stat.color} /><p className="mt-1.5 text-xl font-bold text-foreground">{stat.value}</p><p className="text-[10px] text-gray">{stat.label}</p></div>;
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" /></div>
      ) : loadError ? (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">Hero profile records are unavailable. This is not confirmation that no profiles exist.</p>
      ) : filtered.length === 0 ? (
        <div className="vantoris-glass p-8 text-center"><Shield size={32} className="mx-auto mb-2 text-gray/30" /><p className="text-sm text-gray">No hero profile records matched this filter.</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((hero, index) => {
            const name = users[hero.user_id]?.full_name || (usersError ? 'Member name unavailable' : 'Member name not returned');
            return (
              <motion.article key={hero.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }} className="vantoris-glass p-4">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/8"><Shield size={18} className="text-navy" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{name}</p><p className="text-[10px] text-gray">{dateLabel(hero.created_date)}</p></div>
                  </div>
                  <StatusBadge status={hero.status || 'not_supplied'} />
                </div>
                {hero.mission_statement && <p className="mb-3 line-clamp-2 text-xs text-gray">{hero.mission_statement}</p>}
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <div className="text-center"><Package size={13} className="mx-auto mb-1 text-champagne" /><p className="text-sm font-bold text-foreground">{hero.packages_delivered ?? '—'}</p><p className="text-[9px] text-gray">Profile package field</p></div>
                  <div className="text-center"><Mail size={13} className="mx-auto mb-1 text-champagne" /><p className="text-sm font-bold text-foreground">{hero.letters_sent ?? '—'}</p><p className="text-[9px] text-gray">Profile letter field</p></div>
                  <div className="text-center"><Users2 size={13} className="mx-auto mb-1 text-navy/60" /><p className="text-sm font-bold text-foreground">{hero.families_assisted ?? '—'}</p><p className="text-[9px] text-gray">Profile family field</p></div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}
