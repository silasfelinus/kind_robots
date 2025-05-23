// /utils/helpers/themeHelpers.ts

export const colorKeys = [
  '--color-primary',
  '--color-primary-content',
  '--color-secondary',
  '--color-secondary-content',
  '--color-accent',
  '--color-accent-content',
  '--color-neutral',
  '--color-neutral-content',
  '--color-base-100',
  '--color-base-200',
  '--color-base-300',
  '--color-base-content',
  '--color-info',
  '--color-info-content',
  '--color-success',
  '--color-success-content',
  '--color-warning',
  '--color-warning-content',
  '--color-error',
  '--color-error-content',
]

export const extraVars = [
  '--radius-selector',
  '--radius-field',
  '--radius-box',
  '--size-selector',
  '--size-field',
  '--border',
  '--depth',
  '--noise',
]

export const defaultExtraVars: Record<string, string> = {
  '--radius-selector': '0.5rem',
  '--radius-field': '0.25rem',
  '--radius-box': '0.5rem',
  '--size-selector': '1rem',
  '--size-field': '0.875rem',
  '--border': '1px solid #ccc',
  '--depth': 'var(--shadow-md)',
  '--noise': 'none',
}

export const allThemeKeys = [...colorKeys, ...extraVars]

export function isValidColor(val: string) {
  return (
    typeof val === 'string' &&
    (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val) ||
      /^oklch\(.+\)$/.test(val))
  )
}

export function sanitizeThemeValues(
  values: Record<string, string>,
  options?: { silent?: boolean },
) {
  const sanitized: Record<string, string> = {}
  const rejected: [string, string][] = []

  for (const [key, val] of Object.entries(values)) {
    if (colorKeys.includes(key) && isValidColor(val)) {
      sanitized[key] = val
    } else if (
      extraVars.includes(key) &&
      typeof val === 'string' &&
      val.length > 0
    ) {
      sanitized[key] = val
    } else {
      rejected.push([key, val])
    }
  }

  if (rejected.length && !options?.silent) {
    console.warn(
      `[themeHelpers] Ignored ${rejected.length} invalid theme value(s):`,
    )
    for (const [k, v] of rejected) {
      console.warn(`  ✘ ${k}: ${v}`)
    }
  }

  return sanitized
}

export function labelFromKey(key: string) {
  return key
    .replace('--color-', '')
    .replace('--radius-', 'Radius: ')
    .replace('--size-', 'Size: ')
    .replace('--', '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize
}

export function buildThemePayload(themeForm: Record<string, any>) {
  return {
    name: themeForm.name?.trim() || 'untitled',
    values: sanitizeThemeValues(themeForm.values || {}),
    room: themeForm.room?.trim() || undefined,
    isPublic: false,
    prefersDark: themeForm.prefersDark,
    colorScheme: themeForm.colorScheme,
  }
}

export function hexToRgb(hex: string) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) return '255 255 255'
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

export function getRandomHex(): string {
  return (
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  )
}

export function getThemeStyle(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, val]) => `${key}: ${hexToRgb(val)}`)
    .join('; ')
}

export function applyThemeValues(values: Record<string, string>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('--')) {
      root.style.setProperty(key, value)
    } else {
      console.warn(`[themeHelpers] Skipping invalid key: ${key}`)
    }
  }
}

export function getThemeValues(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const computedStyles = getComputedStyle(document.documentElement)
  const themeVars: Record<string, string> = {}

  for (const key of [...colorKeys, ...extraVars]) {
    const val = computedStyles.getPropertyValue(key)?.trim()
    if (val) themeVars[key] = val
  }

  return themeVars
}
