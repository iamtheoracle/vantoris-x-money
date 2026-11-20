/** Export already-loaded rows only; this is not a substitute for a complete server report. */
export function exportToCsv(filename, headers = [], rows = []) {
  if (typeof window === 'undefined' || !Array.isArray(rows)) return false;
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const normalizedHeaders = Array.isArray(headers) ? headers : [];
  const matrix = rows.map((row) => Array.isArray(row)
    ? row
    : normalizedHeaders.map((header) => row && typeof row === 'object' ? row[header] : ''));
  const csv = [normalizedHeaders, ...matrix].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (String(filename || 'export').replace(/[^a-z0-9_-]/gi, '_') || 'export') + '.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return true;
}
