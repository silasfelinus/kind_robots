import { fieldFor, identityFor, identityStoryFor } from './identityArcs'
import { GUEST_IDENTITIES } from './guestIdentities'
import { CITY_SITES, type SiteId } from './cityMap'
import { districtEncounterFor } from './districtEncounters'
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
  },
  {
    id: 'sol',
    name: 'Sol Navarro',
    title: 'Systems prodigy',
    skill: 'technopathy',
    portrait: 'SN',
    note: 'Knows where the cameras look and where they do not.',
  },
  {
    id: 'imani',
    name: 'Imani Vale',
    title: 'Mediator',
    skill: 'empathy',
    portrait: 'IV',
    note: 'Has a habit of hearing what people refuse to say.',
  },
  {
    id: 'ash',
    name: 'Ash Calder',
    title: 'Weather artisan',
    skill: 'elemental',
    portrait: 'AC',
    note: 'Always remembers the names of the maintenance staff.',
  },
  {
    id: 'nix',
    name: 'Nix Venn',
    title: 'Portal runner',
    skill: 'spatial',
    portrait: 'NV',
    note: 'Can get anywhere except a conversation with their father.',
  },
  {
    id: 'kit',
    name: 'Kit Rowan',
    title: 'Field medic',
    skill: 'biotech',
    portrait: 'KR',
    note: 'Keeps a packet of seeds in every uniform pocket.',
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
      ' Tess Helio of the This Means Warp crew needs a transit corridor for a refugee ship, but the academy dean wants a copy of her secret sanctuary map.',
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
  encounterDeckVersion?: 2
  flowVersion?: 2 | 3
  selectedSite?: SiteId
  visitedSites?: SiteId[]
  visitedDays?: Partial<Record<SiteId, number>>
  injuries?: Partial<Record<StudentId, number>>
  infirmaryDays?: number[]
  guestPlan?: 'open' | 'private' | 'duplicate'
  mastermind?: string
  betrayer?: StudentId
  betrayal?: { day: number; person: StudentId; status: 'active' | 'reconciled' | 'isolated' }
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

export function incidentsFor(run: AcademyRun): Incident[] {
  const offset = (run.seed + run.day - 1) % INCIDENTS.length
  return [INCIDENTS[offset]!, INCIDENTS[(offset + 3) % INCIDENTS.length]!]
}

export function encounterFor(run: AcademyRun) {
  if (run.flowVersion === 3 && run.day === 29) return GUEST_LIST_EVENT
  if (run.flowVersion === 3) {
    const person = STUDENTS.find(s => s.id === (run.betrayer ?? campaignBetrayer(run.seed)))!
    const plot = campaignPlotEvent(run.seed, run.mastermind, run.day, person.name)
    if (plot) return { ...plot, scene: `${campaignAnchor(run.day)} ${plot.scene}` }
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
        return {
          ...base,
          title: previous ? `${base.title} / Return Visit` : base.title,
          scene: `${campaignAnchor(run.day)} ${previous ? `You return to ${site.name}, where residents remember your choice on day ${previous}. This new visit is another chance to decide.` : base.scene}`,
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
): AcademyRun {
  const base = startAcademy(power, seed, signature, vow)
  return {
    ...base,
    flowVersion: 3,
    visitedDays: {},
    injuries: {},
    infirmaryDays: [],
    mastermind: campaignVillain(base.seed).id,
    betrayer: campaignBetrayer(base.seed),
    plotEvidence: [],
    scene: `Final month, day one of thirty. ${campaignAnchor(1)} ${campaignVillain(base.seed).clue}`,
  }
}

export function studentAvailable(run: AcademyRun, id: StudentId): boolean {
  return (run.injuries?.[id] ?? 0) <= run.day &&
    !(run.flowVersion === 3 && run.day >= 20 &&
      run.betrayal?.person === id && run.betrayal.status !== 'reconciled')
}

export function tendInfirmary(run: AcademyRun, id: StudentId): AcademyRun {
  if (run.flowVersion !== 3 || run.phase !== 'map' || run.day >= 29) return run
  if (!STUDENTS.some((person) => person.id === id) || studentAvailable(run, id))
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
    selected.some((id) => !studentAvailable(run, id))
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
  return {
    ...run,
    assignments: selected.length
      ? [...remaining, { caseId, students: [...selected] }]
      : remaining,
  }
}

export function resolveDispatch(run: AcademyRun): AcademyRun {
  if (run.phase !== 'dispatch' || run.assignments.length === 0) return run
  let influence = run.influence
  let danger = run.danger
  const injuries = { ...(run.injuries ?? {}) }
  const reports = incidentsFor(run).map((incident) => {
    const assignment = run.assignments.find(
      (entry) => entry.caseId === incident.id,
    )
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
    const affinity = assignment.students.some(
      (id) =>
        STUDENTS.find((person) => person.id === id)?.skill === incident.need,
    )
    const roll =
      hash(
        run.seed,
        `${run.day}:${incident.id}:${assignment.students.join(',')}`,
      ) % 6
    // Residents and classmates remember the player's prior decisions.
    // City goodwill helps public rescues; underworld contacts aid covert
    // operations. Neither modifies the original training-save outcomes.
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
    const villain = run.flowVersion === 3 ? campaignVillain(run.seed, run.mastermind) : undefined
    const reportedNetwork = run.plotEvidence?.length ?? 0
    const activeNetwork =
      run.flowVersion === 3 && run.day >= 11 &&
      reportedNetwork < (run.day >= 26 ? 3 : run.day >= 17 ? 2 : 1)
    const sabotagePenalty = activeNetwork && incident.allegiance !== 'villain' ? 1 : 0
    const score =
      roll +
      assignment.students.length +
      (affinity ? 2 : 0) +
      (run.power === incident.need ? 1 : 0) +
      civicSupport +
      academySupport -
      sabotagePenalty
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
      ([2, 3].includes(run.flowVersion ?? 0) && run.day > 2
        ? realNightCase(incident.id)?.consequences[grade]
        : undefined) ?? trainingText
    const sabotagedBy = villain && activeNetwork
      ? campaignAccomplice(villain, run.day >= 26 ? 2 : run.day >= 17 ? 1 : 0)
      : undefined
    const text = sabotagedBy && incident.allegiance !== 'villain'
      ? `${baseText} Witnesses report that ${sabotagedBy.name} ${sabotagedBy.sabotage}.`
      : baseText
    if (
      run.flowVersion === 3 &&
      run.day > 2 &&
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
      text,
      names: assignment.students
        .map((id) => STUDENTS.find((s) => s.id === id)!.name)
        .join(' · '),
    }
  })
  return {
    ...run,
    phase: [2, 3].includes(run.flowVersion ?? 0) ? 'debrief' : 'campus',
    ...(run.flowVersion === 3 ? { injuries } : {}),
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
  const plot = run.flowVersion === 3
    ? campaignPlotEvent(run.seed, run.mastermind, run.day,
        STUDENTS.find(s => s.id === (run.betrayer ?? campaignBetrayer(run.seed)))!.name)
    : undefined
  const betrayerId = run.betrayer ?? campaignBetrayer(run.seed)
  const plotEvidence = [...(run.plotEvidence ?? [])]
  if (run.flowVersion === 3 && option.id.startsWith('plot-a') && option.id.endsWith('-expose')) {
    const villain = campaignVillain(run.seed, run.mastermind)
    const index = Number(option.id[6]) - 1
    const evidence = villain.accomplices?.[index]?.id
    if (evidence && !plotEvidence.includes(evidence)) plotEvidence.push(evidence)
  }
  const betrayal =
    run.flowVersion === 3 && run.day === 20
      ? { day: 20, person: betrayerId, status: 'active' as const }
      : run.flowVersion === 3 && run.day === 24
        ? { day: 20, person: betrayerId, status: option.id === 'plot-return-accountable' ? 'reconciled' as const : 'isolated' as const }
        : run.betrayal
  const neighborhood = CITY_SITES.find((site) => site.id === run.selectedSite)
  const trustChange =
    'trust' in option && typeof option.trust === 'number' ? option.trust : 0
  return {
    ...run,
    phase: [2, 3].includes(run.flowVersion ?? 0) ? 'dispatch' : 'debrief',
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
    ...(run.flowVersion === 3 && plot ? {
      plotEvidence,
      ...(betrayal ? { betrayal } : {}),
    } : {}),
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
      scene: `${CAMPAIGN_ANCHORS[29]} ${campaignVillain(run.seed, run.mastermind).name} now ${campaignVillain(run.seed, run.mastermind).method}. This is real, not a simulation.`,
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
    const reconciled = run.betrayal?.status === 'reconciled'
    const support = (run.cityStanding ?? 0) + (run.academyStanding ?? 0) + evidenceCount * 2 + (reconciled ? 2 : 0)
    const earned = support >= 2 && run.danger <= 48 + evidenceCount * 2
    const rescue = choice === 'protect' || choice === 'evacuate'
    const shared = choice === 'share'
    const ending = shared
      ? earned
        ? 'A CITY WITH A THOUSAND KEYS'
        : 'THE BROKEN GRID'
      : rescue
        ? earned
          ? 'THE LAST DANCE LEAVES BY BOAT'
          : 'THE MUSIC AFTER GLASS'
        : earned
          ? 'MASTER OF THE SHIELD'
          : 'THE PRICE OF A SINGLE SWITCH'
    const keys =
      run.guestPlan === 'duplicate'
        ? 'Independent rescuers possess duplicate emergency keys.'
        : run.guestPlan === 'open'
          ? 'The ballroom serves as public shelter, crowding the exits.'
          : 'Private security controls the ballroom doors.'
    const conspiracyOutcome = earned ? villain.fall : villain.coup
    const betrayalOutcome = run.betrayal
      ? `${STUDENTS.find(s => s.id === run.betrayal!.person)!.name} betrayed the rescue network on day 20. ${reconciled ? 'They returned under public oversight and helped repair the damage.' : 'The damaged relationship never received an easy pardon.'}`
      : 'An unidentified classmate remains connected to the compromised emergency grid.'
    const cost = shared
      ? 'Independent district shields save neighborhoods but lose precise coordination; some homes suffer damage.'
      : rescue
        ? 'Guests escape, but the ballroom and nearby streets are damaged as people carry the injured through debris.'
        : 'The centralized shield remains operable, but people who trusted the operator cannot easily reclaim their safety.'
    return {
      ...run,
      phase: 'ending',
      ending,
      scene: `Midway through the fourth dance the twelve-sided chandelier turns over, the glass roof fractures, and a beam joins the ballroom to the city shield towers. ${villain.name} ${villain.method}. You choose to ${choice === 'protect' ? 'save guests before hardware' : choice === 'evacuate' ? 'destroy the transmitter and evacuate' : shared ? 'distribute shield keys to the neighborhoods' : 'seize the control console'}. ${keys} ${earned ? 'Your accumulated allies answer the call.' : 'Your scattered allies cannot coordinate in time.'} ${cost} ${conspiracyOutcome ?? ''} ${betrayalOutcome} ${evidenceCount} of three accomplice operations were exposed. At dawn the survivors decide what graduation and rebuilding mean.`,
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
    !POWERS.some((p) => p.id === data.power) ||
    (data.signature !== undefined &&
      (!signatureById(data.signature) ||
        fieldFor(data.signature) !== data.power)) ||
    (data.vow !== undefined && !POWER_VOWS.some((v) => v.id === data.vow)) ||
    typeof data.seed !== 'number' ||
    typeof data.day !== 'number' ||
    !Number.isInteger(data.day) ||
    data.day < 1 ||
    data.day > (data.flowVersion === 3 ? 30 : 7) ||
    (data.flowVersion !== undefined && ![2, 3].includes(data.flowVersion)) ||
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
        (data.mastermind !== undefined &&
          !CAMPAIGN_VILLAINS.some(v => v.id === data.mastermind)) ||
        (data.betrayer !== undefined &&
          data.betrayer !== campaignBetrayer(data.seed ?? 0)) ||
        (data.plotEvidence !== undefined &&
          (!Array.isArray(data.plotEvidence) ||
            data.plotEvidence.some(id => !campaignVillain(data.seed ?? 0, data.mastermind).accomplices?.some(a => a.id === id)) ||
            new Set(data.plotEvidence).size !== data.plotEvidence.length)) ||
        (data.betrayal !== undefined &&
          (!['active', 'reconciled', 'isolated'].includes(data.betrayal.status) ||
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
