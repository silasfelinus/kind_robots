// A private controlled bake-off, not a source of playable character names.
// Species are visual-art metadata only. The Conductor ledger owns ArtJob IDs.
export const DEEPHEART_STYLE_DESIGNER =
  'Deepheart Anthro Style Trial 2026-11-16'
export const DEEPHEART_STYLE_PROJECT = 'deepheart'

export const DEEPHEART_APPROVED_ART_MODELS = {
  standard: {
    lane: 'krea2',
    engine: 'krea2',
    label: 'Krea 2',
  },
  afterHours: {
    lane: 'furrytoon',
    engine: 'comfy',
    checkpoint: 'Illustrious/furrytoonmix_xlV3.safetensors',
    label: 'Furrytoon Mix XL v3',
    requiresMatureOptIn: true,
    requiresUnlockedRomance: true,
  },
} as const

export const DEEPHEART_STYLE_SUBJECTS = [
  {
    key: 'guardian-oona',
    title: 'Oona Vell',
    subtitle: 'Hero portrait · sturdy guardian',
    purpose: 'Broad adult body, fur, eyes and readable shield silhouette',
    seed: 2373001,
    aspect: '2 / 3',
    kind: 'character',
  },
  {
    key: 'rogue-vex',
    title: 'Vex Marlowe',
    subtitle: 'Companion portrait · agile rogue',
    purpose: 'Nonbinary expression, bat anatomy, coat and wing structure',
    seed: 2373002,
    aspect: '2 / 3',
    kind: 'character',
  },
  {
    key: 'ossuary-horror',
    title: 'The Ossuary Horror',
    subtitle: 'Monster · first layer',
    purpose: 'Unsettling original monster design, cinematic danger',
    seed: 2373003,
    aspect: '16 / 9',
    kind: 'monster',
  },
  {
    key: 'bone-court-fight',
    title: 'The Broken Shield',
    subtitle: 'Combat · violent dungeon world',
    purpose: 'Animated action, continuity, scale and mature dramatic staging',
    seed: 2373004,
    aspect: '16 / 9',
    kind: 'combat',
  },
  {
    key: 'waterfall-vow',
    title: 'The Waterfall Vow',
    subtitle: 'Romance · adult partners',
    purpose: 'Gentle intimate acting, waterfall occlusion and tasteful framing',
    seed: 2373005,
    aspect: '16 / 9',
    kind: 'romance',
  },
] as const

// The six existing Monstrique bible Illustrious lanes, plus Nova Comic and
// Krea 2. Keep these aligned with the approved installed checkpoint names.
export const DEEPHEART_STYLE_LANES = [
  {
    key: 'arthemy',
    title: 'Arthemy Western Art',
    model: 'arthemyWesternArt_v30',
    family: 'Illustrious',
    tone: 'Western animation house contender',
  },
  {
    key: 'nova-comic',
    title: 'Nova Comic XL',
    model: 'novaComicXL_v20',
    family: 'Illustrious',
    tone: 'Bold graphic inks',
  },
  {
    key: 'illustrij',
    title: 'Illustrij v2.1',
    model: 'illustrij_v21',
    family: 'Illustrious',
    tone: 'Expressive illustrated acting',
  },
  {
    key: 'ntrmix',
    title: 'NTR Mix',
    model: 'ntrMIXIllustriousXL_xii',
    family: 'Illustrious',
    tone: 'Stylized character challenger',
  },
  {
    key: 'furrytoon',
    title: 'Furrytoon Mix',
    model: 'furrytoonmix_xlV3',
    family: 'Illustrious',
    tone: 'Animal anatomy challenger',
  },
  {
    key: 'ill-realism',
    title: 'Illustrious Realism',
    model: 'illustriousRealism_ilXL10V40',
    family: 'Illustrious',
    tone: 'Painterly dramatic challenger',
  },
  {
    key: 'realism-by',
    title: 'Realism Illustrious By',
    model: 'realismIllustriousBy_v55FP16',
    family: 'Illustrious',
    tone: 'Private mature-only challenger',
  },
  {
    key: 'krea2',
    title: 'Krea 2',
    model: 'Krea-2-Turbo',
    family: 'Krea 2',
    tone: 'Natural-language animation contender',
  },
] as const

export const DEEPHEART_STYLE_CRITERIA = [
  { key: 'anthro', label: 'Unmistakable animal anatomy' },
  { key: 'cartoon', label: 'Western animation appeal' },
  { key: 'acting', label: 'Expressive adult character acting' },
  { key: 'world', label: 'Danger and atmospheric continuity' },
] as const

export type DeepheartStyleJob = {
  jobId: number
  subjectKey: (typeof DEEPHEART_STYLE_SUBJECTS)[number]['key']
  laneKey: (typeof DEEPHEART_STYLE_LANES)[number]['key']
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId: number | null
  updatedAt: string | null
  priority: number
  error: string | null
}

export function deepheartStyleLaneFromModel(model: string) {
  const check = model.toLowerCase()
  // Krea jobs may not report an explicit checkpoint in the payload.
  return (
    DEEPHEART_STYLE_LANES.find((lane) =>
      check.includes(lane.model.toLowerCase()),
    )?.key ?? null
  )
}

export function deepheartStyleLaneFromRequest(
  requestKey: string,
  checkpoint: string,
) {
  return (
    DEEPHEART_STYLE_LANES.find((lane) =>
      requestKey.includes('@' + lane.key + '='),
    )?.key ?? deepheartStyleLaneFromModel(checkpoint)
  )
}
