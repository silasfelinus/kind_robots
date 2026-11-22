// Emperor of Dust t-075: the light ruler creator. A name, a style of address
// and a temperament chosen at New Reign. The default (nameless Emperor, no
// temperament) must be today's Day 1 exactly; each temperament nudges Day 1
// once, within small bounds; saves from before the creator load as the
// default; save, load and rewind keep the identity; and the interface reads
// the title through one helper.
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

// The store's achievement and Playbook imports need the Nuxt app; swap them
// for inert stand-ins, as verifyEmperorFortressStore.test.ts does.
const stub = (src: string) => `data:text/javascript,${encodeURIComponent(src)}`
const STUBS: Record<string, string> = {
  './achievementStore': stub(
    'export const useAchievementStore = () => ({ rewardAchievementByCode: async () => true })',
  ),
  './utils/playbookLiveText': stub(
    'export const loadPlaybookLiveText = async () => false',
  ),
  '~/stores/playbookRunReviewStore': stub(
    'export const usePlaybookRunReviewStore = () => ({ begin: () => {} })',
  ),
}
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = context.parentURL?.split('?')[0] ?? ''
    const url = parent.endsWith('/stores/emperorFortressStore.ts')
      ? STUBS[specifier]
      : undefined
    return url ? { url, shortCircuit: true } : nextResolve(specifier, context)
  },
})

const { readFileSync } = await import('node:fs')
const { createPinia, setActivePinia } = await import('pinia')
const { useEmperorFortressStore } =
  await import('../../stores/emperorFortressStore')
const { audiencesToday, chooseAudienceOption, createRun, finishDay } =
  await import('../emperorOfDust/fortress/engine')
const { COURT_ONBOARDING_FLAG, COURT_RECRUITMENT_IDS } =
  await import('../emperorOfDust/fortress/onboarding')
const {
  decodeBook,
  decodeSlot,
  encodeBook,
  encodeSlot,
  newBook,
  recordDawn,
  rewindTo,
  validateRun,
} = await import('../emperorOfDust/fortress/saves')
const { decodeScrapbook, rememberReign } =
  await import('../emperorOfDust/fortress/scrapbook')
const { applyLegacy } = await import('../emperorOfDust/fortress/legacy')
const { POLICIES, playCampaign } =
  await import('../emperorOfDust/fortress/balance')
const {
  DEFAULT_RULER,
  RULER_NAME_MAX,
  TEMPERAMENTS,
  applyRuler,
  customRulerStyle,
  isDefaultRuler,
  normalizeRuler,
  rulerCanBeChosen,
  rulerOf,
  rulerStyle,
  rulerTitle,
  sanitizeRulerName,
  validRuler,
} = await import('../emperorOfDust/fortress/ruler')
const { KINGDOM_FACTIONS, LOCAL_FACTIONS, RULER_TEMPERAMENTS } =
  await import('../emperorOfDust/fortress/types')
type FortressRun = import('../emperorOfDust/fortress/types').FortressRun

const SEEDS = [1, 42, 2026, 987654321]

// --- the default ruler is exactly today's Day 1 -----------------------------
for (const seed of SEEDS) {
  const today = createRun(seed)
  assert.equal('ruler' in today, false, 'a new run carries no ruler field')
  assert.deepEqual(applyRuler(createRun(seed), undefined), today)
  assert.deepEqual(applyRuler(createRun(seed), {}), today)
  assert.deepEqual(applyRuler(createRun(seed), DEFAULT_RULER), today)
  assert.deepEqual(
    applyRuler(createRun(seed), {
      name: '   ',
      address: 'emperor',
      temperament: 'none',
    }),
    today,
    'a blank name is no name',
  )
  assert.equal(
    JSON.stringify(applyRuler(createRun(seed), DEFAULT_RULER)),
    JSON.stringify(today),
    'byte for byte',
  )
  assert.deepEqual(rulerOf(today), { address: 'emperor', temperament: 'none' })
  assert.ok(rulerCanBeChosen(today))
}
assert.deepEqual(normalizeRuler(null), DEFAULT_RULER)
assert.deepEqual(
  normalizeRuler({ address: 'tyrant', temperament: 'chaotic', name: 7 }),
  DEFAULT_RULER,
  'unknown values fall back to the default',
)

// --- each temperament nudges Day 1 once, within small bounds ----------------
const delta = (from: FortressRun, to: FortressRun) => {
  const changes: Record<string, number> = {}
  if (to.brass !== from.brass) changes.brass = to.brass - from.brass
  for (const id of LOCAL_FACTIONS)
    if (to.local[id] !== from.local[id])
      changes[`local:${id}`] = to.local[id] - from.local[id]
  for (const id of KINGDOM_FACTIONS)
    if (to.affinity[id] !== from.affinity[id])
      changes[`affinity:${id}`] = to.affinity[id] - from.affinity[id]
  return changes
}
for (const temperament of RULER_TEMPERAMENTS) {
  const base = createRun(7)
  const crowned = applyRuler(base, { address: 'sovereign', temperament })
  const changes = delta(base, crowned)
  const nudge = TEMPERAMENTS[temperament].nudge
  const expected: Record<string, number> = {}
  if (nudge.brass) expected.brass = nudge.brass
  for (const [id, n] of Object.entries(nudge.local ?? {}))
    expected[`local:${id}`] = n
  for (const [id, n] of Object.entries(nudge.affinity ?? {}))
    expected[`affinity:${id}`] = n
  assert.deepEqual(changes, expected, `${temperament} applies its nudge`)
  assert.ok(Object.keys(changes).length <= 3, `${temperament} touches little`)
  for (const [key, n] of Object.entries(changes))
    assert.ok(
      key === 'brass' ? Math.abs(n) <= 10 : Math.abs(n) <= 2,
      `${temperament} ${key} ${n} is small`,
    )
  if (temperament === 'none') assert.deepEqual(changes, {})
  else
    assert.ok(
      Object.values(changes).some((n) => n < 0),
      `${temperament} has a price as well as a gift`,
    )
  // Nothing else on the run moves.
  const rest = (run: FortressRun) =>
    Object.fromEntries(
      Object.entries(run).filter(
        ([key]) => !['brass', 'local', 'affinity', 'ruler'].includes(key),
      ),
    )
  assert.deepEqual(
    rest(crowned),
    rest(base),
    `${temperament} changes only its nudge`,
  )
  assert.ok(validateRun(crowned), `${temperament} run is a valid save`)
  // Crowned again (the form re-submits on every change): applied once.
  assert.deepEqual(
    applyRuler(crowned, { address: 'sovereign', temperament }),
    crowned,
    `${temperament} never stacks`,
  )
  // A change of heart replaces the old nudge; back to None is today's start.
  for (const other of RULER_TEMPERAMENTS)
    assert.deepEqual(
      applyRuler(crowned, { address: 'sovereign', temperament: other }),
      applyRuler(createRun(7), { address: 'sovereign', temperament: other }),
      `${temperament} -> ${other} equals ${other} alone`,
    )
  assert.deepEqual(applyRuler(crowned, DEFAULT_RULER), createRun(7))
  assert.equal(base.brass, createRun(7).brass, 'applyRuler is pure')
}
// With a legacy favor already applied, the nudge still lands on top once.
{
  const withFavor = applyLegacy(createRun(9), {
    endings: ['iron-peace'],
    useWrit: false,
    selectedFavor: 'iron-peace',
  })
  const iron = applyRuler(withFavor, {
    address: 'emperor',
    temperament: 'iron',
  })
  assert.equal(iron.local['gate-watch'], withFavor.local['gate-watch'] + 2)
  assert.deepEqual(applyRuler(iron, DEFAULT_RULER), withFavor)
}

// --- whole campaigns: a temperament is a nudge, not a different game --------
{
  const SEEDS_PER_POLICY = 2
  const changed: Record<string, number> = {}
  let campaigns = 0
  for (const policy of POLICIES)
    for (let seed = 1; seed <= SEEDS_PER_POLICY; seed += 1) {
      const base = playCampaign(policy, seed)
      assert.deepEqual(
        playCampaign(policy, seed, undefined, { ruler: { ...DEFAULT_RULER } }),
        base,
        `${policy.id} seed ${seed}: the default ruler plays today's campaign`,
      )
      for (const temperament of ['merciful', 'iron', 'cunning'] as const) {
        const result = playCampaign(policy, seed, undefined, {
          ruler: { address: 'empress', temperament },
        })
        campaigns += 1
        if (result.ending !== base.ending)
          changed[temperament] = (changed[temperament] ?? 0) + 1
        const where = `${policy.id} seed ${seed} ${temperament}`
        assert.ok(result.deaths <= base.deaths + 1, `${where}: deaths`)
        assert.ok(result.wipedOut <= base.wipedOut, `${where}: wipe-outs`)
        assert.ok(result.loans <= base.loans + 2, `${where}: loans`)
      }
    }
  const runsPer = POLICIES.length * SEEDS_PER_POLICY
  for (const [temperament, count] of Object.entries(changed))
    assert.ok(
      count / runsPer <= 0.15,
      `${temperament} changed ${count} of ${runsPer} endings`,
    )
  assert.equal(campaigns, runsPer * 3)
}

// --- names: sanitized, bounded, never markup --------------------------------
const names: [unknown, string][] = [
  ['Ash', 'Ash'],
  ['  Ash    of   the   Mesa  ', 'Ash of the Mesa'],
  ["O'Hara-Vex Jr.", "O'Hara-Vex Jr."],
  ['Zoë Ñúñez', 'Zoë Ñúñez'],
  ['Rúna’s Heir', 'Rúna’s Heir'],
  ['<script>alert(1)</script>', 'scriptalertscript'],
  ['<b>Bold</b>', 'bBoldb'],
  ['Ash‮evil​', 'Ashevil'],
  ['Ash\n\tKa', 'Ash Ka'],
  ['A'.repeat(40), 'A'.repeat(RULER_NAME_MAX)],
  ['Twenty three letters ab c', 'Twenty three letters ab'],
  ['12345', ''],
  ['   ', ''],
  ["'-.", ''],
  ['', ''],
  [undefined, ''],
  [42, ''],
]
for (const [raw, expected] of names)
  assert.equal(sanitizeRulerName(raw), expected, JSON.stringify(raw))
for (const raw of names.map(([value]) => value)) {
  const clean = sanitizeRulerName(raw)
  assert.ok(clean.length <= RULER_NAME_MAX)
  assert.doesNotMatch(clean, /[<>&"/\\]/)
  assert.equal(clean, clean.trim())
  assert.equal(sanitizeRulerName(clean), clean, 'sanitizing is idempotent')
}
assert.equal(
  applyRuler(createRun(3), { name: '<i>Ash</i>', address: 'empress' }).ruler
    ?.name,
  'iAshi',
)

assert.ok(validRuler({ address: 'empress', temperament: 'iron' }))
assert.ok(validRuler({ name: 'Ash', address: 'empress', temperament: 'none' }))
for (const bad of [
  null,
  [],
  'Empress',
  { address: 'empress' },
  { address: 'queen', temperament: 'none' },
  { address: 'empress', temperament: 'kind' },
  { name: '', address: 'empress', temperament: 'none' },
  { name: '<b>Ash</b>', address: 'empress', temperament: 'none' },
  { name: ' Ash', address: 'empress', temperament: 'none' },
  { name: 'A'.repeat(25), address: 'empress', temperament: 'none' },
  { name: 'Ash', address: 'empress', temperament: 'none', brass: 999 },
])
  assert.equal(validRuler(bad), false, JSON.stringify(bad))

// --- the title, through the helpers the interface uses ----------------------
{
  const empress = applyRuler(createRun(11), {
    name: 'Ash',
    address: 'empress',
    temperament: 'cunning',
  })
  assert.equal(rulerTitle(rulerOf(empress)), 'Empress')
  assert.equal(rulerStyle(rulerOf(empress)), 'Empress Ash')
  assert.equal(customRulerStyle(empress), 'Empress Ash')
  const sovereign = applyRuler(createRun(11), { address: 'sovereign' })
  assert.equal(customRulerStyle(sovereign), 'Sovereign')
  const named = applyRuler(createRun(11), { name: 'Dunmore' })
  assert.equal(customRulerStyle(named), 'Emperor Dunmore')
  const plain = createRun(11)
  assert.equal(rulerTitle(rulerOf(plain)), 'Emperor')
  assert.equal(rulerStyle(rulerOf(plain)), 'Emperor')
  assert.equal(customRulerStyle(plain), '', 'the default adds no new text')
  assert.ok(isDefaultRuler(rulerOf(plain)))
  const iron = applyRuler(createRun(11), { temperament: 'iron' })
  assert.equal(customRulerStyle(iron), 'Emperor', 'a temperament is custom')

  const page = readFileSync(
    new URL('../../pages/play/emperor-of-dust.vue', import.meta.url),
    'utf8',
  )
  const splash = readFileSync(
    new URL('../../components/EmperorFortressSplash.vue', import.meta.url),
    'utf8',
  )
  const intro = readFileSync(
    new URL('../../components/EmperorFortressIntro.vue', import.meta.url),
    'utf8',
  )
  const creator = readFileSync(
    new URL(
      '../../components/EmperorFortressRulerCreator.vue',
      import.meta.url,
    ),
    'utf8',
  )
  const endings = readFileSync(
    new URL('../../components/EmperorFortressEndings.vue', import.meta.url),
    'utf8',
  )
  assert.match(page, /customRulerStyle\(run\.value\)/, 'header and ending')
  assert.match(page, /the end of \$\{rulerLine\}’s reign/)
  assert.match(splash, /customRulerStyle\(court\.run\)/, 'splash')
  assert.match(splash, /v-if="hasSave && rulerLine"/)
  assert.match(endings, /memory\.ruler/, 'scrapbook entries')
  assert.match(
    intro,
    /<EmperorFortressRulerCreator\s+v-if="index === 0 && court\.canChooseRuler"/,
    'the creator sits on the first introduction screen, new reigns only',
  )
  assert.doesNotMatch(creator, /v-html/, 'the name is never markup')
  for (const label of ['Name', 'Style of address', 'Temperament'])
    assert.match(creator, new RegExp(`<span[^>]*>\\s*${label}`), label)
  assert.match(intro, /Your Majesty\. Congratulations/, 'prose is unchanged')
}

// --- older saves load as the default ruler ---------------------------------
{
  const old = createRun(55)
  const raw = encodeBook(newBook(old))
  assert.doesNotMatch(raw, /"ruler"/)
  const book = decodeBook(raw)
  assert.ok(book)
  assert.deepEqual(rulerOf(book.current), DEFAULT_RULER)
  // A version 3 book as written before the save packer, with no ruler.
  const v3 = JSON.stringify({ version: 3, current: old, dawns: [old] })
  assert.deepEqual(rulerOf(decodeBook(v3)!.current), DEFAULT_RULER)
  // A tampered ruler is refused like any other bad field.
  const tampered = JSON.parse(raw)
  tampered.current.ruler = {
    name: '<img src=x onerror=alert(1)>',
    address: 'empress',
    temperament: 'none',
  }
  assert.equal(decodeBook(JSON.stringify(tampered)), null)
  tampered.current.ruler = { address: 'empress', temperament: 'greedy' }
  assert.equal(decodeBook(JSON.stringify(tampered)), null)
}

// --- save, load and rewind keep the ruler ----------------------------------
const playFirstCourt = (run: FortressRun) => {
  let next = run
  if (next.day === 1 && next.flags.includes(COURT_ONBOARDING_FLAG))
    for (const audience of audiencesToday(next))
      if (COURT_RECRUITMENT_IDS.includes(audience.id))
        next = chooseAudienceOption(
          next,
          audience.id,
          audience.options[0]!.id,
        ).run
  return next
}
{
  const ruler = { name: 'Ash', address: 'empress', temperament: 'merciful' }
  const start = applyRuler(createRun(808), ruler)
  let book = newBook(start)
  for (let day = 1; day <= 3; day += 1) {
    const dusk = playFirstCourt(book.current)
    assert.equal(rulerCanBeChosen(dusk), false, `day ${day} has begun`)
    book = recordDawn(book, finishDay(dusk).run)
  }
  assert.equal(book.current.day, 4)
  for (const dawn of [...book.dawns, book.current])
    assert.deepEqual(dawn.ruler, ruler, `day ${dawn.day} keeps the ruler`)
  const loaded = decodeBook(encodeBook(book))
  assert.ok(loaded)
  assert.deepEqual(loaded, book, 'the packed autosave roundtrips')
  const slot = decodeSlot(encodeSlot('Ash', book, new Date(0)))
  assert.deepEqual(slot?.book.current.ruler, ruler, 'a Chronicle slot too')
  const rewound = rewindTo(book, 1)
  assert.deepEqual(rewound.current.ruler, ruler, 'rewind to Day 1')
  assert.equal(
    rulerCanBeChosen(rewound.current),
    false,
    'a rewound reign has begun; the ruler stays crowned',
  )
  assert.deepEqual(rewindTo(book, 2).current.ruler, ruler, 'rewind to Day 2')
  assert.equal(
    rewound.current.affinity.abbey,
    createRun(808).affinity.abbey + 2,
    'the rewound dawn keeps the Day 1 nudge, not a second one',
  )
  // The scrapbook remembers who reigned; the default reign adds no field.
  const memories = rememberReign(
    [],
    { ...book.current, day: 51 },
    '2026-11-22T00:00:00Z',
  )
  assert.equal(memories[0]?.ruler, 'Empress Ash')
  assert.deepEqual(decodeScrapbook(JSON.stringify(memories)), memories)
  const plain = rememberReign(
    [],
    { ...createRun(808), day: 51 },
    '2026-11-22T00:00:00Z',
  )
  assert.equal('ruler' in plain[0]!, false)
  assert.equal(
    decodeScrapbook(JSON.stringify([{ ...plain[0], ruler: 'x'.repeat(61) }])),
    null,
  )
}

// --- the store crowns the ruler only before the reign begins ---------------
class FakeStorage {
  data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value))
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  clear() {
    this.data.clear()
  }
}
const storage = new FakeStorage()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  get: () => storage,
})
const AUTO = 'kr-emperor-of-dust-fortress-auto-v3'
const reload = () => {
  setActivePinia(createPinia())
  const court = useEmperorFortressStore()
  court.load()
  return court
}
{
  const court = reload()
  const before = JSON.parse(JSON.stringify(court.run)) as FortressRun
  assert.equal(court.canChooseRuler, true, 'a new visitor can choose')
  assert.deepEqual(court.ruler, DEFAULT_RULER)
  court.crownRuler({ name: ' Ash ', address: 'empress', temperament: 'iron' })
  assert.deepEqual(court.run!.ruler, {
    name: 'Ash',
    address: 'empress',
    temperament: 'iron',
  })
  assert.equal(court.run!.local['gate-watch'], before.local['gate-watch'] + 2)
  assert.deepEqual(court.book!.dawns[0], court.run, 'Day 1 dawn is rebuilt')
  court.crownRuler({ name: 'Ash', address: 'empress', temperament: 'cunning' })
  assert.equal(court.run!.local['gate-watch'], before.local['gate-watch'])
  assert.equal(court.run!.brass, before.brass + 10, 'replaced, not stacked')
  court.crownRuler({})
  assert.deepEqual(court.run, before, 'the default restores today exactly')
  court.crownRuler({ name: 'Ash', address: 'empress', temperament: 'cunning' })

  const again = reload()
  assert.equal(again.ruler.name, 'Ash', 'the autosave keeps the ruler')
  assert.equal(again.introOpen, true, 'an untouched reign still introduces')
  again.closeIntro()
  const first = audiencesToday(again.run!)[0]!
  again.answer(first.id, first.options[0]!.id)
  assert.equal(again.canChooseRuler, false, 'the reign has begun')
  assert.throws(() => again.crownRuler({ temperament: 'iron' }))
  assert.equal(again.ruler.temperament, 'cunning')
  for (const audience of audiencesToday(again.run!))
    if (
      COURT_RECRUITMENT_IDS.includes(audience.id) &&
      !again.run!.audiencesHeard.includes(audience.id)
    )
      again.answer(audience.id, audience.options[0]!.id)
  again.finish()
  assert.equal(again.day, 2)
  again.rewind(1)
  assert.equal(again.ruler.name, 'Ash', 'a store rewind keeps the ruler')
  assert.equal(again.canChooseRuler, false)
  const returning = reload()
  assert.equal(returning.ruler.address, 'empress')
  assert.equal(
    returning.introOpen,
    false,
    'a returning player continues without the creator',
  )

  returning.newRun()
  assert.deepEqual(returning.ruler, DEFAULT_RULER, 'each reign starts anew')
  assert.equal(returning.canChooseRuler, true)
  assert.equal(returning.introOpen, true, 'New Reign shows the creator')
  // Older autosaves without the field load as the default.
  storage.data.set(AUTO, encodeBook(newBook(createRun(31))))
  assert.deepEqual(reload().ruler, DEFAULT_RULER)
}

console.log(
  'Emperor ruler creator: defaults, nudges, names, saves and rewind ok',
)
