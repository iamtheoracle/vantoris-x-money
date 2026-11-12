import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Radar, Shield, Heart, Building2, Package, CheckCircle2, DollarSign,
  ArrowUpRight, FileText, Users, Clock, Truck, Wifi, Mail, ChevronRight,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import MissionKpiCard from '@/components/vantoris/herobox/admin/MissionKpiCard';

const ACTIVITY_META = {
  sponsored: { icon: Heart, color: 'text-brass', bg: 'bg-brass/12', label: 'Recorded sponsorship' },
  request_approved: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/12', label: 'Recorded approval' },
  package_delivered: { icon: Package, color: 'text-mint', bg: 'bg-mint/12', label: 'Recorded delivery status' },
  letter_received: { icon: Mail, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Letter record' },
  impact_report: { icon: TrendingUp, color: 'text-navy', bg: 'bg-navy/8', label: 'Impact record' },
  volunteer_hours: { icon: Clock, color: 'text-gray', bg: 'bg-slate-100', label: 'Volunteer-hour record' },
  internet_sponsored: { icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Internet sponsorship record' },
  community_update: { icon: Users, color: 'text-navy', bg: 'bg-navy/8', label: 'Community record' },
  mission_milestone: { icon: CheckCircle2, color: 'text-brass', bg: 'bg-brass/12', label: 'Recorded milestone' },
};

export default function HeroBoxMissionControl() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [stats, setStats] = useState({});
  const [missionStatus, setMissionStatus] = useState({});
  const [queues, setQueues] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => { loadMissionData(); }, []);

  async function loadMissionData() {
    setLoading(true);
    setLoadError('');
    try {
      const results = await Promise.allSettled([
        base44.entities.HeroBoxProfile.filter({}, '-created_date', 200),
        base44.entities.HeroBoxRequest.filter({}, '-created_date', 200),
        base44.entities.HeroBoxActivity.filter({}, '-created_date', 100),
        base44.entities.WithdrawalRequest.filter({ status: 'pending' }),
        base44.entities.VerificationRequest.filter({ status: 'pending' }),
        base44.entities.Application.filter({ application_status: 'pending' }),
      ]);
      const failed = results.find((result) => result.status === 'rejected');
      if (failed) throw new Error(failed.reason?.message || 'One or more mission data sources are unavailable.');
      const [profiles, requests, activities, withdrawals, verifications, applications] = results.map((result) => result.value);
      if (![profiles, requests, activities, withdrawals, verifications, applications].every(Array.isArray)) {
        throw new Error('A mission data source returned an invalid response. Counts are withheld.');
      }

      const activeHeroes = profiles.filter(p => p.role === 'hero' && p.status === 'active').length;
      const activeSupporters = profiles.filter(p => p.role === 'sponsor' && p.status === 'active').length;
      const activeOrganizations = profiles.filter(p => p.role === 'organization' && p.status === 'active').length;
      const pendingHeroes = profiles.filter(p => p.role === 'hero' && p.status === 'pending').length;
      const packagesInProgress = requests.filter(r => r.request_type === 'care_package' && ['pending', 'under_review', 'approved', 'in_progress'].includes(r.status)).length;
      const packagesRecordedComplete = requests.filter(r => ['delivered', 'completed'].includes(r.status)).length;
      const pendingReviews = requests.filter(r => ['pending', 'under_review'].includes(r.status)).length;

      setStats({
        activeHeroes, activeSupporters, activeOrganizations,
        packagesInProgress, packagesRecordedComplete,
        pendingWithdrawals: withdrawals.length, pendingReviews,
      });

      setMissionStatus({
        heroesAwaiting: pendingHeroes,
        requestsPending: requests.filter(r => r.status === 'pending').length,
        packagesPreparing: requests.filter(r => r.status === 'approved').length,
        packagesMarkedInTransit: requests.filter(r => r.status === 'in_progress').length,
        packagesMarkedComplete: packagesRecordedComplete,
        internetRecords: activities.filter(a => a.activity_type === 'internet_sponsored').length,
        letterRecords: activities.filter(a => a.activity_type === 'letter_received').length,
        volunteerHoursRecorded: profiles.reduce((sum, p) => sum + (Number(p.volunteer_hours) || 0), 0),
      });

      setQueues([
        { id: 'support', icon: Package, title: 'Support Requests', count: pendingReviews, priority: pendingReviews > 5 ? 'high' : pendingReviews > 0 ? 'medium' : 'normal', to: '/operations/service-requests', color: 'bg-brass/10 text-brass' },
        { id: 'fulfillment', icon: Truck, title: 'Package Fulfillment Records', count: requests.filter(r => ['approved', 'in_progress'].includes(r.status)).length, priority: 'medium', to: '/operations/herobox', color: 'bg-navy/8 text-navy' },
        { id: 'withdrawals', icon: ArrowUpRight, title: 'Withdrawal Review', count: withdrawals.length, priority: withdrawals.length > 5 ? 'high' : 'normal', to: '/operations/withdrawals', color: 'bg-crimson/10 text-crimson' },
        { id: 'verifications', icon: FileText, title: 'Payment Verification', count: verifications.length, priority: verifications.length > 3 ? 'medium' : 'normal', to: '/operations/verification-requests', color: 'bg-champagne/12 text-champagne' },
        { id: 'kyc', icon: Shield, title: 'KYC Reviews', count: applications.length, priority: applications.length > 5 ? 'high' : 'normal', to: '/operations/kyc', color: 'bg-navy/8 text-navy' },
      ]);
      setRecentActivity(activities.slice(0, 6));
    } catch (error) {
      console.error('Mission data load failed:', error);
      setStats({});
      setMissionStatus({});
      setQueues([]);
      setRecentActivity([]);
      setLoadError(error.message || 'Mission data could not be loaded. Counts are withheld.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass/30 border-t-brass" />
      </div>
    );
  }

  if (loadError) {
    return (
      <OperationsPageLayout title="HeroBox Mission Control" description="Humanitarian operations records" icon={Radar} breadcrumb="Mission Control">
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
          <p className="font-semibold">Mission data unavailable</p>
          <p className="mt-1">{loadError} The dashboard is withholding counts rather than presenting failed queries as zero.</p>
          <button type="button" onClick={loadMissionData} className="mt-4 rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white">Retry</button>
        </div>
      </OperationsPageLayout>
    );
  }

  const kpiCards = [
    { icon: Shield, value: stats.activeHeroes || 0, label: 'Active heroes (records)', accent: 'navy', sublabel: 'Application profile records' },
    { icon: Heart, value: stats.activeSupporters || 0, label: 'Active supporters (records)', accent: 'brass', sublabel: 'Application profile records' },
    { icon: Building2, value: stats.activeOrganizations || 0, label: 'Organizations (records)', accent: 'champagne', sublabel: 'No partnership implied' },
    { icon: Package, value: stats.packagesInProgress || 0, label: 'Package requests in progress', accent: 'brass', sublabel: 'Recorded request statuses' },
    { icon: CheckCircle2, value: stats.packagesRecordedComplete || 0, label: 'Requests marked complete', accent: 'mint', sublabel: 'Not carrier/recipient confirmed' },
    { icon: DollarSign, value: 'Not verified', label: 'Funds distribution', accent: 'mint', sublabel: 'No reconciled HeroBox ledger' },
    { icon: ArrowUpRight, value: stats.pendingWithdrawals || 0, label: 'Pending withdrawals', accent: 'crimson', sublabel: 'Pending records returned' },
    { icon: FileText, value: stats.pendingReviews || 0, label: 'Pending reviews', accent: 'brass', sublabel: 'Pending request records' },
  ];

  const statusItems = [
    { icon: Users, count: missionStatus.heroesAwaiting || 0, label: 'Heroes awaiting review', to: '/operations/members' },
    { icon: Clock, count: missionStatus.requestsPending || 0, label: 'Requests pending', to: '/operations/service-requests' },
    { icon: Package, count: missionStatus.packagesPreparing || 0, label: 'Packages marked approved', to: '/operations/herobox' },
    { icon: Truck, count: missionStatus.packagesMarkedInTransit || 0, label: 'Packages marked in transit', to: '/operations/herobox' },
    { icon: CheckCircle2, count: missionStatus.packagesMarkedComplete || 0, label: 'Packages marked complete', to: '/operations/herobox' },
    { icon: Wifi, count: missionStatus.internetRecords || 0, label: 'Internet sponsorship records', to: '/operations/herobox' },
    { icon: Mail, count: missionStatus.letterRecords || 0, label: 'Letter records', to: '/operations/herobox' },
    { icon: Clock, count: missionStatus.volunteerHoursRecorded || 0, label: 'Volunteer hours recorded', to: '/operations/members' },
  ];

  const urgentCount = queues.filter(q => q.priority === 'high').length;

  return (
    <OperationsPageLayout
      title="HeroBox Mission Control"
      description="Humanitarian operations records and review queues"
      icon={Radar}
      breadcrumb="Mission Control"
      actions={
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
          {urgentCount > 0 ? <AlertTriangle size={14} className="text-crimson" /> : <CheckCircle2 size={14} className="text-gray" />}
          <span className="text-xs font-semibold text-slate-600">{urgentCount > 0 ? `${urgentCount} high-priority record queues` : 'No high-priority records returned'}</span>
        </div>
      }
    >
      <div role="note" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
        Counts reflect application records only. Package statuses are not independently verified by carriers or recipients. Financial distribution is withheld until a reconciled ledger and authorized payout provider exist.
      </div>

      <div className="mb-6">
        <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-gray">Executive Overview</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {kpiCards.map((card, i) => <MissionKpiCard key={i} {...card} />)}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-gray">Recorded Mission Status</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statusItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
                <Link to={item.to} className="group block rounded-2xl border border-slate-200 bg-white p-3.5 text-center transition-all hover:shadow-sm">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-navy/5">
                    <Icon size={15} className="text-navy/60" />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-foreground">{item.count}</p>
                  <p className="mt-0.5 text-[10px] text-gray">{item.label}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-gray">Operational Queues</h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {queues.map((queue, i) => {
              const Icon = queue.icon;
              const priorityColor = queue.priority === 'high' ? 'text-crimson' : queue.priority === 'medium' ? 'text-brass' : 'text-gray/50';
              return (
                <motion.div key={queue.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                  <Link to={queue.to} className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-slate-50/50">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${queue.color}`}><Icon size={17} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{queue.title}</p>
                      <p className={`text-[10px] font-semibold capitalize ${priorityColor}`}>{queue.priority} priority</p>
                    </div>
                    <span className="flex-shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{queue.count}</span>
                    <ChevronRight size={16} className="flex-shrink-0 text-gray/30 transition-colors group-hover:text-navy" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-wider text-gray">Recent Recorded Activity</h3>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray">No recent activity records returned</p>
              </div>
            ) : recentActivity.map((activity, i) => {
              const meta = ACTIVITY_META[activity.activity_type] || { icon: Radar, color: 'text-gray', bg: 'bg-slate-100', label: 'Recorded activity' };
              const Icon = meta.icon;
              return (
                <motion.div key={activity.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }} className="flex items-center gap-3 p-3.5">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${meta.bg}`}><Icon size={15} className={meta.color} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{activity.title || meta.label}</p>
                    <p className="text-[10px] text-gray">{meta.label} · {activity.created_date && Number.isFinite(new Date(activity.created_date).getTime()) ? new Date(activity.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date not supplied'}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </OperationsPageLayout>
  );
}
