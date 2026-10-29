// One benchmark shared by Prom of Doom and Every Villain Tactics.
// The Conductor art ledger owns the complete generation prompts and ArtJob IDs.
export const CAPES_STYLE_ROUND = 'capes-western-style-check-v1'
export const CAPES_STYLE_DESIGNER = 'Capes Style Check 2026-10-29'
export const CAPES_STYLE_PROJECT = 'comet-city-academy'

export const CAPES_STYLE_SUBJECTS = [
  { key: 'cornerstone-hero', title: 'Cornerstone', subtitle: 'Hero splash poster', seed: 629101, aspect: '2 / 3', purpose: 'Hero silhouette, costume and dramatic anatomy' },
  { key: 'backdraft-villain', title: 'Backdraft', subtitle: 'Villain splash poster', seed: 629102, aspect: '2 / 3', purpose: 'Villain silhouette and mature lighting' },
  { key: 'warren-wreckers', title: 'Warren Wreckers', subtitle: 'One-hit henchman poster', seed: 629103, aspect: '2 / 3', purpose: 'Readable creature designs without mascot drift' },
  { key: 'mags-hardpan', title: 'Mags Hardpan', subtitle: 'Powered lieutenant poster', seed: 629104, aspect: '2 / 3', purpose: 'Distinctive supporting cast and prop anatomy' },
  { key: 'science-lab', title: 'Science lab', subtitle: 'Story reaction illustration', seed: 629105, aspect: '16 / 9', purpose: 'Facial emotion, scene geography and compositing' },
  { key: 'firewall-standee', title: 'Firewall', subtitle: '2:1 tactical model', seed: 629106, aspect: '2 / 1', purpose: 'Full-body outline and small-screen combat readability' },
] as const

export const CAPES_STYLE_LANES = [
  { key: 'krea2', title: 'Krea 2', family: 'Qwen / concrete prose', model: 'Krea-2-Turbo', tone: 'Clean scene composition' },
  { key: 'arthemy', title: 'Arthemy Western Art', family: 'Illustrious / caption tags', model: 'arthemyWesternArt_v30', tone: 'Existing Western Art benchmark' },
  { key: 'nova-comic', title: 'Nova Comic XL', family: 'Illustrious / caption tags', model: 'novaComicXL_v20', tone: 'Inked superhero language' },
  { key: 'illustrij', title: 'Illustrij v2.1', family: 'Illustrious / caption tags', model: 'illustrij_v21', tone: 'Expressive line-art challenger' },
  { key: 'dreamshaper', title: 'DreamShaper XL', family: 'SDXL Turbo / concise prose', model: 'dreamshaperXL_v21TurboDPMSDE', tone: 'Broad shape consistency' },
  { key: 'unstable', title: 'Unstable Diffusers', family: 'SDXL / scene prose', model: 'sdxlUnstableDiffusers_nihilmania', tone: 'Painterly wildcard' },
] as const

export type CapesStyleSubjectKey = (typeof CAPES_STYLE_SUBJECTS)[number]['key']
export type CapesStyleLaneKey = (typeof CAPES_STYLE_LANES)[number]['key']

export const CAPES_STYLE_CRITERIA = [
  { key: 'western', label: 'Mature Western animation' },
  { key: 'acting', label: 'Facial acting' },
  { key: 'silhouette', label: 'Readability at card size' },
  { key: 'consistency', label: 'Reusable art direction' },
] as const

export type CapesStyleJob = {
  jobId: number
  subjectKey: CapesStyleSubjectKey
  laneKey: CapesStyleLaneKey
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId: number | null
  updatedAt: string | null
  priority: number
  error: string | null
  prompt: string
}

export function capesStyleCellKey(subject: string, lane: string): string {
  return subject + ':' + lane
}

export function capesStyleLaneFromModel(model: string): CapesStyleLaneKey | null {
  const normalized = model.toLowerCase()
  const lane = CAPES_STYLE_LANES.find((option) =>
    normalized.includes(option.model.toLowerCase()),
  )
  return lane?.key ?? null
}
