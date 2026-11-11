/**
 * MONSTRIQUE art styles and the prompt composer.
 *
 * The story is told in more than one medium: the 2D point-and-click game, a
 * retro pixel variant, 3D animated cutscenes between chapters, a pencil
 * storyboard for previz and, for the mature edition only, pin-up scrapbook
 * cards. A style says how to paint; a character model (characterModels.ts)
 * says who is being painted. `composeCharacterPrompt` and `composeShotPrompt`
 * join the two and return an ArtJob-shaped request (POST /api/art/enqueue),
 * stacking each character's identity LoRA once it is trained.
 *
 * Nothing here enqueues art. Callers own that, and queued is not delivered.
 */
import type { MonstriqueAudience } from '../monstressConvention/edition'
import {
  CHARACTER_MODELS,
  LORA_DATASET_SHOTS,
  expressionPrompt,
  type CharacterModel,
  type LoraShotId,
  type MonstriqueCharacterId,
} from './characterModels'

export type ArtStyleId =
  | 'adventure-2d'
  | 'pixel-retro'
  | 'cutscene-3d'
  | 'storyboard'
  | 'scrapbook-pinup'
  | 'model-sheet'

export interface ArtStyle {
  id: ArtStyleId
  label: string
  medium: '2d' | '3d'
  use: string
  prompt: string
  negative: string
  engine: 'krea2' | 'flux2'
  width: number
  height: number
  /** Only ever composed for a verified mature audience. */
  matureOnly: boolean
}

export const ART_STYLES: Record<ArtStyleId, ArtStyle> = {
  'adventure-2d': {
    id: 'adventure-2d',
    label: '2D point-and-click',
    medium: '2d',
    use: 'Room backgrounds, stage sprites, dialogue portraits and close-up inserts in the playable game.',
    prompt:
      'hand-painted 2D point-and-click adventure game art, 1990s comedy adventure meets modern HD cartoon, bold ink outlines, caricature proportions with big expressive heads, saturated neon noir palette, flat cel shading with painted backgrounds',
    negative: 'photorealistic, 3d render, plastic CGI',
    engine: 'krea2',
    width: 1344,
    height: 768,
    matureOnly: false,
  },
  'pixel-retro': {
    id: 'pixel-retro',
    label: 'Retro pixel',
    medium: '2d',
    use: 'Optional retro skin and the in-game arcade cabinet; same rooms, same cast, 256-colour pixel art.',
    prompt:
      'VGA-era 256-colour pixel art adventure game screen, chunky dithered shading, low-resolution sprites with big heads, crisp pixel grid',
    negative: 'smooth gradients, photorealistic, blurry, anti-aliased painting',
    engine: 'krea2',
    width: 1280,
    height: 800,
    matureOnly: false,
  },
  'cutscene-3d': {
    id: 'cutscene-3d',
    label: '3D animated cutscene',
    medium: '3d',
    use: 'Interstitial animated cutscenes between chapters and on story beats; key frames and turnarounds for animation.',
    prompt:
      'stylized 3D animated feature film still, squash-and-stretch cartoon character design, exaggerated caricature proportions, subsurface skin, soft global illumination, cinematic rim light, neon rain reflections',
    negative: 'flat 2d, pixel art, photorealistic humans, uncanny valley',
    engine: 'flux2',
    width: 1536,
    height: 640,
    matureOnly: false,
  },
  storyboard: {
    id: 'storyboard',
    label: 'Storyboard',
    medium: '2d',
    use: 'Rough animatic panels for planning a cutscene before 3D work starts.',
    prompt:
      'rough pencil storyboard panel, loose gesture drawing, grey marker tones, arrows for camera moves, comedic animation storyboard',
    negative: 'colour painting, finished render',
    engine: 'krea2',
    width: 1344,
    height: 768,
    matureOnly: false,
  },
  'scrapbook-pinup': {
    id: 'scrapbook-pinup',
    label: 'Scrapbook pin-up',
    medium: '2d',
    use: 'Mature-edition gratitude cards: suggestive retro glamour, always covered, never explicit.',
    prompt:
      'tasteful retro pin-up glamour illustration, 1950s calendar painting, playful wink, fully clothed, suggestive not explicit, gouache texture',
    negative: 'nude, nudity, explicit, sexual act',
    engine: 'krea2',
    width: 832,
    height: 1216,
    matureOnly: true,
  },
  'model-sheet': {
    id: 'model-sheet',
    label: 'Model sheet',
    medium: '2d',
    use: 'Style-neutral identity renders for LoRA training datasets.',
    prompt:
      'clean character model sheet render, plain light grey background, even studio lighting, neutral colour grading, full colour, consistent design',
    negative:
      'busy background, dramatic lighting, motion blur, text, watermark',
    engine: 'flux2',
    width: 1024,
    height: 1024,
    matureOnly: false,
  },
}

/** Applied to every Monstrique render, in every style and edition. */
export const UNIVERSAL_NEGATIVE = [
  'child',
  'minor',
  'teen',
  'underage',
  'school uniform',
  'nude',
  'explicit',
  'gore',
  'blood spray',
  'real person likeness',
  'watermark',
  'text artifacts',
]

export interface ArtRequest {
  engine: ArtStyle['engine']
  promptString: string
  negativePrompt: string
  width: number
  height: number
  seed: number
  loras: Array<{ name: string; strength: number }>
  isMature: boolean
  isPublic: false
  projectSlug: 'monstress-convention'
}

export interface CastSlot {
  character: MonstriqueCharacterId
  expression?: string
  pose?: string
  /** A ghost drawn alive, before the murders: solid, not translucent. */
  living?: boolean
}

function stableSeed(text: string): number {
  let hash = 2166136261
  for (const char of text) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % 2147483647
}

function identityPhrase(model: CharacterModel): string {
  const traits =
    model.lora.status === 'trained'
      ? model.identity.slice(0, 2)
      : model.identity
  return [model.lora.trigger, model.name, ...traits].join(', ')
}

function castPhrase(slot: CastSlot): string {
  const model = CHARACTER_MODELS[slot.character]
  return [
    slot.living && model.sprite.ghost
      ? 'alive and solid before her death, ' +
        identityPhrase(model).replace(
          / ghost|, translucent[^,]*|, soft [a-z]+ glow| with a soft [a-z]+ glow/g,
          '',
        )
      : identityPhrase(model),
    expressionPrompt(model, slot.expression),
    slot.pose,
  ]
    .filter(Boolean)
    .join(', ')
}

function loraStack(slots: CastSlot[]): ArtRequest['loras'] {
  const seen = new Set<string>()
  const stack: ArtRequest['loras'] = []
  for (const slot of slots) {
    const plan = CHARACTER_MODELS[slot.character].lora
    if (plan.status !== 'trained' || !plan.resourceName) continue
    if (seen.has(plan.resourceName)) continue
    seen.add(plan.resourceName)
    stack.push({ name: plan.resourceName, strength: plan.strength })
  }
  return stack.slice(0, 4)
}

function negativeFor(style: ArtStyle, slots: CastSlot[]): string {
  const never = slots.flatMap((slot) => [
    ...CHARACTER_MODELS[slot.character].never,
    ...(slot.living && CHARACTER_MODELS[slot.character].sprite.ghost
      ? ['ghost', 'translucent']
      : []),
  ])
  return [...new Set([...UNIVERSAL_NEGATIVE, style.negative, ...never])].join(
    ', ',
  )
}

/** Mature-only styles and non-general characters are refused for general. */
export function styleAllowed(
  styleId: ArtStyleId,
  audience: MonstriqueAudience,
): boolean {
  return audience === 'mature' || !ART_STYLES[styleId].matureOnly
}

export function composeCharacterPrompt(input: {
  character: MonstriqueCharacterId
  style: ArtStyleId
  audience: MonstriqueAudience
  expression?: string
  pose?: string
  setting?: string
}): ArtRequest | null {
  const style = ART_STYLES[input.style]
  const model = CHARACTER_MODELS[input.character]
  if (!styleAllowed(input.style, input.audience)) return null
  if (input.audience === 'general' && !model.general) return null
  const slot: CastSlot = {
    character: input.character,
    expression: input.expression,
    pose: input.pose,
  }
  const promptString = [
    style.prompt,
    castPhrase(slot),
    model.apparentAge,
    model.wardrobe,
    input.setting,
  ]
    .filter(Boolean)
    .join(', ')
  return {
    engine: style.engine,
    promptString,
    negativePrompt: negativeFor(style, [slot]),
    width: style.width,
    height: style.height,
    seed: stableSeed(input.character + ':' + input.style),
    loras: loraStack([slot]),
    isMature: style.matureOnly,
    isPublic: false,
    projectSlug: 'monstress-convention',
  }
}

export interface ShotArtInput {
  id: string
  setting: string
  cast: CastSlot[]
  action: string
  framing: string
}

/**
 * One story beat, rendered in any medium. The same shot gives a 2D panel, a
 * pixel screen or a 3D key frame, so cutscenes and the game stay one story.
 */
export function composeShotPrompt(
  shot: ShotArtInput,
  styleId: ArtStyleId,
  audience: MonstriqueAudience,
): ArtRequest | null {
  const style = ART_STYLES[styleId]
  if (!styleAllowed(styleId, audience)) return null
  if (
    audience === 'general' &&
    shot.cast.some((slot) => !CHARACTER_MODELS[slot.character].general)
  )
    return null
  const promptString = [
    style.prompt,
    shot.framing,
    shot.setting,
    shot.action,
    ...shot.cast.map(castPhrase),
    'every character an adult',
  ].join(', ')
  return {
    engine: style.engine,
    promptString,
    negativePrompt: negativeFor(style, shot.cast),
    width: style.width,
    height: style.height,
    seed: stableSeed(shot.id + ':' + styleId),
    loras: loraStack(shot.cast),
    isMature: style.matureOnly,
    isPublic: false,
    projectSlug: 'monstress-convention',
  }
}

export interface LoraDatasetEntry {
  shot: LoraShotId
  /** Training caption: trigger first, then the tags the LoRA should not absorb. */
  caption: string
  request: ArtRequest
}

/**
 * The model-sheet renders to generate, review and caption for one character's
 * identity LoRA. A human approves every image before it joins a dataset.
 */
export function loraDatasetPlan(
  character: MonstriqueCharacterId,
): LoraDatasetEntry[] {
  const model = CHARACTER_MODELS[character]
  const style = ART_STYLES['model-sheet']
  return LORA_DATASET_SHOTS.map((shot) => {
    const slot: CastSlot = { character, pose: shot.pose }
    return {
      shot: shot.id,
      caption: [
        model.lora.trigger,
        shot.framing,
        shot.view,
        shot.pose,
        'plain grey background',
      ].join(', '),
      request: {
        engine: style.engine,
        promptString: [
          style.prompt,
          shot.framing,
          shot.view,
          castPhrase(slot),
          model.apparentAge,
          model.wardrobe,
        ].join(', '),
        negativePrompt: negativeFor(style, [slot]),
        width: style.width,
        height: style.height,
        seed: stableSeed(character + ':' + shot.id),
        loras: [],
        isMature: false,
        isPublic: false,
        projectSlug: 'monstress-convention',
      },
    }
  })
}
