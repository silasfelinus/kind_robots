// /utils/scripts/verifyMigrateOnDeploy.ts
//
// The deployed image can migrate itself, and only the throwaway container may.
//
// WHY
// ---
// Migrations stopped running anywhere when Vercel was retired:
// `scripts/vercel-build.mjs` had been the thing that ran them, and the container
// path runs plain `npm run build`. Merging a migration to main applied it to
// nothing.
//
// The fix is a one-shot `migrate` service that the app is gated behind. Two
// separate things have to stay true for that to work, and both are invisible
// until a deploy fails:
//
//   1. The RUNTIME image must carry prisma/ and scripts/. It originally copied
//      only .output, node_modules and package.json -- so the wrapper script, the
//      schema and the migration SQL were all absent, and `migrate deploy` inside
//      the image was impossible. That is not a hypothetical: it is why
//      migrations had to be run from a separate checkout on the host, against
//      whatever revision that checkout happened to be sitting on. A future
//      image-slimming pass would reintroduce it silently.
//
//   2. The migration credential must reach the one-shot container and NOT the
//      long-running app. docs/runbooks/migration-credential-boundary.md exists
//      to keep schema-write capability out of the application lane, and
//      prisma-migrate-deploy.mjs refuses DATABASE_URL outright. Moving
//      MIGRATION_DATABASE_URL into the app service to "simplify" would hand a
//      permanently-running web process the ability to drop tables.
//
//   npx tsx utils/scripts/verifyMigrateOnDeploy.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8')
const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf8')

// -------------------------------------------------- the image can migrate

// Only the runtime stage matters; the build stage has the whole repo anyway.
const runtimeStage = dockerfile.slice(dockerfile.lastIndexOf('FROM '))

// Matched with a trailing-whitespace lookahead rather than \b. A word boundary
// sits between "prisma" and the dot in "prisma.config.ts", so /app/prisma\b was
// satisfied by the config-file COPY alone -- the assertion for the prisma/
// DIRECTORY passed with the directory absent, which is the exact regression this
// is here to catch. Caught by deleting the line and watching the contract pass.
for (const required of ['prisma', 'scripts', 'prisma.config.ts']) {
  const escaped = required.replaceAll('.', '\\.')
  assert.match(
    runtimeStage,
    new RegExp(`COPY --from=build[^\\n]*/app/${escaped}(?=\\s)`),
    `the runtime image must carry ${required}. Without it, "prisma migrate deploy" cannot run inside the deployed image -- the wrapper, the schema or the migration SQL is missing -- and migrate-on-deploy silently stops working.`,
  )
}

// ------------------------------------------------- the gate actually gates

assert.match(
  compose,
  /^ {2}migrate:/m,
  'docker-compose.yml must define a one-shot migrate service',
)
assert.match(
  compose,
  /command:\s*\["node",\s*"scripts\/prisma-migrate-deploy\.mjs"\]/,
  'the migrate service must run the wrapper, not `prisma migrate deploy` directly -- the wrapper does the TLS preflight and the known-failed-migration repair, and refuses to fall back to DATABASE_URL',
)
assert.match(
  compose,
  /restart:\s*"no"/,
  'the migrate service must not restart; it is a one-shot that exits',
)
assert.match(
  compose,
  /condition:\s*service_completed_successfully/,
  'the app must be gated on the migration completing successfully, or it can serve against a schema that was never applied',
)

// ------------------------------------------- the credential stays scoped

const services = compose.split(/^ {2}(?=[a-z-]+:)/m)
const migrateService = services.find((block) => block.startsWith('migrate:'))
const appService = services.find((block) => block.startsWith('kind-robots:'))
assert.ok(migrateService && appService, 'expected both migrate and kind-robots services')

assert.match(
  migrateService!,
  /MIGRATION_DATABASE_URL:/,
  'the migrate service needs the elevated credential',
)
assert.doesNotMatch(
  appService!,
  /MIGRATION_DATABASE_URL/,
  'the long-running app container must never receive MIGRATION_DATABASE_URL. A web process that can drop tables is precisely what the migration credential boundary exists to prevent.',
)
assert.match(
  migrateService!,
  /\$\{MIGRATION_DATABASE_URL:\?/,
  'an unset credential must fail the deploy loudly rather than skipping migrations -- silently serving un-migrated schema is the failure this whole service exists to end',
)

console.log(
  'Migrate-on-deploy verified: runtime image carries prisma/, scripts/ and prisma.config.ts; app gated on a one-shot migrate; credential scoped to it.',
)
