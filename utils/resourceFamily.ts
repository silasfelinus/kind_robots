// /utils/resourceFamily.ts
//
// The model family a Resource belongs to, for BROWSING.
//
// Resource.generation is whatever string the importer, Civitai or a human
// wrote: "1.5", "SD 1.5", "SDXL 1.0", "base", "ARCHIVE", "Flux (from
// metadata)", "Flux.1 D", "Flux.2 Klein 9B". Filtering on it raw put a dozen
// spellings of four families in one dropdown. This collapses them to the
// families that actually load differently.
//
// The directory wins for the SD lineage, same rule as utils/checkpointProfiles:
// the importer files every row under its family folder and that has been right
// where `generation` was stale (an SD 1.5 model recorded as SDXL, a Pony model
// under `base`). Text then decides, then supportedServer as the last resort.
//
// Not utils/loraProbe's classifyLoraFamily: that answers "can a still probe
// render this", so it folds Flux.2, Kontext, video and audio into one
// 'unsupported' bucket. Browsing needs them apart.

export const RESOURCE_FAMILIES = [
  'sd15',
  'sdxl',
  'pony',
  'illustrious',
  'flux1-dev',
  'flux1-schnell',
  'flux1-kontext',
  'flux2',
  'krea2',
  'zimage',
  'qwen',
  'anima',
  'wan',
  'ltx',
  'hunyuan',
  'audio',
  'other',
] as const

export type ResourceFamily = (typeof RESOURCE_FAMILIES)[number]

export const RESOURCE_FAMILY_LABELS: Record<ResourceFamily, string> = {
  sd15: 'SD 1.5',
  sdxl: 'SDXL',
  pony: 'Pony',
  illustrious: 'Illustrious / NoobAI',
  'flux1-dev': 'Flux.1 Dev',
  'flux1-schnell': 'Flux.1 Schnell',
  'flux1-kontext': 'Flux.1 Kontext',
  flux2: 'Flux.2 / Klein',
  krea2: 'Krea 2',
  zimage: 'Z-Image',
  qwen: 'Qwen',
  anima: 'Anima',
  wan: 'Wan Video',
  ltx: 'LTX Video',
  hunyuan: 'Hunyuan',
  audio: 'Audio',
  other: 'Other',
}

export type ResourceFamilyInput = {
  generation?: string | null
  supportedServer?: string | null
  localPath?: string | null
}

const DIRECTORY_FAMILY: Record<string, ResourceFamily> = {
  sd15: 'sd15',
  'sd1.5': 'sd15',
  '1.5': 'sd15',
  sdxl: 'sdxl',
  pony: 'pony',
  illustrious: 'illustrious',
  noobai: 'illustrious',
  zimage: 'zimage',
  qwen: 'qwen',
  audio: 'audio',
}

function familyFromPath(localPath: string): ResourceFamily | null {
  const parts = localPath
    .replaceAll('\\', '/')
    .toLowerCase()
    .split('/')
    .filter(Boolean)
  if (parts.length < 2) return null
  const [dir, sub] = parts
  if (dir === 'video') {
    if (sub === 'wan') return 'wan'
    if (sub === 'ltx') return 'ltx'
    if (sub === 'hunyuan') return 'hunyuan'
    return null
  }
  return DIRECTORY_FAMILY[dir ?? ''] ?? null
}

function familyFromText(text: string): ResourceFamily | null {
  if (!text) return null
  if (text.includes('pony')) return 'pony'
  if (text.includes('illustrious') || text.includes('noob')) {
    return 'illustrious'
  }
  if (text.includes('kontext')) return 'flux1-kontext'
  if (/flux[\s._-]*2|klein/.test(text)) return 'flux2'
  if (text.includes('krea')) return 'krea2'
  if (/z[\s._-]*image/.test(text)) return 'zimage'
  if (text.includes('qwen')) return 'qwen'
  if (text.includes('anima')) return 'anima'
  if (/\bwan\b/.test(text)) return 'wan'
  if (text.includes('ltx')) return 'ltx'
  if (text.includes('hunyuan')) return 'hunyuan'
  if (text.includes('audio') || text.includes('ace step')) return 'audio'
  if (text.includes('flux')) {
    return /schnell|flux[\s._-]*1[\s._-]*s\b/.test(text)
      ? 'flux1-schnell'
      : 'flux1-dev'
  }
  if (/sd[\s._-]*1\.?5|^1\.5$/.test(text)) return 'sd15'
  if (text.includes('sdxl') || /\bxl\b/.test(text)) return 'sdxl'
  return null
}

const SERVER_FAMILY: Record<string, ResourceFamily> = {
  SD15: 'sd15',
  SDXL: 'sdxl',
  FLUX: 'flux1-dev',
  KONTEXT: 'flux1-kontext',
  LTX: 'ltx',
  WAN: 'wan',
}

const SDXL_DERIVATIVES: ReadonlySet<ResourceFamily> = new Set([
  'pony',
  'illustrious',
])

export function resourceFamily(resource: ResourceFamilyInput): ResourceFamily {
  const byPath = familyFromPath(String(resource.localPath || '').trim())
  const byText = familyFromText(
    String(resource.generation || '')
      .trim()
      .toLowerCase(),
  )

  // An SDXL/ folder is the architecture, not the lineage: a Pony or
  // Illustrious row filed there is still Pony or Illustrious.
  if (byPath === 'sdxl' && byText && SDXL_DERIVATIVES.has(byText)) {
    return byText
  }
  if (byPath) return byPath
  if (byText) return byText

  const server = String(resource.supportedServer || '')
    .trim()
    .toUpperCase()
  return SERVER_FAMILY[server] ?? 'other'
}

export function resourceFamilyLabel(resource: ResourceFamilyInput): string {
  return RESOURCE_FAMILY_LABELS[resourceFamily(resource)]
}
