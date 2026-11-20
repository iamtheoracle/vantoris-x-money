import React from "react";
import { Check } from "lucide-react";

function ReviewSection({ title, fields, onEdit }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-navy">{title}</h3>
        <button onClick={onEdit} className="text-xs text-navy font-medium hover:underline">Edit</button>
      </div>
      <div className="space-y-1.5">
        {fields.map((f, i) => (
          f.value && (
            <div key={i} className="flex justify-between gap-3">
              <span className="text-gray text-xs">{f.label}</span>
              <span className="text-foreground text-xs font-medium text-right">{f.value}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default function StepReview({ data, product, onEditStep, onConsentChange, consents }) {
  const fullName = [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(" ");
  const fullAddress = [data.street, data.apt, data.city, `${data.state} ${data.zip}`, data.country].filter(Boolean).join(", ");
  const maskedPhone = data.phone ? data.phone.replace(/\d(?=\d{2})/g, "•") : "";

  return (
    <div>
      <ReviewSection
        title="Account Type"
        onEdit={() => onEditStep(0)}
        fields={[{ label: "Selected Product", value: product?.label }]}
      />
      <ReviewSection
        title="Personal Information"
        onEdit={() => onEditStep(1)}
        fields={[
          { label: "Full Name", value: fullName },
          { label: "Date of Birth", value: data.dob },
        ]}
      />
      <ReviewSection
        title="Contact"
        onEdit={() => onEditStep(2)}
        fields={[
          { label: "Email", value: data.email || data.userId },
          { label: "Mobile", value: maskedPhone },
        ]}
      />
      <ReviewSection
        title="Address"
        onEdit={() => onEditStep(4)}
        fields={[{ label: "Address", value: fullAddress }]}
      />
      <ReviewSection
        title="Identity"
        onEdit={() => onEditStep(5)}
        fields={[
          { label: "SSN", value: data.ssn ? "•••-••-" + data.ssn.slice(-4) : "" },
          { label: "ID — Front", value: data.govIdFront?.name || "Not uploaded" },
          { label: "ID — Back", value: data.govIdBack?.name || "Not uploaded" },
          { label: "Selfie Photo", value: data.selfie?.name || "Not uploaded" },
        ]}
      />
      <ReviewSection
        title="Financial"
        onEdit={() => onEditStep(6)}
        fields={[
          { label: "Employment", value: data.employment },
          { label: "Employer", value: data.employer },
          { label: "Occupation", value: data.occupation },
          { label: "Annual Income", value: data.annualIncome },
          { label: "Source of Funds", value: data.sourceOfFunds },
        ]}
      />

      <div className="space-y-3 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray">Consents & Disclosures</p>
        {[
          { key: "regulatory", label: "I have read and agree to the Deposit Account Agreement and Regulatory Disclosures." },
          { key: "privacy", label: "I acknowledge the Privacy Notice and consent to information sharing as described." },
          { key: "electronic", label: "I consent to electronic delivery of documents and agreements (E-Sign Act)." },
        ].map((item) => (
          <label key={item.key} className="flex items-start gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => onConsentChange(item.key, !consents[item.key])}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                consents[item.key] ? "bg-navy border-navy" : "border-slate-300 bg-white"
              }`}
            >
              {consents[item.key] && <Check size={12} className="text-white" />}
            </button>
            <span className="text-xs text-gray leading-relaxed">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}