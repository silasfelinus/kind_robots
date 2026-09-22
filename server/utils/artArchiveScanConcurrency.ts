// /server/utils/artArchiveScanConcurrency.ts
//
// Bounded fan-out for per-file work during an archive scan.
//
// The admin dry-run and import endpoints used `await Promise.all(scan.files
// .map(...))`, which starts work for EVERY file in the archive at once. With a
// large archive that is thousands of simultaneous Prisma queries and thousands
// of live result objects; on Alexandria the container was SIGKILLed mid-scan
// (art-archive/t-041, 2026-09-22: `docker exec` exit 137, no HTTP response at
// all). Promise.all is also all-or-nothing on memory: nothing can be released
// until the last file finishes.
//
// This keeps at most `limit` files in flight and preserves input order, so the
// callers' aggregation is unchanged.

/** Files in flight at once. Small enough to stay flat on a shared box. */
export const ARCHIVE_SCAN_CONCURRENCY = 8

export async function mapWithConcurrency<Input, Output>(
  items: readonly Input[],
  mapper: (item: Input, index: number) => Promise<Output>,
  limit: number = ARCHIVE_SCAN_CONCURRENCY,
): Promise<Output[]> {
  const bounded = Math.max(1, Math.floor(limit))
  const results = new Array<Output>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await mapper(items[index] as Input, index)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(bounded, items.length) }, () => worker()),
  )
  return results
}
