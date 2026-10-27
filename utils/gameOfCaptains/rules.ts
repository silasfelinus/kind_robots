import { ACT_ONE_MISSIONS } from './actOne'
import { ACT_TWO_MISSIONS, ACT_TWO_OPENING, ACT_TWO_RESUPPLY } from './actTwo'
import {
  ACT_THREE_MISSIONS,
  ACT_THREE_OPENING,
  ACT_THREE_RESUPPLY,
} from './actThree'
import {
  NEMESIS_ENDINGS,
  nemesisEndingId,
  nemesisEndingVariant,
} from './nemesisEndings'
import {
  ACT_THREE_FIRST_CHAPTER,
  ACT_TWO_FIRST_CHAPTER,
  VOYAGE_BOARDS,
  VOYAGE_CHAPTERS,
  VOYAGE_CONSEQUENCES,
  VOYAGE_ECHOES,
  actName,
  earnedCallbacks,
  nemesisMove,
  nemesisThreats,
  type NemesisId,
} from './voyageMap'
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
import { galacticEndingFor } from './galacticEndings'

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
      'Two refugee transports are drifting off Hollow Lantern with one working life-support unit between them, passed back and forth on a cable every forty minutes. The local treaty forbids outside assistance without a stamped request. The stamp is aboard whichever ship currently does not have the air.',
    dilemma:
      'The convoy has asked for help in writing. Its home government has replied, also in writing, that help would breach sovereign customs, and has attached the customs, which run to nine volumes and do not mention air.',
    note: 'The customs ran to nine volumes. Breathing was not in the index.',
  },
  {
    id: 'archive',
    system: 'Tellurian Archive',
    title: 'The Library Planet',
    kind: 'science',
    briefing:
      'The Tellurian Archive, a sentient library the size of a continent, has declined to evacuate ahead of a stellar flare. It has also declined on behalf of its four thousand visiting readers, under a clause in the library card that none of them read. They are reading it now.',
    dilemma:
      'The Archive will save its catalogue, and its readers, if the couch hands over the coordinates of a civilization that has never been catalogued. The civilization has not been asked, and would very much prefer not to be.',
    note: 'Clause forty-one of the library card is now the most-read text on the planet.',
  },
  {
    id: 'bar',
    system: 'Serendipity Space Bar',
    title: 'The Patron Who Was Never Here',
    kind: 'diplomacy',
    briefing:
      'Someone is hiding at Serendipity. Vox will not say who, on principle, and the bar has bent its gravity so that one corner table sits on the ceiling, which is not a principle but is very effective. A creditor has arrived with a warrant, taken a stool, and ordered a drink he intends to put on the bar’s tab.',
    dilemma:
      'The patron on the ceiling is the only witness against the creditor’s employer. Giving them up could end the voyage’s worst problem in an afternoon. It would also end the only neutral bar between worlds, whose single selling point is that it does not give people up.',
    note: 'Neutral ground is a policy. Serendipity also has feelings about it.',
  },
  ...ACT_ONE_MISSIONS,
  ...ACT_TWO_MISSIONS,
  ...ACT_THREE_MISSIONS,
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
  /** The nemesis's own ending, `<nemesis>-<undone|bargained|unfinished>`. */
  nemesisEnding?: string | null
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
  const fallback = VOYAGE_BOARDS[run.chapter - 1]?.[0] ?? 'refugees'
  return (
    MISSIONS.find((item) => item.id === run.missionId) ??
    MISSIONS.find((item) => item.id === fallback)!
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
  const flags = run.worldFlags ?? []
  const visited = (...ids: string[]) =>
    history.some((event) => ids.includes(event.missionId))
  const flagged = (prefix: string) =>
    flags.some((flag) => flag.startsWith(prefix))
  const ids = VOYAGE_BOARDS[run.chapter - 1] ?? VOYAGE_BOARDS.at(-1)!
  return ids
    .filter((id) => {
      if (id === 'courtesy-reactor')
        return (
          helped ||
          has('jex') ||
          has('taal') ||
          has('rue') ||
          visited('nacre', 'archive')
        )
      if (id === 'sesh-backups')
        return has('mox') || has('sora') || visited('archive', 'gameworld')
      if (id === 'serendipity-tab')
        return has('jex') || has('omi') || has('tess') || visited('bar')
      if (id === 'warranty')
        return has('pell') || has('sora') || witnessed || visited('ashdock')
      if (id === 'hoa')
        return (
          has('tess') ||
          has('kivo') ||
          has('fen') ||
          visited('windglass') ||
          flags.includes('concord-petition')
        )
      if (id === 'season-two')
        return (
          has('mox') ||
          has('sora') ||
          has('omi') ||
          antagonistFor(run).id === 'showrunner' ||
          visited('gameworld') ||
          flagged('sesh-')
        )
      if (id === 'gig-orchard')
        return (
          has('brin') ||
          has('kivo') ||
          has('pell') ||
          visited('rootborne', 'warranty')
        )
      if (id === 'overdue')
        return (
          has('omi') ||
          has('mox') ||
          run.captain === 'quill' ||
          visited('archive', 'sesh-backups')
        )
      if (id === 'merger')
        return (
          has('rue') ||
          has('taal') ||
          visited('nacre', 'insult-compiler', 'concord-intake')
        )
      if (id === 'serendipity-last-call')
        return (
          has('jex') ||
          has('omi') ||
          has('tess') ||
          visited('bar', 'serendipity-tab')
        )
      if (id === 'gameworld-finale')
        return (
          has('mox') ||
          has('sora') ||
          has('omi') ||
          antagonistFor(run).id === 'showrunner' ||
          visited('gameworld', 'season-two')
        )
      if (id === 'twins-summit')
        return (
          has('rue') ||
          has('taal') ||
          has('jex') ||
          visited('courtesy-reactor', 'insult-compiler')
        )
      if (id === 'foundry-strike')
        return (
          has('mox') ||
          has('sora') ||
          has('pell') ||
          visited('sesh-backups', 'warranty')
        )
      if (id === 'windglass-exodus')
        return (
          has('tess') ||
          has('kivo') ||
          has('fen') ||
          visited('windglass', 'hoa')
        )
      if (id === 'deposit-copy')
        return (
          has('omi') ||
          has('mox') ||
          run.captain === 'quill' ||
          visited('archive', 'overdue')
        )
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
      `Charted the ${actName(run.chapter)} route to ${choice.system} on day ${run.day ?? 1}.`,
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
      : VOYAGE_CONSEQUENCES[mostRecent.missionId]?.[mostRecent.policy]?.flag
  return (
    (key && VOYAGE_ECHOES[key]) ||
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
  const enemyPenalty = nemesisThreats(antagonistFor(run).id as NemesisId)
    .filter((threat) => threat.missionId === current)
    .reduce((sum, threat) => sum + threat.penalty, 0)
  const civicBonus = earnedCallbacks(current, flags).reduce(
    (sum, callback) => sum + callback.odds,
    0,
  )
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
      'The away team solved the problem and came back with information nobody on the couch had asked for, all of it useful.',
    success:
      'The away team did what it went to do. The people affected are still deciding what that means.',
    costly:
      'The away team came back with the job done, a bill, and someone who would rather not be helped again.',
    disaster:
      'The plan did not survive contact. The away team came back by the emergency route, which is longer and has stairs.',
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
  const twist = nemesisThreats(antagonistFor(run).id as NemesisId)
    .filter((threat) => threat.missionId === active.missionId)
    .map((threat) => threat.event)
    .join(' ')
  const scene = `${base} ${routes} ${nemesisMove(antagonistFor(run), run.chapter)} ${twist}`
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
    aid: 'You offer help and ask first. It costs supplies, and the people you helped get to decide what happens next.',
    observe:
      'You keep your distance and keep a record. The treaty is intact, and so is the record of what you watched.',
    intervene:
      'You act without permission. It works quickly, and the paperwork will take years.',
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
      VOYAGE_CONSEQUENCES[mission.id]![policy].flag,
    ],
    scene: `${responses[policy]} ${mission.note} ${VOYAGE_CONSEQUENCES[mission.id]![policy].text}`,
    log: [
      ...run.log,
      `${mission.system}: ${policy} — ${responses[policy]} ${VOYAGE_CONSEQUENCES[mission.id]![policy].text}`,
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
  if (run.chapter >= VOYAGE_CHAPTERS)
    return {
      ...run,
      phase: 'finale',
      scene:
        'Your nemesis waits at the jump gate. The force bubble holds. On the cushions, the crew would like a word about what kind of captain you turned out to be.',
    }
  const opening =
    run.chapter + 1 === ACT_TWO_FIRST_CHAPTER
      ? { act: 'Act II', text: ACT_TWO_OPENING, supplies: ACT_TWO_RESUPPLY }
      : run.chapter + 1 === ACT_THREE_FIRST_CHAPTER
        ? {
            act: 'Act III',
            text: ACT_THREE_OPENING,
            supplies: ACT_THREE_RESUPPLY,
          }
        : null
  return {
    ...run,
    phase: 'briefing',
    chapter: run.chapter + 1,
    missionId: VOYAGE_BOARDS[run.chapter]![0],
    postedDay: run.day ?? run.chapter,
    active: null,
    away: [],
    pocketRoom: null,
    report: null,
    supplies: run.supplies + (opening?.supplies ?? 0),
    scene: `${opening ? opening.text + ' ' : ''}A new star flickers into the chart. ${worldEcho(run)} The available routes reflect what the captain already did.`,
    log: opening
      ? [
          ...run.log,
          `${opening.act} begins: ${opening.supplies} supplies received.`,
        ]
      : run.log,
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
  const family = galacticEndingFor(run, strategy)
  const ending =
    family?.title ??
    (strategy === 'counter'
      ? antagonistFor(run).id === 'showrunner'
        ? 'THE UNION CANCELLATION'
        : 'THE WITNESS COALITION'
      : saved
        ? strong
          ? 'CAPTAIN OF THE OPEN HORIZON'
          : 'THE LAST SHIP HOME'
        : strong
          ? 'THE GALACTIC BARGAIN'
          : 'THE COST OF COMMAND')
  const verdict = family
    ? `${family.text} ${family.captains[run.captain]}`
    : strategy === 'counter'
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
  const civic = (run.missionHistory ?? [])
    .map((event) => {
      const detail =
        event.policy === 'missed'
          ? `No one answered the call at ${event.system}.`
          : VOYAGE_CONSEQUENCES[event.missionId]?.[event.policy]?.text
      return detail ? `${event.system}: ${detail}` : ''
    })
    .filter(Boolean)
    .join(' ')
  const nemesisId = antagonistFor(run).id as NemesisId
  const variant = nemesisEndingVariant(
    nemesisId,
    strategy,
    run.worldFlags ?? [],
    run.supplies,
  )
  const nemesisEnding = NEMESIS_ENDINGS[nemesisId][variant]
  const scene = `${verdict} ${nemesisEnding.title}: ${nemesisEnding.text} ${remembrance} ${journeys.join(' ')} ${civic}`
  return {
    ...run,
    phase: 'ending',
    scene,
    ending,
    nemesisEnding: nemesisEndingId(nemesisId, variant),
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
    data.chapter > VOYAGE_CHAPTERS ||
    (data.missionId !== undefined &&
      (!MISSIONS.some((mission) => mission.id === data.missionId) ||
        !VOYAGE_BOARDS[data.chapter - 1]?.some(
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
      'transit',
      'decision',
      'debrief',
      'crew-quest',
      'finale',
      'ending',
    ].includes(data.phase ?? '') ||
    !Array.isArray(data.log) ||
    typeof data.supplies !== 'number' ||
    typeof data.trust !== 'number' ||
    typeof data.intervention !== 'number' ||
    typeof data.reputation !== 'number' ||
    typeof data.antagonist !== 'number' ||
    !Number.isInteger(data.antagonist) ||
    data.antagonist < 0 ||
    data.antagonist >= ANTAGONISTS.length ||
    (data.nemesisEnding !== undefined &&
      data.nemesisEnding !== null &&
      typeof data.nemesisEnding !== 'string') ||
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
