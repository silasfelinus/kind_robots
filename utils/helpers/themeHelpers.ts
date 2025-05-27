// /utils/helpers/themeHelpers.ts

// Keys for main theme colors
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

// Custom size/shape/extras
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

// Default fallback extras
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

// Combined theme key list
export const allThemeKeys = [...colorKeys, ...extraVars]

export function isValidColor(val: string): boolean {
  return (
    typeof val === 'string' &&
    (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) ||
      /^oklch\(.+\)$/.test(val))
  )
}

export function hexToRgb(hex: string): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '255 255 255'
  const h = hex.slice(1)
  const bigint = parseInt(h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

export function getRandomHex(): string {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')
}

// Sanitize and validate input values for theme saving or applying
export function sanitizeThemeValues(
  values: Record<string, string>,
  options?: { silent?: boolean }
): Record<string, string> {
  const sanitized: Record<string, string> = {}
  const rejected: [string, string][] = []

  for (const [key, val] of Object.entries(values)) {
    if (colorKeys.includes(key) && isValidColor(val)) {
      sanitized[key] = val
    } else if (extraVars.includes(key) && typeof val === 'string' && val.length > 0) {
      sanitized[key] = val
    } else {
      rejected.push([key, val])
    }
  }

  if (rejected.length && !options?.silent) {
    console.warn(`[themeHelpers] Ignored ${rejected.length} invalid theme value(s):`)
    for (const [key, val] of rejected) {
      console.warn(`  ✘ ${key}: ${val}`)
    }
  }

  return sanitized
}

// Converts a variable name to a pretty label for UI display
export function labelFromKey(key: string): string {
  return key
    .replace('--color-', '')
    .replace('--radius-', 'Radius: ')
    .replace('--size-', 'Size: ')
    .replace('--', '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

// For payload submission to backend
export function buildThemePayload(themeForm: Record<string, any>) {
  return {
    name: themeForm.name?.trim() || 'untitled',
    values: sanitizeThemeValues(themeForm.values || {}),
    room: themeForm.room?.trim() || undefined,
    isPublic: !!themeForm.isPublic,
    prefersDark: themeForm.prefersDark ?? false,
    colorScheme: themeForm.colorScheme ?? 'light',
  }
}

// Applies custom theme values to the document root
export function applyThemeValues(values: Record<string, string>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('--')) {
      root.style.setProperty(key, value)
    }
  }
}

// Extracts all applied values from the current DOM
export function getThemeValues(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const computed = getComputedStyle(document.documentElement)
  const values: Record<string, string> = {}
  for (const key of allThemeKeys) {
    const val = computed.getPropertyValue(key).trim()
    if (val) values[key] = val
  }
  return values
}

// Full theme object from current computed values (for reverse engineering DaisyUI themes)
export function extractComputedTheme(name = 'custom-from-css'): Partial<Theme> {
  return {
    name,
    values: getThemeValues(),
    prefersDark: document.documentElement.classList.contains('dark'),
  }
}

// Generates inline Vue :style object from theme vars
export function getThemeStyle(values: Record<string, string> = {}): Record<string, string> {
  const style: Record<string, string> = {}
  for (const [key, val] of Object.entries(values)) {
    if (isValidColor(val)) {
      style[key] = val
    }
  }
  return style
}
