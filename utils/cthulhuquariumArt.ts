// /utils/cthulhuquariumArt.ts
//
// cthulhuquarium/t-065: the game's authored art, delivered as ordinary Vite
// assets.
//
// Why this file exists. 138 on-style plates were authored into conductor's
// `projects/cthulhuquarium/art/` -- 119 monster fish, 7 sets, 6 egg tiers, two
// shopkeepers, the parlour background and the Ichthyonomicon plate. Exactly two
// of them ever reached this repo. Every Monster row in the live bestiary has
// `iconPath: null` and `cardPath: null` (verified against production: 0 of 151
// species carry any art path), so `kr-art-plate` fell through to its
// placeholder icon on every surface and the game rendered styleless.
//
// The blocker was never the art. `distribute_images.py`'s media-share pipeline
// is a manual step on Silas's home network that no CI run or agent session can
// write to, and most of these plates have no Monster/Reward row to hang an
// ArtImage off in the first place. A prior session hit that wall, found this
// exact workaround -- bundle as ordinary Vite assets, committed to git, built
// into fingerprinted `_nuxt/` URLs, zero infra dependency -- and then applied it
// to only the two files its own task needed. This generalises it to all 138.
//
// Source images are 1024x1024 (768x1024 for the shopkeepers, 1344x768 for the
// background). They are downscaled to 512px on the long edge before being
// committed here: the largest rendered use is a card plate at 96x128 CSS px, so
// 512 still covers every surface at 2x device pixel ratio, and the set drops
// from 22.8MB to 5.1MB.
//
// This is a delivery mechanism, not a replacement for the real pipeline. If
// Monster rows ever gain genuine ArtImage records, `artFor*` below yields to
// them automatically -- see `withCthulhuquariumArt`, which only ever FILLS
// nulls and never overwrites a path the database already supplies.

const modules = import.meta.glob<string>(
  '../assets/images/cthulhuquarium/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

/** filename stem (`cthulhuquarium-fish-bailiff-eel`) -> built asset URL. */
const byStem: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const stem = path
    .split('/')
    .pop()
    ?.replace(/\.webp$/, '')
  if (stem) byStem[stem] = url
}

function lookup(prefix: string, key: string | null | undefined): string | null {
  if (!key) return null
  return byStem[`cthulhuquarium-${prefix}-${key.trim().toLowerCase()}`] ?? null
}

/**
 * A species plate, keyed by the Monster's own `slug`.
 *
 * All 151 species have a card plate (the last 32, mostly `*-common`
 * starters, were rendered for cthulhuquarium/t-073 and delivered 2026-09-30).
 * A slug with no file still returns null and keeps the placeholder icon.
 */
export function artForSpecies(slug: string | null | undefined): string | null {
  return lookup('fish', slug)
}

/** A collection-set plate, keyed by set slug. */
export function artForSet(slug: string | null | undefined): string | null {
  return lookup('set', slug)
}

// Set pieces are catalogued by kind (aquariumEconomy.ts SET_PIECE_CATALOG);
// their plates were authored by what they depict (conductor's
// build_cthulhuquarium_art_queue.py), so this is the join. peace_ward's plate
// comes from the canon's story/plates.yaml.
const SET_KIND_PLATES: Record<string, string> = {
  extra_species_slot: 'set-extra-shelf',
  feeding_bonus: 'set-heavier-feed',
  swim_speed: 'set-restless-water',
  roaming_collector: 'set-coin-collector',
  debris_skimmer: 'set-glass-brush',
  idle_hoarder: 'set-richer-silt',
  peace_ward: 'set-peace-ward',
}

/** A set piece's plate by its catalog kind, moving if its clip has rendered. */
export function artForSetKind(kind: string | null | undefined): string | null {
  const stem = kind ? SET_KIND_PLATES[kind] : undefined
  if (!stem) return null
  return (
    storyArt[`videos/${stem}`] ??
    storyArt[`plates/${stem}`] ??
    byStem[`cthulhuquarium-${stem}`] ??
    null
  )
}

/** A named shopkeeper or scene plate (`char-charlotte-fishmonger`, `bg-parlour`, ...). */
export function artByName(stem: string | null | undefined): string | null {
  if (!stem) return null
  return byStem[`cthulhuquarium-${stem}`] ?? null
}

/**
 * Fill a record's empty art slots with the bundled plate without disturbing
 * anything the record already carries.
 *
 * `kr-art-plate` resolves `iconPath`/`cardPath`/`imagePath` off whatever it is
 * handed, so this returns a shallow copy with only the null slots populated.
 * A Monster that later gains a real ArtImage keeps it: the database wins, and
 * this stops contributing the moment it has something to yield to.
 */
export function withCthulhuquariumArt<
  T extends {
    slug?: string | null
    iconPath?: string | null
    cardPath?: string | null
    imagePath?: string | null
  },
>(record: T | null | undefined): T | null {
  if (!record) return null
  const plate = artForSpecies(record.slug)
  if (!plate) return record
  return {
    ...record,
    iconPath: record.iconPath ?? plate,
    cardPath: record.cardPath ?? plate,
    imagePath: record.imagePath ?? plate,
  }
}

const storyModules = import.meta.glob<string>(
  '../assets/images/cthulhuquarium/{portraits,backgrounds,plates,videos}/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

const storyArt: Record<string, string> = {}
for (const [path, url] of Object.entries(storyModules)) {
  const parts = path.split('/')
  const folder = parts[parts.length - 2]
  const stem = parts[parts.length - 1]?.replace(/\.webp$/, '')
  if (folder && stem) storyArt[`${folder}/${stem}`] = url
}

const SPEAKER_SLUGS: Record<string, string> = {
  charlotte: 'charlotte-fishmonger',
  wilbur: 'wilbur-stint',
}

/** A cut-out dialogue portrait (canon characters/<who>.yaml `art.portraits`). */
function portraitFor(speaker: string, pose: string): string | null {
  const slug = SPEAKER_SLUGS[speaker]
  if (!slug) return null
  // Poses render one at a time. A pose still in the queue borrows another
  // cut-out of the same speaker before the full-length hero, whose painted
  // backdrop would sit oddly beside the cut-outs in the dialogue.
  const anyPose = Object.keys(storyArt)
    .filter((key) => key.startsWith(`portraits/${slug}-`))
    .sort()[0]
  return (
    storyArt[`portraits/${slug}-${pose}`] ??
    (anyPose ? storyArt[anyPose] : undefined) ??
    byStem[`cthulhuquarium-char-${slug}`] ??
    null
  )
}

/** A tank background (canon backgrounds/backgrounds.yaml). */
function backgroundArt(key: string | null | undefined): string | null {
  if (!key) return null
  return (
    storyArt[`backgrounds/${key}`] ??
    (key === 'parlour' ? (byStem['cthulhuquarium-bg-parlour'] ?? null) : null)
  )
}

/**
 * A character's full-length portrait plate (`charlotte-fishmonger-hero`): tall,
 * so the dialogue shows it as an upright card rather than a 16:9 strip.
 */
function isHeroPlate(key: string | null | undefined): boolean {
  return !!key && key.endsWith('-hero')
}

/** A scene plate shown above a scene's dialogue (canon story/plates.yaml). */
function plateArt(key: string | null | undefined): string | null {
  if (!key) return null
  return (
    storyArt[`plates/${key}`] ??
    byStem[`cthulhuquarium-${key}`] ??
    // A hero plate's still is the character's full-length portrait.
    (isHeroPlate(key)
      ? (byStem[`cthulhuquarium-char-${key.replace(/-hero$/, '')}`] ?? null)
      : null)
  )
}

/**
 * A looping moving picture for a still (canon videos/videos.yaml, WAN
 * image-to-video, animated WebP), or null until it has been rendered -- every
 * caller keeps its still as the fallback.
 */
function movingArt(key: string | null | undefined): string | null {
  if (!key) return null
  return storyArt[`videos/${key}`] ?? null
}

export { backgroundArt, isHeroPlate, movingArt, plateArt, portraitFor }
