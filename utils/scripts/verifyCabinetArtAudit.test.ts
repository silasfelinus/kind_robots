import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { auditArcadeArt } from './lib/arcadeArtAudit'

const root = mkdtempSync(path.join(os.tmpdir(), 'kr-arcade-art-audit-'))
try {
  const arcade = path.join(root, 'utils/arcade')
  mkdirSync(path.join(arcade, 'games'), { recursive: true })
  writeFileSync(
    path.join(arcade, 'games.ts'),
    `
    const LOADERS = {
      alpha: () => import('./games/alpha'),
      beta: () => import('./games/beta'),
      fallback: () => true ? import('./games/alpha') : import('./games/beta'),
    }
  `,
  )
  writeFileSync(
    path.join(arcade, 'painted.ts'),
    `
    export const heroPath = '/images/arcade/alpha/hero.webp'
  `,
  )
  writeFileSync(
    path.join(arcade, 'snes.ts'),
    'export const pixelSprite = () => null',
  )
  writeFileSync(
    path.join(arcade, 'barrel.ts'),
    "export { heroPath } from './painted'",
  )
  writeFileSync(
    path.join(arcade, 'games/alpha.ts'),
    `
    import { heroPath as paintedHero } from '../barrel'
    import { pixelSprite as sprite } from '../snes'
    import { secondary } from './beta'
    const hero = sprite(['XX'])
    function drawHero(g) { g.fillRect(0, 0, 2, 2); g.drawImage(paintedHero, 0, 0) }
    function drawBoss(g) { g.arc(1, 1, 1, 0, 6) }
    function drawHud(g) { g.fillRect(0, 0, 2, 2) }
    const comment = 'pixelSprite(fake)'
    // function phantom(g) { g.fillRect(0, 0, 2, 2) }
  `,
  )
  writeFileSync(
    path.join(arcade, 'games/beta.ts'),
    [
      "import { hero } from './alpha'",
      'export function secondary(g) { g.ellipse(1, 1, 1, 1, 0, 0, 6) }',
      'const atlas = `/images/arcade/beta/${color}.webp`',
      'function drawOrb(g) { g.fillRect(0, 0, 2, 2); g.drawImage(atlas, 0, 0) }',
    ].join('\n'),
  )
  const report = auditArcadeArt(root, [
    {
      id: 'unrelated-title',
      image_path: 'public/images/arcade/alpha/title.webp',
    },
    {
      id: 'hero',
      source_url: '/images/arcade/alpha/hero.webp',
      last_art_job_id: 42,
      status: 'pending',
    },
    {
      id: 'orb',
      image_path: 'public/images/arcade/beta/red.webp',
      last_art_job_id: 43,
    },
    {
      id: 'nested-title',
      image_path: 'public/images/arcade/beta/other/title.webp',
    },
    {
      id: 'other-repo',
      image_path: 'public/images/arcade/alpha/hero.webp',
      target_repo: 'elsewhere/repo',
    },
  ])
  assert.deepEqual(report.games, ['alpha', 'beta', 'fallback'])
  const find = (game: string, symbol: string) =>
    report.sites.find((site) => site.game === game && site.symbol === symbol)!
  assert.deepEqual(
    find('alpha', 'drawHero').requests.map((request) => request.id),
    ['hero'],
  )
  assert.equal(find('alpha', 'drawHero').requests[0]!.jobId, 42)
  assert.equal(find('alpha', 'drawBoss').requests.length, 0)
  assert.equal(find('alpha', 'hero').requests.length, 0)
  assert.deepEqual(
    find('beta', 'drawOrb').requests.map((request) => request.id),
    ['orb'],
  )
  assert.ok(find('alpha', 'secondary'))
  assert.ok(find('fallback', 'drawHero'))
  assert.equal(find('alpha', 'drawHud').functionalUiCandidate, true)
  assert.equal(
    report.sites.some((site) => /phantom|comment/.test(site.symbol)),
    false,
  )
  assert.equal(
    report.sites.some((site) =>
      site.requests.some((request) => request.id === 'unrelated-title'),
    ),
    false,
  )
  assert.equal(
    report.sites.some((site) =>
      site.requests.some((request) => request.id === 'nested-title'),
    ),
    false,
  )
  assert.ok(
    report.sites.every((site) => site.line > 0 && !site.source.includes('\\')),
  )
  console.log(
    'Arcade art audit: import cycles, both loader branches, alias paths, templates, missing requests and functional-UI labels verified',
  )
} finally {
  rmSync(root, { recursive: true, force: true })
}
