import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Users, Search, Clock, Award, Building2 } from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';

export default function HeroBoxVolunteers() {
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState([]);
  const [users, setUsers] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadVolunteers(); }, []);

  async function loadVolunteers() {
    try {
      const [profiles, allUsers] = await Promise.all([
        base44.entities.HeroBoxProfile.filter({ role: 'volunteer' }, '-created_date', 200).catch(() => []),
        base44.entities.User.list('-created_date', 200).catch(() => []),
      ]);
      setVolunteers(profiles);
      const userMap = {};
      allUsers.forEach(u => { userMap[u.id] = u; });
      setUsers(userMap);
    } catch (e) {
      console.error('Failed to load volunteers:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => volunteers.filter(v => {
    const name = users[v.user_id]?.full_name || '';
    const matchesSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (v.mission_statement || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [volunteers, users, search, statusFilter]);

  const totalHours = volunteers.reduce((s, v) => s + (v.volunteer_hours || 0), 0);
  const totalMilestones = volunteers.reduce((s, v) => s + (v.mission_milestones || 0), 0);
  const totalOrgs = volunteers.reduce((s, v) => s + (v.organizations_supported || 0), 0);

  const stats = [
    { label: 'Total Volunteers', value: volunteers.length, icon: Users, color: 'text-navy' },
    { label: 'Active', value: volunteers.filter(v => v.status === 'active').length, icon: Users, color: 'text-mint' },
    { label: 'Volunteer Hours', value: totalHours, icon: Clock, color: 'text-brass' },
    { label: 'Mission Milestones', value: totalMilestones, icon: Award, color: 'text-champagne' },
  ];

  return (
    <OperationsPageLayout
      title="Volunteers"
      description="Community members contributing time and service"
      icon={Users}
      breadcrumb="HeroBox · People"
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search volunteers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-foreground placeholder:text-gray/40 focus:outline-none focus:border-brass/40"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-navy text-white'
                  : 'bg-white border border-slate-200 text-gray hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="vantoris-glass p-3.5">
              <Icon size={15} className={stat.color} />
              <p className="text-foreground font-bold text-xl mt-1.5">{stat.value}</p>
              <p className="text-gray text-[10px]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="vantoris-glass p-8 text-center">
          <Users size={32} className="text-gray/30 mx-auto mb-2" />
          <p className="text-gray text-sm">No volunteers found</p>
          <p className="text-gray/50 text-[11px] mt-1">Volunteers will appear here when profiles are created</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((vol, i) => {
            const user = users[vol.user_id];
            const name = user?.full_name || `Volunteer #${vol.id.slice(-6).toUpperCase()}`;
            return (
              <motion.div
                key={vol.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="vantoris-glass p-4 hover:shadow-float transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brass/12 flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-brass" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold truncate">{name}</p>
                      <p className="text-gray text-[10px]">{new Date(vol.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <StatusBadge status={vol.status} />
                </div>
                {vol.mission_statement && (
                  <p className="text-gray text-xs mb-3 line-clamp-2">{vol.mission_statement}</p>
                )}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                  <div className="text-center">
                    <Clock size={13} className="text-brass mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{vol.volunteer_hours || 0}</p>
                    <p className="text-gray text-[9px]">Hours</p>
                  </div>
                  <div className="text-center">
                    <Award size={13} className="text-champagne mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{vol.mission_milestones || 0}</p>
                    <p className="text-gray text-[9px]">Milestones</p>
                  </div>
                  <div className="text-center">
                    <Building2 size={13} className="text-navy/60 mx-auto mb-1" />
                    <p className="text-foreground font-bold text-sm">{vol.organizations_supported || 0}</p>
                    <p className="text-gray text-[9px]">Orgs</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </OperationsPageLayout>
  );
}