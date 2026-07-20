// utils/collectionCardImage.ts
//
// Upgrade a content/nav card's placeholder image to real art from its OWN
// collection, using the app's folder-collection resolver
// (GET /api/art/collection/folder/<slug> -> server/utils/folderCollections:
// "every image in a slug's media folder is part of that slug's collection just
// by existing there").
//
// This is what lets generic Md cards show their own artwork instead of the
// single shared default (botcafe.webp): once the art pipeline has generated a
// card's image into its media folder, the folder resolver returns it and the
// card picks it up. Cards for which no folder art exists yet simply keep their
// current image — this is strictly additive and never renders worse than today.
//
// Best-effort and cached per slug: any invalid slug, network error, or empty
// folder resolves to '' so the caller keeps its existing image.

type FolderImagesResponse = {
  data?: { slug?: string; images?: string[] | null } | null
}

export type CardImageVariant = 'card' | 'hero' | 'icon'

// Mirrors SLUG_PATTERN in server/utils/folderCollections so we never issue a
// request the route would just 400.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]*$/

const folderImageCache = new Map<string, Promise<string[]>>()

async function fetchFolderImages(slug: string): Promise<string[]> {
  const clean = slug.trim().toLowerCase()
  if (!SLUG_PATTERN.test(clean)) return []

  let pending = folderImageCache.get(clean)
  if (!pending) {
    pending = $fetch<FolderImagesResponse>(
      `/api/art/collection/folder/${encodeURIComponent(clean)}`,
    )
      .then((res) =>
        Array.isArray(res?.data?.images) ? (res.data?.images as string[]) : [],
      )
      .catch(() => [])
    folderImageCache.set(clean, pending)
  }
  return pending
}

/** Prefer an image named for the variant (…-card.webp / …/card.webp); else the first. */
function pickVariantImage(images: string[], variant: CardImageVariant): string {
  if (!images.length) return ''
  const wanted = images.find((src) => {
    const lower = src.toLowerCase()
    return lower.includes(`-${variant}.`) || lower.includes(`/${variant}.`)
  })
  return wanted || images[0] || ''
}

/**
 * Resolve the best real image for a card's collection folder, or '' if none.
 * `slug` is typically the card key. Safe to call on the server or client.
 */
export async function resolveCollectionCardImage(
  slug: string | null | undefined,
  variant: CardImageVariant = 'card',
): Promise<string> {
  if (!slug) return ''
  const images = await fetchFolderImages(slug)
  return pickVariantImage(images, variant)
}
