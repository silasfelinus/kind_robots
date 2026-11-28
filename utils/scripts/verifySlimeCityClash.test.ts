// Canonical Slime City CLASH regression suite. Legacy formats are intentionally
// not used for balance acceptance; all 300 cards have Clash-only profiles.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CLASH_EVOLUTIONS,
  clashEvolutionChoice,
  clashEvolutionStage,
} from '../slimeCity/clashEvolutions'
import { alleyDeck } from '../slimeCity/alleys'
import { CLASH_GLOSSARY, clashGlossaryParts } from '../slimeCity/glossary'
import { CLASH_TWISTS } from '../slimeCity/clashTwists'
import { CARDS, TEAMS, cardById, type Side } from '../slimeCity/prototypes'
import {
  CLASH_BOSS_HP,
  CLASH_DECK_SIZE,
  CLASH_HAND_SIZE,
  CLASH_MAX_LEVEL,
  CLASH_LANES,
  CLASH_PLAYS,
  CLASH_ROUND_LIMIT,
  CLASH_SECOND_SEAT_BONUS,
  CLASH_TRAIT_TEXT,
  applyClashCommand,
  activateClash,
  canClashActivate,
  canClashPlay,
  chooseClashCpu,
  clashBalance,
  clashArmorGain,
  clashArmorHeal,
  clashGrantPower,
  clashDeck,
  CLASH_CRAFTED_DECKS,
  clashPower,
  clashBossMax,
  clashCardBadge,
  clashCardText,
  clashLevel,
  clashSplashHitsAllies,
  CLASH_L1_CLEAN_SPLASH,
  clashPlayCost,
  clashPlayLimit,
  createClash,
  endClashTurn,
  nextClashStrike,
  clashSummoningSick,
  passClash,
  playClash,
  replayClash,
  strikeClash,
  type ClashState,
  type ClashUnit,
} from '../slimeCity/clash'
import {
  compareCatgirlsStarter,
  sweepClash,
  worstClashPairings,
} from './slimeCityClashBalanceReport'
import { clashSpectacle } from '../slimeCity/clashSpectacle'
import { reportCalibrationCandidates } from './slimeCityCalibrationDiagnostic'

// Canonical editorial contract: every currently playable card renders complete
// level-specific text. Choice A and B are separately inspectable; no branch
// silently inherits words that only appeared on an earlier evolution.
const editorialCopy = CARDS.flatMap((card) => {
  const faces = [1, 2, 3].map((level) => ({
    id: card.id,
    level: String(level),
    text: clashCardText(card, level, level === 3 ? 0 : undefined),
  }))
  if (clashEvolutionChoice(card.id, 3))
    faces.push({
      id: card.id,
      level: '3B',
      text: clashCardText(card, 3, 1),
    })
  return faces
})
assert.equal(CARDS.length, 300, 'exactly 300 catalog cards are audited')
assert.equal(
  new Set([...Object.keys(CLASH_TWISTS), ...Object.keys(CLASH_EVOLUTIONS)])
    .size,
  300,
  'all 300 belong to a bespoke twist or authored evolution',
)
assert.equal(
  editorialCopy.length,
  922,
  '300 x 3 plus 22 distinct level-three forks',
)
for (const face of editorialCopy) {
  assert.ok(
    face.text.trim() ||
      (face.level === '1' &&
        cardById(face.id).kind === 'creature' &&
        !(cardById(face.id).keywords ?? []).length),
    face.id +
      ' ' +
      face.level +
      ' has readable rules or is a stat-only fighter',
  )
  assert.ok(
    face.text.length <= 160,
    face.id + ' ' + face.level + ' must fit the 160-character face',
  )
  assert.doesNotMatch(
    face.text,
    /(?:^|[.!?]\s+)(?:Also|Again|The stronger|As before)\b/i,
    face.id + ' ' + face.level + ' cannot rely on prior-stage text',
  )
}
for (const card of CARDS) {
  const choices = clashEvolutionChoice(card.id, 3)
  if (!choices) continue
  assert.notEqual(
    clashCardText(card, 3, 0),
    clashCardText(card, 3, 1),
    card.id + ' must explain its two final forms independently',
  )
}
const cardInspector = readFileSync(
  'components/slime-city-card-evolutions.vue',
  'utf8',
)
assert.match(cardInspector, /out\[CLASH_MAX_LEVEL - 1\]!\.pick = 0/)
assert.match(cardInspector, /pick: 1/)
assert.match(
  readFileSync('components/slime-city-pvp-game.vue', 'utf8'),
  /clashCardText\(cardById\(selectedCard\),\s*3,\s*index === 1 \? 1 : 0\)/,
)
assert.match(
  readFileSync('components/slime-city-clash.vue', 'utf8'),
  /clashCardText\(selectedCard,\s*3,\s*i === 1 \? 1 : 0\)/,
)
console.log(
  'Slime City editorial audit: 300 cards, 922 independent card faces and 22 choice pairs PASS',
)

function follower(
  side: Side,
  lane: number,
  uid: number,
  hp = 4,
  attack = 2,
): ClashUnit {
  return {
    uid,
    side,
    lane,
    cardId: side === 'player' ? 'lynx' : 'scrapper',
    hp,
    maxHp: hp,
    attack,
    armor: 0,
    keywords: [],
    surge: 0,
    rooted: false,
    ambushUsed: false,
    attacked: false,
    fresh: false,
    gear: [],
    level: 1,
  }
}
function finishTurn(input: ClashState): ClashState {
  let s = input
  const side = s.active
  if (s.phase === 'play') s = passClash(s, side)
  while (nextClashStrike(s, side) >= 0) s = strikeClash(s, side)
  return endClashTurn(s, side)
}
function finishRound(input: ClashState): ClashState {
  const s = finishTurn(input)
  return finishTurn(s)
}

const playPage = readFileSync('pages/play/slime-city.vue', 'utf8')
const gamePage = readFileSync('pages/admin/slime-city.vue', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const view = readFileSync('components/slime-city-clash.vue', 'utf8')
// Silas, 2026-11-09 PT: the public route opens on a title screen, not mid-game.
// Silas, 2026-11-10 PT: "still can't get back to the front end after clicking
// away from it" -- one title screen, the game's HOME view, always reachable.
assert.match(playPage, /<SlimeCityGame \/>/)
assert.doesNotMatch(playPage, /entered/)
const splash = readFileSync('components/slime-city-splash.vue', 'utf8')
for (const testid of [
  'slime-splash-crews',
  'slime-splash-battle',
  'slime-splash-journey',
]) {
  assert.match(splash, new RegExp('data-testid="' + testid + '"'))
}
assert.match(gamePage, /console-theme="slime-city"/)
assert.match(splash, /data-testid="slime-splash-decks"/)
// Main-game standard (conductor slime-city t-063): the title console reaches
// Achievements and the Scrapbook/endings gallery as well as Settings.
assert.match(splash, /data-testid="slime-splash-achievements"/)
assert.match(splash, /<GameAchievementStrip\s+game="slime-city"/)
const vsConsole = readFileSync('components/slime-city-vs.vue', 'utf8')
assert.doesNotMatch(vsConsole, /vs-left kr-pane-scroll/)
assert.match(vsConsole, /ref="powerDialog"/)
assert.match(vsConsole, /ref="optionsDialog"/)
assert.equal((vsConsole.match(/<SlimeCityDuelDeckPicker/g) ?? []).length, 1)
assert.match(vsConsole, /lab\.playClashFormat\(duelDeck\.format, duelDeck\)/)
const badgeStrip = readFileSync(
  'components/achievements/game-achievement-strip.vue',
  'utf8',
)
assert.match(badgeStrip, /row\?\.imagePath/)
assert.match(badgeStrip, /row\?\.artImageId/)
assert.match(badgeStrip, /props\.artFallbacks\?\.\[entry\.code\]/)
assert.equal((splash.match(/'slime-city-[^']+':/g) ?? []).length, 19)
assert.match(splash, /data-testid="slime-splash-scrapbook"/)
assert.match(splash, /lab\.endingsOpen = true/)
assert.match(splash, /prefers-reduced-motion: reduce/)
assert.match(
  store,
  />\('home'\)/,
  'The illustrated front door is the starting game view',
)
assert.match(
  gamePage,
  /<SlimeCitySplash\s+v-if="lab\.view === 'home'"\s+data-testid="slime-home"/,
)
assert.equal(
  (gamePage.match(/<SlimeCitySplash/g) ?? []).length,
  1,
  'exactly one title screen',
)
assert.match(gamePage, /data-testid="slime-settings"/)
assert.match(gamePage, /data-testid="slime-card-inspector"/)
// Silas, 2026-11-11 PT: "Practice is redundant ... change it entirely to Vs."
assert.match(gamePage, /data-testid="slime-vs-tab"/)
assert.doesNotMatch(gamePage, /data-testid="slime-clash-tab"|>\s*PRACTICE\s*</)
assert.match(gamePage, /<SlimeCityVs v-else-if="lab\.view === 'vs'"/)
assert.match(gamePage, /data-testid="slime-journey-tab"/)
assert.doesNotMatch(
  gamePage,
  /data-testid="slime-campaign-tab"|data-testid="slime-city-tab"/,
)
// Silas, 2026-11-08 PT: "we don't need the legacy modes, period."
assert.doesNotMatch(gamePage, /slime-legacy-toggle/)
assert.doesNotMatch(gamePage, /<SlimeCityArena|<SlimeCityAlleys/)
assert.doesNotMatch(gamePage, /v-if="legacyOpen"/)
assert.match(gamePage, /data-testid="slime-collection-tab"/)
assert.match(gamePage, /data-testid="slime-gallery-tab"/)
assert.match(gamePage, /data-testid="slime-rewards-tab"/)
assert.match(gamePage, /<SlimeCityClash v-else-if="lab\.view === 'clash'"/)
assert.doesNotMatch(gamePage, /Clash[^\n]*user\.isAdmin/)
assert.doesNotMatch(view, /clash-attack-boss/, 'no manual attack picking')
assert.match(view, /strikeClash/, 'board drives the automatic alley sweep')
const hand = readFileSync('components/slime-city-clash-hand.vue', 'utf8')
const cardFace = readFileSync(
  'components/slime-city-clash-card-face.vue',
  'utf8',
)
assert.match(view, /<SlimeCityClashHand/, 'Clash uses the floating fanned hand')
assert.doesNotMatch(
  view,
  /class="clash-tray"/,
  'the hand takes no layout space',
)
assert.match(
  view,
  /class="clash-hand-zone"/,
  'a fixed zone keeps the board still',
)
assert.match(view, /:data-clash-lane="lane"/, 'alleys accept dragged cards')
assert.match(hand, /data-testid="clash-hand-toggle"/, 'closed hand is an icon')
assert.match(hand, /:aria-expanded="isOpen"/)
assert.match(hand, /data-testid="clash-detail"/, 'tapped fighters show rules')
assert.match(hand, /cxh-deal-enter-active/, 'cards deal out of the icon')
assert.match(hand, /prefers-reduced-motion/)
assert.match(cardFace, /clashCardBadge/, 'hand cards show their effect')
assert.match(cardFace, /:fallback-image-id="[\s\S]*?slimeArtId\(\s*'crews'/)
assert.match(cardFace, /class="ccf-level"/, 'cards show their level')
assert.match(
  hand,
  /data-testid="clash-level-tabs"/,
  'players can preview upgraded versions',
)
assert.match(
  hand,
  /data-testid="clash-level-up"/,
  'playing a card shows level up',
)
assert.match(view, /class="clash-stars"/, 'fighters show their level')
assert.match(view, /<SlimeCityClashMoment :moment="spectacle"/)
assert.match(
  view,
  /commit\(strikeClash\(/,
  'strike VFX follows a committed command',
)
assert.match(view, /commit\(useClashPower\(/, 'general powers receive VFX')
// Silas, 2026-11-10 PT: "there should be an undo button if you are still on
// the same round". Undo replays the deal without your last play this turn.
assert.match(view, /data-testid="clash-undo"/)
assert.match(view, /replayClash\(/)
const desktopRailAt1440 = Math.min(21 * 16, Math.max(15 * 16, 1440 * 0.24))
assert.equal(desktopRailAt1440, 336, '1440px Clash sidebar is 336px wide')
assert.match(view, /--rail: clamp\(15rem, 24cqw, 21rem\)/)
assert.match(
  view,
  /\.clash-console-row \{[^}]*min-width: 0;/s,
  'control row must shrink within the desktop sidebar',
)
assert.match(
  view,
  /\.clash-console-row :deep\(\.sc-sound-word\) \{[^}]*display: none;/s,
  'desktop control strip uses the accessible sound icon, not its long label',
)
assert.match(
  view,
  /\.clash-console-row :deep\(\.sc-sound-toggle\) \{[^}]*flex: 0 0 2\.25rem;/s,
  'sound toggle has a bounded desktop width',
)
assert.match(
  view,
  /\.clash-console-row \.clash-reset,[\s\S]*?\.clash-console-row \.clash-pass \{[^}]*min-width: 0;/,
  'undo and fight controls can shrink rather than overflowing the rail',
)
const browserLayoutAudit = readFileSync(
  new URL('./auditSlimeCityClashLayout.mjs', import.meta.url),
  'utf8',
)
const responsiveWorkflow = readFileSync(
  new URL(
    '../../.github/workflows/responsive-layout-audit.yml',
    import.meta.url,
  ),
  'utf8',
)
for (const width of [390, 768, 1440])
  assert.match(
    browserLayoutAudit,
    new RegExp('width: ' + width),
    'real-browser Clash audit covers ' + width + 'px',
  )
assert.match(browserLayoutAudit, /getByTestId\('slime-vs-fight-cpu'\)/)
assert.match(browserLayoutAudit, /getBoundingClientRect\(\)/)
assert.match(browserLayoutAudit, /row\.scrollWidth <= row\.clientWidth/)
assert.match(browserLayoutAudit, /tapBox\.right <= fightBox\.left/)
assert.match(browserLayoutAudit, /withTap of \[false, true\]/)
// Match over: three result controls replace UNDO and FIGHT. They wrap on the
// rail and take their own strip on phones; the audit measures both states.
assert.match(
  view,
  /class="clash-layout" :class="\{ 'is-over': !!game\.victor \}"/,
  'the layout knows when the match is over',
)
assert.match(
  view,
  /class="clash-console-row"\s+:class="\{ 'is-over': !!game\.victor \}"/,
  'the control row knows when the match is over',
)
assert.match(
  view,
  /\.clash-console-row\.is-over \{[^}]*flex-wrap: wrap;/s,
  'result controls wrap on the rail instead of clipping',
)
assert.match(
  view,
  /\.clash-console-row\.is-over \.clash-reset \{[^}]*white-space: normal;/s,
  'a long result label takes a second line',
)
assert.match(
  view,
  /\.clash-layout\.is-over \{[^}]*'me me'\s+'console console'/s,
  'on phones the result controls get their own full-width strip',
)
assert.match(
  view,
  /Math\.max\(0, game\.boss\[side\]\)/,
  'a boss knocked below zero reads 0',
)
assert.match(browserLayoutAudit, /function measureResultControls\(\)/)
// A held card must not stand on an alley it can be played to, and the rail
// must fit a laptop: both were only reachable by measuring a real browser.
assert.match(browserLayoutAudit, /function measureHeldCard\(\)/)
assert.match(
  browserLayoutAudit,
  /el\.scrollWidth > el\.clientWidth \+ tolerance/,
  'the audit fails when any in-play control clips its label',
)
assert.match(
  view,
  /\.clash-console-row:has\(\.clash-tap\) \.clash-undo-word \{\s*display: none;/,
  'with TAP on the rail UNDO keeps only its arrow',
)
assert.match(browserLayoutAudit, /function measureRail\(\)/)
for (const size of [
  '1440, height: 780',
  '1366, height: 768',
  '1280, height: 720',
])
  assert.ok(
    browserLayoutAudit.includes('width: ' + size),
    'the audit measures the rail at laptop height ' + size,
  )
assert.match(
  view,
  /\.clash-boss \{[^}]*min-height: auto;/s,
  'a boss panel never shrinks under its life line and crew powers',
)
assert.match(
  view,
  /@container clash \(max-height: 32rem\)[^{]*\{\s*\.clash-portrait \{\s*min-height: 0;/s,
  'on the shortest wide screens the portraits step aside',
)
assert.match(
  hand,
  /@container clash not \(\(max-width: 46rem\) or \(max-aspect-ratio: 1 \/ 1\)\) \{\s*\.cxh-card\.big \{\s*--y: calc\(var\(--W\) \* 1\.5 - 88cqh\);/s,
  'on the wide layout a held card rises off your alleys',
)
assert.match(browserLayoutAudit, /playMatch\(page, clickActivate/)
assert.match(browserLayoutAudit, /for \(const state of \['report', 'board'\]\)/)
assert.match(
  responsiveWorkflow,
  /KR_AUDIT_USERNAME: \$\{\{ secrets\.KR_AUDIT_USERNAME \}\}/,
  'the scheduled audit signs in with the non-admin audit account when set',
)
assert.match(
  responsiveWorkflow,
  /npm run audit:slime-city-clash-layout -- --base/,
  'the scheduled real-browser audit exercises Clash controls',
)
{
  const opening = createClash('catgirls', 'riot', 4242)
  const card = opening.hands.player.find((id) =>
    [0, 1, 2, 3, 4].some((lane) => canClashPlay(opening, 'player', id, lane)),
  )!
  const lane = [0, 1, 2, 3, 4].find((l) =>
    canClashPlay(opening, 'player', card, l),
  )!
  const played = playClash(opening, 'player', card, lane)
  assert.notEqual(played, opening)
  const undone = replayClash(
    'catgirls',
    'riot',
    4242,
    played.commands.slice(0, -1),
  )
  assert.deepEqual(undone, opening, 'undo restores the exact earlier state')
  assert.deepEqual(
    playClash(undone, 'player', card, lane),
    played,
    'replaying the same play gives the same result',
  )
}
// A clicked card or fighter stays pinned with its level tabs: hover previews
// never replace it (Silas, 2026-11-10 PT).
assert.match(
  hand,
  /if \(props\.held !== null \|\| \(props\.inspect && !props\.inspect\.hover\)\)/,
)
const spectacleFace = readFileSync(
  'components/slime-city-clash-moment.vue',
  'utf8',
)
assert.match(spectacleFace, /<SlimeCityArtwork/, 'spectacle uses real card art')
assert.match(spectacleFace, /data-testid="clash-spectacle"/)
assert.match(
  spectacleFace,
  /prefers-reduced-motion/,
  'spectacle respects reduced motion',
)
assert.match(
  spectacleFace,
  /pointer-events: none/,
  'VFX do not steal lane taps',
)
assert.match(
  spectacleFace,
  /scx-legend/,
  'level-three moments are visually distinct',
)
assert.match(spectacleFace, /scx-effect-heal/, 'healing has a dedicated look')
assert.match(
  spectacleFace,
  /scx-effect-blast/,
  'explosions have a dedicated look',
)
assert.match(
  spectacleFace,
  /scx-effect-summon/,
  'summons have a dedicated look',
)

assert.match(cardFace, /clashCardText/, 'selected cards show their rules')
assert.match(view, /@keyframes clash-lunge-up/)
assert.match(view, /prefers-reduced-motion/)
assert.match(view, /chooseClashCpu/)
assert.match(view, /clashEffectivePlayCost/)
assert.doesNotMatch(view, /class="clash-top"/)
assert.doesNotMatch(view, /\? RULES/)
assert.doesNotMatch(view, /THE PITWORKS · MAIN EVENT/)
assert.match(view, /slimeArtId\('boards', 'pitworks-blackout'\)/)
const nav = readFileSync('components/navigation/channel-select.vue', 'utf8')
assert.doesNotMatch(nav, /slime-nav-title/)
assert.match(nav, /\{\{ currentPageTitle \}\}/)
assert.match(nav, /v-if="currentPageSubtitle"/)
const artwork = readFileSync('components/slime-city-artwork.vue', 'utf8')
assert.match(artwork, /fallbackImageId/)
const artStore = readFileSync('stores/slimeCityArt.ts', 'utf8')
assert.match(artStore, /headers: token \? \{ Authorization:/)
assert.doesNotMatch(
  artStore,
  /if \(!token \|\| images.value\[artImageId\]\) return/,
)

assert.equal(CLASH_PLAYS, 2)
assert.equal(CLASH_LANES, 5)
assert.equal(CLASH_DECK_SIZE, 20)
assert.equal(CLASH_HAND_SIZE, 5)
for (const team of TEAMS) {
  const deck = alleyDeck(team.id)
  const clashOnly = clashDeck(team.id)
  assert.equal(clashOnly.length, 20, 'Clash retains 20 cards')
  assert.equal(new Set(clashOnly).size, 20, 'Clash has distinct IDs')
  // The crafted-evolution pilot deck is twenty of one faction by design.
  assert.equal(
    clashOnly.filter((id) => cardById(id).team === 'mercenary').length,
    CLASH_CRAFTED_DECKS[team.id] ? 0 : 1,
    'each standard crew has one accessible mercenary guest',
  )
  assert.equal(deck.length, 20, team.name + ' 20-card deck')
  assert.equal(new Set(deck).size, 20, team.name + ' distinct cards')
  for (const id of deck) {
    const card = cardById(id)
    assert.ok(card.team === team.id || card.team === 'mercenary')
  }
}
for (const card of CARDS) {
  for (let level = 1; level <= CLASH_MAX_LEVEL; level++) {
    const b = clashBalance(card, level)
    assert.equal(b.level, level)
    assert.ok(b.plays === 1 || b.plays === 2)
    if (card.kind === 'creature') {
      const nonattacker =
        level === 3 &&
        ['calico', 'watcher', 'merc-roof-dentist'].includes(card.id)
      const hatchling =
        level === 1 && ['chimera', 'juggernaut'].includes(card.id)
      const clawSupport =
        ['shredders', 'choker', 'spurs', 'ninthlife'].includes(card.id) &&
        level < 3
      assert.ok(
        nonattacker
          ? b.attack === 0
          : hatchling || clawSupport
            ? b.attack === 1
            : b.attack >= 2 && b.attack <= (b.plays === 2 ? 8 : 6),
        card.id,
      )
      assert.ok(b.hp >= 2 && b.hp <= (b.plays === 2 ? 22 : 16), card.id)
      assert.ok(b.armor >= 0 && b.armor <= 1)
      for (const k of card.keywords ?? [])
        assert.ok(
          clashCardText(card, level).includes(CLASH_TRAIT_TEXT[k]),
          card.id + k,
        )
    } else assert.ok(b.power >= 1 && b.power <= 12, card.id)
    const badge = clashCardBadge(card, level)
    assert.ok(badge.length > 0 && badge.length < 16, card.id)
    assert.ok(
      !/\bAP\b|\bmana\b|\bmovement\b/i.test(clashCardText(card, level)),
      card.id,
    )
  }
  const low = clashBalance(card, 1)
  const high = clashBalance(card, CLASH_MAX_LEVEL)
  // Silas, 2026-11-07 PT: "there needs to be real ramping of power between
  // levels 1-3. we want it to be appealing to upgrade in most cases."
  if (card.kind === 'creature') {
    const value = (lv: number): number => {
      const b = clashBalance(card, lv)
      return b.attack * 2 + b.hp
    }
    if (['calico', 'watcher', 'merc-roof-dentist'].includes(card.id)) {
      assert.equal(high.attack, 0, card.id + ' becomes a genuine nonattacker')
      assert.ok(high.hp > low.hp, card.id + ' gains real durability')
      assert.match(clashCardText(card, 3), /Never attacks/)
    } else if (
      Object.values(CLASH_EVOLUTIONS[card.id]?.stats?.[3] ?? {}).some(
        (n) => n < 0,
      )
    ) {
      // Approved rare exception (Silas, 2026-11-08 PT): a crafted early
      // bloomer trades body for a big level-three arrival.
      assert.ok(value(2) > value(1), card.id + ' still ramps to level 2')
      assert.ok(clashEvolutionStage(card.id, 3), card.id + ' L3 does more')
    } else {
      assert.ok(value(1) < value(2) && value(2) < value(3), card.id + ' ramps')
      assert.ok(
        value(3) >= value(1) * 1.6,
        card.id + ' level 3 is a big upgrade',
      )
    }
  } else assert.ok(high.power > low.power || high.bonus > low.bonus, card.id)
  const faces = [1, 2, 3].map(
    (lv) => clashCardText(card, lv) + '|' + clashCardBadge(card, lv),
  )
  assert.ok(
    faces[0] !== faces[1] && faces[1] !== faces[2],
    card.id + ' visibly improves at every level',
  )
  // Silas, 2026-11-07 PT: no power/toughness or next-level stats in the text.
  for (let level = 1; level <= CLASH_MAX_LEVEL; level++) {
    const text = clashCardText(card, level)
    assert.doesNotMatch(text, /Levels up|Max level|next level/i, card.id)
    assert.doesNotMatch(text, /Costs both card plays|Strikes straight/, card.id)
    if (card.kind === 'creature')
      assert.doesNotMatch(text, /\d+ power, \d+ life/, card.id)
    assert.ok(text.length <= 160, card.id + ' text stays short')
  }
}
assert.ok(
  CARDS.length >= 300,
  'the entire published roster gets Clash balancing',
)
assert.equal(clashPlayCost(cardById('lynx')), 1)
assert.equal(
  Object.keys(CLASH_TWISTS).length,
  70,
  'the first 70 curated evolution arcs are playable',
)
// Stat-only fighter evolutions belong on the combat badges, not in filler prose.
function evolutionFace(card: ReturnType<typeof cardById>, level: number) {
  const rules = clashCardText(card, level)
  return card.kind === 'creature'
    ? rules + '|' + clashCardBadge(card, level)
    : rules
}
for (const id of Object.keys(CLASH_TWISTS)) {
  const card = cardById(id)
  assert.ok(
    [
      'catgirls',
      'bloodfairies',
      'ironjaw',
      'riot',
      'undertow',
      'exchange',
      'mercenary',
    ].includes(card.team),
  )
  assert.ok(
    new Set([1, 2, 3].map((lv) => evolutionFace(card, lv))).size === 3,
    id + ' meaningful evolution face',
  )
}

const initial = createClash('catgirls', 'ironjaw', 42)
assert.deepEqual(initial, createClash('catgirls', 'ironjaw', 42))
assert.equal(initial.hands.player.length, CLASH_HAND_SIZE)
assert.equal(initial.hands.enemy.length, 0, 'rival draws only on its turn')
assert.equal(initial.decks.player.length, CLASH_DECK_SIZE - CLASH_HAND_SIZE)
assert.equal(initial.phase, 'play')
assert.equal(initial.active, 'player')
assert.equal(initial.boss.player, CLASH_BOSS_HP)
assert.equal(
  initial.boss.enemy,
  CLASH_BOSS_HP + CLASH_SECOND_SEAT_BONUS,
  'the second seat starts with a boss-life coin',
)
assert.equal(clashBossMax('enemy'), CLASH_BOSS_HP + CLASH_SECOND_SEAT_BONUS)

const heavy = CARDS.find(
  (c) =>
    c.team === 'catgirls' && c.kind === 'creature' && clashPlayCost(c) === 2,
)!
assert.ok(heavy, 'catgirls have a two-play signature follower')
// Silas, 2026-11-07 PT: "first player should only get one card play, not two."
const opener = createClash('catgirls', 'ironjaw', 3)
assert.equal(
  clashPlayLimit(opener, 'player'),
  1,
  'first player opens with one play',
)
const heavyCard = CARDS.find(
  (c) =>
    c.team === 'catgirls' && c.kind === 'creature' && clashPlayCost(c) === 2,
)!
opener.hands.player = [heavyCard.id, 'calico', 'splice-runner']
assert.equal(
  canClashPlay(opener, 'player', heavyCard.id, 0),
  false,
  'no two-play card on the opening turn',
)
// Opening-hand guarantee (slime-city/t-028): an all-heavy opening hand may
// spend its single play on one power card instead of being a forced pass.
const stuck = createClash('catgirls', 'ironjaw', 3)
stuck.hands.player = [heavyCard.id]
assert.equal(clashPlayLimit(stuck, 'player'), 2, 'stuck opener gets both slots')
assert.equal(
  canClashPlay(stuck, 'player', heavyCard.id, 0),
  true,
  'an all-heavy opening hand can play one power card',
)
const stuckOpened = playClash(stuck, 'player', heavyCard.id, 0)
assert.equal(stuckOpened.phase, 'attack', 'still exactly one opening card')
assert.equal(stuckOpened.plays.player, 2)
assert.equal(clashPlayLimit(stuckOpened, 'player'), 2)
for (const crew of [
  'catgirls',
  'bloodfairies',
  'ironjaw',
  'riot',
  'undertow',
  'exchange',
] as const) {
  let dead = 0
  for (let seed = 1; seed <= 400; seed++) {
    const g = createClash(
      crew,
      crew === 'catgirls' ? 'ironjaw' : 'catgirls',
      seed,
    )
    if (
      !g.hands.player.some((id) =>
        [0, 1, 2, 3, 4].some((lane) => canClashPlay(g, 'player', id, lane)),
      )
    )
      dead++
  }
  assert.ok(
    dead <= 2,
    crew + ' starter opens with no legal play in ' + dead + '/400',
  )
}
const opened = playClash(opener, 'player', 'calico', 0)
assert.equal(opened.phase, 'attack', 'one play ends the opening placement')
assert.equal(canClashPlay(opened, 'player', 'splice-runner', 1), false)
const rivalOpening = finishTurn(opened)
assert.equal(rivalOpening.active, 'enemy')
assert.equal(clashPlayLimit(rivalOpening, 'enemy'), 2, 'the rival plays two')
const secondRound = finishTurn(rivalOpening)
assert.equal(secondRound.round, 2)
assert.equal(clashPlayLimit(secondRound, 'player'), 2, 'two plays from round 2')

const special = createClash('catgirls', 'ironjaw', 4)
special.round = 2
special.hands.player = [heavy.id, 'lynx']
const paid = playClash(special, 'player', heavy.id, 0)
assert.equal(paid.plays.player, 2)
assert.equal(paid.phase, 'attack', 'a special consumes both plays')
assert.equal(paid.units.length, 1)
assert.equal(canClashPlay(paid, 'player', 'lynx', 1), false)
assert.equal(playClash(paid, 'player', 'lynx', 1), paid)

const normal = createClash('catgirls', 'ironjaw', 6)
normal.round = 2
normal.hands.player = ['calico', 'splice-runner']
const first = playClash(normal, 'player', 'calico', 0)
assert.equal(first.plays.player, 1)
assert.equal(first.phase, 'play')
assert.equal(first.active, 'player', 'both placements belong to same turn')
const second = playClash(first, 'player', 'splice-runner', 1)
assert.equal(second.plays.player, 2)
assert.equal(second.phase, 'attack', 'the second play starts the alley sweep')
assert.equal(second.cursor, 0)
assert.equal(
  nextClashStrike(second, 'player'),
  -1,
  'summoning sickness: fighters wait a turn before striking',
)
assert.equal(
  endClashTurn(second, 'player').active,
  'enemy',
  'with no ready strikes the turn can end',
)

// Solforge-style leveling: playing a card brings it back one level stronger.
const leveling = createClash('catgirls', 'ironjaw', 8)
leveling.hands.player = ['lynx', 'mau']
assert.equal(clashLevel(leveling, 'player', 'lynx'), 1)
const leveled = playClash(leveling, 'player', 'lynx', 0)
assert.equal(clashLevel(leveled, 'player', 'lynx'), 2, 'played cards level up')
assert.equal(leveled.units[0]!.level, 1, 'the fighter on the board is level 1')
assert.equal(clashLevel(leveled, 'enemy', 'lynx'), 1, 'levels are per crew')
assert.ok(leveled.log.some((x) => /levels up to 2/.test(x.text)))
const veteran = createClash('catgirls', 'ironjaw', 9)
veteran.levels.player.lynx = CLASH_MAX_LEVEL
veteran.hands.player = ['lynx']
const maxed = playClash(veteran, 'player', 'lynx', 1)
assert.equal(clashLevel(maxed, 'player', 'lynx'), CLASH_MAX_LEVEL, 'caps at 3')
assert.equal(
  maxed.units[0]!.maxHp,
  clashBalance(cardById('lynx'), CLASH_MAX_LEVEL).hp,
)
assert.ok(
  maxed.units[0]!.attack > clashBalance(cardById('lynx'), 1).attack,
  'a level-3 fighter hits harder than its level-1 debut',
)

const lanes = createClash('catgirls', 'ironjaw', 11)
lanes.phase = 'attack'
lanes.units = [
  follower('player', 0, 1, 4, 3),
  follower('enemy', 0, 2, 3, 2),
  follower('player', 2, 3, 4, 2),
  follower('enemy', 4, 4, 5, 2),
]
assert.equal(nextClashStrike(lanes, 'player'), 0, 'sweep starts at alley 1')
assert.equal(
  endClashTurn(lanes, 'player'),
  lanes,
  'cannot skip pending alley strikes',
)
const struck = strikeClash(lanes, 'player')
assert.equal(struck.strike?.lane, 0)
assert.equal(struck.strike?.target, 'unit')
assert.equal(struck.strike?.dealt, 3)
assert.equal(struck.strike?.returned, 2, 'blocker strikes back at once')
assert.equal(struck.strike?.defenderFell, true)
assert.equal(struck.units.length, 3, 'defender fell from three power')
assert.equal(
  struck.units.find((u) => u.uid === 1)!.hp,
  2,
  'attacker simultaneously took two counter damage',
)
assert.equal(
  struck.units.find((u) => u.uid === 4)!.hp,
  5,
  'fighters in other alleys are never targeted',
)
assert.equal(nextClashStrike(struck, 'player'), 2, 'sweep moves left to right')
const face = strikeClash(struck, 'player')
assert.equal(face.strike?.target, 'boss')
assert.equal(face.boss.enemy, clashBossMax('enemy') - 2)
assert.ok(face.log.some((x) => x.kind === 'boss'))
assert.equal(nextClashStrike(face, 'player'), -1)
assert.equal(strikeClash(face, 'player'), face)
assert.equal(endClashTurn(face, 'player').active, 'enemy')

const brawl = createClash('catgirls', 'ironjaw', 12)
brawl.phase = 'attack'
brawl.units = [
  { ...follower('player', 1, 1, 4, 2), fresh: true },
  follower('enemy', 1, 2, 4, 2),
]
assert.equal(
  nextClashStrike(brawl, 'player'),
  -1,
  'a fresh fighter blocks but does not strike, even with a blocker across',
)
brawl.units[0]!.keywords = ['ambush']
assert.equal(
  nextClashStrike(brawl, 'player'),
  1,
  'Ambush lets a fighter strike the turn it lands',
)
const ambushDebut = createClash('catgirls', 'ironjaw', 16)
ambushDebut.round = 2
ambushDebut.hands.player = ['lynx', 'calico']
const ambushed = playClash(
  playClash(ambushDebut, 'player', 'lynx', 0),
  'player',
  'calico',
  1,
)
assert.equal(nextClashStrike(ambushed, 'player'), 0, 'fresh Ambush strikes')
const afterAmbush = strikeClash(ambushed, 'player')
assert.equal(afterAmbush.strike?.target, 'boss')
assert.equal(
  nextClashStrike(afterAmbush, 'player'),
  -1,
  'the fresh non-Ambush fighter waits',
)

const healing = createClash('catgirls', 'ironjaw', 13)
healing.phase = 'attack'
healing.units = [follower('player', 2, 1, 5, 3), follower('enemy', 4, 2, 5, 2)]
healing.units[0]!.hp = 2
healing.units[1]!.hp = 3
const recovered = finishRound(healing)
assert.equal(recovered.round, 2)
assert.equal(recovered.units[0]!.hp, 2, 'damage sticks between rounds')
assert.equal(recovered.units[1]!.hp, 3, 'rival damage sticks too')
const regen = createClash('catgirls', 'ironjaw', 14)
regen.phase = 'attack'
regen.units = [
  { ...follower('player', 2, 1, 5, 3), hp: 2, keywords: ['regen'] },
  { ...follower('enemy', 4, 2, 5, 2), hp: 3, keywords: ['regen'] },
]
const patched = finishRound(regen)
assert.equal(patched.units[0]!.hp, 3, 'Regen recovers exactly one')
assert.equal(patched.units[1]!.hp, 4, 'rival Regen recovers one')
assert.equal(recovered.boss.enemy, clashBossMax('enemy') - 3)
assert.equal(recovered.boss.player, CLASH_BOSS_HP - 2)
assert.equal(recovered.hands.player.length, 5)
assert.equal(recovered.hands.enemy.length, 0)

const expiring = createClash('catgirls', 'ironjaw', 15)
const originalHand = [...expiring.hands.player]
const afterPlayer = finishTurn(expiring)
assert.deepEqual(
  afterPlayer.hands.player,
  [],
  'unplayed cards discarded, no carryover',
)
assert.equal(afterPlayer.discards.player.length, 5)
assert.ok(originalHand.every((id) => afterPlayer.discards.player.includes(id)))
assert.equal(afterPlayer.active, 'enemy')
assert.equal(afterPlayer.hands.enemy.length, 5)
const afterRival = finishTurn(afterPlayer)
assert.equal(afterRival.hands.player.length, 5, 'new random hand next round')
assert.ok(afterRival.hands.player.every((id) => !originalHand.includes(id)))
assert.equal(afterRival.hands.enemy.length, 0)

const replace = createClash('catgirls', 'ironjaw', 17)
replace.hands.player = ['lynx']
replace.units = [follower('player', 0, 99)]
const swapped = playClash(replace, 'player', 'lynx', 0)
assert.equal(swapped.units.length, 1)
assert.notEqual(swapped.units[0]!.uid, 99)
assert.ok(swapped.discards.player.includes('lynx'))

const trap = createClash('catgirls', 'ironjaw', 18)
trap.traps = [{ side: 'enemy', lane: 0, cardId: 'shocktrap', level: 1 }]
trap.hands.player = ['lynx']
const sprung = playClash(trap, 'player', 'lynx', 0)
assert.equal(sprung.traps.length, 0)
assert.ok(
  sprung.units.length === 0 || sprung.units[0]!.hp < sprung.units[0]!.maxHp,
  'trap springs on a fighter landing across it',
)

const tripwire = createClash('catgirls', 'ironjaw', 21)
tripwire.phase = 'attack'
tripwire.units = [follower('player', 3, 1, 9, 3)]
tripwire.traps = [{ side: 'enemy', lane: 3, cardId: 'shocktrap', level: 1 }]
const tripped = strikeClash(tripwire, 'player')
assert.equal(tripped.traps.length, 0, 'unblocked strike springs the trap')
assert.equal(tripped.boss.enemy, clashBossMax('enemy'), 'the trap eats the hit')
assert.ok(tripped.units[0]!.hp < 9)

const rooted = createClash('catgirls', 'ironjaw', 19)
rooted.phase = 'attack'
rooted.units = [
  { ...follower('player', 1, 1), rooted: true },
  follower('enemy', 1, 2),
]
assert.equal(nextClashStrike(rooted, 'player'), -1, 'stunned fighter skips')
const afterRoot = finishTurn(rooted)
assert.equal(
  afterRoot.units[0]!.rooted,
  false,
  'root clears after affected turn',
)
assert.equal(afterRoot.active, 'enemy')

// Version-specific ability acceptance: setup, payoff, counter and replay-safe state.
const hatched = createClash('catgirls', 'ironjaw', 221)
hatched.round = 2
hatched.levels.player.chimera = 3
hatched.hands.player = ['chimera']
const apex = playClash(hatched, 'player', 'chimera', 2)
assert.ok(apex.units[0]!.attack >= 7, 'Madame Chimera becomes an apex threat')
assert.ok(
  clashBalance(cardById('chimera'), 1).attack < 2,
  'apex starts fragile',
)

const chorus = createClash('bloodfairies', 'ironjaw', 222)
chorus.round = 2
chorus.levels.player.sprite = 3
chorus.hands.player = ['sprite']
const joined = playClash(chorus, 'player', 'sprite', 2)
assert.equal(
  joined.units.length,
  3,
  'L3 Bloodsprite fills both adjacent empty alleys',
)
assert.equal(joined.units.filter((u) => u.token).length, 2)
assert.deepEqual(joined.units.map((u) => u.lane).sort(), [1, 2, 3])
assert.equal(joined.hands.player.length, 0, 'tokens cost no extra cards')
const occupied = createClash('bloodfairies', 'ironjaw', 223)
occupied.round = 2
occupied.levels.player.sprite = 3
occupied.hands.player = ['sprite']
occupied.units = [follower('player', 1, 80)]
assert.equal(
  playClash(occupied, 'player', 'sprite', 2).units.length,
  3,
  'no overwrite of occupied allied alley',
)

const medics = createClash('catgirls', 'ironjaw', 224)
medics.phase = 'attack'
medics.units = [
  { ...follower('player', 1, 1, 7, 0), cardId: 'calico', attack: 0, level: 3 },
  { ...follower('player', 2, 2, 9, 3), hp: 2 },
]
assert.equal(clashPower(medics, medics.units[0]!), 0)
assert.equal(
  nextClashStrike(medics, 'player'),
  2,
  'the medic blocks but never attacks',
)
const treated = finishRound(medics)
assert.equal(
  treated.units.find((u) => u.uid === 2)?.hp,
  4,
  'L3 clinic heals neighbor for two',
)

const band = createClash('bloodfairies', 'ironjaw', 225)
band.units = [
  { ...follower('player', 1, 1), cardId: 'queen', level: 3 },
  { ...follower('player', 4, 2), cardId: 'sprite', keywords: ['swarm'] },
]
assert.equal(
  clashPower(band, band.units[1]!),
  3,
  'L3 queen gives a global ally anthem',
)
const spy = createClash('undertow', 'ironjaw', 226)
spy.units = [
  { ...follower('player', 1, 1), cardId: 'watcher', level: 3, attack: 0 },
  follower('enemy', 2, 2),
]
assert.equal(
  clashPower(spy, spy.units[1]!),
  1,
  'L3 watcher weakens adjacent rivals',
)

const transferred = createClash('exchange', 'ironjaw', 227)
transferred.round = 2
transferred.levels.player.broker = 3
transferred.hands.player = ['broker']
transferred.units = [follower('player', 2, 99)]
const bought = playClash(transferred, 'player', 'broker', 2)
assert.equal(bought.units.length, 1, 'broker must sacrifice an occupied ally')
assert.ok(bought.units[0]!.attack > clashBalance(cardById('broker'), 3).attack)
assert.ok(bought.units[0]!.maxHp > clashBalance(cardById('broker'), 3).hp)

const fallenRat = createClash('riot', 'ironjaw', 228)
fallenRat.round = 2
fallenRat.phase = 'attack'
fallenRat.units = [
  { ...follower('player', 1, 1, 2, 3), cardId: 'rat', hp: 1, level: 2 },
  { ...follower('enemy', 1, 2, 10, 3) },
]
const ratAfter = strikeClash(fallenRat, 'player')
assert.equal(ratAfter.deathMarks.player.rat, 1, 'knockout is remembered')
ratAfter.phase = 'play'
ratAfter.plays.player = 0
ratAfter.hands.player = ['rat']
const ratAgain = playClash(ratAfter, 'player', 'rat', 2)
assert.equal(
  ratAgain.units.find((u) => u.side === 'player')?.attack,
  clashBalance(cardById('rat'), 1).attack + 1,
  'a replayed rat is stronger specifically because it died',
)

const unpredictable = createClash('riot', 'ironjaw', 229)
unpredictable.phase = 'attack'
unpredictable.units = [
  { ...follower('player', 1, 1, 6, 3), cardId: 'firebrand', level: 2 },
  { ...follower('enemy', 1, 2, 12, 2) },
]
const rolled = strikeClash(unpredictable, 'player')
assert.ok(
  rolled.log.some((x) =>
    /Firebrand Dolly (misfires|doubles her fire)/.test(x.text),
  ),
  'RNG resolution is legible',
)
const sameRoll = strikeClash(structuredClone(unpredictable), 'player')
assert.deepEqual(
  sameRoll,
  rolled,
  'the same seeded Firebrand situation always rolls identically',
)

// Combat choreography is a pure projection of committed gameplay commands.
const theater = createClash('catgirls', 'ironjaw', 811)
theater.hands.player = ['lynx']
const firstEntry = playClash(theater, 'player', 'lynx', 1)
assert.equal(clashSpectacle(theater, firstEntry)?.kind, 'play')
assert.equal(clashSpectacle(theater, firstEntry)?.grade, 'flash')
assert.equal(
  clashSpectacle(firstEntry, firstEntry),
  null,
  'no duplicate cue on rerender',
)
assert.deepEqual(
  clashSpectacle(theater, firstEntry),
  clashSpectacle(structuredClone(theater), structuredClone(firstEntry)),
  'same commands produce identical spectacle cues',
)
const marquee = createClash('catgirls', 'ironjaw', 812)
marquee.round = 2
marquee.levels.player.chimera = 3
marquee.hands.player = ['chimera']
const showcaseApex = playClash(marquee, 'player', 'chimera', 2)
assert.equal(clashSpectacle(marquee, showcaseApex)?.grade, 'legend')
assert.match(clashSpectacle(marquee, showcaseApex)?.eyebrow ?? '', /FINAL FORM/)
assert.equal(clashSpectacle(marquee, showcaseApex)?.cardId, 'chimera')
const nursery = createClash('bloodfairies', 'ironjaw', 813)
nursery.round = 2
nursery.levels.player.sprite = 2
nursery.hands.player = ['sprite']
const dancers = playClash(nursery, 'player', 'sprite', 2)
assert.equal(clashSpectacle(nursery, dancers)?.grade, 'feature')
assert.match(
  clashSpectacle(nursery, dancers)?.detail ?? '',
  /fighters take the field/,
)
const firefight = createClash('catgirls', 'ironjaw', 814)
firefight.phase = 'attack'
firefight.units = [
  follower('player', 0, 101, 7, 6),
  follower('enemy', 0, 102, 2, 2),
]
const critical = strikeClash(firefight, 'player')
assert.equal(clashSpectacle(firefight, critical)?.kind, 'strike')
assert.equal(clashSpectacle(firefight, critical)?.grade, 'feature')
assert.equal(clashSpectacle(firefight, critical)?.eyebrow, 'KNOCKOUT')
const bossBattle = createClash('catgirls', 'ironjaw', 815)
bossBattle.phase = 'attack'
bossBattle.boss.enemy = 4
bossBattle.units = [follower('player', 0, 103, 8, 5)]
const finisher = strikeClash(bossBattle, 'player')
assert.equal(clashSpectacle(bossBattle, finisher)?.kind, 'victory')
assert.equal(clashSpectacle(bossBattle, finisher)?.grade, 'legend')
assert.equal(clashSpectacle(bossBattle, finisher)?.title, 'VICTORY!')
// The banner title is the player's result: a rival finishing blow is a
// DEFEAT, and the boss it dropped below zero reads as 0, not a negative.
const lastRound = createClash('catgirls', 'ironjaw', 815)
lastRound.phase = 'attack'
lastRound.active = 'enemy'
lastRound.boss.player = 4
lastRound.units = [follower('enemy', 0, 105, 8, 5)]
const rivalFinisher = strikeClash(lastRound, 'enemy')
assert.equal(rivalFinisher.victor, 'enemy')
assert.ok(rivalFinisher.boss.player < 0, 'the fixture overkills the boss')
const rivalMoment = clashSpectacle(lastRound, rivalFinisher)
assert.equal(rivalMoment?.kind, 'victory')
assert.equal(rivalMoment?.eyebrow, 'FINISHING BLOW')
assert.equal(rivalMoment?.title, 'DEFEAT')
assert.equal(
  rivalMoment?.detail,
  'Boss health: 0 to ' + rivalFinisher.boss.enemy,
)
const hazard = createClash('catgirls', 'ironjaw', 816)
hazard.phase = 'attack'
hazard.units = [follower('player', 3, 104, 9, 3)]
hazard.traps = [{ side: 'enemy', lane: 3, cardId: 'shocktrap', level: 1 }]
const sprungHazard = strikeClash(hazard, 'player')
assert.equal(clashSpectacle(hazard, sprungHazard)?.eyebrow, 'TRAP SPRUNG')
assert.equal(clashSpectacle(hazard, sprungHazard)?.cardId, 'shocktrap')
const general = createClash('catgirls', 'ironjaw', 817)
const generalAfter = structuredClone(general)
generalAfter.commands.push({ t: 'power', side: 'player', lane: 2 })
assert.equal(clashSpectacle(general, generalAfter)?.kind, 'power')
assert.equal(clashSpectacle(general, generalAfter)?.grade, 'legend')
assert.equal(clashSpectacle(nursery, dancers)?.effect, 'summon')
assert.equal(clashSpectacle(hazard, sprungHazard)?.effect, 'trap')
assert.equal(clashSpectacle(general, generalAfter)?.effect, 'power')
const healingShow = createClash('catgirls', 'ironjaw', 818)
healingShow.round = 2
healingShow.hands.player = ['reknit']
healingShow.units = [{ ...follower('player', 1, 111, 9, 2), hp: 3 }]
const healedShow = playClash(healingShow, 'player', 'reknit', 1)
assert.equal(clashSpectacle(healingShow, healedShow)?.effect, 'heal')
const fireworksShow = createClash('riot', 'ironjaw', 819)
fireworksShow.round = 2
fireworksShow.hands.player = ['firestorm']
fireworksShow.units = [follower('enemy', 1, 112, 9, 2)]
const explodedShow = playClash(fireworksShow, 'player', 'firestorm', 1)
assert.equal(clashSpectacle(fireworksShow, explodedShow)?.effect, 'blast')

// Second-wave experiential evolution: 24 additional existing cards, all real
// deterministic rules. A named L3 must change the board, not just the badge.
const evoIds = [
  'lynx',
  'pounce',
  'reknit',
  'laser',
  'pogo',
  'razor',
  'mosh',
  'scrapper',
  'bulldozer',
  'plating',
  'bomber',
  'kaboom',
  'confetti',
  'eel',
  'oracle',
  'tripwire',
  'sonar',
  'repo',
  'mogul',
  'handshake',
  'foreclosure',
  'merc-debt-slug',
  'merc-fungal-bouncer',
  'merc-discount-angel',
]
for (const id of evoIds) {
  const card = cardById(id)
  assert.ok(CLASH_TWISTS[id], id + ' has authored stage text')
  const stages = [1, 2, 3].map((level) => clashCardText(card, level))
  assert.ok(
    stages.every(
      (line, index) =>
        (index === 0 && card.kind === 'creature') || line.length > 12,
    ),
    id + ' has useful instructions',
  )
  assert.equal(
    new Set([1, 2, 3].map((lv) => evolutionFace(card, lv))).size,
    3,
    id + ' has three distinct faces',
  )
}
function evolved(
  team: Parameters<typeof createClash>[0],
  id: string,
  level = 3,
) {
  const s = createClash(team, 'ironjaw', 840 + evoIds.indexOf(id))
  s.round = 2
  s.levels.player[id] = level
  s.hands.player = [id]
  s.boss.player = 30
  return s
}
const lynxNext = playClash(evolved('catgirls', 'lynx'), 'player', 'lynx', 2)
assert.equal(
  lynxNext.units.filter((u) => u.token).length,
  1,
  'L3 lynx calls a decoy',
)
assert.equal(lynxNext.units.filter((u) => u.token)[0]?.lane, 1)
assert.equal(lynxNext.hands.player.length, 0, 'decoy is not a new card')
const buffStage = evolved('catgirls', 'pounce')
buffStage.units = [
  { ...follower('player', 2, 901), keywords: ['ambush'], ambushUsed: true },
  { ...follower('player', 1, 902), keywords: ['ambush'], ambushUsed: true },
  { ...follower('player', 3, 903), keywords: ['ambush'], ambushUsed: true },
]
const pounced = playClash(buffStage, 'player', 'pounce', 2)
assert.ok(
  pounced.units.every((u) => !u.ambushUsed),
  'the entire ambush chorus rearms',
)
assert.ok(pounced.units.filter((u) => u.lane !== 2).every((u) => u.surge === 2))
const reknitStage = evolved('catgirls', 'reknit')
reknitStage.units = [{ ...follower('player', 2, 904, 8), hp: 2 }]
reknitStage.fallen!.player.push('mau')
const rewoven = playClash(reknitStage, 'player', 'reknit', 2)
assert.ok(
  rewoven.units.some((u) => u.token && u.cardId === 'mau'),
  'L3 reknit resurrects an existing fallen card as a transient echo',
)
assert.equal(
  rewoven.fallen?.player.length,
  0,
  'a fallen fighter is revived once',
)
const falseGrave = evolved('catgirls', 'reknit')
falseGrave.discards.player.push('mau')
falseGrave.units = [{ ...follower('player', 2, 905, 8), hp: 2 }]
const noGhost = playClash(falseGrave, 'player', 'reknit', 2)
assert.equal(
  noGhost.units.filter((u) => u.token).length,
  0,
  'discarded unplayed cards are not counterfeit fallen allies',
)

const laserStage = evolved('catgirls', 'laser')
laserStage.units = [1, 2, 3].map((lane) =>
  follower('enemy', lane, 920 + lane, 10),
)
const locked = playClash(laserStage, 'player', 'laser', 2)
assert.equal(
  locked.units.filter((u) => u.rooted).length,
  3,
  'L3 laser locks three lanes',
)
const pogoStage = evolved('bloodfairies', 'pogo')
pogoStage.phase = 'attack'
pogoStage.units = [
  {
    ...follower('player', 2, 930, 8, 3),
    cardId: 'pogo',
    keywords: ['swarm'],
    level: 3,
  },
  { ...follower('player', 1, 931), attacked: true },
]
const pogoPower = clashPower(pogoStage, pogoStage.units[0]!)
const concertSlam = strikeClash(pogoStage, 'player')
assert.equal(
  concertSlam.strike?.dealt,
  pogoPower * 2,
  'L3 Pogo always doubles with a friend',
)
assert.equal(
  clashSpectacle(pogoStage, concertSlam)?.cardId,
  'pogo',
  'special strike has its own portrait',
)
const pogoCoin = structuredClone(pogoStage)
pogoCoin.units = [{ ...pogoCoin.units[0]!, level: 2 }]
assert.deepEqual(
  strikeClash(pogoCoin, 'player'),
  strikeClash(structuredClone(pogoCoin), 'player'),
  'Pogo coin flip is seed-replayable',
)
const razorStage = evolved('bloodfairies', 'razor')
razorStage.phase = 'attack'
razorStage.units = [
  {
    ...follower('player', 2, 940, 10, 4),
    cardId: 'razor',
    level: 3,
    keywords: ['leech'],
  },
  { ...follower('player', 4, 941, 8, 2), hp: 3 },
  follower('enemy', 2, 942, 15, 1),
]
const vampiric = strikeClash(razorStage, 'player')
assert.equal(
  vampiric.units.find((u) => u.uid === 941)?.hp,
  4,
  'L3 Razor heals distant bandmate',
)
assert.equal(clashSpectacle(razorStage, vampiric)?.effect, 'heal')
const moshStage = evolved('bloodfairies', 'mosh')
moshStage.units = [
  follower('enemy', 2, 950, 10),
  follower('enemy', 0, 951, 10),
  follower('player', 4, 952, 10),
]
const wholePit = playClash(moshStage, 'player', 'mosh', 2)
assert.ok(
  wholePit.units.find((u) => u.uid === 951)!.hp < 10,
  'L3 mosh reaches far lanes',
)
assert.equal(
  wholePit.units.find((u) => u.uid === 952)?.hp,
  9,
  'mosh can hurt friends',
)
const shieldStage = evolved('ironjaw', 'scrapper')
shieldStage.active = 'enemy'
shieldStage.phase = 'attack'
shieldStage.units = [
  { ...follower('player', 2, 960), cardId: 'scrapper', level: 3 },
  follower('player', 4, 961),
]
const shielded = endClashTurn(shieldStage, 'enemy')
assert.equal(
  shielded.units.find((u) => u.uid === 961)?.guard,
  1,
  'L3 Scrapper protects distant friends each turn',
)
const dozeStage = evolved('ironjaw', 'bulldozer')
dozeStage.phase = 'attack'
dozeStage.units = [
  {
    ...follower('player', 2, 970, 10, 4),
    cardId: 'bulldozer',
    level: 3,
    keywords: ['bulldoze'],
  },
  { ...follower('enemy', 2, 971, 10, 1), armor: 2 },
]
const dozed = strikeClash(dozeStage, 'player')
assert.equal(
  dozed.boss.enemy,
  clashBossMax('enemy') - 2,
  'L3 bulldozer hits behind blocker',
)
const platedStage = evolved('ironjaw', 'plating')
platedStage.units = [
  follower('player', 2, 980),
  follower('player', 0, 981),
  follower('player', 4, 982),
]
const plated = playClash(platedStage, 'player', 'plating', 2)
assert.ok(
  plated.units.every((u) => u.armor > 0),
  'L3 plating blankets all five alleys',
)
const detonatorStage = evolved('riot', 'bomber')
detonatorStage.phase = 'attack'
detonatorStage.units = [
  {
    ...follower('player', 2, 990, 2, 3),
    cardId: 'bomber',
    level: 3,
    hp: 1,
    keywords: ['volatile'],
  },
  { ...follower('player', 1, 991, 8), attacked: true },
  follower('enemy', 2, 992, 10, 3),
  follower('enemy', 4, 993, 10),
]
const detonation = strikeClash(detonatorStage, 'player')
assert.ok(
  detonation.units.find((u) => u.uid === 993)!.hp <= 8,
  'L3 bomber blows up distant rivals after death',
)
assert.equal(
  clashSpectacle(detonatorStage, detonation)?.cardId,
  'bomber',
  'death rattle leads the cinematic beat',
)
assert.equal(
  detonation.units.find((u) => u.uid === 991)!.hp,
  7,
  'blast costs nearby ally life',
)
const kaboomStage = evolved('riot', 'kaboom')
kaboomStage.active = 'enemy'
kaboomStage.phase = 'attack'
kaboomStage.units = [
  { ...follower('player', 1, 994, 8, 3), cardId: 'kaboom', level: 3 },
  {
    ...follower('player', 2, 995, 2),
    cardId: 'bomber',
    hp: 1,
    keywords: ['volatile'],
  },
  follower('enemy', 2, 996, 10, 3),
]
const kaboomed = strikeClash(kaboomStage, 'enemy')
assert.ok(
  kaboomed.units.find((u) => u.uid === 994)!.attack >= 5,
  'L3 Jackhammer Kaboom profits from allied explosions',
)
assert.equal(kaboomed.boss.enemy, clashBossMax('enemy') - 1)
const confettiStage = evolved('riot', 'confetti')
confettiStage.units = [
  follower('enemy', 2, 997, 12),
  follower('enemy', 0, 998, 10),
  follower('player', 4, 999, 8),
]
const rainbowDamage = playClash(confettiStage, 'player', 'confetti', 2)
assert.equal(rainbowDamage.units.find((u) => u.uid === 998)?.hp, 8)
assert.equal(rainbowDamage.units.find((u) => u.uid === 999)?.hp, 7)
// splash:'all' blasts say "including your own": the caster's fighters beside
// the target take the 1 splash too, while splash:'enemies' blasts spare them.
// t-041 (2026-11-19 PT): the two near-dead four-energy blasts in
// CLASH_L1_CLEAN_SPLASH spare allies on their first (level one) play only.
for (const [id, friendlyFire, team] of [
  ['s1-no-witnesses', true, 'riot'],
  ['s2-riot-friendly-fire-rehearsal', false, 'riot'],
  ['s2-bloodfairies-glitterglass-flood', false, 'bloodfairies'],
  ['merc-unsupervised-demo', true, 'riot'],
  ['merc-supervised-demo', false, 'riot'],
] as const) {
  assert.equal(
    clashSplashHitsAllies(cardById(id), id, 1),
    friendlyFire,
    id + ' level-one friendly splash rule',
  )
  const splashStage = evolved(team, id, 1)
  splashStage.units = [
    follower('enemy', 2, 1201, 12),
    follower('enemy', 1, 1202, 10),
    follower('player', 3, 1203, 8),
    follower('player', 0, 1204, 8),
  ]
  const splashed = playClash(splashStage, 'player', id, 2)
  const hp = (uid: number) => splashed.units.find((u) => u.uid === uid)?.hp
  assert.equal(hp(1202), 9, id + ' splashes the adjacent enemy')
  assert.equal(
    hp(1203),
    friendlyFire ? 7 : 8,
    id + (friendlyFire ? ' hits' : ' spares') + ' the adjacent ally',
  )
  assert.equal(hp(1204), 8, id + ' leaves a distant ally alone')
}
// The price returns once they level: native splash catches the band again.
for (const id of CLASH_L1_CLEAN_SPLASH) {
  assert.ok(
    clashSplashHitsAllies(cardById(id), id, 2) &&
      clashSplashHitsAllies(cardById(id), id, 3),
    id + ' friendly splash returns at levels two and three',
  )
}
const eelStage = evolved('undertow', 'eel')
eelStage.phase = 'attack'
eelStage.units = [
  { ...follower('player', 2, 1000, 10, 4), cardId: 'eel', level: 3 },
  follower('enemy', 2, 1001, 12, 2),
  follower('enemy', 4, 1002, 10, 2),
]
eelStage.traps = [{ side: 'enemy', lane: 4, cardId: 'shocktrap', level: 1 }]
const electrocuted = strikeClash(eelStage, 'player')
assert.equal(
  electrocuted.units.find((u) => u.uid === 1002)?.hp,
  8,
  'L3 Eel shocks trapped rivals on hit',
)
assert.equal(clashSpectacle(eelStage, electrocuted)?.eyebrow, 'CHAIN REACTION')
const oracleStage = evolved('undertow', 'oracle')
oracleStage.active = 'enemy'
oracleStage.phase = 'attack'
oracleStage.units = [
  { ...follower('player', 2, 1003), cardId: 'oracle', level: 3 },
  follower('player', 1, 1004),
  follower('player', 3, 1005),
]
const predicted = endClashTurn(oracleStage, 'enemy')
assert.equal(predicted.units.find((u) => u.uid === 1004)?.guard, 2)
assert.equal(predicted.units.find((u) => u.uid === 1005)?.guard, 2)
const wiresStage = evolved('undertow', 'tripwire')
const threeWires = playClash(wiresStage, 'player', 'tripwire', 2)
assert.deepEqual(threeWires.traps.map((t) => t.lane).sort(), [1, 2, 3])
const crampedWires = evolved('undertow', 'tripwire')
crampedWires.traps = [{ side: 'player', lane: 1, cardId: 'tripwire', level: 1 }]
assert.equal(
  playClash(crampedWires, 'player', 'tripwire', 2).traps.length,
  3,
  'never stacks two traps on one lane',
)
const sonarStage = evolved('undertow', 'sonar')
sonarStage.traps = [0, 2, 4].map((lane) => ({
  side: 'enemy',
  lane,
  cardId: 'tripwire',
  level: 1,
}))
const fullSweep = playClash(sonarStage, 'player', 'sonar', 2)
assert.equal(fullSweep.traps.length, 0, 'L3 sonar clears every alley')
assert.ok(fullSweep.hands.player.length >= 6, 'L3 sonar has extra draw')
const repoStage = evolved('exchange', 'repo')
repoStage.active = 'enemy'
repoStage.phase = 'attack'
repoStage.units = [
  { ...follower('player', 4, 1010, 8, 2), cardId: 'repo', level: 3 },
  { ...follower('player', 2, 1011, 2), hp: 1 },
  follower('enemy', 2, 1012, 10, 3),
]
const profit = strikeClash(repoStage, 'enemy')
assert.equal(profit.units.find((u) => u.uid === 1010)?.attack, 4)
assert.equal(profit.boss.player, 31)
const mogulStage = evolved('exchange', 'mogul')
mogulStage.phase = 'attack'
mogulStage.units = [
  {
    ...follower('player', 4, 1020),
    cardId: 'mogul',
    level: 3,
    keywords: ['collect'],
  },
  { ...follower('player', 2, 1021, 10, 4), keywords: ['collect'] },
  follower('enemy', 2, 1022, 1, 1),
]
assert.equal(
  clashPower(mogulStage, mogulStage.units[1]!),
  5,
  'Mogul is a global collector anthem',
)
const dividends = strikeClash(mogulStage, 'player')
assert.equal(dividends.boss.player, 31, 'collector knockout pays boss dividend')
const handshakeStage = evolved('exchange', 'handshake')
handshakeStage.units = [0, 2, 4].map((lane) =>
  follower('player', lane, 1030 + lane),
)
const everyoneCollects = playClash(handshakeStage, 'player', 'handshake', 2)
assert.ok(
  everyoneCollects.units.every((u) => u.keywords.includes('collect')),
  'L3 handshake shares Collect with everyone',
)
const seizureStage = evolved('exchange', 'foreclosure')
seizureStage.units = [follower('enemy', 2, 1040, 1)]
const repossessed = playClash(seizureStage, 'player', 'foreclosure', 2)
assert.equal(
  repossessed.boss.player,
  32,
  'L3 foreclosure heals boss on a knockout',
)
assert.ok(
  repossessed.units.some((u) => u.token && u.cardId === 'repo'),
  'L3 foreclosure hires a weak debtor',
)
const slugStage = evolved('exchange', 'merc-debt-slug')
slugStage.phase = 'attack'
slugStage.units = [
  { ...follower('player', 4, 1050, 8, 2), cardId: 'merc-debt-slug', level: 3 },
  follower('player', 2, 1051, 10, 4),
  follower('enemy', 2, 1052, 1, 1),
]
const feast = strikeClash(slugStage, 'player')
assert.equal(
  feast.units.find((u) => u.uid === 1050)?.attack,
  3,
  'L3 slug eats rival losses',
)
assert.equal(feast.units.find((u) => u.uid === 1050)?.maxHp, 9)
const bouncerStage = evolved('bloodfairies', 'merc-fungal-bouncer')
bouncerStage.active = 'enemy'
bouncerStage.phase = 'attack'
bouncerStage.units = [
  { ...follower('player', 2, 1060), cardId: 'merc-fungal-bouncer', level: 3 },
  follower('player', 1, 1061),
  follower('player', 3, 1062),
]
const clubDoor = endClashTurn(bouncerStage, 'enemy')
assert.equal(clubDoor.units.find((u) => u.uid === 1061)?.guard, 2)
assert.equal(clubDoor.units.find((u) => u.uid === 1062)?.guard, 2)
const angelStage = evolved('catgirls', 'merc-discount-angel')
angelStage.active = 'enemy'
angelStage.phase = 'attack'
angelStage.units = [
  {
    ...follower('player', 3, 1070, 10),
    cardId: 'merc-discount-angel',
    level: 3,
  },
  { ...follower('player', 2, 1071, 2), hp: 1 },
  follower('enemy', 2, 1072, 10, 3),
]
const resurrected = strikeClash(angelStage, 'enemy')
assert.equal(
  resurrected.units.filter((u) => u.token).length,
  1,
  'L3 angel saves one fighter',
)
assert.equal(
  clashSpectacle(angelStage, resurrected)?.title,
  cardById('merc-discount-angel').name,
  'rescue earns its own cut-in',
)
assert.equal(
  resurrected.deathMarks.player['angel-rescue-round'],
  angelStage.round,
)

// Wave three: twenty more bespoke, mechanically tested L3 arcs. Nothing here
// invents a catalog card or gives an untargeted faction-hate effect.
const waveThreeIds = [
  'mau',
  'scentmine',
  'ninthlife',
  'bloodwire',
  'pinprick',
  'feedback',
  'overclock',
  'shocktrap',
  'ducttape',
  'firestorm',
  'fusevest',
  'drink',
  'blackout',
  'grate',
  'drysuit',
  'collection',
  'debttrap',
  'hushmoney',
  'merc-bus-driver',
  'merc-clock-grandma',
]
assert.equal(waveThreeIds.length, 20)
for (const id of waveThreeIds) {
  const card = cardById(id)
  assert.ok(CLASH_TWISTS[id], id + ' has explicit authored evolution rules')
  const texts = [1, 2, 3].map((lv) => clashCardText(card, lv))
  assert.ok(
    texts.every(
      (line, index) =>
        ((index === 0 && card.kind === 'creature') || line.length >= 16) &&
        line.length <= 160,
    ),
  )
  assert.equal(
    new Set([1, 2, 3].map((lv) => evolutionFace(card, lv))).size,
    3,
    id + ' improves through three distinct faces',
  )
}
function third(team: Parameters<typeof createClash>[0], id: string) {
  const s = createClash(team, 'ironjaw', 960 + waveThreeIds.indexOf(id))
  s.round = 2
  s.levels.player[id] = 3
  s.hands.player = [id]
  s.boss.player = 30
  return s
}
const mauFight = third('catgirls', 'mau')
mauFight.phase = 'attack'
mauFight.units = [
  {
    ...follower('player', 2, 2000, 12, 3),
    cardId: 'mau',
    level: 3,
    keywords: ['ambush'],
    ambushUsed: true,
  },
  { ...follower('enemy', 2, 2001, 15, 0), hp: 12 },
  follower('enemy', 3, 2002, 12, 0),
]
const mauHit = strikeClash(mauFight, 'player')
assert.equal(
  mauHit.strike?.dealt,
  5,
  'Mau L3 strikes harder against an already wounded defender',
)
assert.equal(
  mauHit.units.find((u) => u.uid === 2002)?.hp,
  10,
  'Mau L3 follows into a neighboring alley',
)
const scentMine = createClash('catgirls', 'ironjaw', 961)
scentMine.round = 2
scentMine.hands.player = ['lynx']
scentMine.units = [
  follower('player', 1, 2011, 12),
  follower('player', 3, 2013, 12),
]
scentMine.traps = [{ side: 'enemy', lane: 2, cardId: 'scentmine', level: 3 }]
const scentFired = playClash(scentMine, 'player', 'lynx', 2)
assert.ok(scentFired.units.find((u) => u.uid === 2011)?.rooted)
assert.equal(scentFired.units.find((u) => u.uid === 2013)?.hp, 11)
// Ninth Life Collar is a fighter too (t-051, fourth conversion): a belled
// stray who lends her neighbors a spare life instead of being worn.
for (const [level, expected] of [
  [1, [1, 2]],
  [2, [1, 3]],
  [3, [2, 3]],
] as const) {
  const body = clashBalance(cardById('ninthlife'), level)
  assert.deepEqual(
    [body.attack, body.hp],
    expected,
    'Ninth Life Collar pays for her spare life with a tiny body',
  )
}
const collar = third('catgirls', 'ninthlife')
collar.units = [
  follower('player', 1, 2020, 10, 2),
  follower('player', 3, 2022, 10, 2),
]
const collarOn = playClash(collar, 'player', 'ninthlife', 2)
const stray = collarOn.units.find((u) => u.cardId === 'ninthlife')
assert.ok(stray && stray.lane === 2, 'Ninth Life Collar enters as a fighter')
for (const uid of [2020, 2022]) {
  const ally = collarOn.units.find((u) => u.uid === uid)
  assert.ok(ally?.keywords.includes('regen'), 'L3 lends REGEN to both')
  assert.equal(ally?.ninthLife, 2, 'L3 lends both neighbors a spare life')
}
collarOn.active = 'enemy'
collarOn.phase = 'attack'
collarOn.units = collarOn.units.filter((u) => u.uid !== 2022)
collarOn.units.push(follower('enemy', 1, 2021, 20, 15))
const collarRescue = strikeClash(collarOn, 'enemy')
assert.equal(collarRescue.units.find((u) => u.uid === 2020)?.hp, 1)
assert.equal(
  collarRescue.units.find((u) => u.uid === 2020)?.ninthLife,
  undefined,
)
assert.equal(
  collarRescue.strike?.defenderFell,
  false,
  'saved fighter must not display a false knockout',
)
assert.ok(
  clashSpectacle(collarOn, collarRescue)?.cardId === 'ninthlife',
  'the rescue gets an art-led cut-in',
)
const juniorCollar = third('catgirls', 'ninthlife')
juniorCollar.levels.player.ninthlife = 1
juniorCollar.units = [
  follower('player', 1, 2023, 10, 2),
  follower('player', 3, 2024, 10, 2),
]
const firstBell = playClash(juniorCollar, 'player', 'ninthlife', 2)
const leftAlly = firstBell.units.find((u) => u.uid === 2023)
assert.ok(leftAlly?.keywords.includes('regen'), 'L1 lends REGEN')
assert.equal(leftAlly?.ninthLife, undefined, 'L1 has no spare life yet')
assert.ok(
  !firstBell.units.find((u) => u.uid === 2024)?.keywords.includes('regen'),
  'L1 rings for only one neighbor',
)
const midCollar = third('catgirls', 'ninthlife')
midCollar.levels.player.ninthlife = 2
midCollar.units = [
  follower('player', 1, 2025, 10, 2),
  follower('player', 3, 2026, 10, 2),
]
const secondBell = playClash(midCollar, 'player', 'ninthlife', 2)
assert.equal(secondBell.units.find((u) => u.uid === 2025)?.ninthLife, 2)
assert.equal(
  secondBell.units.find((u) => u.uid === 2026)?.ninthLife,
  undefined,
  'L2 lends one spare life',
)
const soloCollarStage = third('catgirls', 'ninthlife')
soloCollarStage.units = []
const soloCollar = playClash(soloCollarStage, 'player', 'ninthlife', 2)
assert.equal(
  soloCollar.units.filter((u) => u.cardId === 'ninthlife').length,
  1,
  'an empty board still gets a fighter, not a fizzled gear card',
)
// One-play snares are an answer to armor, not a dead draw into Ironjaw.
// Check real fighter entry, armor stripping, deterministic replay and trap cleanup.
const armoredWire = createClash('ironjaw', 'bloodfairies', 1962, {
  balanceVersion: 1,
})
armoredWire.round = 2
armoredWire.hands.player = ['scrapper']
armoredWire.traps = [{ side: 'enemy', lane: 2, cardId: 'bloodwire', level: 1 }]
const baselineWire = structuredClone(armoredWire)
baselineWire.traps = []
const plainScrapper = playClash(baselineWire, 'player', 'scrapper', 2)
const trappedScrapper = playClash(armoredWire, 'player', 'scrapper', 2)
const plainFighter = plainScrapper.units.find(
  (u) => u.side === 'player' && u.lane === 2,
)
const caughtFighter = trappedScrapper.units.find(
  (u) => u.side === 'player' && u.lane === 2,
)
assert.ok(
  plainFighter && caughtFighter,
  'Scrapper must enter the trapped alley',
)
assert.ok(plainFighter.armor > 0, 'fixture must deploy a plated fighter')
assert.equal(
  caughtFighter.armor,
  plainFighter.armor - 1,
  'cheap snare should permanently shear one point of armor',
)
assert.ok(caughtFighter.hp < plainFighter.hp, 'snare must also deal damage')
assert.equal(
  trappedScrapper.traps.length,
  0,
  'triggered snare must be consumed',
)
assert.deepEqual(
  trappedScrapper,
  playClash(structuredClone(armoredWire), 'player', 'scrapper', 2),
  'armor-cutting snare must replay deterministically',
)

// The six lowest-performing cheap snares must all remain useful against plating.
// Resolve catalog IDs by name to cover every faction's actual printed card.
for (const name of [
  'Moshpit Tripcord',
  'Bloodwire',
  'Leech Grate',
  'Reliquary Snare',
  'Culvert Tollwire',
  'Floodgate Clamp',
]) {
  const trap = CARDS.find((card) => card.name === name)
  assert.ok(trap, `missing weak-snare fixture: ${name}`)
  assert.equal(trap.kind, 'trap', `${name} must remain a trap`)
  assert.equal(trap.effect, 'snare', `${name} must remain a snare`)
  assert.equal(clashPlayCost(trap), 1, `${name} must cost one Clash play`)
  if (trap.team === 'mercenary')
    throw new Error(`${name} must belong to a playable faction`)
  const state = createClash('ironjaw', trap.team, 1962, { balanceVersion: 1 })
  state.round = 2
  state.hands.player = ['scrapper']
  state.traps = [{ side: 'enemy', lane: 2, cardId: trap.id, level: 1 }]
  const clear = structuredClone(state)
  clear.traps = []
  const safe = playClash(clear, 'player', 'scrapper', 2)
  const caught = playClash(state, 'player', 'scrapper', 2)
  const safeUnit = safe.units.find(
    (unit) => unit.side === 'player' && unit.lane === 2,
  )
  const caughtUnit = caught.units.find(
    (unit) => unit.side === 'player' && unit.lane === 2,
  )
  assert.ok(safeUnit && caughtUnit, `${name} must allow fighter entry`)
  assert.ok(safeUnit.armor > 0, 'Scrapper must retain its armor fixture')
  assert.equal(
    caughtUnit.armor,
    safeUnit.armor - 1,
    `${name} must shear plating`,
  )
  assert.ok(caughtUnit.hp < safeUnit.hp, `${name} must damage a plated target`)
  assert.equal(caught.traps.length, 0, `${name} must be consumed`)
  assert.deepEqual(
    caught,
    playClash(structuredClone(state), 'player', 'scrapper', 2),
    `${name} must replay identically`,
  )
}

// One-play snares also defuse (slime-city/t-048): a VOLATILE fighter caught by
// one loses its death burst, while a two-play snare leaves the fuse lit.
const fuseWire = createClash('riot', 'bloodfairies', 1963, {
  balanceVersion: 1,
})
fuseWire.round = 2
fuseWire.hands.player = ['firebrand']
fuseWire.traps = [{ side: 'enemy', lane: 1, cardId: 'bloodwire', level: 1 }]
const defused = playClash(fuseWire, 'player', 'firebrand', 1)
const snipped = defused.units.find((u) => u.side === 'player' && u.lane === 1)
assert.ok(snipped, 'Firebrand must survive a two-damage snare')
assert.ok(
  !snipped.keywords.includes('volatile'),
  'one-play snare must defuse a VOLATILE fighter',
)
assert.ok(
  cardById('firebrand').keywords?.includes('volatile'),
  'defusing must not edit the catalog card',
)
assert.ok(
  defused.log.some((entry) => entry.text.includes('snips the fuse')),
  'defuse must be told in the play-by-play',
)
assert.deepEqual(
  defused,
  playClash(structuredClone(fuseWire), 'player', 'firebrand', 1),
  'defusing snare must replay deterministically',
)
const litPlate = structuredClone(fuseWire)
litPlate.traps = [
  { side: 'enemy', lane: 1, cardId: 'merc-boomerang-buffet', level: 1 },
]
const stillLit = playClash(litPlate, 'player', 'firebrand', 1).units.find(
  (u) => u.side === 'player' && u.lane === 1,
)
assert.ok(
  !stillLit || stillLit.keywords.includes('volatile'),
  'only one-play snares defuse',
)
assert.match(clashCardText(cardById('bloodwire')), /removes Volatile/)
assert.ok(clashCardText(cardById('amp-tripwire'), 2).length <= 160)
assert.match(clashCardText(cardById('shocktrap')), /no attack or counterattack/)
const rootTerms = clashGlossaryParts('Roots a rival and removes Volatile.')
assert.deepEqual(
  rootTerms.flatMap((part) => (part.entry ? [part.entry.term] : [])),
  ['Stun', 'Volatile'],
)
assert.match(
  CLASH_GLOSSARY.find((entry) => entry.term === 'Stun')!.definition,
  /counterattack/,
)
assert.match(
  CLASH_GLOSSARY.find((entry) => entry.term === 'Volatile')!.definition,
  /rival boss/,
)
// The CPU knows the payoff: with a cheap snare in hand it springs it on the
// VOLATILE fighter rather than an identical-threat empty alley.
const cpuWire = createClash('bloodfairies', 'riot', 1964, { balanceVersion: 1 })
cpuWire.round = 2
cpuWire.hands.player = ['bloodwire']
cpuWire.units = [
  { ...follower('enemy', 0, 2401, 3), keywords: [] },
  { ...follower('enemy', 4, 2402, 3), keywords: ['volatile'] },
]
const wirePick = chooseClashCpu(cpuWire, 'player')
assert.equal(wirePick.t, 'play', 'CPU should lay the snare')
assert.equal(
  wirePick.t === 'play' ? wirePick.lane : -1,
  4,
  'CPU should snare the VOLATILE fighter to defuse it',
)

const wireTrap = createClash('catgirls', 'ironjaw', 962)
wireTrap.round = 2
wireTrap.hands.player = ['lynx']
wireTrap.units = [
  follower('player', 1, 2031, 12),
  follower('player', 3, 2033, 12),
]
wireTrap.traps = [{ side: 'enemy', lane: 2, cardId: 'bloodwire', level: 3 }]
const wireFired = playClash(wireTrap, 'player', 'lynx', 2)
assert.equal(wireFired.units.find((u) => u.uid === 2031)?.hp, 10)
assert.equal(wireFired.units.find((u) => u.uid === 2033)?.hp, 10)
// Silas, 2026-11-10 PT ("less random things"): L3 Pinprick always doubles,
// and splashes nearby rivals for 2 only when its target was already hurt.
for (const hurt of [false, true]) {
  const pin = third('bloodfairies', 'pinprick')
  const target = follower('enemy', 2, 2042, 25)
  if (hurt) target.hp = 20
  pin.units = [target, follower('enemy', 3, 2043, 12)]
  const hit = playClash(pin, 'player', 'pinprick', 2)
  assert.deepEqual(
    hit,
    playClash(structuredClone(pin), 'player', 'pinprick', 2),
  )
  assert.equal(
    hit.units.find((u) => u.uid === 2043)?.hp,
    hurt ? 10 : 12,
    'L3 Pinprick splashes only a hurt target',
  )
}
const feedback = third('bloodfairies', 'feedback')
feedback.units = [
  ...[0, 1, 3, 4].map((lane) => follower('player', lane, 2050 + lane, 10)),
  follower('enemy', 2, 2057, 20),
  follower('enemy', 0, 2058, 10),
  follower('enemy', 4, 2059, 10),
]
const feedbackHit = playClash(feedback, 'player', 'feedback', 2)
assert.equal(feedbackHit.units.find((u) => u.uid === 2058)?.hp, 8)
assert.equal(feedbackHit.units.find((u) => u.uid === 2059)?.hp, 8)
const clock = third('ironjaw', 'overclock')
clock.units = [
  follower('player', 2, 2060, 12),
  follower('enemy', 1, 2061, 12),
  follower('enemy', 3, 2063, 12),
]
const overclocked = playClash(clock, 'player', 'overclock', 2)
assert.equal(
  overclocked.units.find((u) => u.uid === 2060)?.hp,
  9,
  'L3 overclock has a real recoil cost',
)
assert.ok(overclocked.units.find((u) => u.uid === 2060)!.surge >= 4)
assert.equal(overclocked.units.find((u) => u.uid === 2061)?.hp, 10)
const shockStage = createClash('catgirls', 'ironjaw', 963)
shockStage.round = 2
shockStage.hands.player = ['lynx']
shockStage.units = [
  follower('player', 1, 2071, 12),
  follower('player', 3, 2073, 12),
]
shockStage.traps = [{ side: 'enemy', lane: 2, cardId: 'shocktrap', level: 3 }]
const shockFired = playClash(shockStage, 'player', 'lynx', 2)
assert.equal(shockFired.units.find((u) => u.uid === 2071)?.hp, 10)
assert.ok(shockFired.units.find((u) => u.uid === 2073)?.rooted)
const weld = third('ironjaw', 'ducttape')
weld.fallen!.player.push('welder')
weld.units = [{ ...follower('player', 2, 2082, 10), hp: 2 }]
const repaired = playClash(weld, 'player', 'ducttape', 2)
assert.ok(
  repaired.units.some((u) => u.token && u.cardId === 'welder' && u.armor === 1),
)
assert.equal(
  repaired.fallen?.player.length,
  0,
  'fallen unit not copied endlessly',
)
const storm = third('riot', 'firestorm')
storm.units = [
  follower('enemy', 2, 2092, 30),
  follower('enemy', 1, 2091, 12),
  follower('enemy', 3, 2093, 12),
  follower('player', 1, 2094, 12),
]
const stormHit = playClash(storm, 'player', 'firestorm', 2)
assert.equal(stormHit.units.find((u) => u.uid === 2091)?.hp, 10)
assert.equal(stormHit.units.find((u) => u.uid === 2094)?.hp, 11)
assert.deepEqual(
  stormHit,
  playClash(structuredClone(storm), 'player', 'firestorm', 2),
  'firestorm rerolls are replay-safe',
)
const vest = third('riot', 'fusevest')
vest.units = [
  { ...follower('player', 2, 2102, 10), hp: 1 },
  follower('player', 1, 2101, 10),
]
const fitted = playClash(vest, 'player', 'fusevest', 2)
assert.equal(fitted.units.find((u) => u.uid === 2102)?.gearLevels?.fusevest, 3)
fitted.active = 'enemy'
fitted.phase = 'attack'
fitted.units.push(
  follower('enemy', 2, 2112, 10, 12),
  follower('enemy', 4, 2114, 10),
)
const vestBlast = strikeClash(fitted, 'enemy')
assert.equal(vestBlast.units.find((u) => u.uid === 2114)?.hp, 9)
assert.equal(vestBlast.units.find((u) => u.uid === 2101)?.hp, 9)
const bottle = third('riot', 'drink')
bottle.units = [follower('player', 2, 2122, 12)]
const drank = playClash(bottle, 'player', 'drink', 2)
assert.ok(
  drank.units[0]!.surge >= 6 || drank.units[0]!.hp === 10,
  'L3 drink is a risky swing',
)
assert.deepEqual(
  drank,
  playClash(structuredClone(bottle), 'player', 'drink', 2),
)
const signal = third('undertow', 'blackout')
signal.units = [1, 2, 3].map((lane) => follower('enemy', lane, 2130 + lane, 12))
const blackedOut = playClash(signal, 'player', 'blackout', 2)
assert.equal(blackedOut.units.filter((u) => u.rooted).length, 3)
assert.equal(blackedOut.units.find((u) => u.lane === 1)?.hp, 11)
const drain = createClash('catgirls', 'ironjaw', 964)
drain.round = 2
drain.hands.player = ['lynx']
drain.units = [follower('player', 1, 2141, 12), follower('player', 3, 2143, 12)]
drain.traps = [{ side: 'enemy', lane: 2, cardId: 'grate', level: 3 }]
const grateFired = playClash(drain, 'player', 'lynx', 2)
assert.equal(grateFired.units.find((u) => u.uid === 2141)?.hp, 10)
assert.equal(grateFired.units.find((u) => u.uid === 2143)?.hp, 10)
const suit = third('undertow', 'drysuit')
suit.units = [1, 2, 3].map((lane) => follower('player', lane, 2150 + lane, 12))
const armored = playClash(suit, 'player', 'drysuit', 2)
assert.ok(armored.units.every((u) => u.snareWard))
armored.active = 'enemy'
armored.phase = 'play'
armored.plays.enemy = 0
armored.teams.enemy = 'undertow'
armored.hands.enemy = ['blackout']
const blockedRoot = playClash(armored, 'enemy', 'blackout', 1)
assert.equal(blockedRoot.units.find((u) => u.uid === 2151)?.rooted, false)
assert.equal(blockedRoot.units.find((u) => u.uid === 2151)?.snareWard, false)
const debt = third('exchange', 'collection')
debt.units = [
  { ...follower('player', 1, 2161, 12, 2), keywords: ['collect'] },
  follower('enemy', 2, 2162, 20),
]
const collected = playClash(debt, 'player', 'collection', 2)
assert.equal(collected.boss.player, 32)
assert.equal(collected.units.find((u) => u.uid === 2161)?.attack, 3)
const fees = third('exchange', 'debttrap')
const linkedFees = playClash(fees, 'player', 'debttrap', 2)
assert.deepEqual(linkedFees.traps.map((u) => u.lane).sort(), [1, 2, 3])
assert.equal(linkedFees.traps.filter((u) => u.token).length, 2)
linkedFees.active = 'enemy'
linkedFees.phase = 'play'
linkedFees.plays.enemy = 0
linkedFees.teams.enemy = 'undertow'
linkedFees.hands.enemy = ['sonar']
linkedFees.levels.enemy.sonar = 3
const sweptFees = playClash(linkedFees, 'enemy', 'sonar', 2)
assert.equal(sweptFees.traps.length, 0)
assert.equal(
  sweptFees.discards.player.filter((id) => id === 'debttrap').length,
  1,
  'trap copies cannot mint new cards',
)
const hush = third('exchange', 'hushmoney')
hush.units = [{ ...follower('player', 2, 2172, 12), hp: 4 }]
const funded = playClash(hush, 'player', 'hushmoney', 2)
assert.equal(funded.boss.player, 32)
assert.equal(funded.units[0]?.guard, 2)
const driver = third('catgirls', 'merc-bus-driver')
driver.units = [follower('player', 1, 2181), follower('player', 3, 2183)]
const busTrip = playClash(driver, 'player', 'merc-bus-driver', 2)
assert.equal(busTrip.units.length, 3)
assert.notEqual(busTrip.units.find((u) => u.uid === 2181)?.lane, 1)
assert.notEqual(busTrip.units.find((u) => u.uid === 2183)?.lane, 3)
assert.equal(
  new Set(busTrip.units.filter((u) => u.side === 'player').map((u) => u.lane))
    .size,
  3,
)
const grandma = third('catgirls', 'merc-clock-grandma')
grandma.active = 'enemy'
grandma.phase = 'attack'
grandma.units = [
  {
    ...follower('player', 2, 2192, 10),
    cardId: 'merc-clock-grandma',
    level: 3,
  },
  { ...follower('player', 1, 2191, 10), hp: 1 },
  follower('enemy', 1, 2193, 12, 5),
]
const firstSave = strikeClash(grandma, 'enemy')
assert.equal(firstSave.units.find((u) => u.uid === 2191)?.hp, 1)
assert.equal(firstSave.units.find((u) => u.uid === 2192)?.grandmaSaveUsed, true)
assert.equal(clashSpectacle(grandma, firstSave)?.cardId, 'merc-clock-grandma')
const secondBlow = structuredClone(firstSave)
secondBlow.cursor = 0
secondBlow.units.find((u) => u.uid === 2193)!.attacked = false
const outOfTime = strikeClash(secondBlow, 'enemy')
assert.equal(
  outOfTime.units.some((u) => u.uid === 2191),
  false,
  'grandma cannot loop rescues forever',
)

// Final 11: each existing card earns an actual L2/L3 ability, not just text.
const finalEleven = [
  'shredders',
  'spurs',
  'choker',
  'wreckingfist',
  'slap',
  'badluck',
  'fuse',
  'visor',
  'contract',
  'merc-bribe-rat',
  'merc-grease-oracle',
]
for (const id of finalEleven) {
  assert.ok(CLASH_TWISTS[id], id + ' authored evolution exists')
  const card = cardById(id)
  const faces = [1, 2, 3].map((level) => evolutionFace(card, level))
  assert.equal(new Set(faces).size, 3, id + ' must evolve in three steps')
}
assert.equal(Object.keys(CLASH_TWISTS).length, 70)

// Patent Shredder is a real fighter: no ally is required to field her,
// but positioning between teammates unlocks the L3 two-sided claw handoff.
for (const [level, expected] of [
  [1, [1, 3]],
  [2, [1, 4]],
  [3, [2, 5]],
] as const) {
  const body = clashBalance(cardById('shredders'), level)
  assert.deepEqual(
    [body.attack, body.hp],
    expected,
    'Patent Shredder must pay for support with a fragile body',
  )
}
const shredderStage = third('catgirls', 'shredders')
shredderStage.units = [
  follower('player', 1, 3100, 14, 3),
  follower('player', 3, 3103, 14, 3),
  follower('enemy', 2, 3101, 12, 3),
]
const deployedShredder = playClash(shredderStage, 'player', 'shredders', 2)
assert.ok(
  deployedShredder.units.some((u) => u.cardId === 'shredders' && u.lane === 2),
  'Patent Shredder enters the board as a fighter',
)
for (const uid of [3100, 3103]) {
  const neighbor = deployedShredder.units.find((u) => u.uid === uid)!
  assert.equal(neighbor.attack, 4, 'each adjacent ally gains lasting power')
  assert.ok(neighbor.keywords.includes('pierce'), 'each gains PIERCE')
}
const lonelyShredder = third('catgirls', 'shredders')
lonelyShredder.units = []
const soloShredder = playClash(lonelyShredder, 'player', 'shredders', 2)
assert.equal(
  soloShredder.units.filter((u) => u.cardId === 'shredders').length,
  1,
  'an empty board still gets a useful fighter, not a fizzled spell',
)
const juniorShredder = third('catgirls', 'shredders')
juniorShredder.levels.player.shredders = 1
juniorShredder.units = [follower('player', 1, 3104, 12, 2)]
const shortBurst = playClash(juniorShredder, 'player', 'shredders', 2)
assert.equal(
  shortBurst.units.find((u) => u.uid === 3104)?.attack,
  2,
  'the first-stage claw buff is temporary, not permanent',
)
assert.equal(shortBurst.units.find((u) => u.uid === 3104)?.surge, 1)

// Razor Spurs is a fighter too (t-051, third conversion): a fragile
// stage-diver whose arrival kicks tempo into her neighbors.
for (const [level, expected] of [
  [1, [1, 2]],
  [2, [1, 3]],
  [3, [2, 3]],
] as const) {
  const body = clashBalance(cardById('spurs'), level)
  assert.deepEqual(
    [body.attack, body.hp],
    expected,
    'Razor Spurs pays for her neighbor kick with a tiny body',
  )
}
const spursStage = third('bloodfairies', 'spurs')
spursStage.units = [
  follower('player', 1, 3111, 10, 2),
  follower('player', 3, 3113, 10, 2),
]
const spurred = playClash(spursStage, 'player', 'spurs', 2)
const diver = spurred.units.find((u) => u.cardId === 'spurs')
assert.ok(diver && diver.lane === 2, 'Razor Spurs enters as a fighter')
assert.equal(spurred.units.find((u) => u.uid === 3111)?.attack, 3)
assert.equal(
  spurred.units.find((u) => u.uid === 3113)?.attack,
  3,
  'L3 kicks both neighbors +1 lasting attack',
)
const juniorSpurs = third('bloodfairies', 'spurs')
juniorSpurs.levels.player.spurs = 1
juniorSpurs.units = [
  follower('player', 1, 3114, 10, 2),
  follower('player', 3, 3115, 10, 2),
]
const firstDive = playClash(juniorSpurs, 'player', 'spurs', 2)
assert.equal(
  firstDive.units.find((u) => u.uid === 3114)?.attack,
  2,
  'the first-stage kick is temporary, not permanent',
)
assert.equal(firstDive.units.find((u) => u.uid === 3114)?.surge, 1)
assert.equal(
  firstDive.units.find((u) => u.uid === 3115)?.surge,
  0,
  'L1 kicks only one neighbor',
)
const midSpurs = third('bloodfairies', 'spurs')
midSpurs.levels.player.spurs = 2
midSpurs.units = [
  follower('player', 1, 3116, 10, 2),
  follower('player', 3, 3117, 10, 2),
]
const secondDive = playClash(midSpurs, 'player', 'spurs', 2)
for (const uid of [3116, 3117]) {
  const ally = secondDive.units.find((u) => u.uid === uid)
  assert.deepEqual(
    [ally?.attack, ally?.surge],
    [2, 1],
    'L2 kicks both neighbors for one round only',
  )
}
const soloSpursStage = third('bloodfairies', 'spurs')
soloSpursStage.units = []
const soloSpurs = playClash(soloSpursStage, 'player', 'spurs', 2)
assert.equal(
  soloSpurs.units.filter((u) => u.cardId === 'spurs').length,
  1,
  'an empty board still gets a fighter, not a fizzled gear card',
)

// Spiked Choker is a fighter too (t-051): a small SWARM singer whose arrival
// spreads SWARM next door, and whose L3 presence powers other SWARM allies.
for (const [level, expected] of [
  [1, [1, 2]],
  [2, [1, 3]],
  [3, [2, 4]],
] as const) {
  const body = clashBalance(cardById('choker'), level)
  assert.deepEqual(
    [body.attack, body.hp],
    expected,
    'Spiked Choker pays for her SWARM handoff with a tiny body',
  )
}
const chokerStage = third('bloodfairies', 'choker')
chokerStage.units = [
  follower('player', 0, 3120, 8, 2),
  follower('player', 1, 3121, 8, 2),
  follower('player', 3, 3123, 8, 2),
]
chokerStage.units[0]!.keywords.push('swarm')
const chokers = playClash(chokerStage, 'player', 'choker', 2)
const singer = chokers.units.find((u) => u.cardId === 'choker')
assert.ok(singer && singer.lane === 2, 'Spiked Choker enters as a fighter')
assert.ok(singer!.keywords.includes('swarm'), 'she is a SWARM fighter herself')
for (const uid of [3121, 3123])
  assert.ok(
    chokers.units.find((u) => u.uid === uid)?.keywords.includes('swarm'),
    'both neighbors join the swarm at L3',
  )
// The L3 anthem is local: compare against the same board with a level-two
// singer, so only her anthem differs.
const quietSinger = structuredClone(chokers)
quietSinger.units.find((u) => u.cardId === 'choker')!.level = 2
const anthemPower = (state: typeof chokers, uid: number) =>
  clashPower(
    state,
    state.units.find((u) => u.uid === uid)!,
  )
assert.equal(
  anthemPower(chokers, 3121),
  anthemPower(quietSinger, 3121) + 1,
  'an adjacent SWARM ally hears the L3 anthem',
)
assert.equal(
  anthemPower(chokers, 3120),
  anthemPower(quietSinger, 3120),
  'the anthem does not reach a distant lane',
)
const juniorChoker = third('bloodfairies', 'choker')
juniorChoker.levels.player.choker = 1
juniorChoker.units = [
  follower('player', 1, 3124, 8, 2),
  follower('player', 3, 3125, 8, 2),
]
const firstSet = playClash(juniorChoker, 'player', 'choker', 2)
assert.ok(
  firstSet.units.find((u) => u.uid === 3124)?.keywords.includes('swarm'),
)
assert.ok(
  !firstSet.units.find((u) => u.uid === 3125)?.keywords.includes('swarm'),
  'L1 recruits only one neighbor',
)
const soloChokerStage = third('bloodfairies', 'choker')
soloChokerStage.units = []
const soloChoker = playClash(soloChokerStage, 'player', 'choker', 2)
assert.equal(
  soloChoker.units.filter((u) => u.cardId === 'choker').length,
  1,
  'an empty board still gets a fighter, not a fizzled gear card',
)

const fistStage = third('ironjaw', 'wreckingfist')
fistStage.units = [
  follower('player', 2, 3130, 14, 3),
  follower('enemy', 2, 3131, 15, 2),
  follower('enemy', 3, 3132, 12, 2),
]
fistStage.boss.enemy = 30
const fistEquip = playClash(fistStage, 'player', 'wreckingfist', 2)
assert.ok(
  fistEquip.units.find((u) => u.uid === 3130)?.keywords.includes('bulldoze'),
)
const fistHit = strikeClash(passClash(fistEquip, 'player'), 'player')
assert.equal(fistHit.boss.enemy, 28)
assert.equal(fistHit.units.find((u) => u.uid === 3132)?.hp, 11)

const slapStage = third('ironjaw', 'slap')
slapStage.units = [
  follower('enemy', 1, 3141, 12),
  follower('enemy', 2, 3142, 12),
  follower('enemy', 3, 3143, 12),
]
const slapped = playClash(slapStage, 'player', 'slap', 2)
for (const uid of [3141, 3142, 3143]) {
  assert.equal(slapped.units.find((u) => u.uid === uid)?.rooted, true)
  assert.ok(slapped.units.find((u) => u.uid === uid)!.hp < 12)
}

// Seeded trap chaos, sacrifices, and trap removal remain pure and replayable.
const unlucky = third('riot', 'badluck')
const armed = playClash(unlucky, 'player', 'badluck', 2)
armed.active = 'enemy'
armed.phase = 'play'
armed.plays.enemy = 0
armed.hands.enemy = ['scrapper']
armed.units = [follower('enemy', 1, 3151, 10), follower('enemy', 3, 3153, 10)]
const spring = playClash(armed, 'enemy', 'scrapper', 2)
assert.deepEqual(
  spring,
  playClash(structuredClone(armed), 'enemy', 'scrapper', 2),
)
assert.ok(spring.traps.every((t) => t.cardId !== 'badluck'))
assert.ok(spring.units.find((u) => u.uid === 3151)!.hp <= 10)

const fuseStage = third('riot', 'fuse')
fuseStage.units = [
  follower('player', 1, 3161, 8, 2),
  follower('player', 2, 3162, 12, 3),
]
const fused = playClash(fuseStage, 'player', 'fuse', 2)
assert.ok(!fused.units.some((u) => u.uid === 3161))
assert.ok(fused.units.find((u) => u.uid === 3162)!.attack >= 8)
assert.ok(
  (fused.fallen?.player ?? []).length > 0,
  'sacrifices count as real deaths',
)

const visorStage = third('undertow', 'visor')
visorStage.units = [follower('player', 1, 3171), follower('player', 2, 3172)]
visorStage.traps = [
  { side: 'enemy', lane: 1, cardId: 'grate', level: 1 },
  { side: 'enemy', lane: 3, cardId: 'grate', level: 1 },
]
const sight = playClash(visorStage, 'player', 'visor', 2)
assert.equal(sight.traps.length, 0)
assert.ok(sight.units.find((u) => u.uid === 3171)?.keywords.includes('pierce'))

const contractStage = third('exchange', 'contract')
contractStage.units = [
  follower('player', 1, 3181, 10),
  follower('player', 2, 3182, 10),
]
contractStage.units[0]!.hp = 7
const contracted = playClash(contractStage, 'player', 'contract', 2)
const afterContractTurn = finishTurn(contracted)
assert.equal(
  afterContractTurn.units.find((u) => u.uid === 3181)?.guard,
  1,
  'the contract shield blocks the upcoming enemy attack',
)
const contractRound = finishTurn(afterContractTurn)
assert.equal(contractRound.boss.player, 31)
assert.equal(contractRound.units.find((u) => u.uid === 3181)?.hp, 8)
assert.equal(
  contractRound.units.find((u) => u.uid === 3181)?.guard,
  0,
  "temporary shield expires at the start of the protected crew's next turn",
)

// The L3 bribe is conditional, never a guaranteed free opponent steal.
let recruited = false
let prophecyRaised = false
let prophecyMissed = false
for (let seed = 1; seed <= 64; seed++) {
  const bribe = createClash('riot', 'ironjaw', seed)
  bribe.phase = 'attack'
  bribe.units = [
    {
      ...follower('player', 2, 3200, 10, 5),
      cardId: 'merc-bribe-rat',
      level: 3,
    },
    { ...follower('enemy', 2, 3201, 1, 2), cardId: 'scrapper' },
  ]
  const paid = strikeClash(bribe, 'player')
  assert.deepEqual(paid, strikeClash(structuredClone(bribe), 'player'))
  if (
    paid.units.some(
      (u) => u.side === 'player' && u.token && u.cardId === 'scrapper',
    )
  )
    recruited = true

  const oracle = createClash('catgirls', 'ironjaw', seed)
  oracle.phase = 'attack'
  oracle.units = [
    {
      ...follower('player', 1, 3301, 12, 2),
      cardId: 'merc-grease-oracle',
      level: 3,
      attacked: true,
    },
    follower('player', 2, 3302, 12, 2),
    follower('enemy', 2, 3303, 20, 1),
  ]
  const foretold = strikeClash(oracle, 'player')
  const damage = 20 - foretold.units.find((u) => u.uid === 3303)!.hp
  if (damage > 2) prophecyRaised = true
  else prophecyMissed = true
  assert.deepEqual(foretold, strikeClash(structuredClone(oracle), 'player'))
}
assert.ok(recruited, 'weak enemy can be recruited by an evolved bribe rat')
// Silas, 2026-11-10 PT ("less random things"): the Oracle's +2 is certain.
assert.ok(
  prophecyRaised && !prophecyMissed,
  'an L3 oracle always raises a neighbor strike',
)

// Balance acceptance (2026-11-07 Clash rebalance): CPU sweeps across every crew
// pairing keep each crew and the first seat near even. Report:
// npx tsx utils/scripts/slimeCityClashBalanceReport.ts 150 9000
// 40 seeds (1200 games): a 10-seed sample swung the first seat by 13 points.

// Paired both-seat counterfactual is executed in CI, not merely available as
// a manual script. Diagnostic metrics must not impose arbitrary win-rate gates.
const catgirlsPilot = compareCatgirlsStarter(4)
assert.equal(catgirlsPilot.current.games, 40)
assert.equal(catgirlsPilot.original.games, 40)
for (const [version, result] of Object.entries(catgirlsPilot)) {
  assert.ok(result.wins >= 0 && result.wins <= result.games, version)
  assert.ok(result.played > 0, version + ': cards must actually be played')
}
console.log(
  'Catgirls fighters-first paired counterfactual (40 games/deck):',
  catgirlsPilot,
)

const sweep = sweepClash(40, 700)
console.log(
  'CLASH crew win rates (40 acceptance seeds):',
  Object.fromEntries(
    Object.entries(sweep.crews).map(([crew, record]) => [
      crew,
      ((100 * record.wins) / record.games).toFixed(1) + '%',
    ]),
  ),
)
// On a failed sweep, collect measured alternatives in CI before asserting the
// original acceptance limits. The diagnostic never changes the tested engine.
console.log('CLASH worst pairings:', worstClashPairings(sweep).slice(0, 5))
const rates = Object.values(sweep.crews).map((r) => r.wins / r.games)
if (
  rates.some((rate) => rate <= 0.42 || rate >= 0.58) ||
  Math.max(...rates) - Math.min(...rates) > 0.12 ||
  worstClashPairings(sweep)[0]!.rate <= 0.3
)
  reportCalibrationCandidates()
assert.ok(
  sweep.firstSeatWins / sweep.games > 0.4 &&
    sweep.firstSeatWins / sweep.games < 0.62,
  'first seat advantage stays small',
)
assert.ok(sweep.roundLimit / sweep.games < 0.1, 'matches end by knockout')
// slime-city/t-047 (2026-11-09 PT): armor re-priced to one life per point and
// a 2-damage volatile burst now costs a point of budget. Before, these seeds
// read Ironjaw 35% / Riot 64% (a ~30-point spread); after, every crew sits at
// 48-53%. Guard every crew to 42-58% and the crew spread to 12 points.
for (const [crew, r] of Object.entries(sweep.crews))
  assert.ok(
    r.wins / r.games > 0.42 && r.wins / r.games < 0.58,
    crew + ' win rate ' + ((100 * r.wins) / r.games).toFixed(1) + '%',
  )
const crewRecords = Object.values(sweep.crews)
const gamesPerCrew = crewRecords[0]!.games
assert.ok(
  crewRecords.every((record) => record.games === gamesPerCrew),
  'each crew has the same number of mirrored games',
)
const crewWinSpread =
  Math.max(...crewRecords.map((record) => record.wins)) -
  Math.min(...crewRecords.map((record) => record.wins))
assert.ok(
  crewWinSpread * 100 <= gamesPerCrew * 12,
  'CLASH crew spread stays within 12 points',
)
// slime-city/t-012 (2026-11-19 PT): PROGRESSION-AND-SETS.md asks for >30%
// even for the worst crew pairing, which aggregate crew rates cannot show.
// Measured head-to-head over both seats: worst is exchange>undertow 35.0% on
// these 40 seeds (80 games), catgirls>riot 35.3% on the 150-seed report.
const [worstPairing] = worstClashPairings(sweep)
assert.equal(
  Object.keys(sweep.pairings).length,
  TEAMS.length * (TEAMS.length - 1),
  'every ordered crew pairing is measured',
)
assert.ok(
  worstPairing!.rate > 0.3,
  'worst head-to-head ' +
    worstPairing!.pairing +
    ' stays above 30% (' +
    (100 * worstPairing!.rate).toFixed(1) +
    '%)',
)

// The art-first board must display the card's authored evolution painting, not
// the old cropped mood tokens. Keep this contract beside the combat tests so
// the presentation cannot silently regress during future board refactors.
const clashView = readFileSync('components/slime-city-clash.vue', 'utf8')
const fighterArt = clashView.match(
  /function artFor\(u: ClashUnit\): number \| null \{([\s\S]*?)\n\}/,
)?.[1]
assert.ok(fighterArt, 'Clash fighter art resolver must exist')
assert.match(
  fighterArt,
  /slimeCardArtId\(u\.cardId, u\.level, u\.evoChoice \?\? 0\)/,
  'board fighters must use card art and their actual evolution choice',
)
assert.doesNotMatch(
  fighterArt,
  /slimeArtId\(['"]tokens['"]/,
  'reaction-face tokens must not override the fighter card painting',
)

const fighterImageStart = clashView.indexOf('.clash-slot :deep(img) {')
const fighterImageStyle =
  fighterImageStart < 0
    ? ''
    : clashView.slice(
        fighterImageStart,
        clashView.indexOf('}', fighterImageStart) + 1,
      )
assert.ok(fighterImageStyle, 'fighter image styling must exist')
assert.match(
  fighterImageStyle,
  /object-fit:\s*contain\s*;/,
  'deployed fighters must show the complete card painting',
)

// Activated powers cost a fighter's entire strike, never a play slot.
{
  const seed = Array.from({ length: 400 }, (_, i) => i + 1).find((n) =>
    createClash('catgirls', 'ironjaw', n).hands.player.includes('s1-alley-vet'),
  )
  assert.ok(seed, 'starter Catgirls deck can draw its L1 tap medic')
  let s = createClash('catgirls', 'ironjaw', seed!)
  s = playClash(s, 'player', 's1-alley-vet', 0)
  const uid = s.units.find((u) => u.cardId === 's1-alley-vet')!.uid
  assert.equal(
    canClashActivate(s, 'player', uid),
    false,
    'fresh fighters must wait',
  )
  assert.equal(activateClash(s, 'player', uid), s, 'invalid tap is a no-op')
  s = finishRound(s)
  assert.equal(s.round, 2)
  assert.ok(canClashActivate(s, 'player', uid))
  assert.ok(
    !canClashActivate(s, 'enemy', uid),
    'other seat cannot tap our fighter',
  )
  const original = s
  const tapped = activateClash(s, 'player', uid)
  assert.notEqual(tapped, original)
  assert.equal(original.units[0]!.attacked, false, 'input stays immutable')
  assert.ok(tapped.units.find((u) => u.uid === uid)!.attacked)
  assert.equal(tapped.units.find((u) => u.uid === uid)!.activatedRound, s.round)
  assert.equal(tapped.plays.player, s.plays.player, 'taps use no card play')
  assert.equal(
    canClashActivate(tapped, 'player', uid),
    false,
    'one tap per turn',
  )
  assert.equal(
    activateClash(tapped, 'player', uid),
    tapped,
    'double tap is illegal',
  )
  assert.equal(nextClashStrike(passClash(tapped, 'player'), 'player'), -1)
  assert.ok(nextClashStrike(passClash(s, 'player'), 'player') >= 0)
  assert.deepEqual(
    applyClashCommand(s, { t: 'activate', side: 'player', uid }),
    tapped,
    'the public command uses the canonical reducer',
  )
  assert.deepEqual(
    replayClash('catgirls', 'ironjaw', seed!, tapped.commands),
    tapped,
    'server replay reproduces the entire played-and-tapped turn',
  )
  const rooted = structuredClone(s)
  rooted.units.find((u) => u.uid === uid)!.rooted = true
  assert.equal(canClashActivate(rooted, 'player', uid), false)
}

// Long adversarial CPU playthroughs on every crew pairing, all rules and replay.
let simulated = 0
let timeoutWinners = 0
for (const player of TEAMS) {
  for (const enemy of TEAMS) {
    for (let seed = 1; seed <= 3; seed++) {
      let s = createClash(player.id, enemy.id, seed)
      for (let step = 0; !s.victor && step < 240; step++) {
        const command = chooseClashCpu(s, s.active)
        const next = applyClashCommand(s, command)
        assert.notEqual(next, s, 'CPU must issue legal actionable commands')
        s = next
      }
      assert.ok(s.victor, player.name + ' vs ' + enemy.name + ' must conclude')
      assert.ok(s.round <= CLASH_ROUND_LIMIT)
      assert.deepEqual(
        replayClash(player.id, enemy.id, seed, s.commands),
        s,
        'seeded replay must be exact',
      )
      timeoutWinners += s.round >= CLASH_ROUND_LIMIT ? 1 : 0
      simulated++
    }
  }
}
console.log(
  'Clash primary contract: ' +
    CARDS.length +
    ' balanced cards, ' +
    simulated +
    ' complete seeded cross-crew CPU games, ' +
    timeoutWinners +
    ' round-limit results; UI, two plays, alley strikes, traps, recovery, balance and replay pass',
)

// Main-game standard (slime-city/t-063): settings must be reachable mid-fight
// without leaving the Clash, and must write the same store-owned preferences as
// the title settings screen rather than keeping a second copy of state.
const quickSettings = readFileSync(
  'components/slime-city-quick-settings.vue',
  'utf8',
)
assert.match(
  clashView,
  /<SlimeCityQuickSettings\b/,
  'Clash HUD must mount the in-play settings gear',
)
for (const call of [
  'lab.setReducedMotion(',
  'lab.setLargeText(',
  'lab.setHighContrast(',
  'lab.setClashSpeed(',
  'sound.setSound(',
  'sound.setMusic(',
  'sound.setEffects(',
]) {
  assert.ok(
    quickSettings.includes(call),
    `in-play settings must use the shared store setter ${call}`,
  )
}
assert.match(
  clashView,
  /const pace = computed\(/,
  'Clash pace must read the speed setting live so the gear applies mid-fight',
)
assert.match(
  clashView,
  /CLASH_SPEED_PACE\[lab\.clashSpeed\]/,
  'Clash pace must come from the persisted Clash speed setting',
)
assert.doesNotMatch(
  quickSettings,
  /lab\.view\s*=/,
  'in-play settings must not navigate away from the fight',
)
assert.doesNotMatch(
  quickSettings,
  /localStorage/,
  'in-play settings must not persist preferences on its own',
)

for (const keyword of Object.keys(CLASH_TRAIT_TEXT)) {
  assert.ok(
    CLASH_GLOSSARY.some((entry) => entry.aliases.includes(keyword)),
    'Glossary must cover ' + keyword,
  )
  assert.ok(
    CLASH_GLOSSARY.find((entry) => entry.aliases.includes(keyword))?.icon,
    'Every battlefield keyword has a glossary icon: ' + keyword,
  )
}
assert.equal(
  CLASH_GLOSSARY.find((entry) => entry.term === 'Armor')?.icon,
  undefined,
  'Armor belongs in the stat display, not the ability icon row',
)
const glossarySample = 'Tap (skip strike): grant BULLDOZE and faction power.'
const glossaryParts = clashGlossaryParts(glossarySample)
assert.equal(glossaryParts.map((part) => part.text).join(''), glossarySample)
assert.deepEqual(
  glossaryParts.flatMap((part) => (part.entry ? [part.entry.term] : [])),
  ['Tap', 'Tap', 'Bulldoze', 'Faction power'],
)
assert.equal(clashGlossaryParts('attacker')[0]?.entry, undefined)

assert.match(
  hand,
  /@media \(min-width: 691px\) and \(orientation: landscape\) \{\s*@container \(min-width: 30rem\) and \(min-aspect-ratio: 1 \/ 1\) \{\s*\.cxh-card \{\s*--rest: 0\.78;\s*--peek: 0\.85;/,
  'wide landscape hands must show substantially larger resting cards',
)

assert.equal(clashSummoningSick({ fresh: true, keywords: [] }), true)
assert.equal(clashSummoningSick({ fresh: true, keywords: ['ambush'] }), false)
assert.equal(clashSummoningSick({ fresh: false, keywords: [] }), false)
for (const path of [
  'components/slime-city-clash.vue',
  'components/slime-city-pvp-game.vue',
]) {
  assert.match(
    readFileSync(path, 'utf8'),
    /<SlimeCitySummoningSickness\s+v-if="[^"]*clashSummoningSick\(unit\(side, lane\)!\)"/,
    'both battle surfaces show the same summoning sickness effect',
  )
}

// Printed armor is a stat, not a passive rule; no flavor-only bouncer line.
assert.equal(clashCardText(cardById('merc-fungal-bouncer'), 1), '')
assert.match(clashCardText(cardById('merc-fungal-bouncer'), 2), /shield/)
for (const card of CARDS)
  if (card.kind === 'creature')
    for (const level of [1, 2, 3])
      assert.doesNotMatch(
        clashCardText(card, level),
        /^Armor: blocks 1 per hit\./,
      )

// Versioned tempo tuning: every trap and permanent stat upgrade gets more value.
for (const card of CARDS) {
  for (const level of [1, 2, 3]) {
    const old = clashBalance(card, level, 1)
    const next = clashBalance(card, level, 2)
    if (card.kind === 'trap') assert.equal(next.power, old.power + 2, card.id)
    if (
      card.kind === 'equipment' &&
      (card.effect === 'boost' || card.effect === 'sharpen')
    )
      assert.ok(next.bonus > old.bonus, card.id)
    if (card.effect === 'armor') {
      assert.ok(
        clashArmorGain(card.id, level, 2) >= clashArmorGain(card.id, level, 1),
      )
      assert.equal(clashArmorHeal(level, 2), clashArmorHeal(level, 1) + 2)
    }
    if (card.effect === 'grant')
      assert.equal(clashGrantPower(level, 2), clashGrantPower(level, 1) + 1)
  }
}
assert.equal(createClash().balanceVersion, 2)
assert.equal(
  createClash('catgirls', 'ironjaw', 1, { balanceVersion: 1 }).balanceVersion,
  undefined,
)

// Actual gear plays (not only the printed formulas) use the stronger profile.
for (const version of [1, 2] as const) {
  const state = createClash('ironjaw', 'catgirls', 1108, {
    balanceVersion: version,
  })
  state.round = 2
  state.hands.player = ['plating']
  state.units = [{ ...follower('player', 2, 9001, 8, 2), hp: 4 }]
  const plated = playClash(state, 'player', 'plating', 2)
  assert.equal(plated.units[0]!.armor, version === 2 ? 2 : 1)
  assert.equal(plated.units[0]!.hp, version === 2 ? 6 : 4)
}

// The stronger live trap can kill outright. Legacy fixtures above still prove
// the original survival, armor-shear and defuse rules without changing them.
{
  const state = createClash('ironjaw', 'bloodfairies', 1962, {
    balanceVersion: 2,
  })
  state.round = 2
  state.hands.player = ['scrapper']
  state.traps = [{ side: 'enemy', lane: 2, cardId: 'bloodwire', level: 1 }]
  const sprung = playClash(state, 'player', 'scrapper', 2)
  const victim = sprung.units.find((u) => u.side === 'player' && u.lane === 2)
  assert.equal(sprung.traps.length, 0)
  assert.ok(!victim || victim.hp <= caughtFighter!.hp - 2)
  assert.deepEqual(
    sprung,
    playClash(structuredClone(state), 'player', 'scrapper', 2),
  )
}

// Constructed heavy removal competes with two separate plays. V1 keeps its
// original power; actual V2 damage and the printed rules must agree.
for (const [id, extra] of [
  ['s2-exchange-compound-interest-notice', 3],
  ['s3-exchange-compound-notice', 3],
  ['s2-bloodfairies-glitterglass-flood', 3],
  ['s3-bloodfairies-cathedral-noise', 2],
  ['s2-riot-friendly-fire-rehearsal', 2],
] as const) {
  const card = cardById(id)
  assert.equal(card.kind, 'spell')
  assert.equal(clashPlayCost(card), 2)
  for (const level of [1, 2, 3])
    assert.equal(
      clashBalance(card, level, 2).power,
      clashBalance(card, level, 1).power + extra,
      id,
    )
  for (const version of [1, 2] as const) {
    assert.ok(card.team !== 'mercenary')
    const state = createClash(card.team, 'ironjaw', 1108, {
      balanceVersion: version,
    })
    state.round = 2
    state.hands.player = [id]
    state.units = [follower('enemy', 2, 9001, 12)]
    const cast = playClash(state, 'player', id, 2)
    const target = cast.units.find((u) => u.uid === 9001)!
    const power = clashBalance(card, 1, version).power
    assert.equal(target.hp, 12 - power, id)
    assert.ok(
      clashCardText(card, 1, undefined, version).includes(String(power)),
    )
    if (card.effect === 'debt') assert.ok(target.rooted)
  }
}

{
  const face = readFileSync('components/slime-city-clash-card-face.vue', 'utf8')
  assert.match(
    face,
    /v-if="card.kind === 'creature'" class="ccf-fighter-stats"/,
  )
  assert.match(face, /class="ccf-attack"[^>]*>[\s\S]*?balance\.attack/)
  assert.match(face, /class="ccf-toughness"[^>]*>[\s\S]*?balance\.hp/)
  assert.match(face, /class="ccf-armor" :armor="balance\.armor"/)
  assert.match(face, /\.ccf-attack \{\s*grid-area: 1 \/ 1;/)
  assert.match(face, /\.ccf-toughness \{\s*grid-area: 1 \/ 2;/)
  assert.match(face, /\.ccf-armor \{\s*grid-area: 2 \/ 2;/)
  assert.match(
    face,
    /\.ccf-attack,\s*\.ccf-toughness \{[\s\S]*?font-size: 12cqw;/,
  )
  assert.match(face, /v-else class="ccf-top"/)
}

{
  const face = readFileSync('components/slime-city-clash-card-face.vue', 'utf8')
  assert.equal(
    [...face.matchAll(/<i v-for="n in plays" :key="n" aria-hidden="true" \/>/g)]
      .length,
    2,
  )
  assert.doesNotMatch(face, /\{\{ plays \}\} PLAY/)
  assert.match(face, /\.ccf-cost i \{[\s\S]*?width: 8cqw;/)
}
