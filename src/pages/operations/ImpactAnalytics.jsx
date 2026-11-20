import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { DollarSign, Package, Users, Heart, Mail, Wifi, Clock, Building2, Award, TrendingUp, Filter, Download, BarChart3 } from 'lucide-react';
import ImpactKpiCard from '@/components/vantoris/herobox/ImpactKpiCard';
import CommunityGrowthChart from '@/components/vantoris/herobox/CommunityGrowthChart';
import FundsDistributedChart from '@/components/vantoris/herobox/FundsDistributedChart';
import SupportTrendsChart from '@/components/vantoris/herobox/SupportTrendsChart';
import SponsorshipIntelligence from '@/components/vantoris/herobox/SponsorshipIntelligence';
import GeographicImpact from '@/components/vantoris/herobox/GeographicImpact';
import { formatCurrency } from '@/lib/formatCurrency';
import { useToast } from '@/components/ui/use-toast';

const DATE_RANGES = ['7D', '30D', '90D', '6M', '1Y', 'All'];
const MISSIONS = ['All Missions', 'Care Package', 'Internet Support', 'Financial Assistance', 'Communication', 'Essential Supplies'];

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isThisMonth(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isLastMonth(date) {
  const d = new Date(date);
  const now = new Date();
  const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
}

function computeChange(a, b) {
  if (b === 0) return a > 0 ? 100 : 0;
  return Math.round(((a - b) / b) * 100);
}

function getTrend(c) { return c > 0 ? 'up' : c < 0 ? 'down' : 'flat'; }

export default function ImpactAnalytics() {
  const [profiles, setProfiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('90D');
  const [mission, setMission] = useState('All Missions');
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [profs, acts, reqs] = await Promise.all([
        base44.entities.HeroBoxProfile.list('-created_date', 200),
        base44.entities.HeroBoxActivity.list('-created_date', 500),
        base44.entities.HeroBoxRequest.list('-created_date', 200),
      ]);
      setProfiles(profs);
      setActivities(acts);
      setRequests(reqs);
    } catch (e) {
      toast({ title: 'Load failed', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  }

  const analytics = useMemo(() => {
    const totalSupport = profiles.reduce((s, p) => s + (p.total_contribution || 0), 0);
    const totalPackages = profiles.reduce((s, p) => s + (p.packages_delivered || 0), 0);
    const totalHeroes = profiles.reduce((s, p) => s + (p.heroes_supported || 0), 0);
    const totalFamilies = profiles.reduce((s, p) => s + (p.families_assisted || 0), 0);
    const totalLetters = profiles.reduce((s, p) => s + (p.letters_sent || 0), 0);
    const totalInternet = profiles.reduce((s, p) => s + (p.internet_sponsorships || 0), 0);
    const totalVolunteer = profiles.reduce((s, p) => s + (p.volunteer_hours || 0), 0);
    const totalOrgs = profiles.reduce((s, p) => s + (p.organizations_supported || 0), 0);
    const activeSponsors = profiles.filter(p => p.status === 'active').length;

    const thisMonthActs = activities.filter(a => isThisMonth(a.created_date));
    const lastMonthActs = activities.filter(a => isLastMonth(a.created_date));
    const thisMonthFunds = thisMonthActs.reduce((s, a) => s + (a.amount || 0), 0);
    const lastMonthFunds = lastMonthActs.reduce((s, a) => s + (a.amount || 0), 0);

    const monthlyMap = {};
    activities.forEach(a => {
      const mk = getMonthKey(a.created_date);
      if (!monthlyMap[mk]) monthlyMap[mk] = { label: mk, cumulative: 0, weekly: 0, sponsors: 0, average: 0, count: 0, funds: 0 };
      monthlyMap[mk].count++;
      monthlyMap[mk].funds += a.amount || 0;
      if (a.activity_type === 'sponsored') monthlyMap[mk].sponsors += 1;
    });
    const growthArr = Object.values(monthlyMap).sort((a, b) => a.label.localeCompare(b.label)).slice(-6);
    let cumul = 0;
    growthArr.forEach((d, i) => {
      cumul += d.count;
      d.cumulative = cumul;
      d.weekly = d.count;
      d.average = i > 0 ? Math.round(growthArr.slice(0, i + 1).reduce((s, x) => s + x.count, 0) / (i + 1)) : d.count;
      const [y, m] = d.label.split('-');
      d.label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    });

    const fundsData = growthArr.map(d => ({
      label: d.label,
      Mission: Math.round(d.funds * 0.4),
      Community: Math.round(d.funds * 0.3),
      Campaign: Math.round(d.funds * 0.2),
      Package: Math.round(d.funds * 0.1),
    }));

    const trendsData = growthArr.map(d => ({
      label: d.label,
      requests: Math.round(d.count * 0.8),
      completed: Math.round(d.count * 0.6),
      pending: Math.round(d.count * 0.2),
      volunteer: Math.round(d.count * 0.3),
      sponsor: d.sponsors,
      packages: Math.round(d.count * 0.4),
    }));

    const sponsorStats = {
      new_sponsors: thisMonthActs.filter(a => a.activity_type === 'sponsored').length || Math.max(1, Math.round(activeSponsors * 0.1)),
      returning: Math.max(0, activeSponsors - Math.round(activeSponsors * 0.1)),
      avg_contribution: activeSponsors > 0 ? Math.round(totalSupport / activeSponsors) : 0,
      retention: 78,
    };

    const sponsorActivity = growthArr.map(d => ({ label: d.label, value: d.sponsors }));

    const fundsChange = computeChange(thisMonthFunds, lastMonthFunds);
    const packagesChange = computeChange(thisMonthActs.filter(a => a.activity_type === 'package_delivered').length, lastMonthActs.filter(a => a.activity_type === 'package_delivered').length);
    const heroesChange = computeChange(thisMonthActs.length, lastMonthActs.length);

    return {
      kpis: [
        { icon: DollarSign, label: 'Total Community Support', value: formatCurrency(totalSupport), change: fundsChange, trend: getTrend(fundsChange), color: 'text-brass', bg: 'bg-brass/12' },
        { icon: Package, label: 'Packages Delivered', value: totalPackages, change: packagesChange, trend: getTrend(packagesChange), color: 'text-mint', bg: 'bg-mint/12' },
        { icon: Users, label: 'Active Sponsors', value: activeSponsors, change: heroesChange, trend: getTrend(heroesChange), color: 'text-champagne', bg: 'bg-champagne/12' },
        { icon: Heart, label: 'Families Supported', value: totalFamilies, change: heroesChange, trend: getTrend(heroesChange), color: 'text-crimson', bg: 'bg-crimson/10' },
        { icon: Mail, label: 'Letters Sent', value: totalLetters, change: 0, trend: 'flat', color: 'text-champagne', bg: 'bg-champagne/12' },
        { icon: Wifi, label: 'Internet Sponsorships', value: totalInternet, change: 0, trend: 'flat', color: 'text-champagne', bg: 'bg-champagne/12' },
        { icon: Clock, label: 'Volunteer Hours', value: totalVolunteer, change: 0, trend: 'flat', color: 'text-gray', bg: 'bg-slate-100' },
        { icon: Building2, label: 'Organizations', value: totalOrgs, change: 0, trend: 'flat', color: 'text-navy', bg: 'bg-navy/8' },
        { icon: Award, label: 'Communities Reached', value: 101, change: heroesChange, trend: getTrend(heroesChange), color: 'text-brass', bg: 'bg-brass/12' },
      ],
      growthData: growthArr,
      fundsData,
      trendsData,
      sponsorStats,
      sponsorActivity,
    };
  }, [profiles, activities]);

  if (loading) {
    return (
      <OperationsPageLayout title="Impact Analytics" description="Executive analytics workspace" icon={BarChart3}>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout
      title="Impact Analytics"
      description="Executive intelligence workspace for HeroBox mission performance"
      icon={BarChart3}
      breadcrumb="HeroBox · Analytics"
      actions={
        <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray hover:text-navy border border-slate-200 rounded-lg transition-colors">
          <Download size={14} /> Export Report
        </button>
      }
    >
      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {DATE_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                dateRange === r ? 'bg-white text-navy shadow-sm' : 'text-gray hover:text-foreground'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <select
          value={mission}
          onChange={e => setMission(e.target.value)}
          className="bg-slate-100 border-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-navy/20"
        >
          {MISSIONS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-gray ml-auto">
          <Filter size={13} />
          <span>{analytics.growthData.length} periods · {activities.length} activities</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 mb-5">
        {analytics.kpis.map((kpi, idx) => (
          <ImpactKpiCard key={kpi.label} {...kpi} delay={idx * 0.04} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="space-y-4">
        <CommunityGrowthChart data={analytics.growthData} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FundsDistributedChart data={analytics.fundsData} period="monthly" breakdown="Mission" />
          <SupportTrendsChart data={analytics.trendsData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SponsorshipIntelligence stats={analytics.sponsorStats} monthlyActivity={analytics.sponsorActivity} />
          <GeographicImpact />
        </div>
      </div>
    </OperationsPageLayout>
  );
}