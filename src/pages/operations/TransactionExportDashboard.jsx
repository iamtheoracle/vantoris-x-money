import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import StatusBadge from '@/components/vantoris/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import {
  Download, FileSpreadsheet, Calendar, Loader2, CheckCircle2,
  AlertTriangle, Clock, RefreshCw, FileDown, TrendingUp,
} from 'lucide-react';

const EXPORT_TYPE_LABELS = {
  monthly: 'Monthly Export',
  weekly: 'Weekly Export',
  daily: 'Daily Export',
  manual: 'Manual Export',
};

const FORMAT_LABELS = {
  csv: 'CSV',
  excel: 'Excel',
  google_sheets: 'Google Sheets',
};

export default function TransactionExportDashboard() {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('manual');
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { toast } = useToast();

  const loadExports = useCallback(async () => {
    const records = await base44.entities.TransactionExport.list('-created_date', 20);
    setExports(records);
  }, []);

  useEffect(() => {
    loadExports().catch(e => {
      toast({ title: 'Failed to load export history', description: e.message, variant: 'destructive' });
    }).finally(() => setLoading(false));
  }, [loadExports]);

  async function handleExport() {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportTransactionLedger', {
        export_type: exportType,
        format,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const data = response.data || response;
      toast({
        title: 'Export completed',
        description: `${data.rowsExported} transactions exported successfully.`,
      });
      loadExports();
    } catch (e) {
      toast({ title: 'Export failed', description: e.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  const lastExport = exports[0];
  const totalRowsExported = exports.reduce((sum, e) => sum + (e.rows_exported || 0), 0);
  const failedExports = exports.filter(e => e.status === 'failed').length;

  // Calculate next scheduled export (first of next month)
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  const nextScheduledExport = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="px-5 lg:px-8 py-6">
      <OperationsPageLayout
        title="Transaction Ledger Export"
        description="Automated financial transaction export for reconciliation and reporting."
        icon={FileSpreadsheet}
        breadcrumb="HeroBox Operations"
        actions={
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white font-semibold rounded-lg text-sm hover:bg-navy/90 transition-all disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Exporting...' : 'Export Now'}
          </button>
        }
      >
        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={Clock}
            label="Last Export"
            value={lastExport ? new Date(lastExport.created_date).toLocaleDateString('en-US') : 'Never'}
            sublabel={lastExport ? EXPORT_TYPE_LABELS[lastExport.export_type] : 'No exports yet'}
          />
          <StatCard
            icon={Calendar}
            label="Next Scheduled"
            value={nextScheduledExport}
            sublabel="Monthly auto-export"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Rows Exported"
            value={totalRowsExported.toLocaleString()}
            sublabel={`${exports.length} exports total`}
          />
          <StatCard
            icon={failedExports > 0 ? AlertTriangle : CheckCircle2}
            label="Failed Exports"
            value={failedExports.toString()}
            sublabel={failedExports > 0 ? 'Requires attention' : 'All successful'}
            iconColor={failedExports > 0 ? 'text-crimson' : 'text-mint'}
          />
        </div>

        {/* Export configuration */}
        <div className="vantoris-glass-premium p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileDown size={16} className="text-gray" />
            Export Configuration
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Export type */}
            <div>
              <label className="text-xs text-gray font-medium mb-1.5 block">Export Type</label>
              <select
                value={exportType}
                onChange={e => setExportType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-brass/50 focus:outline-none"
              >
                <option value="manual">Manual Export</option>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            {/* Format */}
            <div>
              <label className="text-xs text-gray font-medium mb-1.5 block">Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-brass/50 focus:outline-none"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
                <option value="google_sheets">Google Sheets</option>
              </select>
            </div>
            {/* Date from */}
            <div>
              <label className="text-xs text-gray font-medium mb-1.5 block">From Date (optional)</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-brass/50 focus:outline-none"
              />
            </div>
            {/* Date to */}
            <div>
              <label className="text-xs text-gray font-medium mb-1.5 block">To Date (optional)</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-brass/50 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-xs text-gray mt-3">
            Leave dates empty to export all new transactions since the last export. Duplicate prevention is automatic.
          </p>
        </div>

        {/* Export history */}
        <div className="vantoris-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Export History</h3>
            <button
              onClick={() => { setLoading(true); loadExports().finally(() => setLoading(false)); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-gray transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="text-gray animate-spin" />
            </div>
          ) : exports.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet size={32} className="text-gray mx-auto mb-2" />
              <p className="text-sm text-gray">No exports yet. Run your first export above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exports.map(exp => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      exp.status === 'completed' ? 'bg-mint/10' :
                      exp.status === 'failed' ? 'bg-crimson/10' :
                      exp.status === 'in_progress' ? 'bg-brass/10' : 'bg-slate-100'
                    }`}>
                      {exp.status === 'completed' ? <CheckCircle2 size={14} className="text-mint" /> :
                       exp.status === 'failed' ? <AlertTriangle size={14} className="text-crimson" /> :
                       <Clock size={14} className="text-brass" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {EXPORT_TYPE_LABELS[exp.export_type]} · {FORMAT_LABELS[exp.format]}
                      </p>
                      <p className="text-xs text-gray">
                        {new Date(exp.created_date).toLocaleString('en-US')}
                        {exp.exported_by_name ? ` · ${exp.exported_by_name}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{exp.rows_exported || 0} rows</p>
                      {exp.failed_rows > 0 && (
                        <p className="text-xs text-crimson">{exp.failed_rows} failed</p>
                      )}
                    </div>
                    {exp.google_sheet_url && exp.status === 'completed' && (
                      <a
                        href={exp.google_sheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-mint/10 text-mint hover:bg-mint/20 transition-colors"
                        title="Open Google Sheet"
                      >
                        <FileSpreadsheet size={14} />
                      </a>
                    )}
                    {exp.file_url && exp.status === 'completed' && (
                      <a
                        href={exp.file_url}
                        download
                        className="p-2 rounded-lg bg-navy/8 text-navy hover:bg-navy/12 transition-colors"
                        title="Download export"
                      >
                        <Download size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </OperationsPageLayout>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sublabel, iconColor = 'text-navy' }) {
  return (
    <div className="vantoris-glass p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={iconColor} />
        <p className="text-[10px] uppercase tracking-wider text-gray font-semibold">{label}</p>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sublabel && <p className="text-xs text-gray mt-0.5">{sublabel}</p>}
    </div>
  );
}