// /server/utils/componentTestFixtures.ts
export type ComponentTestFixtureRecord = {
  id: number
  componentName: string
  folderName: string
  title?: string | null
}

const componentNamePattern = /^TestComponent[-_]/i
const folderNamePattern = /^test-folder(?:-|$)/i
const titlePattern = /^(?:Updated )?Test Component$/i

export function isComponentTestFixture(
  component: ComponentTestFixtureRecord,
): boolean {
  if (!componentNamePattern.test(component.componentName.trim())) return false

  return (
    folderNamePattern.test(component.folderName.trim()) ||
    titlePattern.test(component.title?.trim() || '')
  )
}

export function selectComponentTestFixtures<
  T extends ComponentTestFixtureRecord,
>(components: readonly T[]): T[] {
  return components.filter(isComponentTestFixture)
}

export function parseComponentFixtureIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  return [
    ...new Set(
      value
        .map((candidate) => Number(candidate))
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ].sort((left, right) => left - right)
}
