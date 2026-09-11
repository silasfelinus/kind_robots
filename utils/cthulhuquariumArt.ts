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
  const stem = path.split('/').pop()?.replace(/\.webp$/, '')
  if (stem) byStem[stem] = url
}

function lookup(prefix: string, key: string | null | undefined): string | null {
  if (!key) return null
  return byStem[`cthulhuquarium-${prefix}-${key.trim().toLowerCase()}`] ?? null
}

/**
 * A species plate, keyed by the Monster's own `slug`.
 *
 * 119 of the live bestiary's 151 species have art; the naming convention maps
 * exactly (every art file matches a real slug, no orphans on either side). The
 * remaining 32 -- mostly the `*-common` starters and a handful of oddities --
 * return null and keep their placeholder icon, which is honest: the art has not
 * been authored for them yet rather than having been lost.
 */
export function artForSpecies(slug: string | null | undefined): string | null {
  return lookup('fish', slug)
}

/** An egg plate, keyed by rarity tier (common..mythic). */
export function artForEggTier(tier: string | null | undefined): string | null {
  return lookup('egg', tier)
}

/** A collection-set plate, keyed by set slug. */
export function artForSet(slug: string | null | undefined): string | null {
  return lookup('set', slug)
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
