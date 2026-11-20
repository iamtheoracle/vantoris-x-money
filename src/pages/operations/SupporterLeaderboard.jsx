import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import VantorisKPICard from '@/components/vantoris/system/VantorisKPICard';
import {
  Trophy, DollarSign, Package, Users, Heart, TrendingUp,
  Crown, Medal, Award, Search, ArrowUpRight, Sparkles,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';

const RANK_STYLES = [
  { bg: 'from-brass/20 to-brass/5', border: 'border-brass/40', text: 'text-brass', icon: Crown, label: '1st' },
  { bg: 'from-slate-200 to-slate-50', border: 'border-slate-300', text: 'text-gray', icon: Medal, label: '2nd' },
  { bg: 'from-amber-100 to-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: Award, label: '3rd' },
];

export default function SupporterLeaderboard() {
  const [profiles, setProfiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_volume');

  useEffect(() => {
    (async () => {
      try {
        const [profs, acts, accts, usrs] = await Promise.all([
          base44.entities.HeroBoxProfile.list('-created_date', 200),
          base44.entities.HeroBoxActivity.list('-created_date', 500),
          base44.entities.Account.list('-created_date', 200),
          base44.entities.User.list('-created_date', 200),
        ]);
        setProfiles(profs || []);
        setActivities(acts || []);
        setAccounts(accts || []);
        setUsers(usrs || []);
      } catch (e) {
        console.error('Failed to load leaderboard data:', e);
      }
      setLoading(false);
    })();
  }, []);

  const getUser = (id) => users.find(u => u.id === id);

  // Build ranked supporter data
  const rankedSupporters = useMemo(() => {
    // Aggregate HeroBox activity amounts per user
    const activityTotals = {};
    activities.forEach(a => {
      if (!a.user_id) return;
      if (!activityTotals[a.user_id]) {
        activityTotals[a.user_id] = { total: 0, count: 0, types: {} };
      }
      activityTotals[a.user_id].total += Math.abs(a.amount || 0);
      activityTotals[a.user_id].count += 1;
      activityTotals[a.user_id].types[a.activity_type] = (activityTotals[a.user_id].types[a.activity_type] || 0) + 1;
    });

    // Aggregate account balances per user (investment volume)
    const investmentTotals = {};
    accounts.forEach(a => {
      if (!a.user_id) return;
      if (!investmentTotals[a.user_id]) investmentTotals[a.user_id] = 0;
      investmentTotals[a.user_id] += Math.abs(a.balance || 0);
    });

    // Merge profiles with activity and investment data
    const merged = profiles.map(p => {
      const user = getUser(p.user_id);
      const actTotals = activityTotals[p.user_id] || { total: 0, count: 0, types: {} };
      const investment = investmentTotals[p.user_id] || 0;
      const profileContribution = p.total_contribution || 0;
      const contributionVolume = Math.max(profileContribution, actTotals.total);
      const totalVolume = contributionVolume + investment;

      return {
        id: p.id,
        user_id: p.user_id,
        name: user?.full_name || `Supporter ${p.user_id.slice(-4)}`,
        email: user?.email || '',
        role: p.role,
        status: p.status,
        investment,
        contributionVolume,
        totalVolume,
        activityCount: actTotals.count,
        heroesSupported: p.heroes_supported || 0,
        packagesDelivered: p.packages_delivered || 0,
        familiesAssisted: p.families_assisted || 0,
        volunteerHours: p.volunteer_hours || 0,
        missionMilestones: p.mission_milestones || 0,
        activityTypes: actTotals.types,
      };
    });

    // Also add users who have accounts but no HeroBox profile
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    Object.keys(investmentTotals).forEach(uid => {
      if (!profileUserIds.has(uid)) {
        const user = getUser(uid);
        const investment = investmentTotals[uid] || 0;
        const actTotals = activityTotals[uid] || { total: 0, count: 0, types: {} };
        merged.push({
          id: uid,
          user_id: uid,
          name: user?.full_name || `Member ${uid.slice(-4)}`,
          email: user?.email || '',
          role: 'sponsor',
          status: 'active',
          investment,
          contributionVolume: actTotals.total,
          totalVolume: investment + actTotals.total,
          activityCount: actTotals.count,
          heroesSupported: 0,
          packagesDelivered: 0,
          familiesAssisted: 0,
          volunteerHours: 0,
          missionMilestones: 0,
          activityTypes: actTotals.types,
        });
      }
    });

    // Filter by search
    const filtered = search.trim()
      ? merged.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
      : merged;

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'total_volume') return b.totalVolume - a.totalVolume;
      if (sortBy === 'contribution') return b.contributionVolume - a.contributionVolume;
      if (sortBy === 'investment') return b.investment - a.investment;
      if (sortBy === 'activity') return b.activityCount - a.activityCount;
      if (sortBy === 'heroes') return b.heroesSupported - a.heroesSupported;
      return 0;
    });

    return filtered;
  }, [profiles, activities, accounts, users, search, sortBy]);

  // Summary stats
  const summary = useMemo(() => {
    const totalContribution = rankedSupporters.reduce((s, r) => s + r.contributionVolume, 0);
    const totalInvestment = rankedSupporters.reduce((s, r) => s + r.investment, 0);
    const totalActivities = rankedSupporters.reduce((s, r) => s + r.activityCount, 0);
    const totalHeroes = rankedSupporters.reduce((s, r) => s + r.heroesSupported, 0);
    return { totalContribution, totalInvestment, totalActivities, totalHeroes, supporterCount: rankedSupporters.length };
  }, [rankedSupporters]);

  // Top 5 for chart
  const topChart = rankedSupporters.slice(0, 10).map(s => ({
    name: s.name.split(' ')[0],
    contribution: s.contributionVolume,
    investment: s.investment,
  }));

  if (loading) {
    return (
      <OperationsPageLayout title="Supporter Leaderboard" description="Most active supporters ranked by investment and contribution volume" icon={Trophy}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Supporter Leaderboard"
      description="Most active supporters ranked by investment and contribution volume"
      icon={Trophy}
      breadcrumb="Operations · Analytics"
    >
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <VantorisKPICard label="Total Contribution Volume" value={formatCurrency(summary.totalContribution)} sublabel="HeroBox mission support" icon={Heart} accent="crimson" />
        <VantorisKPICard label="Total Investment Volume" value={formatCurrency(summary.totalInvestment)} sublabel="Account balances" icon={DollarSign} accent="navy" hero />
        <VantorisKPICard label="Total Activities" value={summary.totalActivities.toLocaleString()} sublabel="Logged contributions" icon={TrendingUp} accent="gold" />
        <VantorisKPICard label="Heroes Supported" value={summary.totalHeroes.toLocaleString()} sublabel={`${summary.supporterCount} active supporters`} icon={Users} accent="mint" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        {/* Leaderboard List */}
        <div className="vantoris-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-brass" />
              <h3 className="text-foreground font-semibold text-sm">Top Supporters</h3>
              <span className="px-2 py-0.5 bg-navy/8 text-navy rounded text-[10px] font-semibold">{rankedSupporters.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search supporters..."
                  className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-navy/20 w-40"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-navy/20"
              >
                <option value="total_volume">Total Volume</option>
                <option value="contribution">Contribution</option>
                <option value="investment">Investment</option>
                <option value="activity">Activity Count</option>
                <option value="heroes">Heroes Supported</option>
              </select>
            </div>
          </div>

          {/* Ranked List */}
          <div className="divide-y divide-slate-100">
            {rankedSupporters.map((supporter, idx) => {
              const rank = idx;
              const rankStyle = rank < 3 ? RANK_STYLES[rank] : null;
              const RankIcon = rankStyle?.icon || null;
              return (
                <div
                  key={supporter.id}
                  className={`flex items-center gap-4 p-4 hover:bg-slate-50/70 transition-all ${rank < 3 ? `bg-gradient-to-r ${rankStyle.bg}` : ''}`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-10 flex items-center justify-center">
                    {RankIcon ? (
                      <div className={`w-9 h-9 rounded-full bg-white border-2 ${rankStyle.border} flex items-center justify-center`}>
                        <RankIcon size={16} className={rankStyle.text} />
                      </div>
                    ) : (
                      <span className="text-gray font-bold text-sm w-9 h-9 flex items-center justify-center">{rank + 1}</span>
                    )}
                  </div>

                  {/* Supporter Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-semibold text-sm truncate">{supporter.name}</p>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${supporter.role === 'sponsor' ? 'bg-champagne/10 text-champagne' : supporter.role === 'hero' ? 'bg-mint/10 text-mint' : 'bg-slate-100 text-gray'}`}>
                        {supporter.role}
                      </span>
                    </div>
                    <p className="text-gray text-xs truncate">{supporter.email}</p>
                    {/* Mini stats */}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray flex items-center gap-1">
                        <Package size={10} /> {supporter.packagesDelivered} packages
                      </span>
                      <span className="text-[10px] text-gray flex items-center gap-1">
                        <Heart size={10} /> {supporter.heroesSupported} heroes
                      </span>
                      {supporter.volunteerHours > 0 && (
                        <span className="text-[10px] text-gray flex items-center gap-1">
                          <Sparkles size={10} /> {supporter.volunteerHours}h
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Volume Breakdown */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] uppercase tracking-wider text-gray font-semibold">Contribution</p>
                      <p className="text-crimson font-semibold text-sm">{formatCurrency(supporter.contributionVolume)}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] uppercase tracking-wider text-gray font-semibold">Investment</p>
                      <p className="text-navy font-semibold text-sm">{formatCurrency(supporter.investment)}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-[9px] uppercase tracking-wider text-gray font-semibold">Total Volume</p>
                      <p className="text-foreground font-bold text-base">{formatCurrency(supporter.totalVolume)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {rankedSupporters.length === 0 && (
              <div className="py-16 text-center">
                <Trophy size={32} className="text-gray/30 mx-auto mb-3" />
                <p className="text-gray text-sm">{profiles.length === 0 ? 'No supporter profiles yet' : 'No supporters match your search'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Top 10 Chart */}
        <div className="space-y-4">
          <div className="vantoris-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart width={16} className="text-navy" />
              <h3 className="text-foreground font-semibold text-sm">Top 10 by Volume</h3>
            </div>
            {topChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topChart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" tickFormatter={formatAxisCurrency} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    formatter={(v) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(7,28,56,0.08)', fontSize: 12 }}
                  />
                  <Bar dataKey="contribution" name="Contribution" fill="#DC2626" radius={[0, 4, 4, 0]} stackId="a" />
                  <Bar dataKey="investment" name="Investment" fill="#071C38" radius={[0, 4, 4, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-gray text-sm">No data to display</div>
            )}
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="flex items-center gap-1.5 text-[10px] text-gray">
                <span className="w-2.5 h-2.5 rounded-sm bg-crimson" /> Contribution
              </span>
              <span className="flex items-center gap-1.5 text-[10px] text-gray">
                <span className="w-2.5 h-2.5 rounded-sm bg-navy" /> Investment
              </span>
            </div>
          </div>

          {/* Mission Impact Summary */}
          <div className="vantoris-glass-premium p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-crimson" />
              <h3 className="text-foreground font-semibold text-sm">Mission Impact</h3>
            </div>
            <div className="space-y-3">
              <ImpactRow icon={Package} label="Packages Delivered" value={rankedSupporters.reduce((s, r) => s + r.packagesDelivered, 0)} color="text-navy" />
              <ImpactRow icon={Users} label="Heroes Supported" value={summary.totalHeroes} color="text-mint" />
              <ImpactRow icon={Heart} label="Families Assisted" value={rankedSupporters.reduce((s, r) => s + r.familiesAssisted, 0)} color="text-crimson" />
              <ImpactRow icon={Sparkles} label="Volunteer Hours" value={rankedSupporters.reduce((s, r) => s + r.volunteerHours, 0)} color="text-brass" />
              <ImpactRow icon={TrendingUp} label="Mission Milestones" value={rankedSupporters.reduce((s, r) => s + r.missionMilestones, 0)} color="text-champagne" />
            </div>
          </div>
        </div>
      </div>
    </OperationsPageLayout>
  );
}

function formatAxisCurrency(v) {
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function ImpactRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <span className="text-gray text-xs font-medium">{label}</span>
      </div>
      <span className="text-foreground font-bold text-sm">{value.toLocaleString()}</span>
    </div>
  );
}