import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { FolderOpen, Download } from 'lucide-react';

export default function OperationsDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const docs = await base44.entities.Document.list('-created_date', 100);
        setDocuments(docs);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  function handleDownload(doc) {
    if (!doc.file_url) return;
    window.open(doc.file_url, '_blank');
  }

  return (
    <OperationsPageLayout title="Documents" description="All member documents, statements, and archived records" icon={FolderOpen}>
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="vantoris-card p-12 text-center">
          <FolderOpen size={32} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium mb-1">No documents yet</p>
          <p className="text-[#AAB4C3] text-sm">Member documents and generated statements will appear here.</p>
        </div>
      ) : (
        <div className="vantoris-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#242D38] bg-[#1a2535]">
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Title</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Reference</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-3 text-white font-medium text-xs">{doc.title}</td>
                  <td className="px-5 py-3 text-[#AAB4C3] text-xs capitalize">{doc.type.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-[#AAB4C3] text-xs font-mono">{doc.reference_number || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-5 py-3 text-[#AAB4C3] text-xs">{doc.created_date.split('T')[0]}</td>
                  <td className="px-5 py-3">
                    {doc.file_url && (
                      <button onClick={() => handleDownload(doc)} className="flex items-center gap-1 px-2.5 py-1 bg-[#242D38] text-[#AAB4C3] rounded-lg text-xs hover:text-white transition-all">
                        <Download size={10} /> View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OperationsPageLayout>
  );
}