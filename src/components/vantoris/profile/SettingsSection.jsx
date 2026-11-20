import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  User, Shield, LogOut, Trash2, Copy, Check,
  Gift, Bell, MessageCircle, ShieldCheck, Settings,
} from 'lucide-react';
import ProfileSection, { ProfileRow, ProfileDivider } from '@/components/vantoris/profile/ProfileSection';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { hasOperationsAccess } from '@/lib/operationsAccess';

export default function SettingsSection({ user, referralLink, onDeleteAccount }) {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const isMember = user.role === 'user';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
      {/* Communication */}
      <ProfileSection title="Communication" icon={Bell} delay={0.1}>
        <ProfileRow icon={Bell} iconColor="text-brass" iconBg="bg-brass/10" label="Messages" value="Secure messages" onClick={() => navigate('/messages')} />
        <ProfileDivider />
        <ProfileRow
          icon={MessageCircle}
          iconColor="text-mint"
          iconBg="bg-mint/10"
          label="WhatsApp Support"
          value="Chat with us directly"
          onClick={() => window.open(
            whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I have a question regarding my account.'),
            '_blank', 'noopener,noreferrer'
          )}
        />
      </ProfileSection>

      {/* Advisory & Services — members only */}
      {isMember && (
        <ProfileSection title="Advisory & Services" icon={ShieldCheck} delay={0.15}>
          <ProfileRow icon={ShieldCheck} iconColor="text-brass" iconBg="bg-brass/10" label="Vantoris Advisor" value="Your personal AI financial assistant" onClick={() => navigate('/advisor')} />
          <ProfileDivider />
          <ProfileRow icon={Settings} iconColor="text-brass" iconBg="bg-brass/10" label="Services" value="Manage banking services" onClick={() => navigate('/services')} />
        </ProfileSection>
      )}

      {/* Referral Program — members only */}
      {isMember && (
        <ProfileSection title="Referral Program" icon={Gift} delay={0.2}>
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brass/10 flex items-center justify-center">
                <Gift size={16} className="text-brass" />
              </div>
              <div>
                <p className="text-foreground text-sm font-medium">Refer a Friend</p>
                <p className="text-gray text-xs">Share your invite link</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
              <span className="text-gray text-xs flex-1 truncate selectable-content">{referralLink}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-brass/15 text-brass rounded-lg text-xs font-medium hover:bg-brass/25 transition-all flex-shrink-0"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </ProfileSection>
      )}

      {/* Operations Center access — role-gated */}
      {hasOperationsAccess(user.role) && (
        <ProfileSection title="Staff Access" icon={Shield} delay={0.25}>
          <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Operations Center" value="Staff access" onClick={() => navigate('/operations')} />
        </ProfileSection>
      )}

      {/* Account Management */}
      <ProfileSection title="Account Management" icon={LogOut} delay={0.3}>
        <ProfileRow icon={User} iconColor="text-brass" iconBg="bg-brass/10" label="Personal Information" value={user.email} onClick={() => {}} />
        <ProfileDivider />
        <ProfileRow icon={Shield} iconColor="text-brass" iconBg="bg-brass/10" label="Security & Access" value="Manage your credentials" onClick={() => {}} />
        <ProfileDivider />
        <ProfileRow icon={LogOut} label="Sign Out" onClick={() => base44.auth.logout('/')} danger />
        <ProfileDivider />
        <ProfileRow icon={Trash2} label="Delete Account" onClick={onDeleteAccount} danger />
      </ProfileSection>
    </motion.div>
  );
}