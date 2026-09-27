import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Orval exports both its Zod runtime schemas and TypeScript-only types with
// overlapping names. Consumers of api-zod need the runtime schemas; generated
// client types are available from api-client-react instead.
await writeFile(
  fileURLToPath(new URL('../api-zod/src/index.ts', import.meta.url)),
  'export * from "./generated/api";\n',
);