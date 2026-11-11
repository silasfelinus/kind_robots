/**
 * Render lanes the Monstrique series bible can request art on: the house
 * Illustrious checkpoints (Arthemy first) and Krea 2, plus one nudity lane.
 * Realism Illustrious By renders nudity even when told not to, so it is the
 * dedicated softcore lane (Silas, 2026-11-11: "a nudity checkpoint should not
 * be fully excluded"): mature edition only, adults only, nudity allowed,
 * explicit sex acts excluded. Miaomiao 3D stays out: it also broke the
 * lookbook's age and body rules. Prompt recipes for
 * these lanes live server-side in server/utils/monstriqueBible.ts.
 */
export interface BibleLane {
  key: string
  label: string
  engine: 'comfy' | 'krea2'
  checkpoint?: string
  prompt: 'tags' | 'prose'
  /** The softcore nudity lane. Only lanes with this flag take 'softcore'. */
  nudity?: boolean
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
  {
    key: 'realism-by',
    label: 'Realism Illustrious By · softcore',
    engine: 'comfy',
    checkpoint: 'Illustrious/realismIllustriousBy_v55FP16.safetensors',
    prompt: 'tags',
    nudity: true,
  },
]

export type BibleArtKind =
  'swimsuit' | 'shower' | 'softcore' | 'portrait' | 'lora-dataset'

export const BIBLE_ART_KINDS: Array<{
  id: BibleArtKind
  label: string
  monsterStarsOnly: boolean
}> = [
  { id: 'portrait', label: 'Character portrait', monsterStarsOnly: false },
  { id: 'swimsuit', label: 'Cheesecake swimsuit', monsterStarsOnly: true },
  { id: 'shower', label: 'Steamy shower pin-up', monsterStarsOnly: true },
  { id: 'softcore', label: 'Softcore unlock (nudity)', monsterStarsOnly: true },
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
