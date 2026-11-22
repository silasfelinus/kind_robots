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
  (event: { detail?: { type?: string; kind?: string } }) => void
>()
type MockNode = {
  textContent: string
  hidden: boolean
  disabled?: boolean
  setAttribute?: (key: string, value: string) => void
  addEventListener?: (type: string, action: () => void) => void
}
const nodes = new Map<string, MockNode>()
const pactButtons = [0, 1].map((index) => {
  const item: MockNode = {
    textContent: '',
    hidden: false,
    disabled: false,
    setAttribute: (key, value) => {
      if (key === 'aria-pressed') pressed[index] = value
    },
    addEventListener: (_type, action) => callbacks.set('pact' + index, action),
  }
  return item
})
const pressed: string[] = []
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
    querySelectorAll: (selector: string) =>
      selector === '[data-campaign-pact]' ? pactButtons : [],
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
const events: Array<{ type: string; detail?: unknown }> = []
class MockCustomEvent {
  constructor(
    public type: string,
    public options?: { detail?: unknown },
  ) {}
  get detail() {
    return this.options?.detail
  }
}
const windowObject: Record<string, unknown> = {
  __fusionTest: engine,
  dispatchEvent: (event: { type: string; detail?: unknown }) => {
    events.push(event)
    return true
  },
  addEventListener: (
    name: string,
    fn: (event: { detail?: { type?: string; kind?: string } }) => void,
  ) => callbacks.set(name, fn),
}
runInNewContext(js, {
  CustomEvent: MockCustomEvent,
  document: fakeDocument,
  window: windowObject,
  localStorage: {
    getItem: (key: string) => values.get(key) || null,
    setItem: (key: string, value: string) => values.set(key, value),
  },
})
type Campaign = {
  current: (world: string) => {
    chapter: number
    cleared: boolean
    mastery: number
    pact: number
  }
  worldCount: number
  chapters: (world: string) => number
  trial: (world: string, chapter: number) => string[] | null
  pact: (world: string, index: number) => string[] | null
}
const campaign = windowObject.__chessweeperCampaign as Campaign
assert.equal(campaign.worldCount, 3)
for (const w of ['sugar', 'ashen', 'jackpot']) {
  assert.equal(campaign.chapters(w), 4)
}

assert.equal(campaign.pact('sugar', 0)?.[0], 'Royal Shelter')
assert.equal(campaign.pact('ashen', 1)?.[0], 'Iron Oath')
assert.equal(campaign.pact('jackpot', 1)?.[0], 'High Roller')
assert.equal(campaign.current('sugar').pact, 0)
assert.equal(pressed[0], 'true')
assert.equal(pressed[1], 'false')
callbacks.get('pact1')?.({})
assert.equal(campaign.current('sugar').pact, 1, 'risk contract persists')
assert.equal(state.score, 125, 'Glitter Dare awards real points')
assert.equal(state.discs[2]!.active, true, 'Glitter Dare activates blade')
assert.equal(state.hp[1], 5, 'chapter base armor remains')
state.turns = 1
callbacks.get('pact0')?.({})
assert.equal(campaign.current('sugar').pact, 1, 'pact locked after play')
state.turns = 0
callbacks.get('pact0')?.({})
assert.equal(campaign.current('sugar').pact, 0)
assert.equal(state.score, 0, 'switching pact resets run without bonus leak')
assert.equal(state.hp[1], 6, 'shelter grants a real extra heart')

assert.equal(state.hp[1], 6, 'first candy chapter and shelter grant armor')
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
assert.equal(campaign.current('ashen').pact, 0, 'world risk contract isolated')
assert.equal(state.discs[2]!.active, true, 'ashen starts dangerous')
state.over = true
callbacks.get('chessweeper:end')?.({ detail: { type: 'loss' } })
assert.equal(campaign.current('ashen').chapter, 0, 'loss does not advance')
world.dataset.realm = 'jackpot'
state = fresh()
callbacks.get('chessweeper:state')?.({})
assert.equal(state.score, 20, 'casino insurance spends thirty chips')
callbacks.get('pact1')?.({})
assert.equal(state.score, 225, 'casino high roller gets a real chip bonus')
assert.equal(state.discs[2]!.active, true, 'high roller adds a blade')
state.score = 120
state.over = true
callbacks.get('chessweeper:end')?.({ detail: { type: 'win' } })
assert.equal(campaign.current('jackpot').chapter, 1)
assert.equal(campaign.current('jackpot').mastery & 1, 1)
callbacks.get('next')?.({})
callbacks.get('chessweeper:fx')?.({ detail: { kind: 'wager' } })
state.over = true
callbacks.get('chessweeper:end')?.({ detail: { type: 'win' } })
assert.equal(campaign.current('jackpot').mastery & 2, 2)
assert.ok(
  events.some((event) => event.type === 'chessweeper:campaign-mastery'),
  'genuine special-action mastery emits a single unlock event',
)
assert.ok(values.has('kindrobots:chessweeper:campaign:v1'))
assert.equal(
  campaign.current('jackpot').pact,
  1,
  'pact survives chapter victory',
)
const html = readFileSync(
  fileURLToPath(
    new URL('../../public/chessweeper/index.html', import.meta.url),
  ),
  'utf8',
)
assert.ok(html.includes('src="/chessweeper/campaign.js"'))
assert.ok(html.includes('href="/chessweeper/campaign.css"'))

// Optional chapter goals are recorded only when their actual gameplay events fire.
{
  const goals = ['sugar', 'ashen', 'jackpot']
  for (const name of goals) {
    for (let chapter = 0; chapter < 4; chapter++) {
      assert.equal(campaign.trial(name, chapter)?.length, 2)
    }
  }
  const stored = JSON.parse(values.get('kindrobots:chessweeper:campaign:v1')!)
  assert.equal(
    stored.worlds.sugar.mastery & 1,
    1,
    'guard mastery earned by three hearts',
  )
  assert.equal(
    campaign.current('ashen').mastery,
    0,
    'losing never awards mastery',
  )
  assert.ok(
    Array.isArray(events),
    'mastery events are captured without unlocking fictitious chapters',
  )
}

console.log('chessweeper three-world campaign chapters: ok')
