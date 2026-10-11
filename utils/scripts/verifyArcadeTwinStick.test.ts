// Twin-stick input contract (conductor kr-arcade/t-027): the optional InputFrame.aim, its pure
// readers in utils/arcade/input.ts (right stick, aim keys, touch stick), how ButtonInput carries it
// only while a cabinet has aiming on, and that every cabinet but the twin-stick one is untouched.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARCADE_GAMES } from '../arcade/games'
import {
  AIM_DEADZONE,
  AIM_KEYS,
  ArcadeInput,
  KEY_MAP,
  TWIN_KEYS,
  aimFromKeys,
  combineAim,
  readAimStick,
  readGamepad,
  stickAim,
} from '../arcade/input'
import { emptyInput } from '../arcade/types'

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9

// --- the pure readers -------------------------------------------------------------------
{
  assert.equal(stickAim(0.1, 0.1), null, 'inside the dead zone is no aim')
  assert.equal(stickAim(0, 0), null)
  assert.equal(stickAim(Number.NaN, 0), null, 'a broken axis never aims')
  const half = stickAim(0.6, 0)!
  assert.ok(
    close(half.x, 0.6) && close(half.y, 0),
    'a part push keeps its size',
  )
  const over = stickAim(1, 1)!
  assert.ok(
    close(Math.hypot(over.x, over.y), 1),
    'a corner push is clamped to 1',
  )
  assert.ok(close(over.x, over.y), 'and keeps its direction')
  assert.ok(AIM_DEADZONE > 0 && AIM_DEADZONE < 0.5)

  const pad = (axes: number[]) =>
    ({ axes, buttons: [] }) as unknown as Pick<Gamepad, 'axes' | 'buttons'>
  const right = readAimStick(pad([0, 0, 0.9, -0.2]))!
  assert.ok(right.x > 0.8 && right.y < 0, 'the right stick is axes 2 and 3')
  assert.equal(
    readAimStick(pad([0.9, 0.9])),
    null,
    'a pad without a right stick',
  )
  assert.equal(
    readAimStick(pad([0.9, 0.9, 0.05, 0])),
    null,
    'a resting right stick',
  )
  const moved = readGamepad(pad([0, 0, -1, -1]))
  assert.ok(
    !moved.left && !moved.up,
    'the right stick never presses a direction button',
  )

  assert.equal(aimFromKeys({}), null)
  assert.deepEqual(aimFromKeys({ right: true }), { x: 1, y: 0 })
  assert.equal(
    aimFromKeys({ left: true, right: true }),
    null,
    'opposites cancel',
  )
  const diag = aimFromKeys({ up: true, left: true })!
  assert.ok(close(diag.x, -Math.SQRT1_2) && close(diag.y, -Math.SQRT1_2))

  const touch = { x: 0, y: 1 }
  const stick = { x: 1, y: 0 }
  assert.equal(
    combineAim([null, stick, touch]),
    stick,
    'the first live aim wins',
  )
  assert.equal(combineAim([touch, stick]), touch)
  assert.equal(combineAim([null, undefined]), null)

  // The split keyboard: WASD moves, the arrows only aim.
  for (const code of Object.keys(AIM_KEYS))
    assert.equal(TWIN_KEYS[code], undefined, `${code} aims, it doesn't move`)
  assert.equal(TWIN_KEYS.KeyW, 'up')
  assert.equal(TWIN_KEYS.Space, 'a')
  assert.equal(KEY_MAP.ArrowUp, 'up', 'off twin-stick the arrows still move')
  assert.equal(emptyInput().aim, undefined, 'frames carry no aim by default')
}

// --- ButtonInput carries an aim only while aiming is on ------------------------------------
{
  // A browser-ish world for the key handlers.
  const g = globalThis as unknown as Record<string, unknown>
  // Stand-ins for the DOM classes the key handler checks with instanceof.
  g.HTMLInputElement ??= function HTMLInputElement() {}
  g.Element ??= function Element() {}
  const handlers: Record<string, (event: unknown) => void> = {}
  const target = {
    addEventListener: (type: string, fn: (event: unknown) => void) =>
      (handlers[type] = fn),
    removeEventListener: () => {},
  } as unknown as Window
  const key = (type: 'keydown' | 'keyup', code: string) =>
    handlers[type]!({ code, target: null, preventDefault: () => {} })

  const input = new ArcadeInput()
  input.attach(target)
  input.setAimTouch({ x: 1, y: 0 })
  key('keydown', 'ArrowLeft')
  let frame = input.poll()
  assert.equal(frame.aim, undefined, 'aiming off: no aim, ever')
  assert.equal(frame.held.left, true, 'aiming off: the arrows are directions')
  key('keyup', 'ArrowLeft')

  input.setAiming(true)
  input.setKeyMap(TWIN_KEYS)
  frame = input.poll()
  assert.equal(frame.aim, undefined, 'turning aiming on clears any old touch')
  key('keydown', 'ArrowLeft')
  key('keydown', 'KeyD')
  frame = input.poll()
  assert.deepEqual(frame.aim, { x: -1, y: 0 }, 'arrows aim')
  assert.equal(frame.held.left, false, 'and no longer move')
  assert.equal(frame.held.right, true, 'WASD moves')
  input.setAimTouch({ x: 0, y: -0.5 })
  frame = input.poll()
  assert.deepEqual(
    frame.aim,
    { x: 0, y: -0.5 },
    'the touch stick beats the keys',
  )
  input.setAimTouch(null)
  key('keyup', 'ArrowLeft')
  frame = input.poll()
  assert.equal(frame.aim, undefined, 'nothing aiming, no aim')

  // A gamepad's right stick, read from the same slot as its buttons.
  const nav = globalThis.navigator as unknown as Record<string, unknown>
  const had = 'getGamepads' in nav
  Object.defineProperty(nav, 'getGamepads', {
    configurable: true,
    value: () => [{ index: 0, axes: [0, 0, 0, 0.8], buttons: [] }],
  })
  frame = input.poll()
  assert.ok(frame.aim && frame.aim.y > 0.7, 'the right stick aims')
  input.setPadIndex(-1)
  frame = input.poll()
  assert.equal(frame.aim, undefined, 'a seat without a pad reads no stick')
  input.setPadIndex(null)

  input.setAiming(false)
  input.setKeyMap(KEY_MAP)
  frame = input.poll()
  assert.equal(frame.aim, undefined, 'aiming off again: the stick is ignored')
  key('keydown', 'ArrowUp')
  assert.equal(input.poll().held.up, true, 'and the arrows move again')
  if (!had) delete nav.getGamepads
  else
    Object.defineProperty(nav, 'getGamepads', {
      configurable: true,
      value: undefined,
    })
  input.detach()
}

// --- only the twin-stick cabinet asks for it ---------------------------------------------------
{
  const twin = ARCADE_GAMES.filter((game) => game.twinStick)
  assert.deepEqual(
    twin.map((game) => game.slug),
    ['rescue-rally', 'prize-show-panic'],
    'every other cabinet keeps its controls',
  )
  // Twin-stick is solo only: a cabinet that seats more (Prize Show Panic's co-op) turns the second
  // stick off whenever more than one is seated, and the seats aim the way they move (or B-lock).
  const cabinet = readFileSync(
    new URL('../../components/arcade/arcade-cabinet.vue', import.meta.url),
    'utf8',
  )
  assert.match(
    cabinet,
    /const twinStick = computed\(\s*\(\) => meta\.value\?\.twinStick === true && !duo\.value/,
    'the cabinet aims with a second stick for one seat only',
  )
}

console.log('verifyArcadeTwinStick: ok')
