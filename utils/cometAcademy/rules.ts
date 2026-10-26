import { identityFor, identityStoryFor } from './identityArcs'
import { GUEST_IDENTITIES } from './guestIdentities'
import {
  signatureById,
  POWER_VOWS,
  type SignaturePowerId,
  type PowerVowId,
} from './specialPowers'

export type PowerId =
  'kinetic' | 'technopathy' | 'empathy' | 'elemental' | 'spatial' | 'biotech'
export type AcademyPhase =
  'dispatch' | 'campus' | 'debrief' | 'finale' | 'ending'
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
      'A machine presents a future where your friend is the city\'s hero and a second future where the same person commands a prison. Both futures use the same childhood name.',
    options: [
      {
        id: 'agency',
        label: 'Tell your friend both futures and let them choose',
        text: 'Your classmate rejects the machine\'s certainty. They ask you to remember who they are, not just what they might become.',
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
  // Existing v1 saves keep the original three-card order mid-term.
  const index =
    run.encounterDeckVersion === 2
      ? (run.seed + run.day - 1) % ENCOUNTERS.length
      : (run.day - 1) % 3
  return ENCOUNTERS[index]!
}

export function startAcademy(
  power: PowerId,
  seed = Date.now(),
  signature?: SignaturePowerId,
  vow?: PowerVowId,
): AcademyRun {
  if (!POWERS.some((entry) => entry.id === power))
    throw new Error('Unknown power set')
  if (signature && signatureById(signature)?.legacy !== power)
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
    phase: 'dispatch',
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
        text: 'A training team from another class steps in. Your empty assignment slot is logged as a refusal.',
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
    const score =
      roll +
      assignment.students.length +
      (affinity ? 2 : 0) +
      (run.power === incident.need ? 1 : 0)
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
    const text = {
      honors:
        'An elegant rescue, with time left to notice the simulation has hidden a real distress code.',
      pass: 'Everyone is accounted for. The instructor marks your judgment as sound, but the evidence is stranger than the scenario.',
      partial:
        'Most people make it out. Your team refuses to pretend the ones left behind were only numbers.',
      failed:
        'The exercise collapses into a rescue of the rescuers. Nobody dies here, but the argument about your choices is real.',
    }[grade]
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
    phase: 'campus',
    influence,
    danger: Math.max(0, danger),
    reports,
    scene:
      'The training siren fades. Your campus pass vibrates: someone is asking to see you before nightfall.',
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
  return {
    ...run,
    phase: 'debrief',
    influence: run.influence + option.influence,
    danger: Math.max(0, run.danger + option.danger - (powerUsed ? 1 : 0)),
    scene,
    log: [
      ...run.log,
      `Day ${run.day}: ${encounterFor(run).title} — ${option.label}`,
    ],
  }
}

export function nextSchoolDay(run: AcademyRun): AcademyRun {
  if (run.phase !== 'debrief') return run
  if (run.day >= 7)
    return {
      ...run,
      phase: 'finale',
      scene:
        'At the end of week one, the faculty projects a prom-night disaster simulation. Real graduation is still weeks away.',
    }
  return {
    ...run,
    phase: 'dispatch',
    day: run.day + 1,
    assignments: [],
    reports: [],
    scene:
      'The next bell rings. Yesterday has already changed who will answer your calls.',
  }
}

export function finishAcademy(
  run: AcademyRun,
  choice: 'protect' | 'command',
): AcademyRun {
  if (run.phase !== 'finale') return run
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
    ? `The rehearsal yearbook imagines ${projectedStory.person}, once ${projectedStory.studentAlias}, becoming ${projectedStory.alias}: ${projectedStory.setup}. ${projectedStory.decision}. That transformation is ${protect ? 'not yet earned' : 'not yet inevitable'}.`
    : ''
  const signatureProjection =
    run.signature && run.vow
      ? `The first-week projection also shows a possible real graduation: ${signatureById(run.signature)?.finales[run.vow] ?? ''}`
      : ''
  return {
    ...run,
    phase: 'ending',
    ending,
    scene: [scene, identityProjection, signatureProjection]
      .filter(Boolean)
      .join(' '),
    log: [...run.log, `Finale: ${ending}`],
  }
}

export function restoreAcademy(raw: unknown): AcademyRun | null {
  if (!raw || typeof raw !== 'object') return null
  const data = raw as Partial<AcademyRun>
  if (
    data.version !== 1 ||
    !POWERS.some((p) => p.id === data.power) ||
    (data.signature !== undefined &&
      signatureById(data.signature)?.legacy !== data.power) ||
    (data.vow !== undefined && !POWER_VOWS.some((v) => v.id === data.vow)) ||
    typeof data.seed !== 'number' ||
    typeof data.day !== 'number' ||
    !Number.isInteger(data.day) ||
    data.day < 1 ||
    data.day > 7 ||
    !['dispatch', 'campus', 'debrief', 'finale', 'ending'].includes(
      data.phase ?? '',
    ) ||
    !Array.isArray(data.log) ||
    !Array.isArray(data.assignments) ||
    !Array.isArray(data.reports) ||
    typeof data.influence !== 'number' ||
    typeof data.danger !== 'number'
  )
    return null
  return data as AcademyRun
}
