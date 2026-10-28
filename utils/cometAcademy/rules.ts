import {
  personalQuestEvent,
  personalStanding,
  personalFinale,
  validPersonalHistory,
  type PersonalMemory,
  type PersonalChoice as WitnessChoice,
} from './personalQuests'
import {
  personalEncounter,
  personalEnding,
  isValidPersonalHistory,
  personalOutcomeModifier,
  type PersonalHistory,
  type PersonalChapterDay,
  type PersonalChoice,
} from './identitySerial'
import {
  missionReaction,
  missionRoute,
  reactionSuitability,
} from './missionTeams'
import {
  openingRouteFor,
  isVowMemory,
  routeStanding,
  routeEpilogue,
  type VowMemory,
  type VowAction,
} from './openingRoutes'
import {
  fieldFor,
  identityFor,
  identityStoryFor,
  IDENTITY_ARCS,
} from './identityArcs'
import {
  beginPlayerEvolution,
  evolutionEncounter,
  evolutionNightModifier,
  isValidPlayerEvolution,
  recordPlayerValues,
  resolveEvolution,
  type PlayerEvolution,
  type PlayerForm,
} from './protagonistEvolution'
import {
  antagonistBeat,
  antagonistFinale,
  campaignOpponent,
  opponentPressure,
} from './opponents'
import { GUEST_IDENTITIES } from './guestIdentities'
import {
  applySocialChoice,
  newSocialState,
  socialChoices,
  socialFinaleText,
  socialMissionBonus,
  validSocialState,
  type SocialState,
  type SocialActionId,
} from './relationships'
import { CITY_SITES, type SiteId } from './cityMap'
import { districtEncounterFor } from './districtEncounters'
import { LATE_INCIDENTS } from './lateIncidents'
import { returnVisitFor } from './returnVisits'
import { realNightCase } from './nightCases'
import {
  CAMPAIGN_ANCHORS,
  campaignAnchor,
  campaignVillain,
  campaignBetrayer,
  campaignPlotEvent,
  campaignAccomplice,
  CAMPAIGN_VILLAINS,
  GUEST_LIST_EVENT,
} from './campaign'
import {
  finaleFor,
  migrateSignatureId,
  signatureById,
  POWER_VOWS,
  type SignaturePowerId,
  type PowerVowId,
} from './specialPowers'

export type PowerId =
  'kinetic' | 'technopathy' | 'empathy' | 'elemental' | 'spatial' | 'biotech'
export type AcademyPhase =
  'map' | 'dispatch' | 'campus' | 'debrief' | 'finale' | 'ending'
export type Grade = 'honors' | 'pass' | 'partial' | 'failed'

export const POWERS: {
  id: PowerId
  name: string
  ability: string
  drawback: string
  crest: string
}[] = [
  {
    id: 'kinetic',
    name: 'Kinetic',
    ability: 'Shield lives and move what should not move.',
    drawback: 'Collateral damage',
    crest: '✦',
  },
  {
    id: 'technopathy',
    name: 'Technopathy',
    ability: 'Hear machines whisper their secrets.',
    drawback: 'Digital footprints',
    crest: '⌘',
  },
  {
    id: 'empathy',
    name: 'Empathy',
    ability: 'See the truth between two heartbeats.',
    drawback: 'Emotional overload',
    crest: '♡',
  },
  {
    id: 'elemental',
    name: 'Elemental',
    ability: 'Rearrange a storm into an invitation.',
    drawback: 'Unpredictable weather',
    crest: '❋',
  },
  {
    id: 'spatial',
    name: 'Spatial',
    ability: 'Fold distance and bring people home.',
    drawback: 'Unstable anchors',
    crest: '◇',
  },
  {
    id: 'biotech',
    name: 'Biotech',
    ability: 'Adapt, mend and become the solution.',
    drawback: 'Personal exhaustion',
    crest: '❀',
  },
]

export const STUDENTS = [
  {
    id: 'mina',
    name: 'Mina Quill',
    title: 'Rescue engineer',
    skill: 'kinetic',
    portrait: 'MQ',
    note: 'Would rather save one person than win a competition.',
    origin: 'academy',
    introSite: 'engineering-workshop',
  },
  {
    id: 'sol',
    name: 'Sol Navarro',
    title: 'Systems prodigy',
    skill: 'technopathy',
    portrait: 'SN',
    note: 'Knows where the cameras look and where they do not.',
    origin: 'academy',
    introSite: 'archive-stacks',
  },
  {
    id: 'imani',
    name: 'Imani Vale',
    title: 'Mediator',
    skill: 'empathy',
    portrait: 'IV',
    note: 'Has a habit of hearing what people refuse to say.',
    origin: 'academy',
    introSite: 'student-commons',
  },
  {
    id: 'ash',
    name: 'Ash Calder',
    title: 'Weather artisan',
    skill: 'elemental',
    portrait: 'AC',
    note: 'Always remembers the names of the maintenance staff.',
    origin: 'academy',
    introSite: 'academy-roof',
  },
  {
    id: 'nix',
    name: 'Nix Venn',
    title: 'Portal runner',
    skill: 'spatial',
    portrait: 'NV',
    note: 'Can get anywhere except a conversation with their father.',
    origin: 'academy',
    introSite: 'transit-gate',
  },
  {
    id: 'kit',
    name: 'Kit Rowan',
    title: 'Field medic',
    skill: 'biotech',
    portrait: 'KR',
    note: 'Keeps a packet of seeds in every uniform pocket.',
    origin: 'academy',
    introSite: 'botanical-conservatory',
  },
  {
    id: 'veda',
    name: 'Professor Veda Cross',
    title: 'Disgraced stunt instructor',
    skill: 'kinetic',
    portrait: 'VC',
    origin: 'faculty',
    introSite: 'training-arena',
    note: 'An ex-stunt hero taking one last shot at glory; hates being sidelined.',
  },
  {
    id: 'mara',
    name: 'Mara Fen',
    title: 'Transit union organizer',
    skill: 'spatial',
    portrait: 'MF',
    origin: 'city',
    introSite: 'transit-union',
    note: 'Trusts shift workers more than academy legends and refuses publicity stunts.',
  },
  {
    id: 'drift',
    name: 'DRIFT-9',
    title: 'Escaped biotech experiment',
    skill: 'biotech',
    portrait: 'D9',
    origin: 'experiment',
    introSite: 'transit-lab',
    note: 'A lab-grown adult person, not a specimen; fiercely protective of fellow escapees.',
  },
  {
    id: 'tessel',
    name: 'Tessel Mire',
    title: 'Dimensional castaway',
    skill: 'elemental',
    portrait: 'TM',
    origin: 'anomaly',
    introSite: 'skyport',
    note: 'A displaced traveler who can hear weather on the other side of a portal.',
  },
  {
    id: 'jo',
    name: 'Jo Mercer',
    title: 'Underground broadcaster',
    skill: 'technopathy',
    portrait: 'JM',
    origin: 'city',
    introSite: 'media-spire',
    note: 'Will expose a cover-up, even if the revelation wrecks their reputation.',
  },
  {
    id: 'lark',
    name: 'Lark Sato',
    title: 'Civic hospital night medic',
    skill: 'empathy',
    portrait: 'LS',
    origin: 'city',
    introSite: 'civic-hospital',
    note: 'Treats people ignored by famous heroes, including those labeled villains.',
  },
] as const

export type StudentId = (typeof STUDENTS)[number]['id']
export type Incident = {
  id: string
  title: string
  site: string
  briefing: string
  need: PowerId
  risk: number
  allegiance: 'hero' | 'villain' | 'rogue' | 'shared'
  art: string
}
export const INCIDENTS: Incident[] = [
  {
    id: 'monorail',
    title: 'Runaway Monorail',
    site: 'Comet City Transit',
    briefing:
      'Thirty holographic commuters. One live student on the tracks who was never on the passenger manifest.',
    need: 'spatial',
    risk: 4,
    allegiance: 'hero',
    art: 'A gleaming elevated monorail hangs between glittering towers in violet dusk, a rescuer suspended over the tracks.',
  },
  {
    id: 'museum',
    title: 'Museum of Tomorrow',
    site: 'Civic Museum',
    briefing:
      'A priceless object and twelve guests need rescue. The simulation keeps changing the priceless object.',
    need: 'technopathy',
    risk: 3,
    allegiance: 'villain',
    art: 'A glass museum diorama cracks beneath holographic rescue beacons and a slowly falling silver sculpture.',
  },
  {
    id: 'flood',
    title: 'The Lower Docks',
    site: 'Waterfront',
    briefing:
      'A tidal wall is rushing toward the lower market. The people running it insist they can handle this.',
    need: 'elemental',
    risk: 4,
    allegiance: 'shared',
    art: 'The blue harbor rises into a translucent wall above market stalls and the broken light of rescue sirens.',
  },
  {
    id: 'garden',
    title: 'Greenhouse Breach',
    site: 'Botany Wing',
    briefing:
      'An experimental vine holds two terrified lab technicians. The vine is terrified too.',
    need: 'biotech',
    risk: 3,
    allegiance: 'rogue',
    art: 'An emerald glass greenhouse alive with huge luminous leaves and a tiny amber emergency beacon.',
  },
  {
    id: 'broadcast',
    title: 'The Unwanted Broadcast',
    site: 'Media District',
    briefing:
      'An emergency message that tells the truth is about to trigger a panic.',
    need: 'empathy',
    risk: 3,
    allegiance: 'villain',
    art: 'A city plaza beneath a colossal floating screen, its audience split between celebration and alarm.',
  },
  {
    id: 'skybridge',
    title: 'The Skybridge',
    site: 'Academy East Tower',
    briefing:
      'A shuttle and a collapsing glass walkway are falling at different speeds.',
    need: 'kinetic',
    risk: 4,
    allegiance: 'hero',
    art: 'A brilliant glass bridge falls in shards between immense school towers at sunset.',
  },
]

export const ENCOUNTERS = [
  {
    title: 'A Promise on the Roof',
    location: 'Academy Rooftop',
    scene:
      "Imani finds a training incident report with the wrong date. It is tomorrow's report, and it names someone who has never enrolled.",
    options: [
      {
        id: 'truth',
        label: 'Tell the whole class',
        text: 'The rumor spreads, but secrets rarely survive the light.',
        influence: 2,
        danger: -1,
      },
      {
        id: 'cover',
        label: 'Keep the report for yourself',
        text: 'You gain leverage. Imani looks at you as though a friendship has become a negotiation.',
        influence: -2,
        danger: 1,
      },
    ],
  },
  {
    title: "The Fire Drill That Wasn't",
    location: 'Theater Wing',
    scene:
      'The prom committee is rehearsing a rescue act when the stage begins counting down in a language no faculty member admits to knowing.',
    options: [
      {
        id: 'truth',
        label: 'Evacuate the dancers',
        text: 'You lose the applause but gain twenty witnesses who can corroborate the countdown.',
        influence: 2,
        danger: -1,
      },
      {
        id: 'cover',
        label: 'Copy the signal and stay',
        text: 'A secret blueprint appears in your wrist display, and one door in the academy locks forever.',
        influence: -2,
        danger: 1,
      },
    ],
  },
  {
    title: "The Principal's Favor",
    location: 'Archive Stacks',
    scene:
      'An instructor offers to improve your record if you quietly remove a dangerous student from the graduation list.',
    options: [
      {
        id: 'truth',
        label: 'Ask the student for their side',
        text: 'The real trouble began years before either of you arrived. Your friends begin to trust your judgment.',
        influence: 2,
        danger: -1,
      },
      {
        id: 'cover',
        label: 'Take the deal',
        text: 'You get access to the staff tunnels. The excluded student remembers exactly who agreed.',
        influence: -2,
        danger: 1,
      },
    ],
  },
  {
    title: 'The Stray Blade Arrives',
    location: 'Comet City Monorail / Dimensional Gate',
    scene:
      GUEST_IDENTITIES[0]!.arrival +
      ' Zuzu has a wanted poster from another world. The corporation operating the gate calls him an escaped asset and offers you a reward for turning him in.',
    options: [
      {
        id: 'shelter-zuzu',
        label: 'Protect Zuzu and demand a hearing',
        text: 'Zuzu lowers his sword for the first time that afternoon. The company must publicly explain why it believes a person from another dimension is property.',
        influence: 2,
        danger: 1,
      },
      {
        id: 'contract-zuzu',
        label: 'Accept the warrant and ask what it pays',
        text: 'The gate operator gives you the extradition key. Zuzu memorizes your face, while the gate cameras quietly change their records.',
        influence: -2,
        danger: 2,
      },
    ],
  },
  {
    title: 'A Visitor from the Stars',
    location: 'Comet City Observatory',
    scene:
      GUEST_IDENTITIES[1]!.arrival +
      ' Tess Helio of the Space Couch crew needs a transit corridor for a refugee ship, but the academy dean wants a copy of her secret sanctuary map.',
    options: [
      {
        id: 'help-tess',
        label: 'Find a safe route without copying the map',
        text: 'Tess trusts you with one anonymous bearing. A refugee ship crosses the skyline safely, and Starwake gains an ally without sacrificing a sanctuary.',
        influence: 2,
        danger: -1,
      },
      {
        id: 'sell-tess',
        label: 'Trade the chart for a private navigation license',
        text: 'The dean hands you the corridor pass. Tess retrieves her original map, but a shadowy copy reaches the people who sell safe passage.',
        influence: -2,
        danger: 2,
      },
    ],
  },
  {
    title: 'The Unclaimed Scholarship',
    location: 'Graduation Office',
    scene:
      'A scholarship for students injured during rescues was quietly rerouted to the prom fireworks budget. An anonymous donor threatens to withdraw it entirely.',
    options: [
      {
        id: 'fund',
        label: 'Restore the emergency fund in public',
        text: 'The prom loses its fireworks, but a student gets their rehabilitation paid for. Someone has begun auditing the dean.',
        influence: 2,
        danger: -1,
      },
      {
        id: 'leverage',
        label: 'Use the records to blackmail the donor',
        text: 'You get access to the donor registry. The injured students still cannot pay their bills, and the dean now knows you have a price.',
        influence: -2,
        danger: 1,
      },
    ],
  },
  {
    title: 'The Class List Has Two Endings',
    location: 'Academy Transit Lab',
    scene:
      "A machine presents a future where your friend is the city's hero and a second future where the same person commands a prison. Both futures use the same childhood name.",
    options: [
      {
        id: 'agency',
        label: 'Tell your friend both futures and let them choose',
        text: "Your classmate rejects the machine's certainty. They ask you to remember who they are, not just what they might become.",
        influence: 2,
        danger: -1,
      },
      {
        id: 'weaponize',
        label: 'Keep the villain projection for leverage',
        text: 'You keep the evidence, but your classmate catches a glimpse of their projected villain mask on your private display.',
        influence: -2,
        danger: 1,
      },
    ],
  },
]

export type Assignment = { caseId: string; students: StudentId[] }
export type DispatchReport = {
  caseId: string
  title: string
  grade: Grade
  text: string
  names: string
}
export type AcademyRun = {
  version: 1
  seed: number
  power: PowerId
  signature?: SignaturePowerId
  vow?: PowerVowId
  vowHistory?: VowMemory[]
  personalHistory?: PersonalMemory[]
  identityHistory?: PersonalHistory[]
  initialForm?: PlayerForm
  encounterDeckVersion?: 2
  /** 2: the thirty-day run's twelve-case night deck. Older saves keep the first six. */
  incidentDeckVersion?: 2
  flowVersion?: 2 | 3
  selectedSite?: SiteId
  visitedSites?: SiteId[]
  visitedDays?: Partial<Record<SiteId, number>>
  injuries?: Partial<Record<StudentId, number>>
  contacts?: StudentId[]
  /** One night call personally attended by the protagonist; absent on legacy saves. */
  playerCaseId?: string
  infirmaryDays?: number[]
  guestPlan?: 'open' | 'private' | 'duplicate'
  mastermind?: string
  opponentSignature?: SignaturePowerId
  playerEvolution?: PlayerEvolution
  relationships?: SocialState
  betrayer?: StudentId
  betrayal?: {
    day: number
    person: StudentId
    status: 'active' | 'reconciled' | 'isolated'
  }
  plotEvidence?: string[]
  academyStanding?: number
  cityStanding?: number
  phase: AcademyPhase
  day: number
  influence: number
  danger: number
  assignments: Assignment[]
  reports: DispatchReport[]
  scene: string
  log: string[]
  ending: string | null
}

function hash(seed: number, text: string): number {
  let value = seed >>> 0
  for (const letter of text)
    value = Math.imul(value ^ letter.charCodeAt(0), 16777619) >>> 0
  return value
}

/** Every night case a thirty-day run can draw: the first six, then the late six. */
export const NIGHT_DECK: Incident[] = [...INCIDENTS, ...LATE_INCIDENTS]

export function incidentDeck(run: AcademyRun): Incident[] {
  return run.incidentDeckVersion === 2 ? NIGHT_DECK : INCIDENTS
}

export function incidentsFor(run: AcademyRun): Incident[] {
  const deck = incidentDeck(run)
  const offset = (run.seed + run.day - 1) % deck.length
  if (run.flowVersion !== 3 || !run.incidentDeckVersion)
    return [deck[offset]!, deck[(offset + deck.length / 2) % deck.length]!]
  // More opportunities than teams: the choice of what to leave unanswered matters.
  const count =
    run.day <= 3 ? 1 : run.day <= 7 ? 2 : run.day <= 14 ? 3 : run.day <= 21 ? 4 : 5
  return Array.from({ length: count }, (_, index) =>
    deck[(offset + index * 5) % deck.length]!,
  )
}

export function encounterFor(run: AcademyRun) {
  if (run.flowVersion === 3 && run.day === 29) return GUEST_LIST_EVENT
  if (
    run.flowVersion === 3 &&
    (run.day === 16 || run.day === 23) &&
    run.playerEvolution
  ) {
    const event = evolutionEncounter(
      run.signature,
      run.playerEvolution,
      run.day,
    )
    return { ...event, scene: `${campaignAnchor(run.day)} ${event.scene}` }
  }
  if (run.flowVersion === 3) {
    const person = STUDENTS.find(
      (s) => s.id === (run.betrayer ?? campaignBetrayer(run.seed)),
    )!
    const plot = campaignPlotEvent(
      run.seed,
      run.mastermind,
      run.day,
      person.name,
    )
    if (plot) {
      const opponent = run.opponentSignature
        ? campaignOpponent(run.seed, run.signature, run.opponentSignature)
        : null
      return {
        ...plot,
        scene: `${campaignAnchor(run.day)} ${plot.scene} ${opponent ? antagonistBeat(opponent, run.day) : ''}`,
      }
    }
  }
  const characterChapter = personalEncounter(run)
  if (characterChapter)
    return {
      ...characterChapter,
      scene: campaignAnchor(run.day) + ' ' + characterChapter.scene,
    }
  const witnessStory = personalQuestEvent(run)
  if (witnessStory)
    return {
      ...witnessStory,
      scene: campaignAnchor(run.day) + ' ' + witnessStory.scene,
    }
  const personalStory = openingRouteFor(run)
  if (personalStory)
    return {
      ...personalStory,
      scene: campaignAnchor(run.day) + ' ' + personalStory.scene,
    }
  if ([2, 3].includes(run.flowVersion ?? 0) && run.selectedSite) {
    const site = CITY_SITES.find((item) => item.id === run.selectedSite)
    if (site) {
      const districtScene = districtEncounterFor(site.id)
      const base =
        districtScene ??
        (site.encounterIndex !== undefined
          ? ENCOUNTERS[site.encounterIndex]!
          : undefined)
      if (base && run.flowVersion === 3) {
        const previous = run.visitedDays?.[site.id]
        const revisit = previous ? returnVisitFor(site.id) : undefined
        const card = revisit ?? base
        return {
          ...card,
          title:
            previous && !revisit ? `${base.title} / Return Visit` : card.title,
          scene: `${campaignAnchor(run.day)} ${previous ? `You return to ${site.name}, where residents remember your choice on day ${previous}. ${revisit ? revisit.scene : 'This new visit is another chance to decide.'}` : base.scene} ${run.opponentSignature && [6, 12, 18, 23, 28].includes(run.day) ? antagonistBeat(identityFor(run.opponentSignature), run.day) : ''}`,
        }
      }
      if (base) return base
    }
  }
  // Existing v1 saves keep the original three-card order mid-term.
  const index =
    run.encounterDeckVersion === 2
      ? (run.seed + run.day - 1) % ENCOUNTERS.length
      : (run.day - 1) % 3
  return ENCOUNTERS[index]!
}

export function visitCitySite(run: AcademyRun, siteId: SiteId): AcademyRun {
  if (![2, 3].includes(run.flowVersion ?? 0) || run.phase !== 'map') return run
  const site = CITY_SITES.find((entry) => entry.id === siteId)
  if (!site || (run.flowVersion === 2 && run.visitedSites?.includes(siteId)))
    return run
  if (run.flowVersion === 3 && (run.visitedDays?.[siteId] ?? -7) > run.day - 7)
    return run
  return {
    ...run,
    selectedSite: siteId,
    phase: 'campus',
    scene: `Day ${run.day}: you visit ${site.name} before the evening sirens. The city's future is still unwritten.`,
  }
}

export function startAcademy(
  power: PowerId,
  seed = Date.now(),
  signature?: SignaturePowerId,
  vow?: PowerVowId,
): AcademyRun {
  if (!POWERS.some((entry) => entry.id === power))
    throw new Error('Unknown power set')
  if (signature && (!signatureById(signature) || fieldFor(signature) !== power))
    throw new Error('Unknown power combination')
  if (vow && !POWER_VOWS.some((entry) => entry.id === vow))
    throw new Error('Unknown hero vow')
  return {
    version: 1,
    seed: Math.abs(Math.floor(seed)) || 1,
    power,
    ...(signature ? { signature } : {}),
    ...(vow ? { vow } : {}),
    encounterDeckVersion: 2,
    flowVersion: 2,
    phase: 'map',
    visitedSites: [],
    academyStanding: 0,
    cityStanding: 0,
    day: 1,
    influence: 0,
    danger: 2,
    assignments: [],
    playerCaseId: undefined,
    reports: [],
    scene:
      'The first bell rings. A thirty-day final month begins with a strange week of field simulations.',
    log: [],
    ending: null,
  }
}

export function startFullAcademy(
  power: PowerId,
  seed = Date.now(),
  signature?: SignaturePowerId,
  vow?: PowerVowId,
  initialForm: PlayerForm = 'student',
): AcademyRun {
  if (initialForm !== 'student' && !signature)
    throw new Error('An earned identity requires a signature')
  const base = startAcademy(power, seed, signature, vow)
  return {
    ...base,
    flowVersion: 3,
    incidentDeckVersion: 2,
    initialForm,
    playerEvolution: beginPlayerEvolution(initialForm),
    relationships: newSocialState(),
    visitedDays: {},
    injuries: {},
    infirmaryDays: [],
    contacts: startingContacts(base.seed),
    mastermind: campaignVillain(base.seed).id,
    opponentSignature: campaignOpponent(base.seed, base.signature).signature,
    betrayer: campaignBetrayer(base.seed),
    plotEvidence: [],
    scene: `Final month, day one of thirty. ${campaignAnchor(1)} ${campaignVillain(base.seed).clue}`,
  }
}

export function startingContacts(_seed: number): StudentId[] {
  // The rookie earns friends through daytime encounters. Existing saves retain contacts.
  return []
}

export function knownContacts(run: AcademyRun): StudentId[] {
  if (run.flowVersion !== 3 || !run.contacts)
    return STUDENTS.map((person) => person.id)
  return run.contacts
}

const STORY_LOCK_DAYS = [8, 11, 15, 16, 17, 20, 23, 24, 26, 29]

export function recruitableContact(run: AcademyRun) {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'campus' ||
    !run.selectedSite ||
    run.day >= 29 ||
    STORY_LOCK_DAYS.includes(run.day)
  )
    return null
  return (
    STUDENTS.find(
      (person) =>
        person.introSite === run.selectedSite &&
        !knownContacts(run).includes(person.id),
    ) ?? null
  )
}

export function recruitContact(run: AcademyRun, id: StudentId): AcademyRun {
  const person = recruitableContact(run)
  if (!person || person.id !== id) return run
  return {
    ...run,
    contacts: [...knownContacts(run), id],
    phase: 'dispatch',
    scene: `You meet ${person.name} at ${CITY_SITES.find((site) => site.id === run.selectedSite)?.name}. ${person.note} You explain the danger honestly and they choose to join your calls, keeping the right to refuse any job. The conversation costs your daylight investigation.`,
    log: [...run.log, `Day ${run.day}: ${person.name} joins the call roster`],
  }
}

export function emergencyContact(run: AcademyRun) {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'dispatch' ||
    run.day <= 3 ||
    knownContacts(run).some((id) => studentAvailable(run, id))
  )
    return null
  const candidates = STUDENTS.filter(
    (member) =>
      !knownContacts(run).includes(member.id) && member.origin !== 'academy',
  )
  const fallback = candidates.length
    ? candidates
    : STUDENTS.filter((member) => !knownContacts(run).includes(member.id))
  return fallback.length
    ? fallback[(run.seed + run.day) % fallback.length]!
    : null
}

export function callEmergencyVolunteer(run: AcademyRun): AcademyRun {
  const helper = emergencyContact(run)
  if (!helper) return run
  return {
    ...run,
    contacts: [...knownContacts(run), helper.id],
    danger: run.danger + 1,
    influence: run.influence - 1,
    scene: `No known hero can answer the call. You ask Comet City's mutual-aid dispatcher for one volunteer. ${helper.name}, ${helper.title}, answers with conditions: ${helper.note} They agree to join tonight's patrol. The urgent favor raises the city's risk and costs your reputation.`,
    log: [
      ...run.log,
      `Day ${run.day}: Emergency mutual-aid call answered by ${helper.name}`,
    ],
  }
}

export function studentAvailable(run: AcademyRun, id: StudentId): boolean {
  return (
    (run.injuries?.[id] ?? 0) <= run.day &&
    !(
      run.flowVersion === 3 &&
      run.day >= 20 &&
      run.betrayal?.person === id &&
      run.betrayal.status !== 'reconciled'
    )
  )
}

export function tendInfirmary(run: AcademyRun, id: StudentId): AcademyRun {
  if (run.flowVersion !== 3 || run.phase !== 'map' || run.day >= 29) return run
  if (
    !STUDENTS.some((person) => person.id === id) ||
    (run.injuries?.[id] ?? 0) <= run.day ||
    (run.betrayal?.person === id && run.betrayal.status !== 'reconciled')
  )
    return run
  return {
    ...run,
    phase: 'dispatch',
    injuries: { ...run.injuries, [id]: run.day },
    infirmaryDays: [...(run.infirmaryDays ?? []), run.day],
    scene: `You spend the morning arranging treatment for ${STUDENTS.find((s) => s.id === id)!.name}. They can join tonight, but you forgo a city lead.`,
    influence: run.influence + 1,
    log: [...run.log, `Day ${run.day}: Infirmary treatment for ${id}`],
  }
}

export function socialize(
  run: AcademyRun,
  id: StudentId,
  choice: SocialActionId,
): AcademyRun {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'map' ||
    !run.relationships ||
    !studentAvailable(run, id)
  )
    return run
  const options = socialChoices(run.relationships, id, run.day, {
    unavailable: !studentAvailable(run, id),
    form: run.playerEvolution?.form,
    danger: run.danger,
  })
  const selection = options.find((option) => option.id === choice)
  if (!selection) return run
  const relationships = applySocialChoice(
    run.relationships,
    id,
    run.day,
    choice,
    {
      form: run.playerEvolution?.form,
      danger: run.danger,
    },
  )
  if (!relationships) return run
  const person = STUDENTS.find((student) => student.id === id)!
  return {
    ...run,
    relationships,
    phase: 'dispatch',
    scene: `Day ${run.day}: ${person.name}. ${selection.text} The daylight is spent; night patrol still needs a team.`,
    log: [...run.log, `Day ${run.day}: ${person.name} — ${selection.label}`],
  }
}

/** Joining a call is separate from asking a classmate to volunteer for it. */
export function assignPlayerCase(run: AcademyRun, caseId: string): AcademyRun {
  if (
    run.flowVersion !== 3 ||
    run.phase !== 'dispatch' ||
    !incidentsFor(run).some((incident) => incident.id === caseId)
  ) return run
  return { ...run, playerCaseId: run.playerCaseId === caseId ? undefined : caseId }
}

export function assignTeam(
  run: AcademyRun,
  caseId: string,
  selected: StudentId[],
): AcademyRun {
  if (run.phase !== 'dispatch') return run
  if (!incidentsFor(run).some((incident) => incident.id === caseId)) return run
  if (selected.length > 3 || new Set(selected).size !== selected.length)
    return run
  if (selected.some((id) => !STUDENTS.some((student) => student.id === id)))
    return run
  if (
    run.flowVersion === 3 &&
    selected.some(
      (id) => !knownContacts(run).includes(id) || !studentAvailable(run, id),
    )
  )
    return run
  const remaining = run.assignments.filter(
    (assignment) => assignment.caseId !== caseId,
  )
  if (
    selected.some((id) =>
      remaining.some((assignment) => assignment.students.includes(id)),
    )
  )
    return run
  if (run.flowVersion === 3 && selected.length && remaining.length >= 3)
    return run
  return {
    ...run,
    assignments: selected.length
      ? [...remaining, { caseId, students: [...selected] }]
      : remaining,
  }
}

export function dispatchModifier(
  run: AcademyRun,
  incident: Incident,
  students: readonly StudentId[],
): number {
  const affinity = students.some(
    (id) =>
      STUDENTS.find((person) => person.id === id)?.skill === incident.need,
  )
  const cityStanding = run.cityStanding ?? 0
  const academyStanding = run.academyStanding ?? 0
  const civicSupport =
    [2, 3].includes(run.flowVersion ?? 0) && run.day > 2
      ? incident.allegiance === 'villain'
        ? cityStanding <= -2
          ? 1
          : cityStanding >= 2
            ? -1
            : 0
        : cityStanding >= 2
          ? 1
          : cityStanding <= -2
            ? -1
            : 0
      : 0
  const academySupport =
    [2, 3].includes(run.flowVersion ?? 0) && run.day > 2
      ? academyStanding >= 2
        ? 1
        : academyStanding <= -2
          ? -1
          : 0
      : 0
  const reportedNetwork = run.plotEvidence?.length ?? 0
  const activeNetwork =
    run.flowVersion === 3 &&
    run.day >= 11 &&
    reportedNetwork < (run.day >= 26 ? 3 : run.day >= 17 ? 2 : 1)
  const sabotagePenalty =
    activeNetwork && incident.allegiance !== 'villain' ? 1 : 0
  const identityPressure =
    run.flowVersion === 3 && run.day >= 15 && incident.allegiance !== 'villain'
      ? opponentPressure(run.signature, run.opponentSignature)
      : 0
  const response =
    run.flowVersion === 3
      ? Math.max(
          -2,
          Math.min(
            2,
            students.reduce(
              (total, id) =>
                total +
                reactionSuitability(missionReaction(id, incident.id).mood),
              0,
            ),
          ),
        )
      : 0
  const route =
    run.flowVersion === 3 ? missionRoute(incident.id, students) : null
  return (
    students.length +
    (run.flowVersion === 3 && run.playerCaseId === incident.id ? 1 : 0) +
    (affinity ? 2 : 0) +
    (run.flowVersion !== 3 || run.playerCaseId === incident.id
      ? run.power === incident.need ? 2 : 1
      : 0) +
    civicSupport +
    academySupport -
    sabotagePenalty -
    identityPressure +
    (run.flowVersion === 3
      ? evolutionNightModifier(run.playerEvolution, incident.allegiance) +
        socialMissionBonus(run.relationships, [...students]) +
        Math.sign(personalStanding(run.personalHistory))
      : 0) +
    response +
    (route?.boost ?? 0)
  )
}

export function dispatchChance(
  run: AcademyRun,
  caseId: string,
  students: readonly StudentId[],
): number {
  const incident = incidentsFor(run).find((item) => item.id === caseId)
  if (
    !incident ||
    (!students.length && !(run.flowVersion === 3 && run.playerCaseId === caseId)) ||
    students.length > 3 ||
    new Set(students).size !== students.length ||
    students.some(
      (id) =>
        !STUDENTS.some((member) => member.id === id) ||
        (run.flowVersion === 3 && !studentAvailable(run, id)),
    )
  )
    return 0
  const baseline = dispatchModifier(run, incident, students)
  return Math.round(
    (100 *
      [0, 1, 2, 3, 4, 5].filter((roll) => roll + baseline >= incident.risk)
        .length) /
      6,
  )
}

export function resolveDispatch(run: AcademyRun): AcademyRun {
  if (
    run.phase !== 'dispatch' ||
    (run.assignments.length === 0 && !run.playerCaseId) ||
    (run.flowVersion === 3 && !run.playerCaseId)
  ) return run
  let influence = run.influence
  let danger = run.danger
  const injuries = { ...(run.injuries ?? {}) }
  const reports = incidentsFor(run).map((incident) => {
    const assignment =
      run.assignments.find((entry) => entry.caseId === incident.id) ??
      (run.playerCaseId === incident.id
        ? { caseId: incident.id, students: [] as StudentId[] }
        : undefined)
    if (!assignment) {
      danger += 1
      return {
        caseId: incident.id,
        title: incident.title,
        names: 'No team dispatched',
        grade: 'failed' as Grade,
        text:
          [2, 3].includes(run.flowVersion ?? 0) && run.day > 2
            ? 'No team accepts this call. Municipal crews attempt the rescue without academy help; the people abandoned remember who declined.'
            : 'A training team from another class steps in. Your empty assignment slot is logged as a refusal.',
      }
    }
    const roll =
      hash(
        run.seed,
        `${run.day}:${incident.id}:${assignment.students.join(',')}`,
      ) % 6
    const score = roll + dispatchModifier(run, incident, assignment.students)
    const villain =
      run.flowVersion === 3
        ? campaignVillain(run.seed, run.mastermind)
        : undefined
    const reportedNetwork = run.plotEvidence?.length ?? 0
    const activeNetwork =
      run.flowVersion === 3 &&
      run.day >= 11 &&
      reportedNetwork < (run.day >= 26 ? 3 : run.day >= 17 ? 2 : 1)
    const grade: Grade =
      score >= incident.risk + 4
        ? 'honors'
        : score >= incident.risk + 2
          ? 'pass'
          : score >= incident.risk
            ? 'partial'
            : 'failed'
    influence +=
      grade === 'honors'
        ? 2
        : grade === 'pass'
          ? 1
          : grade === 'failed'
            ? -1
            : 0
    danger +=
      grade === 'failed'
        ? 2
        : grade === 'partial'
          ? 1
          : grade === 'honors'
            ? -1
            : 0
    const trainingText = {
      honors:
        'An elegant rescue, with time left to notice the simulation has hidden a real distress code.',
      pass: 'Everyone is accounted for. The instructor marks your judgment as sound, but the evidence is stranger than the scenario.',
      partial:
        'Most people make it out. Your team refuses to pretend the ones left behind were only numbers.',
      failed:
        'The exercise collapses into a rescue of the rescuers. Nobody dies here, but the argument about your choices is real.',
    }[grade]
    const baseText =
      ((run.flowVersion === 3 || run.flowVersion === 2) && run.day > 2 ||
        run.flowVersion === 3
        ? realNightCase(incident.id)?.consequences[grade]
        : undefined) ?? trainingText
    const sabotagedBy =
      villain && activeNetwork
        ? campaignAccomplice(villain, run.day >= 26 ? 2 : run.day >= 17 ? 1 : 0)
        : undefined
    const bondedSupport = socialMissionBonus(
      run.relationships,
      assignment.students,
    )
    const textWithBonds = bondedSupport
      ? `${baseText} Your negotiated field-partner and sidekick signals strengthen this team's coordination without removing their right to refuse.`
      : baseText
    const special =
      run.flowVersion === 3
        ? missionRoute(incident.id, assignment.students)
        : null
    const text =
      sabotagedBy && incident.allegiance !== 'villain'
        ? `${textWithBonds} Witnesses report that ${sabotagedBy.name} ${sabotagedBy.sabotage}.`
        : textWithBonds
    const resolvedText = special
      ? `${text} SPECIAL ROUTE: ${special.label}. ${special.result}`
      : text
    if (
      run.flowVersion === 3 &&
      run.day > 2 &&
      assignment.students.length > 0 &&
      (grade === 'failed' || (grade === 'partial' && roll % 2 === 0))
    ) {
      const index =
        hash(run.seed, `${run.day}:${incident.id}:injury`) %
        assignment.students.length
      const injured = assignment.students[index]!
      injuries[injured] = Math.max(injuries[injured] ?? 0, run.day + 2)
    }
    return {
      caseId: incident.id,
      title: incident.title,
      grade,
      text: resolvedText,
      names: [
        ...(run.playerCaseId === incident.id ? ['YOU · on patrol'] : []),
        ...assignment.students.map((id) => STUDENTS.find((s) => s.id === id)!.name),
      ].join(' · '),
    }
  })
  return {
    ...run,
    phase: [2, 3].includes(run.flowVersion ?? 0) ? 'debrief' : 'campus',
    ...(run.flowVersion === 3 ? { injuries, playerCaseId: undefined } : {}),
    influence,
    danger: Math.max(0, danger),
    reports,
    scene: [2, 3].includes(run.flowVersion ?? 0)
      ? `Night ${run.day} ends. Comet City's lights return, but every call leaves a mark on the people who answered it.`
      : 'The training siren fades. Your campus pass vibrates: someone is asking to see you before nightfall.',
    log: [
      ...run.log,
      ...reports.map(
        (report) => `Day ${run.day}: ${report.title} — ${report.grade}`,
      ),
    ],
  }
}

export function chooseEncounter(run: AcademyRun, optionId: string): AcademyRun {
  if (run.phase !== 'campus') return run
  const option = encounterFor(run).options.find(
    (entry) => entry.id === optionId,
  )
  if (!option) return run
  const isEvolution =
    run.flowVersion === 3 &&
    [16, 23].includes(run.day) &&
    Boolean(run.playerEvolution)
  const evolved = isEvolution
    ? resolveEvolution(run.playerEvolution!, optionId, run.day, run.signature)
    : null
  if (isEvolution && !evolved) return run
  const powerUsed =
    (option.id === 'truth' && run.power === 'empathy') ||
    (option.id === 'cover' && run.power === 'technopathy')
  const special = run.signature ? signatureById(run.signature) : undefined
  const scene =
    option.text +
    (powerUsed ? ' Your power opens a detail that nobody else notices.' : '') +
    (special
      ? ` Your signature technique, ${special.name}, offers another approach: ${special.action}. ${special.cost}.`
      : '')
  const plot =
    run.flowVersion === 3
      ? campaignPlotEvent(
          run.seed,
          run.mastermind,
          run.day,
          STUDENTS.find(
            (s) => s.id === (run.betrayer ?? campaignBetrayer(run.seed)),
          )!.name,
        )
      : undefined
  const personalDay = [4, 12, 21, 27].includes(run.day) && run.flowVersion === 3
  const personalAction =
    personalDay &&
    [
      'investigate',
      'conceal',
      'delegate',
      'ally',
      'court',
      'distance',
      'expose',
      'leverage',
      'listen',
      'hero',
      'villain',
      'independent',
    ].includes(option.id)
      ? {
          day: run.day as PersonalChapterDay,
          choice: option.id as PersonalChoice,
        }
      : null
  const identityHistory = personalAction
    ? [...(run.identityHistory ?? []), personalAction]
    : run.identityHistory
  const vowMatch =
    /^vow-(shelter|unmask|claim)-(3|10|18|25|28)-(protect|bargain|refuse)$/.exec(
      option.id,
    )
  const vowAction =
    vowMatch?.[1] === run.vow && Number(vowMatch?.[2]) === run.day
      ? (vowMatch?.[3] as VowAction)
      : null
  const vowHistory = vowAction
    ? [...(run.vowHistory ?? []), { day: run.day, action: vowAction }]
    : run.vowHistory
  const witnessMatch = /^personal-(6|9|19|22)-(protect|confront|exploit)$/.exec(
    option.id,
  )
  const witnessChoice =
    Number(witnessMatch?.[1]) === run.day
      ? (witnessMatch?.[2] as WitnessChoice)
      : null
  const personalHistory = witnessChoice
    ? [...(run.personalHistory ?? []), { day: run.day, choice: witnessChoice }]
    : run.personalHistory
  const betrayerId = run.betrayer ?? campaignBetrayer(run.seed)
  const plotEvidence = [...(run.plotEvidence ?? [])]
  if (
    run.flowVersion === 3 &&
    option.id.startsWith('plot-a') &&
    option.id.endsWith('-expose')
  ) {
    const villain = campaignVillain(run.seed, run.mastermind)
    const index = Number(option.id[6]) - 1
    const evidence = villain.accomplices?.[index]?.id
    if (evidence && !plotEvidence.includes(evidence))
      plotEvidence.push(evidence)
  }
  const betrayal =
    run.flowVersion === 3 && run.day === 20
      ? { day: 20, person: betrayerId, status: 'active' as const }
      : run.flowVersion === 3 && run.day === 24
        ? {
            day: 20,
            person: betrayerId,
            status:
              option.id === 'plot-return-accountable'
                ? ('reconciled' as const)
                : ('isolated' as const),
          }
        : run.betrayal
  const neighborhood = CITY_SITES.find((site) => site.id === run.selectedSite)
  const trustChange =
    'trust' in option && typeof option.trust === 'number' ? option.trust : 0
  return {
    ...run,
    phase: [2, 3].includes(run.flowVersion ?? 0) ? 'dispatch' : 'debrief',
    ...(vowAction ? { vowHistory } : {}),
    ...(witnessChoice ? { personalHistory } : {}),
    ...(personalAction ? { identityHistory } : {}),
    ...(run.flowVersion === 3 && run.day === 29
      ? {
          guestPlan:
            option.id === 'guest-open'
              ? ('open' as const)
              : option.id === 'guest-private'
                ? ('private' as const)
                : ('duplicate' as const),
        }
      : {}),
    ...(run.flowVersion === 3 && plot
      ? {
          plotEvidence,
          ...(betrayal ? { betrayal } : {}),
        }
      : {}),
    ...(run.flowVersion === 3 && run.playerEvolution
      ? {
          playerEvolution:
            evolved ?? recordPlayerValues(run.playerEvolution, option),
        }
      : {}),
    influence: run.influence + option.influence,
    academyStanding:
      (run.academyStanding ?? 0) +
      (neighborhood?.district === 'academy' ? trustChange : 0),
    cityStanding:
      (run.cityStanding ?? 0) +
      (neighborhood?.district === 'city' ? trustChange : 0),
    danger: Math.max(0, run.danger + option.danger - (powerUsed ? 1 : 0)),
    scene:
      run.flowVersion === 2
        ? `${scene} Dusk settles; you must now assign a night team.`
        : scene,
    ...(run.flowVersion === 3 && run.selectedSite
      ? {
          visitedDays: { ...run.visitedDays, [run.selectedSite]: run.day },
        }
      : {}),
    visitedSites:
      [2, 3].includes(run.flowVersion ?? 0) && run.selectedSite
        ? [...(run.visitedSites ?? []), run.selectedSite]
        : run.visitedSites,
    log: [
      ...run.log,
      `Day ${run.day}: ${encounterFor(run).title} — ${option.label}`,
    ],
  }
}

export function nextSchoolDay(run: AcademyRun): AcademyRun {
  if (run.phase !== 'debrief') return run
  if (run.flowVersion === 3 && run.day >= 29)
    return {
      ...run,
      day: 30,
      phase: 'finale',
      assignments: [],
      reports: [],
      scene: `${CAMPAIGN_ANCHORS[29]} The ${campaignVillain(run.seed, run.mastermind).name} conspiracy now ${campaignVillain(run.seed, run.mastermind).method}. ${run.opponentSignature ? antagonistBeat(identityFor(run.opponentSignature), 30) : ''} This is real, not a simulation.`,
      log: [...run.log, 'Day 30: The fourth dance and the real Prom of Doom'],
    }
  if (run.flowVersion !== 3 && run.day >= 7)
    return {
      ...run,
      phase: 'finale',
      scene:
        'At the end of week one, the faculty projects a prom-night disaster simulation. Real graduation is still weeks away.',
    }
  return {
    ...run,
    phase: [2, 3].includes(run.flowVersion ?? 0) ? 'map' : 'dispatch',
    day: run.day + 1,
    selectedSite: undefined,
    assignments: [],
    reports: [],
    scene:
      'The next bell rings. Yesterday has already changed who will answer your calls.',
  }
}

export function finishAcademy(
  run: AcademyRun,
  choice: 'protect' | 'command' | 'share' | 'evacuate',
): AcademyRun {
  if (run.phase !== 'finale') return run
  if (run.flowVersion === 3) {
    const villain = campaignVillain(run.seed, run.mastermind)
    const evidenceCount = run.plotEvidence?.length ?? 0
    const identityForm = run.playerEvolution?.form ?? 'student'
    const roleStanding =
      identityForm === 'hero' ? 2 : identityForm === 'villain' ? -2 : 0
    const roleEpilogue =
      run.signature && run.playerEvolution
        ? identityForm === 'hero'
          ? `${identityFor(run.signature).realName} graduates as ${identityFor(run.signature).hero.alias}: ${identityFor(run.signature).hero.method} Their promise persists after the shattered prom.`
          : identityForm === 'villain'
            ? `${identityFor(run.signature).realName} leaves the ballroom as ${identityFor(run.signature).villain.alias}: ${identityFor(run.signature).villain.method} The city remembers the cost of their bargain.`
            : `${identityFor(run.signature).realName} remains ${identityFor(run.signature).student.alias}, choosing a future without compulsory transformation.`
        : ''
    const reconciled = run.betrayal?.status === 'reconciled'
    const support =
      (run.cityStanding ?? 0) +
      (run.academyStanding ?? 0) +
      evidenceCount * 2 +
      (reconciled ? 2 : 0) +
      routeStanding(run.vowHistory) +
      personalStanding(run.personalHistory) +
      personalOutcomeModifier(run.identityHistory)
    const identityPressure = opponentPressure(
      run.signature,
      run.opponentSignature,
    )
    const earned =
      support + roleStanding >= 2 + identityPressure &&
      run.danger <= 48 + evidenceCount * 2 - identityPressure
    const opponent = run.opponentSignature
      ? identityFor(run.opponentSignature)
      : null
    const opponentEpilogue = opponent ? antagonistFinale(opponent, earned) : ''
    const rescue = choice === 'protect' || choice === 'evacuate'
    const shared = choice === 'share'
    // Nobody exposed an accomplice and nobody came: the mastermind takes
    // every tower the player did not hand to the neighborhoods.
    const villainTakesShield = !earned && evidenceCount === 0 && !shared
    const ending = villainTakesShield
      ? 'THE SHIELD CHANGES HANDS'
      : shared
        ? earned
          ? 'A CITY WITH A THOUSAND KEYS'
          : 'THE BROKEN GRID'
        : rescue
          ? earned
            ? choice === 'evacuate'
              ? 'THE TRANSMITTER GOES DARK'
              : 'THE LAST DANCE LEAVES BY BOAT'
            : 'THE MUSIC AFTER GLASS'
          : earned
            ? 'MASTER OF THE SHIELD'
            : 'THE PRICE OF A SINGLE SWITCH'
    const endingTurn =
      ending === 'THE SHIELD CHANGES HANDS'
        ? `Nobody exposed a single accomplice operation, so nobody knows which relay to cut. While you ${choice === 'command' ? 'fight for a console that is already answering someone else' : 'carry guests out through the broken glass'}, ${villain.name} takes the shield towers whole, and by dawn the city's protection answers to a new owner.`
        : ending === 'THE TRANSMITTER GOES DARK'
          ? 'Your allies hold the doors while the transmitter dies in a shower of sparks with the beam still climbing. The shield towers fall dark and stay dark, and the city starts rebuilding its defenses by hand, block by block, with the people who carried the injured out.'
          : ''
    const keys =
      run.guestPlan === 'duplicate'
        ? 'Independent rescuers possess duplicate emergency keys.'
        : run.guestPlan === 'open'
          ? 'The ballroom serves as public shelter, crowding the exits.'
          : 'Private security controls the ballroom doors.'
    const conspiracyOutcome = earned ? villain.fall : villain.coup
    const betrayalOutcome = run.betrayal
      ? `${STUDENTS.find((s) => s.id === run.betrayal!.person)!.name} betrayed the rescue network on day 20. ${reconciled ? 'They returned under public oversight and helped repair the damage.' : 'The damaged relationship never received an easy pardon.'}`
      : 'An unidentified classmate remains connected to the compromised emergency grid.'
    const relationshipEpilogue = socialFinaleText(
      run.relationships,
      Object.fromEntries(STUDENTS.map((s) => [s.id, s.name])) as Record<
        StudentId,
        string
      >,
    )
    const cost = shared
      ? 'Independent district shields save neighborhoods but lose precise coordination; some homes suffer damage.'
      : rescue
        ? 'Guests escape, but the ballroom and nearby streets are damaged as people carry the injured through debris.'
        : 'The centralized shield remains operable, but people who trusted the operator cannot easily reclaim their safety.'
    return {
      ...run,
      phase: 'ending',
      ending,
      scene: `Midway through the fourth dance the twelve-sided chandelier turns over, the glass roof fractures, and a beam joins the ballroom to the city shield towers. ${villain.name} ${villain.method}. You choose to ${choice === 'protect' ? 'save guests before hardware' : choice === 'evacuate' ? 'destroy the transmitter and evacuate' : shared ? 'distribute shield keys to the neighborhoods' : 'seize the control console'}. ${keys} ${earned ? 'Your accumulated allies answer the call.' : 'Your scattered allies cannot coordinate in time.'} ${cost} ${endingTurn} ${conspiracyOutcome ?? ''} ${roleEpilogue} ${opponentEpilogue} ${betrayalOutcome} ${relationshipEpilogue} ${personalEnding(run)} ${routeEpilogue(run.vow, run.vowHistory)} ${personalFinale(run.signature, run.personalHistory)} ${evidenceCount} of three accomplice operations were exposed. At dawn the survivors decide what graduation and rebuilding mean.`,
      log: [
        ...run.log,
        `Day 30: ${choice} against ${villain.name}`,
        `Finale: ${ending}`,
      ],
    }
  }
  if (choice === 'share' || choice === 'evacuate') return run
  const protect = choice === 'protect'
  const earned = protect
    ? run.influence >= 2 && run.danger <= 12
    : run.influence <= -2
  const ending = protect
    ? earned
      ? 'HONORS IN THE PROM SIMULATION'
      : 'THE RESCUE THAT COUNTED'
    : earned
      ? 'MASTER OF THE SIMULATION'
      : 'AN UNEXPECTED REBOOT'
  const scene = protect
    ? earned
      ? 'You refuse the easy sacrifice. Your classmates stand with you and the projected comet turns aside. The simulation records a lesson worth remembering.'
      : 'Your simulated rescue costs the perfect training grade, but the classmates beside you remember who you protected.'
    : earned
      ? 'You hijack the simulated catastrophe engine and rewrite its rules. The dean files a very interesting report.'
      : 'You seize the simulated controls. The machine decides what control means. Your rival pulls you free before the exercise can complete.'
  const identity = run.signature ? identityFor(run.signature) : undefined
  const projectedStory = identity
    ? identityStoryFor(identity, 'protagonist', protect ? 'hero' : 'villain')
    : null
  const identityProjection = projectedStory
    ? `The rehearsal yearbook imagines ${projectedStory.person}, once ${projectedStory.studentAlias}, becoming ${projectedStory.alias}: ${sentence(projectedStory.setup)} ${sentence(projectedStory.decision)} That transformation is ${protect ? 'not yet earned' : 'not yet inevitable'}.`
    : ''
  const zuzuChoice = run.log.find((line) =>
    line.includes('The Stray Blade Arrives —'),
  )
  const tessChoice = run.log.find((line) =>
    line.includes('A Visitor from the Stars —'),
  )
  const visitorProjection = [
    zuzuChoice?.includes('Protect Zuzu')
      ? 'Zuzu remembers that you refused to sell him. In one projected future the Koala Assassin stands beside Comet City defenders, still free to disagree.'
      : zuzuChoice
        ? 'Zuzu remembers the warrant. A possible future flashes Shogun Null, his exosuit aimed at the registry of people Comet City can erase.'
        : '',
    tessChoice?.includes('Find a safe route')
      ? 'Tess Helio sends a discreet Starwake bearing for a rescue, with the sanctuary coordinates removed by her own hand.'
      : tessChoice
        ? 'Tess Helio knows her map was copied. The rehearsal hints at the Void Cartographer, a name born from the cost of someone else owning her routes.'
        : '',
  ].filter(Boolean)
  const signature = run.signature ? signatureById(run.signature) : undefined
  const signatureProjection =
    signature && identity && run.vow
      ? `The first-week projection also shows a possible real graduation: ${finaleFor(signature, identity.realName, identity.villain.alias, run.vow)}`
      : ''
  return {
    ...run,
    phase: 'ending',
    ending,
    scene: [
      scene,
      identityProjection,
      signatureProjection,
      ...visitorProjection,
    ]
      .filter(Boolean)
      .join(' '),
    log: [...run.log, `Finale: ${ending}`],
  }
}

function sentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`
}

function migrateSignature(data: Partial<AcademyRun>): Partial<AcademyRun> {
  if (data.signature === undefined) return data
  const signature = migrateSignatureId(data.signature)
  if (!signature || signature === data.signature) return data
  return { ...data, signature, power: fieldFor(signature) }
}

export function restoreAcademy(raw: unknown): AcademyRun | null {
  if (!raw || typeof raw !== 'object') return null
  const data = migrateSignature(raw as Partial<AcademyRun>)
  if (
    data.version !== 1 ||
    (data.playerCaseId !== undefined &&
      (data.flowVersion !== 3 ||
        typeof data.playerCaseId !== 'string' ||
        !incidentsFor(data as AcademyRun).some((caseFile) => caseFile.id === data.playerCaseId))) ||
    !POWERS.some((p) => p.id === data.power) ||
    (data.signature !== undefined &&
      (!signatureById(data.signature) ||
        fieldFor(data.signature) !== data.power)) ||
    (data.vow !== undefined && !POWER_VOWS.some((v) => v.id === data.vow)) ||
    (data.vowHistory !== undefined &&
      (!data.vow || !isVowMemory(data.vowHistory, data.day ?? 0))) ||
    (data.personalHistory !== undefined &&
      (!data.signature ||
        data.flowVersion !== 3 ||
        !validPersonalHistory(data.personalHistory, data.day ?? 0))) ||
    (data.identityHistory !== undefined &&
      (!data.signature ||
        !isValidPersonalHistory(data.identityHistory, data.day ?? 0))) ||
    (data.initialForm !== undefined &&
      (!['student', 'hero', 'villain'].includes(data.initialForm) ||
        (data.initialForm !== 'student' && !data.signature))) ||
    typeof data.seed !== 'number' ||
    typeof data.day !== 'number' ||
    !Number.isInteger(data.day) ||
    data.day < 1 ||
    data.day > (data.flowVersion === 3 ? 30 : 7) ||
    (data.flowVersion !== undefined && ![2, 3].includes(data.flowVersion)) ||
    (data.incidentDeckVersion !== undefined &&
      (data.incidentDeckVersion !== 2 || data.flowVersion !== 3)) ||
    !['map', 'dispatch', 'campus', 'debrief', 'finale', 'ending'].includes(
      data.phase ?? '',
    ) ||
    ([2, 3].includes(data.flowVersion ?? 0) &&
      (!Array.isArray(data.visitedSites) ||
        data.visitedSites.some(
          (site) => !CITY_SITES.some((node) => node.id === site),
        ) ||
        (data.selectedSite !== undefined &&
          !CITY_SITES.some((node) => node.id === data.selectedSite)))) ||
    (![2, 3].includes(data.flowVersion ?? 0) && data.phase === 'map') ||
    (data.flowVersion === 3 &&
      (!data.visitedDays ||
        typeof data.visitedDays !== 'object' ||
        !data.injuries ||
        typeof data.injuries !== 'object' ||
        !Array.isArray(data.infirmaryDays) ||
        (data.contacts !== undefined &&
          (!Array.isArray(data.contacts) ||
            data.contacts.length > STUDENTS.length ||
            new Set(data.contacts).size !== data.contacts.length ||
            data.contacts.some(
              (id) => !STUDENTS.some((person) => person.id === id),
            ))) ||
        (data.mastermind !== undefined &&
          !CAMPAIGN_VILLAINS.some((v) => v.id === data.mastermind)) ||
        (data.relationships !== undefined &&
          !validSocialState(data.relationships, data.day!)) ||
        (data.playerEvolution !== undefined &&
          (!isValidPlayerEvolution(
            data.playerEvolution,
            data.signature,
            data.initialForm ?? 'student',
          ) ||
            data.playerEvolution.milestones.some(
              (event) => event.day > data.day!,
            ))) ||
        (data.opponentSignature !== undefined &&
          ((data.signature !== undefined &&
            data.opponentSignature === data.signature) ||
            !IDENTITY_ARCS.some(
              (arc) => arc.signature === data.opponentSignature,
            ))) ||
        (data.betrayer !== undefined &&
          data.betrayer !== campaignBetrayer(data.seed ?? 0)) ||
        (data.plotEvidence !== undefined &&
          (!Array.isArray(data.plotEvidence) ||
            data.plotEvidence.some(
              (id) =>
                !campaignVillain(
                  data.seed ?? 0,
                  data.mastermind,
                ).accomplices?.some((a) => a.id === id),
            ) ||
            new Set(data.plotEvidence).size !== data.plotEvidence.length)) ||
        (data.betrayal !== undefined &&
          (!['active', 'reconciled', 'isolated'].includes(
            data.betrayal.status,
          ) ||
            data.betrayal.day !== 20 ||
            data.betrayal.person !== campaignBetrayer(data.seed ?? 0))) ||
        Object.entries(data.visitedDays).some(
          ([site, day]) =>
            !CITY_SITES.some((entry) => entry.id === site) ||
            !Number.isInteger(day) ||
            (day as number) < 1 ||
            (day as number) > data.day!,
        ) ||
        Object.entries(data.injuries).some(
          ([student, until]) =>
            !STUDENTS.some((entry) => entry.id === student) ||
            !Number.isInteger(until) ||
            (until as number) < 0 ||
            (until as number) > 32,
        ))) ||
    !Array.isArray(data.log) ||
    !Array.isArray(data.assignments) ||
    !Array.isArray(data.reports) ||
    typeof data.influence !== 'number' ||
    typeof data.danger !== 'number' ||
    (data.academyStanding !== undefined &&
      (!Number.isFinite(data.academyStanding) ||
        !Number.isInteger(data.academyStanding))) ||
    (data.cityStanding !== undefined &&
      (!Number.isFinite(data.cityStanding) ||
        !Number.isInteger(data.cityStanding)))
  )
    return null
  return data as AcademyRun
}
