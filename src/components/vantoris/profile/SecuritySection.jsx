import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, History, ChevronRight, AlertTriangle } from 'lucide-react';
import SectionTitle from './SectionTitle';

export default function SecuritySection({ application, auditLogs, notifications }) {
  const kycStatus = application?.kyc_status || 'not_started';
  const isVerified = kycStatus === 'approved';
  const securityAlerts = (notifications || []).filter(n => n.type === 'warning').slice(0, 2);
  const recentAudits = (auditLogs || []).slice(0, 3);

  if (!isVerified && kycStatus === 'not_started' && recentAudits.length === 0 && securityAlerts.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <SectionTitle icon={ShieldCheck} title="Security & Verification" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Verification status */}
        <div className="vantoris-glass-premium p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isVerified ? 'bg-mint/10' : kycStatus === 'pending' ? 'bg-brass/10' : 'bg-crimson/10'
            }`}>
              <ShieldCheck size={18} className={isVerified ? 'text-mint' : kycStatus === 'pending' ? 'text-brass' : 'text-crimson'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray text-[10px] uppercase tracking-wider font-medium">Identity Verification</p>
              <p className="text-foreground font-bold text-sm">
                {isVerified ? 'Verified' : kycStatus === 'pending' ? 'Pending Review' : 'Not Started'}
              </p>
              <p className="text-gray text-[10px] mt-0.5">
                {isVerified ? 'Your identity has been confirmed' : kycStatus === 'pending' ? 'Verification under review' : 'Complete verification to unlock features'}
              </p>
            </div>
          </div>
        </div>

        {/* Recent account activity */}
        {recentAudits.length > 0 && (
          <Link to="/accounts" className="block vantoris-glass-premium p-4 hover:shadow-float transition-all group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                <History size={18} className="text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray text-[10px] uppercase tracking-wider font-medium">Account Activity</p>
                <p className="text-foreground font-bold text-sm">{recentAudits.length} recent {recentAudits.length === 1 ? 'event' : 'events'}</p>
                <p className="text-gray text-[10px] mt-0.5 truncate">{recentAudits[0]?.description}</p>
              </div>
              <ChevronRight size={14} className="text-gray/40 group-hover:text-navy transition-colors flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Security alerts */}
        {securityAlerts.length > 0 && (
          <div className="vantoris-glass-premium p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brass/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-brass" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray text-[10px] uppercase tracking-wider font-medium">Security Alerts</p>
                <p className="text-foreground font-bold text-sm">{securityAlerts.length} active</p>
                <p className="text-gray text-[10px] mt-0.5 truncate">{securityAlerts[0]?.title}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}