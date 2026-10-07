// /utils/scripts/verifyZuzuShowdownSprites.test.ts
//
// Zuzu Showdown fighter sprites (conductor zuzu-showdown t-010): the shipped rig atlases are sound
// (every frame inside its atlas, every anchor inside its frame, the art the fighter's height), each
// fighter state shows the right animation (with fallbacks for art not drawn yet), frames advance at
// the animation's own rate and loop or hold, every attack's hitbox agrees with its art (the strike
// is on screen on the active frames and the box reaches where the blade or foot does), a
// left-facing fighter is mirrored about its anchor, and a whole fuzzed match draws with sprites
// without a single placeholder body.
//
//   npx tsx utils/scripts/verifyZuzuShowdownSprites.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mulberry32 } from '../arcade/curve'
import { INTRO_FRAMES, createMatch, step } from '../zuzuShowdown/sim'
import { drawMatch } from '../zuzuShowdown/render'
import { FIGHTERS, findFighter } from '../zuzuShowdown/fighters'
import {
  SPRITE_FIGHTERS,
  drawSprite,
  pickSprite,
  spriteFile,
  type LoadedSprites,
  type SpriteSheet,
} from '../zuzuShowdown/sprites'
import {
  SIM_BUTTONS,
  neutralInput,
  type Box,
  type FighterData,
  type FighterState,
  type MoveData,
  type SimInput,
} from '../zuzuShowdown/types'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const ROOT = join(process.cwd(), 'public', 'zuzu-showdown-sprites')

function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(join(ROOT, file))
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG', `${file} is a PNG`)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

const sheets = Object.fromEntries(
  SPRITE_FIGHTERS.map((slug) => [
    slug,
    JSON.parse(
      readFileSync(join(ROOT, `${spriteFile(slug)}-pixel.json`), 'utf8'),
    ) as SpriteSheet,
  ]),
) as Record<string, SpriteSheet>

function fighter(slug: string): FighterData {
  const data = findFighter(slug)
  assert.ok(data, `fighter ${slug}`)
  return data
}

function stateOf(slug: string, patch: Partial<FighterState>): FighterState {
  const data = fighter(slug)
  const f = createMatch([data, data]).fighters[0]
  return { ...f, ...patch, prev: { ...f.prev, ...(patch.prev ?? {}) } }
}

// ---------------------------------------------------------------- the shipped art

check(
  'every sprite fighter is a real fighter, and its sheet is pixel art at its height',
  () => {
    for (const slug of SPRITE_FIGHTERS) {
      const data = fighter(slug)
      assert.ok(FIGHTERS.includes(data))
      const sheet = sheets[slug]!
      assert.equal(sheet.style, 'pixel')
      assert.equal(sheet.scale, 1)
      const standing = data.hurtStand.h
      assert.equal(sheet.height, standing, `${slug} sheet height`)
      // The idle frame's art stands within a few pixels of the fighter's hurtbox height.
      const idle = sheet.animations.idle!.frames[0]!
      assert.ok(
        Math.abs(idle.anchor.y - standing) <= 8,
        `${slug} idle stands ${idle.anchor.y} vs ${standing}`,
      )
    }
  },
)

check(
  'every frame lies inside its atlas, with its anchor on the ground near the art',
  () => {
    for (const slug of SPRITE_FIGHTERS) {
      const sheet = sheets[slug]!
      // The pixel style ships its P2 atlas (HD makes its own from p2_rules).
      assert.ok(sheet.atlas_p2, `${slug} has a P2 atlas`)
      for (const file of [sheet.atlas, sheet.atlas_p2]) {
        const { width, height } = pngSize(file)
        for (const [name, anim] of Object.entries(sheet.animations)) {
          assert.ok(anim.frames.length > 0, `${slug} ${name} has frames`)
          assert.ok(anim.fps > 0 && anim.fps <= 30, `${slug} ${name} fps`)
          for (const f of anim.frames) {
            assert.ok(
              f.x >= 0 && f.y >= 0 && f.x + f.w <= width && f.y + f.h <= height,
              `${slug} ${name} rect`,
            )
            // A fighter lying behind his own spot (the KO) has his anchor past the art, never far past it.
            assert.ok(
              f.anchor.x >= -f.w && f.anchor.x <= 2 * f.w,
              `${slug} ${name} anchor x`,
            )
            assert.ok(
              // An airborne pose (legs tucked, all in the air) has the ground below the art, never far below.
              f.anchor.y >= 0 && f.anchor.y <= 2 * f.h,
              `${slug} ${name} anchor y`,
            )
          }
        }
      }
    }
  },
)

check(
  'both fighters ship the core set and every normal; the Coyote ships his specials and poses',
  () => {
    for (const slug of SPRITE_FIGHTERS) {
      for (const name of [
        'idle',
        'walk_forward',
        'crouch',
        'jump_up',
        'land',
        'dodge_forward',
        'dodge_back',
        'wakeup',
        'throw',
        'throw_hold',
        'throw_whiff',
        'thrown',
        ...['stand', 'crouch', 'jump'].flatMap((stance) =>
          ['lp', 'lk', 'hp', 'hk'].map((button) => `${stance}_${button}`),
        ),
      ])
        assert.ok(sheets[slug]!.animations[name], `${slug} ${name}`)
    }
    for (const slug of SPRITE_FIGHTERS)
      for (const name of ['intro', 'perfect', 'knockdown', 'ko', 'taunt'])
        assert.ok(sheets[slug]!.animations[name], `${slug} ${name}`)
    // Every special and super each kit lists has art under its move id.
    for (const slug of SPRITE_FIGHTERS)
      for (const special of fighter(slug).specials)
        assert.ok(
          sheets[slug]!.animations[special.id.replace(/-/g, '_')],
          `${slug} ${special.id}`,
        )
  },
)

// ---------------------------------------------------------------- hitboxes against the art

// A hitbox may stop short of the art's tip (a blade's last inch shouldn't win trades) but never
// reach past it by more than a pixel or so of outline, and it sits where the art strikes.
const SHORT_OF_TIP = 12
const PAST_TIP = 4
const VERTICAL_SLACK = 8

function union(boxes: Box[]): Box {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  return {
    x,
    y,
    w: Math.max(...boxes.map((b) => b.x + b.w)) - x,
    h: Math.max(...boxes.map((b) => b.y + b.h)) - y,
  }
}

check(
  'every attack hitbox agrees with its art: struck on the active frames, reaching where the art does',
  () => {
    for (const slug of SPRITE_FIGHTERS) {
      const data = fighter(slug)
      const sheet = sheets[slug]!
      const moves: Array<[string, MoveData]> = [
        ...Object.entries(data.moves as Record<string, MoveData>),
        ...data.specials.map((s): [string, MoveData] => [s.id, s.move]),
      ]
      let measured = 0
      for (const [id, move] of moves) {
        const name = id.replace(/-/g, '_')
        const anim = sheet.animations[name]
        // Projectiles, parries, grabs-as-throws and the screen-wide supers have no strike layer.
        if (!anim?.frames.some((f) => f.hit) || move.hitbox.w <= 0) continue
        measured += 1
        // The frames the game actually shows while the hitbox is live (sim.ts hitbox()).
        const shown: Box[] = []
        for (let t = move.startup; t < move.startup + move.active; t++) {
          const attack = { id, heavy: false, frame: t }
          const pick = pickSprite(
            stateOf(slug, {
              action: 'attack',
              attack: attack as FighterState['attack'],
            }),
            sheet,
          )!
          assert.equal(pick.name, name, `${slug} ${id} plays its own art`)
          const hit = anim.frames[pick.index]!.hit
          assert.ok(
            hit,
            `${slug} ${id}: the strike is drawn on active frame ${t}`,
          )
          shown.push(hit)
        }
        const art = union(shown)
        const box = move.hitbox
        const far = box.x + box.w
        const artFar = art.x + art.w
        assert.ok(
          far <= artFar + PAST_TIP && far >= artFar - SHORT_OF_TIP,
          `${slug} ${id}: hitbox reaches ${far}, the art ${artFar}`,
        )
        const label = `${slug} ${id}: hitbox y ${box.y}..${box.y + box.h}, art ${art.y}..${art.y + art.h}`
        if (!move.grab) {
          // A command grab takes the whole body; anything else is where its art is.
          const overlap =
            Math.min(box.y + box.h, art.y + art.h) - Math.max(box.y, art.y)
          assert.ok(overlap >= Math.min(4, box.h), label)
          assert.ok(box.y >= art.y - VERTICAL_SLACK, label)
          assert.ok(box.y + box.h <= art.y + art.h + VERTICAL_SLACK, label)
        }
        // A low has to be drawn reaching the floor.
        if (move.guard === 'low') assert.ok(art.y <= 4, `${label} (low)`)
      }
      assert.ok(measured >= 12, `${slug}: ${measured} attacks measured`)
    }
  },
)

// ---------------------------------------------------------------- choosing a frame

check(
  'states pick their animation, falling back when the art is not drawn yet',
  () => {
    const coyote = sheets['coyote-vagrant']!
    // Fallbacks are tested on a copy of Zuzu's sheet with some art taken away, as if not drawn yet.
    const zuzu: SpriteSheet = {
      ...sheets.zuzu!,
      animations: Object.fromEntries(
        Object.entries(sheets.zuzu!.animations).filter(
          ([name]) =>
            ![
              'walk_back',
              'block_low',
              'ko',
              'knockdown',
              'stand_lp',
              'land',
            ].includes(name),
        ),
      ),
    }
    assert.equal(
      pickSprite(
        stateOf('zuzu', { action: 'walk', vx: -4, facing: 1 }),
        sheets.zuzu!,
      )!.name,
      'walk_back',
    )
    assert.equal(
      pickSprite(stateOf('coyote-vagrant', { action: 'idle' }), coyote)!.name,
      'idle',
    )
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', { action: 'walk', vx: 4, facing: 1 }),
        coyote,
      )!.name,
      'walk_forward',
    )
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', { action: 'walk', vx: 4, facing: -1 }),
        coyote,
      )!.name,
      'walk_back',
    )
    // Without walk_back he shuffles with the forward walk.
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'walk', vx: -4, facing: 1 }), zuzu)!
        .name,
      'walk_forward',
    )
    const shot = stateOf('coyote-vagrant', {
      action: 'attack',
      attack: {
        id: 'wild-shot',
        heavy: false,
        frame: 3,
      } as FighterState['attack'],
    })
    assert.equal(pickSprite(shot, coyote)!.name, 'wild_shot')
    // A normal plays its own art; one with no art of its own borrows the standing heavy.
    const jab = stateOf('zuzu', {
      action: 'attack',
      attack: {
        id: 'stand_lp',
        heavy: false,
        frame: 2,
      } as FighterState['attack'],
    })
    assert.equal(pickSprite(jab, sheets.zuzu!)!.name, 'stand_lp')
    assert.equal(pickSprite(jab, zuzu)!.name, 'stand_hp')
    // Dodges pick the roll or the sidestep by direction; landing falls back to the crouch.
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'dodge', dodgeDir: 1 }), zuzu)!.name,
      'dodge_forward',
    )
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'dodge', dodgeDir: -1 }), zuzu)!
        .name,
      'dodge_back',
    )
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'land' }), sheets.zuzu!)!.name,
      'land',
    )
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'land' }), zuzu)!.name,
      'crouch',
    )
    // A throw: the grab, then the heave once it connects; the victim is held, then knocked down.
    assert.equal(
      pickSprite(stateOf('coyote-vagrant', { action: 'throwing' }), coyote)!
        .name,
      'throw',
    )
    assert.equal(
      pickSprite(stateOf('coyote-vagrant', { action: 'throwHold' }), coyote)!
        .name,
      'throw_hold',
    )
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'thrown' }), zuzu)!.name,
      'thrown',
    )
    // The round intro plays over the idle, on the round's clock; a flawless win plays the Perfect pose.
    const intro = pickSprite(
      stateOf('coyote-vagrant', { action: 'idle', frame: 1 }),
      coyote,
      { intro: 89 },
    )!
    assert.equal(intro.name, 'intro')
    assert.equal(intro.index, coyote.animations.intro!.frames.length - 1)
    const won = stateOf('coyote-vagrant', { action: 'victory' })
    assert.equal(pickSprite(won, coyote, { perfect: true })!.name, 'perfect')
    assert.equal(pickSprite(won, coyote)!.name, 'victory_button')
    const low = stateOf('coyote-vagrant', {
      action: 'blockstun',
      prev: { ...neutralInput(), down: true },
    })
    assert.equal(pickSprite(low, coyote)!.name, 'block_low')
    // Without block_low he crouches.
    assert.equal(
      pickSprite({ ...low, action: 'blockstun' }, zuzu)!.name,
      'crouch',
    )
    assert.equal(
      pickSprite(stateOf('coyote-vagrant', { action: 'ko' }), coyote)!.name,
      'ko',
    )
    assert.equal(
      pickSprite(stateOf('zuzu', { action: 'ko' }), zuzu)!.name,
      'idle',
    )
  },
)

check(
  'frames advance at the animation rate, loop when looping and hold when not',
  () => {
    const coyote = sheets['coyote-vagrant']!
    const idle = coyote.animations.idle!
    const perFrame = 60 / idle.fps
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', { action: 'idle', frame: 1 }),
        coyote,
      )!.index,
      0,
    )
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', {
          action: 'idle',
          frame: 1 + Math.ceil(perFrame),
        }),
        coyote,
      )!.index,
      1,
    )
    const lap = Math.ceil(perFrame * idle.frames.length)
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', { action: 'idle', frame: 1 + lap }),
        coyote,
      )!.index,
      0,
    )
    const knock = coyote.animations.knockdown!
    assert.ok(!knock.loop)
    assert.equal(
      pickSprite(
        stateOf('coyote-vagrant', { action: 'knockdown', frame: 600 }),
        coyote,
      )!.index,
      knock.frames.length - 1,
    )
  },
)

// ---------------------------------------------------------------- drawing

type Call = { op: string; args: number[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const gradient = { addColorStop: () => undefined }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    drawImage: record('drawImage'),
    translate: record('translate'),
    scale: record('scale'),
    save: record('save'),
    restore: record('restore'),
    createLinearGradient: () => gradient,
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

check(
  'a sprite sits on its anchor; facing left mirrors it about the anchor',
  () => {
    const frame = sheets.zuzu!.animations.idle!.frames[0]!
    const image = {} as CanvasImageSource
    const right = stubContext()
    drawSprite(right.g, image, frame, 1, 100, 238, 1)
    assert.ok(!right.calls.some((c) => c.op === 'scale'))
    const draw = right.calls.find((c) => c.op === 'drawImage')!
    assert.deepEqual(draw.args.slice(4), [
      -frame.anchor.x,
      -frame.anchor.y,
      frame.w,
      frame.h,
    ])
    assert.deepEqual(
      right.calls.find((c) => c.op === 'translate')!.args,
      [100, 238],
    )
    const left = stubContext()
    drawSprite(left.g, image, frame, 1, 100, 238, -1)
    assert.deepEqual(left.calls.find((c) => c.op === 'scale')!.args, [-1, 1])
  },
)

check('a fuzzed match draws both fighters as sprites every frame', () => {
  const roster: [FighterData, FighterData] = [
    fighter('zuzu'),
    fighter('coyote-vagrant'),
  ]
  const loaded: Record<string, LoadedSprites> = {}
  for (const slug of SPRITE_FIGHTERS)
    loaded[slug] = {
      sheet: sheets[slug]!,
      image: {} as CanvasImageSource,
      p2: null,
    }
  const rand = mulberry32(77)
  const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
  let s = createMatch(roster)
  for (let i = 0; i < INTRO_FRAMES + 1500 && s.phase !== 'over'; i += 1) {
    for (const p of held)
      for (const b of SIM_BUTTONS) if (rand() < 0.08) p[b] = !p[b]
    s = step(s, [{ ...held[0] }, { ...held[1] }], roster)
    const { g, calls } = stubContext()
    drawMatch(g, s, roster, [], {
      showBoxes: false,
      reducedMotion: false,
      sprites: loaded,
    })
    const images = calls.filter((c) => c.op === 'drawImage')
    assert.equal(images.length, 2, `frame ${i}: both fighters drawn as sprites`)
    for (const c of images)
      assert.ok(
        c.args.every(Number.isFinite),
        `frame ${i}: finite sprite coordinates`,
      )
  }
})

console.log(`verifyZuzuShowdownSprites: ${passed} checks passed`)
