// /stores/helpers/themeHelper.ts
import type { Theme } from '@prisma/client'

/** Frontend editing shape: values as an object */
export type ThemeForm = Partial<Omit<Theme, 'values'>> & {
  values?: Record<string, string>
}

/* ------------------------------- Keys ---------------------------------- */

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

export const daisyuiThemes = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter',
  'dim',
  'nord',
  'sunset',
  'caramellatte',
  'abyss',
  'silk',
]

/* ---------------------------- Type guards ------------------------------ */

export function isThemeValuesRecord(
  values: unknown,
): values is Record<string, string> {
  return (
    typeof values === 'object' &&
    values !== null &&
    !Array.isArray(values) &&
    Object.values(values).every((v) => typeof v === 'string')
  )
}

/* -------------------------- Parse/normalize ---------------------------- */

function parseValuesToRecord(values: unknown): Record<string, string> {
  if (isThemeValuesRecord(values)) return values
  if (typeof values === 'string') {
    try {
      const parsed = JSON.parse(values)
      return isThemeValuesRecord(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Accepts either DB Theme (values:string) or ThemeForm (values:object)
 * and returns a ThemeForm with values as a sanitized record.
 */
export function normalizeThemeFromServer(
  input: Partial<Theme> | ThemeForm,
): ThemeForm {
  const safeValues = sanitizeThemeValues(
    parseValuesToRecord((input as any).values),
    { silent: true },
  )
  const out: ThemeForm = {
    ...input,
    values: safeValues,
  }
  return out
}

/* ---------------------------- Defaults/ops ----------------------------- */

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

export function isValidColor(val: string): boolean {
  return (
    typeof val === 'string' &&
    (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val) || /^oklch\(.+\)$/.test(val))
  )
}

export function hexToRgb(hex: string): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#'))
    return '255 255 255'
  const h = hex.slice(1)
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

/* ------------------------------ Sanitizers ----------------------------- */

// Sanitize and validate input values for theme saving or applying
export function sanitizeThemeValues(
  values: Record<string, string>,
  options?: { silent?: boolean },
): Record<string, string> {
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
      `[themeHelper] Ignored ${rejected.length} invalid theme value(s):`,
    )
    for (const [key, val] of rejected) console.warn(`  ✘ ${key}: ${val}`)
  }

  return sanitized
}

/* ------------------------------- Labels -------------------------------- */

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

/* ------------------------------ Payloads ------------------------------- */

/**
 * For payload submission to backend (UI helper).
 * NOTE: returns values as an OBJECT; your store converts to string before POST.
 */
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

/* ---------------------------- DOM application -------------------------- */

// Applies custom theme values to the document root
export function applyThemeValues(values: Record<string, string>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [key, value] of Object.entries(values)) {
    if (key.startsWith('--')) root.style.setProperty(key, value)
  }
}

// Extracts applied values from current DOM
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

/**
 * Build a ThemeForm (values as object) from current CSS.
 * This used to return Partial<Theme> and caused TS errors because Theme.values is string.
 */
export function extractComputedTheme(name = 'custom-from-css'): ThemeForm {
  return {
    name,
    values: getThemeValues(),
    prefersDark:
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  }
}

export function getThemeStyle(
  values: Record<string, string> = {},
): Record<string, string> {
  const style: Record<string, string> = {}
  for (const [key, val] of Object.entries(values)) style[key] = val
  return style
}

/**
 * Accept either DB Theme (values string) or ThemeForm (values object) and
 * produce a scoped CSS block. Values string will be parsed to an object.
 */
export function generateScopedThemeCSS(theme: Theme | ThemeForm): string {
  const selector = `[data-theme="custom-preview-${(theme as any).id ?? 'x'}"]`
  const valuesObj = parseValuesToRecord((theme as any).values)
  const entries = Object.entries(valuesObj)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  return `${selector} {\n${entries}\n}`
}

/* ------------------------- Form convenience ops ------------------------ */

export function getDefaultThemeForm(): ThemeForm {
  return {
    name: `MyTheme-${Date.now()}`,
    room: '',
    isPublic: true,
    prefersDark: false,
    colorScheme: 'light',
    values: {
      ...Object.fromEntries(colorKeys.map((key) => [key, '#ffffff'])),
      ...defaultExtraVars,
    },
  }
}

export function fillThemeWithRandomColors(form: ThemeForm) {
  if (!form.values) return
  for (const key of colorKeys) form.values[key] = getRandomHex()
}

export function setThemeColorValue(
  form: ThemeForm,
  key: string,
  value: string,
) {
  if (!form.values) return
  form.values[key] = value
}

export function ensureInitializedThemeForm(form: ThemeForm) {
  if (!form.values) {
    const defaultForm = getDefaultThemeForm()
    Object.assign(form, defaultForm)
    fillThemeWithRandomColors(form)
  }
}
