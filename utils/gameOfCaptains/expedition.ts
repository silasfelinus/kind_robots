import type { VoyageRun, CrewId } from './rules'
import { CAPTAIN_STATS, CREW_PROFILES } from './crewAssignments'
import { WORLD_ENCOUNTERS, type ExpeditionEncounter } from './expeditionLocal'
import { GALACTIC_MAJOR, GALACTIC_MINOR } from './expeditionGalactic'
import { REDSHIRT_BY_ID, nextRedshirt, starterRedshirts } from './redshirts'
import type { ActOneRouteId } from './actOne'
import { VOYAGE_BOARDS } from './voyageMap'

export type ExpeditionResult = {
  encounterId: string
  lead: string
  casualty: string | null
  secret: boolean
  revealedPower: string | null
  outcome: string
}
export type ExpeditionVisit = {
  chapter: number
  missionId: string
  encounterIds: string[]
  results: ExpeditionResult[]
}
export const REDSHIRT_QUARTERS = {
  name: 'The Drawer of Infinite Replacements',
  description:
    'The couch miniaturizes a dormitory behind the backrest. There are twelve bunks but only eight original personnel contracts per voyage. The memorial printer is suspiciously efficient.',
  bunks: 12,
  // Recruitment is scarce even when unused bunks remain. Copies share an identity.
  recruitmentLimit: 8,
  exchange:
    'Personnel has authorized exactly eight original contracts per voyage. A fallen person does not open a new slot. Personnel has never volunteered.',
} as const

function hash(text: string): number {
  let value = 2166136261
  for (const c of text)
    value = Math.imul(value ^ c.charCodeAt(0), 16777619) >>> 0
  return value
}
const all = [
  ...Object.values(WORLD_ENCOUNTERS).flatMap((group) => [
    ...group.major,
    ...group.minor,
  ]),
  ...GALACTIC_MAJOR,
  ...GALACTIC_MINOR,
]
const dictionary = Object.fromEntries(
  all.map((enc) => [enc.id, enc]),
) as Record<string, ExpeditionEncounter>
export const EXPEDITION_ENCOUNTERS: readonly ExpeditionEncounter[] = all

export function expeditionEncounter(id: string): ExpeditionEncounter | null {
  return dictionary[id] ?? null
}
export function expeditionBoard(
  seed: number,
  chapter: number,
  missionId: string,
): ExpeditionEncounter[] {
  const pack = WORLD_ENCOUNTERS[missionId as ActOneRouteId]
  const key = `${seed}:${chapter}:${missionId}`
  const mainCount = 1 + (hash(key + ':majorCount') % 4)
  const minorCount = 3 + (hash(key + ':minorCount') % 3)
  const order = (cards: readonly ExpeditionEncounter[], salt: string) =>
    [...cards].sort((a, b) => {
      const ka = hash(key + salt + a.id),
        kb = hash(key + salt + b.id)
      return ka - kb || a.id.localeCompare(b.id)
    })
  // Acts II and III may not have local redshirt encounter packs yet.
  // Never silently skip their expeditions: draw the full galactic board instead.
  if (!pack) {
    return [
      ...order(GALACTIC_MAJOR, 'later-act-major').slice(0, mainCount),
      ...order(GALACTIC_MINOR, 'later-act-minor').slice(0, minorCount),
    ]
  }
  // Act I guarantees a local crisis; galactic calls intrude at each stop.
  const main = [
    pack.major[hash(key + 'localM') % pack.major.length]!,
    ...order(GALACTIC_MAJOR, 'gM'),
    ...pack.major.filter(
      (item) =>
        item.id !== pack.major[hash(key + 'localM') % pack.major.length]!.id,
    ),
  ]
  const minor = [
    pack.minor[hash(key + 'localm') % pack.minor.length]!,
    ...order(GALACTIC_MINOR, 'gm'),
    ...pack.minor.filter(
      (item) =>
        item.id !== pack.minor[hash(key + 'localm') % pack.minor.length]!.id,
    ),
  ]
  return [...main.slice(0, mainCount), ...minor.slice(0, minorCount)]
}
export function currentExpedition(run: VoyageRun): ExpeditionEncounter[] {
  const v = run.expeditionVisit
  return v
    ? v.encounterIds
        .map((id) => expeditionEncounter(id))
        .filter((item): item is ExpeditionEncounter => !!item)
    : []
}
export function expeditionBusy(run: VoyageRun): string[] {
  return (run.expeditionVisit?.results ?? []).map((record) => record.lead)
}
export function startWorldTravel(run: VoyageRun): VoyageRun {
  if (
    run.phase !== 'briefing' ||
    (run.expeditionHistory ?? []).some((visit) => visit.chapter === run.chapter)
  )
    return run
  const worldId = run.missionId ?? VOYAGE_BOARDS[run.chapter - 1]?.[0]
  if (!worldId || !expeditionBoard(run.seed, run.chapter, worldId).length)
    return run
  return {
    ...run,
    phase: 'travel',
    redshirtRoster: run.redshirtRoster ?? starterRedshirts(run.seed),
    redshirtFallen: run.redshirtFallen ?? [],
    expeditionHistory: run.expeditionHistory ?? [],
    scene:
      'The long red couch sails toward its next world. Behind the backrest, a miniature barracks unfolds like the galaxy’s least reassuring advent calendar. The force bubble remains invisible and irreplaceable.',
  }
}
export function arriveAtWorld(run: VoyageRun): VoyageRun {
  if (run.phase !== 'travel') return run
  const missionId = run.missionId ?? VOYAGE_BOARDS[run.chapter - 1]![0]!
  const encounterIds = expeditionBoard(run.seed, run.chapter, missionId).map(
    (e) => e.id,
  )
  return {
    ...run,
    phase: 'expedition',
    day: (run.day ?? run.chapter) + 1,
    expeditionVisit: {
      chapter: run.chapter,
      missionId,
      encounterIds,
      results: [],
    },
    scene:
      'Touchdown is relative. The red couch remains suspended above the pavement in its transparent force bubble. Local authorities demand to know whether it is a vehicle, a sofa, or an extremely small republic.',
  }
}
export function recruitedOriginals(run: VoyageRun): number {
  const current = run.redshirtRoster ?? starterRedshirts(run.seed)
  return new Set([
    ...current,
    ...(run.redshirtFallen ?? []).map((loss) => loss.id),
  ]).size
}
export function hireRedshirt(run: VoyageRun): VoyageRun {
  if (!['briefing', 'travel', 'expedition', 'debrief'].includes(run.phase))
    return run
  const roster = run.redshirtRoster ?? starterRedshirts(run.seed)
  if (
    roster.length >= REDSHIRT_QUARTERS.bunks ||
    recruitedOriginals(run) >= REDSHIRT_QUARTERS.recruitmentLimit
  )
    return run
  const cost = roster.length ? 1 : 0
  if (run.supplies < cost) return run
  const id = nextRedshirt(
    run.seed +
      (run.redshirtFallen?.length ?? 0) * 19 +
      (run.expeditionHistory?.length ?? 0) * 31,
    roster,
    (run.redshirtFallen ?? []).map((x) => x.id),
  )
  if (!id) return run
  const hire = REDSHIRT_BY_ID[id]!
  return {
    ...run,
    supplies: run.supplies - cost,
    redshirtRoster: [...roster, id],
    log: [
      ...run.log,
      `Hired ${hire.name}, a ${hire.anatomy}, into a regulation crimson expedition shirt. ${REDSHIRT_QUARTERS.exchange}`,
    ],
  }
}
export function deployExpedition(
  run: VoyageRun,
  encounterId: string,
  requestedLead: string,
): VoyageRun {
  const visit = run.expeditionVisit
  if (
    run.phase !== 'expedition' ||
    !visit ||
    visit.results.some((r) => r.encounterId === encounterId)
  )
    return run
  const enc = currentExpedition(run).find((e) => e.id === encounterId)
  if (!enc) return run
  const busy = new Set(expeditionBusy(run))
  let lead = requestedLead
  const roster = run.redshirtRoster ?? []
  if (lead === 'auto') lead = roster.find((id) => !busy.has(id)) ?? ''
  const isCaptain = lead === 'captain'
  const isCrew = run.crew.includes(lead as CrewId)
  const isRedshirt = roster.includes(lead) && !!REDSHIRT_BY_ID[lead]
  if (!lead || busy.has(lead) || (!isCaptain && !isCrew && !isRedshirt))
    return run
  const profile = isRedshirt ? REDSHIRT_BY_ID[lead]! : null
  const skill = isCaptain
    ? CAPTAIN_STATS[run.captain][enc.skill]
    : isCrew
      ? CREW_PROFILES.find((c) => c.id === lead)!.stats[enc.skill]
      : profile!.stats[enc.skill]
  const secret =
    isCrew &&
    enc.priority === 'minor' &&
    enc.secretCrew.includes(lead as CrewId)
  const revealedPower =
    profile && profile.talent === enc.skill ? profile.secretPower : null
  // Every deployed redshirt receives an independent deterministic 1-in-3 mortality roll.
  const casualty =
    profile &&
    hash(run.seed + ':' + run.chapter + ':' + enc.id + ':' + lead + ':fatal') %
      3 ===
      0
      ? lead
      : null
  const dangerouslyUnqualified =
    !!profile &&
    enc.priority === 'major' &&
    enc.skill === 'diplomacy' &&
    skill < 4
  const succeeds = skill >= 3 || secret || !!revealedPower
  const outcome = casualty
    ? `${profile!.name} does not return from ${enc.title}. ${enc.redshirtResult} Personnel prints a tasteful memorial and asks whether the captain would like to requisition another red uniform.`
    : dangerouslyUnqualified
      ? `${profile!.name} is entrusted with interstellar diplomacy despite a complete absence of training. ${enc.redshirtResult} The resulting diplomatic incident is not covered by the uniform warranty.`
      : isRedshirt
        ? `${profile!.name} returns from ${enc.title}. ${enc.redshirtResult} ${revealedPower ? 'Unexpected talent: ' + revealedPower + '.' : 'Somehow the red uniform survives.'}`
        : succeeds
          ? `${isCaptain ? 'The captain' : CREW_PROFILES.find((c) => c.id === lead)!.name} handles ${enc.title}. ${enc.commandResult}`
          : `The assigned command officer is out of their depth in ${enc.title}. ${enc.redshirtResult}`
  const message = secret
    ? outcome + ' SECRET DETOUR: ' + enc.secretResult
    : outcome
  const record: ExpeditionResult = {
    encounterId,
    lead,
    casualty,
    secret,
    revealedPower,
    outcome: message,
  }
  return {
    ...run,
    redshirtRoster: casualty ? roster.filter((id) => id !== casualty) : roster,
    redshirtFallen: casualty
      ? [
          ...(run.redshirtFallen ?? []),
          {
            id: casualty,
            chapter: run.chapter,
            encounterId,
            missionId: visit.missionId,
          },
        ]
      : run.redshirtFallen,
    expeditionVisit: { ...visit, results: [...visit.results, record] },
    trust:
      run.trust +
      (secret ? 1 : 0) -
      (dangerouslyUnqualified ? 2 : 0) -
      (casualty ? 1 : 0),
    reputation: run.reputation - (dangerouslyUnqualified ? 1 : 0),
    supplies: run.supplies + (revealedPower ? 1 : 0),
    worldFlags: secret
      ? [...(run.worldFlags ?? []), 'crew-secret:' + enc.id + ':' + lead]
      : run.worldFlags,
    scene: message,
    log: [...run.log, `Expedition ${run.chapter} / ${enc.title}: ${message}`],
  }
}
export function leaveExpedition(run: VoyageRun): VoyageRun {
  const visit = run.expeditionVisit
  if (run.phase !== 'expedition' || !visit) return run
  const board = currentExpedition(run)
  if (
    board.some(
      (enc) =>
        enc.priority === 'major' &&
        !visit.results.some((r) => r.encounterId === enc.id),
    )
  )
    return run
  const skipped = board.filter(
    (enc) => !visit.results.some((r) => r.encounterId === enc.id),
  )
  const report = skipped.length
    ? `Minor matters left behind: ${skipped.map((x) => x.title).join('; ')}.`
    : 'Every crisis answered. Nobody believes the paperwork.'
  return {
    ...run,
    phase: 'briefing',
    expeditionHistory: [...(run.expeditionHistory ?? []), visit],
    expeditionVisit: null,
    scene: `The expedition returns to the couch. ${report} ${run.redshirtFallen?.length ?? 0} red uniforms now hang in the miniature memorial corridor, each one attached to an actual name.`,
    log: [
      ...run.log,
      'Expedition finished at ' + visit.missionId + '. ' + report,
    ],
  }
}
