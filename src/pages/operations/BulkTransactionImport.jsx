import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';

export default function BulkTransactionImport() {
  function downloadTemplate() {
    const csv = 'account_number,type,amount,description,reference,transaction_date\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transaction-import-columns.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <OperationsPageLayout title="Bulk transaction intake" description="Controlled import workspace. File uploads and ledger writes are held until the complete server-side workflow is verified." icon={FileSpreadsheet}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <AlertTriangle size={19} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Transaction import is not enabled</p>
          <p className="mt-1 text-xs leading-5">No file is uploaded or imported from this screen. A production import requires server-side authorization, complete account ownership checks, currency and amount validation, idempotency, balanced ledger posting, immutable audit events and a reconciled result report.</p>
        </div>
      </div>
      <section className="vantoris-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass/10"><FileSpreadsheet size={20} className="text-brass" /></div>
          <div><h2 className="font-semibold text-white">Import column template</h2><p className="mt-1 text-xs text-[#AAB4C3]">Header-only CSV · no fabricated account numbers or transaction rows</p></div>
        </div>
        <button type="button" onClick={downloadTemplate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brass px-4 py-2.5 text-sm font-semibold text-[#0E1A2B]">
          <Download size={15} /> Download column template
        </button>
      </section>
      <section className="mt-5 rounded-xl border border-[#526071] bg-[#0D1928] p-5">
        <h3 className="text-sm font-semibold text-white">Required release controls</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-[#AAB4C3]">
          <li>Trusted operator identity and server-side import permission.</li>
          <li>Every account reference resolved to an authorized account owner.</li>
          <li>Currency, amount precision, transaction type and effective date validated.</li>
          <li>Duplicate prevention and idempotent batch processing.</li>
          <li>Atomic ledger posting, immutable audit trail and per-row reconciliation.</li>
        </ul>
      </section>
    </OperationsPageLayout>
  );
}
