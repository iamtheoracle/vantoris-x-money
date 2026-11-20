import React from "react";
import { TextField, SelectField } from "@/components/auth/FormField";

const SUFFIXES = [
  { value: "", label: "None" },
  { value: "Jr.", label: "Jr." },
  { value: "Sr.", label: "Sr." },
  { value: "II", label: "II" },
  { value: "III", label: "III" },
  { value: "IV", label: "IV" },
];

export default function StepPersonalInfo({ data, updateData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="First Name" value={data.firstName} onChange={(v) => updateData({ firstName: v })} required />
        <TextField label="Middle Name" value={data.middleName} onChange={(v) => updateData({ middleName: v })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Last Name" value={data.lastName} onChange={(v) => updateData({ lastName: v })} required />
        <SelectField label="Suffix" value={data.suffix} onChange={(v) => updateData({ suffix: v })} options={SUFFIXES} />
      </div>
      <TextField label="Date of Birth" type="date" value={data.dob} onChange={(v) => updateData({ dob: v })} required />
    </div>
  );
}