import React from "react";
import { TextField, SelectField } from "@/components/auth/FormField";

const EMPLOYMENT_STATUSES = [
  { value: "Employed", label: "Employed" },
  { value: "Self-Employed", label: "Self-Employed" },
  { value: "Retired", label: "Retired" },
  { value: "Unemployed", label: "Unemployed" },
  { value: "Student", label: "Student" },
];

const INCOME_RANGES = [
  { value: "Under $50,000", label: "Under $50,000" },
  { value: "$50,000 - $99,999", label: "$50,000 – $99,999" },
  { value: "$100,000 - $249,999", label: "$100,000 – $249,999" },
  { value: "$250,000 - $499,999", label: "$250,000 – $499,999" },
  { value: "$500,000 - $999,999", label: "$500,000 – $999,999" },
  { value: "$1,000,000+", label: "$1,000,000+" },
];

const FUND_SOURCES = [
  { value: "Salary", label: "Salary / Wages" },
  { value: "Business Income", label: "Business Income" },
  { value: "Investment Income", label: "Investment Income" },
  { value: "Inheritance", label: "Inheritance" },
  { value: "Real Estate", label: "Real Estate" },
  { value: "Other", label: "Other" },
];

export default function StepFinancial({ data, updateData }) {
  return (
    <div className="space-y-4">
      <SelectField label="Employment Status" value={data.employment} onChange={(v) => updateData({ employment: v })} options={EMPLOYMENT_STATUSES} required />
      <TextField label="Employer" value={data.employer} onChange={(v) => updateData({ employer: v })} placeholder="Company name" />
      <TextField label="Occupation" value={data.occupation} onChange={(v) => updateData({ occupation: v })} placeholder="e.g. Software Engineer" />
      <SelectField label="Annual Income" value={data.annualIncome} onChange={(v) => updateData({ annualIncome: v })} options={INCOME_RANGES} required />
      <SelectField label="Source of Funds" value={data.sourceOfFunds} onChange={(v) => updateData({ sourceOfFunds: v })} options={FUND_SOURCES} required />
    </div>
  );
}