/**
 * The Data Room's shape, worked out from its rows: folders inside folders,
 * documents inside folders or at the top, each with its index number. In
 * every folder (and at the top) the folders come first, then the documents,
 * numbered on in one sequence: 1, 2, 3 at the top, 2.1, 2.2 inside the
 * second folder, and so on. Pure, so the admin, the room, and the tests
 * share it.
 */

export type FolderRow = {
  id: string;
  parentId: string | null;
  name: string;
  position: number;
  createdAt: Date;
};

export type DocumentRow = {
  id: string;
  folderId: string | null;
  title: string;
  filename: string;
  contentType: string;
  size: number;
  position: number;
  createdAt: Date;
};

export type RoomDocument = DocumentRow & { index: string };

export type RoomFolder = FolderRow & {
  index: string;
  folders: RoomFolder[];
  documents: RoomDocument[];
  /** Everything inside, at any depth. */
  totalDocuments: number;
};

/** The top of the room: what sits in no folder. */
export type Room = { folders: RoomFolder[]; documents: RoomDocument[]; totalDocuments: number };

/** Siblings keep their saved order; ties, which only a race can make, settle by age. */
const byOrder = <T extends { position: number; createdAt: Date; id: string }>(a: T, b: T) =>
  a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);

export function buildRoom(folderRows: FolderRow[], documentRows: DocumentRow[]): Room {
  const foldersIn = new Map<string | null, FolderRow[]>();
  for (const folder of folderRows) {
    const list = foldersIn.get(folder.parentId) ?? [];
    list.push(folder);
    foldersIn.set(folder.parentId, list);
  }
  const documentsIn = new Map<string | null, DocumentRow[]>();
  for (const document of documentRows) {
    const list = documentsIn.get(document.folderId) ?? [];
    list.push(document);
    documentsIn.set(document.folderId, list);
  }

  const seen = new Set<string>();
  const fill = (parentId: string | null, prefix: string): { folders: RoomFolder[]; documents: RoomDocument[]; totalDocuments: number } => {
    const folders: RoomFolder[] = [];
    let n = 0;
    let totalDocuments = 0;
    for (const row of [...(foldersIn.get(parentId) ?? [])].sort(byOrder)) {
      // A folder can never contain itself, however its rows were edited.
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      const index = `${prefix}${++n}`;
      const inside = fill(row.id, `${index}.`);
      folders.push({ ...row, index, ...inside });
      totalDocuments += inside.totalDocuments;
    }
    const documents: RoomDocument[] = [...(documentsIn.get(parentId) ?? [])].sort(byOrder).map((row) => ({ ...row, index: `${prefix}${++n}` }));
    return { folders, documents, totalDocuments: totalDocuments + documents.length };
  };
  return fill(null, '');
}

/** The folder with this id, wherever it is in the room, or null. */
export function findFolder(room: Room, id: string | null | undefined): RoomFolder | null {
  if (!id) return null;
  const search = (folders: RoomFolder[]): RoomFolder | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      const inside = search(folder.folders);
      if (inside) return inside;
    }
    return null;
  };
  return search(room.folders);
}

/** The folders on the way to this one, the top of the room first. */
export function trailTo(room: Room, id: string): RoomFolder[] {
  const search = (folders: RoomFolder[], trail: RoomFolder[]): RoomFolder[] | null => {
    for (const folder of folders) {
      const here = [...trail, folder];
      if (folder.id === id) return here;
      const inside = search(folder.folders, here);
      if (inside) return inside;
    }
    return null;
  };
  return search(room.folders, []) ?? [];
}

/** Every folder in the room, in index order, with how deep each sits: for the tree in the admin and in the room. */
export function flattenFolders(room: Room): { folder: RoomFolder; depth: number }[] {
  const out: { folder: RoomFolder; depth: number }[] = [];
  const walk = (folders: RoomFolder[], depth: number) => {
    for (const folder of folders) {
      out.push({ folder, depth });
      walk(folder.folders, depth + 1);
    }
  };
  walk(room.folders, 0);
  return out;
}

/** The folder and document ids inside a folder, at any depth, the folder itself included. */
export function idsUnder(folder: RoomFolder): { folderIds: string[]; documentIds: string[] } {
  const folderIds: string[] = [];
  const documentIds: string[] = [];
  const walk = (f: RoomFolder) => {
    folderIds.push(f.id);
    for (const document of f.documents) documentIds.push(document.id);
    for (const inner of f.folders) walk(inner);
  };
  walk(folder);
  return { folderIds, documentIds };
}
