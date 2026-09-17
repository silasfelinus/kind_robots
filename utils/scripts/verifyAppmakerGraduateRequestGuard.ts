// /utils/scripts/verifyAppmakerGraduateRequestGuard.ts
//
// Regression guard (appmaker/t-010) for graduate-request.post.ts, the
// admin-only endpoint that files a request to graduate a monorepo app
// (apps/<slug>/) out to its own external repo. Modeled on
// verifyAppmakerScaffoldCollisionGuard.ts and
// verifyAppmakerPendingScaffoldPatternGuard.ts's textual-contract style,
// since graduating an app is irreversible/repo-mutating work once its
// (not-yet-built) executor lands, so the request-filing half's safety
// invariants are worth pinning down now rather than trusting them by
// inspection:
//
//   1. Admin-only: must call requireAdminApiUser, not the plain
//      requireApiUser the two self-serve flows use — a monorepo app has no
//      individual owner (Silas's 2026-09-07 decision), so only an admin may
//      request its graduation.
//   2. Collision guard: must refuse when an AppRepo already exists for the
//      slug, before creating a new one — otherwise a second request (or a
//      request against an already-graduated app) silently double-files.
//   3. Never trust client-supplied owner/repo: must check the installation
//      belongs to the requesting user, is not suspended, and that GitHub
//      currently reports the target repo as granted via
//      listInstallationRepositories — the same three checks
//      github/create-app.post.ts already enforces for its own external-repo
//      request.
//   4. The filed Todo's title must stay in the exact shape
//      apps.get.ts's GRADUATE_TITLE_RE expects, or a filed request silently
//      stops appearing in the "Graduation requested" badge.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ROUTE_PATH = join(
  repositoryRoot,
  'server/api/appmaker/graduate-request.post.ts',
)
const APPS_ROUTE_PATH = join(repositoryRoot, 'server/api/appmaker/apps.get.ts')

export function checkGraduateRequestGuard(
  routeContent: string,
  appsRouteContent: string,
): string[] {
  const errors: string[] = []

  if (!/requireAdminApiUser\(event\)/.test(routeContent)) {
    errors.push(
      'graduate-request.post.ts no longer calls requireAdminApiUser(event) ' +
        '-- a monorepo app has no individual owner, so this must stay ' +
        'admin-only rather than falling back to requireApiUser.',
    )
  }

  if (
    !/prisma\.appRepo\.findFirst\(\{\s*where:\s*\{\s*slug\s*\}/.test(
      routeContent,
    )
  ) {
    errors.push(
      'graduate-request.post.ts no longer checks for an existing AppRepo ' +
        'by slug before creating one -- a second graduation request (or one ' +
        'against an already-graduated app) can silently double-file.',
    )
  }

  if (
    !/githubInstallation\.findFirst\(\{\s*where:\s*\{\s*id:\s*installationId,\s*userId:\s*user\.id\s*\}/.test(
      routeContent,
    )
  ) {
    errors.push(
      'graduate-request.post.ts no longer scopes the installation lookup ' +
        'to the requesting user -- this must never trust a client-supplied ' +
        "installationId that belongs to someone else's installation.",
    )
  }

  if (!/installation\.suspendedAt/.test(routeContent)) {
    errors.push(
      'graduate-request.post.ts no longer checks installation.suspendedAt ' +
        '-- a suspended installation should be refused, not silently used.',
    )
  }

  if (!/listInstallationRepositories\(/.test(routeContent)) {
    errors.push(
      'graduate-request.post.ts no longer calls ' +
        'listInstallationRepositories() -- owner/repo must be checked ' +
        'against what GitHub currently reports as granted, never trusted ' +
        'from the client alone.',
    )
  }

  if (
    !/title:\s*`Graduate app '\$\{slug\}' to its own repo`/.test(routeContent)
  ) {
    errors.push(
      "graduate-request.post.ts's filed Todo title no longer matches " +
        "`Graduate app '${slug}' to its own repo` -- update " +
        "apps.get.ts's GRADUATE_TITLE_RE to match if this is an " +
        'intentional change, or this request will stop appearing in the ' +
        '"Graduation requested" badge.',
    )
  }

  if (
    !/GRADUATE_TITLE_RE\s*=\s*\/\^Graduate app '\(\[a-z0-9-\]\+\)' to its own repo/.test(
      appsRouteContent,
    )
  ) {
    errors.push(
      "apps.get.ts's GRADUATE_TITLE_RE no longer matches the graduate-" +
        'request Todo title shape -- filed graduation requests will stop ' +
        'being recognized as pending.',
    )
  }

  return errors
}

function main(): void {
  const routeContent = readFileSync(ROUTE_PATH, 'utf8')
  const appsRouteContent = readFileSync(APPS_ROUTE_PATH, 'utf8')
  const errors = checkGraduateRequestGuard(routeContent, appsRouteContent)

  if (errors.length) {
    console.error('AppMaker graduate-request guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'AppMaker graduate-request guard contract passed: admin-only, ' +
      'collision-checked, installation/grant-validated, and the Todo ' +
      "title stays in sync with apps.get.ts's GRADUATE_TITLE_RE.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
