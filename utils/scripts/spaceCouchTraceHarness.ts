import assert from 'node:assert/strict'
import {
  ANTAGONISTS,
  CAPTAINS,
  CREW,
  advanceVoyageDay,
  antagonistFor,
  assignAwayTeam,
  beginCrewDetour,
  chooseMission,
  configurePocketRoom,
  counterCrew,
  crewDetourOptions,
  decidePolicy,
  finishVoyage,
  launchMission,
  missionBoard,
  missionFor,
  nextDestination,
  previewMission,
  rechargeCouchShield,
  resolveCrewDetour,
  restoreVoyage,
  stageCrewDetour,
  startVoyage,
  type CaptainId,
  type CrewId,
  type DetourApproach,
  type FinaleStrategy,
  type PocketRoom,
  type VoyageRun,
} from '../gameOfCaptains/rules'
import {
  arriveAtWorld,
  currentExpedition,
  hireRedshirt,
  startWorldTravel,
} from '../gameOfCaptains/expedition'
import {
  EPISODE_CHOICES,
  dispatchEpisodeBatch,
  drawEpisodeDeck,
  episodeDeckDone,
  episodeDecks,
  episodeDecksDone,
  episodeEndingCoda,
  episodeMajorComplete,
  episodePlotOdds,
  episodePlotSeats,
  episodePlotSkill,
  type EpisodeChoice,
  type EpisodeDeck,
} from '../gameOfCaptains/episodeConsole'
import { leaveExpedition } from '../gameOfCaptains/expedition'
import {
  chooseTrioStep,
  restoreTrioAdventure,
  trioEpilogue,
  trioStepDue,
  type TrioEndingIndex,
} from '../gameOfCaptains/trioAdventures'
import {
  chooseRomance,
  relationshipEpilogue,
  romanceMoment,
} from '../gameOfCaptains/romance'
import {
  captainInstinctAvailable,
  chooseCaptainInstinct,
} from '../gameOfCaptains/captainInstincts'
import {
  advanceCloneQuest,
  cloneCandidates,
  cloneEndingCoda,
  printClone,
  recordCloneMissions,
} from '../gameOfCaptains/cloneSaga'
import { CAPTAIN_STATS, CREW_PROFILES } from '../gameOfCaptains/crewAssignments'
import { VOYAGE_CHAPTERS } from '../gameOfCaptains/voyageMap'
import {
  CAPTAIN_ORIGINS,
  type CaptainOriginId,
} from '../gameOfCaptains/captainOrigins'
import {
  createStarAssessment,
  type StarAnswers,
} from '../gameOfCaptains/starSigns'

/**
 * The title screen always asks for a background and the four star-chart
 * answers before the crew can board, so every trace carries both. A trace
 * that names neither takes them from its seed.
 */
export type Profile = { origin: CaptainOriginId; answers: StarAnswers }
export function profileFor(seed: number): Profile {
  return {
    origin: CAPTAIN_ORIGINS[seed % CAPTAIN_ORIGINS.length]!.id,
    answers: [
      seed % 3,
      (seed >> 2) % 3,
      (seed >> 4) % 3,
      (seed >> 6) % 3,
    ] as unknown as StarAnswers,
  }
}

/**
 * A deterministic Space Couch player that walks the same path the page does
 * (title → captain → crew → travel → expedition quests and episode decks →
 * call → transit → order → debrief → errands, interludes → finale), through
 * the same compositions the store makes. Traces never inject flags or stats.
 *
 * Every state it passes through is checked by `inspect`: it must save and
 * load unchanged, hold finite stats, read without template leaks and offer
 * the player at least one control that moves the voyage (the softlock probe).
 */

/** The store's compositions, mirrored so a trace plays what a click plays. */
export const act = {
  begin: (
    captain: CaptainId,
    crew: CrewId[],
    seed: number,
    profile: Profile = profileFor(seed),
  ) =>
    startVoyage(
      captain,
      crew,
      seed,
      createStarAssessment(profile.answers)!,
      profile.origin,
    ),
  travel: startWorldTravel,
  arrive: arriveAtWorld,
  hire: hireRedshirt,
  deployBatch: (
    run: VoyageRun,
    batch: { encounterId: string; lead: string }[],
  ) => recordCloneMissions(run, dispatchEpisodeBatch(run, batch)),
  draw: (
    run: VoyageRun,
    deck: EpisodeDeck,
    choice: EpisodeChoice,
    cast: string[],
  ) => drawEpisodeDeck(run, deck, choice, cast) as VoyageRun,
  endExpedition: (run: VoyageRun) =>
    episodeDecksDone(run) ? leaveExpedition(run) : run,
  cloneAdvance: advanceCloneQuest,
  clonePrint: printClone,
  chart: chooseMission,
  captainAction: chooseCaptainInstinct,
  assign: assignAwayTeam,
  chooseRoom: configurePocketRoom,
  rechargeShield: rechargeCouchShield,
  launch: launchMission,
  advanceDay: advanceVoyageDay,
  decide: decidePolicy,
  next: nextDestination,
  romance: chooseRomance,
  trio: chooseTrioStep,
  detour: beginCrewDetour,
  planDetour: stageCrewDetour,
  resolveDetour: resolveCrewDetour,
  finish: (run: VoyageRun, strategy: FinaleStrategy) =>
    cloneEndingCoda(
      episodeEndingCoda(
        trioEpilogue(relationshipEpilogue(finishVoyage(run, strategy))),
      ),
    ),
  /** What `store.load` does with a save. */
  load: (raw: unknown) =>
    restoreTrioAdventure(restoreVoyage(JSON.parse(JSON.stringify(raw)))),
}

const LEAK = /\bundefined\b|\bNaN\b|\[object Object\]|\$\{/
const PHASES = [
  'briefing',
  'travel',
  'expedition',
  'transit',
  'decision',
  'debrief',
  'crew-quest',
  'finale',
  'ending',
]

export type Control = { label: string; run: VoyageRun }

const commandSeats = (run: VoyageRun) => ['captain', ...run.crew]
const fit = (run: VoyageRun) =>
  run.crew.filter((id) => (run.injuredUntil?.[id] ?? 0) <= (run.day ?? 1))
const stat = (run: VoyageRun, id: string, skill: string) =>
  id === 'captain'
    ? CAPTAIN_STATS[run.captain][skill as keyof (typeof CAPTAIN_STATS)['fluke']]
    : (CREW_PROFILES.find((p) => p.id === id)?.stats[
        skill as keyof (typeof CAPTAIN_STATS)['fluke']
      ] ?? 0)

/** Leads for one quest board order: command seats on the majors, then redshirts. */
export function questBatch(
  run: VoyageRun,
  sideQuests: boolean,
  redshirtsFirst = false,
) {
  const visit = run.expeditionVisit
  if (!visit) return []
  const done = new Set(visit.results.map((r) => r.encounterId))
  const busy = new Set(visit.results.map((r) => r.lead))
  const free = [...commandSeats(run), ...(run.redshirtRoster ?? [])].filter(
    (id) => !busy.has(id),
  )
  const open = currentExpedition(run).filter((enc) => !done.has(enc.id))
  const majors = open.filter((enc) => enc.priority === 'major')
  const minors = sideQuests
    ? open.filter((enc) => enc.priority === 'minor')
    : []
  const batch: { encounterId: string; lead: string }[] = []
  for (const enc of majors) {
    const command = free
      .filter((id) => commandSeats(run).includes(id) !== redshirtsFirst)
      .sort((a, b) => stat(run, b, enc.skill) - stat(run, a, enc.skill))[0]
    const lead = command ?? free[0]
    if (!lead) break
    batch.push({ encounterId: enc.id, lead })
    free.splice(free.indexOf(lead), 1)
  }
  for (const enc of minors) {
    const lead = free[0]
    if (!lead) break
    batch.push({ encounterId: enc.id, lead })
    free.shift()
  }
  return batch
}

/** The best single command seat (or two) for a plot deck card. */
export function plotCast(run: VoyageRun, deck: EpisodeDeck): string[] {
  const skill = episodePlotSkill(run, deck)
  const ranked = commandSeats(run).sort(
    (a, b) => stat(run, b, skill) - stat(run, a, skill),
  )
  return ranked.slice(0, episodePlotSeats(run, deck))
}

/**
 * Every control the page enables in this state, with the state it leads to.
 * Controls that would not change the voyage are dropped: those are the
 * buttons a player can press without escaping the screen.
 */
export function controls(run: VoyageRun): Control[] {
  const out: Control[] = []
  const add = (label: string, next: VoyageRun) => {
    if (next !== run) out.push({ label, run: next })
  }
  const expeditionDone = (run.expeditionHistory ?? []).some(
    (visit) => visit.chapter === run.chapter,
  )
  switch (run.phase) {
    case 'briefing': {
      if (!expeditionDone) add('travel', act.travel(run))
      if (!expeditionDone)
        for (const call of missionBoard(run))
          add('chart:' + call.id, act.chart(run, call.id))
      if (captainInstinctAvailable(run)) {
        add('instinct:impulse', act.captainAction(run, 'impulse'))
        add('instinct:restraint', act.captainAction(run, 'restraint'))
      }
      if (expeditionDone) {
        const staffed = act.assign(run, fit(run))
        if (previewMission(staffed).eligible) add('launch', act.launch(staffed))
        add('launch:remote', act.launch(act.assign(run, [])))
      }
      add('recharge', act.rechargeShield(run))
      add('wait', act.advanceDay(run))
      add('hire', act.hire(run))
      break
    }
    case 'travel':
      add('arrive', act.arrive(run))
      add('hire', act.hire(run))
      break
    case 'expedition': {
      if (!episodeMajorComplete(run)) {
        add('dispatch', act.deployBatch(run, questBatch(run, true)))
        add('dispatch:majors', act.deployBatch(run, questBatch(run, false)))
      } else {
        const side = questBatch(run, true)
        if (side.length) add('dispatch:side', act.deployBatch(run, side))
      }
      const deck = episodeDecks(run).find((d) => !episodeDeckDone(run, d))
      if (deck && episodeMajorComplete(run))
        for (const choice of EPISODE_CHOICES)
          add(
            `draw:${deck}:${choice.id}`,
            act.draw(run, deck, choice.id, plotCast(run, deck)),
          )
      add('finish-expedition', act.endExpedition(run))
      add('hire', act.hire(run))
      for (const choice of ['ask', 'document', 'override'] as const)
        add('clone:' + choice, act.cloneAdvance(run, choice))
      for (const candidate of cloneCandidates(run))
        if (candidate.available)
          add('print:' + candidate.id, act.clonePrint(run, candidate.id))
      break
    }
    case 'transit':
      add('wait', act.advanceDay(run))
      break
    case 'decision':
      for (const policy of ['aid', 'observe', 'intervene'] as const)
        add('order:' + policy, act.decide(run, policy))
      break
    case 'debrief': {
      for (const id of crewDetourOptions(run))
        add('detour:' + id, act.detour(run, id))
      for (const choice of romanceMoment(run)?.choices ?? [])
        add('romance:' + choice.id, act.romance(run, choice.id))
      if (trioStepDue(run))
        for (const option of [0, 1] as const)
          add('trio:' + option, act.trio(run, option))
      add('next', act.next(run))
      break
    }
    case 'crew-quest':
      for (const approach of ['careful', 'bold'] as const) {
        if (!run.detour?.gambit)
          add('gambit:' + approach, act.planDetour(run, approach))
        else add('resolve:' + approach, act.resolveDetour(run, approach))
      }
      break
    case 'finale':
      if (counterCrew(run).length)
        add('finish:counter', act.finish(run, 'counter'))
      add('finish:protect', act.finish(run, 'protect'))
      add('finish:compromise', act.finish(run, 'compromise'))
      break
  }
  return out
}

/** The per-state contract: saves, stats, prose and a way forward. */
export function inspect(run: VoyageRun, where: string) {
  assert.ok(PHASES.includes(run.phase), `${where}: phase ${run.phase}`)
  const clone = JSON.parse(JSON.stringify(run))
  assert.deepEqual(act.load(clone), clone, `${where}: saves and loads intact`)
  for (const key of [
    'supplies',
    'trust',
    'intervention',
    'reputation',
    'chapter',
    'day',
    'shieldCharge',
  ] as const) {
    const value = run[key]
    if (value === undefined) continue
    assert.ok(Number.isFinite(value), `${where}: ${key} is ${value}`)
  }
  assert.ok(run.supplies >= 0, `${where}: supplies ${run.supplies}`)
  const shield = run.shieldCharge ?? 2
  assert.ok(shield >= 0 && shield <= 3, `${where}: shield ${shield}`)
  assert.ok(
    run.chapter >= 1 && run.chapter <= VOYAGE_CHAPTERS,
    `${where}: chapter`,
  )
  assert.ok(run.scene.trim().length > 0, `${where}: empty scene`)
  assert.ok(!LEAK.test(run.scene), `${where}: scene leak: ${run.scene}`)
  const last = run.log.at(-1)
  if (last) assert.ok(!LEAK.test(last), `${where}: log leak: ${last}`)
  if (run.phase === 'ending') {
    assert.ok(run.ending, `${where}: an ending title`)
    assert.ok(run.nemesisEnding, `${where}: a nemesis ending`)
    assert.equal(controls(run).length, 0, `${where}: ending is terminal`)
  } else {
    assert.ok(
      controls(run).length > 0,
      `${where}: softlock — no control moves the voyage from ${run.phase}`,
    )
  }
}

export type Order = 'aid' | 'observe' | 'intervene' | 'miss'
export type Errand = [CrewId, DetourApproach, DetourApproach]
export type Driver = {
  name: string
  /** The order for this chapter's call; 'miss' waits until it expires. */
  order: (run: VoyageRun) => Order
  /** A call to chart before travelling, when it is on the board. */
  chart?: (run: VoyageRun) => string | undefined
  errand?: (run: VoyageRun) => Errand | null
  trio?: (run: VoyageRun, step: number) => TrioEndingIndex | null
  romance?: (run: VoyageRun, ids: string[]) => string | null
  instinct?: (run: VoyageRun) => 'impulse' | 'restraint' | null
  episode?: (run: VoyageRun, deck: EpisodeDeck) => EpisodeChoice
  sideQuests?: boolean
  /** Send redshirts to the major quests before any command seat. */
  redshirtsFirst?: boolean
  room?: (run: VoyageRun) => PocketRoom | null
  /** Officers to send; defaults to every fit officer. */
  away?: (run: VoyageRun) => CrewId[]
  finale: FinaleStrategy | ((run: VoyageRun) => FinaleStrategy)
  profile?: Profile
}

export type Trace = { run: VoyageRun; steps: string[] }

/** Plays one voyage from the title screen to its ending through the page's path. */
export function playVoyage(
  captain: CaptainId,
  crew: CrewId[],
  seed: number,
  driver: Driver,
  options: {
    inspectEvery?: boolean
    from?: VoyageRun
    onStep?: (label: string, before: VoyageRun, after: VoyageRun) => void
  } = {},
): Trace {
  let run = options.from ?? act.begin(captain, crew, seed, driver.profile)
  const steps: string[] = []
  const where = () =>
    `${driver.name}/${run.captain}/${run.crew.join('+')}/seed ${run.seed} ch${run.chapter} ${run.phase}`
  const step = (label: string, next: VoyageRun, required = true) => {
    if (required) assert.notEqual(next, run, `${where()}: ${label} did nothing`)
    if (next === run) return
    options.onStep?.(label, run, next)
    run = next
    steps.push(label)
    if (options.inspectEvery !== false)
      inspect(run, `${where()} after ${label}`)
  }
  if (options.inspectEvery !== false) inspect(run, `${where()} start`)
  for (let guard = 0; run.phase !== 'ending'; guard++) {
    assert.ok(guard < 400, `${where()}: voyage did not end`)
    switch (run.phase) {
      case 'briefing': {
        const visited = (run.expeditionHistory ?? []).some(
          (visit) => visit.chapter === run.chapter,
        )
        const order = driver.order(run)
        if (!visited) {
          const target = driver.chart?.(run)
          if (target && missionFor(run).id !== target)
            step('chart:' + target, act.chart(run, target), false)
          const instinct = driver.instinct?.(run)
          if (instinct && captainInstinctAvailable(run))
            step(
              'instinct:' + instinct,
              act.captainAction(run, instinct),
              false,
            )
          if (order === 'miss') {
            step('wait', act.advanceDay(run))
            break
          }
          step('travel', act.travel(run))
          break
        }
        if (order === 'miss') {
          step('wait', act.advanceDay(run))
          break
        }
        const room = driver.room?.(run)
        if (room) step('room:' + room, act.chooseRoom(run, room), false)
        if ((run.shieldCharge ?? 2) === 0)
          step('recharge', act.rechargeShield(run), false)
        const away = (driver.away?.(run) ?? fit(run)).filter((id) =>
          fit(run).includes(id),
        )
        step('assign', act.assign(run, away), false)
        step('launch', act.launch(run))
        break
      }
      case 'travel':
        step('arrive', act.arrive(run))
        break
      case 'expedition': {
        if (!episodeMajorComplete(run)) {
          step(
            'dispatch',
            act.deployBatch(
              run,
              questBatch(run, driver.sideQuests ?? true, driver.redshirtsFirst),
            ),
          )
          break
        }
        const deck = episodeDecks(run).find((d) => !episodeDeckDone(run, d))
        if (deck) {
          const choice = driver.episode?.(run, deck) ?? 'ask'
          step(
            `draw:${deck}:${choice}`,
            act.draw(run, deck, choice, plotCast(run, deck)),
          )
          break
        }
        step('finish-expedition', act.endExpedition(run))
        break
      }
      case 'transit':
        step('wait', act.advanceDay(run))
        break
      case 'decision': {
        const order = driver.order(run)
        step(
          'order:' + order,
          act.decide(run, order === 'miss' ? 'observe' : order),
        )
        break
      }
      case 'debrief': {
        const moment = romanceMoment(run)
        if (moment) {
          const pick = driver.romance?.(
            run,
            moment.choices.map((c) => c.id),
          )
          if (pick) {
            step('romance:' + pick, act.romance(run, pick as never))
            break
          }
        }
        const due = trioStepDue(run)
        if (due) {
          const option = driver.trio ? driver.trio(run, due.index) : 0
          if (option !== null) {
            step('trio:' + option, act.trio(run, option))
            break
          }
        }
        const errand = driver.errand?.(run)
        if (errand && crewDetourOptions(run).includes(errand[0])) {
          if (errand[2] === 'careful' && run.supplies < 1) errand[2] = 'bold'
          step('detour:' + errand[0], act.detour(run, errand[0]))
          step('gambit:' + errand[1], act.planDetour(run, errand[1]))
          step('resolve:' + errand[2], act.resolveDetour(run, errand[2]))
          break
        }
        step('next', act.next(run))
        break
      }
      case 'crew-quest':
        step('resolve:bold', act.resolveDetour(run, 'bold'))
        break
      case 'finale': {
        let order =
          typeof driver.finale === 'function'
            ? driver.finale(run)
            : driver.finale
        if (order === 'counter' && !counterCrew(run).length) order = 'protect'
        step('finish:' + order, act.finish(run, order))
        break
      }
    }
  }
  return { run, steps }
}

/** A seeded random player who presses any enabled control. */
export function randomWalk(
  start: VoyageRun,
  seed: number,
  maxSteps = 900,
  label = 'walk',
): Trace {
  let state = seed >>> 0 || 1
  const rand = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
  let run = start
  const steps: string[] = []
  for (let i = 0; run.phase !== 'ending'; i++) {
    const where = `${label}/${run.captain}/${run.crew.join('+')}/seed ${run.seed} step ${i} ch${run.chapter} ${run.phase}`
    assert.ok(i < maxSteps, `${where}: random play did not reach an ending`)
    inspect(run, where)
    const options = controls(run)
    // Players drift toward the big buttons; idle controls stay possible.
    const forward = options.filter(
      (o) => !/^(hire|wait|recharge|instinct|clone|print|chart)/.test(o.label),
    )
    const pool = forward.length && rand() < 0.8 ? forward : options
    const pick = pool[Math.floor(rand() * pool.length)]!
    steps.push(pick.label)
    run = pick.run
  }
  inspect(run, `${label}: ending`)
  return { run, steps }
}

/** Seeds whose voyage faces the given nemesis, in ascending order. */
export function seedsFacing(antagonist: string, count: number, from = 1) {
  const out: number[] = []
  for (let seed = from; out.length < count && seed < from + 5000; seed++)
    if (
      antagonistFor(startVoyage('fluke', ['pell', 'mox', 'rue'], seed)).id ===
      antagonist
    )
      out.push(seed)
  return out
}

export const NEMESES = ANTAGONISTS.map((a) => a.id)
export const CAPTAIN_IDS = CAPTAINS.map((c) => c.id)
export const CREW_IDS = CREW.map((c) => c.id)
