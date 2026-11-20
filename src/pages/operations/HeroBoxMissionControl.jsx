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
import { formatCurrency } from '@/lib/formatCurrency';

const ACTIVITY_META = {
  sponsored: { icon: Heart, color: 'text-brass', bg: 'bg-brass/12', label: 'Sponsored' },
  request_approved: { icon: CheckCircle2, color: 'text-mint', bg: 'bg-mint/12', label: 'Approved' },
  package_delivered: { icon: Package, color: 'text-mint', bg: 'bg-mint/12', label: 'Delivered' },
  letter_received: { icon: Mail, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Letter' },
  impact_report: { icon: TrendingUp, color: 'text-navy', bg: 'bg-navy/8', label: 'Impact' },
  volunteer_hours: { icon: Clock, color: 'text-gray', bg: 'bg-slate-100', label: 'Volunteer' },
  internet_sponsored: { icon: Wifi, color: 'text-champagne', bg: 'bg-champagne/12', label: 'Internet' },
  community_update: { icon: Users, color: 'text-navy', bg: 'bg-navy/8', label: 'Community' },
  mission_milestone: { icon: CheckCircle2, color: 'text-brass', bg: 'bg-brass/12', label: 'Milestone' },
};

export default function HeroBoxMissionControl() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(/** @type {any} */ ({}));
  const [missionStatus, setMissionStatus] = useState(/** @type {any} */ ({}));
  const [queues, setQueues] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => { loadMissionData(); }, []);

  async function loadMissionData() {
    try {
      const [profiles, requests, activities, withdrawals, verifications, applications] = await Promise.all([
        base44.entities.HeroBoxProfile.filter({}, '-created_date', 200).catch(() => []),
        base44.entities.HeroBoxRequest.filter({}, '-created_date', 200).catch(() => []),
        base44.entities.HeroBoxActivity.filter({}, '-created_date', 100).catch(() => []),
        base44.entities.WithdrawalRequest.filter({ status: 'pending' }).catch(() => []),
        base44.entities.VerificationRequest.filter({ status: 'pending' }).catch(() => []),
        base44.entities.Application.filter({ application_status: 'pending' }).catch(() => []),
      ]);

      const activeHeroes = profiles.filter(p => p.role === 'hero' && p.status === 'active').length;
      const activeSupporters = profiles.filter(p => p.role === 'sponsor' && p.status === 'active').length;
      const activeOrganizations = profiles.filter(p => p.role === 'organization' && p.status === 'active').length;
      const pendingHeroes = profiles.filter(p => p.role === 'hero' && p.status === 'pending').length;
      const packagesInProgress = requests.filter(r => r.request_type === 'care_package' && ['pending', 'under_review', 'approved', 'in_progress'].includes(r.status)).length;
      const packagesDelivered = requests.filter(r => ['delivered', 'completed'].includes(r.status)).length;
      const fundsDistributed = activities.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const pendingReviews = requests.filter(r => ['pending', 'under_review'].includes(r.status)).length;

      setStats({
        activeHeroes, activeSupporters, activeOrganizations,
        packagesInProgress, packagesDelivered, fundsDistributed,
        pendingWithdrawals: withdrawals.length, pendingReviews,
      });

      setMissionStatus({
        heroesAwaiting: pendingHeroes,
        requestsPending: requests.filter(r => r.status === 'pending').length,
        packagesPreparing: requests.filter(r => r.status === 'approved').length,
        packagesShipped: requests.filter(r => r.status === 'in_progress').length,
        packagesDelivered,
        internetActive: activities.filter(a => a.activity_type === 'internet_sponsored').length,
        lettersSent: activities.filter(a => a.activity_type === 'letter_received').length,
        volunteerHours: profiles.reduce((sum, p) => sum + (Number(p.volunteer_hours) || 0), 0),
      });

      setQueues([
        { id: 'support', icon: Package, title: 'Support Requests', count: pendingReviews, priority: pendingReviews > 5 ? 'high' : pendingReviews > 0 ? 'medium' : 'normal', to: '/operations/service-requests', color: 'bg-brass/10 text-brass' },
        { id: 'fulfillment', icon: Truck, title: 'Package Fulfillment', count: requests.filter(r => ['approved', 'in_progress'].includes(r.status)).length, priority: 'medium', to: '/operations/herobox', color: 'bg-navy/8 text-navy' },
        { id: 'withdrawals', icon: ArrowUpRight, title: 'Withdrawal Review', count: withdrawals.length, priority: withdrawals.length > 5 ? 'high' : 'normal', to: '/operations/withdrawals', color: 'bg-crimson/10 text-crimson' },
        { id: 'verifications', icon: FileText, title: 'Payment Verification', count: verifications.length, priority: verifications.length > 3 ? 'medium' : 'normal', to: '/operations/verification-requests', color: 'bg-champagne/12 text-champagne' },
        { id: 'kyc', icon: Shield, title: 'KYC Reviews', count: applications.length, priority: applications.length > 5 ? 'high' : 'normal', to: '/operations/kyc', color: 'bg-navy/8 text-navy' },
      ]);

      setRecentActivity(activities.slice(0, 6));
    } catch (e) {
      console.error('Mission data load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { icon: Shield, value: stats.activeHeroes || 0, label: 'Active Heroes', color: 'bg-navy/8 text-navy', to: '/operations/members', delay: 0 },
    { icon: Heart, value: stats.activeSupporters || 0, label: 'Active Supporters', color: 'bg-brass/12 text-brass', to: '/operations/leaderboard', delay: 0.04 },
    { icon: Building2, value: stats.activeOrganizations || 0, label: 'Organizations', color: 'bg-champagne/12 text-champagne', to: '/operations/organizations', delay: 0.08 },
    { icon: Package, value: stats.packagesInProgress || 0, label: 'Packages in Progress', color: 'bg-brass/10 text-brass', to: '/operations/herobox', delay: 0.12 },
    { icon: CheckCircle2, value: stats.packagesDelivered || 0, label: 'Packages Delivered', color: 'bg-mint/10 text-mint', to: '/operations/herobox', delay: 0.16 },
    { icon: DollarSign, value: formatCurrency(stats.fundsDistributed || 0), label: 'Funds Distributed', color: 'bg-mint/10 text-mint', to: '/operations/finance', delay: 0.2 },
    { icon: ArrowUpRight, value: stats.pendingWithdrawals || 0, label: 'Pending Withdrawals', color: 'bg-crimson/10 text-crimson', to: '/operations/withdrawals', delay: 0.24 },
    { icon: FileText, value: stats.pendingReviews || 0, label: 'Pending Reviews', color: 'bg-brass/10 text-brass', to: '/operations/service-requests', delay: 0.28 },
  ];

  const statusItems = [
    { icon: Users, count: missionStatus.heroesAwaiting || 0, label: 'Heroes Awaiting', to: '/operations/members' },
    { icon: Clock, count: missionStatus.requestsPending || 0, label: 'Requests Pending', to: '/operations/service-requests' },
    { icon: Package, count: missionStatus.packagesPreparing || 0, label: 'Being Prepared', to: '/operations/herobox' },
    { icon: Truck, count: missionStatus.packagesShipped || 0, label: 'Shipped', to: '/operations/herobox' },
    { icon: CheckCircle2, count: missionStatus.packagesDelivered || 0, label: 'Delivered', to: '/operations/herobox' },
    { icon: Wifi, count: missionStatus.internetActive || 0, label: 'Internet Active', to: '/operations/herobox' },
    { icon: Mail, count: missionStatus.lettersSent || 0, label: 'Letters Sent', to: '/operations/herobox' },
    { icon: Clock, count: missionStatus.volunteerHours || 0, label: 'Volunteer Hours', to: '/operations/members' },
  ];

  const urgentCount = queues.filter(q => q.priority === 'high').length;

  return (
    <OperationsPageLayout
      title="HeroBox Mission Control"
      description="Humanitarian operations headquarters"
      icon={Radar}
      breadcrumb="Mission Control"
      actions={
        urgentCount > 0 ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-crimson/10 border border-crimson/20 rounded-xl">
            <AlertTriangle size={14} className="text-crimson" />
            <span className="text-crimson text-xs font-semibold">{urgentCount} urgent {urgentCount === 1 ? 'queue' : 'queues'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-mint/10 border border-mint/20 rounded-xl">
            <CheckCircle2 size={14} className="text-mint" />
            <span className="text-mint text-xs font-semibold">All clear</span>
          </div>
        )
      }
    >
      {/* Executive KPI Cards */}
      <div className="mb-6">
        <h3 className="text-gray text-[10px] font-bold uppercase tracking-wider mb-3 px-1">Executive Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {kpiCards.map((card, i) => (
            <MissionKpiCard key={i} {...card} />
          ))}
        </div>
      </div>

      {/* Live Mission Status */}
      <div className="mb-6">
        <h3 className="text-gray text-[10px] font-bold uppercase tracking-wider mb-3 px-1">Live Mission Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}>
                <Link to={item.to} className="block vantoris-glass p-3.5 text-center hover:shadow-float transition-all group">
                  <div className="w-9 h-9 rounded-xl bg-navy/5 flex items-center justify-center mx-auto mb-2">
                    <Icon size={15} className="text-navy/60" />
                  </div>
                  <p className="text-foreground font-bold text-xl tracking-tight">{item.count}</p>
                  <p className="text-gray text-[10px] mt-0.5">{item.label}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operational Queues */}
        <div>
          <h3 className="text-gray text-[10px] font-bold uppercase tracking-wider mb-3 px-1">Operational Queues</h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {queues.map((queue, i) => {
              const Icon = queue.icon;
              const priorityColor = queue.priority === 'high' ? 'text-crimson' : queue.priority === 'medium' ? 'text-brass' : 'text-gray/50';
              return (
                <motion.div key={queue.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.04 }}>
                  <Link to={queue.to} className="flex items-center gap-3 p-3.5 hover:bg-slate-50/50 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl ${queue.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium">{queue.title}</p>
                      <p className={`text-[10px] font-semibold capitalize ${priorityColor}`}>
                        {queue.priority} priority
                      </p>
                    </div>
                    {queue.count > 0 ? (
                      <span className="px-2 py-0.5 bg-crimson/10 text-crimson rounded-md text-xs font-bold flex-shrink-0">{queue.count}</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-mint/10 text-mint rounded-md text-xs font-bold flex-shrink-0">Clear</span>
                    )}
                    <ChevronRight size={16} className="text-gray/30 group-hover:text-navy transition-colors flex-shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Mission Activity */}
        <div>
          <h3 className="text-gray text-[10px] font-bold uppercase tracking-wider mb-3 px-1">Recent Mission Activity</h3>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray text-sm">No recent activity</p>
                <p className="text-gray/50 text-[11px] mt-1">Mission activity will appear here</p>
              </div>
            ) : (
              recentActivity.map((activity, i) => {
                const meta = ACTIVITY_META[activity.activity_type] || ACTIVITY_META.sponsored;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="flex items-center gap-3 p-3.5"
                  >
                    <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={meta.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-gray text-[10px]">
                        {meta.label} · {new Date(activity.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    {activity.amount > 0 && (
                      <span className="text-brass text-xs font-semibold flex-shrink-0">{formatCurrency(activity.amount)}</span>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </OperationsPageLayout>
  );
}