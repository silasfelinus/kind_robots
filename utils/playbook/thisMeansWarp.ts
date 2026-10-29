import { warpArt } from '../gameOfCaptains/artManifest'
import { warpArtPrompt } from '../gameOfCaptains/artPrompts'
import {
  BASE_ENDINGS,
  WARP_ENDINGS,
  antagonistArtKey,
  captainArtKey,
  crewArtKey,
  endingArtKey,
  missionArtKey,
  nemesisEndingArtKey,
  slugify,
} from '../gameOfCaptains/artSlots'
import {
  NEMESIS_ALLY_FLAGS,
  NEMESIS_ENDINGS,
  NEMESIS_ENDING_VARIANTS,
  nemesisEndingId,
} from '../gameOfCaptains/nemesisEndings'
import { GALACTIC_ENDINGS } from '../gameOfCaptains/galacticEndings'
import { CREW_PROFILES, SYNERGIES } from '../gameOfCaptains/crewAssignments'
import {
  MISSION_CALLBACKS,
  VOYAGE_BOARDS,
  VOYAGE_CONSEQUENCES,
  VOYAGE_ORDERS,
  aboardLines,
  actName,
  type NemesisId,
} from '../gameOfCaptains/voyageMap'
import { ANTAGONISTS, CAPTAINS, CREW, MISSIONS } from '../gameOfCaptains/rules'
import {
  ALL_PARTIES,
  TRIO_ADVENTURES,
  TRIO_FIRST_CHAPTER,
  trioArtKey,
  trioKey,
} from '../gameOfCaptains/trioAdventures'
import {
  blankNode,
  storyOrder,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for Space Couch (conductor playbook-kit t-013):
// the runtime voyage as beats. Captains open a run, crew are its followers,
// the voyage chart (gameOfCaptains/voyageMap.ts) is the chapter spine, one
// board of calls per chapter across Acts I to III, each call with its
// three orders, earlier-choice callbacks and officer asides. Pair routes are
// threads, antagonists wait at the finale and the galactic ending families
// (base four plus gameOfCaptains/galacticEndings.ts) close it. Art
// slots are the keys the play page shows (gameOfCaptains/artSlots.ts) and
// their prompts live in gameOfCaptains/artPrompts.ts; text is authored in
// code, so beats are read-only here.

const RESULT_TEXT = {
  flawless:
    'The away team solved the problem and came back with information nobody on the couch had asked for, all of it useful.',
  success:
    'The away team did what it went to do. The people affected are still deciding what that means.',
  costly:
    'The away team came back with the job done, a bill, and someone who would rather not be helped again.',
  disaster:
    'The plan did not survive contact. The away team came back by the emergency route, which is longer and has stairs.',
} as const

const POLICIES = [
  {
    id: 'aid',
    label: 'Aid: offer help with informed consent',
    text: 'You offer help and ask first. It costs supplies, and the people you helped get to decide what happens next.',
    effect: 'supplies −1 · intervention +1 · reputation +2 · trust +1',
  },
  {
    id: 'observe',
    label: 'Observe: keep your distance and record',
    text: 'You keep your distance and keep a record. The treaty is intact, and so is the record of what you watched.',
    effect: 'intervention −1 · reputation −1 · trust −1',
  },
  {
    id: 'intervene',
    label: 'Intervene without diplomatic permission',
    text: 'You act without permission. It works quickly, and the paperwork will take years.',
    effect: 'supplies −2 · intervention +2 · reputation −2',
  },
] as const

const ENDING_TEXT: Record<(typeof BASE_ENDINGS)[number], string> = {
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

  const boardOf = (id: string) =>
    VOYAGE_BOARDS.findIndex((board) => board.includes(id))
  const chapterName = (chapter: number) =>
    `${actName(chapter)}, chapter ${chapter}`
  const crewIds = CREW.map((member) => member.id)
  VOYAGE_BOARDS.flat().forEach((id, step) => {
    const mission = MISSIONS.find((m) => m.id === id)!
    const chapter = boardOf(id) + 1
    const node = blankNode(`mission:${mission.id}`, 'spine', mission.title)
    node.place = mission.system
    node.chapter = chapter
    node.body = [mission.briefing, mission.dilemma, mission.note]
    node.companions = SYNERGIES.filter((s) =>
      s.missions.includes(mission.id),
    ).flatMap((s) => [...s.pair])
    node.companions = [...new Set(node.companions)]
    node.lenses = [mission.kind]
    node.variations = [
      ...Object.entries(RESULT_TEXT).map(([key, text]) => ({
        axis: 'result',
        key,
        label: `${titleCase(key)} return`,
        text,
      })),
      ...(MISSION_CALLBACKS[mission.id] ?? []).map((callback) => ({
        axis: 'earlier choice',
        key: callback.flag,
        label: `After ${callback.flag} (${callback.odds > 0 ? '+' : ''}${callback.odds}%)`,
        text: callback.text,
      })),
      ...crewIds.flatMap((crewId) =>
        aboardLines(mission.id, [crewId]).map((text) => ({
          axis: 'aboard',
          key: crewId,
          label: `${CREW.find((c) => c.id === crewId)!.name} aboard`,
          text,
        })),
      ),
    ]
    const next = VOYAGE_BOARDS[chapter]?.[0]
    node.choices = POLICIES.map((policy) => ({
      id: policy.id,
      label: VOYAGE_ORDERS[mission.id]?.[policy.id] ?? policy.label,
      tags: [],
      effect: policy.effect,
      success: {
        text: `${policy.text} ${mission.note} ${VOYAGE_CONSEQUENCES[mission.id]?.[policy.id]?.text ?? ''}`.trim(),
      },
      leadsTo: next ? `mission:${next}` : 'finale',
    }))
    node.placements.push({
      route: 'voyage',
      routeName: 'The voyage',
      day: chapter,
      dayName: chapterName(chapter),
      step,
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
    const nemesis = antagonist.id as NemesisId
    const groundwork = NEMESIS_ALLY_FLAGS[nemesis].join(', ')
    const gates = {
      undone: `Counter council, or protect the worlds with two of: ${groundwork}`,
      bargained:
        'Bargain for passage with two supplies, or with one piece of groundwork',
      unfinished: 'Any other finale order',
    }
    node.choices = NEMESIS_ENDING_VARIANTS.map((variant) => ({
      id: variant,
      label: titleCase(NEMESIS_ENDINGS[nemesis][variant].title),
      tags: [gates[variant]],
      leadsTo: `ending:${nemesisEndingId(nemesis, variant)}`,
    }))
    add(withArt(node, antagonistArtKey(antagonist.id)))
    for (const variant of NEMESIS_ENDING_VARIANTS) {
      const id = nemesisEndingId(nemesis, variant)
      const ending = blankNode(
        `ending:${id}`,
        'ending',
        titleCase(NEMESIS_ENDINGS[nemesis][variant].title),
      )
      ending.place = `${antagonist.name} · ${variant}`
      ending.body = [NEMESIS_ENDINGS[nemesis][variant].text, gates[variant]]
      ending.companions = []
      add(withArt(ending, nemesisEndingArtKey(id)))
    }
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
      leadsTo: `ending:${slugify(BASE_ENDINGS[0])}`,
    },
    {
      id: 'compromise',
      label: 'Bargain for passage',
      tags: ['Strong with supplies ≥ 3'],
      leadsTo: `ending:${slugify(BASE_ENDINGS[2])}`,
    },
    ...GALACTIC_ENDINGS.map((ending) => ({
      id: slugify(ending.title),
      label: `${ending.orders.length > 1 ? 'Protect or bargain' : ending.orders[0] === 'protect' ? 'Protect the worlds' : 'Bargain for passage'}: ${titleCase(ending.title)}`,
      tags: [ending.gate],
      leadsTo: `ending:${slugify(ending.title)}`,
    })),
  ]
  finale.provenance =
    'The stage shows the voyage’s antagonist here (antagonists/<id>).'
  add(finale)

  for (const ending of BASE_ENDINGS) {
    const node = blankNode(
      `ending:${slugify(ending)}`,
      'ending',
      titleCase(ending),
    )
    node.place = 'Final captain’s log'
    node.body = [ENDING_TEXT[ending]]
    add(withArt(node, endingArtKey(ending)))
  }
  for (const ending of GALACTIC_ENDINGS) {
    const node = blankNode(
      `ending:${slugify(ending.title)}`,
      'ending',
      titleCase(ending.title),
    )
    node.place = 'Final captain’s log'
    node.body = [ending.text, ending.gate]
    node.variations = CAPTAINS.map((captain) => ({
      axis: 'captain',
      key: captain.id,
      label: captain.name,
      text: ending.captains[captain.id],
    }))
    add(withArt(node, endingArtKey(ending.title)))
  }

  const crewName = (id: string) => CREW.find((c) => c.id === id)?.name ?? id
  for (const adventure of TRIO_ADVENTURES) {
    const key = trioKey(adventure.crew)
    const party = adventure.crew.map(crewName).join(', ')
    adventure.steps.forEach((step, i) => {
      const node = blankNode(`trio:${key}:${i + 1}`, 'quest', step.title)
      node.place = `${adventure.title} · ${party} · interlude ${i + 1}/3`
      node.chapter = TRIO_FIRST_CHAPTER + i
      node.body = i === 0 ? [adventure.premise, step.setup] : [step.setup]
      node.companions = [...adventure.crew]
      node.choices = step.options.map((option, choice) => ({
        id: String(choice),
        label: option.label,
        tags: [],
        effect: `Leans toward ${titleCase(adventure.endings[option.ending].title)}`,
        success: { text: option.outcome },
        leadsTo: i < 2 ? `trio:${key}:${i + 2}` : undefined,
      }))
      add(withArt(node, trioArtKey(key, (i + 1) as 1 | 2 | 3)))
    })
    adventure.endings.forEach((ending, i) => {
      const part = i === 0 ? 'a' : 'b'
      const node = blankNode(
        `trio-ending:${key}:${part}`,
        'ending',
        titleCase(ending.title),
      )
      node.place = `${adventure.title} · ${party} · party ending`
      node.body = [
        ending.text,
        'Earned when at least two of the party’s three interlude choices lean this way.',
      ]
      node.companions = [...adventure.crew]
      add(withArt(node, trioArtKey(key, part)))
    })
  }

  const routes: PlaybookRoute[] = [
    {
      id: 'voyage',
      name: 'The voyage',
      kind: `${VOYAGE_BOARDS.length} chapters of calls, then the jump gate`,
      steps: [...VOYAGE_BOARDS.flat().map((id) => `mission:${id}`), 'finale'],
      headings: Object.fromEntries(
        VOYAGE_BOARDS.map((board, i) => [
          VOYAGE_BOARDS.slice(0, i).flat().length,
          chapterName(i + 1),
        ]),
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
    blurb: `Six captains, twelve crew, ${MISSIONS.length} missions across three acts, ${WARP_ENDINGS.length} galactic endings, ${ANTAGONISTS.length * NEMESIS_ENDING_VARIANTS.length} nemesis endings and ${TRIO_ADVENTURES.length} of ${ALL_PARTIES} parties with adventures of their own.`,
    routes,
    nodes,
    order: storyOrder(routes, [
      ...keysOf('opening'),
      ...keysOf('follower'),
      ...keysOf('thread'),
      ...keysOf('boss'),
      ...keysOf('quest'),
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
        keys: keysOf('ending').filter((key) =>
          WARP_ENDINGS.some((e) => key === `ending:${slugify(e)}`),
        ),
      },
      {
        title: 'Nemesis endings',
        blurb: 'Three of its own for each seeded nemesis.',
        keys: keysOf('ending').filter(
          (key) =>
            key.startsWith('ending:') &&
            !WARP_ENDINGS.some((e) => key === `ending:${slugify(e)}`),
        ),
      },
      {
        title: 'Party adventures',
        blurb: `A three-step interlude and two endings for each authored party: ${TRIO_ADVENTURES.length} of ${ALL_PARTIES}.`,
        keys: [...keysOf('quest'), ...keysOf('ending')].filter((key) =>
          key.startsWith('trio'),
        ),
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
      quest: 'Party interlude',
      ending: 'Ending',
    },
    editable: false,
    artProject: 'game-of-captains',
    artLanes: ['krea2'],
    artPromptsComplete: true,
  }
}
