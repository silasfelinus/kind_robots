import type { ComicIntro } from '../cometAcademy/comicIntroductions'

/**
 * Finished, private comic-character reveal paintings from
 * conductor/projects/every-villain-tactics/art/FIGHTER-REVEALS-2026-11-12.yaml.
 * The twelve ArtImage IDs are distinct heroic/villainous variants for the
 * six First Bell speakers. Rendered art never changes Prom of Doom's shared
 * public outcome/portrait fallbacks.
 */
export const PAINTED_EVT_REVEAL_ART: Readonly<Record<string, number>> = {
  'accident-fire:hero': 270741,
  'accident-fire:villain': 270742,
  'tech-genius:hero': 270743,
  'tech-genius:villain': 270744,
  'mutant-earth:hero': 270745,
  'mutant-earth:villain': 270746,
  'accident-air:hero': 270747,
  'accident-air:villain': 270748,
  'tech-fire:hero': 270749,
  'tech-fire:villain': 270750,
  'magic-social:hero': 270751,
  'magic-social:villain': 270752,
}

/** Only the first six First Bell actors have their own delivered reveal art. */
export function paintedRevealArtId(intro: Pick<ComicIntro, 'key' | 'role'> | null): number | null {
  if (!intro || (intro.role !== 'hero' && intro.role !== 'villain'))
    return null
  return PAINTED_EVT_REVEAL_ART[intro.key] ?? null
}
