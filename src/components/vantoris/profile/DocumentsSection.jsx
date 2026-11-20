import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Receipt, ShieldCheck } from 'lucide-react';
import SectionTitle from './SectionTitle';

const DOC_ICONS = {
  statement: { icon: Receipt, color: 'text-navy', bg: 'bg-navy/8' },
  kyc_document: { icon: ShieldCheck, color: 'text-mint', bg: 'bg-mint/10' },
  tax_document: { icon: FileText, color: 'text-brass', bg: 'bg-brass/10' },
  agreement: { icon: FileText, color: 'text-gray', bg: 'bg-slate-100' },
  other: { icon: FileText, color: 'text-gray', bg: 'bg-slate-100' },
};

const DOC_LABELS = {
  statement: 'Statement',
  kyc_document: 'Verification',
  tax_document: 'Tax Document',
  agreement: 'Agreement',
  other: 'Document',
};

export default function DocumentsSection({ documents }) {
  if (!documents || documents.length === 0) return null;
  const activeDocs = documents.filter(d => d.status !== 'archived' && d.file_url);
  if (activeDocs.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <SectionTitle icon={FileText} title="Documents" />
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
        {activeDocs.slice(0, 8).map(doc => {
          const cfg = DOC_ICONS[doc.type] || DOC_ICONS.other;
          const Icon = cfg.icon;
          return (
            <a
              key={doc.id}
              href={doc.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 hover:bg-slate-50/50 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon size={15} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium truncate">{doc.title}</p>
                <p className="text-gray text-[10px]">
                  {DOC_LABELS[doc.type] || 'Document'}
                  {doc.reference_number && ` · ${doc.reference_number}`}
                </p>
              </div>
              <Download size={14} className="text-gray/40 group-hover:text-navy transition-colors flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </motion.div>
  );
}