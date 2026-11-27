// MONSTRIQUE security regression matrix (conductor monstress-convention/t-011).
//
// Silas, 2026-11-07 PT: mature extras unlock only for signed-in non-CHILD
// adults with persisted `showMature: true`, server-enforced on APIs and
// ArtImage delivery; `?showMature=true` never grants access; CHILD+ADMIN is
// still restricted. This file exercises the real server predicate across
// every credential kind and role encoding, then pins the route guards.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { monstriqueAudienceFor } from '../../server/utils/monstriqueAccess'
import {
  actionForAudience,
  roomForAudience,
  travelForAudience,
} from '../monstressConvention/edition'
import {
  HOTEL_ROOMS,
  newCase,
  type RoomId,
} from '../monstressConvention/prologue'
import { shortcutRooms } from '../monstressConvention/navigation'

const root = new URL('../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

const adult = { id: 1, Role: 'USER', roles: ['USER'], showMature: true }
const adultAdmin = {
  id: 2,
  Role: 'ADMIN',
  roles: ['USER', 'ADMIN'],
  showMature: true,
}
const restricted: Array<[string, Record<string, unknown>]> = [
  ['opted-out adult', { ...adult, showMature: false }],
  ['adult with no preference', { id: 3, Role: 'USER', roles: ['USER'] }],
  ['string "true" is not an opt-in', { ...adult, showMature: 'true' }],
  ['CHILD primary role', { id: 4, Role: 'CHILD', showMature: true }],
  ['CHILD in roles', { id: 5, roles: ['USER', 'CHILD'], showMature: true }],
  [
    'CHILD in the join table',
    { id: 6, Role: 'USER', UserRoles: [{ role: 'CHILD' }], showMature: true },
  ],
  ['lowercase child alias', { id: 7, role: 'child', showMature: true }],
  [
    'CHILD+ADMIN',
    { id: 8, Role: 'ADMIN', roles: ['ADMIN', 'CHILD'], showMature: true },
  ],
  ['opted-out ADMIN', { ...adultAdmin, showMature: false }],
]

assert.equal(monstriqueAudienceFor({ kind: 'jwt', user: adult }), 'mature')
assert.equal(monstriqueAudienceFor({ kind: 'jwt', user: adultAdmin }), 'mature')
for (const [label, user] of restricted)
  assert.equal(
    monstriqueAudienceFor({ kind: 'jwt', user }),
    'general',
    label + ' gets the general edition',
  )
for (const kind of [
  'first-party-delegation',
  'beta-admin-token',
  'user-api-key',
  'agent-credential',
  'JWT',
  '',
  null,
  undefined,
])
  assert.equal(
    monstriqueAudienceFor({ kind, user: adultAdmin }),
    'general',
    `credential kind ${String(kind)} never unlocks mature play`,
  )
assert.equal(monstriqueAudienceFor(null), 'general', 'guest / invalid token')
assert.equal(monstriqueAudienceFor(undefined), 'general')
assert.equal(monstriqueAudienceFor({ kind: 'jwt', user: null }), 'general')

// Public routes: the audience comes only from the verified session, never from
// the request, and nothing is cached across viewers.
for (const route of [
  'server/api/monstrique/audience.get.ts',
  'server/api/monstrique/splash.get.ts',
]) {
  const source = read(route)
  assert.match(source, /getOptionalApiUser\(event\)/, route)
  assert.match(source, /monstriqueAudienceFor\(auth\)/, route)
  assert.match(source, /'Cache-Control', 'private, no-store'/, route)
  assert.match(source, /'Vary', 'Authorization'/, route)
  assert.doesNotMatch(
    source,
    /getQuery|readBody|getRouterParam|showMature|viewerShowsMature/,
    route + ' cannot be steered by the request',
  )
}
const splash = read('server/api/monstrique/splash.get.ts')
assert.match(splash, /if \(!mature \|\| /, 'non-mature viewers get no ids')
assert.match(splash, /isMature: true/, 'only mature-flagged rows are served')

// Studio routes: ADMIN plus the persisted opt-in, else a 404 that does not
// reveal the Studio exists.
const bible = read('server/utils/monstriqueBible.ts')
assert.match(
  bible,
  /requireMonstriqueStudio[\s\S]*?requireAdminApiUser\(event\)[\s\S]*?if \(!viewerShowsMature\(auth\.user\)\)[\s\S]*?statusCode: 404/,
)
function routes(dir: string): string[] {
  return readdirSync(new URL(dir, root)).flatMap((name) => {
    const path = join(dir, name)
    return statSync(new URL(path, root)).isDirectory()
      ? routes(path + '/')
      : [path]
  })
}
const studioRoutes = routes('server/api/monstrique/bible/')
assert.ok(studioRoutes.length >= 3)
for (const route of studioRoutes)
  assert.match(
    read(route),
    /await requireMonstriqueStudio\(event\)/,
    route + ' is Studio-gated',
  )
const adminAccess = read('server/api/monstress-convention/access.get.ts')
assert.match(adminAccess, /requireAdminApiUser\(event\)/)
assert.match(adminAccess, /viewerShowsMature\(auth\.user\)/)

// The mature splash ArtImage ids never ship in client code.
const clientDirs = [
  'components/',
  'pages/',
  'stores/',
  'layouts/',
  'middleware/',
  'plugins/',
  'content/',
]
const leaks: string[] = []
function scan(dir: string): void {
  let names: string[]
  try {
    names = readdirSync(new URL(dir, root))
  } catch {
    return
  }
  for (const name of names) {
    const path = join(dir, name)
    if (statSync(new URL(path, root)).isDirectory()) scan(path + '/')
    else if (/268798|268801/.test(read(path))) leaks.push(path)
  }
}
for (const dir of clientDirs) scan(dir)
for (const name of readdirSync(new URL('utils/', root)))
  if (name !== 'scripts')
    scan(join('utils/', name) + (name.includes('.') ? '' : '/'))
assert.deepEqual(leaks, [], 'mature splash ids stay server-side')

// General edition: no mature-only hotspot, verb, room or shortcut, whatever
// the save says.
const matureOnlyHotspots = ['vending-machine', 'bedspread']
const lead = { ...newCase(9), flags: ['city-lead', 'crime-room-access'] }
const generalStep = (state: typeof lead, room: RoomId) =>
  travelForAudience(state, room, 'general')
for (const room of Object.keys(HOTEL_ROOMS) as RoomId[]) {
  const view = roomForAudience(room, 'general')
  for (const hotspot of view.hotspots) {
    assert.ok(!matureOnlyHotspots.includes(hotspot.id), room + '/' + hotspot.id)
    assert.ok(!hotspot.verbs.includes('flirt'), room + '/' + hotspot.id)
  }
  const reachable = shortcutRooms({ ...lead, room }, generalStep)
  for (const target of reachable)
    assert.ok(
      roomForAudience(target, 'general').hotspots.length > 0,
      'general shortcut from ' + room + ' reaches only general rooms',
    )
}
for (const [room, target] of [
  ['ice-alcove', 'vending-machine'],
  ['investigators-room', 'bedspread'],
] as const) {
  const attempt = actionForAudience(
    { ...lead, room },
    { verb: 'use', target },
    'general',
  )
  assert.equal(attempt.changed, false, target + ' is closed to general play')
}
const flirt = actionForAudience(
  { ...lead, room: 'odette-room' },
  { verb: 'flirt', target: 'violet-ghost' },
  'general',
)
assert.equal(flirt.changed, false)
assert.equal(
  actionForAudience(
    { ...lead, inventory: ['camera', 'garlic-protection'] },
    { verb: 'combine', item: 'garlic-protection', target: 'camera' },
    'general',
  ).changed,
  false,
)

// Saves: editions and accounts never share a slot.
const publicStore = read('stores/monstriquePublicStore.ts')
assert.match(publicStore, /'kr-monstrique-' \+ mode \+ '-v1-'/)
assert.match(publicStore, /loadedAccount\.value !== accountId\.value/)

console.log('Monstrique security matrix: OK')
