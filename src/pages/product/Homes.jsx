import React from 'react';
import ProductShell from './ProductShell';
import UnavailableState from '@/components/vantoris/UnavailableState';
import {PROVIDERS} from '@/lib/providers';
export default function Homes(){return <ProductShell kicker="Homes" title="Homes" subtitle="Property listings are separate from Vantoris member balances and ledger operations."><UnavailableState title="Listing provider not connected" detail={PROVIDERS.homes.note}/></ProductShell>;}
