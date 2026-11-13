import React from 'react';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import { Trophy, ShieldAlert, Heart, LockKeyhole } from 'lucide-react';

export default function SupporterLeaderboard() {
  return (
    <OperationsPageLayout title="Supporter recognition" description="Supporter recognition is reserved for consented, verified contribution records." icon={Trophy}>
      <div role="status" className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-800" />
        <div>
          <p className="text-sm font-semibold text-amber-950">Supporter rankings are unavailable</p>
          <p className="mt-1 text-xs leading-5 text-amber-900/80">
            No leaderboard, contribution total, investment balance, or supporter ranking is displayed. Previous client-side calculations combined self-reported profile values and activity records, mixed currencies, and did not establish settled contributions.
          </p>
        </div>
      </div>

      <section className="vantoris-card rounded-2xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brass/10 text-brass"><Trophy size={26} /></span>
        <h2 className="mt-4 text-lg font-semibold text-white">Recognition with consent and evidence</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#AAB4C3]">
          Supporter recognition can be enabled when contribution records are verified against the donation ledger and provider settlement, currencies are normalized, duplicate and reversed contributions are excluded, and each participant has opted in to public recognition.
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-[#526071] bg-[#0D1928] p-4">
            <Heart size={17} className="text-brass" />
            <p className="mt-2 text-sm font-semibold text-white">Verified contributions required</p>
            <p className="mt-1 text-xs leading-5 text-[#AAB4C3]">A profile amount or activity entry is not proof of funds received or settled.</p>
          </div>
          <div className="rounded-xl border border-[#526071] bg-[#0D1928] p-4">
            <LockKeyhole size={17} className="text-brass" />
            <p className="mt-2 text-sm font-semibold text-white">Public recognition requires opt-in</p>
            <p className="mt-1 text-xs leading-5 text-[#AAB4C3]">Private financial and identity records are not used to rank members without explicit consent.</p>
          </div>
        </div>
      </section>
    </OperationsPageLayout>
  );
}
