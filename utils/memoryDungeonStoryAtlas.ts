import { BRIAR_CROSS_MAP_KEYS, BRIAR_REVEAL_WAVES } from './memoryDungeonWaves'
import { BRIAR_TILES, BRIAR_SITES } from './memoryDungeonWorld'
import { BRIAR_SCENES } from './memoryDungeon/scenes'

/**
 * Canonical editorial atlas, not a second event executor.
 * 47 existing authored scenes are read directly from the runtime. Special
 * locations and remaining content are explicitly planned, never mislabeled
 * as playable. Do not fork the Scylla/Char/Oren/Morrow canon here.
 */
export interface DungeonStoryChoice {
  id: string
  label: string
  result: string
}
export interface DungeonStoryTile {
  title: string
  introduction: string
  artDirection: string
  choices: readonly DungeonStoryChoice[]
  status: 'playable-scene' | 'planned'
}

const PLANNED_BRIAR_BEATS: Record<string, DungeonStoryTile> = {
  '1,1': {
    title: 'North Star Twin',
    introduction:
      'An illustrated interactive location at 1,1: North Star Twin. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Illustrated star seal on a moss-covered stone with its imperfect twin to be found in a later realm.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Examine and sketch the seven-point mark',
        result: 'Preserve its partner clue in the Chronicle',
      },
      {
        id: 'b',
        label: 'Leave the seal untouched',
        result: 'Preserve the fair cross-region matching challenge',
      },
    ],
  },
  '8,1': {
    title: 'Whitewing Cipher',
    introduction:
      'An illustrated interactive location at 8,1: Whitewing Cipher. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Feather emblem in a lichen-crusted cliff marker, showing one inverted barb.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Sketch the feather pattern',
        result: 'Record a persistent cross-region rune clue',
      },
      {
        id: 'b',
        label: 'Protect the marker',
        result: 'Leave the physical twin puzzle accessible to later travelers',
      },
    ],
  },
  '5,2': {
    title: 'Sleeping Sigil',
    introduction:
      'An illustrated interactive location at 5,2: Sleeping Sigil. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Warm twin seal set into the roots of the old House gate, one half missing.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Trace its breathing pattern',
        result: "Store the seal's rhythm for a future location",
      },
      {
        id: 'b',
        label: 'Keep watch',
        result: 'Allow the sigil to wake without being damaged',
      },
    ],
  },
  '6,2': {
    title: 'House That Remembers',
    introduction:
      'An illustrated interactive location at 6,2: House That Remembers. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Grand storybook manor, living roots wrapped around its steps, door frame carved with names.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Enter the House',
        result:
          'Launch the existing dungeon entrance, later expanded to 36 authored rooms',
      },
      {
        id: 'b',
        label: 'Investigate the entrance',
        result: "Learn the Warden's role before fighting or bargaining",
      },
    ],
  },
  '8,4': {
    title: 'Thorn Gate',
    introduction:
      'An illustrated interactive location at 8,4: Thorn Gate. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Thorn-locked exit with the faint outline of a bell growing through its bark.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Sound the Bramble Chime',
        result: 'Open the regional passage after completing the dungeon',
      },
      {
        id: 'b',
        label: 'Study another route',
        result: 'Use earned alternatives where campaign state permits',
      },
    ],
  },
  '2,5': {
    title: 'Photograph: Dismissal',
    introduction:
      'An illustrated interactive location at 2,5: Photograph: Dismissal. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      "A candid Earth photograph shows Morrow, in the protagonist's body, leaving the research office after dismissal.",
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Examine the photograph',
        result: 'Add the first Earth-side loss to the ordered Chronicle',
      },
      {
        id: 'b',
        label: 'Compare the office details',
        result: 'Notice the changing circumstances of the borrowed life',
      },
    ],
  },
  '3,6': {
    title: 'Creekside Cache',
    introduction:
      'An illustrated interactive location at 3,6: Creekside Cache. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Hidden chest beside a wet bank; a wildflower and a half-written apology inside.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Take the flowers',
        result: 'Grant a once-only resource reward',
      },
      {
        id: 'b',
        label: 'Leave the apology',
        result: 'Keep a clue available for someone seeking reconciliation',
      },
    ],
  },
  '4,6': {
    title: "The Packmate's Petition",
    introduction:
      "An illustrated interactive location at 4,6: The Packmate's Petition. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.",
    artDirection:
      'Weathered wolf courier carrying evidence of a long defensive patrol.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Hear the petition',
        result: "Gain the pack's account of why it guards the village",
      },
      {
        id: 'b',
        label: 'Share the testimony',
        result: 'Challenge the official story about wolf tribute',
      },
    ],
  },
  '7,6': {
    title: 'Riverbank Chest',
    introduction:
      'An illustrated interactive location at 7,6: Riverbank Chest. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Waterlogged chest tucked among reeds with a lantern and uncertain ferry sketch.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Claim the lantern',
        result: 'Award a once-only useful item',
      },
      {
        id: 'b',
        label: 'Bring it to another traveler',
        result: 'Create a companion or NPC trust consequence',
      },
    ],
  },
  '8,6': {
    title: 'Photograph: The Gathering',
    introduction:
      'An illustrated interactive location at 8,6: Photograph: The Gathering. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'An unposed Earth party photograph where Morrow inadvertently humiliates an old friend.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Study the photograph',
        result: 'Add the damaged friendship to the chronological Chronicle',
      },
      {
        id: 'b',
        label: 'Remember the friend',
        result: 'Record what was at stake before judging Morrow',
      },
    ],
  },
  '3,7': {
    title: 'Greenwood Challenge',
    introduction:
      'An illustrated interactive location at 3,7: Greenwood Challenge. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Polite armed knight in a long-abandoned garden where ownership has become a riddle.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Accept the duel',
        result: 'Resolve a telegraphed two-card matching combat encounter',
      },
      {
        id: 'b',
        label: 'Present evidence of common ownership',
        result: 'Negotiate instead of fighting',
      },
    ],
  },
  '4,7': {
    title: 'Stolen Laughter',
    introduction:
      'An illustrated interactive location at 4,7: Stolen Laughter. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Villagers laughing through a funeral because their local cemetery owns their tears.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Ask who signed the bargain',
        result: 'Uncover a tender but troubling memorial pact',
      },
      {
        id: 'b',
        label: 'Offer a witness',
        result: "Help restore mourners' right to grieve",
      },
    ],
  },
  '5,7': {
    title: "The Dam's Door",
    introduction:
      "An illustrated interactive location at 5,7: The Dam's Door. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.",
    artDirection:
      'Old mill spillway with contested wooden barriers and families disagreeing about the risk.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Open the floodgate',
        result: 'Accept downstream dangers to restore memory flow',
      },
      {
        id: 'b',
        label: 'Negotiate water sharing',
        result: 'Find a slower plan that preserves households',
      },
    ],
  },
  '8,7': {
    title: 'Briar Sentry',
    introduction:
      'An illustrated interactive location at 8,7: Briar Sentry. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Watchtower looking toward both the gate and a secret southern shoreline.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Climb the watchtower',
        result: 'Reveal a safe return route on the fixed map',
      },
      {
        id: 'b',
        label: 'Ask the sentry for directions',
        result: 'Earn a shortcut by helping patrols',
      },
    ],
  },
  '3,8': {
    title: 'Fallow Field',
    introduction:
      'An illustrated interactive location at 3,8: Fallow Field. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Empty orchard margin crossed by footprints of a vanished wedding procession.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Follow the footprints',
        result: 'Record a trail to the optional secret area',
      },
      {
        id: 'b',
        label: 'Keep the field quiet',
        result: 'Protect fragile evidence of vanished residents',
      },
    ],
  },
  '6,8': {
    title: "Pilgrim's Grave",
    introduction:
      "An illustrated interactive location at 6,8: Pilgrim's Grave. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.",
    artDirection:
      'Headstone naming a living person among the dead; flowers leave clues, not solutions.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Read the memorial',
        result: 'Investigate the false death entry',
      },
      {
        id: 'b',
        label: 'Find the family',
        result: 'Unlock the personal version of the case',
      },
    ],
  },
  '8,8': {
    title: 'Moonroot Knot',
    introduction:
      'An illustrated interactive location at 8,8: Moonroot Knot. Its authored encounter is planned and must be integrated with the existing map/site action and saved state.',
    artDirection:
      'Final cross-world root seal with a reversed crescent and a paired inscription.',
    status: 'planned',
    choices: [
      {
        id: 'a',
        label: 'Remember the reversal',
        result: 'Preserve the final cross-region matching clue',
      },
      {
        id: 'b',
        label: 'Protect the knot',
        result: 'Keep the future test fair to discoverers',
      },
    ],
  },
}

export const BRIAR_STORY_ATLAS: Record<string, DungeonStoryTile> =
  Object.fromEntries(
    BRIAR_TILES.map((tile) => {
      const active = BRIAR_SCENES[tile.key]
      if (active) {
        return [
          tile.key,
          {
            title: active.title,
            introduction: active.opening,
            artDirection: active.artPrompt,
            choices: active.choices.map((choice) => ({
              id: choice.id,
              label: choice.label,
              result: choice.outcome,
            })),
            status: 'playable-scene' as const,
          },
        ]
      }
      return [tile.key, PLANNED_BRIAR_BEATS[tile.key]]
    }),
  )

export function pendingBriarStoryKeys(): string[] {
  return BRIAR_TILES.filter(
    (tile) => BRIAR_STORY_ATLAS[tile.key]?.status === 'planned',
  ).map((tile) => tile.key)
}

export function validateBriarStoryAtlas(): string[] {
  const issues: string[] = []
  if (Object.keys(BRIAR_STORY_ATLAS).length !== BRIAR_TILES.length)
    issues.push('Every fixed 8×8 position needs a canonical story entry')

  for (const tile of BRIAR_TILES) {
    const scene = BRIAR_STORY_ATLAS[tile.key]
    if (!scene) {
      issues.push(`Missing atlas location ${tile.key}`)
      continue
    }
    if (
      !scene.title.trim() ||
      !scene.introduction.trim() ||
      !scene.artDirection.trim()
    )
      issues.push(`Incomplete story/art direction at ${tile.key}`)
    if (scene.choices.length < 2)
      issues.push(`Location ${tile.key} needs two alternatives`)
    if (
      new Set(scene.choices.map((choice) => choice.id)).size !==
      scene.choices.length
    )
      issues.push(`Duplicate choice ID at ${tile.key}`)
    if (
      scene.choices.some(
        (choice) => !choice.label.trim() || !choice.result.trim(),
      )
    )
      issues.push(`Choice missing outcome at ${tile.key}`)

    const live = BRIAR_SCENES[tile.key]
    if (live && scene.status !== 'playable-scene')
      issues.push(`Active scene ${tile.key} incorrectly shown as planned`)
    if (!live && scene.status !== 'planned')
      issues.push(`Unimplemented ${tile.key} incorrectly shown as playable`)
    if (
      live &&
      (scene.title !== live.title || scene.introduction !== live.opening)
    )
      issues.push(`Atlas drift from active scene at ${tile.key}`)
    if (!live && BRIAR_SITES[tile.key] && !scene.title.trim())
      issues.push(`Special location ${tile.key} lacks a story label`)
  }

  if (
    BRIAR_REVEAL_WAVES.flat().length !== 60 ||
    BRIAR_CROSS_MAP_KEYS.length !== 4
  )
    issues.push('Keep 60 match reveals and four cross-region seals distinct')

  return issues
}
