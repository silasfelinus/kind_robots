// /utils/scripts/verifyGeneratedClientParity.ts
//
// Fails a PR whose checked-in prisma/generated/ output no longer matches
// what `prisma generate` produces from the current prisma/schema.prisma.
//
// kind-robots/t-087: PR #2284 ("Add first-class AgentProfile identity",
// merged 2026-09-01T06:15Z) added AgentProfile/AgentProfileCredential to the
// schema but the committed generated client was never regenerated alongside
// it, leaving `server/api/agent-profiles/*.ts` and friends silently
// type-broken on unmodified `main` (~16 vue-tsc errors, confirmed to clear
// once the client was regenerated locally). Nothing else caught this because
// the drift is silent until someone happens to run `prisma generate` and
// notices the diff -- every session before this one independently
// rediscovered and routed around it instead. This guard makes the same class
// of drift schema-migration-parity-contract.yml already catches for
// migrations (kind-robots/t-072) fail loudly for the generated client too.
//
// Runs the real `prisma generate` (writing to the schema's own configured
// output path, same as any local dev run) and checks whether that left the
// working tree dirty. Only meaningful against a clean checkout -- CI runs
// this right after `npm ci` on a fresh clone, before anything else touches
// prisma/generated/, so any diff found here is exactly the schema/client
// drift this guard exists to catch, not incidental local state.
//
//   DATABASE_URL=<dummy> npx tsx utils/scripts/verifyGeneratedClientParity.ts
import { execFileSync } from 'node:child_process'

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}

function fail(message: string): never {
  console.error(`verifyGeneratedClientParity: ${message}`)
  process.exit(1)
}

function main(): void {
  const preexisting = git(['status', '--porcelain', '--', 'prisma/generated/']).trim()
  if (preexisting.length > 0) {
    fail(
      'prisma/generated/ already has uncommitted changes before regeneration -- ' +
        'run this against a clean checkout so its diff means only schema/client drift:\n' +
        preexisting,
    )
  }

  execFileSync('npx', ['prisma', 'generate'], {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? 'mysql://user:pass@127.0.0.1:3306/kindrobots',
    },
    stdio: 'inherit',
  })

  const drift = git(['status', '--porcelain', '--', 'prisma/generated/']).trim()
  if (drift.length > 0) {
    fail(
      'prisma/generated/ differs from `prisma generate` output for the current schema:\n' +
        `${drift}\n` +
        'Run `npx prisma generate` and commit the result alongside this schema change.',
    )
  }

  console.log('verifyGeneratedClientParity: checked-in Prisma client matches the current schema.')
}

main()
