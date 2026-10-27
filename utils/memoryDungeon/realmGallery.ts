import { BRIAR_STORY_ATLAS } from '../memoryDungeonStoryAtlas'
import { BRIAR_STYLE, closeUpPrompt } from './artPromptParts'

export type RealmCardRole =
  'character' | 'place' | 'event' | 'creature' | 'relic' | 'collaboration'

export interface RealmGalleryCard {
  id: string
  world: number
  title: string
  role: RealmCardRole
  sceneKey: string | null
  partnerWorld: number | null
  artPath: string
  prompt: string
}

/**
 * Exactly 30 in-world faces (six + seven + eight + nine per reveal wave)
 * and two collaborative images for cross-realm matching. The faces are
 * distinct collectible illustrations, not the 64 tile background paintings.
 * Future worlds publish their own registries with this same contract.
 */
const LOCAL_CARD_ROSTER = [
  ['2,4', 'The First Campfire', 'place'],
  ['4,4', 'The Mermaid Princesses', 'character'],
  ['4,3', 'Oren and the Manifest', 'character'],
  ['2,5', 'The Dismissal Photograph', 'event'],
  ['4,2', 'Mosswick and the Wildflowers', 'character'],
  ['3,4', 'The Courier’s Price', 'event'],
  ['6,2', 'The House That Remembers', 'place'],
  ['5,5', 'Moss Sprite Duel', 'creature'],
  ['7,3', 'The Thorn Patrol', 'creature'],
  ['2,7', 'Three Quiet Stones', 'relic'],
  ['3,6', 'Creekside Cache', 'relic'],
  ['8,4', 'The Thorn Gate', 'place'],
  ['2,6', 'Moss Inscription', 'relic'],
  ['7,6', 'Riverbank Treasure', 'relic'],
  ['8,6', 'The Gathering Photograph', 'event'],
  ['1,2', 'The Briar Road', 'place'],
  ['3,3', 'The Hollow Lantern', 'event'],
  ['5,3', 'A Complicated Favor', 'event'],
  ['6,3', 'Whispering Roots', 'place'],
  ['4,6', 'The Witnesses', 'character'],
  ['1,5', 'The Edge of the Marches', 'place'],
  ['7,4', 'The Old Shortcut', 'place'],
  ['5,4', 'The Forest Bargain', 'event'],
  ['6,4', 'Candlelit Crossing', 'place'],
  ['3,5', 'The Lost Wayfarer', 'character'],
  ['5,6', 'The River’s Claim', 'event'],
  ['1,7', 'The Woodland Warning', 'event'],
  ['7,5', 'The Hidden Approach', 'place'],
  ['3,2', 'The Unquiet Trail', 'event'],
  ['8,5', 'Beyond the Briars', 'place'],
] as const satisfies readonly (readonly [
  string,
  string,
  Exclude<RealmCardRole, 'collaboration'>,
])[]

export const WORLD_ONE_GALLERY: readonly RealmGalleryCard[] = [
  ...LOCAL_CARD_ROSTER.map(([key, title, role], index) => {
    const scene = BRIAR_STORY_ATLAS[key]
    if (!scene) throw new Error(`Gallery scene ${key} is not authored`)
    const number = String(index + 1).padStart(2, '0')
    return {
      id: `w01-${number}`,
      world: 1,
      title,
      role,
      sceneKey: key,
      partnerWorld: null,
      artPath: `/images/memory-dungeon/realm-decks/world-01/${number}.webp`,
      prompt: closeUpPrompt(scene.artDirection, BRIAR_STYLE),
    }
  }),
  {
    id: 'w01-31',
    world: 1,
    title: 'The Shared Hearth',
    role: 'collaboration',
    sceneKey: null,
    partnerWorld: 2,
    artPath: '/images/memory-dungeon/realm-decks/world-01/31.webp',
    prompt: `A domed stone bread oven with an orange fire glowing inside, its masonry wrapped in living briar stems with green leaves and red thorns, a wooden peel and two round loaves resting on the hearth stone. Warm firelight. Close-up, centered. ${BRIAR_STYLE}`,
  },
  {
    id: 'w01-32',
    world: 1,
    title: 'The Twin Tide',
    role: 'collaboration',
    sceneKey: null,
    partnerWorld: 4,
    artPath: '/images/memory-dungeon/realm-decks/world-01/32.webp',
    prompt: `Two identical silver mermaid crowns set with pearls, one resting on a wet black rock above a calm tide line and the other reflected upside down in the water below it, one dark briar stem curling from the first crown down to the second. Pale moonlight on the water. Close-up, centered. ${BRIAR_STYLE}`,
  },
]

export function validateRealmGallery(
  cards: readonly RealmGalleryCard[],
  world: number,
): string[] {
  const errors: string[] = []
  if (cards.length !== 32)
    errors.push('Each realm must contain 32 unique illustrated faces')
  if (cards.filter((card) => card.role !== 'collaboration').length !== 30)
    errors.push('Exactly 30 cards must belong to the realm storyline')
  if (cards.filter((card) => card.role === 'collaboration').length !== 2)
    errors.push('Exactly two cards must link to other realms')
  for (const field of ['id', 'artPath', 'title'] as const) {
    if (new Set(cards.map((card) => card[field])).size !== cards.length)
      errors.push(`Duplicate gallery ${field}`)
  }
  if (
    new Set(cards.filter((card) => card.sceneKey).map((card) => card.sceneKey))
      .size !== 30
  )
    errors.push(
      'Realm-local cards must represent 30 distinct authored encounters',
    )
  for (const card of cards) {
    if (card.world !== world || !card.prompt.trim())
      errors.push(`Invalid realm or missing brief: ${card.id}`)
    if (
      card.role === 'collaboration' &&
      (!card.partnerWorld || card.partnerWorld === world)
    )
      errors.push(`Collaboration requires another realm: ${card.id}`)
    if (
      card.role !== 'collaboration' &&
      (!card.sceneKey || card.partnerWorld !== null)
    )
      errors.push(`Local card must reference its authored scene: ${card.id}`)
  }
  return errors
}
