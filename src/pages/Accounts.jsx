import React from 'react';
import MoveMoney from './MoveMoney';

export default function Accounts() {
  return (
    <div className="accounts-combined-page">
      <style>{`
        .accounts-combined-page .accounts-money-content header { display: none; }
        .accounts-combined-page .accounts-money-content > div { padding-top: 0; }
      `}</style>

      <header className="px-5 pt-6 pb-1 max-w-[430px] mx-auto">
        <p className="text-gray text-sm">Your banking relationship</p>
        <h1 className="text-3xl font-bold mt-1">Accounts</h1>
        <p className="text-gray text-sm mt-1">Accounts, cards, payments and transfers in one place.</p>
      </header>

      <div className="accounts-money-content">
        <MoveMoney />
      </div>
    </div>
  );
}
