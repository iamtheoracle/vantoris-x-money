import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { AlertTriangle, Download, FileSpreadsheet, Clock } from 'lucide-react';

const label = (value, dictionary) => value ? (dictionary[value] || String(value).replace(/_/g, ' ')) : 'Not supplied';
function dateLabel(value) {
  if (!value) return 'Date not supplied';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not supplied' : date.toLocaleString();
}

const EXPORT_TYPES = { monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily', manual: 'Manual' };
const FORMATS = { csv: 'CSV', excel: 'Excel', google_sheets: 'Google Sheets' };

export default function TransactionExportDashboard() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    base44.entities.TransactionExport.list('-created_date', 20).then((rows) => {
      if (!Array.isArray(rows)) throw new Error('Invalid export history response');
      if (active) setExports(rows);
    }).catch(() => {
      if (active) setError('Export history is unavailable. No export-success or empty-history conclusion can be drawn.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const failed = exports.filter((item) => item.status === 'failed').length;
  const successful = exports.filter((item) => item.status === 'completed' || item.status === 'success').length;
  const last = exports[0];

  return (
    <OperationsPageLayout title="Transaction export records" description="Read-only export history. New exports remain held until an authorized, complete-ledger export service is verified." icon={FileSpreadsheet} actions={<button type="button" disabled title="Export service is not verified or enabled" className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"><Download size={14} /> Export unavailable</button>}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div><p className="text-sm font-semibold text-amber-950">Export generation is held</p><p className="mt-1 text-xs leading-5 text-amber-900/80">No schedule, export job or complete-ledger output is assumed. A release requires server authorization, full query coverage, currency-aware reconciliation, secure delivery and an immutable audit record.</p></div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <section className="vantoris-glass-premium rounded-2xl p-5"><Clock size={17} className="mb-3 text-brass" /><p className="text-lg font-semibold text-foreground">{last ? dateLabel(last.created_date) : 'Not available'}</p><p className="mt-1 text-xs text-gray">Latest returned export record</p></section>
        <section className="vantoris-glass-premium rounded-2xl p-5"><FileSpreadsheet size={17} className="mb-3 text-brass" /><p className="text-lg font-semibold text-foreground">{loading || error ? 'Unavailable' : exports.length}</p><p className="mt-1 text-xs text-gray">History records returned · max 20</p></section>
        <section className="vantoris-glass-premium rounded-2xl p-5"><AlertTriangle size={17} className="mb-3 text-brass" /><p className="text-lg font-semibold text-foreground">{loading || error ? 'Unavailable' : failed + ' failed · ' + successful + ' successful'}</p><p className="mt-1 text-xs text-gray">Statuses in returned history only</p></section>
      </div>

      <section className="vantoris-glass-premium rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">Export history</h2><span className="text-[10px] text-gray">Read-only · newest 20 records</span></div>
        {loading ? <p className="py-10 text-center text-sm text-gray">Loading export records…</p> : error ? <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p> : exports.length === 0 ? <p className="py-10 text-center text-sm text-gray">No export history records were returned by the current query.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200 text-left text-[10px] uppercase tracking-wider text-gray"><th className="py-3 pr-4">Created</th><th className="py-3 pr-4">Type</th><th className="py-3 pr-4">Format</th><th className="py-3 pr-4">Rows</th><th className="py-3">Status</th></tr></thead>
            <tbody>{exports.map((item, index) => <tr key={item.id || index} className="border-b border-slate-100"><td className="py-3 pr-4 text-xs text-foreground">{dateLabel(item.created_date)}</td><td className="py-3 pr-4 text-xs capitalize text-foreground">{label(item.export_type, EXPORT_TYPES)}</td><td className="py-3 pr-4 text-xs text-foreground">{label(item.format, FORMATS)}</td><td className="py-3 pr-4 text-xs tabular-nums text-foreground">{item.rows_exported == null ? 'Not supplied' : item.rows_exported}</td><td className="py-3 text-xs capitalize text-foreground">{label(item.status)}</td></tr>)}</tbody>
          </table></div>
        )}
      </section>
    </OperationsPageLayout>
  );
}
