/**
 * CSV for spreadsheet apps. Every cell is quoted, and text that a
 * spreadsheet would run as a formula (starting with =, +, -, @, or a tab
 * or return) is prefixed with an apostrophe so it stays plain text.
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Rows to CSV text, with the byte-order mark Excel needs to read UTF-8. */
export function toCsv(rows: string[][]): string {
  return `﻿${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
