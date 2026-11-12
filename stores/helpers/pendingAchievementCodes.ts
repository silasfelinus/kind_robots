// /stores/helpers/pendingAchievementCodes.ts
//
// Awards whose code the app knows (game registry or site catalog) but whose
// Achievement row the database has not served yet: the deed is kept on the
// device by code and awarded once the catalog has the row.

export function parsePendingAchievementCodes(raw: string | null): string[] {
  if (!raw) return []

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return [
      ...new Set(
        parsed.filter(
          (code): code is string => typeof code === 'string' && code.length > 0,
        ),
      ),
    ]
  } catch {
    return []
  }
}

export function withPendingAchievementCode(
  codes: readonly string[],
  code: string,
): string[] {
  return codes.includes(code) ? [...codes] : [...codes, code]
}

export function withoutAchievementCodes(
  codes: readonly string[],
  settled: Iterable<string>,
): string[] {
  const drop = new Set(settled)
  return codes.filter((code) => !drop.has(code))
}

export function resolvePendingAchievementCodes<T>(
  codes: readonly string[],
  lookup: (code: string) => T | undefined,
): { code: string; achievement: T }[] {
  return codes.flatMap((code) => {
    const achievement = lookup(code)
    return achievement === undefined ? [] : [{ code, achievement }]
  })
}
