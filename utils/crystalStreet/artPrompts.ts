import type {
  Archetype,
  Avatar,
  Character,
  Companion,
  Encounter,
  Item,
  Location,
  TagDeck,
  Villain,
} from './types'

export type ArtPrompt = { key: string; prompt: string }

/**
 * The house look in plain words for prose engines (Z-Image, Krea 2, Flux 2):
 * ART_STYLE without its format nouns and mood words, which those engines
 * paint literally. Appended to every authored scene and ending prompt the
 * Playbook Forge offers, after the picture itself.
 */
export const BEAT_ART_MEDIUM =
  'Airbrushed gouache painting in a 1986 horror-comedy style, hot magenta and cyan rim light, deep midnight purple shadows.'

/**
 * A beat's Forge art prompt: its authored `art` (the moment from the beat's
 * own text: who, where, doing what, light and camera) plus the house medium.
 * Never assembled from titles or scene text.
 */
export function beatArtPrompt(art: string): string {
  return `${art.trim().replace(/[.,;\s]+$/, '')}. ${BEAT_ART_MEDIUM}`
}

function encounterPrompts(e: Encounter): ArtPrompt[] {
  return [
    { key: `scenes/${e.id}`, prompt: e.art },
    ...e.choices.flatMap((c) => [
      { key: `outcomes/${e.id}--${c.id}-success`, prompt: c.success.art },
      { key: `outcomes/${e.id}--${c.id}-failure`, prompt: c.failure.art },
    ]),
  ]
}

/** Every art prompt the game carries, keyed by the asset path it renders to. */
export function allArtPrompts(content: {
  villains: Villain[]
  companions: Companion[]
  locations: Location[]
  decks: TagDeck[]
  items: Item[]
  avatars: Avatar[]
  cliques: Archetype[]
  characters: Character[]
  specialEndings: Record<string, { art: string }>
  title: string
}): ArtPrompt[] {
  return [
    { key: 'title/crystal-street', prompt: content.title },
    ...content.avatars.map((a) => ({ key: `avatars/${a.id}`, prompt: a.art })),
    ...content.cliques.map((c) => ({ key: `cliques/${c.id}`, prompt: c.art })),
    ...Object.entries(content.specialEndings).map(([id, e]) => ({
      key: `endings/special-${id}`,
      prompt: e.art,
    })),
    ...content.characters.map((c) => ({
      key: `characters/${c.id}`,
      prompt: c.art,
    })),
    ...content.villains.flatMap((v) => [
      { key: `villains/${v.id}-poster`, prompt: v.poster },
      { key: `villains/${v.id}-portrait`, prompt: v.portrait },
      { key: `villains/${v.id}-ending`, prompt: v.endingPhoto },
      ...v.clues.flatMap((c) => encounterPrompts(c.encounter)),
      ...v.signature.flatMap(encounterPrompts),
      ...encounterPrompts(v.finale),
      ...Object.entries(v.endings).map(([tier, e]) => ({
        key: `endings/${v.id}-${tier}`,
        prompt: e.art,
      })),
    ]),
    ...content.companions.flatMap((c) => [
      { key: `companions/${c.id}-poster`, prompt: c.poster },
      ...Object.entries(c.emotions).map(([emotion, e]) => ({
        key: `companions/${c.id}-${emotion}`,
        prompt: e.art,
      })),
      ...encounterPrompts(c.meet),
    ]),
    ...content.locations.flatMap((l) => [
      { key: `locations/${l.id}`, prompt: l.art },
      ...l.beats.flatMap(encounterPrompts),
    ]),
    ...content.decks.flatMap((d) => d.encounters.flatMap(encounterPrompts)),
    ...content.items.map((i) => ({ key: `items/${i.id}`, prompt: i.art })),
  ]
}
