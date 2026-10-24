/**
 * Production admin bootstrap for Pen Times Magazine.
 *
 * WHY this exists:
 *   Migrations create empty tables and public registration only ever creates
 *   `reader` accounts. The seed script can create an admin, but it also inserts
 *   sample data with hardcoded, publicly-known passwords — never acceptable in
 *   production. This script creates (or promotes) exactly ONE admin account and
 *   nothing else.
 *
 * Usage (password is never printed, and never stored in plain text):
 *
 *   # Interactive — prompts for the password with hidden input (recommended)
 *   pnpm --filter api db:create-admin --email you@pentimes.ng --name "Your Name"
 *
 *   # Non-interactive — one-time environment variables
 *   ADMIN_EMAIL=you@pentimes.ng ADMIN_NAME="Your Name" ADMIN_PASSWORD='...' \
 *     pnpm --filter api db:create-admin
 *
 *   # Inside the production API container (compiled output)
 *   docker compose --env-file .env.production -f docker-compose.prod.yml \
 *     exec -it api node dist/db/create-admin.js --email you@pentimes.ng --name "Your Name"
 *
 * Flags override environment variables. Passing --password on the command line
 * works but leaks the password into shell history and the process list, so
 * prefer the prompt or ADMIN_PASSWORD.
 *
 * Behaviour:
 *   - New email                → creates an admin.
 *   - Email already an admin   → does nothing (safe to re-run).
 *   - Email is reader/author   → refuses unless --promote is passed. The
 *                                existing password is NEVER changed.
 */

import { parseArgs } from 'node:util';
import { RegisterSchema } from '@pentimes/shared';

// Stricter than public registration (8): this account controls the whole site.
const ADMIN_PASSWORD_MIN = 12;

const HELP = `
Create the first admin account (or promote an existing user to admin).

Options:
  --email <email>      Admin email                (or ADMIN_EMAIL)
  --name <name>        Display name               (or ADMIN_NAME, default "Pen Times Admin")
  --password <pw>      Password                   (or ADMIN_PASSWORD; prompted if omitted)
  --promote            Allow promoting an existing reader/author to admin
  --help               Show this help
`;

function fail(message: string): never {
  process.stderr.write(`\n✗ ${message}\n\n`);
  process.exit(1);
}

/** Reads a line from the terminal without echoing it. */
function promptHidden(label: string): Promise<string> {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    let value = '';

    stdout.write(label);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') {            // Ctrl+C
          stdin.setRawMode(false);
          stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') {
          value = value.slice(0, -1);     // Backspace
        } else {
          value += ch;
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function resolvePassword(provided: string | undefined): Promise<string> {
  if (provided) return provided;

  if (!process.stdin.isTTY) {
    fail(
      'No password provided and no terminal available to prompt. ' +
        'Set ADMIN_PASSWORD, or run with an interactive terminal (docker compose exec -it ...).'
    );
  }

  const first  = await promptHidden('Admin password: ');
  const second = await promptHidden('Confirm password: ');
  if (first !== second) fail('Passwords do not match.');
  return first;
}

async function main(): Promise<void> {
  // pnpm forwards a literal "--" when people write `db:create-admin -- --email ...`;
  // drop it so both invocation styles work.
  const argv = process.argv.slice(2);
  if (argv[0] === '--') argv.shift();

  const { values } = parseArgs({
    args: argv,
    options: {
      email:    { type: 'string' },
      name:     { type: 'string' },
      password: { type: 'string' },
      promote:  { type: 'boolean', default: false },
      help:     { type: 'boolean', default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    process.stdout.write(HELP);
    return;
  }

  const email = values.email ?? process.env['ADMIN_EMAIL'];
  const name  = values.name  ?? process.env['ADMIN_NAME'] ?? 'Pen Times Admin';
  if (!email) fail('An email is required: pass --email or set ADMIN_EMAIL.\n' + HELP);

  const password = await resolvePassword(values.password ?? process.env['ADMIN_PASSWORD']);

  // Same rules as public registration (also lowercases/trims the email)...
  const parsed = RegisterSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n  '));
  }
  // ...plus a longer minimum for an admin.
  if (parsed.data.password.length < ADMIN_PASSWORD_MIN) {
    fail(`Admin password must be at least ${ADMIN_PASSWORD_MIN} characters.`);
  }

  // Loaded only now so `--help` and validation errors don't need DB/env config.
  const { db, pool }      = await import('../config/db.js');
  const { users }         = await import('./schema/index.js');
  const { eq }            = await import('drizzle-orm');
  const { hashPassword }  = await import('../helpers/hash-password.js');

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (existing) {
      if (existing.role === 'admin') {
        process.stdout.write(`✓ ${existing.email} is already an admin. Nothing to do.\n`);
        return;
      }
      if (!values.promote) {
        fail(
          `${existing.email} already exists with role "${existing.role}". ` +
            'Re-run with --promote to make this user an admin (their password is left unchanged).'
        );
      }

      await db.update(users).set({ role: 'admin' }).where(eq(users.id, existing.id));
      process.stdout.write(`✓ Promoted ${existing.email} from "${existing.role}" to admin.\n`);
      return;
    }

    const [created] = await db
      .insert(users)
      .values({
        name:     parsed.data.name,
        email:    parsed.data.email,
        password: await hashPassword(parsed.data.password),
        role:     'admin',
      })
      .returning({ id: users.id, email: users.email, role: users.role });

    process.stdout.write(`✓ Created admin ${created!.email} (id: ${created!.id}).\n`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  fail(`Failed to create admin: ${err instanceof Error ? err.message : String(err)}`);
});
