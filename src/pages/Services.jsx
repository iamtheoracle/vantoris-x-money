import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Building2, CreditCard, Check, Clock, Landmark, ShieldCheck } from 'lucide-react';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const services = [
  { type: 'Joint Account', icon: Users, desc: 'Request a joint account; co-applicant verification and approval are required.', color: 'bg-brass/15 text-brass', requiresApproval: true },
  { type: 'Business Account', icon: Building2, desc: 'Request a business checking or savings account; eligibility and terms are subject to review.', color: 'bg-olive/20 text-emerald-400', requiresApproval: true },
  { type: 'Savings Account', icon: Landmark, desc: 'Request a savings account; terms and availability are confirmed during review.', color: 'bg-blue-500/15 text-blue-400' },
  { type: 'Debit Card', icon: CreditCard, desc: 'Request a debit card; issuance and card controls require an authorized issuer.', color: 'bg-purple-500/15 text-purple-400' },
];

export default function Services() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showRequest, setShowRequest] = useState(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [me, setMe] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      try {
        const user = await base44.auth.me();
        if (!user?.id) throw new Error('Your authenticated session could not be verified.');
        const reqs = await base44.entities.ServiceRequest.filter({ user_id: user.id }, '-created_date');
        if (!cancelled) {
          setMe(user);
          setRequests(Array.isArray(reqs) ? reqs : []);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message || 'Your service request history could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadRequests();
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit() {
    if (!showRequest || submitting) return;
    setSubmitting(true);
    const serviceType = showRequest;
    const reqDetails = details.trim();
    try {
      const user = me || await base44.auth.me();
      if (!user?.id) throw new Error('Your authenticated session could not be verified.');
      const created = await base44.entities.ServiceRequest.create({
        user_id: user.id,
        service_type: serviceType,
        details: reqDetails,
        status: 'pending',
      });
      setRequests(prev => [created, ...prev]);
      setShowRequest(null);
      setDetails('');

      let notificationCreated = false;
      try {
        await base44.entities.Notification.create({
          user_id: user.id,
          title: 'Service Requested',
          message: `Your request for ${serviceType} has been recorded. Its status remains pending until reviewed.`,
          type: 'info',
        });
        notificationCreated = true;
      } catch (notificationError) {
        console.warn('Service request was recorded, but its in-app notification was not confirmed.', notificationError);
      }
      toast({
        title: 'Request recorded',
        description: notificationCreated
          ? 'Your request record was created. It is not an account opening, card issuance, approval, or money movement.'
          : 'Your request record was created, but the in-app notification was not confirmed. Check My Requests for its status.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Could not record request',
        description: error.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold text-white mb-1">Services</h1>
      <p className="text-[#AAB4C3] text-sm mb-3">Request additional accounts and services</p>
      <div role="note" className="mb-6 rounded-xl border border-brass/25 bg-brass/10 p-3 text-xs leading-relaxed text-[#E8D9B8]">
        A request is not an approval or completed service. It does not open an account, issue a card, or move funds. Eligibility, terms, provider availability and any required staff approval must be confirmed separately.
      </div>

      {loadError && (
        <div role="alert" className="mb-5 rounded-xl border border-amber-300/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
          {loadError} This is not confirmation that you have no existing requests.
        </div>
      )}

      {/* Available Services */}
      <h3 className="text-white font-semibold text-sm mb-3">Available Services</h3>
      <div className="space-y-3 mb-8">
        {services.map(svc => {
          const Icon = svc.icon;
          return (
            <button
              key={svc.type}
              onClick={() => setShowRequest(svc.type)}
              className="vantoris-card p-4 w-full text-left flex items-center gap-4 hover:border-brass/30 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${svc.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{svc.type}</p>
                  {svc.requiresApproval && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brass bg-brass/15 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={9} /> Requires Approval
                    </span>
                  )}
                </div>
                <p className="text-[#AAB4C3] text-xs">{svc.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* My Requests */}
      {requests.length > 0 && (
        <>
          <h3 className="text-white font-semibold text-sm mb-3">My Requests</h3>
          <div className="space-y-2">
            {requests.map(req => (
              <div key={req.id} className={`vantoris-card p-4 flex items-center justify-between ${req._optimistic ? 'opacity-70' : ''}`}>
                <div>
                  <p className="text-white text-sm font-medium">{req.service_type}</p>
                  <p className="text-[#AAB4C3] text-xs flex items-center gap-1.5">
                    {req._optimistic && <span className="inline-block w-3 h-3 border border-brass/30 border-t-brass rounded-full animate-spin" />}
                    {new Date(req.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Request Dialog */}
      <Dialog open={!!showRequest} onOpenChange={() => setShowRequest(null)}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Request {showRequest}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {services.find(s => s.type === showRequest)?.requiresApproval && (
              <div className="rounded-lg border border-brass/30 bg-brass/10 p-3 flex items-start gap-2">
                <ShieldCheck size={16} className="text-brass flex-shrink-0 mt-0.5" />
                <p className="text-[#AAB4C3] text-xs leading-relaxed">This service requires additional review and approval. Please provide as much detail as possible to expedite processing.</p>
              </div>
            )}
            <p className="text-[#AAB4C3] text-sm">Provide any additional details for your request.</p>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none"
              rows={4}
            />
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}