/**
 * A small grid in an Oppie console answer, such as a rent roll: a header row
 * and a few rows. The admin edits it as text, one row per line, with cells
 * separated by tabs (as pasted from a spreadsheet) or by |.
 */
export type SceneTable = { columns: string[]; rows: string[][] };

export const TABLE_LIMITS = { minColumns: 2, maxColumns: 5, maxRows: 5, cell: 40 } as const;

/** The table as the admin edits it: one line per row, cells separated by " | ". */
export function formatSceneTable(table: SceneTable | null): string {
  if (!table) return '';
  return [table.columns, ...table.rows].map((row) => row.join(' | ')).join('\n');
}

function cells(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((cell) => cell.trim());
  // Pipes, allowing the outer ones of a Markdown table.
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/** Reads the admin's text into a table. Empty text means no table. */
export function parseSceneTable(text: string): { table: SceneTable | null; error?: string } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    // Blank lines, and the ---|--- line under a Markdown table's header.
    .filter((line) => line && !/^[\s|:-]+$/.test(line));
  if (!lines.length) return { table: null };

  const [columns = [], ...rows] = lines.map(cells);
  const { minColumns, maxColumns, maxRows, cell } = TABLE_LIMITS;
  if (columns.length < minColumns || columns.length > maxColumns) {
    return { table: null, error: `Use ${minColumns} to ${maxColumns} columns, separated by | or tabs.` };
  }
  if (columns.some((heading) => !heading)) return { table: null, error: 'Give every column a heading in the first line.' };
  if (!rows.length) return { table: null, error: 'Add at least one row under the heading line.' };
  if (rows.length > maxRows) return { table: null, error: `Use at most ${maxRows} rows under the heading line.` };
  const uneven = rows.findIndex((row) => row.length !== columns.length);
  if (uneven >= 0) {
    const count = rows[uneven]!.length;
    return { table: null, error: `Row ${uneven + 1} has ${count} ${count === 1 ? 'cell' : 'cells'}, but there are ${columns.length} headings.` };
  }
  if ([columns, ...rows].some((row) => row.some((value) => value.length > cell))) {
    return { table: null, error: `Keep each cell to ${cell} characters or fewer.` };
  }
  return { table: { columns, rows } };
}
