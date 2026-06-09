// /stores/helpers/scenarioHelper.ts
// Canonical parser for Scenario.intros — accepts string[], JSON strings,
// or newline-delimited text, and always returns a clean string array.

export function parseScenarioIntros(raw: unknown): string[] {
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string')
  }

  if (typeof raw !== 'string') return []

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return parsed.filter((entry): entry is string => {
        return typeof entry === 'string'
      })
    }

    return []
  } catch {
    return raw
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
}

// Splits an intro like "THE HEIST: You wake up inside the vault..." into
// a display label and body. Falls back gracefully when there's no title.
export function splitIntro(intro: string): { label: string; body: string } {
  const match = intro.match(/^([A-Z0-9][A-Z0-9 '&!?,.-]{2,40}):\s*(.+)$/s)

  if (match && match[1] && match[2]) {
    return { label: match[1].trim(), body: match[2].trim() }
  }

  return { label: '', body: intro.trim() }
}
