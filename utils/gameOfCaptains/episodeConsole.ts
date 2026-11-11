/**
 * Space Couch's episode game board.
 * A world visit is a TV episode: dispatch the named cast, then turn the planet,
 * occupied casino and Serendipity decks. The recurring nemesis joins even chapters.
 * Optional fields retain the existing v1 VoyageRun save format.
 */
import type { CrewId, VoyageRun } from './rules'
import type { Skill } from './crewAssignments'
import {
  knownRedshirtSkills,
  type RedshirtKnowledge,
} from './redshirtKnowledge'
import { antagonistFor } from './rules'
import { CAPTAIN_STATS, CREW_PROFILES } from './crewAssignments'
import { currentExpedition, deployExpedition } from './expedition'
import type { ExpeditionEncounter } from './expeditionLocal'
import { REDSHIRT_BY_ID } from './redshirts'
import { availableStarQuest, starSignFor } from './starSigns'
import { cloneOddsBonus } from './cloneSaga'
import {
  chapterSystem,
  newVenueProgress,
  casinoIncident,
  casinoIncidentSetup,
  afterHoursIncident,
  visitCasinoVenue,
  type CasinoChoice,
} from './solarCircuit'
import { nemesisMove } from './voyageMap'
import { planetReprise } from './planetReprises'
import { PLOT_TABLE_LINES, transitLine } from './transitLines'
import { CONSTELLATION_CODAS, SETBACK_LINES, freshLine } from './freshLines'

export type EpisodeDeck =
  'planet' | 'casino' | 'serendipity' | 'constellation' | 'nemesis'
export type EpisodeChoice = CasinoChoice
export type EpisodeDraw = {
  chapter: number
  day: number
  deck: EpisodeDeck
  cardId: string
  choice: EpisodeChoice
  result: string
  cast?: string[]
  skill?: Skill
  chance?: number
  successful?: boolean
}
export type EpisodeQuestResult = {
  chance?: number
  successful?: boolean
  durationDays?: 1 | 2 | 3
  returnedDay?: number
}
export type EpisodeRun = VoyageRun & { episodeDrawHistory?: EpisodeDraw[] }
export type EpisodeAssignment = { encounterId: string; lead: string }

const hash = (s: string): number => {
  let value = 2166136261
  for (const char of s)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  return value
}
const clamp = (v: number) => Math.max(8, Math.min(94, v))

const PLANET_CARDS = [
  {
    title: 'The Moon That Requested Custody',
    skill: 'diplomacy',
    setup:
      'A moon demands shared custody of its own tides. The colony has misplaced every copy of its birth certificate.',
    ask: 'Local residents vote to lend the moon its tides on alternate Thursdays.',
    document: 'The ancient ownership deed names the moon as its own guardian.',
    override:
      'The couch relocates one tide; three coastal councils send invoices.',
    crew: 'rue',
  },
  {
    title: 'A Refugee Named Wednesday',
    skill: 'rescue',
    setup:
      'A traveler has arrived six days before their own disappearance. The border guards want to arrest tomorrow.',
    ask: 'The traveler chooses a safe place to wait for the paradox.',
    document: 'A protected testimony makes the arrest order invalid.',
    override:
      'The couch shelters the traveler, acquiring a warrant from next week.',
    crew: 'tess',
  },
  {
    title: 'The Union of Unpaid Suns',
    skill: 'diplomacy',
    setup:
      'Three junior stars have gone on strike. Their contract provides twelve hours of darkness and no sick leave.',
    ask: 'The workers negotiate a rotating daylight schedule.',
    document:
      'Payroll records reveal the star owners have been billing the planets twice.',
    override: 'The couch restarts a star before its workers consent.',
    crew: 'pell',
  },
  {
    title: 'The Garden That Refused Oxygen',
    skill: 'science',
    setup:
      'A sentient orchard requests retirement from producing breathable air. A nearby settlement claims this is treason.',
    ask: 'A public forum funds an alternative oxygen supply.',
    document: 'The grove establishes that its employment contract was forged.',
    override:
      'The orchard complies, and the settlement loses its only willing ally.',
    crew: 'brin',
  },
  {
    title: 'The Diplomatic Temperature Incident',
    skill: 'culture',
    setup:
      'An assembly votes in frost patterns. A visiting ambassador has been translating every warning as a compliment.',
    ask: 'The delegates insist on an interpreter they actually trust.',
    document: 'An archived thermal recording identifies the disputed vote.',
    override:
      'The bubble heats the room; the assembly declares an emergency recess.',
    crew: 'taal',
  },
  {
    title: 'A Planet Requests an Exit Interview',
    skill: 'diplomacy',
    setup:
      'A quarry planet resigns from the mining company that claims to own its crust. The company has sent a lawyer and a drill.',
    ask: 'The planet dictates terms to a neutral mediator.',
    document: 'Mineral ledgers prove centuries of unpaid extraction.',
    override:
      'The couch disables the drill; a rescue corridor becomes the next negotiation.',
    crew: 'fen',
  },
  {
    title: 'The Twelve-Hour Apology',
    skill: 'culture',
    setup:
      'A colony broadcasts an apology that resets each listener’s memories. The descendants of its victims remain unconvinced.',
    ask: 'Survivors choose whether any apology will be heard.',
    document:
      'Unaltered recordings preserve the evidence before the broadcast is stopped.',
    override:
      'The couch cuts power, sparing new victims and erasing one witness account.',
    crew: 'mox',
  },
  {
    title: 'The Missing Note Committee',
    skill: 'science',
    setup:
      'A public alarm chime was outlawed for upsetting a royal concert. The emergency it warned of is arriving again.',
    ask: 'Residents decide when the alarm may be sounded.',
    document:
      'The missing waveform identifies who silenced the original warning.',
    override:
      'The couch sounds every bell and shatters the palace’s ceremonial windows.',
    crew: 'omi',
  },
  {
    title: 'The Interstellar Costume Inspector',
    skill: 'luck',
    setup:
      'An inspector has classified the red couch as a theatrical prop. Its passengers are now legally imaginary.',
    ask: 'The inspector interviews the passengers and reinstates their personhood.',
    document:
      'An old registration stamp proves the couch has always been a vehicle.',
    override:
      'The crew flies through customs while the paperwork keeps chasing them.',
    crew: 'jex',
  },
  {
    title: 'The Gravity Refund Office',
    skill: 'science',
    setup:
      'Residents who bought premium gravity have discovered the local company charges extra for walking downhill.',
    ask: 'Tenants negotiate a public gravity guarantee.',
    document: 'The hidden meter exposes the company’s fraudulent readings.',
    override:
      'The couch redirects gravity; loose furniture occupies the council chamber.',
    crew: 'sora',
  },
] as const

const PLANET_CHOICE_LABELS: Record<
  (typeof PLANET_CARDS)[number]['title'],
  Record<EpisodeChoice, string>
> = {
  'The Moon That Requested Custody': {
    ask: 'Offer the moon a hearing',
    document: 'Find the tidal deed',
    override: 'Move the tide yourself',
  },
  'A Refugee Named Wednesday': {
    ask: 'Let Wednesday decide',
    document: "Challenge tomorrow's warrant",
    override: 'Hide Wednesday in the cushions',
  },
  'The Union of Unpaid Suns': {
    ask: 'Hear the striking stars',
    document: 'Audit the daylight payroll',
    override: 'Jump-start a striking sun',
  },
  'The Garden That Refused Oxygen': {
    ask: 'Ask what the grove needs',
    document: 'Investigate the garden contract',
    override: 'Order the trees to breathe',
  },
  'The Diplomatic Temperature Incident': {
    ask: 'Let delegates pick an interpreter',
    document: 'Recover the frost vote',
    override: 'Warm up the whole meeting',
  },
  'A Planet Requests an Exit Interview': {
    ask: 'Offer a neutral mediator',
    document: 'Audit the quarry invoices',
    override: 'Disable the company drill',
  },
  'The Twelve-Hour Apology': {
    ask: 'Ask the survivors',
    document: 'Preserve original testimony',
    override: 'Silence the broadcast',
  },
  'The Missing Note Committee': {
    ask: 'Let residents sound the alarm',
    document: 'Recover the missing note',
    override: 'Ring every bell at once',
  },
  'The Interstellar Costume Inspector': {
    ask: 'Ask to be counted as real',
    document: 'Present the couch papers',
    override: 'Sail through imaginary customs',
  },
  'The Gravity Refund Office': {
    ask: 'Hear the tenants',
    document: 'Audit the downhill meter',
    override: 'Redirect the local gravity',
  },
}

function selectedPlanetCard(run: VoyageRun) {
  return PLANET_CARDS[
    hash(`${run.seed}:${run.chapter}:planet`) % PLANET_CARDS.length
  ]!
}
/** Encounter requirements must match the actual authored situation. */
const FRANCHISE_SKILLS: Record<string, Skill> = {
  mesa: 'diplomacy',
  arcade: 'tactics',
  library: 'science',
  orchid: 'rescue',
  rink: 'luck',
  opera: 'culture',
  laundry: 'science',
  sauna: 'rescue',
  bowling: 'luck',
  chapel: 'diplomacy',
  cinema: 'culture',
  mech: 'tactics',
  farm: 'rescue',
  haunt: 'culture',
  karaoke: 'culture',
  diner: 'diplomacy',
  market: 'diplomacy',
  museum: 'science',
  observatory: 'science',
  carnival: 'luck',
}
const STAR_SKILLS: Record<string, Skill> = {
  'northern-sloth': 'rescue',
  'princess-mantic-shrimp': 'diplomacy',
  'velvet-comet': 'culture',
  'clockwork-minnow': 'science',
  'royal-dust-bunny': 'rescue',
  'laughing-leviathan': 'culture',
  'nebular-teapot': 'diplomacy',
  'three-headed-librarian': 'science',
  'feral-umbrella': 'tactics',
  'last-lantern': 'rescue',
  'moonlit-upholsterer': 'culture',
  'cosmic-turnip': 'luck',
}
const NEMESIS_SKILLS: Record<string, Skill> = {
  auditor: 'science',
  moth: 'culture',
  curdle: 'science',
  showrunner: 'tactics',
  regent: 'diplomacy',
  'brass-choir': 'culture',
  chancellor: 'diplomacy',
  'kindly-swarm': 'rescue',
}
export function episodePlotConnection(
  run: VoyageRun,
  deck: EpisodeDeck,
  cast: string[],
): string | null {
  if (deck !== 'planet') return null
  const connection = selectedPlanetCard(run).crew
  if (!cast.includes(connection)) return null
  const officer = CREW_PROFILES.find((p) => p.id === connection)
  return officer
    ? officer.name +
        ' knows this planetary dilemma; their prior field experience gives the team a home advantage.'
    : null
}
export function episodeDuoExperience(run: VoyageRun, cast: string[]): number {
  if (cast.length !== 2 || new Set(cast).size !== 2) return 0
  const partnership = [...cast].sort().join(':')
  return Math.min(
    3,
    ((run as EpisodeRun).episodeDrawHistory ?? []).filter(
      (draw) =>
        draw.successful &&
        draw.cast?.length === 2 &&
        [...draw.cast].sort().join(':') === partnership,
    ).length,
  )
}
export const EPISODE_CHOICES: readonly {
  id: EpisodeChoice
  label: string
}[] = [
  { id: 'ask', label: 'Ask permission' },
  { id: 'document', label: 'Find the evidence' },
  { id: 'override', label: 'Intervene' },
]

export function episodeChoiceLabel(
  run: VoyageRun,
  deck: EpisodeDeck,
  choice: EpisodeChoice,
): string {
  if (deck === 'planet')
    return PLANET_CHOICE_LABELS[selectedPlanetCard(run).title][choice]
  return EPISODE_CHOICES.find((item) => item.id === choice)?.label ?? choice
}

export function episodeChoiceStakes(
  run: VoyageRun,
  deck: EpisodeDeck,
  choice: EpisodeChoice,
): string {
  const venue = deck === 'casino' || deck === 'serendipity'
  const venueExpense =
    run.supplies > 0 ? ', supplies -1' : ', no supplies to spend'
  const success =
    choice === 'ask'
      ? `trust +2, host standing +2${venue ? venueExpense : ''}`
      : choice === 'document'
        ? 'trust +1, records +2, reputation +1'
        : 'trust unchanged, operator standing +1, supplies +1'
  return `SUCCESS: ${success}. SETBACK: trust -1${venue ? venueExpense : ''}.`
}
/**
 * A failed field objective cannot be described as successful consent or a
 * settled claim. Each deck and order walks its own pool of setbacks, counted
 * by earlier failures of the same kind this voyage, so a repeated mistake is
 * at least a new joke.
 */
function plotSetback(
  run: VoyageRun,
  deck: EpisodeDeck,
  choice: EpisodeChoice,
): string {
  const earlier = ((run as EpisodeRun).episodeDrawHistory ?? []).filter(
    (draw) =>
      draw.deck === deck && draw.choice === choice && draw.successful === false,
  ).length
  return freshLine(
    SETBACK_LINES[deck][choice],
    `setback:${deck}:${choice}`,
    run.seed,
    earlier,
  )
}
export function episodeDecks(run: VoyageRun): EpisodeDeck[] {
  const decks: EpisodeDeck[] = ['planet', 'casino', 'serendipity']
  // One earned quest from the matching constellation, never another sign's.
  if (availableStarQuest(run.starAssessment, run.chapter, run.worldFlags ?? []))
    decks.push('constellation')
  if (run.chapter % 2 === 0) decks.push('nemesis')
  return decks
}
export function episodeDraws(run: VoyageRun): EpisodeDraw[] {
  return ((run as EpisodeRun).episodeDrawHistory ?? []).filter(
    (entry) => entry.chapter === run.chapter,
  )
}
export function episodeDeckDone(run: VoyageRun, deck: EpisodeDeck): boolean {
  return episodeDraws(run).some((entry) => entry.deck === deck)
}
export function episodeMajorComplete(run: VoyageRun): boolean {
  const done = new Set(
    run.expeditionVisit?.results.map((r) => r.encounterId) ?? [],
  )
  return currentExpedition(run)
    .filter((enc) => enc.priority === 'major')
    .every((enc) => done.has(enc.id))
}
export function episodeDecksDone(run: VoyageRun): boolean {
  return episodeDecks(run).every((deck) => episodeDeckDone(run, deck))
}
export function episodeIncitingEvent(run: VoyageRun): string {
  const system = chapterSystem(run.seed, run.chapter)
  const cast = selectedPlanetCard(run)
  return `${system.name} insists: ${system.conflict} Meanwhile, ${cast.title.toLowerCase()} has been declared the emergency of the week.`
}
export function episodeCard(run: VoyageRun, deck: EpisodeDeck) {
  const system = chapterSystem(run.seed, run.chapter)
  if (deck === 'planet') {
    const selected = selectedPlanetCard(run)
    const id =
      'planet-' + selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const earlier = ((run as EpisodeRun).episodeDrawHistory ?? []).filter(
      (draw) =>
        draw.deck === 'planet' &&
        draw.cardId === id &&
        draw.chapter < run.chapter,
    )
    const previous = earlier.at(-1)
    const callback = previous
      ? planetReprise(
          selected.title,
          previous.choice,
          previous.successful,
          earlier.length,
        )
      : ''
    return {
      id,
      title: selected.title,
      setup: callback
        ? selected.setup + ' PREVIOUSLY ON THIS WORLD: ' + callback
        : selected.setup,
      link: run.crew.includes(selected.crew as CrewId)
        ? 'Crew connection: ' +
          (CREW_PROFILES.find((c) => c.id === selected.crew)?.name ?? 'Officer')
        : 'Planetary civic dilemma',
      outcomes: {
        ask: selected.ask,
        document: selected.document,
        override: selected.override,
      },
    }
  }
  if (deck === 'casino') {
    const incident = casinoIncident(run.seed, run.chapter, system)
    return {
      id: 'casino-' + system.id + '-' + run.chapter,
      title: incident.title,
      setup: casinoIncidentSetup(run.seed, run.chapter, system),
      link: system.casinoName + ' on the living blue giant ' + system.giant,
      outcomes: null,
    }
  }
  if (deck === 'serendipity') {
    const stage = Math.min(3, run.venueProgress?.barBeats[system.id] ?? 0)
    const beat = system.franchise.beats[stage]
    return {
      id: 'serendipity-' + system.franchise.id + '-' + stage,
      title: beat?.title ?? 'Vox’s After-Hours Ledger',
      setup:
        beat?.situation ?? afterHoursIncident(run.seed, run.chapter, system),
      link:
        'Barkeep Vox · ' + system.franchise.name + ' · chapter ' + (stage + 1),
      outcomes: beat
        ? { ask: beat.ask, document: beat.document, override: beat.override }
        : null,
    }
  }
  if (deck === 'constellation') {
    const quest = availableStarQuest(
      run.starAssessment,
      run.chapter,
      run.worldFlags ?? [],
    )
    // Only episodeDecks can authorize this card. Never reveal a different sign.
    if (!quest || !run.starAssessment)
      throw new Error('No constellation quest is available this episode')
    const sign = starSignFor(run.starAssessment.sign)
    return {
      id: quest.id,
      title: quest.title,
      setup: quest.setup,
      link: 'STAR CHART EXCLUSIVE · ' + sign.name + ' · ' + sign.epithet,
      outcomes: {
        ask: quest.ending + ' ' + constellationCoda(run, 'ask'),
        document: quest.ending + ' ' + constellationCoda(run, 'document'),
        override: quest.ending + ' ' + constellationCoda(run, 'override'),
      },
    }
  }
  const nemesis = antagonistFor(run)
  return {
    id: 'nemesis-' + nemesis.id + '-' + run.chapter,
    title: 'This Week’s Special Guest: ' + nemesis.name,
    setup: nemesisMove(nemesis, run.chapter),
    link: 'The principal enemy returns. Their previous decisions still count.',
    outcomes: nemesisOutcomes(nemesis.name, run.chapter),
  }
}
/** The coda for a constellation order, counted by earlier constellation draws. */
function constellationCoda(run: VoyageRun, choice: EpisodeChoice): string {
  const earlier = ((run as EpisodeRun).episodeDrawHistory ?? []).filter(
    (draw) => draw.deck === 'constellation',
  ).length
  return freshLine(
    CONSTELLATION_CODAS[choice],
    `constellation:${choice}`,
    run.seed,
    earlier,
  )
}
/**
 * The nemesis card comes up on chapters 2, 4, 6 and 8. Each visit escalates
 * in its own words, so a player who always files evidence (or always
 * charges) is not shown the same sentence four times in one voyage.
 */
function nemesisOutcomes(
  name: string,
  chapter: number,
): Record<EpisodeChoice, string> {
  const visit = Math.min(3, Math.max(0, Math.floor(chapter / 2) - 1))
  return {
    ask: [
      'Offer terms. The adversary must answer on the record.',
      `Offer terms again, in writing this time. ${name} replies within the hour, which is itself a kind of answer.`,
      `Offer terms in front of witnesses. ${name} counters with a list of conditions, one of which is reasonable.`,
      `Offer terms one last time. ${name} agrees to a meeting, if not yet a peace, and both sides bring a notary.`,
    ][visit]!,
    document: [
      'Publish the interference pattern to an independent tribunal.',
      `Publish the new interference to the same tribunal, which opens a second binder with ${name} on the spine.`,
      `File the pattern with three tribunals at once. ${name} cannot lose every copy, though it is seen trying.`,
      `Publish the full record, every move since the first world. The tribunal clears its afternoon for ${name}.`,
    ][visit]!,
    override: [
      'Disrupt the enemy’s operation before their witnesses arrive.',
      `Break up the operation mid-sentence. It works, and ${name} enters the couch in its ledger as a recurring expense.`,
      `Charge the operation directly. ${name} retreats, takes notes, and is clearly planning to bring the notes back.`,
      `Shut the operation down by force. The danger stops; ${name} tells everyone who will listen that the couch started it.`,
    ][visit]!,
  }
}
export function observedRedshirt(run: VoyageRun, id: string): boolean {
  return [
    ...(run.expeditionHistory ?? []).flatMap((visit) => visit.results),
    ...(run.expeditionVisit?.results ?? []),
  ].some((result) => result.lead === id)
}
// Each quest is a single simultaneous card round. Mission travel remains a separate system.
export function questDuration(_run: VoyageRun, _encounterId: string): 1 {
  return 1
}
function actualOdds(
  run: VoyageRun,
  enc: ExpeditionEncounter,
  lead: string,
): number {
  const profile = REDSHIRT_BY_ID[lead]
  const skills = profile
    ? profile.stats
    : lead === 'captain'
      ? CAPTAIN_STATS[run.captain]
      : CREW_PROFILES.find((officer) => officer.id === lead)?.stats
  if (!skills) return 0
  const secret =
    run.crew.includes(lead as CrewId) && enc.secretCrew.includes(lead as CrewId)
  const baseline = clamp(
    22 +
      skills[enc.skill] * 13 +
      cloneOddsBonus(run, lead, enc.skill) +
      (secret ? 15 : 0) -
      (enc.priority === 'major' ? 12 : 0),
  )
  // Fatalities are rolled independently at deployment. Keep this as the
  // conditional mission skill chance; adjust the displayed forecast below.
  return baseline
}
export function questOdds(
  run: VoyageRun,
  enc: ExpeditionEncounter,
  lead: string,
  knowledge: RedshirtKnowledge = {},
): number | null {
  if (
    REDSHIRT_BY_ID[lead] &&
    !knownRedshirtSkills(run, knowledge, lead).includes(enc.skill)
  )
    return null
  const odds = actualOdds(run, enc, lead)
  return odds
    ? REDSHIRT_BY_ID[lead]
      ? Math.floor((odds * 2) / 3)
      : odds
    : null
}
export function dispatchEpisodeBatch(
  run: VoyageRun,
  assignments: EpisodeAssignment[],
): VoyageRun {
  if (run.phase !== 'expedition' || !run.expeditionVisit || !assignments.length)
    return run
  const all = currentExpedition(run)
  const done = new Set(run.expeditionVisit.results.map((r) => r.encounterId))
  const leads = new Set(run.expeditionVisit.results.map((r) => r.lead))
  const jobs = new Set<string>()
  for (const { encounterId, lead } of assignments) {
    const encounter = all.find((e) => e.id === encounterId)
    if (
      !encounter ||
      !lead ||
      done.has(encounterId) ||
      jobs.has(encounterId) ||
      leads.has(lead) ||
      !(
        lead === 'captain' ||
        run.crew.includes(lead as CrewId) ||
        run.redshirtRoster?.includes(lead)
      )
    )
      return run
    jobs.add(encounterId)
    leads.add(lead)
  }
  // One order sends the entire cast into parallel quests, never duplicated.
  let next = run
  const departure = run.day ?? run.chapter
  for (const { encounterId, lead } of assignments) {
    const encounter = all.find((e) => e.id === encounterId)!
    const durationDays = questDuration(run, encounterId)
    const candidate = deployExpedition(next, encounterId, lead)
    if (candidate === next) return run
    const last = candidate.expeditionVisit!.results.at(-1)!
    const chance = actualOdds(run, encounter, lead)
    const forecast = REDSHIRT_BY_ID[lead]
      ? Math.floor((chance * 2) / 3)
      : chance
    const roll =
      hash(`${run.seed}:${run.chapter}:${encounterId}:${lead}:success`) % 100
    const successful = !last.casualty && roll < chance
    const verdict = successful
      ? 'Field objective achieved; the local faction records your intervention.'
      : 'Field objective compromised; the local faction records the consequences.'
    const leadName =
      lead === 'captain'
        ? 'The captain'
        : (CREW_PROFILES.find((person) => person.id === lead)?.name ?? lead)
    // deployExpedition writes its prose before this roll exists, so a
    // command seat can read as triumphant on a failed card or out of its
    // depth on a passed one. The roll decides which story is told.
    const secretTail = last.secret
      ? ' SECRET DETOUR: ' + encounter.secretResult
      : ''
    const coherentOutcome =
      last.casualty || REDSHIRT_BY_ID[lead]
        ? last.outcome
        : successful
          ? `${leadName} handles ${encounter.title}. ${lead === 'captain' ? encounter.commandResult : encounter.commandResult.replace(/^The captain /, 'The officer ')}${secretTail}`
          : `${leadName} tries ${encounter.title}, but the ${encounter.skill} objective slips away. ${encounter.redshirtResult}${secretTail}`
    const result = {
      ...last,
      chance: forecast,
      successful,
      durationDays,
      returnedDay: departure + durationDays - 1,
      outcome: coherentOutcome + ' ' + verdict,
    }
    next = {
      ...candidate,
      trust: candidate.trust + (successful ? 1 : -1),
      reputation: candidate.reputation + (successful ? 1 : 0),
      worldFlags: [
        ...(candidate.worldFlags ?? []),
        `episode-quest:${encounterId}:${successful ? 'success' : 'failure'}`,
      ],
      expeditionVisit: {
        ...candidate.expeditionVisit!,
        results: [...candidate.expeditionVisit!.results.slice(0, -1), result],
      },
      scene: result.outcome,
      log: [
        ...candidate.log.slice(0, -1),
        `Expedition ${run.chapter} / ${encounter.title}: ${coherentOutcome}`,
        `Ship day ${departure}: ${encounter.title} ${successful ? 'passed' : 'failed'} (${forecast}% forecast, ${durationDays} round contract).`,
      ],
    }
  }
  return {
    ...next,
    day: departure,
    scene: `THE QUEST BOARD RETURNS. ${assignments.length} cards resolved in one round on ship day ${departure}. ${transitLine(PLOT_TABLE_LINES, 'plot-table', run.seed, run.chapter - 1)}`,
  }
}
/** The four permanent command seats run solar-system plot cards, not the redshirt corps. */
export function episodePlotSkill(run: VoyageRun, deck: EpisodeDeck): Skill {
  if (deck === 'planet') return selectedPlanetCard(run).skill
  const system = chapterSystem(run.seed, run.chapter)
  if (deck === 'casino')
    return casinoIncident(run.seed, run.chapter, system).skill
  if (deck === 'serendipity')
    return FRANCHISE_SKILLS[system.franchise.id] ?? 'culture'
  if (deck === 'constellation')
    return STAR_SKILLS[run.starAssessment?.sign ?? ''] ?? 'culture'
  return NEMESIS_SKILLS[antagonistFor(run).id] ?? 'tactics'
}
export function episodePlotSeats(run: VoyageRun, deck: EpisodeDeck): 1 | 2 {
  return hash(`${run.seed}:${run.chapter}:${deck}:seats`) % 3 === 0 ? 2 : 1
}
export function episodePlotOdds(
  run: VoyageRun,
  deck: EpisodeDeck,
  cast: string[],
): number {
  if (
    cast.length < 1 ||
    cast.length > episodePlotSeats(run, deck) ||
    new Set(cast).size !== cast.length ||
    cast.some((id) => id !== 'captain' && !run.crew.includes(id as CrewId))
  )
    return 0
  const skill = episodePlotSkill(run, deck)
  const command = cast.map((id) =>
    id === 'captain'
      ? CAPTAIN_STATS[run.captain][skill]
      : CREW_PROFILES.find((p) => p.id === id)!.stats[skill],
  )
  const connected =
    deck === 'planet' && cast.includes(selectedPlanetCard(run).crew)
  const rapport = episodeDuoExperience(run, cast)
  return clamp(
    14 +
      command[0]! * 13 +
      (command[1] ? 8 + command[1] * 5 : 0) +
      (connected ? 12 : 0) +
      rapport * 5 -
      (deck === 'nemesis' ? nemesisFilePenalty(run) : 0),
  )
}
/**
 * Overrides, bold detours and slow audits all add to the nemesis's file on
 * the couch (`nemesisPressure`). Each open grievance makes the nemesis card
 * two points harder, up to sixteen, so the pressure the choices promise is
 * pressure the crew actually feels.
 */
export function nemesisFilePenalty(run: VoyageRun): number {
  return Math.min(16, Math.max(0, run.nemesisPressure ?? 0) * 2)
}
export function drawEpisodeDeck(
  run: VoyageRun,
  deck: EpisodeDeck,
  choice: EpisodeChoice,
  cast: string[] = ['captain'],
): EpisodeRun {
  if (
    run.phase !== 'expedition' ||
    !episodeMajorComplete(run) ||
    !episodePlotOdds(run, deck, cast) ||
    !EPISODE_CHOICES.some((option) => option.id === choice)
  )
    return run
  const decks = episodeDecks(run)
  const nextDeck = decks.find((item) => !episodeDeckDone(run, item))
  if (nextDeck !== deck) return run
  const card = episodeCard(run, deck)
  const skill = episodePlotSkill(run, deck)
  const chance = episodePlotOdds(run, deck, cast)
  const successful =
    hash(
      `${run.seed}:${run.chapter}:${deck}:${choice}:${cast.join('+')}:plot`,
    ) %
      100 <
    chance
  const named = cast
    .map((id) =>
      id === 'captain'
        ? 'the captain'
        : CREW_PROFILES.find((p) => p.id === id)!.name,
    )
    .join(' and ')
  const names = named.charAt(0).toUpperCase() + named.slice(1)
  const connection = episodePlotConnection(run, deck, cast)
  const rapport = episodeDuoExperience(run, cast)
  const pressure = Math.max(0, run.nemesisPressure ?? 0)
  const file =
    deck === 'nemesis' && pressure
      ? ` ${antagonistFor(run).name} keeps a file on the couch: ${pressure === 1 ? 'one open grievance' : pressure + ' open grievances'}, already counted in the forecast.`
      : ''
  const fieldReport = `${
    successful
      ? `${names} ${cast.length > 1 ? 'secure' : 'secures'} the ${skill} objective in one round (${chance}% forecast).`
      : `The ${skill} objective stays open after one round (${chance}% forecast).`
  }${file}${connection ? ' ' + connection : ''}${rapport ? ' ' + (rapport === 1 ? 'This team has worked together successfully once before.' : 'This team has ' + rapport + ' successful missions together behind it.') : ''}`
  const venue =
    deck === 'casino' ? 'casino' : deck === 'serendipity' ? 'bar' : null
  const outcome = card.outcomes?.[choice]
  // Failed attempts still consume this episode card, but never award a
  // completed venue stage or imply the blue-giant host consented.
  const failureScene = `${names} cannot secure the ${skill} objective. ${plotSetback(run, deck, choice)}`
  let changed: VoyageRun = run
  if (venue && !successful) {
    const system = chapterSystem(run.seed, run.chapter)
    const progress = run.venueProgress ?? newVenueProgress()
    changed = {
      ...run,
      supplies: Math.max(0, run.supplies - 1),
      venueProgress: {
        ...progress,
        choices: [
          ...progress.choices,
          {
            systemId: system.id,
            chapter: run.chapter,
            venue,
            choice,
            scene: failureScene,
          },
        ],
      },
    }
  } else if (venue) {
    changed = visitCasinoVenue(run, venue, choice)
  }
  const scene = !successful
    ? failureScene
    : venue
      ? changed.scene
      : (outcome ??
        (choice === 'ask'
          ? 'The adversary accepts a ceasefire long enough to hear the question.'
          : choice === 'document'
            ? 'Their private interference becomes a public record.'
            : 'The couch wins the immediate clash, but the nemesis starts a second file.'))
  if (!venue) {
    changed = {
      ...changed,
      trust:
        changed.trust +
        (successful
          ? choice === 'ask'
            ? 1
            : choice === 'override'
              ? -1
              : 0
          : 0),
      reputation:
        changed.reputation + (successful && choice === 'document' ? 1 : 0),
      supplies:
        changed.supplies + (successful && choice === 'override' ? 1 : 0),
      // A grievance count never goes below zero, however many are settled.
      nemesisPressure: Math.max(
        0,
        (changed.nemesisPressure ?? 0) +
          (deck === 'nemesis'
            ? successful && choice !== 'override'
              ? -1
              : 2
            : 0),
      ),
    }
  }
  const record: EpisodeDraw = {
    chapter: run.chapter,
    day: run.day ?? run.chapter,
    deck,
    cardId: card.id,
    choice,
    result: scene + ' ' + fieldReport,
    cast: [...cast],
    skill,
    chance,
    successful,
  }
  return {
    ...changed,
    episodeDrawHistory: [
      ...((run as EpisodeRun).episodeDrawHistory ?? []),
      record,
    ],
    worldFlags: [
      ...(changed.worldFlags ?? []),
      `episode-draw:${deck}:${choice}:${run.chapter}`,
      `episode-plot:${deck}:${successful ? 'success' : 'complication'}:${run.chapter}`,
      ...(deck === 'constellation' ? ['star-quest:' + card.id] : []),
    ],
    trust: changed.trust + (successful ? 1 : -1),
    scene: `[${deck.toUpperCase()} DECK] ${scene} ${fieldReport}`,
    log: [
      ...changed.log,
      `Ship day ${run.day ?? run.chapter}, ${deck} deck: ${card.title}. ${scene} ${fieldReport}`,
    ],
  }
}
export function episodeStanding(run: VoyageRun) {
  const result = { hosts: 0, records: 0, operators: 0, villains: 0 }
  for (const draw of (run as EpisodeRun).episodeDrawHistory ?? []) {
    // Legacy v1 draw records have no outcome field and keep prior credit.
    if (draw.successful === false) continue
    if (draw.choice === 'ask') result.hosts += 2
    if (draw.choice === 'document') result.records += 2
    if (draw.choice === 'override') result.operators += 1
    if (draw.deck === 'nemesis') result.villains += 1
  }
  return result
}
export function episodeEndingCoda(run: VoyageRun): VoyageRun {
  if (run.phase !== 'ending') return run
  const standings = episodeStanding(run)
  const wins = (run.expeditionHistory ?? [])
    .flatMap(
      (visit) =>
        visit.results as ((typeof visit.results)[number] &
          EpisodeQuestResult)[],
    )
    .filter((entry) => entry.successful).length
  let coda = ''
  if (standings.hosts >= 10 && wins >= 3)
    coda =
      'THE BLUE GIANTS’ ACCORD: The occupied casino hosts convene their own assembly. The captain receives an invitation as a witness, not an owner.'
  else if (standings.records >= 10 && wins >= 2)
    coda =
      'THE UNSEALED LEDGER: Serendipity franchises publish the occupation contracts. The evidence is permanent, even where the verdict is not.'
  else if (standings.operators >= 6)
    coda =
      'THE HOUSE ALWAYS REMEMBERS: The operators offer the couch an honorary casino. Every seat comes with an invoice and a consequence.'
  else if (standings.villains >= 3)
    coda =
      'THE FINAL BROADCAST: The nemesis survives the ratings, but the crew keeps the recording that could ruin the next season.'
  const sign = run.starAssessment ? starSignFor(run.starAssessment.sign) : null
  const finished =
    sign?.quests.filter((quest) =>
      (run.worldFlags ?? []).includes('star-quest:' + quest.id),
    ).length ?? 0
  const constellationCoda =
    sign && finished
      ? finished === 3
        ? 'THE CONSTELLATION FINALE: ' +
          sign.name +
          ' lights the last jump gate. All three secret quests were answered; ' +
          sign.quests[2].ending +
          ' ' +
          sign.omen
        : 'THE UNFINISHED STAR CHART: ' +
          sign.name +
          ' shines above ' +
          finished +
          ' completed secret mission(s). Some stars are still waiting for the next season.'
      : ''
  if (!coda && !constellationCoda) return run
  return {
    ...run,
    ending:
      constellationCoda && finished === 3
        ? (run.ending ?? 'Voyage Complete') + ' · ' + sign!.name
        : run.ending,
    scene:
      run.scene + ' ' + [coda, constellationCoda].filter(Boolean).join(' '),
    log: [
      ...run.log,
      ...[
        coda && 'Earned faction epilogue: ' + coda,
        constellationCoda && 'Earned star epilogue: ' + constellationCoda,
      ].filter((line): line is string => Boolean(line)),
    ],
  }
}
export function episodeStinger(run: VoyageRun): string {
  return episodeDecksDone(run)
    ? `NEXT WEEK ON SPACE COUCH: ${antagonistFor(run).name} is already preparing the paperwork for your next arrival. Will the captain finally read the terms of service? Tune in after the credits.`
    : 'The next card remains face down. Dramatic music plays over a legally questionable freeze-frame.'
}
