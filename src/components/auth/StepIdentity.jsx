import React from "react";
import { TextField } from "@/components/auth/FormField";
import { Upload, FileCheck, X, CreditCard } from "lucide-react";

function FileUpload({ label, file, onChange, description }) {
  const inputId = label.replace(/\s/g, "-").toLowerCase();

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray mb-1.5 block">
        {label} <span className="text-crimson">*</span>
      </label>
      {file ? (
        <div className="flex items-center justify-between bg-mint/5 border border-mint/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-mint" />
            <span className="text-sm text-foreground truncate max-w-[180px]">{file.name}</span>
          </div>
          <button onClick={() => onChange(null)} className="p-1 hover:bg-crimson/10 rounded">
            <X size={16} className="text-gray" />
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-5 cursor-pointer hover:border-navy/30 hover:bg-slate-50 transition">
          <Upload size={20} className="text-gray" />
          <span className="text-sm text-gray">Tap to upload</span>
          <span className="text-[11px] text-gray/70 text-center">{description}</span>
          <input
            id={inputId}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files[0] && onChange(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

export default function StepIdentity({ data, updateData }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Social Security Number"
        type="password"
        value={data.ssn}
        onChange={(v) => updateData({ ssn: v })}
        placeholder="•••-••-••••"
        required
        autoComplete="off"
        icon={CreditCard}
      />
      <p className="text-[11px] text-gray -mt-2">Or jurisdiction equivalent (e.g. ITIN, National ID number).</p>

      <div className="grid grid-cols-2 gap-3">
        <FileUpload
          label="ID — Front"
          file={data.govIdFront}
          onChange={(f) => updateData({ govIdFront: f })}
          description="Front of license, passport, or state ID"
        />
        <FileUpload
          label="ID — Back"
          file={data.govIdBack}
          onChange={(f) => updateData({ govIdBack: f })}
          description="Back of license or state ID (if applicable)"
        />
      </div>

      <FileUpload
        label="Selfie Photo"
        file={data.selfie}
        onChange={(f) => updateData({ selfie: f })}
        description="Clear, well-lit front-facing photo of your face"
      />
      <p className="text-[11px] text-gray -mt-2 leading-relaxed">
        A clear photo of your face is used to match your identity documents during compliance review.
        Biometric liveness verification is not performed at upload — a compliance officer will review all
        submitted materials before activation.
      </p>

      <p className="text-xs text-gray leading-relaxed pt-1">
        Your documents are encrypted and stored securely. They will be reviewed by our compliance team
        as part of the account opening process.
      </p>
    </div>
  );
}