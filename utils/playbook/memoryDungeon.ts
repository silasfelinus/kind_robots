import { COMBAT_ROOMS } from '../memoryDungeon/rooms'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import { DARK_BRIAR_SCENES, DARK_BRIAR_SEALS } from '../memoryDungeon/darkBriar'
import { DARK_HOUSE_ROOMS } from '../memoryDungeon/darkHouse'
import { DARK_HOUSE_TRIALS } from '../memoryDungeon/darkHouseChallenges'
import { HOUSE_ROOMS } from '../memoryDungeon/house'
import {
  HOUSE_EPILOGUES,
  HOUSE_EPILOGUE_LENS_LABELS,
} from '../memoryDungeon/houseEpilogues'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import {
  BRIAR_DUNGEON,
  BRIAR_GATE,
  BRIAR_SITES,
  BRIAR_START,
} from '../memoryDungeonWorld'
import {
  blankNode,
  storyOrder,
  type NodeKind,
  type Playbook,
  type PlaybookNode,
  type PlaybookRoute,
} from './types'

// Playbook Studio adapter for Memory Dungeon (Silas, 2026-10-26: "can we also
// get support for memory dungeon?"). Two 8×8 worlds and their Houses as beats:
// the Briar Marches overworld, the House beneath it (HD-01..36, the Rootbound
// Warden, three Hearth resolutions told as twelve earned epilogues), the
// inverted Dark Briar and its Dark House (two endings), the Earth photographs the chronicle collects, and the monsters.
//
// Text and art prompts are authored in code; beats are read-only here. Art is
// served from the image store (/images/memory-dungeon/…, not in git), so each
// beat names its runtime path as `artPath` and the ledger API reports which of
// those files exist. Prompts are queued by Conductor's Memory Dungeon ledgers
// (projects/memory-dungeon/art), never by the Forge.

const ROOT = '/images/memory-dungeon'
const tile = (key: string) => key.replace(',', '-')

function scene(
  key: string,
  kind: NodeKind,
  title: string,
  options: {
    place: string
    chapter: number
    body: string[]
    artPrompt?: string
    artPath: string
    choices?: readonly { id: string; label: string; outcome: string }[]
  },
): PlaybookNode {
  const node = blankNode(key, kind, title)
  node.place = options.place
  node.chapter = options.chapter
  node.body = options.body.filter((line) => line.trim())
  node.artPrompt = options.artPrompt
  node.artPath = options.artPath
  node.needsArt = true
  node.provenance = 'utils/memoryDungeon'
  node.choices = (options.choices ?? []).map((choice) => ({
    id: choice.id,
    label: choice.label,
    tags: [],
    success: { text: choice.outcome },
  }))
  return node
}

/**
 * The Dark House's guardians (the frightened Hearth Guard, the Housekeeper,
 * the Collector, the Twinned Guard and the Warden's hearing) each bar a door
 * with their own evidence trial, so they are adversaries, not plain rooms.
 */
function darkHouseKind(room: { id: string; kind: string }): NodeKind {
  return DARK_HOUSE_TRIALS[room.id] &&
    (room.kind === 'combat' || room.kind === 'guardian')
    ? 'boss'
    : 'spine'
}

/** Beats that are authored map positions: overworld tiles and House rooms. */
const POSITIONS = new Set(['briar', 'dark', 'dark-seal', 'house', 'dark-house'])

export function isMemoryDungeonPosition(key: string): boolean {
  return POSITIONS.has(key.split(':')[0] ?? '')
}

export function buildMemoryDungeonPlaybook(): Playbook {
  const nodes: Record<string, PlaybookNode> = {}
  const add = (node: PlaybookNode) => {
    nodes[node.key] = node
    return node.key
  }

  // World one: the Briar Marches overworld.
  const briar: string[] = []
  const coordinates = Object.keys(BRIAR_SCENES).sort((a, b) => {
    const [ax, ay] = a.split(',').map(Number)
    const [bx, by] = b.split(',').map(Number)
    return ay! - by! || ax! - bx!
  })
  for (const key of coordinates) {
    const s = BRIAR_SCENES[key]!
    const site = (BRIAR_SITES as Record<string, { kind: string }>)[key]
    const kind: NodeKind =
      key === BRIAR_START
        ? 'opening'
        : key === BRIAR_DUNGEON || key === BRIAR_GATE
          ? 'spine'
          : site?.kind === 'sealed'
            ? 'quest'
            : 'encounter'
    briar.push(
      add(
        scene(`briar:${key}`, kind, s.title, {
          place: `Briar Marches ${key}${site ? ` · ${site.kind}` : ''}`,
          chapter: 1,
          body: [s.opening],
          artPrompt: s.artPrompt,
          artPath: `${ROOT}/briar/sites/${tile(key)}.webp`,
          choices: s.choices,
        }),
      ),
    )
  }

  // The House beneath the Briar: thirty-six rooms, the Warden, three Hearth resolutions.
  const house: string[] = []
  for (const room of Object.values(HOUSE_ROOMS)) {
    // The Thornbound Housekeeper is a guardian met in her own room. The
    // House's three duelling guardians are counted once, as their combat
    // rooms under Monsters.
    const kind: NodeKind =
      room.id === 'HD-32' || room.id === 'HD-16'
        ? 'boss'
        : room.id === 'HD-35'
          ? 'crossroads'
          : 'spine'
    const artPath =
      room.id === 'HD-01'
        ? `${ROOT}/house/foyer.webp`
        : room.id === 'HD-32'
          ? `${ROOT}/house/rootbound-warden.webp`
          : room.imagePath
    house.push(
      add(
        scene(`house:${room.id}`, kind, room.title, {
          place: `The House · ${room.id} · ${room.kind}`,
          chapter: 2,
          body: [room.opening],
          artPrompt: room.artPrompt,
          artPath,
          choices: room.choices,
        }),
      ),
    )
  }
  const climax = Object.values(HOUSE_ROOMS).find((r) => r.id === 'HD-35')
  // The Hearth resolutions are the choice; the epilogues are the endings.
  const houseEndings = (climax?.choices ?? []).map((choice) =>
    add(
      scene(`house-ending:${choice.id}`, 'crossroads', choice.label, {
        place: 'The Memory Hearth',
        chapter: 2,
        body: [choice.outcome],
        artPrompt: choice.artPrompt,
        artPath: `${ROOT}/house/ending-${choice.id}.webp`,
      }),
    ),
  )

  const houseEpilogues = Object.values(HOUSE_EPILOGUES).map((epilogue) => {
    const resolution = climax?.choices.find(
      (choice) => choice.id === epilogue.resolution,
    )
    const key = add(
      scene(`house-epilogue:${epilogue.id}`, 'ending', epilogue.title, {
        place: `The Memory Hearth · ${HOUSE_EPILOGUE_LENS_LABELS[epilogue.lens]}`,
        chapter: 2,
        body: [
          epilogue.text,
          `Reached by choosing "${resolution?.label ?? epilogue.resolution}" at the Memory Hearth when the road there leaned toward ${HOUSE_EPILOGUE_LENS_LABELS[epilogue.lens].toLowerCase()}.`,
        ],
        artPrompt: epilogue.artPrompt,
        artPath: epilogue.artPath,
      }),
    )
    nodes[key]!.lenses = [epilogue.lens]
    return key
  })

  // World two: the Dark Briar, the same map turned inside out.
  const dark: string[] = []
  for (const s of Object.values(DARK_BRIAR_SCENES)) {
    dark.push(
      add(
        scene(`dark:${s.key}`, 'encounter', s.title, {
          place: `Dark Briar ${s.key}`,
          chapter: 3,
          body: [
            s.opening,
            ...(s.originalCallback ? [s.originalCallback.line] : []),
          ],
          artPrompt: s.artPrompt,
          artPath: `${ROOT}/dark-briar/scenes/${tile(s.key)}.webp`,
          choices: s.choices,
        }),
      ),
    )
  }
  for (const seal of Object.values(DARK_BRIAR_SEALS)) {
    dark.push(
      add(
        scene(`dark-seal:${seal.key}`, 'quest', seal.title, {
          place: `Dark Briar ${seal.key} · seal`,
          chapter: 3,
          body: [seal.opening, seal.hint],
          artPrompt: seal.artPrompt,
          artPath: `${ROOT}/dark-briar/scenes/${tile(seal.key)}.webp`,
        }),
      ),
    )
  }

  // The Dark House and its two endings.
  const darkHouse: string[] = []
  for (const room of Object.values(DARK_HOUSE_ROOMS)) {
    darkHouse.push(
      add(
        scene(`dark-house:${room.id}`, darkHouseKind(room), room.title, {
          place: `The Dark House · ${room.id} · ${room.kind}`,
          chapter: 4,
          body: [room.opening],
          artPrompt: room.artPrompt,
          artPath: room.imagePath,
          choices: room.choices,
        }),
      ),
    )
  }
  const darkEndings = [
    {
      id: 'return',
      title: 'Return the memories to their owners',
      text: 'The memories return to their individual owners. Nobody inherits the right to speak for them.',
    },
    {
      id: 'commons',
      title: 'A revocable commons',
      text: 'The House becomes a revocable commons. Every person may withdraw their testimony.',
    },
  ].map((ending) =>
    add(
      scene(`dark-ending:${ending.id}`, 'ending', ending.title, {
        place: 'The Dark House verdict',
        chapter: 4,
        body: [ending.text],
        artPath: '',
      }),
    ),
  )
  // The Dark House verdict is text only in the game: no picture slot.
  for (const key of darkEndings) {
    nodes[key]!.artPath = undefined
    nodes[key]!.needsArt = false
  }

  // The chronicle's Earth photographs, and the monsters.
  const photos = EARTH_PHOTOS.map((photo) =>
    add(
      scene(`photo:${photo.id}`, 'thread', photo.title, {
        place: `${photo.site} · ${photo.experience}`,
        chapter: 5,
        body: [photo.caption, photo.challenge, photo.hold],
        artPrompt: photo.artPrompt,
        artPath: photo.artPath,
      }),
    ),
  )
  const monsters = Object.entries(COMBAT_ROOMS).map(([id, room]) =>
    add(
      scene(`monster:${id}`, 'boss', room.enemy.name, {
        place: `Combat · ${room.enemy.hp} HP`,
        chapter: 6,
        body: [room.intro],
        artPrompt: room.artPrompt,
        artPath: `${ROOT}/monsters/${room.enemy.name
          .toLowerCase()
          .replace(/^the\s+/, '')
          .replace(/[^a-z0-9]+/g, '-')}.webp`,
      }),
    ),
  )

  const route = (
    id: string,
    name: string,
    steps: string[],
    heading: string,
  ): PlaybookRoute => ({
    id,
    name,
    kind: 'world',
    steps,
    headings: { 0: heading },
  })
  const routes = [
    route('briar', 'Briar Marches', briar, 'World one: the Briar Marches'),
    route(
      'house',
      'The House',
      [...house, ...houseEndings, ...houseEpilogues],
      'The House',
    ),
    route('dark', 'Dark Briar', dark, 'World two: the Dark Briar'),
    route(
      'dark-house',
      'The Dark House',
      [...darkHouse, ...darkEndings],
      'The Dark House',
    ),
  ]

  return {
    game: 'memory-dungeon',
    title: 'Memory Dungeon',
    blurb:
      'Two 8×8 worlds and their Houses: 64 Briar scenes, 36 rooms, the Dark Briar, the Dark House, twelve House epilogues and two Dark House verdicts.',
    routes,
    nodes,
    order: storyOrder(routes, [...photos, ...monsters]),
    sections: [
      {
        title: 'Endings',
        blurb:
          'Twelve House epilogues, each Memory Hearth resolution told through one of four earned lenses, and the two Dark House verdicts.',
        keys: [...houseEpilogues, ...darkEndings],
      },
      {
        title: 'Memory Hearth resolutions',
        blurb: 'The three promises the House will keep.',
        keys: houseEndings,
      },
      {
        title: 'Earth photographs',
        blurb: 'The chronicle the player carries between worlds.',
        keys: photos,
      },
      {
        title: 'Monsters',
        blurb:
          'Who the combat rooms pit you against: two forest duels, the House’s three guardians and the Rootbound Warden.',
        keys: monsters,
      },
    ],
    people: [],
    peopleLabel: 'Companions',
    variations: [],
    variationLabel: 'Outcome',
    dayLabel: 'World',
    kindLabels: {
      opening: 'Start',
      spine: 'Room',
      encounter: 'Scene',
      quest: 'Seal',
      crossroads: 'The Memory Hearth',
      boss: 'Adversary',
      thread: 'Earth photograph',
      ending: 'Ending',
    },
    editable: false,
    artPromptsComplete: true,
    artProject: 'memory-dungeon',
    artLanes: ['krea2'],
    artPipeline:
      'conductor projects/memory-dungeon/art (KNOWN-ART-REQUESTS.yaml, submitted by Auto Art Generate)',
  }
}
