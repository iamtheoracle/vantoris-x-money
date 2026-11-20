import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, Sparkles, Phone } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { BUSINESS_WHATSAPP_DISPLAY, SUPPORT_EMAIL } from '@/lib/businessConfig';

const TONES = {
  blue: { icon: 'text-brass', bg: 'bg-brass/12' },
  green: { icon: 'text-mint', bg: 'bg-mint/12' },
  champagne: { icon: 'text-champagne', bg: 'bg-champagne/12' },
  gray: { icon: 'text-gray', bg: 'bg-white/[0.06]' },
};

function SupportCard({ icon: Icon, title, detail, tone = 'blue', ...props }) {
  const t = TONES[tone] || TONES.blue;
  const Component = props.href ? 'a' : 'button';

  return (
    <Component
      {...props}
      className="vantoris-glass-flat p-4 text-left hover:border-brass/20 transition-all"
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${t.bg}`}>
        <Icon size={18} className={t.icon} />
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-1 break-words text-xs text-gray">{detail}</p>
    </Component>
  );
}

export default function OnboardingSupport() {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();

  return (
    <section className="mt-5">
      <div className="mb-3">
        <p className="text-sm font-bold text-white">Need help? We are here for you</p>
        <p className="mt-1 text-xs text-gray">Get onboarding support from Vantoris through your preferred channel.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SupportCard
          type="button"
          icon={Sparkles}
          title="Vantoris Advisor"
          detail="AI onboarding assistant"
          tone="blue"
          onClick={() => navigate('/advisor')}
        />
        <SupportCard
          icon={MessageCircle}
          title="WhatsApp"
          detail="Chat with support"
          tone="green"
          href={whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris, I need help with my onboarding.')}
          target="_blank"
          rel="noopener noreferrer"
        />
        <SupportCard
          icon={Mail}
          title="Email"
          detail={SUPPORT_EMAIL}
          tone="champagne"
          href={`mailto:${SUPPORT_EMAIL}`}
        />
        <SupportCard
          icon={Phone}
          title="Call Us"
          detail={BUSINESS_WHATSAPP_DISPLAY}
          tone="gray"
          href={`tel:${BUSINESS_WHATSAPP_DISPLAY.replace(/[^0-9+]/g, '')}`}
        />
      </div>
    </section>
  );
}