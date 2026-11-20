import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, FileText, ExternalLink, BellRing, Trash2, CheckSquare, Square } from 'lucide-react';
import { logAuditEntry } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';

// Financial and identity mutations stay disabled until a trusted server workflow is integrated.
const SERVER_OPERATIONS_MUTATIONS_ENABLED = false;

export default function AdminKYC() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast } = useToast();

  useEffect(() => { loadApps(); }, []);

  async function loadApps() {
    const apps = await base44.entities.Application.filter({}, '-created_date', 50);
    setApplications(apps);
    setLoading(false);
  }

  async function handleAction(status) {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    if (!selected) return;
    setSubmitting(true);
    try {
      await base44.entities.Application.update(selected.id, {
        kyc_status: status,
        kyc_notes: notes,
      });
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: status === 'approved' ? 'KYC Approved' : 'KYC Review Required',
        message: status === 'approved'
          ? 'Your identity verification has been approved. Your application is now under final review.'
          : `Your identity verification requires additional attention. ${notes || ''}`,
        type: status === 'approved' ? 'success' : 'warning',
      });
      await logAuditEntry({
        action_type: status === 'approved' ? 'kyc_approved' : 'kyc_rejected',
        description: `KYC ${status} for ${selected.full_name}`,
        details: `Notes: ${notes || 'None'}`,
        target_user_id: selected.user_id,
      });
      setSelected(null);
      setNotes('');
      loadApps();
      toast({ title: `KYC ${status}`, description: `${selected.full_name}'s KYC has been ${status}.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'KYC action failed', description: e.message || 'Unable to update KYC status.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function handleDeleteKyc() {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    if (!selected) return;
    setSubmitting(true);
    try {
      await base44.entities.Application.update(selected.id, {
        kyc_status: 'not_started',
        kyc_documents: [],
        kyc_notes: notes || 'Documents cleared by admin. Please re-upload valid identity documents.',
      });
      await base44.entities.Notification.create({
        user_id: selected.user_id,
        title: 'KYC Documents Reset',
        message: 'Your submitted identity documents were not accepted and have been cleared. Please re-upload valid documents to continue your verification.',
        type: 'action',
        link: '/apply/kyc',
      });
      await logAuditEntry({
        action_type: 'kyc_rejected',
        description: `KYC documents deleted/reset for ${selected.full_name}`,
        details: `Documents cleared by admin. Notes: ${notes || 'None'}`,
        target_user_id: selected.user_id,
      });
      setSelected(null);
      setNotes('');
      loadApps();
      toast({ title: 'KYC documents reset', description: `${selected.full_name}'s documents have been cleared for re-upload.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reset failed', description: e.message || 'Unable to reset KYC documents.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function handleSendKycReminders() {
    setSendingReminders(true);
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const staleApps = applications.filter(
        a => a.kyc_status === 'pending' && new Date(a.created_date) < threeDaysAgo
      );
      let sent = 0;
      for (const app of staleApps) {
        await base44.entities.Notification.create({
          user_id: app.user_id,
          title: 'KYC Documents Required',
          message: 'Your KYC verification has been pending for over 3 days. Please upload your identity documents to complete your application.',
          type: 'action',
          link: '/apply/kyc',
        });
        sent++;
      }
      setReminderResult({ sent, total: staleApps.length });
      toast({ title: 'Reminders sent', description: `${sent} KYC reminder${sent !== 1 ? 's' : ''} sent.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reminders failed', description: e.message || 'Unable to send reminders.', variant: 'destructive' });
    }
    setSendingReminders(false);
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    const pendingApps = applications.filter(a => a.kyc_status !== 'approved');
    if (selectedIds.length === pendingApps.length) setSelectedIds([]);
    else setSelectedIds(pendingApps.map(a => a.id));
  }

  async function approveOne(app) {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    await base44.entities.Application.update(app.id, { kyc_status: 'approved' });
    await base44.entities.Notification.create({
      user_id: app.user_id,
      title: 'KYC Approved',
      message: 'Your identity verification has been approved. Your application is now under final review.',
      type: 'success',
    });
    await logAuditEntry({
      action_type: 'kyc_approved',
      description: `KYC approved for ${app.full_name}`,
      target_user_id: app.user_id,
    });
  }

  async function rejectOne(app) {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    await base44.entities.Application.update(app.id, { kyc_status: 'rejected' });
    await base44.entities.Notification.create({
      user_id: app.user_id,
      title: 'KYC Review Required',
      message: 'Your identity verification requires additional attention. Please review the feedback and resubmit.',
      type: 'warning',
    });
    await logAuditEntry({
      action_type: 'kyc_rejected',
      description: `KYC rejected for ${app.full_name}`,
      target_user_id: app.user_id,
    });
  }

  async function handleBulkApprove() {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    if (selectedIds.length === 0) return;
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const app = applications.find(a => a.id === id);
      if (app) {
        try { await approveOne(app); ok++; } catch (e) { console.error('Bulk approve failed for', id, e); fail++; }
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadApps();
    toast({ title: 'Bulk approve complete', description: `${ok} approved${fail > 0 ? `, ${fail} failed` : ''}.` });
    setSubmitting(false);
  }

  async function handleBulkReject() {
    if (!SERVER_OPERATIONS_MUTATIONS_ENABLED) {
      toast({ title: 'Action unavailable', description: 'This operation is blocked until a trusted server-side workflow with authorization, ledger validation, and audit logging is connected. No record or balance was changed.', variant: 'destructive' });
      return;
    }

    if (selectedIds.length === 0) return;
    setSubmitting(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      const app = applications.find(a => a.id === id);
      if (app) {
        try { await rejectOne(app); ok++; } catch (e) { console.error('Bulk reject failed for', id, e); fail++; }
      }
    }
    setSelectedIds([]);
    setBulkMode(false);
    loadApps();
    toast({ title: 'Bulk reject complete', description: `${ok} rejected${fail > 0 ? `, ${fail} failed` : ''}.` });
    setSubmitting(false);
  }

  const kycApps = applications.filter(a => a.kyc_status !== 'approved');

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">KYC Review</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">Verify member identity documents</p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSendKycReminders}
            disabled={sendingReminders}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brass/15 text-brass rounded-xl text-sm font-medium hover:bg-brass/25 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            <BellRing size={16} /> {sendingReminders ? 'Sending...' : 'Send Reminders'}
          </button>
          {reminderResult && (
            <span className="text-[#AAB4C3] text-sm">
              {reminderResult.sent > 0
                ? `✓ Sent ${reminderResult.sent} reminder${reminderResult.sent > 1 ? 's' : ''}`
                : 'No stale KYC applications found'}
            </span>
          )}
        </div>
        {kycApps.length > 0 && (
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds([]); }}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${bulkMode ? 'bg-brass/15 text-brass' : 'bg-[#242D38] text-[#AAB4C3] hover:text-white'}`}
          >
            <CheckSquare size={14} /> Bulk Review
          </button>
        )}
      </div>

      {bulkMode && selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 p-4 bg-brass/10 rounded-lg border border-brass/20">
          <span className="text-[#AAB4C3] text-xs">{selectedIds.length} selected</span>
          <button onClick={handleBulkApprove} disabled={submitting} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-olive text-white rounded-xl text-xs font-semibold hover:bg-olive/80 transition-all disabled:opacity-40 whitespace-nowrap">
            <Check size={14} /> Approve
          </button>
          <button onClick={handleBulkReject} disabled={submitting} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-crimson text-white rounded-xl text-xs font-semibold hover:bg-crimson/80 transition-all disabled:opacity-40 whitespace-nowrap">
            <X size={14} /> Reject
          </button>
        </div>
      )}

      <div className="vantoris-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              {bulkMode && (
                <th className="px-3 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-[#AAB4C3] hover:text-brass">
                    {selectedIds.length === kycApps.length && kycApps.length > 0 ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                  </button>
                </th>
              )}
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Applicant</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Documents</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">KYC Status</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {kycApps.map(app => (
              <tr key={app.id} className={`border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all ${selectedIds.includes(app.id) ? 'bg-brass/5' : ''}`}>
                {bulkMode && (
                  <td className="px-3 py-4">
                    <button onClick={() => toggleSelect(app.id)} className="text-[#AAB4C3] hover:text-brass">
                      {selectedIds.includes(app.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                    </button>
                  </td>
                )}
                <td className="px-5 py-4">
                  <p className="text-white font-medium">{app.full_name}</p>
                  <p className="text-[#AAB4C3] text-xs">{app.email}</p>
                </td>
                <td className="px-5 py-4 text-white">{app.account_type}</td>
                <td className="px-5 py-4">
                  <span className="text-[#AAB4C3] text-xs">{(app.kyc_documents || []).length} document(s)</span>
                </td>
                <td className="px-5 py-4"><StatusBadge status={app.kyc_status} /></td>
                <td className="px-5 py-4">
                  {bulkMode ? (
                    <button onClick={() => toggleSelect(app.id)} className="text-[#AAB4C3] hover:text-brass">
                      {selectedIds.includes(app.id) ? <CheckSquare size={16} className="text-brass" /> : <Square size={16} />}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelected(app)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        app.kyc_status === 'rejected'
                          ? 'bg-crimson/15 text-red-400 hover:bg-crimson/25'
                          : app.kyc_status === 'not_started'
                            ? 'bg-olive/15 text-emerald-400 hover:bg-olive/25'
                            : 'bg-brass/15 text-brass hover:bg-brass/25'
                      }`}
                    >
                      {app.kyc_status === 'rejected' ? 'Re-review' : app.kyc_status === 'not_started' ? 'Force Approve' : 'Review'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {kycApps.length === 0 && (
              <tr>
                <td colSpan={bulkMode ? 6 : 5} className="py-12 text-center text-[#AAB4C3]">No KYC submissions to review</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">KYC Document Review</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="vantoris-card p-4">
                <p className="text-white font-medium">{selected.full_name}</p>
                <p className="text-[#AAB4C3] text-xs">{selected.email}</p>
              </div>

              {/* Documents */}
              <div>
                <p className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-2">Submitted Documents</p>
                {(selected.kyc_documents || []).length > 0 ? (
                  <div className="space-y-2">
                    {selected.kyc_documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vantoris-card p-3 flex items-center gap-3 hover:border-brass/30 transition-all"
                      >
                        <FileText size={16} className="text-brass" />
                        <span className="text-white text-sm flex-1">Document {i + 1}</span>
                        <ExternalLink size={14} className="text-[#AAB4C3]" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#AAB4C3] text-sm">No documents uploaded</p>
                )}
              </div>

              <div>
                <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Review Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              {selected.kyc_status === 'rejected' && (selected.kyc_documents || []).length > 0 && (
                <button
                  onClick={handleDeleteKyc}
                  disabled={submitting}
                  className="w-full py-2.5 border border-crimson/40 text-red-400 rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/10 transition-all disabled:opacity-40 text-xs font-medium"
                >
                  <Trash2 size={14} /> Delete Documents &amp; Reset
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={submitting}
                  className="flex-1 py-3 bg-olive text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-olive/80 transition-all disabled:opacity-40"
                >
                  <Check size={16} /> Approve KYC
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  disabled={submitting}
                  className="flex-1 py-3 bg-crimson text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-crimson/80 transition-all disabled:opacity-40"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}