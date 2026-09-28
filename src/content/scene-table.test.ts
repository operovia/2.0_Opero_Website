import { describe, expect, it } from 'vitest';
import { formatSceneTable, parseSceneTable } from './scene-table';

describe('parseSceneTable', () => {
  it('treats empty text as no table', () => {
    expect(parseSceneTable('  \n \n')).toEqual({ table: null });
  });

  it('reads cells separated by pipes, with the first line as headings', () => {
    expect(parseSceneTable('Tenant | RSF\nCopperline Coffee | 1,450\n\nNorthgate Insurance|5,200')).toEqual({
      table: { columns: ['Tenant', 'RSF'], rows: [['Copperline Coffee', '1,450'], ['Northgate Insurance', '5,200']] },
    });
  });

  it('reads rows pasted from a spreadsheet', () => {
    expect(parseSceneTable('Tenant\tRSF\r\nCopperline Coffee\t1,450\t\r\n').table).toEqual({ columns: ['Tenant', 'RSF'], rows: [['Copperline Coffee', '1,450']] });
  });

  it('accepts a Markdown table', () => {
    expect(parseSceneTable('| Tenant | RSF |\n|---|---:|\n| Copperline Coffee | 1,450 |').table).toEqual({
      columns: ['Tenant', 'RSF'],
      rows: [['Copperline Coffee', '1,450']],
    });
  });

  it('explains what is wrong', () => {
    expect(parseSceneTable('Tenant').error).toBe('Use 2 to 5 columns, separated by | or tabs.');
    expect(parseSceneTable('Tenant | RSF').error).toBe('Add at least one row under the heading line.');
    expect(parseSceneTable('Tenant | | RSF\nA | B | C').error).toBe('Give every column a heading in the first line.');
    expect(parseSceneTable('Tenant | RSF\nA | 1\nB').error).toBe('Row 2 has 1 cell, but there are 2 headings.');
    expect(parseSceneTable(`Tenant | RSF\n${'A | 1\n'.repeat(6)}`).error).toBe('Use at most 5 rows under the heading line.');
    expect(parseSceneTable(`Tenant | RSF\n${'x'.repeat(41)} | 1`).error).toBe('Keep each cell to 40 characters or fewer.');
  });

  it('round-trips through the text the admin edits', () => {
    const table = { columns: ['Tenant', 'Suite', 'RSF'], rows: [['Copperline Coffee', '101', '1,450']] };
    expect(parseSceneTable(formatSceneTable(table)).table).toEqual(table);
    expect(formatSceneTable(null)).toBe('');
  });
});
