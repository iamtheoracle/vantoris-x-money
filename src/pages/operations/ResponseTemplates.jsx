import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Plus, Edit2, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const TEMPLATE_CATEGORIES = ['approval', 'rejection', 'info', 'general'];

export default function ResponseTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(null);
  const { toast } = useToast();

  useEffect(() => { loadTemplates(); }, []);

  async function loadTemplates() {
    const tmps = await base44.entities.ServiceTemplate.list('-created_date', 100);
    setTemplates(tmps);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await base44.entities.ServiceTemplate.update(editingId, form);
      } else {
        await base44.entities.ServiceTemplate.create(form);
      }
      setForm({ title: '', body: '', category: 'general' });
      setEditingId(null);
      setShowForm(false);
      loadTemplates();
      toast({ title: editingId ? 'Template updated' : 'Template created', description: 'Response template saved successfully.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Save failed', description: e.message || 'Unable to save template.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return;
    try {
      await base44.entities.ServiceTemplate.delete(id);
      loadTemplates();
      toast({ title: 'Template deleted', description: 'Response template removed.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Delete failed', description: e.message || 'Unable to delete template.', variant: 'destructive' });
    }
  }

  function handleEdit(template) {
    setEditingId(template.id);
    setForm({ title: template.title, body: template.body, category: template.category });
    setShowForm(true);
  }

  function handleNew() {
    setEditingId(null);
    setForm({ title: '', body: '', category: 'general' });
    setShowForm(true);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  }

  const categoryColors = {
    approval: 'bg-olive/15 text-emerald-400 border-olive/30',
    rejection: 'bg-crimson/20 text-red-400 border-crimson/30',
    info: 'bg-brass/15 text-brass border-brass/30',
    general: 'bg-slate/50 text-gray border-gray/20',
  };

  if (loading) {
    return (
      <OperationsPageLayout title="Response Templates" description="Manage pre-written responses" icon={MessageSquare}>
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  return (
    <OperationsPageLayout title="Response Templates" description="Manage pre-written responses for KYC, accounts, and more" icon={MessageSquare}>
      <button
        onClick={handleNew}
        className="flex items-center gap-2 px-4 py-2.5 bg-brass text-[#0E1A2B] rounded-xl text-sm font-semibold hover:bg-brass/90 transition-all mb-6"
      >
        <Plus size={16} /> New Template
      </button>

      <div className="space-y-3">
        {templates.map(template => (
          <div key={template.id} className="vantoris-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{template.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${categoryColors[template.category] || categoryColors.general}`}>
                    {template.category}
                  </span>
                </div>
                <p className="text-[#AAB4C3] text-sm whitespace-pre-wrap">{template.body}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(template.body)}
                  className="p-2 text-[#AAB4C3] hover:text-brass hover:bg-[#242D38] rounded-lg transition-all"
                  title="Copy to clipboard"
                >
                  {copied === template.body ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-[#AAB4C3] hover:text-brass hover:bg-[#242D38] rounded-lg transition-all"
                  title="Edit template"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-400/60 hover:text-red-400 hover:bg-crimson/10 rounded-lg transition-all"
                  title="Delete template"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-center text-[#AAB4C3] py-8">No templates yet. Create one to get started.</p>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#0E1A2B] border-[#242D38] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{editingId ? 'Edit Template' : 'New Response Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., KYC Documents Insufficient"
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
              >
                {TEMPLATE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[#AAB4C3] text-xs uppercase tracking-wider mb-1.5 block">Response Text</label>
              <textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="Enter the template response..."
                className="w-full bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none resize-none selectable-content"
                rows={8}
              />
              <p className="text-[#AAB4C3]/50 text-xs mt-1">{form.body.length} characters</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.body.trim() || submitting}
                className="flex-1 py-3 bg-brass text-[#0E1A2B] font-semibold rounded-xl disabled:opacity-40"
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-[#242D38] text-[#AAB4C3] rounded-xl font-medium hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  );
}