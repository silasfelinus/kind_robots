import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  reopenCabinet,
  signIn,
  wait,
} from './arcadeCabinetFixture.mjs'

// Superkate's Spectrum account saves across two devices (conductor kr-arcade t-185): two separate
// browser contexts (separate localStorage, like two phones) run the actual ArcadeCabinet and the real
// arcade store's sync code against one mock account API that follows the server's revision rules
// (server/api/arcade/saves/[game].{get,put}.ts: create only when none exists, update only at the
// expected revision, else 409). It checks guest adoption on sign-in, a second device pulling the
// career, a stale device's 409 → refetch → merge (nothing lost on either side), an account switch that
// inherits nothing, and an outage that keeps play on the device and syncs once the server is back.
// Real accounts on the deployed site stay a human check.

const SLUG = 'superkate-spectrum'
const SAVES_KEY = 'kr-arcade-saves'
const ORIGIN = 'http://arcade-cabinet.fixture.test/'

/** The account API: one row per user, as the Prisma model keeps them. */
const rows = new Map()
let outage = false
const log = []
async function accountApi(route) {
  const request = route.request()
  const auth = request.headers().authorization ?? ''
  const user = Number(auth.replace('Bearer token-', ''))
  const reply = (status, body) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  if (outage) return reply(503, { success: false, message: 'down' })
  if (!Number.isSafeInteger(user) || user <= 0)
    return reply(401, { success: false, message: 'Sign in to sync Arcade.' })
  if (request.method() === 'GET') {
    log.push(`GET ${user}`)
    const row = rows.get(user)
    return reply(200, {
      success: true,
      data: row
        ? { save: JSON.parse(row.payload), revision: row.revision }
        : null,
    })
  }
  const input = request.postDataJSON()
  const row = rows.get(user)
  if (input.expectedRevision === null) {
    if (row) {
      log.push(`PUT ${user} 409`)
      return reply(409, { success: false, message: 'newer' })
    }
    rows.set(user, { payload: JSON.stringify(input.save), revision: 0 })
    log.push(`PUT ${user} r0`)
    return reply(200, { success: true, data: { revision: 0 } })
  }
  if (!row || row.revision !== input.expectedRevision) {
    log.push(`PUT ${user} 409`)
    return reply(409, { success: false, message: 'newer' })
  }
  row.payload = JSON.stringify(input.save)
  row.revision++
  log.push(`PUT ${user} r${row.revision}`)
  return reply(200, { success: true, data: { revision: row.revision } })
}
const routes = [
  [new RegExp(`^${ORIGIN}api/arcade/saves/superkate-spectrum$`), accountApi],
]
const account = (user) => rows.get(user) && JSON.parse(rows.get(user).payload)

const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox'],
})

const game = (page) =>
  page.evaluate(() => {
    const game = (window.__spectrums ?? [])
      .filter((entry) => !entry.demo)
      .at(-1)?.game
    return game
      ? {
          highest: game.career.highestStage,
          stars: [...game.career.stars],
          status: game.saveStatus,
        }
      : null
  })
const cloudStatus = (page) =>
  page.evaluate(
    () =>
      window.__app.config.globalProperties.$pinia._s.get('arcadeStore')
        .spectrumCloudStatus,
  )
async function start(page) {
  const before = await page.evaluate(
    () => (window.__spectrums ?? []).filter((entry) => !entry.demo).length,
  )
  await page.keyboard.press('Enter')
  await page.waitForFunction(
    (n) => (window.__spectrums ?? []).filter((entry) => !entry.demo).length > n,
    before,
  )
  await wait(300)
  return game(page)
}
/** Settle until the store's sync is no longer in flight. */
async function settled(page) {
  await page.waitForFunction(() => {
    const status =
      window.__app.config.globalProperties.$pinia._s.get(
        'arcadeStore',
      ).spectrumCloudStatus
    return status !== 'checking' && status !== 'saving'
  })
  await wait(100)
  return cloudStatus(page)
}
/** Clear story stage `stage` through the game (its board finished), as a played clear would. */
const clear = (page, stage, shots = 8) =>
  page.evaluate(
    ({ stage, shots }) => {
      const game = (window.__spectrums ?? [])
        .filter((entry) => !entry.demo)
        .at(-1).game
      game.menuStage = stage
      game.beginRun()
      game.shotsThisBoard = shots
      game.completeBoard()
    },
    { stage, shots },
  )

const guestCareer = {
  version: 2,
  career: {
    xp: 900,
    highestStage: 6,
    stars: Array.from({ length: 30 }, (_, i) => (i < 5 ? 2 : 0)),
    lifetimePops: 120,
    classicBest: 0,
    classicRuns: 0,
  },
  mode: 'story',
  stage: 6,
  style: 'glass',
  settings: {
    aimGuide: true,
    particles: true,
    highContrast: false,
    music: true,
    effects: true,
  },
}

const opened = []
try {
  // 1. Phone A: a guest career, then the player signs in. The guest progress is adopted and uploaded.
  const a = await openCabinet(browser, fixture, {
    slug: SLUG,
    width: 390,
    height: 844,
    routes,
    storage: { [SAVES_KEY]: { [SLUG]: guestCareer } },
  })
  opened.push(a.context)
  let state = await start(a.page)
  assert.equal(state.highest, 6, 'the guest career plays on the device')
  assert.equal(
    state.status,
    'local',
    'a guest is told the career is on this device',
  )
  await signIn(a.page, { id: 7, token: 'token-7' })
  await reopenCabinet(a.page, fixture, { slug: SLUG })
  assert.equal(await settled(a.page), 'synced')
  state = await start(a.page)
  assert.equal(state.highest, 6, 'signing in keeps the guest career')
  assert.equal(state.status, 'synced', 'and the hub says it is synced')
  assert.equal(account(7)?.career.highestStage, 6, 'the account received it')

  // 2. Phone B, a fresh device, signs in to the same account and finds the career.
  const b = await openCabinet(browser, fixture, {
    slug: SLUG,
    width: 768,
    height: 1024,
    routes,
    account: { id: 7, token: 'token-7' },
  })
  opened.push(b.context)
  assert.equal(await settled(b.page), 'synced')
  state = await start(b.page)
  assert.equal(state.highest, 6, 'the second device pulls the account career')
  assert.deepEqual(state.stars.slice(0, 5), [2, 2, 2, 2, 2])

  // 3. B clears stage 6; A, still on its older revision, replays stage 1 for three stars.
  await clear(b.page, 6)
  assert.equal(await settled(b.page), 'synced')
  assert.equal(
    account(7).career.highestStage,
    7,
    "B's clear reached the account",
  )
  await clear(a.page, 1, 4)
  assert.equal(await settled(a.page), 'synced')
  assert.ok(
    log.includes('PUT 7 409'),
    'the stale device hit a revision conflict',
  )
  const merged = account(7).career
  assert.equal(merged.highestStage, 7, "the conflict kept B's unlocked stage")
  assert.equal(merged.stars[0], 3, "and A's new three stars")
  assert.equal(merged.stars[5], 3, "and B's stage-6 medal")
  await reopenCabinet(a.page, fixture, { slug: SLUG })
  assert.equal(await settled(a.page), 'synced')
  state = await start(a.page)
  assert.equal(state.highest, 7, 'A now shows the merged career')
  assert.equal(state.stars[0], 3)

  // 4. A different player signs in on phone A: nothing of player 7's career carries over.
  await signIn(a.page, { id: 8, token: 'token-8' })
  await reopenCabinet(a.page, fixture, { slug: SLUG })
  assert.equal(await settled(a.page), 'synced')
  state = await start(a.page)
  assert.equal(state.highest, 1, 'a second account starts its own career')
  assert.ok(
    state.stars.every((n) => n === 0),
    "and inherits none of player 7's stars",
  )
  assert.equal(
    account(7).career.highestStage,
    7,
    "player 7's account is untouched",
  )
  // Player 7 signs back in: their own device copy and account return.
  await signIn(a.page, { id: 7, token: 'token-7' })
  await reopenCabinet(a.page, fixture, { slug: SLUG })
  assert.equal(await settled(a.page), 'synced')
  assert.equal(
    (await start(a.page)).highest,
    7,
    'player 7 gets their career back',
  )

  // 5. An outage: B keeps playing on the device, says so, and syncs once the server is back.
  outage = true
  await reopenCabinet(b.page, fixture, { slug: SLUG })
  assert.equal(await settled(b.page), 'offline')
  state = await start(b.page)
  assert.equal(
    state.status,
    'offline',
    'the hub says the career is saved on the device',
  )
  assert.equal(state.highest, 7, 'the device copy still plays')
  await clear(b.page, 7)
  assert.equal((await game(b.page)).highest, 8, 'progress continues offline')
  outage = false
  await reopenCabinet(b.page, fixture, { slug: SLUG })
  assert.equal(await settled(b.page), 'synced')
  assert.equal(
    account(7).career.highestStage,
    8,
    'the offline clear reached the account',
  )
  for (const { errors } of [a, b]) assert.deepEqual(errors, [])
  console.log(
    `Spectrum accounts: guest adoption, second device, 409 merge, account switch and outage passed (${log.length} API calls)`,
  )
} finally {
  for (const context of opened) await context.close()
  await browser.close()
}
