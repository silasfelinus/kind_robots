// /utils/scripts/verifyMigrateOnDeploy.ts
//
// The deployed image can migrate itself, and only the throwaway container may.
//
// WHY
// ---
// Migrations stopped running when the former hosted deploy path was retired:
// The provider-specific build script had been the thing that ran them, and the container
// path runs plain `npm run build`. Merging a migration to main applied it to
// nothing.
//
// The fix has two production shapes that must enforce the same invariant:
// docker compose gates the app behind a one-shot migrate service, while Alexandria's
// User Scripts + DockerMan deployment runs the matching image's migrations before asking
// Unraid to recreate the production container.
//
//   npx tsx utils/scripts/verifyMigrateOnDeploy.ts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const dockerfile = readFileSync(join(root, 'Dockerfile'), 'utf8')
const compose = readFileSync(join(root, 'docker-compose.yml'), 'utf8')
const unraidDeploy = readFileSync(join(root, 'scripts/deploy-unraid.sh'), 'utf8')
const unraidUserScript = readFileSync(
  join(root, 'scripts/unraid-user-script.sh'),
  'utf8',
)
const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8')
const unraidRunbook = readFileSync(
  join(root, 'docs/runbooks/unraid-auto-deploy.md'),
  'utf8',
)

// -------------------------------------------------- the image can migrate

// Only the runtime stage matters; the build stage has the whole repo anyway.
const runtimeStage = dockerfile.slice(dockerfile.lastIndexOf('FROM '))

for (const required of ['prisma', 'scripts', 'prisma.config.ts']) {
  const escaped = required.replaceAll('.', '\\.')
  assert.match(
    runtimeStage,
    new RegExp(`COPY --from=build[^\\n]*/app/${escaped}(?=\\s)`),
    `the runtime image must carry ${required}. Without it, "prisma migrate deploy" cannot run inside the deployed image -- the wrapper, the schema or the migration SQL is missing -- and migrate-on-deploy silently stops working.`,
  )
}

// ------------------------------------------------- compose actually gates

assert.match(
  compose,
  /^ {2}migrate:/m,
  'docker-compose.yml must define a one-shot migrate service',
)
assert.match(
  compose,
  /command:\s*\["node",\s*"scripts\/prisma-migrate-deploy\.mjs"\]/,
  'the migrate service must run the wrapper, not `prisma migrate deploy` directly -- the wrapper does the TLS preflight and refuses to fall back to DATABASE_URL',
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

// ------------------------------------------- the box runs what CI built

for (const [name, block] of [
  ['migrate', migrateService!],
  ['kind-robots', appService!],
] as const) {
  assert.doesNotMatch(
    block,
    /^\s{4}build:/m,
    `the ${name} service declares build:. The deployed image must come from the registry, or the host silently compiles its own and diverges from what CI built and tested.`,
  )
}

const images = [...compose.matchAll(/^ {4}image:\s*(.+)$/gm)].map((match) =>
  (match[1] as string).trim(),
)
assert.equal(
  images.length,
  2,
  `expected exactly two service images, found ${images.length}`,
)
assert.equal(
  images[0],
  images[1],
  'migrate and the app must reference the identical image; a divergence migrates with one build and serves another',
)
assert.match(
  images[0]!,
  /^\*/,
  'both services must share one YAML anchor rather than repeating the reference, so they cannot drift apart in a later edit',
)
assert.match(
  compose,
  /^x-kind-robots-image:\s*&kind-robots-image\s+\$\{KIND_ROBOTS_IMAGE:-ghcr\.io\//m,
  'the anchor must default to the GHCR image CI publishes, and stay overridable so a sha- tag can be pinned for rollback',
)

// -------------------------------- Alexandria's real production path gates too

assert.match(
  unraidDeploy,
  /^set -Eeuo pipefail$/m,
  'the Unraid deployer must fail closed when a migration or update command fails',
)
assert.match(
  unraidDeploy,
  /flock -n 9/,
  'scheduled Alexandria deploys need a host lock so overlapping User Script runs cannot race',
)
assert.match(
  unraidDeploy,
  /STATE_DIR="\$\{KIND_ROBOTS_DEPLOY_STATE_DIR:-\$APP_DIR\/\.deploy-state\}"/,
  'deployment verification state must live in persistent appdata rather than Unraid rootfs',
)
assert.match(
  unraidDeploy,
  /\. "\$MIGRATION_ENV"/,
  'the deployer must load the isolated migration handoff file rather than the application env file',
)
assert.doesNotMatch(
  unraidDeploy,
  /\. "\$ENV_FILE"/,
  'the application .env must never be sourced as shell code',
)
assert.match(
  unraidDeploy,
  /node scripts\/prisma-migrate-deploy\.mjs/,
  'Alexandria must use the same guarded Prisma wrapper as compose',
)
assert.match(
  unraidDeploy,
  /dynamix\.docker\.manager\/scripts\/update_container/,
  'Alexandria must recreate KindRobots through Unraid DockerMan so its saved template remains authoritative',
)

const pullIndex = unraidDeploy.indexOf('docker pull "$IMAGE"')
const migrateIndex = unraidDeploy.indexOf('run_migrations "$IMAGE"')
const updateIndex = unraidDeploy.indexOf(
  'php -q "$UNRAID_UPDATE_SCRIPT" "$CONTAINER"',
)
assert.ok(pullIndex >= 0, 'Unraid deployer must pull the registry image')
assert.ok(migrateIndex > pullIndex, 'migration must use the image after it is pulled')
assert.ok(
  updateIndex > migrateIndex,
  'Unraid container replacement must happen only after the matching image migration succeeds',
)

assert.match(
  unraidUserScript,
  /git -C "\$APP_DIR" pull --ff-only/,
  'the User Scripts launcher should refresh the production checkout when main is clean',
)
assert.match(
  unraidUserScript,
  /exec \/bin\/bash "\$APP_DIR\/scripts\/deploy-unraid\.sh"/,
  'the User Scripts launcher must delegate to the guarded deployer instead of duplicating deployment logic',
)
assert.match(
  unraidRunbook,
  /Schedule it for every \*\*5 minutes\*\*/,
  'the runbook must tell the operator to use persistent Unraid User Scripts scheduling',
)
assert.doesNotMatch(
  unraidRunbook,
  /install-unraid-auto-deploy\.sh|custom_cron|update_cron/,
  'the runbook must not depend on volatile or hand-managed cron installation',
)
assert.match(
  unraidRunbook,
  /Migration compatibility rule/,
  'automatic migration-before-update requires a documented old-build/new-schema compatibility rule',
)

// ------------------------------------------- agents cannot lose the handoff

assert.match(
  agents,
  /Self-hosted production — merge is not deploy/,
  'every agent origin must be told that a merge is not a self-hosted production deployment',
)
assert.match(
  agents,
  /merged → image published → deployed → schema\s+verified/,
  'agent handoffs must distinguish merge, publication, deployment, and schema verification',
)
assert.match(
  agents,
  /Do not tell Silas to use Force Update as the normal Kind Robots deploy step/,
  'agents must route production changes through the migration-aware deployer, not the migration-blind UI shortcut',
)
assert.match(
  agents,
  /User Scripts/,
  'all agents must know that Alexandria scheduling is owned by Unraid User Scripts',
)

console.log(
  'Migrate-on-deploy verified: compose and Alexandria both migrate before serving new code; User Scripts owns persistent scheduling; migration credentials stay scoped; all agents carry the self-hosted handoff contract.',
)
