import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("Loading account records...");
  useEffect(() => {
    base44.entities.Transaction.list("-created_date", 40)
      .then((list) => {
        setRows(Array.isArray(list) ? list : []);
        setNote(list?.length ? "" : "No transaction records were returned for this session.");
      })
      .catch((e) => setNote(e?.message || "Transactions could not be loaded."));
  }, []);
  return (
    <div className="min-h-screen bg-[#F4F6F9] pb-28">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 safe-top">
        <Link to="/" className="rounded-lg p-1.5" aria-label="Back"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-navy">Transactions</h1>
      </div>
      <div className="app-frame space-y-3 p-4">
        {note && <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">{note}</p>}
        {rows.map((tx) => (
          <article key={tx.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy">{tx.description || tx.type || "Transaction"}</p>
                <p className="mt-1 text-xs text-slate-500">{tx.status || "recorded"} · {tx.created_date || tx.date || ""}</p>
              </div>
              <p className="font-mono text-sm font-semibold">{tx.amount != null ? `$${Number(tx.amount).toFixed(2)}` : "—"}</p>
            </div>
          </article>
        ))}
        <Link to="/move-money" className="block rounded-full bg-navy py-3 text-center text-sm font-semibold text-white">Move money</Link>
      </div>
    </div>
  );
}
