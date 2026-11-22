import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

const endingsJs = read('../../public/chessweeper/endings.js')
const page = read('../../public/chessweeper/index.html')
const progression = read('../../public/chessweeper/progression.js')
const campaign = read('../../public/chessweeper/campaign.js')
const effects = read('../../public/chessweeper/visual-effects.js')
const manifest = JSON.parse(read('../../public/chessweeper/art-pack.json')) as {
  delivered: Array<{ path: string; artJobId: number }>
  requested: Array<{ path: string; status: string }>
}

type Ending = { id: string; title: string; hint: string; prose: string[] }
type World = 'sugar' | 'ashen' | 'jackpot'
type Api = {
  CATALOG: Record<World, Ending[]>
  ORDER: string[]
  PACT_LINES: Record<World, [string, string]>
  FINALE_LINES: Record<World, { win: string; lose: string }>
  classify: (type: string, reason: string) => string
  plate: (world: string, id: string) => string
  consequence: (context: Record<string, unknown>) => string[]
  total: () => number
}
const sandbox: { window: Record<string, unknown> } = {
  window: { addEventListener: () => {} },
}
runInNewContext(endingsJs, { ...sandbox, document: {} })
const api = sandbox.window.ChessweeperEndings as Api
assert.ok(api, 'endings.js exposes window.ChessweeperEndings')

const worlds: World[] = ['sugar', 'ashen', 'jackpot']
assert.deepEqual(Object.keys(api.CATALOG), worlds)
assert.equal(api.total(), 12, 'twelve endings in total')
const titles = new Set<string>()
for (const world of worlds) {
  const endings = api.CATALOG[world]
  assert.deepEqual(
    Array.from(endings, (e) => e.id),
    ['mate', 'sweep', 'arena', 'fallen'],
    `${world}: four distinct ending routes`,
  )
  for (const ending of endings) {
    assert.ok(!titles.has(ending.title), `unique title ${ending.title}`)
    titles.add(ending.title)
    assert.ok(ending.prose.length >= 2, `${ending.title}: two-paragraph scene`)
    const words = ending.prose.join(' ').split(/\s+/).length
    assert.ok(words >= 55, `${ending.title}: authored scene, not a caption`)
    assert.ok(ending.hint.length > 12, `${ending.title}: non-spoiler hint`)
    assert.ok(
      !ending.hint.includes(ending.title),
      `${ending.title}: hint does not reveal the title`,
    )
    const plate = api.plate(world, ending.id)
    assert.equal(plate, `/images/chessweeper/ending-${world}-${ending.id}.webp`)
    assert.ok(
      manifest.requested.some((r) => r.path === 'public' + plate) ||
        manifest.delivered.some((r) => r.path === 'public' + plate),
      `${ending.title}: plate is tracked in art-pack.json`,
    )
  }
  assert.equal(api.PACT_LINES[world].length, 2, `${world}: both pact branches`)
  assert.ok(api.FINALE_LINES[world].win.startsWith('CAMPAIGN COMPLETE'))
}

// Classification uses the engine's real end reasons, taken from index.html.
const reason = (pattern: RegExp) => {
  const match = page.match(pattern)
  assert.ok(match, `index.html still emits ${pattern}`)
  return match?.[1] ?? ''
}
const sweepReason = reason(/'(You cleared every safe square[^']*)'/)
const arenaReason = reason(/'(The enemy king was destroyed by the arena\.)'/)
const lossReason = reason(/'(Your king ran out of armor\.)'/)
assert.equal(api.classify('win', sweepReason), 'sweep')
assert.equal(api.classify('win', arenaReason), 'arena')
assert.equal(api.classify('win', 'White wins by checkmate.'), 'mate')
assert.equal(api.classify('loss', 'Black wins by checkmate.'), 'fallen')
assert.equal(api.classify('loss', lossReason), 'fallen')
assert.equal(api.classify('draw', 'Stalemate.'), 'fallen')

// Narrative branches: the pact and the finale chapter change the epilogue.
const base = {
  world: 'ashen',
  type: 'win',
  state: { hp: { 1: 2 }, turns: 14, score: 300, lastStandUsed: true },
}
const vigil = api.consequence({ ...base, campaign: { chapter: 1, pact: 0 } })
const oath = api.consequence({ ...base, campaign: { chapter: 1, pact: 1 } })
assert.ok(vigil.includes(api.PACT_LINES.ashen[0]))
assert.ok(oath.includes(api.PACT_LINES.ashen[1]))
assert.ok(vigil.some((line) => line.includes('Last Stand')))
const finale = api.consequence({ ...base, campaign: { chapter: 3, pact: 0 } })
assert.ok(finale.includes(api.FINALE_LINES.ashen.win), 'finale epilogue')
const lostFinale = api.consequence({
  ...base,
  type: 'loss',
  campaign: { chapter: 3, pact: 0 },
})
assert.ok(lostFinale.includes(api.FINALE_LINES.ashen.lose))
const draw = api.consequence({ world: 'sugar', type: 'draw', state: {} })
assert.ok(
  draw.some((line) => line.includes('draw')),
  'draws are explained',
)

// Wiring: load order, scrapbook reuse, achievements and campaign events.
const at = (file: string) => page.indexOf(`/chessweeper/${file}`)
const endingsAt = at('endings.js')
const progressionAt = at('progression.js')
assert.ok(endingsAt > 0 && endingsAt < progressionAt)
assert.ok(progressionAt < at('campaign.js'))
assert.ok(page.includes('/chessweeper/endings.css'))
assert.ok(progression.includes('window.ChessweeperEndings'))
assert.ok(
  !/(?<!\$)\$\('/.test(progression),
  'progression.js never calls the page-private $ helper',
)
assert.ok(campaign.includes("'chessweeper:campaign-cleared'"))
for (const id of [
  'checkmate',
  'cartographer',
  'arena',
  'scrapbook',
  'campaign-sugar',
  'campaign-ashen',
  'campaign-jackpot',
  'mastery',
])
  assert.ok(progression.includes(`'${id}'`), `achievement ${id} defined`)
assert.ok(progression.includes('CW1.'), 'device transfer codes')
assert.ok(
  progression.includes('whether you play as a guest or signed in'),
  'explicit guest/device save semantics',
)

// Phone layout: the operations console survives the campaign panel prepend.
assert.ok(page.includes('class="box ops"'))
assert.ok(!page.includes('.panel .box:not(:first-child)'))

// Painted special-action plates are wired to the signature moves.
for (const delivered of manifest.delivered.filter((d) =>
  d.path.includes('action-scene'),
)) {
  assert.ok(delivered.artJobId > 0)
  assert.ok(effects.includes(delivered.path.replace('public', '')))
}
console.log('chessweeper endings, branches and wiring: ok')
