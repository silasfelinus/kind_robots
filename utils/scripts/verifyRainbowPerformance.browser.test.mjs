import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  bundleCabinetFixture,
  openCabinet,
  startRainbowRun,
  wait,
} from './arcadeCabinetFixture.mjs'

// Conductor rainbow t-013 (campaign QA, gap-matrix item 22): frame time in the actual cabinet in Chromium, four
// pilots, in a boss phase. The run is fast-forwarded into Act I's boss fight, then the real engine's update and
// render are timed frame by frame on the cabinet's own canvas, and the browser's frame pacing and JS heap are
// sampled. Headless software rendering is slower than a player's GPU, so the budgets are a ceiling, not a target.

const SLUG = 'rainbow-bullet-hell-space-princess'
// The real arcade store and served art, so the boss fight draws its actual paintings.
const fixture = await bundleCabinetFixture({ realArcadeStore: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const pct = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[
    Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  ]
}
let report
try {
  const { page, context, errors } = await openCabinet(browser, fixture, {
    slug: SLUG,
    width: 1280,
    height: 800,
    seats: 4,
    serveArt: true,
  })
  try {
    await startRainbowRun(page)
    await page.waitForFunction(
      () => document.querySelectorAll('.cabinet-dpad').length >= 0,
    )
    // Fast-forward into the boss fight with the real engine (no input: the run keeps flying).
    const reached = await page.evaluate(() => {
      const entry = (window.__games ?? []).filter((e) => !e.demo).at(-1)
      const game = entry.game
      const none = { held: {}, pressed: {} }
      // Seat all four pilots in the running game (the engine's live seat change).
      game.setPlayers?.(4)
      for (let i = 0; i < 40000 && !game.snapshot.boss; i++) {
        game.update(none)
        for (const ship of game.snapshot.ships) void ship
      }
      return {
        boss: Boolean(game.snapshot.boss),
        act: game.snapshot.act,
        players: game.snapshot.activePlayers,
      }
    })
    assert.ok(reached.boss, `reached a boss phase (${reached.act})`)
    assert.equal(reached.players, 4, 'four pilots fly')
    // Engine cost per frame: update and render on the cabinet's own canvas.
    const work = await page.evaluate(() => {
      const entry = (window.__games ?? []).filter((e) => !e.demo).at(-1)
      const game = entry.game
      const canvas = document.querySelector('.cabinet-canvas')
      const g = canvas.getContext('2d')
      const none = { held: {}, pressed: {} }
      const times = []
      for (let i = 0; i < 600; i++) {
        const start = performance.now()
        game.update(none)
        game.render(g)
        times.push(performance.now() - start)
      }
      return { times, boss: Boolean(game.snapshot.boss) }
    })
    // Browser pacing while the cabinet runs on its own.
    const pacing = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const deltas = []
          let last = performance.now()
          const tick = (now) => {
            deltas.push(now - last)
            last = now
            if (deltas.length < 240) requestAnimationFrame(tick)
            else resolve(deltas.slice(5))
          }
          requestAnimationFrame(tick)
        }),
    )
    const heap = await page.evaluate(
      () => performance.memory?.usedJSHeapSize ?? null,
    )
    await wait(50)
    report = {
      viewport: '1280x800',
      seats: 4,
      phase: `${reached.act} boss`,
      engineMs: {
        p50: +pct(work.times, 50).toFixed(2),
        p95: +pct(work.times, 95).toFixed(2),
        max: +Math.max(...work.times).toFixed(2),
      },
      frameMs: {
        p50: +pct(pacing, 50).toFixed(2),
        p95: +pct(pacing, 95).toFixed(2),
      },
      heapMb: heap === null ? null : +(heap / 1048576).toFixed(1),
    }
    assert.ok(report.engineMs.p50 < 12, `engine p50 ${report.engineMs.p50} ms`)
    assert.ok(report.engineMs.p95 < 25, `engine p95 ${report.engineMs.p95} ms`)
    assert.ok(
      report.frameMs.p95 < 50,
      `frame pacing p95 ${report.frameMs.p95} ms`,
    )
    assert.ok(
      report.heapMb === null || report.heapMb < 400,
      `heap ${report.heapMb} MB`,
    )
    assert.deepEqual(errors, [], 'no uncaught browser exceptions')
  } finally {
    await context.close()
  }
} finally {
  await browser.close()
}
if (process.env.RAINBOW_PERF_REPORT) {
  mkdirSync(path.dirname(process.env.RAINBOW_PERF_REPORT), { recursive: true })
  writeFileSync(
    process.env.RAINBOW_PERF_REPORT,
    JSON.stringify(report, null, 2),
  )
}
console.log(`rainbow performance: ok ${JSON.stringify(report)}`)
