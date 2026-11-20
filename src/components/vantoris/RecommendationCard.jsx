import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, TrendingUp, Clock, UserCheck } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';

const confidenceStyles = {
  high: { bg: 'bg-mint/10', text: 'text-mint', label: 'High Confidence' },
  medium: { bg: 'bg-brass/10', text: 'text-brass', label: 'Medium Confidence' },
  low: { bg: 'bg-crimson/10', text: 'text-crimson', label: 'Low Confidence' },
};

const approverLabels = {
  staff: 'Staff Review Required',
  admin: 'Admin Approval Required',
  compliance_officer: 'Compliance Officer Required',
  platform_authority: 'Platform Authority Required',
};

/**
 * RecommendationCard — Displays an assistant recommendation with the
 * seven required fields from the Assistant Orchestration specification:
 * Summary, Supporting Evidence, Confidence Level, Potential Risks,
 * Applicable Policies, Recommended Next Action, Required Approver.
 *
 * Staff reviews and approves/rejects before any action is executed.
 */
export default function RecommendationCard({ recommendation, onApprove, onReject, showActions = true }) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!recommendation) return null;

  const conf = confidenceStyles[recommendation.confidence_level] || confidenceStyles.medium;
  const isEscalated = recommendation.confidence_level === 'low';
  const isPending = recommendation.status === 'draft' || recommendation.status === 'pending_review';

  async function handleApprove() {
    setProcessing(true);
    try { await onApprove?.(recommendation); } finally { setProcessing(false); }
  }

  async function handleReject() {
    setProcessing(true);
    try { await onReject?.(recommendation); } finally { setProcessing(false); }
  }

  return (
    <div className={`vantoris-card p-4 border-l-4 ${isEscalated ? 'border-l-crimson' : 'border-l-champagne'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-champagne/10 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-champagne" />
          </div>
          <div>
            <p className="text-xs text-gray font-medium">Assistant Recommendation</p>
            <p className="text-sm font-semibold text-foreground capitalize">
              {recommendation.assistant_type} Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEscalated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-crimson/10 text-crimson text-xs font-medium">
              <AlertTriangle size={12} /> Escalate
            </span>
          )}
          <StatusBadge status={recommendation.status === 'draft' ? 'pending' : recommendation.status} />
        </div>
      </div>

      {/* Summary */}
      <div className="mb-3">
        <p className="text-xs text-gray mb-1 font-medium uppercase tracking-wide">Summary</p>
        <p className="text-sm text-foreground leading-relaxed">{recommendation.summary}</p>
      </div>

      {/* Confidence Level */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray font-medium">Confidence:</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${conf.bg} ${conf.text} text-xs font-medium`}>
          <TrendingUp size={12} /> {conf.label}
        </span>
      </div>

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-champagne font-medium mb-3 hover:underline"
      >
        {expanded ? 'Hide details' : 'View full details'}
      </button>

      {expanded && (
        <div className="space-y-3 mb-3 animate-fade-in">
          {recommendation.supporting_evidence && (
            <div>
              <p className="text-xs text-gray mb-1 font-medium uppercase tracking-wide">Supporting Evidence</p>
              <p className="text-sm text-foreground leading-relaxed">{recommendation.supporting_evidence}</p>
            </div>
          )}
          {recommendation.potential_risks && (
            <div>
              <p className="text-xs text-gray mb-1 font-medium uppercase tracking-wide">Potential Risks</p>
              <p className="text-sm text-foreground leading-relaxed">{recommendation.potential_risks}</p>
            </div>
          )}
          {recommendation.applicable_policies && (
            <div>
              <p className="text-xs text-gray mb-1 font-medium uppercase tracking-wide">Applicable Policies</p>
              <p className="text-sm text-foreground leading-relaxed">{recommendation.applicable_policies}</p>
            </div>
          )}
          {recommendation.recommended_action && (
            <div>
              <p className="text-xs text-gray mb-1 font-medium uppercase tracking-wide">Recommended Next Action</p>
              <p className="text-sm text-foreground leading-relaxed">{recommendation.recommended_action}</p>
            </div>
          )}
        </div>
      )}

      {/* Required Approver */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mb-3">
        <UserCheck size={14} className="text-gray" />
        <span className="text-xs text-gray font-medium">
          {approverLabels[recommendation.required_approver] || 'Staff Review Required'}
        </span>
      </div>

      {/* Actions */}
      {showActions && isPending && (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={processing}
            className="flex-1 py-2.5 bg-mint text-white text-sm font-semibold rounded-lg hover:bg-mint/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <ShieldCheck size={14} /> Approve
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className="flex-1 py-2.5 bg-crimson text-white text-sm font-semibold rounded-lg hover:bg-crimson/90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <AlertTriangle size={14} /> Reject
          </button>
        </div>
      )}

      {recommendation.status === 'approved' && recommendation.approver_id && (
        <div className="flex items-center gap-2 text-xs text-gray pt-2">
          <Clock size={12} />
          Approved by {recommendation.approver_id}
          {recommendation.approval_date && ` on ${new Date(recommendation.approval_date).toLocaleDateString()}`}
        </div>
      )}
    </div>
  );
}