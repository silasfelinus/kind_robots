/**
 * Monstrique series-bible art recipes. Server-only, so the mature pin-up
 * prompt text never ships in the client bundle. Pure (no auth, no Prisma) so
 * the contract test can exercise it directly.
 */
import { createError } from 'h3'
import {
  ART_STYLES,
  composeCharacterPrompt,
  loraDatasetPlan,
  UNIVERSAL_NEGATIVE,
} from '../../utils/monstrique/artStyles'
import {
  CHARACTER_MODELS,
  type MonstriqueCharacterId,
} from '../../utils/monstrique/characterModels'
import {
  BIBLE_LANES,
  type BibleArtKind,
} from '../../utils/monstrique/bibleLanes'

const STYLE_TAGS =
  'masterpiece, best quality, amazing quality, 1970s adult animation, rotoscoped cel animation, underground comix, gritty, grainy film, heavy black ink outlines, painted watercolor background, pulp b-movie monster pinup, retro pinup, muted psychedelic palette'
const STYLE_PROSE =
  'Gritty 1970s rotoscoped adult-animation pin-up illustration in an underground-comix style: heavy black ink outlines, grainy hand-painted cels over a painted watercolor backdrop, a pulpy B-movie monster-misfit attitude and a muted psychedelic palette.'
const PINUP_NEGATIVE = [
  '(nude:1.5)',
  '(nipples:1.6)',
  '(areola:1.6)',
  '(exposed breasts:1.6)',
  '(topless:1.5)',
  '(see-through towel:1.4)',
  '(gigantic breasts:1.3)',
  'nude',
  'naked',
  'nipples',
  'areola',
  'pussy',
  'genitals',
  'sex',
  'explicit',
  'topless',
  'bottomless',
  'see-through',
  'loli',
  'petite',
  'flat chest',
  'lowres',
  'worst quality',
  'bad anatomy',
  'bad hands',
  'extra limbs',
  'text',
  'watermark',
  'signature',
  '2girls',
  '1boy',
  ...UNIVERSAL_NEGATIVE,
].join(', ')

/**
 * Softcore unlocks (mature edition, adults only): nudity is allowed, explicit
 * sex acts and genital focus are not, and the age negatives always apply.
 */
const SOFTCORE_NEGATIVE = [
  '(sex:1.4)',
  '(penetration:1.5)',
  '(genitals:1.4)',
  '(pussy:1.4)',
  '(penis:1.5)',
  '(spread legs:1.3)',
  'cum',
  'masturbation',
  'explicit sex',
  'loli',
  'petite',
  'flat chest',
  'lowres',
  'worst quality',
  'bad anatomy',
  'bad hands',
  'extra limbs',
  'text',
  'watermark',
  'signature',
  '2girls',
  '1boy',
  ...UNIVERSAL_NEGATIVE.filter(
    (term) => term !== 'nude' && term !== 'explicit',
  ),
].join(', ')

export const BIBLE_PINUP_SHOTS: Record<
  'swimsuit' | 'shower' | 'softcore',
  { tags: string; prose: string }
> = {
  swimsuit: {
    tags: 'cheesecake pinup, retro high-waisted swimsuit, sunglasses on head, beach towel, posing, hand on hip, looking at viewer, motel swimming pool at night, neon sign, full body',
    prose:
      'She strikes a cheeky cheesecake pin-up pose beside a motel swimming pool at night, one hand on her hip, wearing a retro high-waisted swimsuit with sunglasses pushed up on her head, a striped beach towel at her feet and a pink neon sign glowing behind her.',
  },
  shower: {
    tags: 'steamy shower pinup, wrapped in bath towel, towel covering body, thick steam, water droplets, wet hair, shower curtain pulled aside, motel bathroom, looking over shoulder, sultry smile, upper body',
    prose:
      'She peeks out from behind a pulled-aside shower curtain in a steamy motel bathroom, wrapped snugly in a bath towel, water droplets on her shoulders, thick steam swirling, giving a sultry look over her shoulder.',
  },
  softcore: {
    tags: 'softcore boudoir pinup, topless, artistic nude, tasteful, seductive pose, lounging on a motel bed with red satin sheets, neon light through venetian blinds, looking at viewer, sultry smile, upper body',
    prose:
      'She lounges topless on red satin sheets in a motel room, neon light striping her through venetian blinds, an artistic softcore boudoir pin-up with a sultry smile.',
  },
}

function stableSeed(text: string): number {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2147483647
}

/**
 * The /api/art/enqueue bodies for one bible request. Pin-ups are monster
 * stars only and always mature and private; portraits use the 2D style.
 */
export function bibleEnqueueBodies(
  character: MonstriqueCharacterId,
  kind: BibleArtKind,
  laneKeys: string[],
  displayName?: string | null,
): Array<{ lane: string; body: Record<string, unknown> }> {
  const model = CHARACTER_MODELS[character]
  const name = displayName?.trim() || model.name
  if (kind === 'lora-dataset')
    return loraDatasetPlan(character).map((entry) => ({
      lane: 'model-sheet:' + entry.shot,
      body: { ...entry.request, priority: 60 },
    }))
  const lanes = BIBLE_LANES.filter(
    (lane) =>
      laneKeys.includes(lane.key) &&
      (kind === 'softcore' ? lane.nudity === true : true),
  )
  if (!lanes.length)
    throw createError({ statusCode: 400, statusMessage: 'Pick a lane.' })
  if (kind === 'portrait')
    return lanes.map((lane) => {
      const base = composeCharacterPrompt({
        character,
        style: 'adventure-2d',
        audience: 'mature',
        expression: 'smirk',
      })!
      return {
        lane: lane.key,
        body: {
          ...base,
          engine: lane.engine,
          ...(lane.checkpoint ? { checkpoint: lane.checkpoint } : {}),
          width: ART_STYLES['adventure-2d'].width,
          height: ART_STYLES['adventure-2d'].height,
          priority: 60,
        },
      }
    })
  if (!model.monsterStar)
    throw createError({
      statusCode: 400,
      statusMessage: 'Pin-ups are for the monster stars.',
    })
  const shot = BIBLE_PINUP_SHOTS[kind]
  const traits = model.identity.join(', ')
  return lanes.map((lane) => ({
    lane: lane.key,
    body: {
      engine: lane.engine,
      ...(lane.checkpoint ? { checkpoint: lane.checkpoint } : {}),
      promptString:
        lane.prompt === 'tags'
          ? `${STYLE_TAGS}, 1girl, solo, mature female, ${traits}, ${model.wardrobe}, ${shot.tags}, every character an adult`
          : `${STYLE_PROSE} ${name}: ${traits}. ${shot.prose} ${kind === 'softcore' ? 'Softcore and artistic' : 'Suggestive and playful'}, every character an adult.`,
      negativePrompt: kind === 'softcore' ? SOFTCORE_NEGATIVE : PINUP_NEGATIVE,
      width: 832,
      height: 1216,
      seed: stableSeed(`${character}:${kind}:${lane.key}:${Date.now()}`),
      isMature: true,
      isPublic: false,
      projectSlug: 'monstress-convention',
      designer: 'Monstrique Studio',
      priority: 60,
    },
  }))
}
