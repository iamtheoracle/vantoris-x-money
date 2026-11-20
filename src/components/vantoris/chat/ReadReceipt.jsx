import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

/** Read receipt indicator based only on the supplied message state. */
export default function ReadReceipt({ read, className = '' }) {
  return read
    ? <CheckCheck size={13} className={'text-champagne ' + className} strokeWidth={2.5} aria-label="Read" />
    : <Check size={13} className={'text-gray/50 ' + className} strokeWidth={2.5} aria-label="Sent" />;
}
