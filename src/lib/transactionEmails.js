/** Email delivery adapter intentionally fails closed until an authorized mail provider exists. */
export async function sendTransactionEmail(_message = {}) {
  return { sent: false, reason: 'Transaction email delivery is not configured.' };
}
