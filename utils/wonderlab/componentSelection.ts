// /utils/wonderlab/componentSelection.ts
export type WonderLabSelectableComponent = {
  id: number
  componentName: string
}

export function normalizeWonderLabComponentQuery(value: unknown): string {
  const candidate = Array.isArray(value) ? value[0] : value
  return typeof candidate === 'string' ? candidate.trim() : ''
}

export function normalizeWonderLabComponentName(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function findWonderLabComponentForQuery<
  T extends WonderLabSelectableComponent,
>(components: readonly T[], value: unknown): T | null {
  const query = normalizeWonderLabComponentQuery(value)
  if (!query) return null

  if (/^\d+$/.test(query)) {
    const id = Number(query)
    if (Number.isSafeInteger(id) && id > 0) {
      return components.find((component) => component.id === id) ?? null
    }
  }

  const exact = components.find(
    (component) => component.componentName === query,
  )
  if (exact) return exact

  const normalizedQuery = normalizeWonderLabComponentName(query)
  if (!normalizedQuery) return null

  return (
    components.find(
      (component) =>
        normalizeWonderLabComponentName(component.componentName) ===
        normalizedQuery,
    ) ?? null
  )
}

export function wonderLabComponentQueryValue(
  component: WonderLabSelectableComponent,
): string {
  return String(component.id)
}
