import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor kr-arcade t-147: Rescue Rally's co-op and solo aim through the actual shared cabinet. Every
// frame here comes from the cabinet's own consumers (its key maps, seat routing, gamepad slots, touch
// d-pads and aim stick) feeding the real game, at phone, tablet and desktop widths. The arena is staged
// empty (no foes, invulnerable heroes) so motion is measurable; menu picks, seat routing, aim and the
// partner pick-up run unstaged. Synthetic keyboard, pointer and Gamepad-API input in headless Chromium:
// not physical-device, real-controller or human-pacing evidence.

const SLUG = 'rescue-rally'
const fixture = await bundleCabinetFixture()
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const shots = process.env.RESCUE_RALLY_SHOTS
if (shots) mkdirSync(shots, { recursive: true })

/** The newest real (non-demo) Rescue Rally game the cabinet created, as plain data. */
function rally(page) {
  return page.evaluate(() => {
    const game = (window.__rallies ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    if (!game) return null
    return {
      menu: game.menu ? { cursor: game.menu.cursor } : null,
      shelter: game.shelter ? { cursor: game.shelter.cursor } : null,
      level: game.level,
      mode: game.mode,
      over: game.over,
      lives: game.lives,
      heroes: game.heroes.map((h) => ({
        x: h.x,
        y: h.y,
        alive: h.alive,
        aimX: h.aimX,
        aimY: h.aimY,
        aiming: h.aiming,
      })),
      shots: game.shots.map((shot) => shot.seat),
    }
  })
}

/** Empty the arena and park the heroes (explicit staging: no foes, nothing hurts). */
function stage(page, spots) {
  return page.evaluate((spots) => {
    const game = window.__rallies.filter((entry) => !entry.demo).at(-1).game
    Object.assign(game, {
      foes: [],
      family: [],
      arrivals: [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }],
      bolts: [],
      shots: [],
      pickups: [],
      boss: null,
      banner: null,
      ventPower: true,
      belts: [],
      vines: [],
      sprinklers: [],
      pads: [],
      gates: [],
      magnetFloors: [],
      storm: undefined,
    })
    game.heroes.forEach((h, i) =>
      Object.assign(h, { ...spots[i], invuln: 1e9, alive: true, trail: [] }),
    )
  }, spots)
}

/** Down one hero (the game's own hurt path), as a foe's touch would. */
function down(page, seat) {
  return page.evaluate((seat) => {
    const game = window.__rallies.filter((entry) => !entry.demo).at(-1).game
    const hero = game.heroes[seat]
    hero.invuln = 0
    game.hurtHero(hero)
  }, seat)
}

/** Hold keys for a while, read the game mid-hold, then let go. */
async function holding(page, keys, ms) {
  for (const key of keys) await page.keyboard.down(key)
  await wait(ms)
  const state = await rally(page)
  for (const key of keys) await page.keyboard.up(key)
  await wait(80)
  return state
}

async function tapKey(page, key) {
  await page.keyboard.down(key)
  await wait(70)
  await page.keyboard.up(key)
  await wait(90)
}

/** Standard-mapping pads through the Gamepad API the cabinet reads (null: an empty slot). */
function setPads(page, pads, event) {
  return page.evaluate(
    ({ pads, event }) => {
      window.__pads = pads.map(
        (pad, index) =>
          pad && {
            index,
            id: `fixture pad ${index}`,
            connected: true,
            mapping: 'standard',
            axes: pad.axes ?? [0, 0, 0, 0],
            buttons: Array.from({ length: 17 }, (_, b) => ({
              pressed: (pad.buttons ?? []).includes(b),
              value: (pad.buttons ?? []).includes(b) ? 1 : 0,
            })),
          },
      )
      if (event) window.dispatchEvent(new Event(event))
    },
    { pads, event },
  )
}

/** A synthetic touch on a control, at a fraction of its box. */
function pointer(page, selector, type, pointerId, fx = 0.5, fy = 0.5) {
  return page.evaluate(
    ({ selector, type, pointerId, fx, fy }) => {
      const el = document.querySelector(selector)
      if (!el) throw new Error(`no ${selector}`)
      const rect = el.getBoundingClientRect()
      el.dispatchEvent(
        new PointerEvent(type, {
          pointerId,
          pointerType: 'touch',
          isPrimary: pointerId === 1,
          clientX: rect.left + rect.width * fx,
          clientY: rect.top + rect.height * fy,
          bubbles: true,
          cancelable: true,
        }),
      )
    },
    { selector, type, pointerId, fx, fy },
  )
}

async function tapControl(page, selector, pointerId) {
  await pointer(page, selector, 'pointerdown', pointerId)
  await wait(80)
  await pointer(page, selector, 'pointerup', pointerId)
  await wait(90)
}

/** Wait for the cabinet to create a real game, past the menu's opening beat. */
async function awaitMenu(page) {
  await page.waitForFunction(() =>
    (window.__rallies ?? []).some(
      (entry) => !entry.demo && entry.game.menu?.ticks > 12,
    ),
  )
}

/** Every visible touch control's box, for the on-screen check. */
function controlBoxes(page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '.cabinet-overlay .cabinet-dpad, .cabinet-overlay .cabinet-ball, .cabinet-overlay .cabinet-aim, .cabinet-pause-chip',
      ),
    ].map((node) => {
      const b = node.getBoundingClientRect()
      return {
        name: node.className,
        left: b.left,
        top: b.top,
        right: b.right,
        bottom: b.bottom,
      }
    }),
  )
}

function onScreen(boxes, width, height, label) {
  assert.ok(boxes.length > 0, `${label}: touch controls exist`)
  for (const box of boxes)
    assert.ok(
      box.left >= -1 &&
        box.top >= -1 &&
        box.right <= width + 1 &&
        box.bottom <= height + 1,
      `${label}: ${box.name} is on screen ${JSON.stringify(box)}`,
    )
}

const moved = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const summary = []

try {
  // 1. Desktop keyboard, one seat: the mode menu on the arrows and on WASD, then the split
  //    twin-stick board (WASD moves, the arrows only aim) and a gamepad's two sticks.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
    })
    await page.keyboard.press('Enter')
    await awaitMenu(page)
    let state = await rally(page)
    assert.equal(state.heroes.length, 1, 'one seat, one hero')
    assert.equal(state.menu.cursor, 0, 'the menu of modes opens on Campaign')
    await tapKey(page, 'ArrowDown')
    assert.equal(
      (await rally(page)).menu?.cursor,
      1,
      'the arrows move the mode menu (aiming waits for play)',
    )
    await tapKey(page, 'ArrowUp')
    assert.equal((await rally(page)).menu?.cursor, 0)
    await tapKey(page, 'KeyS')
    assert.equal((await rally(page)).menu?.cursor, 1, 'and so does WASD')
    await tapKey(page, 'KeyW')
    await tapKey(page, 'Space')
    state = await rally(page)
    assert.equal(state.menu, null, 'A picks the mode')
    assert.equal(state.mode, 'campaign')

    await stage(page, [{ x: 240, y: 180 }])
    let before = (await rally(page)).heroes[0]
    let during = await holding(page, ['KeyD'], 400)
    assert.ok(during.heroes[0].x > before.x + 10, 'WASD moves the hero')
    assert.ok(during.heroes[0].aimX > 0.99, 'moving alone aims the way it goes')
    assert.equal(during.heroes[0].aiming, false)

    before = (await rally(page)).heroes[0]
    during = await holding(page, ['ArrowUp'], 300)
    assert.ok(
      moved(during.heroes[0], before) < 0.01,
      'the arrows only aim: the hero stays put',
    )
    assert.ok(during.heroes[0].aiming, 'the second stick is aiming')
    assert.ok(during.heroes[0].aimY < -0.99, 'up')
    assert.ok(during.shots.includes(0), 'and the beam fires by itself')

    before = (await rally(page)).heroes[0]
    during = await holding(page, ['KeyD', 'ArrowLeft'], 400)
    assert.ok(during.heroes[0].x > before.x + 10, 'moving right')
    assert.ok(during.heroes[0].aimX < -0.99, 'while aiming left: twin-stick')
    assert.equal((await rally(page)).heroes[0].aiming, false, 'let go: no aim')

    // A gamepad: left stick moves, right stick aims, on the one seat that reads every pad.
    before = (await rally(page)).heroes[0]
    await setPads(page, [{ axes: [0, 0.95, 0.95, 0] }], 'gamepadconnected')
    await wait(350)
    state = await rally(page)
    assert.ok(state.heroes[0].y > before.y + 8, 'the left stick moves down')
    assert.ok(state.heroes[0].aiming && state.heroes[0].aimX > 0.9)
    await setPads(page, [null], 'gamepaddisconnected')
    await wait(120)
    before = (await rally(page)).heroes[0]
    await wait(250)
    state = await rally(page)
    assert.ok(moved(state.heroes[0], before) < 0.01, 'unplugged: it stops')
    assert.equal(state.heroes[0].aiming, false)
    assert.equal(state.over, false)

    // The Shelter between waves is a menu mid-play too: the arrows move its cursor, then aim again.
    await page.evaluate(() =>
      window.__rallies
        .filter((entry) => !entry.demo)
        .at(-1)
        .game.openShelter(),
    )
    await page.waitForFunction(
      () =>
        window.__rallies.filter((entry) => !entry.demo).at(-1).game.shelter
          ?.ticks > 24,
    )
    const level = (await rally(page)).level
    await tapKey(page, 'ArrowUp')
    assert.equal(
      (await rally(page)).shelter?.cursor,
      5,
      'ArrowUp wraps the Shelter cursor to Leave',
    )
    await tapKey(page, 'Space')
    state = await rally(page)
    assert.equal(state.shelter, null, 'A leaves the Shelter')
    assert.equal(state.level, level + 1, 'for the next wave')
    await stage(page, [{ x: 240, y: 180 }])
    before = (await rally(page)).heroes[0]
    during = await holding(page, ['ArrowRight'], 300)
    assert.ok(
      moved(during.heroes[0], before) < 0.01 && during.heroes[0].aiming,
      'back in the wave the arrows aim again',
    )
    if (shots)
      await page.screenshot({ path: path.join(shots, 'solo-desktop.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(
      'desktop solo: modes and Shelter on the arrows, split-board aim, pad sticks',
    )
  }

  // 2. Desktop keyboard, two seats: seat 1 picks the mode, each seat moves its own hero, co-op aims
  //    the way a hero moves, and a partner walks over to pick up a downed hero.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      seats: 2,
    })
    await page.keyboard.press('Enter')
    await awaitMenu(page)
    assert.equal((await rally(page)).heroes.length, 2, 'two seats, two heroes')
    await tapKey(page, 'KeyS')
    assert.equal((await rally(page)).menu?.cursor, 1, "seat 1's S moves")
    await tapKey(page, 'KeyW')
    await tapKey(page, 'KeyF')
    assert.equal((await rally(page)).mode, 'campaign', "seat 1's F picks")

    await stage(page, [
      { x: 200, y: 180 },
      { x: 300, y: 180 },
    ])
    let before = (await rally(page)).heroes
    let during = await holding(page, ['KeyD'], 400)
    assert.ok(during.heroes[0].x > before[0].x + 10, 'WASD moves seat 1')
    assert.ok(moved(during.heroes[1], before[1]) < 0.01, 'and not seat 2')
    before = during.heroes
    during = await holding(page, ['ArrowUp'], 400)
    assert.ok(during.heroes[1].y < before[1].y - 10, 'the arrows move seat 2')
    assert.ok(moved(during.heroes[0], before[0]) < 0.01, 'and not seat 1')
    assert.ok(
      during.heroes[1].aimY < -0.99 && !during.heroes[1].aiming,
      'co-op has no second stick: seat 2 aims the way it moves',
    )
    during = await holding(page, ['Slash'], 200)
    assert.deepEqual(
      [...new Set(during.shots)],
      [1],
      "seat 2's A fires its own beam",
    )

    // Absent input: seat 2 untouched stands still while seat 1 plays on.
    before = (await rally(page)).heroes
    during = await holding(page, ['KeyA'], 300)
    assert.ok(moved(during.heroes[1], before[1]) < 0.01, 'an idle seat idles')

    // Partner pick-up through seat 1's keys: walk over, stand close for two seconds.
    await stage(page, [
      { x: 230, y: 180 },
      { x: 290, y: 180 },
    ])
    const lives = (await rally(page)).lives
    await down(page, 1)
    let state = await rally(page)
    assert.equal(state.heroes[1].alive, false, 'seat 2 is down')
    assert.equal(state.lives, lives - 1)
    const fell = state.heroes[1]
    await page.keyboard.down('KeyD')
    await page.waitForFunction(() => {
      const game = window.__rallies.filter((entry) => !entry.demo).at(-1).game
      return game.heroes[1].x - game.heroes[0].x < 14
    })
    await page.keyboard.up('KeyD')
    const reachedAt = Date.now()
    await page.waitForFunction(
      () =>
        window.__rallies.filter((entry) => !entry.demo).at(-1).game.heroes[1]
          .alive,
      null,
      { timeout: 5000 },
    )
    const took = Date.now() - reachedAt
    state = await rally(page)
    assert.ok(
      took < 4000,
      `picked up by the partner (${took} ms, not the 7 s self-respawn)`,
    )
    assert.ok(moved(state.heroes[1], fell) < 0.5, 'right where they fell')
    assert.equal(state.lives, lives - 1, 'the pick-up costs nothing more')
    if (shots)
      await page.screenshot({ path: path.join(shots, 'coop-desktop.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(
      'desktop 2-seat keyboard: own motion, move-to-aim, partner pick-up',
    )
  }

  // 3. Desktop, four seats from the keyboard and two gamepads: pads go to seats 3 and 4, a pad's
  //    right stick never aims in co-op, and an unplugged pad's seat stands still until it comes back.
  {
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width: 1440,
      height: 900,
      seats: 4,
    })
    await setPads(page, [{}, {}], 'gamepadconnected')
    await page.waitForFunction(() =>
      /4 players/i.test(document.querySelector('#cabinet')?.textContent ?? ''),
    )
    await page.keyboard.press('Enter')
    await awaitMenu(page)
    assert.equal((await rally(page)).heroes.length, 4, 'four seats')
    await tapKey(page, 'KeyS')
    assert.equal((await rally(page)).menu?.cursor, 1)
    await tapKey(page, 'KeyW')
    await tapKey(page, 'Space')
    assert.equal((await rally(page)).mode, 'campaign')

    const spots = [
      { x: 160, y: 180 },
      { x: 220, y: 180 },
      { x: 280, y: 180 },
      { x: 340, y: 180 },
    ]
    await stage(page, spots)
    let before = (await rally(page)).heroes
    await setPads(page, [{ axes: [0.95, 0, -0.95, 0] }, { buttons: [12] }])
    await wait(400)
    let state = await rally(page)
    assert.ok(state.heroes[2].x > before[2].x + 10, 'pad 1 drives seat 3')
    assert.ok(state.heroes[3].y < before[3].y - 10, 'pad 2 drives seat 4')
    assert.ok(moved(state.heroes[0], before[0]) < 0.01, 'seat 1 untouched')
    assert.ok(moved(state.heroes[1], before[1]) < 0.01, 'seat 2 untouched')
    assert.ok(
      !state.heroes[2].aiming && state.heroes[2].aimX > 0.99,
      'in co-op a right stick does not aim',
    )

    // Pad 2 drops out mid-run: seat 4 stands, nobody else's controls move.
    await setPads(
      page,
      [{ axes: [0.95, 0, 0, 0] }, null],
      'gamepaddisconnected',
    )
    await wait(120)
    before = (await rally(page)).heroes
    const mid = await holding(page, ['KeyD'], 400)
    assert.ok(mid.heroes[0].x > before[0].x + 10, 'seat 1 plays on')
    assert.ok(mid.heroes[2].x > before[2].x + 10, 'pad 1 stays with seat 3')
    assert.ok(moved(mid.heroes[3], before[3]) < 0.01, 'seat 4 waits, padless')
    assert.ok(mid.heroes[3].alive && !mid.over)
    // It comes back (pressing down now) and goes to the padless seat, not to seat 3.
    await setPads(page, [{}, null])
    await wait(80)
    await stage(page, spots)
    before = (await rally(page)).heroes
    await setPads(page, [{}, { buttons: [13] }], 'gamepadconnected')
    await wait(400)
    state = await rally(page)
    assert.ok(state.heroes[3].y > before[3].y + 10, 'seat 4 has its pad back')
    assert.ok(moved(state.heroes[2], before[2]) < 0.01, 'seat 3 unmoved')
    await setPads(page, [{}, {}])
    assert.deepEqual(errors, [])
    await context.close()
    summary.push(
      'desktop 4-seat with 2 pads: routing, no co-op stick aim, unplug/replug',
    )
  }

  // 4. Phone, one seat, touch: the d-pad moves the mode menu, A picks, then the aim stick shows and
  //    two thumbs move and aim apart.
  {
    const width = 390
    const height = 844
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width,
      height,
      touch: true,
    })
    await pointer(page, '.cabinet-canvas', 'pointerdown', 9)
    await awaitMenu(page)
    await page.waitForSelector('.cabinet-overlay .cabinet-aim')
    const menuLayout = await controlBoxes(page)
    const dpad = '.cabinet-cluster-1 .cabinet-dpad'
    await pointer(page, dpad, 'pointerdown', 1, 0.5, 0.92)
    await wait(80)
    await pointer(page, dpad, 'pointerup', 1, 0.5, 0.92)
    await wait(90)
    assert.equal(
      (await rally(page)).menu?.cursor,
      1,
      'the d-pad moves the menu',
    )
    await pointer(page, dpad, 'pointerdown', 1, 0.5, 0.08)
    await wait(80)
    await pointer(page, dpad, 'pointerup', 1, 0.5, 0.08)
    await wait(90)
    await tapControl(page, '.cabinet-cluster-1 .cabinet-ball-a', 2)
    assert.equal((await rally(page)).mode, 'campaign', 'A picks')
    const playLayout = await controlBoxes(page)
    assert.deepEqual(
      playLayout,
      menuLayout,
      'the touch layout holds still from the menu into play',
    )
    onScreen(playLayout, width, height, 'phone')

    await stage(page, [{ x: 240, y: 180 }])
    const before = (await rally(page)).heroes[0]
    await pointer(page, dpad, 'pointerdown', 1, 0.92, 0.5)
    await pointer(page, '.cabinet-aim', 'pointerdown', 3, 0.08, 0.5)
    await wait(400)
    const state = await rally(page)
    await pointer(page, dpad, 'pointerup', 1, 0.92, 0.5)
    await pointer(page, '.cabinet-aim', 'pointerup', 3, 0.08, 0.5)
    await wait(90)
    assert.ok(state.heroes[0].x > before.x + 10, 'one thumb moves right')
    assert.ok(
      state.heroes[0].aiming && state.heroes[0].aimX < -0.9,
      'the other aims left',
    )
    assert.ok(state.shots.includes(0), 'and the stick fires')
    assert.equal(
      (await rally(page)).heroes[0].aiming,
      false,
      'thumb up: no aim',
    )
    if (shots)
      await page.screenshot({ path: path.join(shots, 'solo-phone.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('phone solo touch: menu d-pad, aim stick twin-stick')
  }

  // 5. Tablet, four seats, touch: four clusters, no aim stick, four thumbs move four heroes apart.
  {
    const width = 1024
    const height = 768
    const { page, errors, context } = await openCabinet(browser, fixture, {
      slug: SLUG,
      width,
      height,
      touch: true,
      seats: 4,
    })
    await pointer(page, '.cabinet-canvas', 'pointerdown', 9)
    await awaitMenu(page)
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.cabinet-overlay .cabinet-dpad').length ===
        4,
    )
    assert.equal((await rally(page)).heroes.length, 4)
    await tapControl(page, '.cabinet-cluster-1 .cabinet-ball-a', 2)
    assert.equal((await rally(page)).mode, 'campaign', "seat 1's A picks")
    assert.equal(
      await page.locator('.cabinet-aim').count(),
      0,
      'co-op: no aim stick',
    )
    onScreen(await controlBoxes(page), width, height, 'tablet 4P')
    await stage(page, [
      { x: 160, y: 180 },
      { x: 220, y: 180 },
      { x: 280, y: 180 },
      { x: 340, y: 180 },
    ])
    const before = (await rally(page)).heroes
    const pushes = [
      [0.92, 0.5],
      [0.08, 0.5],
      [0.5, 0.92],
      [0.5, 0.08],
    ]
    for (const [seat, [fx, fy]] of pushes.entries())
      await pointer(
        page,
        `.cabinet-cluster-${seat + 1} .cabinet-dpad`,
        'pointerdown',
        21 + seat,
        fx,
        fy,
      )
    await pointer(page, '.cabinet-cluster-2 .cabinet-ball-a', 'pointerdown', 30)
    await wait(400)
    const state = await rally(page)
    for (const [seat, [fx, fy]] of pushes.entries()) {
      await pointer(
        page,
        `.cabinet-cluster-${seat + 1} .cabinet-dpad`,
        'pointerup',
        21 + seat,
        fx,
        fy,
      )
    }
    await pointer(page, '.cabinet-cluster-2 .cabinet-ball-a', 'pointerup', 30)
    const h = state.heroes
    assert.ok(h[0].x > before[0].x + 10, 'seat 1 right')
    assert.ok(h[1].x < before[1].x - 10, 'seat 2 left')
    assert.ok(h[2].y > before[2].y + 10, 'seat 3 down')
    assert.ok(h[3].y < before[3].y - 10, 'seat 4 up')
    assert.ok(
      h.every((hero) => !hero.aiming),
      'every co-op seat aims the way it moves',
    )
    assert.deepEqual([...new Set(state.shots)], [1], "only seat 2's A fired")
    if (shots)
      await page.screenshot({ path: path.join(shots, 'coop-tablet.png') })
    assert.deepEqual(errors, [])
    await context.close()
    summary.push('tablet 4-seat touch: four clusters, four heroes apart')
  }
} finally {
  await browser.close()
}
console.log(`rescue rally cabinet: ok (${summary.join('; ')})`)
