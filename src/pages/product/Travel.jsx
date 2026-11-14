import React from 'react';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';
import {PROVIDERS} from '@/lib/providers';
export default function Travel(){return <ProductShell kicker="Travel" title="Travel" subtitle="Travel services are optional and do not participate in Vantoris ledger operations."><div className="space-y-3">{['flights','hotels','cars','flightTracking'].map(key=><UnavailableState key={key} title={PROVIDERS[key].label} detail={PROVIDERS[key].note}/>)}</div></ProductShell>;}
