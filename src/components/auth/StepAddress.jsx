import React from "react";
import { TextField, SelectField } from "@/components/auth/FormField";

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" }, { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" }, { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" }, { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "Other", label: "Other" },
];

export default function StepAddress({ data, updateData }) {
  return (
    <div className="space-y-4">
      <TextField label="Street Address" value={data.street} onChange={(v) => updateData({ street: v })} required placeholder="123 Main Street" autoComplete="address-line1" />
      <TextField label="Apartment / Suite" value={data.apt} onChange={(v) => updateData({ apt: v })} placeholder="Apt 4B" autoComplete="address-line2" />
      <TextField label="City" value={data.city} onChange={(v) => updateData({ city: v })} required autoComplete="address-level2" />
      <div className="grid grid-cols-3 gap-3">
        <SelectField label="State" value={data.state} onChange={(v) => updateData({ state: v })} options={US_STATES} required />
        <TextField label="ZIP Code" value={data.zip} onChange={(v) => updateData({ zip: v })} required placeholder="00000" autoComplete="postal-code" />
        <SelectField label="Country" value={data.country} onChange={(v) => updateData({ country: v })} options={COUNTRIES} required />
      </div>
    </div>
  );
}