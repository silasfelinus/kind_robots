// /utils/wonderlab/componentStatus.ts
export const componentStatuses = [
  'UNREVIEWED',
  'WORKING',
  'NEEDS_CONTEXT',
  'UNDER_CONSTRUCTION',
  'BROKEN',
  'RETIRED',
  'PREVIEW_UNSUPPORTED',
] as const

export type ComponentStatus = (typeof componentStatuses)[number]

export type ComponentStatusFields = {
  status?: ComponentStatus | string | null
}

export function isComponentStatus(value: unknown): value is ComponentStatus {
  return (
    typeof value === 'string' &&
    componentStatuses.includes(value as ComponentStatus)
  )
}

export function getComponentStatus(
  component: ComponentStatusFields,
): ComponentStatus {
  return isComponentStatus(component.status) ? component.status : 'UNREVIEWED'
}

export function legacyFieldsForComponentStatus(
  status: ComponentStatus,
): { status: ComponentStatus } {
  return { status }
}
