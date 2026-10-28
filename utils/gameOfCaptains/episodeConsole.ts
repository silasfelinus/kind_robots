/**
 * Space Couch's episode game board.
 * A world visit is a TV episode: dispatch the named cast, then turn the planet,
 * occupied casino and Serendipity decks. The recurring nemesis joins even chapters.
 * Optional fields retain the existing v1 VoyageRun save format.
 */
import type { CrewId, VoyageRun } from './rules'
import { antagonistFor } from './rules'
import { CAPTAIN_STATS, CREW_PROFILES } from './crewAssignments'
import { currentExpedition, deployExpedition } from './expedition'
import type { ExpeditionEncounter } from './expeditionLocal'
import { REDSHIRT_BY_ID } from './redshirts'
import { availableStarQuest, starSignFor } from './starSigns'
import {
  chapterSystem,
  casinoIncident,
  afterHoursIncident,
  visitCasinoVenue,
  type CasinoChoice,
} from './solarCircuit'
import { nemesisMove } from './voyageMap'

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
    setup:
      'Residents who bought premium gravity have discovered the local company charges extra for walking downhill.',
    ask: 'Tenants negotiate a public gravity guarantee.',
    document: 'The hidden meter exposes the company’s fraudulent readings.',
    override:
      'The couch redirects gravity; loose furniture occupies the council chamber.',
    crew: 'sora',
  },
] as const

export const EPISODE_CHOICES: readonly {
  id: EpisodeChoice
  label: string
  cost: string
}[] = [
  { id: 'ask', label: 'Ask permission', cost: 'Host +2 · trust +1' },
  {
    id: 'document',
    label: 'Find the evidence',
    cost: 'Records +2 · reputation +1',
  },
  { id: 'override', label: 'Intervene', cost: 'Supplies +1 · host -2' },
]
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
  const cast =
    PLANET_CARDS[
      hash(`${run.seed}:${run.chapter}:inciting`) % PLANET_CARDS.length
    ]!
  return `${system.name} insists: ${system.conflict} Meanwhile, ${cast.title.toLowerCase()} has been declared the emergency of the week.`
}
export function episodeCard(run: VoyageRun, deck: EpisodeDeck) {
  const system = chapterSystem(run.seed, run.chapter)
  if (deck === 'planet') {
    const selected =
      PLANET_CARDS[
        hash(`${run.seed}:${run.chapter}:planet`) % PLANET_CARDS.length
      ]!
    return {
      id: 'planet-' + selected.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: selected.title,
      setup: selected.setup,
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
      setup: incident.description,
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
        ask: quest.ending + ' You listen to the people caught in the omen.',
        document: quest.ending + ' The truth joins the official star chart.',
        override: quest.ending + ' The captain takes the risky shortcut.',
      },
    }
  }
  const nemesis = antagonistFor(run)
  return {
    id: 'nemesis-' + nemesis.id + '-' + run.chapter,
    title: 'This Week’s Special Guest: ' + nemesis.name,
    setup: nemesisMove(nemesis, run.chapter),
    link: 'The principal enemy returns. Their previous decisions still count.',
    outcomes: {
      ask: 'Offer terms. The adversary must answer on the record.',
      document: 'Publish the interference pattern to an independent tribunal.',
      override: 'Disrupt the enemy’s operation before their witnesses arrive.',
    },
  }
}
export function observedRedshirt(run: VoyageRun, id: string): boolean {
  return [
    ...(run.expeditionHistory ?? []).flatMap((visit) => visit.results),
    ...(run.expeditionVisit?.results ?? []),
  ].some((result) => result.lead === id)
}
export function questDuration(run: VoyageRun, encounterId: string): 1 | 2 | 3 {
  const roll = hash(`${run.seed}:${run.chapter}:${encounterId}:days`) % 10
  return roll < 7 ? 1 : roll < 9 ? 2 : 3
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
): number | null {
  if (REDSHIRT_BY_ID[lead] && !observedRedshirt(run, lead)) return null
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
  let longest = 1
  const departure = run.day ?? run.chapter
  for (const { encounterId, lead } of assignments) {
    const encounter = all.find((e) => e.id === encounterId)!
    const durationDays = questDuration(run, encounterId)
    longest = Math.max(longest, durationDays)
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
    const result = {
      ...last,
      chance: forecast,
      successful,
      durationDays,
      returnedDay: departure + durationDays - 1,
      outcome: last.outcome + ' ' + verdict,
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
        ...candidate.log,
        `Ship day ${departure}: ${encounter.title} ${successful ? 'passed' : 'failed'} (${forecast}% forecast, ${durationDays} day contract).`,
      ],
    }
  }
  return {
    ...next,
    day: departure + longest - 1,
    scene: `THE QUEST BOARD RETURNS. ${assignments.length} cards resolved across ${longest} ship day(s). The planet, casino and Serendipity decks are now on the table.`,
  }
}
export function drawEpisodeDeck(
  run: VoyageRun,
  deck: EpisodeDeck,
  choice: EpisodeChoice,
): EpisodeRun {
  if (
    run.phase !== 'expedition' ||
    !episodeMajorComplete(run) ||
    !EPISODE_CHOICES.some((option) => option.id === choice)
  )
    return run
  const decks = episodeDecks(run)
  const nextDeck = decks.find((item) => !episodeDeckDone(run, item))
  if (nextDeck !== deck) return run
  const card = episodeCard(run, deck)
  const venue =
    deck === 'casino' ? 'casino' : deck === 'serendipity' ? 'bar' : null
  let changed = venue ? visitCasinoVenue(run, venue, choice) : run
  const outcome = card.outcomes?.[choice]
  const scene = venue
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
        changed.trust + (choice === 'ask' ? 1 : choice === 'override' ? -1 : 0),
      reputation: changed.reputation + (choice === 'document' ? 1 : 0),
      supplies: changed.supplies + (choice === 'override' ? 1 : 0),
      nemesisPressure:
        (changed.nemesisPressure ?? 0) +
        (deck === 'nemesis' ? (choice === 'override' ? 2 : -1) : 0),
    }
  }
  const record: EpisodeDraw = {
    chapter: run.chapter,
    day: run.day ?? run.chapter,
    deck,
    cardId: card.id,
    choice,
    result: scene,
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
      ...(deck === 'constellation' ? ['star-quest:' + card.id] : []),
    ],
    scene: `[${deck.toUpperCase()} DECK] ${scene}`,
    log: [
      ...changed.log,
      `Ship day ${run.day ?? run.chapter}, ${deck} deck: ${card.title}. ${scene}`,
    ],
  }
}
export function episodeStanding(run: VoyageRun) {
  const result = { hosts: 0, records: 0, operators: 0, villains: 0 }
  for (const draw of (run as EpisodeRun).episodeDrawHistory ?? []) {
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
