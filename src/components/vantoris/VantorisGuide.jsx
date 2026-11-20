import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageCircle, Mail, Phone, HelpCircle, ChevronRight } from 'lucide-react';
import { useWhatsAppConfig, whatsappLinkFromConfig } from '@/hooks/useWhatsAppConfig';
import { BUSINESS_WHATSAPP_DISPLAY, SUPPORT_EMAIL } from '@/lib/businessConfig';

export default function VantorisGuide() {
  const whatsappNumber = useWhatsAppConfig();
  const navigate = useNavigate();

  const guides = [
    {
      icon: Sparkles,
      label: 'Vantoris Advisor',
      desc: 'AI-guided onboarding & account help',
      color: 'text-brass',
      bg: 'bg-brass/12',
      onClick: () => navigate('/advisor'),
    },
    {
      icon: MessageCircle,
      label: 'WhatsApp Support',
      desc: `Chat · ${BUSINESS_WHATSAPP_DISPLAY}`,
      color: 'text-mint',
      bg: 'bg-mint/12',
      href: whatsappLinkFromConfig(whatsappNumber, 'Hello Vantoris Support, I need guidance.'),
    },
    {
      icon: Mail,
      label: 'Email Us',
      desc: SUPPORT_EMAIL,
      color: 'text-champagne',
      bg: 'bg-champagne/12',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: Phone,
      label: 'Call Support',
      desc: BUSINESS_WHATSAPP_DISPLAY,
      color: 'text-gray',
      bg: 'bg-slate-100',
      href: `tel:${BUSINESS_WHATSAPP_DISPLAY.replace(/[^0-9+]/g, '')}`,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={16} className="text-brass" />
        <h3 className="text-foreground font-semibold text-sm">Vantoris Guide</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {guides.map((g, i) => {
          const Icon = g.icon;
          const content = (
            <>
              <div className={`w-10 h-10 rounded-xl ${g.bg} flex items-center justify-center mb-2`}>
                <Icon size={20} className={g.color} />
              </div>
              <p className="text-foreground font-medium text-sm">{g.label}</p>
              <p className="text-gray text-xs">{g.desc}</p>
            </>
          );
          if (g.href) {
            return (
              <a key={i} href={g.href} target="_blank" rel="noopener noreferrer" className="vantoris-glass-flat p-4 text-left hover:border-brass/25 transition-all">
                {content}
              </a>
            );
          }
          return (
            <button key={i} onClick={g.onClick} className="vantoris-glass-flat p-4 text-left hover:border-brass/25 transition-all">
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}