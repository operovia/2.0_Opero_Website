import { describe, expect, it } from 'vitest';
import { buildRoom, findFolder, flattenFolders, idsUnder, trailTo, type DocumentRow, type FolderRow } from './data-room';
import { documentExtension, documentKind, titleFromFilename } from './documents';

const at = (n: number) => new Date(2026, 0, 1, 0, 0, n);
const folder = (id: string, parentId: string | null, position: number, name = id): FolderRow => ({ id, parentId, name, position, createdAt: at(position) });
const doc = (id: string, folderId: string | null, position: number): DocumentRow => ({
  id,
  folderId,
  title: id,
  filename: `${id}.pdf`,
  contentType: 'application/pdf',
  size: 10,
  position,
  createdAt: at(position),
});

describe('buildRoom', () => {
  const room = buildRoom(
    [folder('b', null, 1), folder('a', null, 0), folder('a1', 'a', 0), folder('a2', 'a', 1), folder('a2x', 'a2', 0)],
    [doc('top', null, 0), doc('in-a', 'a', 0), doc('in-a-2', 'a', 1), doc('deep', 'a2x', 0)],
  );

  it('orders siblings by position, folders before documents, in one numbering', () => {
    expect(room.folders.map((f) => `${f.index} ${f.id}`)).toEqual(['1 a', '2 b']);
    expect(room.documents.map((d) => `${d.index} ${d.id}`)).toEqual(['3 top']);
  });

  it('numbers nested folders and documents under their parent', () => {
    const a = room.folders[0]!;
    expect(a.folders.map((f) => f.index)).toEqual(['1.1', '1.2']);
    expect(a.documents.map((d) => d.index)).toEqual(['1.3', '1.4']);
    expect(a.folders[1]!.folders[0]!.index).toBe('1.2.1');
    expect(a.folders[1]!.folders[0]!.documents[0]!.index).toBe('1.2.1.1');
  });

  it('counts the documents inside a folder at any depth', () => {
    expect(room.totalDocuments).toBe(4);
    expect(room.folders[0]!.totalDocuments).toBe(3);
    expect(room.folders[1]!.totalDocuments).toBe(0);
  });

  it('finds a folder anywhere, and the trail to it', () => {
    expect(findFolder(room, 'a2x')?.index).toBe('1.2.1');
    expect(findFolder(room, 'nope')).toBeNull();
    expect(trailTo(room, 'a2x').map((f) => f.id)).toEqual(['a', 'a2', 'a2x']);
    expect(trailTo(room, 'nope')).toEqual([]);
  });

  it('flattens the folders in index order with their depth', () => {
    expect(flattenFolders(room).map(({ folder, depth }) => `${depth}:${folder.index}`)).toEqual(['0:1', '1:1.1', '1:1.2', '2:1.2.1', '0:2']);
  });

  it('lists everything under a folder', () => {
    const under = idsUnder(room.folders[0]!);
    expect(under.folderIds).toEqual(['a', 'a1', 'a2', 'a2x']);
    expect(under.documentIds.sort()).toEqual(['deep', 'in-a', 'in-a-2']);
  });

  it('never loops on a folder that claims to contain itself', () => {
    const looped = buildRoom([folder('x', 'y', 0), folder('y', 'x', 0), folder('top', null, 0)], []);
    expect(looped.folders.map((f) => f.id)).toEqual(['top']);
  });
});

describe('document rules', () => {
  it('takes the kinds a data room holds, by extension, whatever the case', () => {
    expect(documentExtension('Deck.PDF')).toBe('pdf');
    expect(documentExtension('photo.JPEG')).toBe('jpg');
    expect(documentExtension('model.xlsx')).toBe('xlsx');
  });

  it('refuses what it does not serve', () => {
    expect(documentExtension('page.html')).toBeNull();
    expect(documentExtension('logo.svg')).toBeNull();
    expect(documentExtension('script.js')).toBeNull();
    expect(documentExtension('noext')).toBeNull();
  });

  it('serves PDFs and images in the browser and the rest as downloads', () => {
    expect(documentKind('a.pdf')).toMatchObject({ type: 'application/pdf', inline: true });
    expect(documentKind('a.xlsx').inline).toBe(false);
    expect(documentKind('a.unknown')).toMatchObject({ type: 'application/octet-stream', label: 'File', inline: false });
  });

  it('makes a readable title from a file name', () => {
    expect(titleFromFilename('Q3_2026-investor_update.pdf')).toBe('Q3 2026-investor update');
    expect(titleFromFilename('.pdf')).toBe('Document');
  });
});
