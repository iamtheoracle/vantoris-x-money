import React from "react";
import { TextField } from "@/components/auth/FormField";
import { Mail, Phone } from "lucide-react";

export default function StepContactInfo({ data, updateData }) {
  return (
    <div className="space-y-4">
      <TextField
        label="Email Address"
        type="email"
        value={data.email}
        onChange={(v) => updateData({ email: v })}
        placeholder="you@example.com"
        required
        autoComplete="email"
        icon={Mail}
      />
      <TextField
        label="Mobile Phone"
        type="tel"
        value={data.phone}
        onChange={(v) => updateData({ phone: v })}
        placeholder="+1 (000) 000-0000"
        required
        autoComplete="tel"
        icon={Phone}
      />
      <p className="text-xs text-gray leading-relaxed">
        We use your email and mobile phone for account verification, security alerts, and important account notifications.
      </p>
    </div>
  );
}