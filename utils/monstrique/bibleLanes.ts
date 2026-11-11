/**
 * Render lanes the Monstrique series bible can request art on: the house
 * Illustrious checkpoints (Arthemy first) and Krea 2. Realism Illustrious By
 * and Miaomiao 3D are excluded: in the first pin-up batch (2026-11-11) they
 * ignored the no-nudity negatives and rendered explicit or near-explicit
 * images, which Monstrique never allows. Prompt recipes for
 * these lanes live server-side in server/utils/monstriqueBible.ts.
 */
export interface BibleLane {
  key: string
  label: string
  engine: 'comfy' | 'krea2'
  checkpoint?: string
  prompt: 'tags' | 'prose'
}

export const BIBLE_LANES: BibleLane[] = [
  {
    key: 'arthemy',
    label: 'Arthemy Western Art',
    engine: 'comfy',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    prompt: 'tags',
  },
  {
    key: 'illustrij',
    label: 'Illustrij',
    engine: 'comfy',
    checkpoint: 'Illustrious/illustrij_v21.safetensors',
    prompt: 'tags',
  },
  {
    key: 'ntrmix',
    label: 'NTR Mix',
    engine: 'comfy',
    checkpoint: 'Illustrious/ntrMIXIllustriousXL_xii.safetensors',
    prompt: 'tags',
  },
  {
    key: 'furrytoon',
    label: 'Furrytoon Mix',
    engine: 'comfy',
    checkpoint: 'Illustrious/furrytoonmix_xlV3.safetensors',
    prompt: 'tags',
  },
  {
    key: 'ill-realism',
    label: 'Illustrious Realism',
    engine: 'comfy',
    checkpoint: 'Illustrious/illustriousRealism_ilXL10V40.safetensors',
    prompt: 'tags',
  },
  { key: 'krea2', label: 'Krea 2', engine: 'krea2', prompt: 'prose' },
]

export type BibleArtKind = 'swimsuit' | 'shower' | 'portrait' | 'lora-dataset'

export const BIBLE_ART_KINDS: Array<{
  id: BibleArtKind
  label: string
  monsterStarsOnly: boolean
}> = [
  { id: 'portrait', label: 'Character portrait', monsterStarsOnly: false },
  { id: 'swimsuit', label: 'Cheesecake swimsuit', monsterStarsOnly: true },
  { id: 'shower', label: 'Steamy shower pin-up', monsterStarsOnly: true },
  {
    id: 'lora-dataset',
    label: 'LoRA dataset (10 renders)',
    monsterStarsOnly: false,
  },
]

export const LORA_STATUSES = [
  'dataset-needed',
  'dataset-requested',
  'dataset-ready',
  'training',
  'trained',
] as const
export type LoraStatus = (typeof LORA_STATUSES)[number]
