import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Read-only adapter for the application's existing member account integration.
export function useBankingRecords({ activity = false, cards = false } = {}) {
  const [state, setState] = useState({
    accounts: [],
    transactions: [],
    cards: [],
    loading: true,
    error: false,
    activityError: false,
  });
  const [version, setVersion] = useState(0);
  const retry = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState((previous) => ({
      ...previous,
      loading: true,
      error: false,
      activityError: false,
    }));
    (async () => {
      try {
        const me = await base44.auth.me();
        const accounts = await base44.entities.Account.filter(
          { user_id: me.id },
          "-created_date",
        );
        const result = {
          accounts: Array.isArray(accounts) ? accounts : [],
          transactions: [],
          cards: [],
          loading: false,
          error: false,
          activityError: false,
        };
        if (activity) {
          try {
            const batches = await Promise.all(
              result.accounts.map((account) =>
                base44.entities.Transaction.filter(
                  { account_id: account.id },
                  "-created_date",
                  100,
                ),
              ),
            );
            result.transactions = [
              ...new Map(batches.flat().map((tx) => [tx.id, tx])).values(),
            ].sort(
              (a, b) =>
                new Date(b.created_date || b.date || 0) -
                new Date(a.created_date || a.date || 0),
            );
          } catch {
            result.activityError = true;
          }
        }
        if (cards) {
          const cardRows = await base44.entities.PaymentCard.filter(
            { user_id: me.id },
            "-created_date",
          );
          result.cards = Array.isArray(cardRows) ? cardRows : [];
        }
        if (active) setState(result);
      } catch {
        if (active)
          setState({
            accounts: [],
            transactions: [],
            cards: [],
            loading: false,
            error: true,
            activityError: false,
          });
      }
    })();
    return () => {
      active = false;
    };
  }, [version, activity, cards]);
  return { ...state, retry };
}
