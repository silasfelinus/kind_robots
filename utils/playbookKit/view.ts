import type { KitSettings } from './settings'
import type {
  KitEndingTone,
  KitMoment,
  KitMomentKind,
  KitTone,
  PlaybookKitSpec,
} from './types'

// What the kit's panes show, derived from a spec and the player's settings.

export const MOMENT_KIND_LABELS: Record<KitMomentKind, string> = {
  scene: 'Scene',
  follower: 'Follower',
  villain: 'Villain',
  romance: 'Romance',
  reveal: 'Reveal',
  faction: 'Faction',
  ending: 'Ending',
}

export const ENDING_TONES: Record<
  KitEndingTone,
  { label: string; tone: KitTone }
> = {
  hopeful: { label: 'Hopeful', tone: 'success' },
  bittersweet: { label: 'Bittersweet', tone: 'warning' },
  dark: { label: 'Dark', tone: 'error' },
  comic: { label: 'Comic', tone: 'secondary' },
  secret: { label: 'Secret', tone: 'accent' },
}

export const MOMENT_TONES: Record<KitMomentKind, KitTone> = {
  scene: 'primary',
  follower: 'info',
  villain: 'error',
  romance: 'secondary',
  reveal: 'accent',
  faction: 'warning',
  ending: 'success',
}

/** Scrapbook moments the player can collect; romance moments drop out when romance is hidden. */
export function visibleMoments(
  spec: PlaybookKitSpec,
  settings: KitSettings,
): KitMoment[] {
  return settings.romance === 'off'
    ? spec.moments.filter((moment) => moment.kind !== 'romance')
    : spec.moments
}

/** Display names for cast and faction ids. */
export function subjectNames(spec: PlaybookKitSpec, ids: string[]): string[] {
  const names = new Map<string, string>([
    ...spec.cast.map((c) => [c.id, c.name] as const),
    ...spec.factions.map((f) => [f.id, f.name] as const),
  ])
  return ids.flatMap((id) => {
    const name = names.get(id)
    return name ? [name] : []
  })
}

export function actTitle(spec: PlaybookKitSpec, act: number): string {
  const found = spec.acts.find((a) => a.id === act)
  return found ? `Act ${act} · ${found.title}` : `Act ${act}`
}
