import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const js = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/campaign.js', import.meta.url),
  ),
  'utf8',
)
type State = {
  turns: number
  over: boolean
  hp: Record<number, number>
  score: number
  discs: Array<{ active: boolean }>
}
const fresh = (): State => ({
  turns: 0,
  over: false,
  hp: { 1: 4 },
  score: 0,
  discs: Array.from({ length: 4 }, (_, i) => ({ active: i < 2 })),
})
let state = fresh()
const callbacks = new Map<
  string,
  (event: { detail?: { type: string } }) => void
>()
const nodes = new Map<string, { textContent: string; hidden: boolean }>()
const button = {
  textContent: '',
  hidden: true,
  addEventListener: (_type: string, action: () => void) => {
    callbacks.set('next', action)
  },
}
nodes.set('next', button)
const world = { dataset: { realm: 'sugar' } }
const values = new Map<string, string>()
const fakeDocument = {
  documentElement: world,
  createElement: () => ({
    className: '',
    innerHTML: '',
    setAttribute: () => {},
    querySelector: (selector: string) => {
      const key = selector.match(/data-campaign-([^\]]+)/)?.[1] || ''
      if (!nodes.has(key)) nodes.set(key, { textContent: '', hidden: true })
      return nodes.get(key)
    },
  }),
  querySelector: () => ({ prepend: () => {} }),
}
const engine = {
  get: () => state,
  refresh: () => callbacks.get('chessweeper:state')?.({}),
  reset: () => {
    state = fresh()
    callbacks.get('chessweeper:state')?.({})
  },
}
const windowObject: Record<string, unknown> = {
  __fusionTest: engine,
  addEventListener: (
    name: string,
    fn: (event: { detail?: { type: string } }) => void,
  ) => callbacks.set(name, fn),
}
runInNewContext(js, {
  document: fakeDocument,
  window: windowObject,
  localStorage: {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
})
type Campaign = {
  current: (world: string) => { chapter: number; cleared: boolean }
  worldCount: number
  chapters: (world: string) => number
}
const campaign = windowObject.__chessweeperCampaign as Campaign
assert.equal(campaign.worldCount, 3)
for (const w of ['sugar', 'ashen', 'jackpot']) {
  assert.equal(campaign.chapters(w), 4)
}
assert.equal(state.hp[1], 5, 'first candy chapter grants armor')
state.over = true
callbacks.get('chessweeper:end')?.({ detail: { type: 'win' } })
assert.equal(campaign.current('sugar').chapter, 1)
callbacks.get('chessweeper:end')?.({ detail: { type: 'win' } })
assert.equal(campaign.current('sugar').chapter, 1, 'win counted once')
callbacks.get('next')?.({})
assert.equal(state.discs[2]!.active, true, 'second candy chapter adds a blade')
for (let i = 0; i < 3; i++) {
  state.over = true
  callbacks.get('chessweeper:end')?.({ detail: { type: 'win' } })
  if (i < 2) callbacks.get('next')?.({})
}
assert.equal(
  campaign.current('sugar').cleared,
  true,
  'four earned stages clear world',
)
assert.equal(campaign.current('sugar').chapter, 3)
world.dataset.realm = 'ashen'
state = fresh()
callbacks.get('chessweeper:state')?.({})
assert.equal(campaign.current('ashen').chapter, 0, 'world progress isolated')
assert.equal(state.discs[2]!.active, true, 'ashen starts dangerous')
state.over = true
callbacks.get('chessweeper:end')?.({ detail: { type: 'loss' } })
assert.equal(campaign.current('ashen').chapter, 0, 'loss does not advance')
world.dataset.realm = 'jackpot'
state = fresh()
callbacks.get('chessweeper:state')?.({})
assert.equal(state.score, 50, 'casino opens with real wager chips')
assert.ok(values.has('kindrobots:chessweeper:campaign:v1'))
const html = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
assert.ok(html.includes('src="/chessweeper/campaign.js"'))
assert.ok(html.includes('href="/chessweeper/campaign.css"'))
console.log('chessweeper three-world campaign chapters: ok')
