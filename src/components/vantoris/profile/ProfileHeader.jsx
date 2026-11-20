import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, MessageCircle, Bell, Crown, Award, Star, User } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';

const TIER_CONFIG = {
  'Private Client': { icon: Crown, color: 'bg-navy text-white' },
  'Premier': { icon: Award, color: 'bg-brass/15 text-brass' },
  'Preferred': { icon: Star, color: 'bg-mint/10 text-mint' },
  'Member': { icon: User, color: 'bg-slate-100 text-gray' },
};

export default function ProfileHeader({ user, application, profileCompletion, bankingTier }) {
  const whatsappNumber = useWhatsAppConfig();
  const kycStatus = application?.kyc_status || 'not_started';
  const isVerified = kycStatus === 'approved';
  const memberSince = user.created_date
    ? new Date(user.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    : null;

  const tier = TIER_CONFIG[bankingTier] || TIER_CONFIG['Member'];
  const TierIcon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="vantoris-glass-premium p-5 mb-4 relative overflow-hidden"
    >
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-brass/[0.04] blur-3xl" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/20 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-[68px] h-[68px] rounded-2xl bg-gradient-to-br from-navy to-navy/80 border border-navy/15 flex items-center justify-center shadow-premium">
              <span className="text-white text-2xl font-bold">
                {(user.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-mint border-[3px] border-white flex items-center justify-center shadow-sm">
                <ShieldCheck size={13} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-foreground font-bold text-xl truncate tracking-tight">{user.full_name || 'Member'}</h1>
            <p className="text-gray text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tier.color}`}>
                <TierIcon size={10} strokeWidth={2.5} />
                {bankingTier}
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mint/10 text-mint rounded-md text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck size={10} strokeWidth={2.5} /> Verified
                </span>
              ) : kycStatus === 'pending' ? (
                <span className="px-2 py-0.5 bg-brass/10 text-brass rounded-md text-[10px] font-bold uppercase tracking-wider">Pending KYC</span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 text-gray rounded-md text-[10px] font-bold uppercase tracking-wider">Unverified</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
          {memberSince && (
            <div className="flex items-center gap-1.5 text-gray">
              <Calendar size={12} />
              <span className="text-xs">Member since {memberSince}</span>
            </div>
          )}
          <div className="flex-1" />
          <button
            onClick={() => window.open(
              whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
              '_blank', 'noopener,noreferrer'
            )}
            className="w-9 h-9 rounded-xl bg-mint/10 flex items-center justify-center hover:bg-mint/20 transition-colors"
            title="WhatsApp Support"
          >
            <MessageCircle size={15} className="text-mint" />
          </button>
          <Link to="/messages" className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center hover:bg-navy/12 transition-colors" title="Messages">
            <Bell size={15} className="text-navy" />
          </Link>
        </div>

        {profileCompletion < 100 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray text-[10px] font-medium uppercase tracking-wider">Profile Completion</span>
              <span className="text-foreground text-[10px] font-bold">{profileCompletion}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brass to-brass/80 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}