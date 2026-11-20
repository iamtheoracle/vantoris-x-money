import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** @param {{ label: string, value?: string|number, onChange: (value: string) => void, type?: string, placeholder?: string, required?: boolean, autoComplete?: string, icon?: any }} param0 */
export function TextField({ label, value, onChange, type = "text", placeholder, required, autoComplete, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-gray">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </Label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />}
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`h-12 bg-white border-slate-200 ${Icon ? "pl-10" : ""}`}
        />
      </div>
    </div>
  );
}

/** @param {{ label: string, value?: string|number, onChange: (value: string) => void, options: Array<{value: string, label: string}>, required?: boolean, placeholder?: string }} param0 */
export function SelectField({ label, value, onChange, options, required, placeholder = "Select..." }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-gray">
        {label}{required && <span className="text-crimson ml-0.5">*</span>}
      </Label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm text-foreground outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/** @param {{ label: string, description?: string, checked: boolean, onChange: (checked: boolean) => void }} param0 */
export function ToggleField({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-gray mt-0.5">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}