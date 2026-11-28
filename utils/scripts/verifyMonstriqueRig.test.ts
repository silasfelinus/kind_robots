// MONSTRIQUE cut-out character rig (conductor monstress-convention/t-018):
// rig format, pivots and z-order, clip timing, the distance-synced walk,
// reduced-motion fallbacks, Norb's no-contact rule and the data-only swap to
// painted parts.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { newCase, type CaseState } from '../monstressConvention/prologue'
import { IRIS_RIG, LEAD_RIGS, NORB_RIG } from '../monstrique/leadRigs'
import {
  BLINK_GAP,
  BLINK_MS,
  EYE_STATES,
  FLAP_MS,
  MOUTH_SHAPES,
  RIG_CLIP_IDS,
  STAGE_WALK_MS_PER_UNIT,
  ancestry,
  apply,
  blinkAt,
  gesturePhase,
  leadGestures,
  mouthAt,
  poseRig,
  sampleChannel,
  sourcesOf,
  strideUnits,
  walkPhase,
  withPaintedParts,
  type CutoutRig,
  type RigBox,
  type RigImageSource,
  type RigPlay,
  type RigPose,
  type RigShape,
} from '../monstrique/rig'

const read = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const near = (a: number, b: number, tolerance = 1e-6) =>
  Math.abs(a - b) <= tolerance
const inside = ([x, y]: readonly [number, number], box: RigBox, pad = 0) =>
  x >= box.x - pad &&
  x <= box.x + box.w + pad &&
  y >= box.y - pad &&
  y <= box.y + box.h + pad

function shapeBounds(shape: RigShape): RigBox | null {
  const a = shape.attrs
  const n = (key: string) => Number(a[key])
  if (shape.tag === 'circle')
    return {
      x: n('cx') - n('r'),
      y: n('cy') - n('r'),
      w: 2 * n('r'),
      h: 2 * n('r'),
    }
  if (shape.tag === 'ellipse')
    return {
      x: n('cx') - n('rx'),
      y: n('cy') - n('ry'),
      w: 2 * n('rx'),
      h: 2 * n('ry'),
    }
  if (shape.tag === 'rect')
    return { x: n('x'), y: n('y'), w: n('width'), h: n('height') }
  if (shape.tag === 'text') {
    const w = n('textLength')
    return {
      x: n('x') - w / 2,
      y: n('y') - n('font-size'),
      w,
      h: n('font-size'),
    }
  }
  const d = String(a.d)
  assert.doesNotMatch(d, /[a-z]/, 'rig paths use absolute commands only')
  const values = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  assert.equal(values.length % 2, 0, 'path coordinates come in pairs')
  const xs = values.filter((_, i) => i % 2 === 0)
  const ys = values.filter((_, i) => i % 2 === 1)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  }
}

const play = (patch: Partial<RigPlay> = {}): RigPlay => ({
  timeMs: 0,
  walking: false,
  distance: 0,
  stride: 20,
  talking: false,
  gesture: null,
  reducedMotion: false,
  ...patch,
})
const partOf = (pose: RigPose, id: string) =>
  pose.parts.find((part) => part.id === id)!
const at = (
  rig: CutoutRig,
  pose: RigPose,
  id: string,
  point?: readonly [number, number],
) =>
  apply(
    partOf(pose, id).matrix,
    point ?? rig.parts.find((part) => part.id === id)!.pivot,
  )

for (const rig of [IRIS_RIG, NORB_RIG]) {
  const ids = rig.parts.map((part) => part.id)
  assert.equal(new Set(ids).size, ids.length, rig.id + ' part ids are unique')
  assert.equal(
    rig.parts.filter((part) => part.parent === null).length,
    1,
    rig.id + ' has one root',
  )
  for (const part of rig.parts) {
    if (part.parent) assert.ok(ids.includes(part.parent), part.id + ' parent')
    assert.doesNotThrow(() => ancestry(rig, part.id), part.id + ' acyclic')
    assert.ok(
      inside(part.pivot, part.box),
      rig.id + '/' + part.id + ' pivot sits inside its part',
    )
    assert.ok(
      part.box.x >= 0 &&
        part.box.y >= 0 &&
        part.box.x + part.box.w <= rig.frame.w &&
        part.box.y + part.box.h <= rig.frame.h,
      rig.id + '/' + part.id + ' box sits in the frame',
    )
    for (const source of sourcesOf(part.art)) {
      assert.equal(source.kind, 'svg', 'vector stand-ins until painted parts')
      if (source.kind !== 'svg') continue
      for (const shape of source.shapes) {
        const bounds = shapeBounds(shape)!
        assert.ok(
          inside([bounds.x, bounds.y], part.box, 0.75) &&
            inside([bounds.x + bounds.w, bounds.y + bounds.h], part.box, 0.75),
          rig.id +
            '/' +
            part.id +
            ' art stays inside its box ' +
            JSON.stringify(bounds),
        )
      }
    }
    if (part.art.kind === 'swap') {
      const states = part.art.channel === 'mouth' ? MOUTH_SHAPES : EYE_STATES
      assert.deepEqual(Object.keys(part.art.states).sort(), [...states].sort())
    }
    if (part.parent)
      assert.ok(
        inside(part.pivot, rig.parts.find((p) => p.id === part.parent)!.box, 1),
        part.id + ' joint lies on its parent',
      )
  }
  assert.ok(
    rig.parts.some((p) => p.art.kind === 'swap' && p.art.channel === 'mouth'),
  )
  assert.ok(
    rig.parts.some((p) => p.art.kind === 'swap' && p.art.channel === 'eyes'),
  )
  const z = (id: string) => rig.parts.find((part) => part.id === id)!.z
  assert.ok(z('armBackUpper') < z('torso') && z('torso') < z('armFrontUpper'))
  assert.ok(
    z('thighFront') < z('hips'),
    rig.id + ' skirt or slacks over thighs',
  )
  assert.ok(z('head') < z('eyes') && z('eyes') < 30 && z('mouth') > z('head'))

  for (const clipId of ['idle', 'walk', 'talk', 'point', 'recoil'] as const)
    assert.ok(rig.clips[clipId], rig.id + ' has ' + clipId)
  for (const gesture of ['point', 'reach', 'recoil'] as const) {
    const clip = rig.clips[rig.gestures[gesture]]
    assert.ok(clip && !clip.loop, rig.id + ' ' + gesture + ' is a one-shot')
  }
  for (const [clipId, clip] of Object.entries(rig.clips)) {
    assert.ok((RIG_CLIP_IDS as readonly string[]).includes(clipId))
    assert.ok(
      Number.isFinite(clip.durationMs) &&
        clip.durationMs >= 300 &&
        clip.durationMs <= 5000,
      clipId + ' duration',
    )
    assert.ok(clip.stillAt >= 0 && clip.stillAt <= 1)
    for (const channel of clip.channels) {
      assert.ok(ids.includes(channel.part), clipId + ' animates a real part')
      assert.ok(channel.keys.length >= 2)
      let previous = -1
      for (const [phase, value] of channel.keys) {
        assert.ok(phase >= 0 && phase <= 1 && phase >= previous)
        assert.ok(Number.isFinite(value))
        previous = phase
      }
      if (clip.loop)
        assert.ok(
          near(sampleChannel(channel.keys, 0), sampleChannel(channel.keys, 1)),
          rig.id + '/' + clipId + '/' + channel.part + ' loops seamlessly',
        )
      const part = rig.parts.find((p) => p.id === channel.part)!
      if ((channel.prop === 'x' || channel.prop === 'y') && part.parent)
        assert.ok(
          channel.keys.every(([, value]) => Math.abs(value) <= 1),
          channel.part + ' stays on its joint',
        )
      if (channel.prop === 'rotate')
        assert.ok(channel.keys.every(([, v]) => Math.abs(v) <= 200))
    }
    assert.equal(clip.drive === 'distance', clipId === 'walk')
  }

  // Joints stay attached in every pose: each child's pivot lands where its
  // parent carries it.
  for (const clipId of Object.keys(rig.clips) as (keyof typeof rig.clips)[]) {
    const clip = rig.clips[clipId]!
    for (const phase of [0, 0.13, 0.5, 0.77]) {
      const pose = poseRig(rig, {
        ...play(),
        walking: clipId === 'walk',
        distance: phase * 20,
        timeMs: phase * clip.durationMs,
        talking: clipId === 'talk',
        gesture: clip.loop ? null : { clip: clipId, startedMs: 0 },
      })
      for (const part of rig.parts) {
        if (!part.parent) continue
        const local = Object.values(rig.clips).some((any) =>
          any.channels.some(
            (c) => c.part === part.id && (c.prop === 'x' || c.prop === 'y'),
          ),
        )
        if (local) continue
        const mine = at(rig, pose, part.id)
        const carried = apply(partOf(pose, part.parent).matrix, part.pivot)
        assert.ok(
          near(mine[0], carried[0], 1e-6) && near(mine[1], carried[1], 1e-6),
          rig.id + '/' + clipId + '/' + part.id + ' joint attached',
        )
      }
      assert.deepEqual(
        pose.parts.map((p) => p.z),
        [...pose.parts.map((p) => p.z)].sort((a, b) => a - b),
        'parts draw in z-order',
      )
      for (const part of pose.parts)
        assert.ok(part.matrix.every(Number.isFinite))
    }
  }

  // The walk is distance-driven: the same ground gives the same pose at any
  // clock time, a full stride returns to the start, and the stride matches the
  // leg geometry so the planted foot does not slide.
  const a = poseRig(rig, play({ walking: true, distance: 7, timeMs: 100 }))
  const b = poseRig(rig, play({ walking: true, distance: 7, timeMs: 9100 }))
  assert.deepEqual(
    a.parts.map((p) => p.matrix),
    b.parts.map((p) => p.matrix),
  )
  const c = poseRig(rig, play({ walking: true, distance: 27 }))
  a.parts.forEach((part, index) =>
    part.matrix.forEach((value, i) =>
      assert.ok(near(value, c.parts[index]!.matrix[i]!, 1e-9)),
    ),
  )
  assert.equal(a.base, 'walk')
  const thigh = rig.parts.find((part) => part.id === rig.legs[0])!
  const legLength = rig.frame.ground - thigh.pivot[1]
  const swing = Math.max(
    ...rig.clips
      .walk!.channels.filter(
        (ch) => rig.legs.includes(ch.part) && ch.prop === 'rotate',
      )
      .flatMap((ch) => ch.keys.map(([, v]) => Math.abs(v))),
  )
  const geometric =
    (4 * legLength * Math.sin((swing * Math.PI) / 180)) / rig.frame.h
  assert.ok(
    Math.abs(rig.strideHeights - geometric) / geometric < 0.15,
    rig.id +
      ' stride ' +
      rig.strideHeights +
      ' vs legs ' +
      geometric.toFixed(2),
  )

  // Reduced motion: no breathing, blinking, flapping or walk swing; every
  // clip holds its still frame and a gesture holds its peak pose.
  const still = (patch: Partial<RigPlay>) =>
    poseRig(rig, play({ reducedMotion: true, ...patch }))
  const s0 = still({ timeMs: 0 })
  for (const t of [400, 1700, 2900, 12345]) {
    const later = still({ timeMs: t })
    assert.deepEqual(
      later.parts.map((p) => p.matrix),
      s0.parts.map((p) => p.matrix),
    )
    assert.equal(later.eyes, 'open')
    assert.equal(still({ timeMs: t, talking: true }).mouth, 'open')
    assert.deepEqual(
      still({ timeMs: t, walking: true, distance: t / 10 }).parts.map(
        (p) => p.matrix,
      ),
      still({ timeMs: 0, walking: true, distance: 0 }).parts.map(
        (p) => p.matrix,
      ),
    )
  }
  const recoilClip = rig.gestures.recoil
  const held = still({
    timeMs: 100,
    gesture: { clip: recoilClip, startedMs: 0 },
  })
  const heldLater = still({
    timeMs: 600,
    gesture: { clip: recoilClip, startedMs: 0 },
  })
  assert.equal(held.gesture, recoilClip)
  assert.deepEqual(
    held.parts.map((p) => p.matrix),
    heldLater.parts.map((p) => p.matrix),
  )
  const over = still({
    timeMs: rig.clips[recoilClip]!.durationMs + 1,
    gesture: { clip: recoilClip, startedMs: 0 },
  })
  assert.equal(over.gesture, null, 'a held gesture still ends on time')
  assert.notDeepEqual(
    poseRig(rig, play({ timeMs: 850 })).parts.map((p) => p.matrix),
    poseRig(rig, play({ timeMs: 0 })).parts.map((p) => p.matrix),
    rig.id + ' breathes at full motion',
  )

  // Gestures ease in and out, then hand back to the base clip.
  const idle = poseRig(rig, play({ timeMs: 5000 }))
  const pointClip = rig.clips[rig.gestures.point]!
  const done = poseRig(
    rig,
    play({
      timeMs: 5000,
      gesture: {
        clip: rig.gestures.point,
        startedMs: 5000 - pointClip.durationMs,
      },
    }),
  )
  assert.equal(done.gesture, null)
  assert.deepEqual(
    done.parts.map((p) => p.matrix),
    idle.parts.map((p) => p.matrix),
  )
  assert.equal(gesturePhase(pointClip, 1000, 999), null)
  assert.equal(gesturePhase(pointClip, 1000, 1000), 0)

  // Pointing raises the front hand to shoulder height, forward of the body.
  const hand = rig.parts.find((part) => part.id === 'armFrontLower')!
  const handPoint: [number, number] = [
    hand.box.x + hand.box.w / 2,
    hand.box.y + hand.box.h - 6,
  ]
  const peak = poseRig(
    rig,
    play({
      gesture: { clip: rig.gestures.point, startedMs: 0 },
      timeMs: pointClip.durationMs * 0.5,
    }),
  )
  const rest = poseRig(rig, play())
  const shoulder = rig.parts.find((part) => part.id === 'armFrontUpper')!.pivot
  assert.ok(
    at(rig, peak, 'armFrontLower', handPoint)[1] <
      at(rig, rest, 'armFrontLower', handPoint)[1] - 5,
  )
  assert.ok(at(rig, peak, 'armFrontLower', handPoint)[1] < shoulder[1] + 25)
}

// Iris reaches out to take and use things; Norb never touches an item: his
// reach is a gloves-up flinch that pulls both gloves up and back.
assert.equal(IRIS_RIG.handlesItems, true)
assert.equal(IRIS_RIG.gestures.reach, 'reach')
assert.equal(NORB_RIG.handlesItems, false)
assert.equal(NORB_RIG.clips.reach, undefined, 'Norb has no item-contact reach')
assert.equal(NORB_RIG.gestures.reach, 'gloves-up')
for (const rig of [IRIS_RIG, NORB_RIG]) {
  const reachClip = rig.clips[rig.gestures.reach]!
  const rest = poseRig(rig, play())
  for (const side of ['armFrontLower', 'armBackLower']) {
    const part = rig.parts.find((p) => p.id === side)!
    const handPoint: [number, number] = [
      part.box.x + part.box.w / 2,
      part.box.y + part.box.h - 6,
    ]
    for (const phase of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const pose = poseRig(
        rig,
        play({
          timeMs: phase * reachClip.durationMs,
          gesture: { clip: rig.gestures.reach, startedMs: 0 },
        }),
      )
      const [x, y] = at(rig, pose, side, handPoint)
      const [x0, y0] = at(rig, rest, side, handPoint)
      if (rig.handlesItems) continue
      assert.ok(x <= x0 + 0.5, 'Norb ' + side + ' never reaches forward')
      assert.ok(y <= y0 + 0.5, 'Norb ' + side + ' never reaches down')
    }
  }
  if (rig.handlesItems) {
    const part = rig.parts.find((p) => p.id === 'armFrontLower')!
    const handPoint: [number, number] = [
      part.box.x + part.box.w / 2,
      part.box.y + part.box.h - 6,
    ]
    const pose = poseRig(
      rig,
      play({
        timeMs: reachClip.durationMs * 0.6,
        gesture: { clip: 'reach', startedMs: 0 },
      }),
    )
    assert.ok(
      at(rig, pose, 'armFrontLower', handPoint)[0] >
        at(rig, rest, 'armFrontLower', handPoint)[0] + 8,
      'Iris reaches forward',
    )
  }
}

// Frame timing: deterministic blinks inside the gap window, about nine mouth
// shapes a second while talking, the walk phase proportional to distance.
for (const rig of [IRIS_RIG, NORB_RIG]) {
  let blinks = 0
  let previous = 'open'
  let lastStart = -Infinity
  for (let t = 0; t < 60000; t += 10) {
    const eyes = blinkAt(t, rig.seed)
    if (eyes === 'blink' && previous === 'open') {
      if (lastStart > -Infinity) {
        assert.ok(t - lastStart >= BLINK_GAP.min - 10, 'blink gap')
        assert.ok(t - lastStart <= BLINK_GAP.max + 10, 'blink gap')
      }
      lastStart = t
      blinks += 1
    }
    previous = eyes
  }
  assert.ok(
    blinks >= 60000 / BLINK_GAP.max - 1 && blinks <= 60000 / BLINK_GAP.min + 1,
  )
  assert.equal(blinkAt(4321, rig.seed), blinkAt(4321, rig.seed))
  assert.equal(
    blinkAt(BLINK_GAP.max * 8 * 3 + 17, 7),
    blinkAt(BLINK_GAP.max * 8 * 3 + 17, 7),
  )
  const shapes = new Set<string>()
  let changes = 0
  let mouth = mouthAt(0, rig.seed)
  for (let t = 0; t < 2000; t += FLAP_MS) {
    const next = mouthAt(t, rig.seed)
    shapes.add(next)
    if (next !== mouth) changes += 1
    mouth = next
  }
  assert.deepEqual([...shapes].sort(), [...MOUTH_SHAPES].sort())
  assert.ok(changes >= 8 && changes <= 18, 'mouth flap rate ' + changes)
  assert.equal(poseRig(rig, play()).mouth, 'rest')
  assert.ok(BLINK_MS >= 80 && BLINK_MS <= 200)
}
assert.equal(walkPhase(0, 20), 0)
assert.ok(near(walkPhase(5, 20), 0.25))
assert.ok(near(walkPhase(10, 20), 0.5))
assert.ok(near(walkPhase(45, 20), 0.25))
assert.ok(near(walkPhase(10, 40), walkPhase(5, 20)))
assert.equal(walkPhase(5, 0), 0)
assert.equal(walkPhase(Number.NaN, 20), 0)
// A nearer, taller figure takes proportionally longer strides; Norb's short
// legs scurry more cycles over the same ground.
assert.ok(near(strideUnits(IRIS_RIG, 50), 2 * strideUnits(IRIS_RIG, 25)))
const irisStride = strideUnits(IRIS_RIG, 45)
const norbStride = strideUnits(NORB_RIG, 45 * 0.68)
assert.ok(norbStride < irisStride * 0.75)
const cadence = 1000 / STAGE_WALK_MS_PER_UNIT / irisStride
assert.ok(
  cadence > 1.5 && cadence < 4,
  'Iris walks ' + cadence.toFixed(2) + ' cycles a second',
)

// Scene gestures: take and use reach, look and photograph point, a refused
// action recoils, Norb's rebuffs make him flinch, ghosts startle both.
const base = newCase(3)
const state = (patch: Partial<CaseState>): CaseState => ({ ...base, ...patch })
const moved = state({ transcript: [...base.transcript, 'x'] })
assert.deepEqual(leadGestures({ verb: 'take' }, base, moved), { iris: 'reach' })
assert.deepEqual(leadGestures({ verb: 'use' }, base, moved), { iris: 'reach' })
assert.deepEqual(leadGestures({ verb: 'look' }, base, moved), { iris: 'point' })
assert.deepEqual(leadGestures({ verb: 'photograph' }, base, moved), {
  iris: 'point',
})
assert.deepEqual(leadGestures({ verb: 'talk' }, base, moved), {})
assert.deepEqual(leadGestures({ verb: 'take' }, base, base), { iris: 'recoil' })
const nicoActs = state({ actor: 'nico' })
assert.deepEqual(
  leadGestures({ verb: 'take' }, nicoActs, { ...nicoActs, transcript: ['y'] }),
  {},
  'Nico is not a rigged lead',
)
assert.deepEqual(
  leadGestures({ verb: 'flirt' }, base, state({ rebuffs: base.rebuffs + 1 })),
  { norb: 'recoil' },
)
assert.deepEqual(
  leadGestures(null, base, state({ flags: [...base.flags, 'odette-met'] })),
  { iris: 'recoil', norb: 'recoil' },
)
assert.deepEqual(leadGestures(null, base, moved), {})

// Data-only swap to painted parts: same boxes, pivots, z and clips, so the
// same play state yields the same transforms with image sources.
const sheet = { w: 832, h: 1216 }
const crop = (x: number, y: number, w: number, h: number): RigImageSource => ({
  kind: 'image',
  src: '/monstress-convention/rig/iris/parts.webp',
  sheet,
  rect: { x, y, w, h },
})
const painted = withPaintedParts(IRIS_RIG, {
  torso: crop(250, 230, 330, 380),
  head: {
    ...crop(280, 20, 300, 290),
    clip: [
      [280, 20],
      [580, 20],
      [580, 310],
      [280, 310],
    ],
  },
  mouth: {
    rest: crop(0, 0, 60, 40),
    open: crop(60, 0, 60, 40),
    oh: crop(120, 0, 60, 40),
  },
  eyes: { blink: crop(0, 40, 120, 40) },
})
const paintedPose = poseRig(painted, play({ timeMs: 1234, talking: true }))
const vectorPose = poseRig(IRIS_RIG, play({ timeMs: 1234, talking: true }))
assert.deepEqual(
  paintedPose.parts.map((p) => p.matrix),
  vectorPose.parts.map((p) => p.matrix),
)
assert.equal(partOf(paintedPose, 'torso').source.kind, 'image')
assert.equal(partOf(paintedPose, 'mouth').source.kind, 'image')
assert.equal(partOf(paintedPose, 'armFrontUpper').source.kind, 'svg')
const paintedEyes = painted.parts.find((part) => part.id === 'eyes')!.art
assert.ok(paintedEyes.kind === 'swap' && paintedEyes.channel === 'eyes')
if (paintedEyes.kind === 'swap' && paintedEyes.channel === 'eyes')
  assert.equal(paintedEyes.states.blink.kind, 'image')
assert.equal(
  paintedEyes.states.open.kind,
  'svg',
  'unpainted states keep vector art',
)
assert.equal(
  IRIS_RIG.parts.find((p) => p.id === 'torso')!.art.kind,
  'svg',
  'the swap copies',
)
assert.deepEqual(Object.keys(LEAD_RIGS).sort(), ['iris', 'norb'])

// The stage drives both leads through the rig player.
const scene = read(
  'components/monstress-convention/monstress-convention-scene.vue',
)
const player = read('components/monstrique/monstrique-rig.vue')
assert.match(
  scene,
  /<MonstriqueRig[\s\S]*?data-testid="monstrique-norb-walker"[\s\S]*?character="norb"/,
)
assert.match(
  scene,
  /<MonstriqueRig[\s\S]*?data-testid="monstrique-iris-walker"[\s\S]*?character="iris"/,
)
assert.match(scene, /:walk-speed="walkSpeed"/)
assert.match(scene, /:gesture="leadGesture\.iris"/)
assert.match(scene, /leadGestures\(action, before, story\.value\.state\)/)
assert.doesNotMatch(
  scene,
  /<MonstriqueCharacterSprite[^>]*character="(iris|norb)"/,
)
assert.match(player, /prefers-reduced-motion: reduce/)
assert.match(player, /visibilitychange/)
assert.match(player, /cancelAnimationFrame/)
assert.match(player, /requestAnimationFrame\(frame\)/)

console.log('verifyMonstriqueRig: ok')
