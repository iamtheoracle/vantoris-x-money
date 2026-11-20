export function dollarsToCents(value) {
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(String(value).trim()))
    return null;
  const [whole, fraction = ""] = String(value).trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}
export function validRoutingNumber(value) {
  if (!/^\d{9}$/.test(value) || /^0+$/.test(value)) return false;
  const n = [...value].map(Number);
  const prefix = Number(value.slice(0, 2));
  return (
    ((prefix >= 0 && prefix <= 12) ||
      (prefix >= 21 && prefix <= 32) ||
      (prefix >= 61 && prefix <= 72) ||
      prefix === 80) &&
    (3 * (n[0] + n[3] + n[6]) + 7 * (n[1] + n[4] + n[7]) + n[2] + n[5] + n[8]) %
      10 ===
      0
  );
}
export function filterActivity(
  rows,
  { query = "", status = "all", period = "all", now = Date.now() } = {},
) {
  const cutoff = period === "all" ? null : now - Number(period) * 86400000;
  return rows.filter(
    (tx) =>
      (!query.trim() ||
        `${tx.description || ""} ${tx.type || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())) &&
      (status === "all" || tx.status === status) &&
      (cutoff === null ||
        new Date(tx.created_date || tx.date).getTime() >= cutoff),
  );
}
