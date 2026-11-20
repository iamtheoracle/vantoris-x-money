import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import {
  Bot, CheckCircle2, XCircle, AlertTriangle, FileText,
  ChevronRight, Loader2, Clock, ShieldAlert, Lightbulb, Gavel,
} from 'lucide-react';

const SPECIALIST_LABELS = {
  payments: 'Payments',
  banking: 'Banking',
  compliance: 'Compliance',
  investment: 'Investment',
  document: 'Document',
  credit: 'Credit',
  fraud: 'Fraud',
  platform: 'Platform',
};

const SPECIALIST_ICONS = {
  payments: '💳',
  banking: '🏦',
  compliance: '🛡️',
  investment: '📈',
  document: '📄',
  credit: '💰',
  fraud: '⚠️',
  platform: '⚙️',
};

const CONFIDENCE_STYLES = {
  high: 'bg-mint/10 text-mint border-mint/20',
  medium: 'bg-brass/10 text-brass border-brass/20',
  low: 'bg-crimson/10 text-crimson border-crimson/20',
};

const STATUS_FILTERS = [
  { key: 'pending', label: 'Pending Review', icon: Clock },
  { key: 'escalated', label: 'Escalated', icon: ShieldAlert },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: XCircle },
];

export default function RecommendationReview() {
  const [recommendations, setRecommendations] = useState([]);
  const [workspaces, setWorkspaces] = useState({});
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [selectedRec, setSelectedRec] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    const recs = await base44.entities.AssistantRecommendation.filter(
      { status: activeFilter },
      '-created_date',
      50
    );
    setRecommendations(recs);

    // Fetch related workspaces and members
    const wsIds = [...new Set(recs.map(r => r.workspace_id).filter(Boolean))];
    const userIds = [...new Set(recs.map(r => r.user_id).filter(Boolean))];

    const [wsList, userList] = await Promise.all([
      wsIds.length > 0
        ? base44.entities.CaseWorkspace.filter({ id: { $in: wsIds } })
        : Promise.resolve([]),
      userIds.length > 0
        ? base44.entities.User.filter({ id: { $in: userIds } })
        : Promise.resolve([]),
    ]);

    const wsMap = {};
    wsList.forEach(w => { wsMap[w.id] = w; });
    setWorkspaces(wsMap);

    const memberMap = {};
    userList.forEach(u => { memberMap[u.id] = u; });
    setMembers(memberMap);
  }, [activeFilter]);

  useEffect(() => {
    loadData().catch(e => {
      toast({ title: 'Failed to load recommendations', description: e.message, variant: 'destructive' });
    }).finally(() => setLoading(false));
  }, [loadData]);

  async function handleAction(recId, action) {
    setActionLoading(true);
    try {
      const me = await base44.auth.me();
      const now = new Date().toISOString();
      await base44.entities.AssistantRecommendation.update(recId, {
        status: action,
        reviewer_id: me.id,
        reviewer_name: me.full_name,
        review_notes: reviewNotes,
        reviewed_date: now,
      });

      // Update workspace status
      const rec = recommendations.find(r => r.id === recId);
      if (rec?.workspace_id) {
        const ws = workspaces[rec.workspace_id];
        if (ws) {
          const timeline = ws.timeline ? JSON.parse(ws.timeline) : [];
          timeline.push({
            timestamp: now,
            event: `recommendation_${action}`,
            reviewer: me.full_name,
            notes: reviewNotes,
          });
          await base44.entities.CaseWorkspace.update(ws.id, {
            status: action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : ws.status,
            timeline: JSON.stringify(timeline.slice(-20)),
          });
        }
      }

      // Audit log
      await base44.integrations.Core.SendEmail({
        to: me.email,
        subject: `Recommendation ${action}`,
        body: `You ${action} a recommendation from the ${SPECIALIST_LABELS[rec?.specialist] || 'Banking'} specialist.\n\nNotes: ${reviewNotes || 'None'}`,
      }).catch(() => {});

      toast({
        title: `Recommendation ${action}`,
        description: `The ${SPECIALIST_LABELS[rec?.specialist] || 'Banking'} specialist's recommendation has been ${action}.`,
      });

      setSelectedRec(null);
      setReviewNotes('');
      loadData();
    } catch (e) {
      toast({ title: 'Action failed', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  }

  function getCount(status) {
    return recommendations.filter(r => r.status === status).length;
  }

  return (
    <div className="px-5 lg:px-8 py-6">
      <OperationsPageLayout
        title="Assistant Recommendations"
        description="Review and approve AI assistant recommendations before execution."
        icon={Bot}
        breadcrumb="AI & Administration"
      >
        {/* Status filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => {
            const Icon = f.icon;
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => { setActiveFilter(f.key); setSelectedRec(null); setLoading(true); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-gray hover:bg-slate-50'
                }`}
              >
                <Icon size={14} />
                {f.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-gray animate-spin" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="vantoris-glass-premium p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-mint/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-mint" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">All clear</h3>
            <p className="text-gray text-sm">No {activeFilter} recommendations at this time.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recommendation list */}
            <div className="space-y-3">
              {recommendations.map(rec => {
                const ws = workspaces[rec.workspace_id];
                const member = members[rec.user_id];
                const isSelected = selectedRec?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    onClick={() => { setSelectedRec(rec); setReviewNotes(rec.review_notes || ''); }}
                    className={`w-full text-left vantoris-glass p-4 transition-all hover:shadow-premium ${
                      isSelected ? 'ring-2 ring-brass/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">{SPECIALIST_ICONS[rec.specialist]}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {SPECIALIST_LABELS[rec.specialist]} Assistant
                          </p>
                          <p className="text-xs text-gray truncate">
                            {member?.full_name || rec.user_id?.substring(0, 8)}
                            {ws?.subject ? ` · ${ws.subject.substring(0, 40)}` : ''}
                          </p>
                        </div>
                      </div>
                      {rec.status === 'escalated' && (
                        <ShieldAlert size={16} className="text-crimson flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray line-clamp-2 mb-2">{rec.summary}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${CONFIDENCE_STYLES[rec.confidence_level] || CONFIDENCE_STYLES.medium}`}>
                        {rec.confidence_level} confidence
                      </span>
                      {rec.is_action_impacting && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/8 text-navy border border-navy/10">
                          <Gavel size={10} className="mr-1" /> Requires approval
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selectedRec ? (
              <div className="vantoris-glass-premium p-5 lg:sticky lg:top-4 lg:self-start">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{SPECIALIST_ICONS[selectedRec.specialist]}</span>
                      <h3 className="text-base font-bold text-foreground">
                        {SPECIALIST_LABELS[selectedRec.specialist]} Recommendation
                      </h3>
                    </div>
                    <p className="text-xs text-gray">
                      Submitted {new Date(selectedRec.created_date).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={selectedRec.status} />
                </div>

                {/* Member message */}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-1">Member Request</p>
                  <div className="vantoris-glass-flat p-3 rounded-lg">
                    <p className="text-sm text-foreground italic">"{selectedRec.member_message}"</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-1">Summary</p>
                  <p className="text-sm text-foreground">{selectedRec.summary}</p>
                </div>

                {/* Structured fields */}
                <div className="space-y-3 mb-4">
                  {selectedRec.supporting_evidence && (
                    <DetailField label="Supporting Evidence" content={selectedRec.supporting_evidence} />
                  )}
                  {selectedRec.potential_risks && (
                    <DetailField label="Potential Risks" content={selectedRec.potential_risks} icon={AlertTriangle} iconClass="text-warning" />
                  )}
                  {selectedRec.applicable_policies && (
                    <DetailField label="Applicable Policies" content={selectedRec.applicable_policies} icon={FileText} />
                  )}
                  {selectedRec.recommended_action && (
                    <DetailField label="Recommended Action" content={selectedRec.recommended_action} icon={Lightbulb} iconClass="text-brass" />
                  )}
                  {selectedRec.escalation_reason && (
                    <DetailField label="Escalation Reason" content={selectedRec.escalation_reason} icon={ShieldAlert} iconClass="text-crimson" />
                  )}
                  {selectedRec.collaboration_notes && (
                    <DetailField label="Collaboration Notes" content={selectedRec.collaboration_notes} />
                  )}
                </div>

                {/* Confidence & approver */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray">Confidence:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CONFIDENCE_STYLES[selectedRec.confidence_level] || CONFIDENCE_STYLES.medium}`}>
                      {selectedRec.confidence_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray">Required approver:</span>
                    <span className="text-xs font-semibold text-foreground capitalize">{selectedRec.required_approver}</span>
                  </div>
                </div>

                {/* Review notes */}
                {selectedRec.status === 'pending' || selectedRec.status === 'escalated' ? (
                  <>
                    <textarea
                      value={reviewNotes}
                      onChange={e => setReviewNotes(e.target.value)}
                      placeholder="Add review notes (visible in audit trail)..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-foreground focus:border-brass/50 focus:outline-none resize-none mb-3"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(selectedRec.id, 'approved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-mint text-white font-semibold rounded-lg text-sm hover:bg-mint/90 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(selectedRec.id, 'rejected')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-crimson text-white font-semibold rounded-lg text-sm hover:bg-crimson/90 transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    {selectedRec.review_notes && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-1">Review Notes</p>
                        <p className="text-sm text-foreground">{selectedRec.review_notes}</p>
                      </div>
                    )}
                    {selectedRec.reviewer_name && (
                      <p className="text-xs text-gray">
                        Reviewed by {selectedRec.reviewer_name} on {selectedRec.reviewed_date ? new Date(selectedRec.reviewed_date).toLocaleString() : 'N/A'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex vantoris-glass-premium p-12 items-center justify-center">
                <div className="text-center">
                  <ChevronRight size={24} className="text-gray mx-auto mb-2" />
                  <p className="text-sm text-gray">Select a recommendation to review details</p>
                </div>
              </div>
            )}
          </div>
        )}
      </OperationsPageLayout>
    </div>
  );
}

function DetailField({ label, content, icon: Icon = null, iconClass = '' }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray font-semibold mb-1 flex items-center gap-1">
        {Icon && <Icon size={11} className={iconClass || 'text-gray'} />}
        {label}
      </p>
      <p className="text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}