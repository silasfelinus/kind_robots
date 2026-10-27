import { warpArt } from '../gameOfCaptains/artManifest'
import { warpArtPrompt } from '../gameOfCaptains/artPrompts'
import {
  WARP_ENDINGS,
  antagonistArtKey,
  captainArtKey,
  crewArtKey,
  endingArtKey,
  missionArtKey,
  slugify,
} from '../gameOfCaptains/artSlots'
import { CREW_PROFILES, SYNERGIES } from '../gameOfCaptains/crewAssignments'
import { ANTAGONISTS, CAPTAINS, CREW, MISSIONS } from '../gameOfCaptains/rules'
import {
  blankNode,
  storyOrder,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for This Means Warp (conductor playbook-kit t-013):
// the runtime voyage as beats. Captains open a run, crew are its followers,
// three missions form the chapter spine with the bridge's three policies,
// special pair routes are threads, antagonists wait at the finale and four
// endings close it. Art slots are the keys the play page shows
// (gameOfCaptains/artSlots.ts); text is authored in code, so beats are
// read-only here.

const RESULT_TEXT = {
  flawless:
    'The returning team solved the immediate crisis and brought back information the bridge had missed.',
  success:
    'The crew achieved the mission objective, but the people affected still get to decide what it means.',
  costly:
    'The team returns with a material debt and a person who may refuse further help.',
  disaster:
    'The planned route collapsed; the officers return through a costly emergency extraction.',
} as const

const POLICIES = [
  {
    id: 'aid',
    label: 'Aid: offer help with informed consent',
    text: 'You offer help, ask for informed consent and accept the operational costs. A civilian remembers your name.',
    effect: 'supplies −1 · intervention +1 · reputation +2 · trust +1',
  },
  {
    id: 'observe',
    label: 'Observe: keep your distance and record',
    text: 'You remain at a distance and record what happened. Neutrality protects the treaty, but the survivors saw your ship.',
    effect: 'intervention −1 · reputation −1 · trust −1',
  },
  {
    id: 'intervene',
    label: 'Intervene without diplomatic permission',
    text: 'You take direct action without waiting for diplomatic permission. Lives change quickly; sovereignty will remember.',
    effect: 'supplies −2 · intervention +2 · reputation −2',
  },
] as const

const ENDING_TEXT: Record<(typeof WARP_ENDINGS)[number], string> = {
  'CAPTAIN OF THE OPEN HORIZON':
    'Your crew rejects the antagonist’s claim and protects the worlds without owning them. Vox saves your place at the bar.',
  'THE LAST SHIP HOME':
    'You bring the wounded home. Some treaties call you a disgrace; the rescued families call you by name.',
  'THE GALACTIC BARGAIN':
    'You negotiate with the enemy for passage. The galaxy survives at the cost of a debt you will spend a lifetime questioning.',
  'THE COST OF COMMAND':
    'Your gambit fails, but your crew refuses to abandon you. The next captain inherits both the ship and the warning.',
}

const titleCase = (text: string) =>
  text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

function withArt(node: PlaybookNode, key: string): PlaybookNode {
  node.art = key
  node.artUrl = warpArt(key)
  node.needsArt = !node.artUrl
  node.artPrompt = warpArtPrompt(key)
  node.provenance = `Art slot public/game-of-captains/${key}.webp (conductor projects/game-of-captains/art).`
  return node
}

export function buildThisMeansWarpPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => (nodes[node.key] = node)

  for (const captain of CAPTAINS) {
    const node = blankNode(`captain:${captain.id}`, 'opening', captain.name)
    node.place = captain.epithet
    node.body = [
      captain.doctrine,
      `Advantage: ${captain.ability}. Price: ${captain.cost}`,
    ]
    node.choices = [
      {
        id: 'take-the-chair',
        label: `Take the chair as ${captain.name}`,
        tags: [captain.ability],
        leadsTo: `mission:${MISSIONS[0].id}`,
      },
    ]
    add(withArt(node, captainArtKey(captain.id)))
  }

  for (const member of CREW) {
    const profile = CREW_PROFILES.find((p) => p.id === member.id)
    const node = blankNode(`crew:${member.id}`, 'follower', member.name)
    node.place = `${member.role} · ${member.pronouns}`
    node.body = [member.story, `“${member.quote}”`]
    if (profile?.goal) node.body.push(`Personal quest: ${profile.goal}`)
    node.companions = [member.id]
    add(withArt(node, crewArtKey(member.portraitKey)))
  }

  MISSIONS.forEach((mission, index) => {
    const node = blankNode(`mission:${mission.id}`, 'spine', mission.title)
    node.place = mission.system
    node.chapter = index + 1
    node.body = [mission.briefing, mission.dilemma, mission.note]
    node.companions = SYNERGIES.filter((s) =>
      s.missions.includes(mission.id),
    ).flatMap((s) => [...s.pair])
    node.companions = [...new Set(node.companions)]
    node.lenses = [mission.kind]
    node.variations = Object.entries(RESULT_TEXT).map(([key, text]) => ({
      axis: 'result',
      key,
      label: `${titleCase(key)} return`,
      text,
    }))
    const next = MISSIONS[index + 1]
    node.choices = POLICIES.map((policy) => ({
      id: policy.id,
      label: policy.label,
      tags: [],
      effect: policy.effect,
      success: { text: `${policy.text} ${mission.note}` },
      leadsTo: next ? `mission:${next.id}` : 'finale',
    }))
    node.placements.push({
      route: 'voyage',
      routeName: 'The voyage',
      day: index + 1,
      dayName: `Chapter ${index + 1}`,
      step: index,
    })
    add(withArt(node, missionArtKey(mission.id)))
  })

  for (const synergy of SYNERGIES) {
    const [a, b] = synergy.pair
    const name = (id: string) => CREW.find((c) => c.id === id)?.name ?? id
    const node = blankNode(
      `route:${a}-${b}`,
      'thread',
      `${name(a)} and ${name(b)}`,
    )
    node.place = `Special route on ${synergy.missions
      .map((id) => MISSIONS.find((m) => m.id === id)?.title ?? id)
      .join(', ')}`
    node.body = [synergy.route, `Cost: ${synergy.cost}`]
    node.companions = [a, b]
    node.choices = [
      {
        id: 'send-both',
        label: `Send ${name(a)} and ${name(b)} together`,
        tags: [`+${synergy.bonus} to the mission odds`],
      },
    ]
    node.provenance =
      'Pair routes are shown as text in the mission preview; they have no picture slot.'
    add(node)
  }

  for (const antagonist of ANTAGONISTS) {
    const node = blankNode(
      `antagonist:${antagonist.id}`,
      'boss',
      antagonist.name,
    )
    node.place = antagonist.title
    node.body = [antagonist.motive, antagonist.interference]
    add(withArt(node, antagonistArtKey(antagonist.id)))
  }

  const finale = blankNode('finale', 'crossroads', 'The jump gate')
  finale.place = 'Finale'
  finale.body = [
    'Your antagonist is waiting at the jump gate. The crew is asking what kind of captain you became.',
  ]
  finale.choices = [
    {
      id: 'protect',
      label: 'Protect the worlds',
      tags: ['Strong with reputation ≥ 2 and trust ≥ 2'],
      leadsTo: `ending:${slugify(WARP_ENDINGS[0])}`,
    },
    {
      id: 'compromise',
      label: 'Bargain for passage',
      tags: ['Strong with supplies ≥ 3'],
      leadsTo: `ending:${slugify(WARP_ENDINGS[2])}`,
    },
  ]
  finale.provenance =
    'The stage shows the voyage’s antagonist here (antagonists/<id>).'
  add(finale)

  for (const ending of WARP_ENDINGS) {
    const node = blankNode(
      `ending:${slugify(ending)}`,
      'ending',
      titleCase(ending),
    )
    node.place = 'Final captain’s log'
    node.body = [ENDING_TEXT[ending]]
    add(withArt(node, endingArtKey(ending)))
  }

  const routes: PlaybookRoute[] = [
    {
      id: 'voyage',
      name: 'The voyage',
      kind: 'Three missions, then the jump gate',
      steps: [...MISSIONS.map((m) => `mission:${m.id}`), 'finale'],
      headings: Object.fromEntries(
        MISSIONS.map((m, i) => [i, `Chapter ${i + 1}: ${m.system}`]),
      ),
    },
  ]
  const keysOf = (kind: PlaybookNode['kind']) =>
    Object.values(nodes)
      .filter((n) => n.kind === kind)
      .map((n) => n.key)

  return {
    game: 'game-of-captains',
    title: 'Space Couch',
    blurb: 'Six captains, twelve crew, three missions and four endings.',
    routes,
    nodes,
    order: storyOrder(routes, [
      ...keysOf('opening'),
      ...keysOf('follower'),
      ...keysOf('thread'),
      ...keysOf('boss'),
      ...keysOf('ending'),
    ]),
    sections: [
      {
        title: 'Captains',
        blurb: 'Who takes the chair.',
        keys: keysOf('opening'),
      },
      {
        title: 'Crew',
        blurb: 'Twelve officers; pick three.',
        keys: keysOf('follower'),
      },
      {
        title: 'Pair routes',
        blurb: 'Two officers together open a route.',
        keys: keysOf('thread'),
      },
      {
        title: 'Antagonists',
        blurb: 'Who waits at the jump gate.',
        keys: keysOf('boss'),
      },
      {
        title: 'Endings',
        blurb: 'Final captain’s logs.',
        keys: keysOf('ending'),
      },
    ],
    people: CREW.map((c) => ({ id: c.id, label: c.name })),
    peopleLabel: 'Crew',
    variations: [
      { id: 'rescue', label: 'Rescue' },
      { id: 'science', label: 'Science' },
      { id: 'diplomacy', label: 'Diplomacy' },
    ],
    variationLabel: 'Mission kind',
    dayLabel: 'Chapter',
    kindLabels: {
      opening: 'Captain',
      follower: 'Crew',
      spine: 'Mission',
      thread: 'Pair route',
      boss: 'Antagonist',
      crossroads: 'Finale',
      ending: 'Ending',
    },
    editable: false,
    artProject: 'game-of-captains',
    artLanes: ['krea2'],
    artPromptsComplete: true,
  }
}
