export const CHANNEL_ARTWORK_FALLBACKS: Record<string, string> = {
  arcade: '/arcade/link-preview.webp',
  projects: '/daily-pitches/link-preview.webp',
  admin: '/art-archive/link-preview.webp',
}

export function resolveNavigationArtwork(
  image: string | undefined,
  channelImage: string | undefined,
  channelKey: string,
  failed: ReadonlySet<string>,
): string {
  const candidates = [
    image,
    channelImage,
    CHANNEL_ARTWORK_FALLBACKS[channelKey],
    '/arcade/link-preview.webp',
  ]

  return candidates.find((candidate) => candidate && !failed.has(candidate)) || ''
}
