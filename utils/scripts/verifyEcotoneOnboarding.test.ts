import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  advance,
  createRun,
  restoreRun,
  chooseBeat,
  chooseCrossroads,
  chooseEvent,
  chooseFork,
  computeEnding,
  findCard,
  originPerkAvailable,
  type RunState,
} from '../ecotone/engine'
import {
  BEATS,
  ECOTONE_TAGLINE,
  EVENTS,
  EVENT_CHOICE,
  ROUTES,
  routeLength,
} from '../ecotone/story'
import {
  PLAYER_AVATARS,
  PLAYER_PERSONALITIES,
  normalizePlayerIdentity,
  playerAvatarSrc,
} from '../ecotone/playerIdentity'
import {
  contextualOpeningChoices,
  contextualOfferLine,
  sceneMomentOffer,
} from '../ecotone/sceneOffers'

assert.equal(
  playerAvatarSrc('/images/ecotone/avatars/glitter.webp'),
  'https://media.acrocatranch.com/images/ecotone/avatars/glitter.webp',
)
assert.equal(PLAYER_AVATARS.length, 12)
assert.deepEqual(
  PLAYER_AVATARS.map((avatar) => avatar.portrait),
  PLAYER_AVATARS.map((avatar) => `/images/ecotone/avatars/${avatar.id}.webp`),
  'each stable saved-avatar ID needs its own canonical portrait path',
)
assert.equal(
  new Set(PLAYER_AVATARS.map((avatar) => avatar.portrait)).size,
  12,
  'no two avatar identities may share the same painted portrait',
)
assert.ok(PLAYER_AVATARS.length >= 10)
assert.ok(PLAYER_PERSONALITIES.length >= 5)
assert.equal(
  new Set(PLAYER_AVATARS.map((p) => p.id)).size,
  PLAYER_AVATARS.length,
)
assert.equal(
  new Set(PLAYER_PERSONALITIES.map((p) => p.id)).size,
  PLAYER_PERSONALITIES.length,
)

assert.equal(EVENT_CHOICE.body.length, 3)
assert.ok(EVENT_CHOICE.body.every((paragraph) => paragraph.length < 160))
assert.ok(EVENTS.every((event) => event.arrival && event.possibilities))
const SPOILERS =
  /\b(kit|juniper|cedar|mara|dot|drugs?|meth|cocaine|mdma|stoned|psychedelic|brownies?|joint|drink|beer|sobriety|stimulant)\b/i
assert.ok(
  EVENTS.every(
    (event) =>
      !SPOILERS.test(
        `${event.blurb} ${event.kind} ${event.arrival} ${event.possibilities} ${event.feel} ${event.stakes}`,
      ),
  ),
  'opening routes must describe possibilities, not reveal companions or chemical paths',
)
assert.ok(
  ![ECOTONE_TAGLINE, EVENT_CHOICE.choosing, ...EVENT_CHOICE.body].some((line) =>
    SPOILERS.test(line),
  ),
  'the title and opening name no companion and no offer',
)

// Route previews (t-066): every route says what it feels like and what is at
// stake, short enough to read on a tablet before a single tap commits you.
for (const event of EVENTS) {
  for (const [field, text, max] of [
    ['feel', event.feel, 110],
    ['stakes', event.stakes, 130],
  ] as const) {
    assert.ok(text.trim().length >= 30, `${event.id} ${field} says something`)
    assert.ok(text.length <= max, `${event.id} ${field} stays short`)
    assert.match(text, /^[A-Z].*\.$/, `${event.id} ${field} is a sentence`)
  }
  // The length shown is the length played: the last route step falls on the
  // last listed day, and every listed day is visited.
  const steps = ROUTES[event.id]
  assert.deepEqual(
    [...new Set(steps.map((step) => step.day))].sort((a, b) => a - b),
    event.days.map((_, index) => index + 1),
    `${event.id}: the preview's day count matches the route`,
  )
  assert.equal(
    routeLength(event),
    `${event.days.length} days · ${event.days[0]!.slice(0, 3)}–${event.days[event.days.length - 1]!.slice(0, 3)}`,
  )
}
assert.deepEqual(EVENTS.map(routeLength), [
  '3 days · Fri–Sun',
  '6 days · Fri–Wed',
  '3 days · Sat–Mon',
])

// No preview mentions what its route can't reach. Each concrete hook a
// preview names must turn up in that route's own fixed story beats, which
// every run on it plays, so a hook from another route is caught too.
const HOOKS: Record<string, RegExp> = {
  circus: /\bcircus/i,
  drum: /\bdrum/i,
  forest: /\bforest/i,
  bonfire: /\bbonfire/i,
  fair: /\bfair\b/i,
  race: /\brac(e|ing)\b/i,
  crew: /\bcrews?\b/i,
  sculpture: /\bsculptures?\b/i,
  sand: /\b(sand|dunes?)\b/i,
  water: /\b(water|bay|river)\b/i,
  haunted: /\b(haunted|cemetery|ghost)/i,
  marsh: /\bmarsh/i,
  zoo: /\bzoo\b/i,
  elk: /\belk\b/i,
  bench: /\bbench/i,
  birds: /\b(birds?|heron|osprey)/i,
  animals: /\banimals?\b/i,
  tracks: /\b(tracks?|trail)\b/i,
}
for (const event of EVENTS) {
  const preview = [event.feel, event.stakes, event.possibilities].join(' ')
  const beats = JSON.stringify(BEATS.filter((beat) => beat.event === event.id))
  for (const [hook, pattern] of Object.entries(HOOKS)) {
    if (!pattern.test(preview)) continue
    // "haunted" is a promise; the route's beats must deliver the spooky thing.
    const delivered =
      hook === 'haunted'
        ? /\b(cemetery|ghost|frock coat)\b/i.test(beats)
        : pattern.test(beats)
    assert.ok(delivered, `${event.id} preview promises "${hook}"`)
  }
}

// Stakes are honest about difficulty: only the route with the strictly
// highest bar says hope asks more of you, and only the route with a
// solo animal-first ending promises one.
const hardest = Math.max(...EVENTS.map((event) => event.futureTarget))
for (const event of EVENTS) {
  assert.equal(
    /asks more of you/.test(event.stakes),
    event.futureTarget === hardest,
    `${event.id}: difficulty line matches futureTarget`,
  )
  assert.equal(
    /on your own[\s\S]*animals/.test(event.stakes),
    Boolean(event.wildTarget),
    `${event.id}: the animal ending is promised only where it exists`,
  )
}
assert.equal(
  EVENTS.filter((event) => event.futureTarget === hardest).length,
  1,
  'one route is the long road',
)

// "Every route can end in hope": seeded random play, with no special
// knowledge, earns a hopeful ending on each route.
function playRandom(seed: number, eventId: (typeof EVENTS)[number]['id']) {
  let rng = seed * 2654435761
  const next = (n: number) => {
    rng = (Math.imul(rng ^ (rng >>> 15), 2246822519) + 0x6d2b79f5) >>> 0
    return rng % n
  }
  let state: RunState = advance(
    chooseEvent(createRun(seed, 'reporter'), eventId),
  )
  for (let turn = 0; state.phase !== 'end'; turn++) {
    assert.ok(turn < 120, `${eventId} seed ${seed} never stalls`)
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[next(state.offered.length)]!)
      continue
    }
    if (state.phase === 'crossroads') {
      state = advance(chooseCrossroads(state, next(2) === 0))
      continue
    }
    const card = findCard(state.card)!
    const playable = contextualOpeningChoices(card, state).filter(
      (choice) =>
        !choice.locked &&
        (!choice.requiresFlag || state.flags.includes(choice.requiresFlag)),
    )
    const resolved = chooseBeat(state, playable[next(playable.length)]!.id)
    assert.ok(resolved.pending, `${card.id} resolves`)
    state = advance(resolved)
  }
  return computeEnding(state)
}
const seedsToHope: number[] = []
for (const event of EVENTS) {
  let seed = 1
  while (seed <= 400 && playRandom(seed, event.id).fate !== 'hope') seed++
  assert.ok(seed <= 400, `${event.id}: random play can reach hope`)
  seedsToHope.push(seed)
}
assert.match(
  EVENT_CHOICE.choosing,
  /every route can end in hope/,
  'the opening promise above is the one this test keeps',
)
const custom = createRun(3030, 'mechanic', undefined, {
  avatarId: 'custom',
  portraitArtId: 45678,
})
assert.equal(
  restoreRun(JSON.parse(JSON.stringify(custom)))?.portraitArtId,
  45678,
)
assert.equal(restoreRun(JSON.parse(JSON.stringify(custom)))?.avatarId, 'custom')
assert.equal(
  normalizePlayerIdentity({ avatarId: 'custom', portraitArtId: 0 }).avatarId,
  'glitter',
)
assert.equal(restoreRun({ ...custom, portraitArtId: -2 }), null)

const identity = normalizePlayerIdentity({
  playerName: '   River   Rabbit   ',
  avatarId: 'elder',
  personalityId: 'skeptical',
})
assert.equal(identity.playerName, 'River Rabbit')
assert.equal(identity.avatarId, 'elder')
assert.equal(identity.personalityId, 'skeptical')
assert.equal(
  normalizePlayerIdentity({ playerName: '   ', avatarId: 'not-real' })
    .playerName,
  'Wanderer',
)
assert.equal(
  normalizePlayerIdentity({ avatarId: 'not-real' }).avatarId,
  'glitter',
)
assert.equal(
  normalizePlayerIdentity({ playerName: 'z'.repeat(200) }).playerName.length,
  32,
)
const current = createRun(2026, 'mechanic', undefined, identity)
assert.deepEqual(restoreRun(JSON.parse(JSON.stringify(current))), current)
const old = { ...createRun(2026, 'mechanic') }
delete old.playerName
delete old.avatarId
delete old.personalityId
assert.equal(
  restoreRun(old)?.playerName,
  'Wanderer',
  'legacy version-4 runs gain non-destructive defaults',
)
assert.deepEqual(
  restoreRun(old)?.skills,
  current.skills,
  'identity does not change skills',
)

for (const [id, event] of [
  ['KN-2', 'kinetic'],
  ['GR-2', 'green-ribbon'],
  ['QW-2', 'quiet'],
] as const) {
  const card = findCard(id)!
  const run = {
    ...current,
    event,
    phase: 'beat' as const,
    step: 1,
    day: 1,
    card: id,
    prospect: id === 'KN-2' ? ('cedar' as const) : ('juniper' as const),
  }
  const options = contextualOpeningChoices(card, run)
  assert.ok(options.length >= 2 && options.length <= 3)
  assert.ok(options.some((choice) => choice.lens === 'sober'))
  assert.ok(options.every((choice) => !choice.locked && choice.lens))
  for (const option of options) {
    const resolved = chooseBeat(run, option.id)
    assert.notEqual(resolved, run)
    assert.equal(resolved.openingState, option.lens)
    assert.equal(originPerkAvailable(run, option.id), false)
    assert.equal(resolved.rolls, run.rolls, 'opening outlooks never roll dice')
    assert.equal(resolved.pending?.entry.roll, null)
    assert.ok(
      [option.success.text, option.failure?.text]
        .filter(Boolean)
        .some((text) => resolved.pending?.entry.text.includes(text!)),
      'opening choice must deliver an authored outcome, not skip its story',
    )
    if (option.check) {
      const later = chooseBeat(
        {
          ...run,
          openingState: 'sober' as const,
          currentState: 'sober' as const,
        },
        option.id,
      )
      assert.equal(later.rolls, run.rolls + 1, 'later skill tests still roll')
      assert.ok(later.pending?.entry.roll)
    }
    assert.equal(
      restoreRun(JSON.parse(JSON.stringify(resolved)))?.openingState,
      option.lens,
    )
  }
  if (id === 'KN-2') assert.match(contextualOfferLine(card, run) ?? '', /offer/)
  else assert.equal(contextualOfferLine(card, run), null)
}
const momentRun = {
  ...current,
  phase: 'beat' as const,
  openingState: 'sober' as const,
}
assert.equal(sceneMomentOffer(findCard('GR-3')!, momentRun)?.id, 'cannabis')
assert.equal(sceneMomentOffer(findCard('KN-3')!, momentRun)?.id, 'alcohol')
assert.equal(sceneMomentOffer(findCard('QW-4')!, momentRun), null)
assert.equal(sceneMomentOffer(findCard('GR-4')!, momentRun), null)

const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
const board = readFileSync('components/ecotone-board.vue', 'utf8')
const hand = readFileSync('components/ecotone-choice-hand.vue', 'utf8')
assert.match(store, /UNDO_KEY/)
assert.match(store, /undoSnapshot/)
assert.match(store, /function undo\(/)
assert.match(store, /function saveSlot\(/)
assert.match(store, /function loadSlot\(/)
assert.match(store, /function exportSave\(/)
assert.match(store, /function importSave\(/)
assert.match(store, /restoreRun\(payload\.run\)/)
assert.match(board, /portraitRetry/)
// Choices are a hand of cards (Silas, 2026-11-02): each card's face is the
// picture of the result, and the full hint stays readable off-card.
assert.match(board, /<EcotoneChoiceHand/)
assert.match(hand, /<KrChoiceHand/)
assert.match(
  hand,
  /image: candidates\(option\)/,
  'each card offers its own art',
)
assert.match(
  hand,
  /<template #art="\{ choice, src \}">[\s\S]*?:art="src\.startsWith\(SCENE\) \? undefined : src"/,
  'cards render the de-duplicated picture, never a repeat',
)
assert.doesNotMatch(
  board,
  /art: \[outcomeArtKey\(card\.id, choiceId, 'success'\), \.\.\.cardArt\]/,
  "beat choices don't fall back to the beat's own stage painting",
)
assert.match(hand, /option.possibilities/)
assert.match(board, /outcomeArtKey\(card.id, choiceId, 'success'\)/)
assert.match(hand, /emit\('play', option\)/)
assert.doesNotMatch(hand, /Confirm your decision|confirmDecision|stagedChoice/)
assert.match(board, /uploadPortrait/)
assert.match(board, /game.setPlayerLook/)
assert.match(board, /max-h-none/)
assert.ok(store.includes('function setPlayerLook('))
assert.match(board, /:aria-pressed="pickedAvatar === avatar.id"/)
assert.ok(board.includes('failedAvatarPortraits.push(avatar.id)'))
assert.ok(
  !board.includes('grid grid-cols-6 gap-1.5'),
  'emoji-only selection grid was retired',
)
assert.match(board, /Opening choice · No roll/)
// The opening says what the player is choosing and previews every route in
// the story panel, so a touch player sees it before tapping a card.
assert.match(board, /\{\{ ECOTONE_TAGLINE \}\}/)
assert.match(board, /\{\{ EVENT_CHOICE\.choosing \}\}/)
assert.match(
  board,
  /v-if="game\.run\.phase === 'event'"[\s\S]{0,120}data-testid="ecotone-route-previews"/,
)
assert.match(board, /v-for="route in EVENTS"/)
assert.match(board, /\{\{ route\.feel \}\}/)
assert.match(board, /\{\{ route\.stakes \}\}/)
assert.match(board, /chip: routeLength\(event\)/)
assert.ok(
  ECOTONE_TAGLINE.includes('fair') &&
    ECOTONE_TAGLINE.includes('race') &&
    ECOTONE_TAGLINE.includes('marsh'),
  'the title pitch names all three routes',
)
assert.doesNotMatch(board, /explore the whole\s+cast/)
// Identity is flavor; the screen says so, and the engine agrees.
assert.match(board, /never change the\s+dice/)
for (const personalityId of PLAYER_PERSONALITIES.map((p) => p.id)) {
  const run = createRun(77, 'student', undefined, {
    personalityId,
    avatarId: 'punk',
  })
  const base = createRun(77, 'student')
  assert.deepEqual(
    { ...run, personalityId: undefined, avatarId: undefined },
    { ...base, personalityId: undefined, avatarId: undefined },
    `${personalityId} changes nothing but flavor`,
  )
}
// Starting over mid-journey can't be undone, so it asks first.
assert.match(
  board,
  /function restart\(\) \{[\s\S]{0,200}game\.run\.log\.length > 0 &&\s+!window\.confirm\(/,
)
assert.match(
  board,
  /function queueDecision\(option: Option\) \{\s+if \(option.disabled\) return\s+option.act\(\)/,
)
assert.doesNotMatch(board, /Confirm your decision|confirmDecision|stagedChoice/)
assert.doesNotMatch(board, /Change my mind/)
assert.doesNotMatch(board, /Undo last decision|Rewind last decision/)
assert.match(board, /resultPreview/)
assert.match(board, /resultHasMore/)
assert.match(board, /Read the full scene with artwork/)
assert.match(board, /data-testid="ecotone-companion-dialogue"/)
assert.match(board, /asidePortrait\(aside\)/)
assert.match(board, /sceneFallback: true/)
assert.match(board, /cardArtKey\(card.id\)/)
const ecotoneHand = readFileSync('components/ecotone-choice-hand.vue', 'utf8')
assert.match(ecotoneHand, /--hand-tuck: 0/)
assert.doesNotMatch(ecotoneHand, /--hand-tuck: 1/)
assert.match(ecotoneHand, /--hand-card-max: 10\.75rem/)
const sharedHand = readFileSync('components/narrative/kr-choice-hand.vue', 'utf8')
assert.match(sharedHand, /return choice \?\? null/)

assert.match(board, /tab === 'settings'/)
assert.match(board, /Text reveal speed/)
assert.match(board, /Text size/)
assert.match(board, /Export save as JSON/)
assert.match(board, /Import saved journey/)
assert.match(board, /prefers-reduced-motion/)
assert.match(board, /:style="\{ '--eco-text-scale': displayScale \}"/)
assert.match(board, /contextualOpeningChoices\(card, run\)/)
assert.ok(!board.includes('SUBSTANCE_CHOICES'))
assert.match(board, /v-for="\(paragraph, index\) in revealedBody"/)
assert.match(
  board,
  /@4xl:col-start-1 @4xl:row-start-1 @4xl:overflow-y-auto/,
  'story has its own vertical scroll on wide screens',
)
assert.match(
  board,
  /@4xl:col-start-1 @4xl:row-start-2 @4xl:px-7/,
  'the choice hand shares the text column, below the story',
)
assert.doesNotMatch(
  board,
  /@4xl:max-h-\[42vh\]|@4xl:flex-1 @4xl:overflow-hidden/,
  'story text sizes to itself instead of a squeezed nested scroll box',
)
assert.match(
  board,
  /@4xl:left-\[55%\] @4xl:right-0 @4xl:h-full/,
  'illustration has its own unobstructed right-hand column',
)
assert.match(board, /pt-\[calc\(clamp\(13rem,32vh,22rem\)\+1\.25rem\)\]/)
assert.match(
  board,
  /game.endings.includes\(game.ending.id\)/,
  'earned ending card is visible in the same illustration column',
)
assert.match(board, /Ending earned/)
assert.match(board, /:art="endingArtKey\(game.ending.id\)"/)

console.log(
  `Ecotone first impressions: 12 avatars, personal runs, fewer opening temptations, permanent choices and full card visibility passed; ${EVENTS.length} route previews, hope by random seed ${seedsToHope.join('/')}`,
)
