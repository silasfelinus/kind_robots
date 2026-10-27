/**
 * Emperor of Dust-inspired independent crew dispatch:
 * - 3 people selected from 12 authored candidates
 * - preview math is EXACTLY the math used at mission return
 * - distinct optional synergies/special routes
 * - offers expire; launched teams return after 1–3 ship days
 */
import type { CaptainId, CrewId, VoyageRun } from './rules'

export const SKILLS = [
  'rescue',
  'science',
  'diplomacy',
  'tactics',
  'luck',
  'culture',
] as const
export type Skill = (typeof SKILLS)[number]
export type Stats = Record<Skill, number>
const S = (
  rescue: number,
  science: number,
  diplomacy: number,
  tactics: number,
  luck: number,
  culture: number,
): Stats => ({ rescue, science, diplomacy, tactics, luck, culture })
export const CAPTAIN_STATS: Record<CaptainId, Stats> = {
  fluke: S(1, 1, 2, 2, 5, 3),
  vale: S(2, 2, 5, 2, 1, 3),
  solace: S(5, 2, 2, 3, 2, 1),
  rex: S(2, 1, 1, 5, 2, 2),
  quill: S(1, 5, 2, 1, 2, 4),
  ro: S(2, 2, 4, 1, 3, 5),
}
export type CrewProfile = {
  id: CrewId
  name: string
  role: string
  culture: string
  pronouns: string
  talent: Skill
  quote: string
  monogram: string
  story: string
  goal: string
  stats: Stats
  portraitKey: string
}
export const CREW_PROFILES: CrewProfile[] = [
  {
    id: 'pell',
    name: 'Bosun Pell',
    role: 'Engineer',
    culture: 'Ashdock worker',
    pronouns: 'he/him',
    talent: 'tactics',
    quote: 'I repair the ship. I do not repair the captain.',
    monogram: 'BP',
    story:
      'Union mechanic who carries the maintenance notes from a hidden shipyard disaster.',
    goal: 'Recover the erased names of the workers lost at Ashdock.',
    stats: S(2, 3, 1, 5, 1, 1),
    portraitKey: 'crew-pell',
  },
  {
    id: 'vela',
    name: 'Dr. Vela Sorn',
    role: 'Doctor',
    culture: 'Haleth reef people',
    pronouns: 'she/her',
    talent: 'rescue',
    quote: 'Primitive is not a diagnosis.',
    monogram: 'VS',
    story:
      'Reef-born physician who refused to categorize an asylum patient as cargo.',
    goal: 'Find the clinic selling her emergency research to fleets.',
    stats: S(5, 4, 2, 1, 1, 2),
    portraitKey: 'crew-vela',
  },
  {
    id: 'tess',
    name: 'Tess Helio',
    role: 'Navigator',
    culture: 'Orbital-diaspora human',
    pronouns: 'she/they',
    talent: 'luck',
    quote: 'That star is moving. It should not be moving.',
    monogram: 'TH',
    story:
      'Navigator whose grandmother left a map of secret drifting safe harbors.',
    goal: 'Return a borrowed map without exposing its sanctuary.',
    stats: S(1, 3, 1, 2, 5, 3),
    portraitKey: 'crew-tess',
  },
  {
    id: 'rue',
    name: 'Rue Aster',
    role: 'Diplomat',
    culture: 'Concord Freehold',
    pronouns: 'they/them',
    talent: 'diplomacy',
    quote: 'Who wrote the treaty, and who was missing?',
    monogram: 'RA',
    story:
      'Former treaty translator who resigned over a clause denying refugee citizenship.',
    goal: 'Bring the missing signatories to a hearing.',
    stats: S(3, 2, 5, 1, 2, 4),
    portraitKey: 'crew-rue',
  },
  {
    id: 'mox',
    name: 'Mox-9',
    role: 'Scientist',
    culture: 'Independent synthetic',
    pronouns: 'it/they',
    talent: 'science',
    quote: 'I have opinions. Unfortunately, they are accurate.',
    monogram: 'M9',
    story:
      'Self-repairing laboratory intelligence whose first memory is a demand to erase itself.',
    goal: 'Win the right to determine custody of its own source code.',
    stats: S(2, 5, 2, 3, 2, 1),
    portraitKey: 'crew-mox',
  },
  {
    id: 'jex',
    name: 'Jex Marr',
    role: 'Cultural liaison',
    culture: 'Kestrelian Twin Isles',
    pronouns: 'he/they',
    talent: 'culture',
    quote: 'People tell me things when I stop correcting them.',
    monogram: 'JM',
    story:
      'Musician who knows six ceasefire anthems and the patrons behind each.',
    goal: 'Reunite a neutral choir with both warring moons.',
    stats: S(2, 1, 4, 2, 3, 5),
    portraitKey: 'crew-jex',
  },
  {
    id: 'sora',
    name: 'Sora Quen',
    role: 'Reactor engineer',
    culture: 'Tessellated Sesh',
    pronouns: 'she/her',
    talent: 'science',
    quote: 'Ask the machine what broke before naming it.',
    monogram: 'SQ',
    story:
      'Six-jointed engineer whose community votes on recognition of sentient machines.',
    goal: 'Find the inventor who abandoned an aware power station.',
    stats: S(2, 5, 2, 3, 2, 3),
    portraitKey: 'crew-sora',
  },
  {
    id: 'kivo',
    name: 'Kivo Drift',
    role: 'Scout',
    culture: 'Windglass moons',
    pronouns: 'they/them',
    talent: 'luck',
    quote: 'Quiet tunnels have something to say.',
    monogram: 'KD',
    story:
      'Feather-crested navigator sensing pressure shifts through hollow wrist bones.',
    goal: 'Locate the vanished courier who carried their sibling away.',
    stats: S(3, 2, 2, 3, 5, 3),
    portraitKey: 'crew-kivo',
  },
  {
    id: 'taal',
    name: 'Taal Venn',
    role: 'Mediator',
    culture: 'Nacre polar shelf',
    pronouns: 'he/him',
    talent: 'diplomacy',
    quote: 'A silence can be three different answers.',
    monogram: 'TV',
    story:
      'White-plated amphibious envoy whose home community converses through temperature.',
    goal: 'Recover the falsified assembly votes that broke a long peace.',
    stats: S(2, 3, 5, 2, 1, 4),
    portraitKey: 'crew-taal',
  },
  {
    id: 'brin',
    name: 'Brin Thistle',
    role: 'Ecologist',
    culture: 'Rootborne Archipelago',
    pronouns: 'she/they',
    talent: 'rescue',
    quote: 'Your air filter is a garden, and it is thirsty.',
    monogram: 'BT',
    story:
      'Mycelial botanist whose living oxygen filters work only with patient maintenance.',
    goal: 'Help two isolated towns share their irrigation systems.',
    stats: S(5, 4, 2, 1, 2, 3),
    portraitKey: 'crew-brin',
  },
  {
    id: 'omi',
    name: 'Omi Six-Bells',
    role: 'Signals officer',
    culture: 'Harmonic Belt',
    pronouns: 'any',
    talent: 'culture',
    quote: 'I can translate the silence between alarms.',
    monogram: 'O6',
    story:
      'Small faceted stone being using chest resonators to speak in layered notes.',
    goal: 'Restore the missing final note of an ignored disaster warning.',
    stats: S(2, 4, 3, 2, 2, 5),
    portraitKey: 'crew-omi',
  },
  {
    id: 'fen',
    name: 'Fen Rho',
    role: 'Security',
    culture: 'Outer Accord diaspora',
    pronouns: 'he/they',
    talent: 'tactics',
    quote: 'A safe corridor begins with civilian consent.',
    monogram: 'FR',
    story:
      'Former border guard who quit when shelter seekers became trespassers by decree.',
    goal: 'Return travel papers confiscated from displaced families.',
    stats: S(4, 2, 2, 5, 2, 2),
    portraitKey: 'crew-fen',
  },
]
export type Synergy = {
  pair: readonly [CrewId, CrewId]
  missions: readonly string[]
  bonus: number
  route: string
  cost: string
}
export const SYNERGIES: Synergy[] = [
  {
    pair: ['pell', 'mox'],
    missions: ['archive', 'refugees'],
    bonus: 2,
    route:
      'Reconstruct a damaged archive core without copying private records.',
    cost: 'The repaired archive can still withhold its own consent.',
  },
  {
    pair: ['vela', 'rue'],
    missions: ['refugees', 'bar'],
    bonus: 3,
    route:
      'Certify emergency asylum using medical testimony without publishing patient identities.',
    cost: 'An anonymous statement takes longer to verify.',
  },
  {
    pair: ['tess', 'jex'],
    missions: ['bar', 'refugees'],
    bonus: 2,
    route: 'Plot a hidden approach while securing a local civilian welcome.',
    cost: 'Another political actor learns where the refuge is.',
  },
  {
    pair: ['sora', 'kivo'],
    missions: ['archive'],
    bonus: 3,
    route:
      'Sense a heat conduit and reroute the library shutter before the flare.',
    cost: 'A reading room can be saved but not the whole city-sized archive.',
  },
  {
    pair: ['taal', 'omi'],
    missions: ['archive', 'bar'],
    bonus: 2,
    route:
      'Use resonant speech to recognize when the station or library objects.',
    cost: 'A sentient building’s consent does not override its guests.',
  },
  {
    pair: ['brin', 'fen'],
    missions: ['refugees'],
    bonus: 3,
    route: 'Grow a breathing reservoir and open a nonmilitary exit route.',
    cost: 'Families must consent to live inside a biological air system.',
  },
  {
    pair: ['jex', 'taal'],
    missions: ['bar'],
    bonus: 2,
    route:
      'Expose a linguistic trap in the creditor’s neutral-ground contract.',
    cost: 'The creditor will retaliate with political pressure.',
  },
  {
    pair: ['vela', 'brin'],
    missions: ['refugees'],
    bonus: 3,
    route: 'Build a living oxygen bank from failing medical equipment.',
    cost: 'The cure introduces long-term biosecurity work.',
  },
]
export type MissionRule = {
  id: string
  requirements: Partial<Record<Skill, number>>
  durationDays: 1 | 2 | 3
  boardDays: number
  deadline: string
  remoteRoute: string
}
export const MISSION_RULES: MissionRule[] = [
  {
    id: 'refugees',
    requirements: { rescue: 10, diplomacy: 7 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The convoy jumps away after two ship days.',
    remoteRoute: 'Shipboard advice cannot board the failing lifeboat.',
  },
  {
    id: 'archive',
    requirements: { science: 11, culture: 7 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The flare approaches the archive within two ship days.',
    remoteRoute:
      'Remote data links cannot physically evacuate the living readers.',
  },
  {
    id: 'bar',
    requirements: { diplomacy: 10, tactics: 7 },
    durationDays: 1,
    boardDays: 3,
    deadline: 'The witness leaves Serendipity within three ship days.',
    remoteRoute: 'Remote negotiation cannot verify the witness’s safety.',
  },

  {
    id: 'ashdock',
    requirements: { tactics: 10, diplomacy: 8 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The contractor will destroy the casualty registers within two days.',
    remoteRoute: 'Shipboard cameras cannot ask the grieving families to testify.',
  },
  {
    id: 'windglass',
    requirements: { luck: 10, science: 8 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The moving beacon vanishes after three days.',
    remoteRoute: 'A distant scan cannot tell a rescue from a pursuit beacon.',
  },
  {
    id: 'nacre',
    requirements: { diplomacy: 11, culture: 8 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The assembly holds its binding quorum in three days.',
    remoteRoute: 'An anonymous appeal cannot vote in place of excluded residents.',
  },
  {
    id: 'haleth',
    requirements: { rescue: 11, science: 8 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The medical patent renews in two days.',
    remoteRoute: 'Medical advice cannot remove an unsafe implanted registry.',
  },
  {
    id: 'gameworld',
    requirements: { tactics: 11, culture: 8 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The involuntary finalists are chosen in two days.',
    remoteRoute: 'A remote audience may watch, but it cannot open the workers’ exit.',
  },
  {
    id: 'rootborne',
    requirements: { rescue: 9, science: 10 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The orchard’s last breathable seed ripens in three days.',
    remoteRoute: 'A sensor cannot negotiate shared air with a living orchard.',
  },
]
export type MissionPreview = {
  chance: number
  durationDays: number
  expiresInDays: number
  requirements: { skill: Skill; total: number; required: number }[]
  synergies: Synergy[]
  specialRoutes: string[]
  blockers: string[]
  eligible: boolean
  commentary: string
}
export function ruleFor(id: string): MissionRule {
  const rule = MISSION_RULES.find((x) => x.id === id)
  if (!rule) throw new Error('Unknown mission')
  return rule
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export function previewCrewMission(
  run: VoyageRun,
  missionId: string,
  party: CrewId[],
): MissionPreview {
  const rule = ruleFor(missionId)
  const day = run.day ?? run.chapter
  const lastDay = (run.postedDay ?? day) + rule.boardDays - 1
  const expiresInDays = Math.max(0, lastDay - day + 1)
  const blockers: string[] = []
  if (
    party.length > 3 ||
    new Set(party).size !== party.length ||
    party.some((id) => !run.crew.includes(id))
  )
    blockers.push('Select at most three distinct officers from this ship.')
  if (party.some((id) => (run.injuredUntil?.[id] ?? 0) > day))
    blockers.push('An officer is still recovering.')
  if (party.some((id) => run.active?.party.includes(id)))
    blockers.push('An officer is already on a mission.')
  if (expiresInDays <= 0) blockers.push('The offer has expired.')
  const members = party
    .map((id) => CREW_PROFILES.find((x) => x.id === id))
    .filter((x): x is CrewProfile => !!x)
  const synergies = SYNERGIES.filter(
    (x) =>
      x.missions.includes(missionId) &&
      x.pair.every((id) => party.includes(id)),
  )
  const captain = CAPTAIN_STATS[run.captain]
  const requirements = (
    Object.entries(rule.requirements) as [Skill, number][]
  ).map(([skill, required]) => ({
    skill,
    required,
    total:
      captain[skill] +
      members.reduce((n, c) => n + c.stats[skill], 0) +
      synergies.reduce((n, x) => n + x.bonus, 0),
  }))
  const ratio =
    requirements.reduce((n, r) => n + r.total / r.required, 0) /
    requirements.length
  const chance = clamp(
    Math.round(
      (party.length ? 48 : 20) + (ratio - 1) * 32 + (synergies.length ? 4 : 0),
    ),
    5,
    94,
  )
  return {
    chance,
    durationDays: rule.durationDays,
    expiresInDays,
    requirements,
    synergies,
    specialRoutes: synergies.map((x) => x.route),
    blockers,
    eligible: blockers.length === 0,
    commentary: synergies.map((x) => x.route).join(' ') || rule.remoteRoute,
  }
}
export function missionRoll(
  seed: number,
  missionId: string,
  day: number,
  party: CrewId[],
): number {
  const key = `${seed}:${missionId}:${day}:${[...party].sort().join(',')}`
  let h = 2166136261
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0
  return h % 100
}
