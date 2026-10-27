import { SITE_ORIGIN } from './sharePreview'

export const FUNDRAISER_URL = 'https://www.againstmalaria.com/amibot'
export const FUNDRAISER_SHARE_TEXT =
  'Kind Robots makes free games and raises money for bed nets. Help AMI protect families from malaria:'

export const PROMPT_EVERY = 3
export const PROMPT_COOLDOWN_MS = 30 * 60 * 1000
export const GAVE_QUIET_MS = 30 * 24 * 60 * 60 * 1000
export const PLAY_PROMPT_DELAY_MS = 60 * 1000

export type ShareTarget = {
  key: 'x' | 'facebook' | 'bluesky' | 'reddit' | 'whatsapp' | 'email'
  label: string
  icon: string
  href: string
}

export type SupportProgress = {
  plays: number
  runs: number
  lastPromptAt: number
  gaveAt: number
}

export const EMPTY_SUPPORT_PROGRESS: SupportProgress = {
  plays: 0,
  runs: 0,
  lastPromptAt: 0,
  gaveAt: 0,
}

export function shareableUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const clean = (path || '/').split('#')[0] || '/'
  return SITE_ORIGIN + (clean.startsWith('/') ? clean : '/' + clean)
}

export function buildShareTargets(input: {
  url: string
  text: string
}): ShareTarget[] {
  const url = encodeURIComponent(input.url)
  const text = encodeURIComponent(input.text)
  const both = encodeURIComponent(input.text + ' ' + input.url)
  return [
    {
      key: 'x',
      label: 'X',
      icon: 'kind-icon:twitter',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: 'kind-icon:facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    },
    {
      key: 'bluesky',
      label: 'Bluesky',
      icon: 'kind-icon:butterfly',
      href: `https://bsky.app/intent/compose?text=${both}`,
    },
    {
      key: 'reddit',
      label: 'Reddit',
      icon: 'kind-icon:globe',
      href: `https://www.reddit.com/submit?url=${url}&title=${text}`,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: 'kind-icon:chat',
      href: `https://wa.me/?text=${both}`,
    },
    {
      key: 'email',
      label: 'Email',
      icon: 'kind-icon:message',
      href: `mailto:?subject=${text}&body=${both}`,
    },
  ]
}

export function playSlugFromPath(path: string): string | null {
  const match = /^\/play\/([a-z0-9-]+)/i.exec(
    (path || '').split(/[?#]/)[0] ?? '',
  )
  return match?.[1]?.toLowerCase() ?? null
}

const PLAY_TITLES: Record<string, string> = {
  arcade: 'the Kind Robots Arcade',
  'comet-city-academy': 'Prom of Doom',
  'game-of-captains': 'Space Couch',
  'crystal-street': 'Terrors on Crystal Street',
  'emperor-of-dust': 'Emperor of Dust',
  'save-the-plumber': 'Save the Plumber',
  'rainbow-bullet-hell-space-princess': 'Rainbow Bullet Hell Space Princess',
  'zuzu-pinball': 'Zuzu Pinball',
  'zuzu-shifting-lands': 'Zuzu: Shifting Lands',
  'zuzu-gamebook': 'the Zuzu Gamebook',
  'zuzu-showdown': 'Zuzu Showdown',
  ecotone: 'Ecotone: Weird Humboldt',
  'shifting-desks': 'Shifting Desks',
  aquarium: 'Cthulhuquarium',
  memory: 'Memory Dungeon',
  mandarin: 'the Mandarin Tutor',
}

export function playTitleFromPath(
  path: string,
  arcadeTitle?: (slug: string) => string | undefined,
): string | undefined {
  const slug = playSlugFromPath(path)
  if (!slug) return undefined
  if (slug === 'arcade' && arcadeTitle) {
    const game = /[?&]game=([a-z0-9-]+)/i.exec(path)?.[1]
    const title = game ? arcadeTitle(game) : undefined
    if (title) return title
  }
  return (
    PLAY_TITLES[slug] ??
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  )
}

export function promptIsDue(
  count: number,
  progress: SupportProgress,
  now: number,
): boolean {
  if (count <= 0 || count % PROMPT_EVERY !== 0) return false
  if (progress.gaveAt && now - progress.gaveAt < GAVE_QUIET_MS) return false
  return now - progress.lastPromptAt >= PROMPT_COOLDOWN_MS
}

export function parseSupportProgress(raw: string | null): SupportProgress {
  if (!raw) return { ...EMPTY_SUPPORT_PROGRESS }
  try {
    const value = JSON.parse(raw) as Partial<SupportProgress>
    const pick = (n: unknown) =>
      typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
    return {
      plays: pick(value.plays),
      runs: pick(value.runs),
      lastPromptAt: pick(value.lastPromptAt),
      gaveAt: pick(value.gaveAt),
    }
  } catch {
    return { ...EMPTY_SUPPORT_PROGRESS }
  }
}
