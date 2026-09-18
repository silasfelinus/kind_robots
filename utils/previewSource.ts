// /utils/previewSource.ts
//
// Which stored preview urls the server may fetch bytes from.
//
// /api/resources/previews/:id/source takes a ROW id and reads the url out of
// our own table, so a caller can never point it anywhere. That is the important
// half. This is the second half: a row is only as trustworthy as whatever wrote
// it, and the writer is a backfill script talking to a third party. An
// http:// url, a redirect target on localhost, or a row edited later should not
// turn a preview loader into a way to make the server fetch internal addresses.
//
// Kept pure and separate from the endpoint so the rule can be asserted directly
// rather than grepped for.

/** Hosts a stored preview may be fetched from. */
export const PREVIEW_SOURCE_HOSTS = ['image.civitai.com'] as const

export function isFetchablePreviewUrl(
  value: string | null | undefined,
): boolean {
  const raw = String(value || '').trim()
  if (!raw) return false

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }

  if (url.protocol !== 'https:') return false

  // Exact host match, never a suffix test: `image.civitai.com.evil.test`
  // endsWith `civitai.com` and is not Civitai.
  return (PREVIEW_SOURCE_HOSTS as readonly string[]).includes(url.hostname)
}
