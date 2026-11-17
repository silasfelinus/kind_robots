export const K8_ANIMALS = [
  {
    name: 'Anemone',
    quote: 'The market may continue without me.',
    side: 'right',
    file: '00-anemone.webp',
  },
  {
    name: 'Snail',
    quote: 'Please respect my personal liquidity.',
    side: 'left',
    file: '01-snail.webp',
  },
  {
    name: 'Sloth',
    quote: 'I have reviewed the charts. Eventually.',
    side: 'right',
    file: '02-sloth.webp',
  },
  {
    name: 'Tortoise',
    quote: 'An empire built one tiny step at a time.',
    side: 'left',
    file: '03-tortoise.webp',
  },
  {
    name: 'Capybara',
    quote: 'Unbothered, moisturized, moderately invested.',
    side: 'right',
    file: '04-capybara.webp',
  },
  {
    name: 'Otter',
    quote: 'One paw on the wheel. One on a shiny rock.',
    side: 'left',
    file: '05-otter.webp',
  },
  {
    name: 'Fox',
    quote: 'I have a plan. I refuse to share it.',
    side: 'right',
    file: '06-fox.webp',
  },
  {
    name: 'Cheetah',
    quote: 'Faster decisions. Same limited treasury.',
    side: 'left',
    file: '07-cheetah.webp',
  },
  {
    name: 'Honey Badger',
    quote: 'The spreadsheets have started to fear me.',
    side: 'right',
    file: '08-honey-badger.webp',
  },
  {
    name: 'Phoenix',
    quote: 'My risk tolerance has developed a soundtrack.',
    side: 'left',
    file: '09-phoenix.webp',
  },
  {
    name: 'Dragon',
    quote: 'I AM THE FANCY BUTTONS.',
    side: 'right',
    file: '10-dragon.webp',
  },
] as const

export const K8_PROFILE_FIELDS = [
  'kFactor',
  'minIntervalMs',
  'maxIntervalMs',
  'entryOffsetBps',
  'entryOffsetUpBps',
  'entryOffsetDownBps',
  'orderStaleMs',
  'cautionScale',
  'trendScale',
  'maxCycleBuys',
  'mergeProximityScale',
  'maxDeploymentPercent',
] as const

export type K8ProfileField = (typeof K8_PROFILE_FIELDS)[number]
export type K8Profile = Record<K8ProfileField, number>
export type K8ProfileDraft = Partial<K8Profile>
export type K8Snapshot = {
  scope: { exchange: string; pair: string }
  config: K8ProfileDraft & {
    maxUsdcDeployed?: number
    maxDrawdownPercent?: number
    dryRun?: boolean
  }
  presets: Record<string, K8ProfileDraft>
  levelOverrides: Record<string, K8ProfileDraft>
  status: { isRunning: boolean; isDryRun: boolean }
  fingerprint: string
  savedLevel: number | null
  appliedLevel: number | null
  readonly: boolean
  allocatedQuote: number | null
  pendingBuyOrders: number | null
  metrics: {
    asset: string
    heldAsset: number | null
    fundEquityQuote: number | null
    realizedPnlQuote: number | null
    accountBalanceQuote: number | null
    positionValueQuote: number | null
    cyclesCompleted: number | null
    valuationNote: string
  }
}

const IMAGE_ORIGIN =
  'https://raw.githubusercontent.com/silasfelinus/critical-mass/main/admin/public/k8-animals/'

export function k8Artwork(level: number, variant = ''): string {
  const animal = K8_ANIMALS[level]
  return animal ? IMAGE_ORIGIN + variant + animal.file : ''
}

const ANCHORS = [
  { level: 1, preset: 'conservative' },
  { level: 4, preset: 'moderate' },
  { level: 7, preset: 'aggressive' },
  { level: 10, preset: 'maximum' },
] as const

const INTEGER_FIELDS = new Set<K8ProfileField>([
  'minIntervalMs',
  'maxIntervalMs',
  'orderStaleMs',
  'maxCycleBuys',
  'entryOffsetBps',
  'entryOffsetUpBps',
  'entryOffsetDownBps',
])

export function k8RiskParams(
  level: number,
  presets?: K8Snapshot['presets'],
  overrides: K8Snapshot['levelOverrides'] = {},
): K8ProfileDraft | null {
  if (!Number.isInteger(level) || level < 1 || level > 10 || !presets)
    return null
  const lower = [...ANCHORS].reverse().find((item) => item.level <= level)
  const upper = ANCHORS.find((item) => item.level >= level)
  if (!lower || !upper) return null
  const from = presets[lower.preset]
  const to = presets[upper.preset]
  if (!from || !to) return null
  const fraction =
    lower.level === upper.level
      ? 0
      : (level - lower.level) / (upper.level - lower.level)
  const params: K8ProfileDraft = {}
  for (const key of K8_PROFILE_FIELDS) {
    if (key === 'maxDeploymentPercent') continue
    const first = from[key]
    const last = to[key]
    if (
      typeof first !== 'number' ||
      typeof last !== 'number' ||
      !Number.isFinite(first) ||
      !Number.isFinite(last)
    )
      return null
    const value = first + (last - first) * fraction
    params[key] = INTEGER_FIELDS.has(key)
      ? Math.round(value)
      : Number(value.toFixed(3))
  }
  return {
    ...params,
    maxDeploymentPercent: level * 10,
    ...(overrides[String(level)] || {}),
  }
}

export const k8Money = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : 'Unavailable'
