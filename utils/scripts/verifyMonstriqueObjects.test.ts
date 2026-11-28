// MONSTRIQUE interactive object states (conductor monstress-convention/t-019),
// in both editions:
//
// 1. The object registry: each object's room and hotspot exist, its layers
//    are webp files cut at the painting's resolution, inside the stage.
// 2. Every state of every object, derived only from the case: Room 205's
//    door (Marta's key and the fire escape), the purse taken and paid out,
//    the knife bagged once photographed, and the vending machine only where
//    the edition lets Iris use it.
// 3. Taken items leave the scene: the purse's patch shows and its hotspot
//    goes; nothing else does.
// 4. Cues and gesture sync: each verb result sets off its object cue timed
//    to Iris's reach, Norb recoils on contact jokes and never reaches, and
//    reduced motion makes every cue instant.
// 5. Saves stay version 3 with no new field, scores are unchanged, and the
//    stage draws the layers.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FIRE_ESCAPE_ENTRY,
  HOTEL_ROOMS,
  caseScore,
  maxScore,
  newCase,
  restoreCase,
  switchInvestigator,
  type CaseAction,
  type CaseResult,
  type CaseState,
  type Investigator,
  type RoomId,
} from '../monstressConvention/prologue'
import {
  actionForAudience,
  roomForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import { travelRoute } from '../monstressConvention/navigation'
import { CONTACT_JOKES, isContactJoke } from '../monstrique/contact'
import { IRIS_RIG } from '../monstrique/leadRigs'
import { leadGestures } from '../monstrique/rig'
import { STAGE_HEIGHT, STAGE_WIDTH } from '../monstrique/stageArt'
import {
  CUE_MS,
  ICE_CLANK_EVERY_MS,
  OBJECT_CONTACT_MS,
  REACH_CONTACT_PHASE,
  STAGE_OBJECTS,
  STAGE_OBJECT_IDS,
  VENDING_TRAY,
  interactionBeat,
  objectCues,
  objectFiles,
  objectState,
  objectsInRoom,
  stageHotspots,
  stageObjectViews,
  toStageBox,
  type ObjectCue,
  type StageObjectId,
  type StageObjectState,
} from '../monstrique/stageObjects'

const editions: MonstriqueAudience[] = ['general', 'mature']
const repo = (path: string) => new URL('../../' + path, import.meta.url)
const read = (path: string) => readFileSync(repo(path), 'utf8')

/** Width and height of a webp from its header (VP8, VP8L or VP8X). */
function webpSize(path: string): { w: number; h: number } {
  const b = readFileSync(repo('public' + path))
  assert.equal(b.toString('ascii', 0, 4), 'RIFF', path + ' is RIFF')
  assert.equal(b.toString('ascii', 8, 12), 'WEBP', path + ' is webp')
  const chunk = b.toString('ascii', 12, 16)
  if (chunk === 'VP8X')
    return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) }
  if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }
  }
  assert.equal(chunk, 'VP8 ', path + ' chunk')
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
}

function player(edition: MonstriqueAudience, start: CaseState = newCase(7)) {
  let state = start
  const beats: Array<{
    action: CaseAction
    before: CaseState
    after: CaseState
  }> = []
  const apply = (result: CaseResult, label: string) => {
    assert.equal(result.changed, true, `${edition}: ${label}: ${result.line}`)
    state = result.state
    return result
  }
  return {
    get state() {
      return state
    },
    beats,
    act(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      const action = { verb, target, ...extra } as CaseAction
      const before = state
      const result = apply(
        actionForAudience(state, action, edition),
        `${verb} ${target}`,
      )
      beats.push({ action, before, after: state })
      return result
    },
    /** Any action, changed or not, returning its beat. */
    try(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      const action = { verb, target, ...extra } as CaseAction
      const before = state
      const result = actionForAudience(state, action, edition)
      state = result.state
      return { action, before, after: state, result }
    },
    go(room: RoomId) {
      if (state.room === room) return
      apply(
        travelRoute(state, room, (here, there) =>
          travelForAudience(here, there, edition),
        ),
        'travel ' + room,
      )
    },
    as(actor: Investigator) {
      if (state.actor !== actor) apply(switchInvestigator(state), 'swap')
    },
  }
}

const stateOf = (state: CaseState, id: StageObjectId) => objectState(id, state)
const cueNames = (cues: ObjectCue[]) => cues.map((c) => c.id + ':' + c.cue)

// --- 1. Registry and overlay files ------------------------------------------

assert.deepEqual(
  Object.keys(STAGE_OBJECTS).sort(),
  [...STAGE_OBJECT_IDS].sort(),
)
const STATES: Record<StageObjectId, StageObjectState[]> = {
  'room-205-door': ['closed', 'open'],
  'ice-machine': ['idle'],
  'odette-purse': ['present', 'gone'],
  'prop-knife': ['loose', 'bagged'],
  'vending-machine': ['idle'],
}
for (const object of Object.values(STAGE_OBJECTS)) {
  assert.deepEqual(object.states, STATES[object.id], object.id + ' states')
  assert.ok(object.cues.length > 0, object.id + ' has a cue')
  assert.ok(
    HOTEL_ROOMS[object.room].hotspots.some((h) => h.id === object.hotspot),
    object.id + ' hotspot is in its room',
  )
  for (const part of [object.layer, object.gone, object.behind, object.piece]) {
    if (!part) continue
    const [x, y, w, h] = part.px
    assert.ok(x >= 0 && y >= 0, part.src + ' starts on the stage')
    assert.ok(x + w <= STAGE_WIDTH && y + h <= STAGE_HEIGHT, part.src + ' fits')
    assert.deepEqual(
      webpSize(part.src),
      { w, h },
      part.src + ' is cut at the painting resolution of its box',
    )
    const box = toStageBox(part.px)
    assert.ok(box.x >= 0 && box.x + box.w <= 100.0001, part.src + ' x %')
    assert.ok(box.y >= 0 && box.y + box.h <= 100.0001, part.src + ' y %')
  }
}
// Moving props are cut from their own painting, and every shipped file is used.
assert.ok(
  STAGE_OBJECTS['room-205-door'].layer && STAGE_OBJECTS['room-205-door'].behind,
)
assert.ok(
  STAGE_OBJECTS['odette-purse'].layer && STAGE_OBJECTS['odette-purse'].gone,
)
assert.ok(STAGE_OBJECTS['vending-machine'].piece)
assert.ok(STAGE_OBJECTS['prop-knife'].bag)
const shipped = readFileSync(
  repo('scripts/cut_monstrique_object_layers.py'),
  'utf8',
)
for (const src of objectFiles()) {
  const name = src.split('/').pop()!.replace('.webp', '')
  assert.match(
    shipped,
    new RegExp("'" + name + "'"),
    name + ' comes from the cut script',
  )
}
const total = objectFiles().reduce(
  (sum, src) => sum + readFileSync(repo('public' + src)).length,
  0,
)
assert.ok(total < 200 * 1024, 'object layers stay small: ' + total)
const bag = STAGE_OBJECTS['prop-knife'].bag!
const knifeSpot = HOTEL_ROOMS['odette-room'].hotspots.find(
  (h) => h.id === 'knife',
)!
assert.ok(
  Math.abs((bag.cx / STAGE_WIDTH) * 100 - knifeSpot.x) < 3 &&
    Math.abs((bag.cy / STAGE_HEIGHT) * 100 - knifeSpot.y) < 3,
  'the evidence bag lies on the knife',
)
const [tx, ty, tw, th] = VENDING_TRAY
assert.ok(tx > 1088 && tx + tw < STAGE_WIDTH && ty + th < STAGE_HEIGHT)

// --- 2. Every state, derived from flags, in both editions -------------------

for (const edition of editions) {
  // The vending machine is drawn only where the edition lets Iris use it.
  const alcove = objectsInRoom('ice-alcove', edition).map((o) => o.id)
  assert.deepEqual(
    alcove,
    edition === 'mature' ? ['ice-machine', 'vending-machine'] : ['ice-machine'],
    edition + ': alcove objects',
  )
  assert.deepEqual(
    objectsInRoom('odette-room', edition).map((o) => o.id),
    ['odette-purse', 'prop-knife'],
  )
  assert.deepEqual(
    objectsInRoom('balcony', edition).map((o) => o.id),
    ['room-205-door'],
  )
  for (const room of [
    'motel-exterior',
    'front-office',
    'neighbor-room',
  ] as RoomId[])
    assert.deepEqual(objectsInRoom(room, edition), [], room + ' has no objects')

  const fresh = newCase(7)
  assert.equal(stateOf(fresh, 'room-205-door'), 'closed')
  assert.equal(stateOf(fresh, 'odette-purse'), 'present')
  assert.equal(stateOf(fresh, 'prop-knife'), 'loose')
  assert.equal(stateOf(fresh, 'ice-machine'), 'idle')
  assert.equal(stateOf(fresh, 'vending-machine'), 'idle')

  // Marta's key: unlocked is still closed until Iris opens the door on stage
  // or walks through it.
  const p = player(edition)
  p.go('front-office')
  p.act('look', 'guest-ledger')
  p.act('use', 'marta')
  assert.equal(stateOf(p.state, 'room-205-door'), 'closed')
  p.go('balcony')
  assert.equal(objectState('room-205-door', p.state, ['room-205-door']), 'open')
  const open = p.try('use', 'room-door')
  assert.deepEqual(cueNames(objectCues(open.action, open.before, open.after)), [
    'room-205-door:swing-open',
  ])
  const withKey = objectCues(
    { verb: 'use', target: 'room-door', item: 'motel-key' },
    open.before,
    open.before,
  )
  assert.deepEqual(
    cueNames(withKey),
    ['room-205-door:swing-open'],
    'the key opens it too',
  )
  assert.deepEqual(
    objectCues(open.action, open.before, open.after, ['room-205-door']),
    [],
    'an open door does not swing again',
  )
  p.go('odette-room')
  assert.equal(
    stateOf(p.state, 'room-205-door'),
    'open',
    'open once walked through',
  )
  p.go('balcony')
  assert.deepEqual(
    stageObjectViews(p.state, edition).map((v) => v.object.id + ':' + v.state),
    ['room-205-door:open'],
  )

  // A locked door rattles nothing open.
  const locked = player(edition)
  locked.go('balcony')
  const tryDoor = locked.try('use', 'room-door')
  assert.deepEqual(
    objectCues(tryDoor.action, tryDoor.before, tryDoor.after),
    [],
  )
  assert.equal(stateOf(locked.state, 'room-205-door'), 'closed')

  // The fire escape: Iris opens the front door from inside.
  const f = player(edition)
  f.go('ice-alcove')
  f.act('look', 'maintenance-log')
  f.go('neighbor-room')
  f.act('talk', 'neighbor')
  f.act('ask', 'neighbor', { topic: 'unknown-visitor' })
  f.act('use', 'fire-escape')
  assert.ok(f.state.flags.includes(FIRE_ESCAPE_ENTRY))
  assert.equal(stateOf(f.state, 'room-205-door'), 'open')

  // The purse: taken, then paid out to Violet; gone both times.
  p.go('odette-room')
  assert.equal(stateOf(p.state, 'odette-purse'), 'present')
  const take = p.act('take', 'odette-purse')
  assert.ok(take.changed)
  assert.equal(stateOf(p.state, 'odette-purse'), 'gone')
  let beat = p.beats.at(-1)!
  assert.deepEqual(cueNames(objectCues(beat.action, beat.before, beat.after)), [
    'odette-purse:take',
  ])
  p.act('talk', 'violet-ghost')
  p.act('use', 'violet-ghost', { item: 'odette-purse' })
  assert.ok(p.state.flags.includes('violet-paid'))
  assert.ok(!p.state.inventory.includes('odette-purse'))
  assert.equal(stateOf(p.state, 'odette-purse'), 'gone', 'paid out stays gone')
  beat = p.beats.at(-1)!
  assert.deepEqual(objectCues(beat.action, beat.before, beat.after), [])

  // The knife: bagged when photographed where it fell.
  assert.equal(stateOf(p.state, 'prop-knife'), 'loose')
  p.act('look', 'knife')
  assert.equal(stateOf(p.state, 'prop-knife'), 'loose', 'looking bags nothing')
  p.act('photograph', 'knife')
  assert.equal(stateOf(p.state, 'prop-knife'), 'bagged')
  beat = p.beats.at(-1)!
  assert.deepEqual(cueNames(objectCues(beat.action, beat.before, beat.after)), [
    'prop-knife:bag',
  ])
  assert.deepEqual(
    stageObjectViews(p.state, edition).map((v) => v.object.id + ':' + v.state),
    ['odette-purse:gone', 'prop-knife:bagged'],
  )

  // The ice machine shudders on each double clank: look, use, photograph.
  p.go('ice-alcove')
  for (const verb of ['look', 'use', 'photograph'] as const) {
    const clank = p.try(verb, 'ice-machine')
    assert.ok(clank.result.changed, edition + ': ' + verb + ' ice machine')
    assert.deepEqual(
      cueNames(objectCues(clank.action, clank.before, clank.after)),
      ['ice-machine:shudder'],
      edition + ': ' + verb + ' clanks',
    )
  }
  const log = p.try('look', 'maintenance-log')
  assert.deepEqual(objectCues(log.action, log.before, log.after), [])
  p.as('nico')
  const norbIce = p.try('use', 'ice-machine')
  assert.equal(norbIce.result.changed, false)
  assert.deepEqual(
    objectCues(norbIce.action, norbIce.before, norbIce.after),
    [],
  )
  p.as('iris')

  // The vending machine dispenses once, in the mature edition only.
  const vend = p.try('use', 'vending-machine')
  if (edition === 'mature') {
    assert.ok(vend.result.changed)
    assert.deepEqual(
      cueNames(objectCues(vend.action, vend.before, vend.after)),
      ['vending-machine:dispense'],
    )
    const again = p.try('use', 'vending-machine')
    assert.equal(again.result.changed, false)
    assert.deepEqual(objectCues(again.action, again.before, again.after), [])
  } else {
    assert.equal(vend.result.changed, false)
    assert.deepEqual(objectCues(vend.action, vend.before, vend.after), [])
    assert.ok(!p.state.flags.includes('bought-protection'))
  }
}

// --- 3. Taken items leave the scene -----------------------------------------

for (const edition of editions) {
  const p = player(edition)
  p.go('front-office')
  p.act('look', 'guest-ledger')
  p.act('use', 'marta')
  p.go('odette-room')
  const room = roomForAudience('odette-room', edition)
  const before = stageHotspots(room, p.state).map((h) => h.id)
  assert.ok(before.includes('odette-purse'))
  p.act('take', 'odette-purse')
  const after = stageHotspots(room, p.state).map((h) => h.id)
  assert.deepEqual(
    after,
    before.filter((id) => id !== 'odette-purse'),
    edition + ': only the taken purse leaves the scene',
  )
  assert.ok(after.includes('knife'), 'the bagged knife stays as evidence')
  p.act('photograph', 'knife')
  assert.deepEqual(
    stageHotspots(room, p.state).map((h) => h.id),
    after,
  )
  for (const other of Object.keys(HOTEL_ROOMS) as RoomId[]) {
    if (other === 'odette-room') continue
    const here = roomForAudience(other, edition)
    assert.deepEqual(stageHotspots(here, p.state), here.hotspots, other)
  }
}

// --- 4. Gesture sync, contact jokes, reduced motion -------------------------

assert.equal(REACH_CONTACT_PHASE, 0.45)
assert.equal(
  OBJECT_CONTACT_MS,
  Math.round(IRIS_RIG.clips.reach!.durationMs * REACH_CONTACT_PHASE),
)
assert.ok(OBJECT_CONTACT_MS > 200 && OBJECT_CONTACT_MS < 700)
for (const [name, ms] of Object.entries(CUE_MS))
  assert.ok(ms >= 500 && ms <= 1500, name + ' cue length')
assert.ok(ICE_CLANK_EVERY_MS >= 6000, 'the ambient clank is occasional')

for (const edition of editions) {
  const p = player(edition)
  p.go('front-office')
  p.act('look', 'guest-ledger')
  const key = p.try('use', 'marta')
  const keyBeat = interactionBeat(key.action, key.before, key.after)
  assert.deepEqual(keyBeat.gestures, { iris: 'reach', norb: 'recoil' })
  assert.deepEqual(keyBeat.cues, [])
  p.go('balcony')
  // The key turned in the door: a cue, so Iris reaches rather than recoils,
  // and the door swings when her hand gets there.
  const keyDoor = interactionBeat(
    { verb: 'use', target: 'room-door', item: 'motel-key' },
    p.state,
    p.state,
  )
  assert.deepEqual(keyDoor.gestures, { iris: 'reach' })
  assert.deepEqual(
    keyDoor.cues.map((c) => [c.cue, c.delayMs, c.durationMs]),
    [['swing-open', OBJECT_CONTACT_MS, CUE_MS['swing-open']]],
  )
  p.go('odette-room')

  // Take and photograph reach, and the object changes at the contact frame.
  const take = p.try('take', 'odette-purse')
  const takeBeat = interactionBeat(take.action, take.before, take.after)
  assert.deepEqual(takeBeat.gestures, { iris: 'reach' })
  assert.deepEqual(takeBeat.cues[0], {
    id: 'odette-purse',
    cue: 'take',
    delayMs: OBJECT_CONTACT_MS,
    durationMs: CUE_MS.take,
  })
  const again = p.try('take', 'odette-purse')
  assert.equal(again.result.changed, false)
  assert.deepEqual(interactionBeat(again.action, again.before, again.after), {
    gestures: { iris: 'recoil' },
    cues: [],
  })
  const snap = p.try('photograph', 'knife')
  const snapBeat = interactionBeat(snap.action, snap.before, snap.after)
  assert.deepEqual(snapBeat.gestures, { iris: 'reach' }, 'the camera goes up')
  assert.equal(snapBeat.cues[0]!.delayMs, OBJECT_CONTACT_MS)
  const look = p.try('look', 'ice-ring')
  assert.deepEqual(
    interactionBeat(look.action, look.before, look.after).gestures,
    {
      iris: 'point',
    },
  )

  // Reduced motion: the same state change lands at once, unanimated.
  const still = interactionBeat(take.action, take.before, take.after, {
    reducedMotion: true,
  })
  assert.deepEqual(still.gestures, takeBeat.gestures)
  assert.deepEqual(
    still.cues.map((c) => [c.id, c.cue, c.delayMs, c.durationMs]),
    [['odette-purse', 'take', 0, 0]],
  )

  // A look at the ice machine clanks without a reach, so no wait.
  p.go('ice-alcove')
  const glance = p.try('look', 'ice-machine')
  const glanceBeat = interactionBeat(glance.action, glance.before, glance.after)
  assert.deepEqual(glanceBeat.gestures, { iris: 'point' })
  assert.deepEqual(
    glanceBeat.cues.map((c) => [c.cue, c.delayMs]),
    [['shudder', 0]],
  )
  // Using it: Iris reaches, the machine clanks at contact, Norb recoils.
  const clank = p.try('use', 'ice-machine')
  const clankBeat = interactionBeat(clank.action, clank.before, clank.after)
  assert.deepEqual(clankBeat.gestures, { iris: 'reach', norb: 'recoil' })
  assert.deepEqual(
    clankBeat.cues.map((c) => [c.cue, c.delayMs]),
    [['shudder', OBJECT_CONTACT_MS]],
  )

  // Norb asked to handle anything recoils, never reaches, sets off nothing.
  p.as('nico')
  for (const verb of ['take', 'use', 'photograph'] as const) {
    for (const target of [
      'ice-machine',
      'vending-machine',
      'maintenance-log',
    ]) {
      const refused = p.try(verb, target)
      const norbBeat = interactionBeat(
        refused.action,
        refused.before,
        refused.after,
      )
      assert.notEqual(norbBeat.gestures.norb, 'reach')
      assert.equal(norbBeat.gestures.iris, undefined, 'Iris did nothing')
      assert.deepEqual(norbBeat.cues, [])
      if (refused.result.line.startsWith('Norb:'))
        assert.equal(norbBeat.gestures.norb, 'recoil', verb + ' ' + target)
    }
  }
  const norbCombine = interactionBeat(
    { verb: 'combine', target: 'camera', item: 'motel-key' },
    p.state,
    p.state,
  )
  assert.deepEqual(norbCombine.gestures, { norb: 'recoil' })
  p.as('iris')

  // Anything offered to Norb is a contact joke, however it lands.
  p.go('investigators-room')
  const offer = p.try('use', 'nico', { item: 'camera' })
  assert.equal(offer.result.changed, false)
  assert.deepEqual(
    interactionBeat(offer.action, offer.before, offer.after).gestures,
    {
      iris: 'recoil',
      norb: 'recoil',
    },
  )
  const talk = p.try('talk', 'nico')
  assert.ok(talk.result.changed)
  assert.match(talk.result.line, /unsterilized/)
  assert.deepEqual(
    interactionBeat(talk.action, talk.before, talk.after).gestures,
    {
      norb: 'recoil',
    },
  )
}

// Each listed contact joke really is one: the line it plays mentions Norb's
// hygiene, so the list never drifts from the script.
assert.deepEqual([...CONTACT_JOKES].sort(), [
  'ask:nico:iris-neck',
  'talk:nico',
  'use:bedspread',
  'use:ice-machine',
  'use:marta',
])
{
  const p = player('mature')
  p.go('front-office')
  p.act('look', 'guest-ledger')
  const lines: Record<string, string> = {}
  lines['use:marta'] = p.act('use', 'marta').line
  p.go('ice-alcove')
  lines['use:ice-machine'] = p.act('use', 'ice-machine').line
  p.go('investigators-room')
  lines['use:bedspread'] = p.act('use', 'bedspread').line
  lines['talk:nico'] = p.act('talk', 'nico').line
  lines['ask:nico:iris-neck'] = p.act('ask', 'nico', {
    topic: 'iris-neck',
  }).line
  for (const [key, line] of Object.entries(lines))
    assert.match(
      line,
      /hygien|wash|steril|blacklight|closes the door|near me/i,
      key + ' is a contact joke: ' + line,
    )
  const plain = p.try('look', 'desk')
  assert.equal(isContactJoke(plain.action, plain.before, plain.after), false)
}

// Norb never reaches, over every verb, target and actor in both editions.
for (const edition of editions) {
  for (const actor of ['iris', 'nico'] as const) {
    let state = newCase(11)
    if (actor === 'nico') state = switchInvestigator(state).state
    for (const room of [
      'front-office',
      'ice-alcove',
      'investigators-room',
    ] as RoomId[]) {
      const here = {
        ...state,
        room,
        flags: [...state.flags, 'crime-room-access'],
      }
      for (const hotspot of roomForAudience(room, edition).hotspots)
        for (const verb of [
          'look',
          'take',
          'use',
          'photograph',
          'talk',
          'flirt',
        ] as const) {
          const action = { verb, target: hotspot.id }
          const result = actionForAudience(here, action, edition)
          const gestures = leadGestures(action, here, result.state)
          assert.notEqual(
            gestures.norb,
            'reach',
            `${edition} ${actor} ${verb} ${hotspot.id}`,
          )
          if (actor === 'nico') assert.equal(gestures.iris, undefined)
          const beat = interactionBeat(action, here, result.state)
          assert.notEqual(beat.gestures.norb, 'reach')
          if (actor === 'nico')
            assert.deepEqual(beat.cues, [], 'Norb moves nothing')
        }
    }
  }
}

// --- 5. Saves, scores and the stage -----------------------------------------

{
  const p = player('mature')
  p.go('front-office')
  p.act('look', 'guest-ledger')
  p.act('use', 'marta')
  p.go('odette-room')
  p.act('take', 'odette-purse')
  p.act('photograph', 'knife')
  const saved = JSON.parse(JSON.stringify(p.state))
  assert.equal(saved.version, 3)
  assert.deepEqual(
    Object.keys(saved).sort(),
    Object.keys(newCase(7)).sort(),
    'object states add no save field',
  )
  const restored = restoreCase(saved)!
  for (const id of STAGE_OBJECT_IDS)
    assert.equal(objectState(id, restored), objectState(id, p.state), id)
  assert.equal(maxScore('mature'), 205)
  assert.equal(caseScore(restored), caseScore(p.state))
}

const scene = read(
  'components/monstress-convention/monstress-convention-scene.vue',
)
const layers = read('components/monstrique/monstrique-stage-objects.vue')
assert.match(
  scene,
  /<MonstriqueStageObjects[\s\S]*?:views="objectViews"[\s\S]*?:cues="objectCueList"/,
)
assert.match(
  scene,
  /stageObjectViews\(shownCase\.value, audience\.value, opened\.value\)/,
)
assert.match(scene, /hotspots: stageHotspots\(here, story\.value\.state\)/)
assert.match(
  scene,
  /interactionBeat\(action, before, story\.value\.state, \{[\s\S]*?reducedMotion,/,
)
assert.match(
  scene,
  /setTimeout\(land, delay\)/,
  'objects change at the contact frame',
)
assert.match(layers, /prefers-reduced-motion: reduce/)
assert.match(layers, /if \(reduced\.value \|\| ms <= 0\) return/)
assert.match(layers, /ICE_CLANK_EVERY_MS/)
for (const id of STAGE_OBJECT_IDS)
  assert.match(layers, new RegExp("'" + id + "'"), id + ' is drawn')
assert.doesNotMatch(layers, /\$fetch|localStorage/)

console.log('verifyMonstriqueObjects: ok')
