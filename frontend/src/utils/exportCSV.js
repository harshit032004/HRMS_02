/**
 * exportCSV.js — pure-JS CSV export helper (no external libraries)
 *
 * Usage:
 *   import { exportCSV } from '../utils/exportCSV';
 *   const count = exportCSV({ headers, rows, filename });
 *   // returns the number of rows written
 */

/**
 * Escape a single cell value for CSV:
 *  - wrap in quotes if it contains a comma, quote, or newline
 *  - double any internal quote characters
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of row-arrays into a CSV string.
 * @param {string[]}   headers  - Column header labels
 * @param {any[][]}    rows     - Array of value arrays (one per row)
 * @returns {string}  Full CSV text (UTF-8, CRLF line endings for Excel compat)
 */
function buildCSV(headers, rows) {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ];
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of the given CSV content.
 * @param {string} csvContent
 * @param {string} filename
 */
function downloadCSV(csvContent, filename) {
  // BOM prefix makes Excel open UTF-8 CSVs correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main export function.
 *
 * @param {object}   options
 * @param {string[]} options.headers   - Column headers
 * @param {any[][]}  options.rows      - Data rows (array of value arrays)
 * @param {string}   options.filename  - Download filename (e.g. "attendance-2026-05-21.csv")
 * @returns {number} Number of data rows exported
 */
export function exportCSV({ headers, rows, filename }) {
  if (!headers?.length || !rows) throw new Error('exportCSV: headers and rows are required');
  const csv = buildCSV(headers, rows);
  downloadCSV(csv, filename);
  return rows.length;
}

/**
 * Convenience: build a today-stamped filename.
 * @param {string} prefix  e.g. "attendance" or "leaves"
 * @returns {string}       e.g. "attendance-2026-05-21.csv"
 */
export function csvFilename(prefix) {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}-${today}.csv`;
}
