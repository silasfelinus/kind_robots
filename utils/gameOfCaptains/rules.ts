export type CaptainId = 'fluke' | 'vale' | 'solace' | 'rex' | 'quill' | 'ro'
export type CrewId = 'pell' | 'vela' | 'tess' | 'rue' | 'mox' | 'jex'
export type VoyagePhase =
  'briefing' | 'decision' | 'debrief' | 'finale' | 'ending'
export type Result = 'flawless' | 'success' | 'costly' | 'disaster'
export type PolicyId = 'aid' | 'observe' | 'intervene'

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
}[] = [
  {
    id: 'pell',
    name: 'Bosun Pell',
    role: 'Engineering',
    talent: 'tactics',
    quote: 'I repair the ship. I do not repair the captain.',
    monogram: 'BP',
  },
  {
    id: 'vela',
    name: 'Dr. Vela Sorn',
    role: 'Xenomedicine',
    talent: 'rescue',
    quote: 'The word primitive is not a diagnosis.',
    monogram: 'VS',
  },
  {
    id: 'tess',
    name: 'Tess Helio',
    role: 'Navigation',
    talent: 'luck',
    quote: 'That star is moving. It should not be moving.',
    monogram: 'TH',
  },
  {
    id: 'rue',
    name: 'Rue Aster',
    role: 'Diplomacy',
    talent: 'diplomacy',
    quote: 'Ask who wrote the treaty and who was missing.',
    monogram: 'RA',
  },
  {
    id: 'mox',
    name: 'Mox-9',
    role: 'Science',
    talent: 'science',
    quote: 'I have opinions. Unfortunately, they are accurate.',
    monogram: 'M9',
  },
  {
    id: 'jex',
    name: 'Jex Marr',
    role: 'Cultural liaison',
    talent: 'culture',
    quote: 'People tell me things when I stop correcting them.',
    monogram: 'JM',
  },
]
export const ANTAGONISTS = [
  {
    id: 'auditor',
    name: 'The Galactic Auditor',
    title: 'A cosmic debt collector',
    motive: 'Every gift is an obligation, and every rescue must be repaid.',
    interference:
      'A stern holo-notice appears: your kindness has been assigned an interest rate.',
  },
  {
    id: 'moth',
    name: 'The Queen of Borrowed Faces',
    title: 'A collector of identities',
    motive: 'She believes nobody should suffer behind a fixed identity.',
    interference:
      'Your entire bridge crew receives a transmission in their own voice, each confessing a different secret.',
  },
  {
    id: 'curdle',
    name: 'Dr. Curdle',
    title: 'The accidental tyrant',
    motive:
      'He is solving hunger in the most horrifyingly efficient way possible.',
    interference:
      'An enormous food dispenser appears in orbit. It has already elected itself mayor.',
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
  chapter: number
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
export function missionFor(run: VoyageRun) {
  return MISSIONS[run.chapter - 1]!
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
    crew.length < 3 ||
    crew.length > 4 ||
    new Set(crew).size !== crew.length ||
    crew.some((id) => !CREW.some((member) => member.id === id))
  )
    throw new Error('Choose a captain and three or four unique crew')
  const cleanSeed = Math.abs(Math.floor(seed)) || 1
  return {
    version: 1,
    seed: cleanSeed,
    phase: 'briefing',
    captain,
    crew: [...crew],
    away: [],
    chapter: 1,
    antagonist: hash(cleanSeed, 'antagonist') % ANTAGONISTS.length,
    supplies: 7,
    trust: 2,
    intervention: 0,
    reputation: 0,
    scene: 'The command chair is warm. Nobody will explain why.',
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
    selected.length >= run.crew.length
  )
    return run
  return { ...run, away: [...selected] }
}
export function launchMission(run: VoyageRun): VoyageRun {
  if (run.phase !== 'briefing') return run
  const mission = missionFor(run)
  const selected = run.away.map((id) =>
    CREW.find((member) => member.id === id)!,
  )
  const captain = CAPTAINS.find((entry) => entry.id === run.captain)!
  const specialist = selected.some((member) => member.talent === mission.kind)
  const roll = hash(run.seed, `${mission.id}:${run.away.join(',')}`) % 6
  const score =
    roll +
    run.away.length +
    (specialist ? 2 : 0) +
    (captain.ability === mission.kind ? 1 : 0)
  const result: Result =
    score >= 8
      ? 'flawless'
      : score >= 6
        ? 'success'
        : score >= 4
          ? 'costly'
          : 'disaster'
  const reports = {
    flawless:
      'Your team solved the immediate crisis and found the detail command had missed.',
    success:
      'The mission holds together. The people involved will remember who stood with them.',
    costly:
      'Someone gets home, but your plan leaves a debt in material or trust.',
    disaster:
      'The elegant plan breaks apart. Your crew improvises a narrow retreat and a second chance.',
  }
  const names = selected.length
    ? selected.map((member) => member.name).join(' · ')
    : 'Shipboard remote intervention'
  const report = { missionId: mission.id, result, names, text: reports[result] }
  return {
    ...run,
    phase: 'decision',
    report,
    supplies: Math.max(
      0,
      run.supplies - (result === 'disaster' ? 2 : result === 'costly' ? 1 : 0),
    ),
    trust:
      run.trust + (result === 'flawless' ? 1 : result === 'disaster' ? -1 : 0),
    scene: `${report.text} ${antagonistFor(run).interference}`,
    log: [
      ...run.log,
      `Chapter ${run.chapter}: ${mission.title} — ${result}, ${names}`,
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
    scene: `${responses[policy]} ${mission.note}`,
    log: [...run.log, `${mission.system}: ${policy} — ${responses[policy]}`],
  }
}
export function nextDestination(run: VoyageRun): VoyageRun {
  if (run.phase !== 'debrief') return run
  if (run.chapter >= MISSIONS.length)
    return {
      ...run,
      phase: 'finale',
      scene:
        'Your antagonist is waiting at the jump gate. The crew is asking what kind of captain you became.',
    }
  return {
    ...run,
    phase: 'briefing',
    chapter: run.chapter + 1,
    away: [],
    report: null,
    scene:
      'A new star flickers into the chart. Your crew has opinions about it.',
  }
}
export function finishVoyage(
  run: VoyageRun,
  strategy: 'protect' | 'compromise',
): VoyageRun {
  if (run.phase !== 'finale') return run
  const saved = strategy === 'protect'
  const strong = saved
    ? run.reputation >= 2 && run.trust >= 2
    : run.supplies >= 3
  const ending = saved
    ? strong
      ? 'CAPTAIN OF THE OPEN HORIZON'
      : 'THE LAST SHIP HOME'
    : strong
      ? 'THE GALACTIC BARGAIN'
      : 'THE COST OF COMMAND'
  const scene = saved
    ? strong
      ? 'Your crew rejects the antagonist’s claim and protects the worlds without owning them. Vox saves your place at the bar.'
      : 'You bring the wounded home. Some treaties call you a disgrace; the rescued families call you by name.'
    : strong
      ? 'You negotiate with the enemy for passage. The galaxy survives at the cost of a debt you will spend a lifetime questioning.'
      : 'Your gambit fails, but your crew refuses to abandon you. The next captain inherits both the ship and the warning.'
  return {
    ...run,
    phase: 'ending',
    scene,
    ending,
    log: [...run.log, `Final captain's log: ${ending}`],
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
    data.crew.some((c) => !CREW.some((m) => m.id === c)) ||
    !Array.isArray(data.away) ||
    typeof data.seed !== 'number' ||
    typeof data.chapter !== 'number' ||
    !Number.isInteger(data.chapter) ||
    data.chapter < 1 ||
    data.chapter > MISSIONS.length ||
    !['briefing', 'decision', 'debrief', 'finale', 'ending'].includes(
      data.phase ?? '',
    ) ||
    !Array.isArray(data.log) ||
    typeof data.supplies !== 'number' ||
    typeof data.trust !== 'number' ||
    typeof data.intervention !== 'number' ||
    typeof data.reputation !== 'number' ||
    typeof data.antagonist !== 'number' ||
    !Number.isInteger(data.antagonist) ||
    data.antagonist < 0 ||
    data.antagonist >= ANTAGONISTS.length
  )
    return null
  return data as VoyageRun
}
