import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileText, AlertTriangle, CheckCircle2, Calendar, Building2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  parseDateSafe,
  formatStatementDate,
  formatPeriod,
  formatTxnDate,
  dedupKey,
  periodsOverlap,
} from '@/lib/statementDates';
import { formatCurrency } from '@/lib/formatCurrency';

/**
 * HistoricalStatementImport — lets existing customers upload legitimate historical
 * statements from previous banking records WITHOUT altering their current account
 * balance or fabricating transactions.
 *
 * Key principles:
 * - Statement date ≠ upload date (preserved separately)
 * - Transactions are marked source="historical_import" (distinguishable from live)
 * - Deduplication prevents duplicate imports
 * - Overlap detection warns if periods conflict
 * - Review screen before saving — user can correct extraction errors
 * - Does NOT modify account.balance
 */
export default function HistoricalStatementImport({ open, onClose, accountId, account, onImported }) {
  const [step, setStep] = useState(1); // 1=upload, 2=metadata, 3=review, 4=saving
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceDocUrl, setSourceDocUrl] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [metadata, setMetadata] = useState({
    sourceInstitution: '',
    accountName: account?.account_name || '',
    accountIdentifier: account?.account_number || '',
    statementDate: '',
    periodStart: '',
    periodEnd: '',
    issueDate: '',
    openingBalance: '',
    closingBalance: '',
    importNotes: '',
  });
  const [transactions, setTransactions] = useState([]);
  const [existingTxnKeys, setExistingTxnKeys] = useState(new Set());
  const [existingStatements, setExistingStatements] = useState([]);
  const [overlapWarning, setOverlapWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setSourceFile(null);
      setSourceDocUrl('');
      setTransactions([]);
      setOverlapWarning('');
      setMetadata({
        sourceInstitution: '',
        accountName: account?.account_name || '',
        accountIdentifier: account?.account_number || '',
        statementDate: '',
        periodStart: '',
        periodEnd: '',
        issueDate: '',
        openingBalance: '',
        closingBalance: '',
        importNotes: '',
      });
      loadExistingData();
    }
  }, [open, account]);

  const loadExistingData = useCallback(async () => {
    if (!accountId) return;
    try {
      const [txns, stmts] = await Promise.all([
        base44.entities.Transaction.filter({ account_id: accountId }, '-created_date', 200),
        base44.entities.HistoricalStatement.filter({ account_id: accountId }, '-statement_date', 50),
      ]);
      setExistingTxnKeys(new Set(txns.map(dedupKey)));
      setExistingStatements(stmts);
    } catch (e) {
      console.error('Failed to load existing data for dedup:', e);
    }
  }, [accountId]);

  // Parse CSV into transaction rows
  function parseCsv(text) {
    const lines = text.split('\n').filter(l => l.trim());
    const parsed = [];
    // Skip header row if it looks like one
    const firstLine = lines[0]?.toLowerCase() || '';
    const startIdx = firstLine.includes('date') && firstLine.includes('amount') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const row = lines[i];
      // Handle quoted CSV fields
      const cols = parseCsvRow(row);
      if (cols.length < 4) continue;

      const [dateStr, desc, typeOrAmt, amtOrType, ref] = cols;
      let type = '', amount = 0, reference = '';

      // Flexible: could be date,desc,type,amount,ref OR date,desc,amount,type,ref
      if (isNaN(parseFloat(typeOrAmt))) {
        type = (typeOrAmt || 'adjustment').toLowerCase().trim();
        amount = parseFloat(amtOrType) || 0;
        reference = ref || '';
      } else {
        amount = parseFloat(typeOrAmt) || 0;
        type = (amtOrType || 'adjustment').toLowerCase().trim();
        reference = '';
      }

      // Normalize type
      const typeMap = {
        'deposit': 'deposit', 'dep': 'deposit', 'credit': 'deposit',
        'withdrawal': 'withdrawal', 'wd': 'withdrawal', 'debit': 'withdrawal',
        'transfer': 'transfer', 'xfer': 'transfer',
        'interest': 'interest', 'int': 'interest',
        'fee': 'fee', 'charge': 'fee',
        'adjustment': 'adjustment', 'adj': 'adjustment',
        'payment': 'withdrawal', 'pay': 'withdrawal',
        'refund': 'deposit',
      };
      type = typeMap[type] || 'adjustment';

      parsed.push({
        transaction_date: dateStr.trim(),
        posting_date: dateStr.trim(),
        description: (desc || 'Imported transaction').trim(),
        type,
        amount,
        reference: reference.trim(),
        source: 'historical_import',
        status: 'completed',
        _dup: false,
      });
    }
    return parsed;
  }

  function parseCsvRow(row) {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current);
    return cols.map(c => c.trim());
  }

  async function handleFileSelected(file) {
    setSourceFile(file);
    setUploadingDoc(true);
    try {
      // Upload the source document for audit trail
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSourceDocUrl(file_url);

      // If CSV, parse transactions
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        const text = await file.text();
        const parsed = parseCsv(text);
        // Mark duplicates
        const keys = existingTxnKeys;
        parsed.forEach(t => {
          t._dup = keys.has(dedupKey(t));
        });
        setTransactions(parsed);
      }
      setStep(2);
    } catch (e) {
      console.error(e);
      toast({ title: 'Upload failed', description: 'Could not upload the source document.', variant: 'destructive' });
    } finally {
      setUploadingDoc(false);
    }
  }

  // Check for period overlap when metadata changes
  useEffect(() => {
    if (metadata.periodStart && metadata.periodEnd && existingStatements.length > 0) {
      const newPeriod = { start: metadata.periodStart, end: metadata.periodEnd };
      const overlapping = existingStatements.find(s =>
        periodsOverlap(newPeriod, { start: s.period_start, end: s.period_end })
      );
      if (overlapping) {
        setOverlapWarning(
          `This statement period (${formatPeriod(metadata.periodStart, metadata.periodEnd)}) overlaps with an existing imported statement (${formatPeriod(overlapping.period_start, overlapping.period_end)}). Duplicate transactions will be skipped.`
        );
      } else {
        setOverlapWarning('');
      }
    } else {
      setOverlapWarning('');
    }
  }, [metadata.periodStart, metadata.periodEnd, existingStatements]);

  function updateTxn(index, field, value) {
    setTransactions(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  }

  function removeTxn(index) {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setStep(4);
    try {
      const me = await base44.auth.me();

      // Filter out duplicates and invalid rows
      const validTxns = transactions.filter(t =>
        t.transaction_date && t.amount !== '' && !t._dup
      );

      // Create the HistoricalStatement record
      const statement = await base44.entities.HistoricalStatement.create({
        user_id: me.id,
        account_id: accountId,
        account_name: metadata.accountName,
        account_identifier: metadata.accountIdentifier,
        statement_date: metadata.statementDate,
        period_start: metadata.periodStart,
        period_end: metadata.periodEnd,
        issue_date: metadata.issueDate || metadata.statementDate,
        opening_balance: parseFloat(metadata.openingBalance) || 0,
        closing_balance: parseFloat(metadata.closingBalance) || 0,
        total_credits: validTxns.filter(t => t.amount >= 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        total_debits: validTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
        transaction_count: validTxns.length,
        source_document_url: sourceDocUrl,
        source_institution: metadata.sourceInstitution,
        imported_by_name: me.full_name || me.email,
        import_notes: metadata.importNotes,
        verification_status: 'user_reviewed',
        overlap_detected: !!overlapWarning,
        overlap_details: overlapWarning || '',
      });

      // Create transactions — marked as historical_import, linked to the statement
      // Does NOT modify account.balance
      const txnRecords = validTxns.map(t => ({
        account_id: accountId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        reference: t.reference,
        transaction_date: t.transaction_date,
        posting_date: t.posting_date || t.transaction_date,
        source: 'historical_import',
        imported_statement_id: statement.id,
        status: 'completed',
        created_by_admin: false,
      }));

      if (txnRecords.length > 0) {
        await base44.entities.Transaction.bulkCreate(txnRecords);
      }

      // Create a Document record for the source file
      if (sourceDocUrl) {
        await base44.entities.Document.create({
          user_id: me.id,
          title: `Historical Statement — ${formatStatementDate(metadata.statementDate)}`,
          type: 'historical_statement',
          file_url: sourceDocUrl,
          account_id: accountId,
          statement_date: metadata.statementDate,
          period_start: metadata.periodStart,
          period_end: metadata.periodEnd,
          issue_date: metadata.issueDate || metadata.statementDate,
          statement_period: formatPeriod(metadata.periodStart, metadata.periodEnd),
          status: 'active',
        });
      }

      toast({
        title: 'Historical statement imported',
        description: `${validTxns.length} transactions imported. Your current balance was not modified.`,
      });

      onImported?.();
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: 'Import failed', description: e.message || 'Could not save the statement.', variant: 'destructive' });
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  const dupCount = transactions.filter(t => t._dup).length;
  const validCount = transactions.filter(t => !t._dup && t.transaction_date).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-white border-slate-200 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText size={18} className="text-brass" />
            Import Historical Statement
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {['Upload', 'Details', 'Review'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= i + 1 ? 'bg-navy text-white' : 'bg-slate-100 text-gray'}`}>
                {i + 1}
              </div>
              <span className={`text-xs ${step >= i + 1 ? 'text-foreground font-medium' : 'text-gray'}`}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-slate-200" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-brass/5 border border-brass/15 rounded-xl p-3 flex gap-2.5">
              <AlertTriangle size={16} className="text-brass flex-shrink-0 mt-0.5" />
              <p className="text-gray text-xs leading-relaxed">
                Importing a historical statement <strong>does not</strong> alter your current account balance.
                Imported transactions are marked as "Historical Import" and kept separate from live activity.
              </p>
            </div>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-brass/50 transition-all">
              <input
                type="file"
                accept=".csv,.pdf,.png,.jpg,.jpeg"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(f);
                }}
                className="hidden"
                id="hist-stmt-file"
              />
              <label htmlFor="hist-stmt-file" className="cursor-pointer">
                <Upload size={24} className="text-brass mx-auto mb-2" />
                <p className="text-foreground text-sm font-medium">
                  {uploadingDoc ? 'Uploading...' : sourceFile ? sourceFile.name : 'Upload statement (CSV, PDF, or image)'}
                </p>
                <p className="text-gray text-xs mt-1">CSV files auto-extract transactions. PDF/images are stored for your records.</p>
              </label>
            </div>
            <div className="text-xs text-gray space-y-1">
              <p className="font-medium text-foreground">CSV format:</p>
              <code className="block bg-slate-100 rounded-lg p-2 text-[11px]">date,description,type,amount,reference</code>
              <p className="text-gray">Example: 2000-06-15,Payroll Deposit,deposit,2500.00,PAY-061500</p>
            </div>
          </div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                <Building2 size={12} /> Source Institution
              </label>
              <input
                type="text"
                value={metadata.sourceInstitution}
                onChange={e => setMetadata({ ...metadata, sourceInstitution: e.target.value })}
                placeholder="e.g. Previous Bank Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Statement Date</label>
                <input
                  type="date"
                  value={metadata.statementDate}
                  onChange={e => setMetadata({ ...metadata, statementDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
                {metadata.statementDate && (
                  <p className="text-[10px] text-gray mt-1">{formatStatementDate(metadata.statementDate)}</p>
                )}
              </div>
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Issue Date</label>
                <input
                  type="date"
                  value={metadata.issueDate}
                  onChange={e => setMetadata({ ...metadata, issueDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Period Start</label>
                <input
                  type="date"
                  value={metadata.periodStart}
                  onChange={e => setMetadata({ ...metadata, periodStart: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Period End</label>
                <input
                  type="date"
                  value={metadata.periodEnd}
                  onChange={e => setMetadata({ ...metadata, periodEnd: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
            </div>
            {metadata.periodStart && metadata.periodEnd && (
              <p className="text-xs text-gray">Period: {formatPeriod(metadata.periodStart, metadata.periodEnd)}</p>
            )}
            {overlapWarning && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 flex gap-2.5">
                <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <p className="text-warning text-xs leading-relaxed">{overlapWarning}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={metadata.openingBalance}
                  onChange={e => setMetadata({ ...metadata, openingBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Closing Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={metadata.closingBalance}
                  onChange={e => setMetadata({ ...metadata, closingBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-gray text-xs uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
              <textarea
                value={metadata.importNotes}
                onChange={e => setMetadata({ ...metadata, importNotes: e.target.value })}
                placeholder="Corrections, context, or notes about this import..."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-brass/50 focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 bg-slate-50 text-foreground font-medium rounded-xl hover:bg-slate-200 transition-all text-sm">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!metadata.statementDate}
                className="flex-1 py-2.5 bg-navy text-white font-semibold rounded-xl disabled:opacity-40 transition-all text-sm"
              >
                {transactions.length > 0 ? `Review ${transactions.length} Transactions` : 'Review'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-gray">Statement Date</span>
                <span className="text-foreground font-medium">{formatStatementDate(metadata.statementDate)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray">Period</span>
                <span className="text-foreground font-medium">{formatPeriod(metadata.periodStart, metadata.periodEnd)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray">Transactions</span>
                <span className="text-foreground font-medium">{validCount} valid, {dupCount} duplicate</span>
              </div>
            </div>

            {dupCount > 0 && (
              <div className="bg-mint/8 border border-mint/20 rounded-xl p-2.5 flex gap-2">
                <CheckCircle2 size={14} className="text-mint flex-shrink-0 mt-0.5" />
                <p className="text-mint text-xs">{dupCount} duplicate transaction(s) detected and will be skipped.</p>
              </div>
            )}

            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray text-sm mb-3">No CSV transactions were parsed. You can still save the statement document for your records.</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {transactions.map((txn, i) => (
                  <div
                    key={i}
                    className={`rounded-lg p-2.5 border ${txn._dup ? 'bg-mint/5 border-mint/15 opacity-60' : 'bg-white border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <input
                        type="date"
                        value={txn.transaction_date}
                        onChange={e => updateTxn(i, 'transaction_date', e.target.value)}
                        disabled={txn._dup}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs flex-1 focus:border-brass/50 focus:outline-none disabled:opacity-50"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={txn.amount}
                        onChange={e => updateTxn(i, 'amount', parseFloat(e.target.value) || 0)}
                        disabled={txn._dup}
                        className={`bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs w-24 text-right focus:border-brass/50 focus:outline-none disabled:opacity-50 ${txn.amount < 0 ? 'text-crimson' : 'text-mint'}`}
                      />
                      {!txn._dup && (
                        <button onClick={() => removeTxn(i)} className="text-gray hover:text-crimson p-1">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={txn.description}
                      onChange={e => updateTxn(i, 'description', e.target.value)}
                      disabled={txn._dup}
                      placeholder="Description"
                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs mb-1 focus:border-brass/50 focus:outline-none disabled:opacity-50"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={txn.type}
                        onChange={e => updateTxn(i, 'type', e.target.value)}
                        disabled={txn._dup}
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs focus:border-brass/50 focus:outline-none disabled:opacity-50"
                      >
                        <option value="deposit">Deposit</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="transfer">Transfer</option>
                        <option value="interest">Interest</option>
                        <option value="fee">Fee</option>
                        <option value="adjustment">Adjustment</option>
                      </select>
                      {txn._dup && <span className="text-[10px] text-mint font-medium">Duplicate — skipped</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-slate-50 text-foreground font-medium rounded-xl hover:bg-slate-200 transition-all text-sm">
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-brass text-white font-semibold rounded-xl disabled:opacity-40 transition-all text-sm"
              >
                {saving ? 'Saving...' : `Import Statement${validCount > 0 ? ` (${validCount} txns)` : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Saving */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin mb-4" />
            <p className="text-gray text-sm">Importing historical statement...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}