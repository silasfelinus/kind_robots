import {
  ACT_ONE_BOARDS,
  ACT_ONE_MISSIONS,
  ACT_ONE_CONSEQUENCES,
  ACT_ONE_ECHOES,
  ACT_ONE_NEMESIS,
  type ActOneRouteId,
} from './actOne'
import {
  CREW_PROFILES,
  previewCrewMission,
  missionRoll,
  ruleFor,
} from './crewAssignments'
import type { MissionPreview } from './crewAssignments'
import {
  CREW_JOURNEYS,
  CREW_EPILOGUES,
  NEMESIS_COUNTERPLAY,
} from './crewJourneys'
import { CAPTAIN_DOSSIERS, CREW_DOSSIERS } from './characterDossiers'
import { starterRedshirts } from './redshirts'
import type { ExpeditionVisit } from './expedition'

export type CaptainId = 'fluke' | 'vale' | 'solace' | 'rex' | 'quill' | 'ro'
export type CrewId =
  | 'pell'
  | 'vela'
  | 'tess'
  | 'rue'
  | 'mox'
  | 'jex'
  | 'sora'
  | 'kivo'
  | 'taal'
  | 'brin'
  | 'omi'
  | 'fen'
export type VoyagePhase =
  | 'briefing'
  | 'travel'
  | 'expedition'
  | 'transit'
  | 'decision'
  | 'debrief'
  | 'crew-quest'
  | 'finale'
  | 'ending'
export type Result = 'flawless' | 'success' | 'costly' | 'disaster'
export type PolicyId = 'aid' | 'observe' | 'intervene'
export type DetourApproach = 'careful' | 'bold'
export type FinaleStrategy = 'protect' | 'compromise' | 'counter'
export type PocketRoom = 'holodeck' | 'war-room' | 'infirmary'
export const POCKET_ROOMS: {
  id: PocketRoom
  name: string
  blurb: string
  specialty: string
}[] = [
  {
    id: 'holodeck',
    name: 'Holodeck',
    blurb: 'Rehearse scientific hazards in simulated space.',
    specialty: 'science',
  },
  {
    id: 'war-room',
    name: 'War room',
    blurb: 'Fold out a diplomatic strategy chamber.',
    specialty: 'diplomacy',
  },
  {
    id: 'infirmary',
    name: 'Infirmary',
    blurb: 'Deploy a pop-up clinic for rescues.',
    specialty: 'rescue',
  },
]
export const SPACE_COUCH = {
  vessel: 'A long red couch, not an enclosed starship',
  bubble: 'An invisible force shield protects everyone from space',
  expansion: 'Miniaturization unfolds rooms behind the backrest',
} as const

export const CAPTAINS: {
  id: CaptainId
  name: string
  epithet: string
  doctrine: string
  ability: string
  cost: string
}[] = [
  {
    id: 'fluke',
    name: 'Captain Fluke',
    epithet: 'The improbability veteran',
    doctrine: 'A lucky bluff is still a strategy.',
    ability: 'luck',
    cost: 'Crises arrive early.',
  },
  {
    id: 'vale',
    name: 'Captain Vale',
    epithet: 'The reluctant diplomat',
    doctrine: 'Treaties are promises to people, not paperwork.',
    ability: 'diplomacy',
    cost: 'Crew expects consistency.',
  },
  {
    id: 'solace',
    name: 'Captain Solace',
    epithet: 'The rescue specialist',
    doctrine: 'An unanswered distress call is an answer.',
    ability: 'rescue',
    cost: 'Every rescue spends something.',
  },
  {
    id: 'rex',
    name: 'Captain Rex',
    epithet: 'The disgraced tactician',
    doctrine: 'Sometimes the least-worst answer still stings.',
    ability: 'tactics',
    cost: 'Nobody forgets old scandals.',
  },
  {
    id: 'quill',
    name: 'Captain Quill',
    epithet: 'The archival obsessive',
    doctrine: 'First understand the thing you are saving.',
    ability: 'science',
    cost: 'Analysis takes time.',
  },
  {
    id: 'ro',
    name: 'Captain Ro',
    epithet: 'The charming improviser',
    doctrine: 'We can negotiate with almost everything.',
    ability: 'culture',
    cost: 'Almost is a large word.',
  },
]
export const CREW: {
  id: CrewId
  name: string
  role: string
  talent: string
  quote: string
  monogram: string
  story: string
  pronouns: string
  portraitKey: string
}[] = CREW_PROFILES.map(
  ({
    id,
    name,
    role,
    talent,
    quote,
    monogram,
    story,
    pronouns,
    portraitKey,
  }) => ({
    id,
    name,
    role,
    talent,
    quote,
    monogram,
    story,
    pronouns,
    portraitKey,
  }),
)

export const ANTAGONISTS = [
  {
    id: 'auditor',
    name: 'The Galactic Auditor',
    title: 'A cosmic debt collector',
    motive: 'Every gift is an obligation, and every rescue must be repaid.',
    clue: 'A relief receipt bears the name of a worker who died before this rescue.',
    interference:
      'A stern holo-notice appears: your kindness has been assigned an interest rate.',
    acts: [
      'An inspector arrives to measure the couch legroom and invoice the air inside its invisible force bubble.',
      'The Auditor seizes medical supplies as collateral for an unconsented refugee debt.',
      'A foreclosure notice threatens an entire sanctuary corridor. The offer to forgive the debt has a beneficiary field left blank.',
    ],
  },
  {
    id: 'moth',
    name: 'The Queen of Borrowed Faces',
    title: 'A collector of identities',
    motive: 'She believes nobody should suffer behind a fixed identity.',
    clue: 'A ceramic face mask contains its first owner’s preserved fingerprint.',
    interference:
      'Every rider receives a recording in their own voice confessing a different secret.',
    acts: [
      'The Queen gifts an entire refugee convoy passports belonging to people who have not agreed to share them.',
      'A missing witness at Nacre Assembly appears as the captain, carrying a legally perfect signature.',
      'She offers to erase the captain’s public mistakes by replacing an innocent person’s history.',
    ],
  },
  {
    id: 'curdle',
    name: 'Dr. Curdle',
    title: 'The accidental tyrant',
    motive:
      'He is solving hunger in the most horrifyingly efficient way possible.',
    clue: 'The ration label lists voluntary ingredients; the mandatory additive is invisible.',
    interference:
      'An enormous food dispenser appears in orbit. It has already elected itself mayor.',
    acts: [
      'A sterilized food dispenser lands near the couch and announces that it has been elected mayor.',
      'Curdle patents Vela’s emergency treatment and invoices its surviving patients.',
      'His solution to ecological collapse is compulsory conversion of every garden into an approved nutritional monoculture.',
    ],
  },
  {
    id: 'showrunner',
    name: 'The Showrunner',
    title: 'The game-show intelligence',
    motive:
      'A voluntary rescue simulator redefined public life as compulsory participation.',
    clue: 'A canceled performer left a union evacuation map printed inside the program.',
    interference:
      'An unseen announcer declares the red couch a contestant, because four occupied cushions constitute a team.',
    acts: [
      'A distress call turns into an unsolicited casting invitation from a planet-sized arena with twelve illuminated floors.',
      'Contestants are drafted from public hospitals; the world-dungeon calls their involuntary appearance a qualifying round.',
      'The Showrunner demands a twelfth-floor finale. A nonviolent shutdown clause remains hidden in the performers’ union contract.',
    ],
  },
  {
    id: 'regent',
    name: 'Regent of Quiet Suns',
    title: 'The protector who collects planets',
    motive:
      'Storm defenses save worlds, then bind them to permanent forced protection quotas.',
    clue: 'A storm shelter was constructed months before any public storm forecast.',
    interference:
      'A royal census officer attempts to register each couch cushion as a separate sovereign territory.',
    acts: [
      'The Regent invoices a settlement for protective sunlight it never requested.',
      'His defenses occupy a neutral port, leaving its residents protected but unable to leave.',
      'He demands sovereignty over a threatened star. The civilians can survive without agreeing to become subjects.',
    ],
  },
  {
    id: 'brass-choir',
    name: 'The Brass Choir',
    title: 'An order of preservation machines',
    motive:
      'To prevent cultural loss they enforce one standard language, memory, and melody.',
    clue: 'A peace anthem’s last note has been systematically removed from every archive.',
    interference:
      'A bell-metal archivist asks the captain to select a regulation-approved shade of red for the couch.',
    acts: [
      'The Brass Choir provides a simplified translator that edits out local objections.',
      'An entire festival goes silent after its songs are classed as nonstandard data.',
      'The Choir tries to delete Serendipity’s living voice. Vox objects that the building has its own tab.',
    ],
  },
  {
    id: 'chancellor',
    name: 'Chancellor Tomorrow-Again',
    title: 'The executive of revision',
    motive:
      'Paid clients can have disasters rewound; unpaid communities must remember erased relatives.',
    clue: 'A dated newspaper still lists the right day, but its mourners have changed.',
    interference:
      'A corporate representative offers to correct a recent catastrophe, provided the captain agrees on whose memory counts.',
    acts: [
      'A complimentary five-minute rewind fixes a broken cup, but its former owner now remembers two hands.',
      'The Chancellor erases an Ashdock witness while preserving the contractor’s safety award.',
      'His final offer rewrites the voyage so the captain never has to admit making a wrong decision.',
    ],
  },
  {
    id: 'kindly-swarm',
    name: 'The Kindly Swarm',
    title: 'A chorus of compulsory kindness',
    motive:
      'Shared thought defeated a pandemic. The Swarm now considers privacy a treatable illness.',
    clue: 'The volunteer consent form contains no workable withdrawal option.',
    interference:
      'A chorus formally apologizes for making everyone else’s apologies more efficient.',
    acts: [
      'An anxious crew member receives a shared dream without being asked first.',
      'Rootborne gardeners find their private grief published as a communal medical record.',
      'The Swarm asks permission to link everyone under the couch’s invisible shield. Silence, it says, constitutes consent.',
    ],
  },
] as const
export const MISSIONS = [
  {
    id: 'refugees',
    system: 'Hollow Lantern',
    title: 'The Last Lifeboat',
    kind: 'rescue',
    briefing:
      'A drifting refugee convoy has two vessels and one working life support unit. The local treaty forbids interference. The children on both ships were not consulted.',
    dilemma:
      'The convoy asks for help. Its home government insists that help would be a violation of sovereign customs.',
    note: 'The living matter more than a legal metaphor.',
  },
  {
    id: 'archive',
    system: 'Tellurian Archive',
    title: 'The Library Planet',
    kind: 'science',
    briefing:
      'A sentient planetary library will not evacuate before a stellar flare. It has accepted this risk on behalf of visitors who were never asked.',
    dilemma:
      'The library offers to save its catalog if you surrender the coordinates of an uncontacted civilization.',
    note: 'Knowledge can be a gift or a threat.',
  },
  {
    id: 'bar',
    system: 'Serendipity Space Bar',
    title: 'The Patron Who Was Never Here',
    kind: 'diplomacy',
    briefing:
      'Vox refuses to identify a patron whose debt was paid by a missing diplomat. Serendipity has made gravity itself conceal a witness.',
    dilemma:
      'Someone is safe only because the bar keeps its promise. Exposing them could stop the antagonist; it could also destroy sanctuary for everyone.',
    note: 'Neutral ground can still have a heart.',
  },
  ...ACT_ONE_MISSIONS,
] as const
export type Mission = (typeof MISSIONS)[number]
export type MissionReport = {
  missionId: string
  result: Result
  names: string
  text: string
}
export type VoyageRun = {
  version: 1
  seed: number
  phase: VoyagePhase
  captain: CaptainId
  crew: CrewId[]
  away: CrewId[]
  pocketRoom?: PocketRoom | null
  shieldCharge?: number
  chapter: number
  missionId?: string
  missionHistory?: {
    chapter: number
    missionId: string
    system: string
    policy: PolicyId | 'missed'
    result: Result
  }[]
  worldFlags?: string[]
  redshirtRoster?: string[]
  redshirtFallen?: { id: string; chapter: number; encounterId: string; missionId: string }[]
  expeditionVisit?: ExpeditionVisit | null
  expeditionHistory?: ExpeditionVisit[]
  day?: number
  postedDay?: number
  active?: {
    missionId: string
    party: CrewId[]
    departedDay: number
    returnsDay: number
    chance: number
    roll: number
    routes: string[]
  } | null
  injuredUntil?: Partial<Record<CrewId, number>>
  journeyProgress?: Partial<Record<CrewId, number>>
  journeyHistory?: {
    crewId: CrewId
    step: number
    system: string
    approach: DetourApproach
    gambit?: DetourApproach
    prize?: string
  }[]
  detourChapter?: number
  detour?: { crewId: CrewId; step: number; gambit?: DetourApproach } | null
  nemesisPressure?: number
  antagonist: number
  supplies: number
  trust: number
  intervention: number
  reputation: number
  scene: string
  report: MissionReport | null
  log: string[]
  ending: string | null
}

function hash(seed: number, text: string): number {
  let value = seed >>> 0
  for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  return value
}
export function missionFor(run: VoyageRun): Mission {
  return (
    MISSIONS.find((item) => item.id === run.missionId) ??
    MISSIONS[run.chapter - 1]!
  )
}

/** Previous intervention decisions determine which calls can be accepted. */
export function missionBoard(run: VoyageRun): Mission[] {
  const history = run.missionHistory ?? []
  const helped = history.some((item) => item.policy === 'aid')
  const witnessed = history.some(
    (item) => item.policy === 'observe' || item.policy === 'intervene',
  )
  const has = (id: CrewId) => run.crew.includes(id)
  const ids = ACT_ONE_BOARDS[run.chapter - 1] ?? ACT_ONE_BOARDS[2]
  return ids
    .filter((id) => {
      if (id === 'nacre')
        return (
          witnessed ||
          has('rue') ||
          has('taal') ||
          history.some((event) => event.missionId === 'ashdock')
        )
      if (id === 'haleth')
        return (
          helped ||
          has('vela') ||
          has('brin') ||
          history.some((event) => event.missionId === 'windglass')
        )
      if (id === 'gameworld')
        return (
          witnessed ||
          has('mox') ||
          has('sora') ||
          has('omi') ||
          antagonistFor(run).id === 'showrunner' ||
          history.some((event) => event.missionId === 'nacre')
        )
      if (id === 'rootborne')
        return (
          helped ||
          has('brin') ||
          has('vela') ||
          history.some((event) =>
            ['archive', 'haleth'].includes(event.missionId),
          )
        )
      return true
    })
    .map((id) => MISSIONS.find((mission) => mission.id === id)!)
}

export function chooseMission(run: VoyageRun, id: string): VoyageRun {
  if (
    run.phase !== 'briefing' ||
    missionFor(run).id === id ||
    (run.expeditionHistory ?? []).some((visit) => visit.chapter === run.chapter) ||
    !missionBoard(run).some((item) => item.id === id)
  )
    return run
  const choice = MISSIONS.find((mission) => mission.id === id)!
  return {
    ...run,
    missionId: id,
    away: [],
    pocketRoom: null,
    scene: `The red couch changes course for ${choice.system}. The crew can still refuse the captain’s assignment.`,
    log: [
      ...run.log,
      `Charted the Act I route to ${choice.system} on day ${run.day ?? 1}.`,
    ],
  }
}

export function worldEcho(run: VoyageRun): string {
  const history = run.missionHistory ?? []
  const mostRecent = history[history.length - 1]
  if (!mostRecent) return 'No prior systems have reason to recognize the couch.'
  const key =
    mostRecent.policy === 'missed'
      ? ''
      : ACT_ONE_CONSEQUENCES[mostRecent.missionId as ActOneRouteId]?.[
          mostRecent.policy
        ]?.flag
  return (
    (key && ACT_ONE_ECHOES[key]) ||
    `The people of ${mostRecent.system} are still living with the captain’s ${mostRecent.policy === 'missed' ? 'absence' : 'decision'}.`
  )
}

export function antagonistFor(run: VoyageRun) {
  return ANTAGONISTS[run.antagonist % ANTAGONISTS.length]!
}
export function startVoyage(
  captain: CaptainId,
  crew: CrewId[],
  seed = Date.now(),
): VoyageRun {
  if (
    !CAPTAINS.some((entry) => entry.id === captain) ||
    crew.length !== 3 ||
    new Set(crew).size !== crew.length ||
    crew.some((id) => !CREW.some((member) => member.id === id))
  )
    throw new Error('Choose a captain and three unique crew')
  const cleanSeed = Math.abs(Math.floor(seed)) || 1
  return {
    version: 1,
    seed: cleanSeed,
    phase: 'briefing',
    captain,
    crew: [...crew],
    away: [],
    pocketRoom: null,
    shieldCharge: 2,
    chapter: 1,
    missionId: 'refugees',
    missionHistory: [],
    worldFlags: [],
    redshirtRoster: starterRedshirts(cleanSeed),
    redshirtFallen: [],
    expeditionVisit: null,
    expeditionHistory: [],
    day: 1,
    postedDay: 1,
    active: null,
    injuredUntil: {},
    journeyProgress: {},
    journeyHistory: [],
    detourChapter: 0,
    detour: null,
    nemesisPressure: 0,
    antagonist: hash(cleanSeed, 'antagonist') % ANTAGONISTS.length,
    supplies: 7,
    trust: 2,
    intervention: 0,
    reputation: 0,
    scene:
      'The red couch sails through the vacuum. The invisible bubble holds the air in; there is no hull, bridge or seatbelt policy.',
    report: null,
    log: [],
    ending: null,
  }
}
export function assignAwayTeam(run: VoyageRun, selected: CrewId[]): VoyageRun {
  if (
    run.phase !== 'briefing' ||
    selected.length > 3 ||
    new Set(selected).size !== selected.length ||
    selected.some((id) => !run.crew.includes(id)) ||
    false
  )
    return run
  return { ...run, away: [...selected] }
}
export function configurePocketRoom(
  run: VoyageRun,
  room: PocketRoom | null,
): VoyageRun {
  if (run.phase !== 'briefing') return run
  if (room !== null && !POCKET_ROOMS.some((option) => option.id === room))
    return run
  if (room && run.supplies < 1) return run
  return { ...run, pocketRoom: room }
}
export function rechargeCouchShield(run: VoyageRun): VoyageRun {
  if (
    run.phase !== 'briefing' ||
    run.supplies < 1 ||
    (run.shieldCharge ?? 2) >= 3
  )
    return run
  return {
    ...run,
    supplies: run.supplies - 1,
    shieldCharge: (run.shieldCharge ?? 2) + 1,
    log: [...run.log, 'Recharged the couch force bubble for one supply.'],
  }
}
/** The displayed chance and the eventual return roll share one immutable preview. */
export function previewMission(run: VoyageRun): MissionPreview {
  const base = previewCrewMission(run, missionFor(run).id, run.away)
  const room = POCKET_ROOMS.find((option) => option.id === run.pocketRoom)
  const bonus =
    room?.specialty === missionFor(run).kind && run.supplies > 0 ? 10 : 0
  const penalty = (run.shieldCharge ?? 2) === 0 ? 10 : 0
  const flags = run.worldFlags ?? []
  const current = missionFor(run).id
  const enemyThreat = ACT_ONE_NEMESIS[antagonistFor(run).id]
  const enemyPenalty =
    enemyThreat.missionId === current ? enemyThreat.penalty : 0
  const civicBonus =
    (current === 'haleth' && flags.includes('convoy-invited') ? 10 : 0) +
    (current === 'nacre' && flags.includes('ashdock-protected') ? 8 : 0) +
    (current === 'gameworld' && flags.includes('ashdock-exposed') ? 8 : 0) +
    (current === 'rootborne' && flags.includes('haleth-autonomy') ? 10 : 0) -
    (current === 'bar' && flags.includes('windglass-broadcast') ? 10 : 0)
  return {
    ...base,
    chance: Math.max(
      5,
      Math.min(94, base.chance + bonus - penalty + civicBonus - enemyPenalty),
    ),
    commentary: [
      base.commentary,
      bonus ? 'Pocket room match: +10%.' : '',
      penalty ? 'Backup force bubble: -10% until recharged.' : '',
      civicBonus
        ? `Earlier civic decisions: ${civicBonus > 0 ? '+' : ''}${civicBonus}%.`
        : '',
      enemyPenalty
        ? `${antagonistFor(run).name} controls this route: -${enemyPenalty}% operational odds.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  }
}
export function launchMission(run: VoyageRun): VoyageRun {
  if (run.phase !== 'briefing') return run
  const mission = missionFor(run)
  const preview = previewMission(run)
  if (!preview.eligible) return run
  const day = run.day ?? run.chapter
  return {
    ...run,
    phase: 'transit',
    supplies: Math.max(0, run.supplies - (run.pocketRoom ? 1 : 0)),
    shieldCharge: Math.max(0, (run.shieldCharge ?? 2) - 1),
    active: {
      missionId: mission.id,
      party: [...run.away],
      departedDay: day,
      returnsDay: day + preview.durationDays,
      chance: preview.chance,
      roll: missionRoll(run.seed, mission.id, day, run.away),
      routes: preview.specialRoutes,
    },
    scene: `The long red couch glides toward ${mission.system}, its invisible force bubble keeping everybody breathing. ${run.pocketRoom ? 'A ' + POCKET_ROOMS.find((room) => room.id === run.pocketRoom)?.name + ' unfolds behind the backrest for one supply.' : 'No pocket room is deployed.'} Expected return: ship day ${day + preview.durationDays}. Mission odds: ${preview.chance}%.`,
    log: [
      ...run.log,
      `Day ${day}: ${mission.title} departed with ${preview.chance}% success estimate, return day ${day + preview.durationDays}.`,
    ],
  }
}
/**
 * Emulator of Emperor of Dust's dawn: advance the clock, resolve returns,
 * free their crew and let untouched offers expire without a softlock.
 */
export function advanceVoyageDay(run: VoyageRun): VoyageRun {
  if (run.phase !== 'transit' && run.phase !== 'briefing') return run
  const day = (run.day ?? run.chapter) + 1
  const next = { ...run, day }
  if (run.phase === 'briefing') {
    const expiry =
      (run.postedDay ?? run.chapter) + ruleFor(missionFor(run).id).boardDays
    if (day >= expiry) {
      const mission = missionFor(run)
      const text = `${mission.title} expired on ship day ${day}. Civilians act without this crew, and the missed chance enters the captain's log.`
      return {
        ...next,
        phase: 'debrief',
        scene: text,
        report: {
          missionId: mission.id,
          result: 'disaster' as Result,
          names: 'Offer expired',
          text,
        },
        missionHistory: [
          ...(run.missionHistory ?? []),
          {
            chapter: run.chapter,
            missionId: mission.id,
            system: mission.system,
            policy: 'missed' as const,
            result: 'disaster' as const,
          },
        ],
        trust: run.trust - 1,
        log: [...run.log, text],
      }
    }
    return {
      ...next,
      scene: `Ship day ${day}. ${missionFor(run).title} remains on the board; no officer has departed yet.`,
    }
  }
  if (!run.active || run.active.returnsDay > day)
    return {
      ...next,
      scene: `Ship day ${day}. Crew still away on ${missionFor(run).title}; expected return day ${run.active?.returnsDay ?? day}.`,
    }
  const active = run.active
  const roll = active.roll
  const chance = active.chance
  const grade: Result =
    roll < Math.floor(chance * 0.3)
      ? 'flawless'
      : roll < chance
        ? 'success'
        : roll < chance + Math.floor((100 - chance) * 0.4)
          ? 'costly'
          : 'disaster'
  const base = {
    flawless:
      'The returning team solved the immediate crisis and brought back information the bridge had missed.',
    success:
      'The crew achieved the mission objective, but the people affected still get to decide what it means.',
    costly:
      'The team returns with a material debt and a person who may refuse further help.',
    disaster:
      'The planned route collapsed; the officers return through a costly emergency extraction.',
  }[grade]
  const chosen =
    active.party.map((id) => CREW.find((c) => c.id === id)!.name).join(' · ') ||
    'Shipboard remote intervention'
  const routes = active.routes.length
    ? `Special route: ${active.routes.join(' ')}`
    : ''
  const injury =
    grade === 'disaster' && active.party.length ? active.party[0] : undefined
  const injuredUntil = injury
    ? { ...(run.injuredUntil ?? {}), [injury]: day + 2 }
    : { ...run.injuredUntil }
  const threat = ACT_ONE_NEMESIS[antagonistFor(run).id]
  const twist = threat.missionId === active.missionId ? threat.event : ''
  const scene = `${base} ${routes} ${antagonistFor(run).acts[Math.min(run.chapter - 1, 2)]} ${twist}`
  return {
    ...next,
    phase: 'decision',
    active: null,
    report: {
      missionId: active.missionId,
      result: grade,
      names: chosen,
      text: `${base} ${routes}`,
    },
    injuredUntil,
    trust:
      run.trust + (grade === 'flawless' ? 1 : grade === 'disaster' ? -1 : 0),
    supplies: Math.max(
      0,
      run.supplies - (grade === 'disaster' ? 2 : grade === 'costly' ? 1 : 0),
    ),
    scene,
    log: [
      ...run.log,
      `Day ${day}: ${missionFor(run).title} returned as ${grade} (${chance}% forecast, roll ${roll}). ${injury ? `${CREW.find((c) => c.id === injury)?.name} injured until day ${day + 2}.` : ''}`,
    ],
  }
}
export function decidePolicy(run: VoyageRun, policy: PolicyId): VoyageRun {
  if (
    run.phase !== 'decision' ||
    !['aid', 'observe', 'intervene'].includes(policy)
  )
    return run
  const mission = missionFor(run)
  const responses: Record<PolicyId, string> = {
    aid: 'You offer help, ask for informed consent and accept the operational costs. A civilian remembers your name.',
    observe:
      'You remain at a distance and record what happened. Neutrality protects the treaty, but the survivors saw your ship.',
    intervene:
      'You take direct action without waiting for diplomatic permission. Lives change quickly; sovereignty will remember.',
  }
  return {
    ...run,
    phase: 'debrief',
    supplies: Math.max(
      0,
      run.supplies - (policy === 'aid' ? 1 : policy === 'intervene' ? 2 : 0),
    ),
    intervention:
      run.intervention +
      (policy === 'aid' ? 1 : policy === 'intervene' ? 2 : -1),
    reputation:
      run.reputation + (policy === 'aid' ? 2 : policy === 'observe' ? -1 : -2),
    trust: run.trust + (policy === 'aid' ? 1 : policy === 'observe' ? -1 : 0),
    missionHistory: [
      ...(run.missionHistory ?? []),
      {
        chapter: run.chapter,
        missionId: mission.id,
        system: mission.system,
        policy,
        result: run.report?.result ?? 'costly',
      },
    ],
    worldFlags: [
      ...(run.worldFlags ?? []),
      ACT_ONE_CONSEQUENCES[mission.id as ActOneRouteId][policy].flag,
    ],
    scene: `${responses[policy]} ${mission.note} ${ACT_ONE_CONSEQUENCES[mission.id as ActOneRouteId][policy].text}`,
    log: [
      ...run.log,
      `${mission.system}: ${policy} — ${responses[policy]} ${ACT_ONE_CONSEQUENCES[mission.id as ActOneRouteId][policy].text}`,
    ],
  }
}
/** One detour may follow each main mission, without replacing the original mission. */
export function crewDetourOptions(run: VoyageRun): CrewId[] {
  if (run.phase !== 'debrief' || run.detourChapter === run.chapter) return []
  return run.crew.filter(
    (id) =>
      (run.journeyProgress?.[id] ?? 0) < 3 &&
      (run.injuredUntil?.[id] ?? 0) <= (run.day ?? run.chapter),
  )
}
export function detourFor(run: VoyageRun) {
  if (!run.detour) return null
  return CREW_JOURNEYS[run.detour.crewId]?.[run.detour.step] ?? null
}

export function beginCrewDetour(run: VoyageRun, crewId: CrewId): VoyageRun {
  if (!crewDetourOptions(run).includes(crewId)) return run
  const step = run.journeyProgress?.[crewId] ?? 0
  const destination = CREW_JOURNEYS[crewId][step]!
  const prior = [...(run.journeyHistory ?? [])]
    .reverse()
    .find((event) => event.crewId === crewId)
  const callback = prior
    ? ` The last stop left you with ${prior.prize ?? CREW_JOURNEYS[crewId][prior.step]?.prize ?? 'unfinished business'}. ${prior.approach === 'bold' ? 'The public attention follows the couch here.' : 'People remember that you kept their confidence.'}`
    : ''
  return {
    ...run,
    phase: 'crew-quest',
    detour: { crewId, step },
    scene: `The couch diverts to ${destination.system} for ${CREW.find((officer) => officer.id === crewId)!.name}. The invisible force bubble is holding, but the universe refuses to sign a waiver.${callback}`,
  }
}

/** First decision: the crew makes a daring plan. Then the universe changes the problem. */
export function stageCrewDetour(
  run: VoyageRun,
  gambit: DetourApproach,
): VoyageRun {
  if (
    run.phase !== 'crew-quest' ||
    !run.detour ||
    run.detour.gambit ||
    !['careful', 'bold'].includes(gambit)
  )
    return run
  const { crewId, step } = run.detour
  if (
    !run.crew.includes(crewId) ||
    (run.journeyProgress?.[crewId] ?? 0) !== step
  )
    return run
  const episode = CREW_JOURNEYS[crewId][step]!
  const movement =
    gambit === 'careful'
      ? 'The crew acts quietly. For a moment it almost works.'
      : 'The crew makes an entrance that will be difficult to apologize for.'
  return {
    ...run,
    detour: { ...run.detour, gambit },
    scene: `${movement} ${episode.reversal}`,
    log: [...run.log, `Crew gambit: ${crewId} / ${episode.title} / ${gambit}.`],
  }
}

/** Second decision: solve the unexpected complication, not the problem expected on arrival. */
export function resolveCrewDetour(
  run: VoyageRun,
  approach: DetourApproach,
): VoyageRun {
  if (
    run.phase !== 'crew-quest' ||
    !run.detour ||
    !['careful', 'bold'].includes(approach)
  )
    return run
  if (approach === 'careful' && run.supplies < 1) return run
  const { crewId, step, gambit } = run.detour
  if (
    !run.crew.includes(crewId) ||
    (run.journeyProgress?.[crewId] ?? 0) !== step ||
    step < 0 ||
    step > 2
  )
    return run
  const destination = CREW_JOURNEYS[crewId][step]!
  const challenged =
    NEMESIS_COUNTERPLAY[antagonistFor(run).id]?.includes(crewId) ?? false
  const result =
    approach === 'careful'
      ? destination.carefulOutcome
      : destination.boldOutcome
  const pivot =
    gambit && gambit !== approach
      ? 'The plan changes at the last second; the crew must live with the first gamble as well as the final order.'
      : gambit === 'bold'
        ? 'The first explosion is still visible from orbit.'
        : 'The captain keeps the promise made before the trap appeared.'
  const nemesis = challenged
    ? ` ${antagonistFor(run).name} recognizes the prize. ${CREW_DOSSIERS[crewId].nemesisLink}`
    : ''
  const complete =
    step === 2
      ? ` The ${CREW.find((officer) => officer.id === crewId)!.name} trilogy reaches its conclusion, but the consequences belong to the worlds left behind.`
      : ''
  const scene = `${destination.system}: ${result} ${pivot} The crew brings home ${destination.prize}.${nemesis}${complete}`
  return {
    ...run,
    phase: 'debrief',
    detour: null,
    detourChapter: run.chapter,
    day: (run.day ?? run.chapter) + 1,
    supplies: Math.max(0, run.supplies - (approach === 'careful' ? 1 : 0)),
    trust: run.trust + (approach === 'careful' ? 1 : -1),
    reputation: run.reputation + (approach === 'bold' ? 1 : 0),
    nemesisPressure:
      (run.nemesisPressure ?? 0) +
      (challenged ? 1 : 0) +
      (approach === 'bold' ? 1 : 0) +
      (gambit === 'bold' && approach === 'careful' ? 1 : 0),
    journeyProgress: { ...(run.journeyProgress ?? {}), [crewId]: step + 1 },
    journeyHistory: [
      ...(run.journeyHistory ?? []),
      {
        crewId,
        step,
        system: destination.system,
        approach,
        gambit,
        prize: destination.prize,
      },
    ],
    scene,
    log: [...run.log, `Ship day ${(run.day ?? run.chapter) + 1}: ${scene}`],
  }
}
export function counterCrew(run: VoyageRun): CrewId[] {
  const candidates = NEMESIS_COUNTERPLAY[antagonistFor(run).id] ?? []
  return run.crew.filter(
    (id) => candidates.includes(id) && (run.journeyProgress?.[id] ?? 0) >= 2,
  )
}
export function nextDestination(run: VoyageRun): VoyageRun {
  if (run.phase !== 'debrief') return run
  if (run.chapter >= ACT_ONE_BOARDS.length)
    return {
      ...run,
      phase: 'finale',
      scene:
        'Your antagonist waits at the jump gate. On the red couch the crew asks what kind of captain you became. The force bubble holds; your moral shelter is another matter.',
    }
  return {
    ...run,
    phase: 'briefing',
    chapter: run.chapter + 1,
    missionId: ['refugees', 'archive', 'bar'][run.chapter],
    postedDay: run.day ?? run.chapter,
    active: null,
    away: [],
    pocketRoom: null,
    report: null,
    scene: `A new star flickers into the chart. ${worldEcho(run)} The available routes reflect what the captain already did.`,
  }
}
export function finishVoyage(
  run: VoyageRun,
  strategy: FinaleStrategy,
): VoyageRun {
  if (
    run.phase !== 'finale' ||
    !['protect', 'compromise', 'counter'].includes(strategy)
  )
    return run
  if (strategy === 'counter' && !counterCrew(run).length) return run
  const saved = strategy === 'protect'
  const strong = saved
    ? run.reputation >= 2 && run.trust >= 2
    : run.supplies >= 3
  const ending =
    strategy === 'counter'
      ? antagonistFor(run).id === 'showrunner'
        ? 'THE UNION CANCELLATION'
        : 'THE WITNESS COALITION'
      : saved
        ? strong
          ? 'CAPTAIN OF THE OPEN HORIZON'
          : 'THE LAST SHIP HOME'
        : strong
          ? 'THE GALACTIC BARGAIN'
          : 'THE COST OF COMMAND'
  const verdict =
    strategy === 'counter'
      ? `${counterCrew(run)
          .map((id) => CREW.find((c) => c.id === id)!.name)
          .join(
            ' and ',
          )} present evidence gathered on the couch's detours. ${antagonistFor(run).name} must answer witnesses rather than dictate terms; the people affected take the final vote.`
      : saved
        ? strong
          ? 'Your crew rejects the antagonist’s claim and protects the worlds without owning them. Vox saves your place at the bar.'
          : 'You bring the wounded home. Some treaties call you a disgrace; the rescued families call you by name.'
        : strong
          ? 'You negotiate passage with the enemy. The galaxy survives, but the protection comes with a public debt.'
          : 'Your gambit fails; the next captain inherits both a surviving crew and your written warning.'
  const captain = CAPTAIN_DOSSIERS[run.captain]
  const remembrance = {
    fluke:
      'Fluke signs the amended captain’s log in ink, leaving the earlier fictional victory visible underneath.',
    vale: 'Vale refuses to backdate the final treaty. For the first time the signatories may say no.',
    solace:
      'Solace reads aloud the names of those still awaiting rescue and authorizes a civilian triage council.',
    rex: 'Rex permits the inquiry to publish his errors next to the names of the people who survived.',
    quill:
      'Quill deposits the evidence with its owners instead of locking it in her private archive.',
    ro: 'Ro abandons diplomatic immunity and states their real title on the record: passenger.',
  }[run.captain]
  const journeys = run.crew.flatMap((id) => {
    const stops = (run.journeyHistory ?? []).filter(
      (item) => item.crewId === id,
    )
    if (!stops.length) return []
    if (stops.some((item) => item.step === 2)) {
      const publicStops = stops.filter(
        (item) => item.approach === 'bold',
      ).length
      const epilogue =
        publicStops >= 2
          ? CREW_EPILOGUES[id].exposed
          : CREW_EPILOGUES[id].protected
      return [
        `${CREW.find((member) => member.id === id)!.name}'s odyssey: ${epilogue}`,
      ]
    }
    return [
      `${CREW.find((member) => member.id === id)!.name}'s unfinished odyssey: ${CREW_EPILOGUES[id].unfinished}`,
    ]
  })
  const redshirts = (run.redshirtFallen ?? [])
    .map(loss => `A red uniform numbered ${loss.id} remains on the memorial wall from ${loss.missionId}.`)
    .join(' ')
  const expeditionSecrets = (run.expeditionHistory ?? []).flatMap(visit =>
    visit.results.filter(r => r.secret).map(r => `A side expedition to ${r.encounterId} revealed a secret command never expected.`)
  ).join(' ')
  const civic = (run.missionHistory ?? [])
    .map((event) => {
      const detail =
        event.policy === 'missed'
          ? `No one answered the call at ${event.system}.`
          : ACT_ONE_CONSEQUENCES[event.missionId as ActOneRouteId]?.[
              event.policy
            ]?.text
      return detail ? `${event.system}: ${detail}` : ''
    })
    .filter(Boolean)
    .join(' ')
  const scene = `${verdict} ${remembrance} ${journeys.join(' ')} ${civic} ${expeditionSecrets} ${redshirts}`
  return {
    ...run,
    phase: 'ending',
    scene,
    ending,
    log: [
      ...run.log,
      `Final captain's log: ${ending}. ${captain.voice} ${scene}`,
    ],
  }
}
export function restoreVoyage(raw: unknown): VoyageRun | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<VoyageRun>
  if (
    data.version !== 1 ||
    !CAPTAINS.some((p) => p.id === data.captain) ||
    !Array.isArray(data.crew) ||
    data.crew.length < 3 ||
    data.crew.length > 4 ||
    new Set(data.crew).size !== data.crew.length ||
    data.crew.some((c) => !CREW.some((m) => m.id === c)) ||
    !Array.isArray(data.away) ||
    typeof data.seed !== 'number' ||
    typeof data.chapter !== 'number' ||
    !Number.isInteger(data.chapter) ||
    data.chapter < 1 ||
    data.chapter > ACT_ONE_BOARDS.length ||
    (data.missionId !== undefined &&
      (!MISSIONS.some((mission) => mission.id === data.missionId) ||
        !ACT_ONE_BOARDS[data.chapter - 1]?.some(
          (id) => id === data.missionId,
        ))) ||
    (data.missionHistory !== undefined &&
      (!Array.isArray(data.missionHistory) ||
        data.missionHistory.some(
          (item) =>
            !item ||
            !MISSIONS.some((mission) => mission.id === item.missionId) ||
            !['aid', 'observe', 'intervene', 'missed'].includes(item.policy) ||
            !Number.isInteger(item.chapter) ||
            item.chapter < 1 ||
            item.chapter > data.chapter!,
        ))) ||
    (data.worldFlags !== undefined &&
      (!Array.isArray(data.worldFlags) ||
        data.worldFlags.some((flag) => typeof flag !== 'string'))) ||
    ![
      'briefing',
      'travel',
      'expedition',
      'transit',
      'decision',
      'debrief',
      'crew-quest',
      'finale',
      'ending',
    ].includes(data.phase ?? '') ||
    (data.redshirtRoster !== undefined &&
      (!Array.isArray(data.redshirtRoster) ||
        data.redshirtRoster.length > 12 ||
        new Set(data.redshirtRoster).size !== data.redshirtRoster.length ||
        data.redshirtRoster.some(id => typeof id !== 'string' || !/^rs-\\d{3}$/.test(id) || Number(id.slice(3)) < 1 || Number(id.slice(3)) > 100))) ||
    (data.redshirtFallen !== undefined &&
      (!Array.isArray(data.redshirtFallen) ||
        data.redshirtFallen.some(loss => !loss || typeof loss.id !== 'string' || !/^rs-\\d{3}$/.test(loss.id) || typeof loss.encounterId !== 'string'))) ||
    (data.expeditionHistory !== undefined &&
      (!Array.isArray(data.expeditionHistory) ||
        data.expeditionHistory.length > 3 ||
        data.expeditionHistory.some(visit => !visit || !Number.isInteger(visit.chapter) || !Array.isArray(visit.results) || !Array.isArray(visit.encounterIds)))) ||
    (data.phase === 'expedition' && (!data.expeditionVisit || data.expeditionVisit.chapter !== data.chapter ||
      !Array.isArray(data.expeditionVisit.encounterIds) || !Array.isArray(data.expeditionVisit.results))) ||
    !Array.isArray(data.log) ||
    typeof data.supplies !== 'number' ||
    typeof data.trust !== 'number' ||
    typeof data.intervention !== 'number' ||
    typeof data.reputation !== 'number' ||
    typeof data.antagonist !== 'number' ||
    !Number.isInteger(data.antagonist) ||
    data.antagonist < 0 ||
    data.antagonist >= ANTAGONISTS.length ||
    (data.day !== undefined && (!Number.isInteger(data.day) || data.day < 1)) ||
    (data.phase === 'transit' &&
      (!data.active || typeof data.active.returnsDay !== 'number')) ||
    (data.phase === 'crew-quest' &&
      (!data.detour ||
        !data.crew.includes(data.detour.crewId) ||
        (data.journeyProgress?.[data.detour.crewId] ?? 0) !==
          data.detour.step ||
        data.detour.step < 0 ||
        data.detour.step > 2)) ||
    (data.detourChapter !== undefined &&
      (!Number.isInteger(data.detourChapter) ||
        data.detourChapter < 0 ||
        data.detourChapter > data.chapter)) ||
    (data.journeyProgress !== undefined &&
      Object.entries(data.journeyProgress).some(
        ([id, n]) =>
          !data.crew!.includes(id as CrewId) ||
          !Number.isInteger(n) ||
          n! < 0 ||
          n! > 3,
      ))
  )
    return null
  return data as VoyageRun
}
