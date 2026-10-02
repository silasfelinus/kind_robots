// /utils/scripts/verifyMatureBarrier.ts
import { readFileSync } from 'node:fs'

process.env.DATABASE_URL ??= 'mysql://contract:contract@127.0.0.1:3306/contract'
const { matureHiddenFrom } = await import('../../server/utils/matureBarrier')
const { isMaturityRestricted } =
  await import('../../server/utils/contentAccess')

// Silas, 2026-10-02: an anonymous viewer or a CHILD account must not see mature
// images AND must not be told they exist: not a cover, not a 403, not a
// reaction on them. The rule has one predicate (matureHiddenFrom) and a handful
// of routes that must consult it. This contract pins both: the predicate's
// behaviour, and that each route that serves or counts an ArtImage still asks.

let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

check(
  matureHiddenFrom(true, { isMature: true }),
  'a restricted viewer is barred from a mature image',
)
check(
  !matureHiddenFrom(true, { isMature: false }),
  'a restricted viewer still sees a non-mature image',
)
check(
  !matureHiddenFrom(false, { isMature: true }),
  'an unrestricted viewer is not barred here (their own toggle decides)',
)
check(!matureHiddenFrom(true, null), 'a missing row is not "mature"')
check(isMaturityRestricted(null), 'no user at all is restricted')
check(
  isMaturityRestricted({ id: 7, Role: 'ADMIN', roles: ['CHILD', 'ADMIN'] }),
  'CHILD beats ADMIN',
)
check(
  isMaturityRestricted({
    id: 7,
    Role: 'ADMIN',
    UserRoles: [{ role: 'CHILD' }],
  }),
  'CHILD from the join table beats ADMIN',
)

const routeMustContain: Record<string, string[]> = {
  'server/api/art/image/[id].get.ts': ['matureHiddenFrom'],
  'server/api/art/images/[id]/file.get.ts': [
    'matureHiddenFrom',
    'isMaturityRestricted',
  ],
  'server/api/art/image/by-ids.post.ts': ['buildArtImageWhere'],
  'server/api/art/review/index.post.ts': ['buildArtImageWhere'],
  'server/utils/artReviewQueue.ts': ['buildArtImageWhere'],
  'server/utils/reactionVisibility.ts': [
    'matureBarrierHides',
    'maturityRestricted',
  ],
  'server/api/reactions/art/[id].get.ts': ['canViewReactionsOn'],
  'server/api/reactions/index.post.ts': ['maturityRestricted'],
  'server/api/reactions/index.get.ts': ['isMaturityRestricted'],
  'server/api/reactions/art/[id].patch.ts': ['maturityRestricted'],
}

for (const [file, needles] of Object.entries(routeMustContain)) {
  const source = readFileSync(file, 'utf8')
  for (const needle of needles) {
    check(
      source.includes(needle),
      `${file} still consults the mature barrier (${needle})`,
    )
  }
}

const fileRoute = readFileSync('server/api/art/images/[id]/file.get.ts', 'utf8')
check(
  /isMature === true\)\s*\{\s*throw createError\(\{ statusCode: 404/.test(
    fileRoute,
  ),
  'the image file route answers 404, not 403, for a mature image it will not serve',
)

if (failures > 0) {
  console.error(`\nMature barrier contract failed: ${failures} problem(s).`)
  process.exit(1)
}
console.log('\nMature barrier contract passed.')
