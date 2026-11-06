import { illustration, type Mood } from './castArt'
import { questArtUrl } from './questArt'
import { roomArtUrl } from './rooms'

/**
 * Only add an audience plate here after the image has been delivered,
 * visually approved and exported to public/emperor-of-dust/audiences/.
 * Until then every card uses existing, exported painted art rather than
 * pretending that a queued ArtJob is playable.
 */
export const EXPORTED_AUDIENCE_CHOICES: readonly string[] = []
const exported = new Set(EXPORTED_AUDIENCE_CHOICES)

const FORD_CHOICE_SCENES: Readonly<Record<string, readonly (string | undefined)[]>> = {
  'd22-blame:blame': [
    illustration('npcs', 'ottoline-vask', 'angry'),
    questArtUrl('q-d22-ford-bodies', 'failure'),
  ],
  'd22-blame:evidence': [
    questArtUrl('q-d22-ford-bodies', 'notice'),
    illustration('npcs', 'young-komodo', 'neutral'),
  ],
  'd22-blame:ask-knife': [
    illustration('npcs', 'ottoline-vask', 'neutral'),
    questArtUrl('q-d22-ford-bodies', 'notice'),
  ],
  'd22-blame:ask-tokens': [
    questArtUrl('q-d22-ford-bodies', 'success'),
    illustration('npcs', 'young-komodo', 'neutral'),
  ],
}

const MOODS: readonly Mood[] = [
  'angry',
  'sad',
  'neutral',
  'excited',
  'happy',
]

/**
 * A dedicated image is the first choice. Older audiences fall back to a
 * different exported character expression per card, then the existing
 * painted fortress and wasteland. The shared hand selects distinct loaded
 * images from these candidates to avoid four copies of one portrait.
 */
export function audienceChoiceImages(
  audienceId: string,
  choiceId: string,
  speakerNpc: string | undefined,
  cardIndex: number,
): string[] {
  const asset = `${audienceId}/${choiceId}`
  const commission = exported.has(asset)
    ? `/emperor-of-dust/audiences/${asset}.webp`
    : undefined
  const group = speakerNpc?.startsWith('F0') ? 'followers' : 'npcs'
  const moods = MOODS.map((_, index) => MOODS[(index + cardIndex) % MOODS.length]!)
  const portraits = speakerNpc
    ? moods.map((mood) => illustration(group, speakerNpc, mood))
    : []
  const candidates = [
    commission,
    ...(FORD_CHOICE_SCENES[`${audienceId}:${choiceId}`] ?? []),
    ...portraits,
    illustration('npcs', 'young-komodo', MOODS[cardIndex % MOODS.length]),
    roomArtUrl('throne'),
    '/emperor-of-dust/intro/fortress.webp',
    '/emperor-of-dust/map/wasteland.webp',
  ]
  return [...new Set(candidates.filter((image): image is string => Boolean(image)))]
}
