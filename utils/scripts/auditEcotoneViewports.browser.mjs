/**
 * Mounted /play/ecotone viewport audit (weird-humboldt/t-016).
 *
 * Drives the real page in Chromium with engine-reached saves from
 * ecotoneBrowserFixtures.ts (a mid-run save, a finished run, all 84 earned
 * endings, 30 scrapbook pages) across phone, tablet, short-landscape and
 * desktop sizes. On every main tab, the welcome-back title, the beat screen,
 * the end screen and the ending dossier it asserts that the DOCUMENT never
 * scrolls in either direction (long text may only scroll inside bounded
 * panels). It also checks the 84/84 ledger, spoiler-safe locked slots,
 * persistence across reload, keyboard focus on the tab bar, reduced motion
 * and missing-art fallback.
 *
 * Needs a running app (nuxi dev or a deployed build):
 *   ECOTONE_BASE_URL=http://localhost:3000 node utils/scripts/auditEcotoneViewports.browser.mjs
 * Optional: ECOTONE_CHROMIUM=/path/to/chromium, ECOTONE_SHOTS=<dir> for screenshots.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const base = (process.env.ECOTONE_BASE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)
const shots = process.env.ECOTONE_SHOTS || ''
if (shots) mkdirSync(shots, { recursive: true })

const VIEWPORTS = [
  ['phone-320', 320, 568],
  ['phone-375', 375, 667],
  ['phone-390', 390, 844],
  ['tablet-768', 768, 1024],
  ['tablet-820', 820, 1180],
  ['short-1024', 1024, 600],
  ['short-1280', 1280, 720],
  ['desktop-1440', 1440, 900],
  ['desktop-1920', 1920, 1080],
]
const TABS = [
  'Journey',
  'Guides',
  'Map',
  'Journal',
  'Endings',
  'Cases',
  'Settings',
]

const fixtures = JSON.parse(
  execFileSync(
    'npx',
    ['tsx', path.join(root, 'utils/scripts/ecotoneBrowserFixtures.ts')],
    { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  ),
)
assert.equal(fixtures.missing.length, 0, 'fixtures witness all 84 endings')
assert.equal(fixtures.endings.length, 84)

const browser = await chromium.launch(
  process.env.ECOTONE_CHROMIUM
    ? { executablePath: process.env.ECOTONE_CHROMIUM }
    : {},
)

const failures = []
let checks = 0
function check(ok, message) {
  checks += 1
  if (!ok) failures.push(message)
}

async function noDocumentScroll(page, where) {
  // Let late layout (fonts, art, transitions) settle before measuring.
  await page.waitForTimeout(250)
  const m = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return {
      sh: el.scrollHeight,
      sw: el.scrollWidth,
      ih: window.innerHeight,
      iw: window.innerWidth,
    }
  })
  check(
    m.sh <= m.ih + 1 && m.sw <= m.iw + 1,
    `${where}: document scrolls (${m.sw}x${m.sh} in ${m.iw}x${m.ih})`,
  )
}

async function seed(page, storage) {
  await page.goto(`${base}/play/ecotone`, { waitUntil: 'domcontentloaded' })
  await page.evaluate((entries) => {
    window.localStorage.clear()
    for (const [key, value] of Object.entries(entries))
      window.localStorage.setItem(key, JSON.stringify(value))
  }, storage)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await hydrated(page)
}

/** The app shell's ClientOnly placeholder sits over the tab bar until hydration. */
async function hydrated(page) {
  await page.locator('[role=tablist]').first().waitFor({ timeout: 180000 })
  await page
    .getByText('Loading workspace tools...')
    .waitFor({ state: 'detached', timeout: 180000 })
}

async function openTab(page, name) {
  await page.getByRole('tab', { name, exact: true }).click()
}

const full = {
  'kr.ecotone.run.v1': fixtures.midRun,
  'kr.ecotone.endings.v1': fixtures.endings,
  'kr.ecotone.runs.v1': fixtures.scrapbook,
}

for (const [label, width, height] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width, height } })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(180000)

  // 1. A first visit: the title and every tab before any run.
  await seed(page, {})
  await noDocumentScroll(page, `${label} first-visit title`)
  for (const tab of TABS) {
    await openTab(page, tab)
    await noDocumentScroll(page, `${label} first-visit ${tab}`)
  }

  // 2. A returning player with a mid-run save and the full collection.
  await seed(page, full)
  const welcome = page.getByTestId('ecotone-welcome-back')
  check(await welcome.isVisible(), `${label}: welcome-back title shows`)
  await noDocumentScroll(page, `${label} welcome-back`)
  await page.getByTestId('ecotone-welcome-continue').click()
  await noDocumentScroll(page, `${label} beat`)
  for (const tab of TABS) {
    await openTab(page, tab)
    await noDocumentScroll(page, `${label} ${tab}`)
  }
  await openTab(page, 'Endings')
  const slots = page.getByTestId('ecotone-ending-slot')
  check((await slots.count()) === 84, `${label}: 84 ending slots`)
  check(
    (await page
      .locator('[data-testid=ecotone-ending-slot][data-unlocked=true]')
      .count()) === 84,
    `${label}: all 84 earned endings show as earned`,
  )
  await slots.first().click()
  const dossier = page.getByTestId('ecotone-ending-dossier')
  await dossier.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  check(await dossier.isVisible(), `${label}: ending dossier opens`)
  await noDocumentScroll(page, `${label} dossier`)
  if (shots)
    await page.screenshot({ path: path.join(shots, `${label}-dossier.png`) })
  await page.keyboard.press('Escape')
  await dossier.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  check(!(await dossier.isVisible()), `${label}: Escape closes the dossier`)
  await openTab(page, 'Journal')
  check(
    (await page.locator('[data-testid^=ecotone-scrapbook-page-]').count()) ===
      fixtures.scrapbook.length,
    `${label}: every scrapbook page renders`,
  )
  if (shots)
    await page.screenshot({ path: path.join(shots, `${label}-journal.png`) })

  // Persistence: a reload keeps the whole ledger.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await hydrated(page)
  const ledger = await page.evaluate(
    () =>
      JSON.parse(window.localStorage.getItem('kr.ecotone.endings.v1') || '[]')
        .length,
  )
  check(ledger === 84, `${label}: ledger survives reload (${ledger}/84)`)

  // 3. Spoiler safety: with an empty ledger every slot is locked and untitled.
  await seed(page, { 'kr.ecotone.run.v1': fixtures.midRun })
  await openTab(page, 'Endings')
  const locked = await page.$$eval('[data-testid=ecotone-ending-slot]', (els) =>
    els.map((el) => ({
      unlocked: el.getAttribute('data-unlocked'),
      label: el.getAttribute('aria-label') || '',
    })),
  )
  check(locked.length === 84, `${label}: 84 locked slots`)
  check(
    locked.every(
      (slot) => slot.unlocked === 'false' && !slot.label.includes(':'),
    ),
    `${label}: locked slots never name their ending`,
  )

  // 4. The end screen of a finished run.
  await seed(page, { 'kr.ecotone.run.v1': fixtures.finished })
  if (await page.getByTestId('ecotone-welcome-continue').isVisible())
    await page.getByTestId('ecotone-welcome-continue').click()
  await noDocumentScroll(page, `${label} end screen`)
  if (shots)
    await page.screenshot({ path: path.join(shots, `${label}-end.png`) })

  await context.close()
}

// Keyboard: the tab bar is reachable and shows a visible focus ring.
{
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(180000)
  await seed(page, full)
  await page.getByTestId('ecotone-welcome-continue').click()
  let focusedTab = null
  for (let i = 0; i < 80 && !focusedTab; i++) {
    await page.keyboard.press('Tab')
    focusedTab = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el.getAttribute('role') !== 'tab') return null
      const box = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      return {
        inView:
          box.bottom <= innerHeight && box.right <= innerWidth && box.top >= 0,
        outline:
          style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0,
      }
    })
  }
  check(Boolean(focusedTab), 'keyboard: Tab reaches the tab bar')
  check(Boolean(focusedTab?.inView), 'keyboard: the focused tab is on screen')
  check(
    Boolean(focusedTab?.outline),
    'keyboard: the focused tab shows a focus ring',
  )
  await page.keyboard.press('Enter')
  await noDocumentScroll(page, 'keyboard tab switch')
  await context.close()
}

// Reduced motion and missing art: still one screen, nothing broken on show.
for (const [label, width, height] of [VIEWPORTS[2], VIEWPORTS[7]]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
  })
  await context.route(/\/ecotone\/.*\.(webp|png|jpg)$/, (route) =>
    route.abort(),
  )
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(180000)
  await seed(page, full)
  await page.getByTestId('ecotone-welcome-continue').click()
  await noDocumentScroll(page, `${label} reduced-motion + no art beat`)
  for (const tab of ['Guides', 'Endings', 'Journal']) {
    await openTab(page, tab)
    await noDocumentScroll(page, `${label} reduced-motion + no art ${tab}`)
  }
  const broken = await page.$$eval(
    'img',
    (imgs) =>
      imgs.filter((img) => {
        const box = img.getBoundingClientRect()
        return (
          img.complete &&
          img.naturalWidth === 0 &&
          box.width > 0 &&
          box.height > 0 &&
          getComputedStyle(img).visibility !== 'hidden'
        )
      }).length,
  )
  check(
    broken === 0,
    `${label}: ${broken} broken images left on show when art fails`,
  )
  await context.close()
}

await browser.close()
if (failures.length) {
  console.error(
    `Ecotone viewport audit: ${failures.length} of ${checks} checks failed`,
  )
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}
console.log(
  `Ecotone viewport audit: ${checks} checks passed across ${VIEWPORTS.length} viewports (84/84 ledger, ${fixtures.scrapbook.length} scrapbook pages)`,
)
