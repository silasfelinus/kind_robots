import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  GENERAL_INTRO,
  MATURE_INTRO,
  MONSTRIQUE_GENERAL_SPEC,
  actionForAudience,
  assertGeneralEditionHasNoRomance,
  roomForAudience,
  travelForAudience,
} from '../monstressConvention/edition'
import {
  newCase,
  switchInvestigator,
  type CaseState,
} from '../monstressConvention/prologue'
import { effectiveShowMature } from '../userRoles'

function source(path: string): string {
  return readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
}

const api = source('server/api/monstrique/audience.get.ts')
const generalCombineState = {
  ...newCase(77),
  inventory: ['camera', 'plastic-fangs'],
}
const generalCombine = actionForAudience(
  generalCombineState,
  { verb: 'combine', item: 'camera', target: 'plastic-fangs' },
  'general',
)
assert.equal(generalCombine.changed, true)
assert.ok(generalCombine.state.evidence.includes('fangs-detail'))
assert.equal(
  actionForAudience(
    { ...generalCombineState, inventory: ['camera', 'garlic-protection'] },
    { verb: 'combine', item: 'camera', target: 'garlic-protection' },
    'general',
  ).changed,
  false,
  'mature-only inventory does not enter general-edition combine actions',
)
const page = source('pages/play/monstrique.vue')
const adminPage = source('pages/admin/monstrique.vue')
const launcher = source('content/channels/arcade/monstrique.md')
const publicStore = source('stores/monstriquePublicStore.ts')
const scene = source(
  'components/monstress-convention/monstress-convention-scene.vue',
)
const front = source('components/monstrexx/monstrexx-front.vue')
const archive = source('components/monstrique/monstrique-album-archive.vue')

assert.match(api, /getOptionalApiUser\(event\)/)
assert.match(api, /auth\?\.kind === 'jwt'/)
assert.match(api, /viewerShowsMature\(auth\?\.user\)/)
assert.match(api, /Cache-Control', 'private, no-store'/)
assert.doesNotMatch(api, /getQuery\(|showMature=true/)
assert.match(launcher, /channelKey: arcade/)
assert.match(launcher, /route: \/play\/monstrique/)
assert.doesNotMatch(launcher, /requiredPermission: mature|requiredRole: ADMIN/)
assert.match(page, /<MonstrexxFront[\s\S]*public-edition/)
assert.match(page, /<MonstressConventionScene[\s\S]*public-edition/)
assert.match(
  adminPage,
  /caseStore\.authorized && user\.isAdmin && user\.showMature/,
)
assert.match(publicStore, /user\.isMaturityRestricted/)
assert.match(publicStore, /verifiedToken === user\.token/)
assert.match(publicStore, /result\.data\?\.audience === 'mature'/)
assert.match(
  publicStore,
  /audience\.value === 'mature'\s*&&\s*result\.state\.flags\.includes\('ghost-kiss'\)/,
)
assert.match(publicStore, /'kr-monstrique-' \+ mode \+ '-v1-'/)
assert.match(publicStore, /loadMode\('general'\)/)
assert.match(publicStore, /loadMode\('mature'\)/)
assert.match(front, /:public-edition="!!props\.publicEdition"/)
assert.match(front, /audience\.value === 'general'/)
assert.match(
  scene,
  /roomForAudience\(story\.value\.state\.room, audience\.value\)/,
)
assert.match(scene, /audience === 'mature'/)
assert.match(scene, /@click="walkTo"/)
assert.match(scene, /@keydown.left.prevent="selectAdjacent\(-1\)"/)
assert.match(scene, /@keydown.right.prevent="selectAdjacent\(1\)"/)
assert.match(scene, /@click="pickInventory\(item\)"/)
assert.match(scene, /verb: 'combine', item: held\.value, target: item/)
assert.match(archive, /props\.creatorMode && showAuthorNotes/)
assert.match(archive, /props\.publicEdition \? publicStory : adminStory/)
assert.equal(effectiveShowMature(null), false)
assert.equal(
  effectiveShowMature({
    Role: 'ADMIN',
    roles: ['ADMIN', 'CHILD'],
    showMature: true,
  }),
  false,
)
assert.equal(effectiveShowMature({ Role: 'USER', showMature: false }), false)
assert.equal(effectiveShowMature({ Role: 'USER', showMature: true }), true)
assert.equal(GENERAL_INTRO.length, MATURE_INTRO.length)
assert.ok(
  GENERAL_INTRO.every(
    (scene) => !/sex|prostitute|gin|frisky|kissing/i.test(scene.text),
  ),
)
assert.ok(assertGeneralEditionHasNoRomance())
assert.equal(MONSTRIQUE_GENERAL_SPEC.route, '/play/monstrique')

for (const roomId of Object.keys(roomForAudience('odette-room', 'mature'))) {
  assert.ok(roomId)
}
const generalRoom = roomForAudience('odette-room', 'general')
assert.match(generalRoom.caption, /beneath a sheet/)
assert.doesNotMatch(generalRoom.caption, /gin|bedspread/i)
assert.ok(generalRoom.hotspots.every((spot) => !spot.verbs.includes('flirt')))
assert.ok(
  roomForAudience('odette-room', 'mature').hotspots.some((spot) =>
    spot.verbs.includes('flirt'),
  ),
)

// Both editions use the same movement/clue engine, so no romance gate can
// strand a general-audience player short of the chapter ending.
for (const entry of ['marta', 'neighbor'] as const) {
  let state: CaseState = newCase(37)
  function go(destination: Parameters<typeof travelForAudience>[1]): void {
    const result = travelForAudience(state, destination, 'general')
    assert.equal(result.changed, true, result.line)
    state = result.state
  }
  function act(
    verb: Parameters<typeof actionForAudience>[1]['verb'],
    target: string,
    topic?: string,
  ): void {
    const result = actionForAudience(state, { verb, target, topic }, 'general')
    assert.equal(result.changed, true, result.line)
    state = result.state
  }
  go('front-office')
  if (entry === 'marta') {
    act('look', 'guest-ledger')
    act('talk', 'marta')
    act('ask', 'marta', 'room-access')
  }
  go('balcony')
  if (entry === 'neighbor') {
    go('neighbor-room')
    act('talk', 'neighbor')
    act('ask', 'neighbor', 'unknown-visitor')
    go('balcony')
  }
  go('odette-room')
  assert.match(state.transcript.at(-1)!, /beneath a sheet/)
  assert.equal(
    actionForAudience(
      state,
      { verb: 'flirt', target: 'violet-ghost' },
      'general',
    ).changed,
    false,
  )
  assert.ok(!state.flags.some((flag) => flag.startsWith('flirted-')))
  act('photograph', 'knife')
  act('talk', 'odette-ghost')
  act('ask', 'odette-ghost', 'agent-deals')
  act('talk', 'violet-ghost')
  act('ask', 'violet-ghost', 'violet-witness')
  const second = switchInvestigator(state)
  assert.equal(second.changed, true)
  state = second.state
  assert.equal(
    actionForAudience(state, { verb: 'photograph', target: 'knife' }, 'general')
      .changed,
    false,
  )
  state = switchInvestigator(state).state
  go('balcony')
  go('ice-alcove')
  act('photograph', 'ice-machine')
  go('motel-exterior')
  act('photograph', 'fan-camera')
  assert.ok(state.evidence.includes('fan-exonerated'))
  go('front-office')
  go('balcony')
  go('investigators-room')
  act('use', 'desk')
  assert.ok(state.flags.includes('city-lead'))
  go('balcony')
  go('front-office')
  go('motel-exterior')
  go('city-map')
  go('convention-center')
  act('photograph', 'idol-poster')
  assert.equal(state.ending, 'lead-earned')
  assert.equal(state.flags.includes('ghost-kiss'), false)
  assert.equal(state.flags.includes('flirted-violet-ghost'), false)
}

console.log(
  'Monstrique audience editions: public-safe mystery endings, mature opt-in, isolated saves and scrapbook gating passed',
)
