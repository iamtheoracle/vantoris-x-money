import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Check, FileText, ShieldCheck } from 'lucide-react';

export default function ApplyKYC() {
  const [application, setApplication] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const me = await base44.auth.me();
        const apps = await base44.entities.Application.filter({ user_id: me.id });
        if (apps[0]) {
          setApplication(apps[0]);
          setDocuments(apps[0].kyc_documents || []);
        } else {
          navigate('/apply', { replace: true });
          return;
        }
      } catch (e) {
        console.error(e);
        setError('Unable to load your application. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocuments(prev => [...prev, file_url]);
    } catch (err) {
      console.error(err);
      setError('File upload failed. Please try again.');
    }
    setUploading(false);
  }

  async function handleSubmit() {
    if (!application) return;
    setSubmitting(true);
    try {
      await base44.entities.Application.update(application.id, {
        kyc_status: 'pending',
        kyc_documents: documents,
      });
      setDone(true);
    } catch (e) {
      console.error(e);
      setError('Failed to submit documents. Please try again.');
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="px-5 pt-6 min-h-screen flex flex-col items-center justify-center">
        <div className="vantoris-card p-8 text-center w-full max-w-sm">
          <div className="w-16 h-16 rounded-full bg-olive/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Documents Submitted</h2>
          <p className="text-[#AAB4C3] text-sm mb-6">Your identity verification is under review. We'll notify you once it's processed.</p>
          <button onClick={() => navigate('/')} className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 min-h-screen">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#AAB4C3] text-sm mb-6">
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Identity Verification</h1>
      <p className="text-[#AAB4C3] text-sm mb-4">A verified identity package is required before any share is opened or any transfer is released.</p>

      <div className="vantoris-card p-5 mb-4 bg-[#0B2342]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-brass">Membership</p>
        <h2 className="text-lg font-semibold text-white mt-2">A member-owned share institution</h2>
        <p className="text-[#AAB4C3] text-sm mt-2">American Vanguard Credit Union holds shares for its members. The house mark is the membership. Shares, statements, and transfers in this application come from its own ledger. Charter and insurance are not stated here.</p>
      </div>
      {error && (
        <div className="vantoris-card p-3 mb-4 border-crimson/30 bg-crimson/5">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}
      {application?.kyc_status === 'rejected' && (
        <div className="vantoris-card p-3 mb-4 border-crimson/30 bg-crimson/5">
          <p className="text-red-400 text-xs">Your previous submission was rejected. Please re-upload valid documents to continue.</p>
        </div>
      )}

      <div className="vantoris-card p-5 mb-4">
        <h3 className="text-white font-medium text-sm mb-3">Required Documents</h3>
        <ul className="space-y-2 text-[#AAB4C3] text-xs">
          <li className="flex items-center gap-2"><FileText size={14} /> Government-issued photo ID (driver’s license, passport, or state ID)</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Proof of address (utility bill or bank statement, dated within 90 days)</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Selfie for liveness match</li>
          <li className="flex items-center gap-2"><FileText size={14} /> Legal name, date of birth, and country of document</li>
        </ul>
        <p className="text-[11px] text-[#AAB4C3]/70 mt-3">Documents are stored for review. A connected identity provider is required before any package is marked verified. Membership approval is separate from identity review.</p>
      </div>

      {/* Upload area */}
      <div className="vantoris-card p-5 mb-4">
        <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#242D38] rounded-xl cursor-pointer hover:border-brass/30 transition-all">
          <Upload size={28} className="text-[#AAB4C3] mb-2" />
          <p className="text-white text-sm font-medium">{uploading ? 'Uploading...' : 'Upload Document'}</p>
          <p className="text-[#AAB4C3] text-xs mt-1">PDF, JPG, or PNG up to 25MB</p>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {documents.length > 0 && (
        <div className="vantoris-card p-4 mb-4">
          <h3 className="text-white font-medium text-sm mb-3">Uploaded ({documents.length})</h3>
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-[#242D38]/40 last:border-0">
              <Check size={14} className="text-emerald-400" />
              <span className="text-[#AAB4C3] text-xs truncate flex-1">Document {i + 1}</span>
              <button
                onClick={() => setDocuments(prev => prev.filter((_, idx) => idx !== i))}
                className="text-red-400/70 hover:text-red-400 text-xs"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        disabled={documents.length === 0 || submitting}
        onClick={handleSubmit}
        className="w-full py-3.5 bg-brass text-[#0E1A2B] font-semibold rounded-xl hover:bg-brass/90 transition-all disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit for Verification'}
      </button>
    </div>
  );
}