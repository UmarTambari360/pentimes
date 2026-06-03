import { defineConfig } from 'drizzle-kit';
import * as dotenv      from 'dotenv';
import fs               from 'fs';
import Module           from 'module';
import path             from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const originalResolveFilename = (Module as any)._resolveFilename;
const originalLoad = (Module as any)._load;

// Drizzle Kit loads the TypeScript schema directly through CommonJS. The API
// uses NodeNext-style `.js` specifiers so compiled output runs in Node, but
// those `.js` files do not exist next to the source `.ts` files during
// drizzle-kit generate/push. Bridge only local schema imports back to `.ts`.
function maybeSchemaTsRequest(request: string, parent: NodeModule | null | undefined) {
  if (
    parent?.filename.includes(`${path.sep}src${path.sep}db${path.sep}schema${path.sep}`) &&
    request.startsWith('.') &&
    request.endsWith('.js')
  ) {
    const tsRequest = request.replace(/\.js$/, '.ts');
    const tsPath = path.resolve(path.dirname(parent.filename), tsRequest);

    if (fs.existsSync(tsPath)) return tsRequest;
  }

  return request;
}

(Module as any)._load = function loadSchemaTsImports(request: string, parent: NodeModule | null | undefined, isMain: boolean) {
  return originalLoad.call(this, maybeSchemaTsRequest(request, parent), parent, isMain);
};

(Module as any)._resolveFilename = function resolveSchemaTsImports(request: string, parent: NodeModule | null | undefined, ...rest: any[]) {
  return originalResolveFilename.call(this, maybeSchemaTsRequest(request, parent), parent, ...rest);
};

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is required for drizzle-kit');
}

export default defineConfig({
  schema: './src/db/schema/index.ts',        // ← Better: use barrel file
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
  verbose: true,
  strict: true,
});
