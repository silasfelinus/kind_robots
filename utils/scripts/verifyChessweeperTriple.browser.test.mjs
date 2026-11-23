// Triple Threat browser acceptance: one horizontal 1x3 stage, concurrent
// chess, mines and disc survival, timer, modal controls and global score API.
// The existing Chessweeper campaign playthrough covers Classic separately.
import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { startServer } from './chessweeperPlaythroughHarness.mjs'

const env = process.env
const shots = env.CHESSWEEPER_SHOTS || ''
if (shots) mkdirSync(shots, { recursive: true })
const server = await startServer({
  artOrigin: env.CHESSWEEPER_ART_ORIGIN || '',
})
const browser = await chromium.launch(
  env.CHESSWEEPER_CHROMIUM ? { executablePath: env.CHESSWEEPER_CHROMIUM } : {},
)
const errors = []

async function screenshot(page, name) {
  if (shots) {
    await page.screenshot({
      path: join(shots, name + '.png'),
      fullPage: false,
    })
  }
}

async function openAt(width) {
  const page = await browser.newPage({
    viewport: { width, height: width <= 390 ? 700 : 770 },
    hasTouch: width <= 390,
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.clock.install()
  if (width === 1440) {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test.header.signature')
    })
  }
  const submissions = []
  const authorizations = []
  const scoreQueries = []
  await page.route('**/api/arcade/scores**', async (route) => {
    const req = route.request()
    if (req.method() === 'POST') {
      submissions.push(req.postDataJSON())
      authorizations.push(req.headers().authorization || '')
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 1, rank: 2 },
          statusCode: 201,
        }),
      })
      return
    }
    scoreQueries.push(new URL(req.url()).pathname)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 1,
            initials: 'AAA',
            username: 'TestPilot',
            score: 900,
            level: 2,
            createdAt: '2026-11-23T06:00:00Z',
          },
        ],
      }),
    })
  })
  await page.goto(server.origin + '/chessweeper/triple.html')
  await page.waitForFunction(() => !!window.__chessweeperTriple)
  return { page, submissions, authorizations, scoreQueries }
}

try {
  for (const width of [390, 768, 1440]) {
    const { page, submissions, authorizations, scoreQueries } =
      await openAt(width)
    const bracket = width === 390 ? 'easy' : width === 768 ? 'hard' : 'medium'
    const slug =
      bracket === 'medium'
        ? 'chessweeper-triple'
        : 'chessweeper-triple-' + bracket
    const expected = {
      easy: { hearts: 5, mineCount: 6, discCount: 2, cpuChoices: 7 },
      medium: { hearts: 3, mineCount: 10, discCount: 3, cpuChoices: 3 },
      hard: { hearts: 2, mineCount: 15, discCount: 4, cpuChoices: 2 },
    }[bracket]
    assert.equal(
      await page.locator('.play-panel').count(),
      3,
      'exactly three game panes',
    )
    const boxes = await page.locator('.play-panel').evaluateAll((elements) =>
      elements.map((el) => {
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, right: r.right, bottom: r.bottom }
      }),
    )
    assert.ok(
      boxes[0].right <= boxes[1].x && boxes[1].right <= boxes[2].x,
      width + 'px: three panels stay in one horizontal row',
    )
    assert.ok(
      boxes.every((box) => box.y === boxes[0].y),
      width + 'px: no stacked panels',
    )
    const viewport = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }))
    assert.ok(
      viewport.scrollWidth <= viewport.clientWidth + 1 &&
        viewport.scrollHeight <= viewport.clientHeight + 1,
      width + 'px: no document scrolling',
    )
    assert.equal(
      await page.locator('#dialog').isVisible(),
      true,
      'title and settings are shown before play',
    )
    await screenshot(page, 'triple-' + width + '-intro')
    await page.selectOption('#duration', '120')
    await page.selectOption('#difficulty', bracket)
    assert.match(
      await page.locator('#difficulty-hint').innerText(),
      new RegExp(bracket, 'i'),
      'difficulty hint is reactive',
    )
    await page.click('#start')
    assert.equal(
      await page.locator('#dialog').isVisible(),
      false,
      'title and settings are absent during play',
    )
    const beginning = await page.evaluate(() =>
      window.__chessweeperTriple.snapshot(),
    )
    assert.equal(beginning.difficulty, bracket)
    assert.equal(beginning.maxHearts, expected.hearts)
    assert.equal(beginning.hearts, expected.hearts)
    assert.equal(beginning.mineCount, expected.mineCount)
    assert.equal(beginning.discCount, expected.discCount)
    assert.equal(beginning.cpuChoices, expected.cpuChoices)
    assert.equal(await page.locator('#chess-board button').count(), 64)
    assert.equal(await page.locator('#mine-board button').count(), 64)
    await screenshot(page, 'triple-' + width + '-playing')

    await page.locator('#mine-board button').nth(0).click()
    const revealed = await page.evaluate(
      () => window.__chessweeperTriple.snapshot().mineOpened,
    )
    assert.ok(revealed >= 1, 'Minesweeper reveals real cells')

    await page.getByRole('button', { name: 'e2 white pawn' }).click()
    await page.getByRole('button', { name: 'e4 empty' }).click()
    const moved = await page.evaluate(
      () => window.__chessweeperTriple.snapshot().chessMoves,
    )
    assert.equal(moved, 1, 'legal chess move applied')
    await page.clock.runFor(350)

    const before = await page.evaluate(() =>
      window.__chessweeperTriple.snapshot(),
    )
    await page.keyboard.down('d')
    await page.clock.runFor(400)
    await page.keyboard.up('d')
    const after = await page.evaluate(() =>
      window.__chessweeperTriple.snapshot(),
    )
    assert.ok(
      after.discX > before.discX,
      'WASD moves in the survival arena while other games exist',
    )
    assert.ok(
      after.remaining < before.remaining,
      'single shared clock advances during every panel',
    )

    await page.click('#rankings')
    assert.equal(
      await page.locator('#scores-view').isVisible(),
      true,
      'global scores are accessible from bottom HUD',
    )
    assert.equal(await page.locator('#score-difficulty').inputValue(), bracket)
    await page.locator('#score-rows').getByText(/AAA/).waitFor()
    assert.ok(
      scoreQueries.some((q) => q.endsWith('/' + slug)),
      'each difficulty reads its own global leaderboard',
    )
    const catResponse = page.waitForResponse((response) =>
      response.url().includes('/chessweeper-triple-catastrophic?range=all'),
    )
    await page.selectOption('#score-difficulty', 'catastrophic')
    await catResponse
    assert.ok(
      scoreQueries.some((q) => q.endsWith('/chessweeper-triple-catastrophic')),
      'catastrophic has its own global leaderboard',
    )
    await page.selectOption('#score-difficulty', bracket)
    await page.locator('#score-rows').getByText(/AAA/).waitFor()
    assert.match(await page.locator('#score-rows').innerText(), /AAA/)
    assert.match(await page.locator('#score-rows').innerText(), /TestPilot/)
    await page.click('#today')
    await page.click('#close-scores')
    assert.equal(await page.locator('#pause-view').isVisible(), true)
    await page.click('#resume')
    assert.equal(
      await page.locator('#dialog').isVisible(),
      false,
      'player can resume after checking rankings',
    )

    await page.clock.fastForward(125_000)
    await page.clock.runFor(50)
    const complete = await page.evaluate(() =>
      window.__chessweeperTriple.snapshot(),
    )
    assert.equal(complete.phase, 'end', 'the shared clock ends the run')
    assert.ok(complete.final > 0, 'completed run earns points')
    await page.fill('#initials', 'kR7')
    await page.click('#submit')
    await page.waitForFunction(() =>
      /Rank #2/.test(
        document.getElementById('submit-status')?.textContent || '',
      ),
    )
    assert.match(await page.locator('#submit-status').innerText(), /Rank #2/)
    assert.equal(submissions.length, 1, 'one score submission per run')
    assert.equal(submissions[0].game, slug)
    assert.equal(submissions[0].initials, 'KR7')
    assert.equal(submissions[0].score, complete.final)
    assert.equal(
      authorizations[0],
      width === 1440 ? 'Bearer test.header.signature' : '',
      'signed-in sessions are attributed by Authorization while guests are not',
    )
    await page.close()
    console.log(
      '[triple] ' + width + 'px: input, stage, timer and scores passed',
    )
  }
  const { page: catastrophe } = await openAt(1440)
  await catastrophe.selectOption('#difficulty', 'catastrophic')
  await catastrophe.click('#start')
  const cata = await catastrophe.evaluate(() =>
    window.__chessweeperTriple.snapshot(),
  )
  assert.equal(cata.maxHearts, 1)
  assert.equal(cata.mineCount, 20)
  assert.equal(cata.discCount, 6)
  assert.equal(cata.cpuChoices, 1)
  assert.ok(cata.discSpeed > 1.5)
  assert.match(
    await catastrophe.locator('#difficulty-badge').innerText(),
    /CATA/,
  )
  await screenshot(catastrophe, 'triple-1440-catastrophic')
  await catastrophe.close()
  const { page: practice, submissions: practiceSubmissions } = await openAt(390)
  await practice.selectOption('#duration', '60')
  await practice.selectOption('#difficulty', 'easy')
  await practice.click('#start')
  await practice.locator('#mine-board button').nth(0).click()
  await practice.clock.fastForward(65_000)
  await practice.clock.runFor(50)
  assert.equal(
    await practice.locator('#submit').isDisabled(),
    true,
    'Blitz practice cannot submit ranked global scores',
  )
  assert.equal(practiceSubmissions.length, 0)
  await practice.close()
  assert.deepEqual(errors, [], 'no browser exceptions')
  console.log(
    '[triple] four difficulties, ranked brackets and 3 viewports passed',
  )
} finally {
  await browser.close()
  await server.close()
}
