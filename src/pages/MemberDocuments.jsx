import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import { FolderOpen, Download, FileText } from 'lucide-react';

export default function MemberDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const docs = await base44.entities.Document.filter({ user_id: me.id }, '-created_date', 50);
        setDocuments(docs);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldLogo size={28} />
          <h1 className="text-white font-bold text-xl">Documents</h1>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <FolderOpen size={28} className="text-[#AAB4C3] mx-auto mb-3 opacity-50" />
          <p className="text-white font-medium text-sm mb-1">No documents yet</p>
          <p className="text-[#AAB4C3] text-xs">
            Your statements and documents will appear here. Generate a statement from any account detail page.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="vantoris-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brass/15 flex items-center justify-center">
                  <FileText size={16} className="text-brass" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{doc.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[#AAB4C3] text-xs">{doc.created_date.split('T')[0]}</p>
                    {doc.reference_number && (
                      <p className="text-brass text-[10px] font-mono">{doc.reference_number}</p>
                    )}
                  </div>
                </div>
              </div>
              {doc.file_url && (
                <button
                  onClick={() => window.open(doc.file_url, '_blank')}
                  className="w-9 h-9 rounded-xl bg-[#242D38] flex items-center justify-center text-[#AAB4C3] hover:text-white transition-all"
                >
                  <Download size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}