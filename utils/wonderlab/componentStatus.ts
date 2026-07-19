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
export type LegacyComponentStatus = Extract<
  ComponentStatus,
  'UNREVIEWED' | 'WORKING' | 'UNDER_CONSTRUCTION' | 'BROKEN'
>

export type LegacyComponentStatusFields = {
  isWorking?: boolean | null
  underConstruction?: boolean | null
  isBroken?: boolean | null
}

export type ComponentStatusFields = LegacyComponentStatusFields & {
  status?: ComponentStatus | string | null
}

export type CanonicalLegacyStatusFields = {
  isWorking: boolean
  underConstruction: boolean
  isBroken: boolean
}

export function isComponentStatus(value: unknown): value is ComponentStatus {
  return (
    typeof value === 'string' &&
    componentStatuses.includes(value as ComponentStatus)
  )
}

export function getLegacyComponentStatus(
  component: LegacyComponentStatusFields,
): LegacyComponentStatus {
  if (component.isBroken) return 'BROKEN'
  if (component.underConstruction) return 'UNDER_CONSTRUCTION'
  if (component.isWorking) return 'WORKING'
  return 'UNREVIEWED'
}

export function getComponentStatus(
  component: ComponentStatusFields,
): ComponentStatus {
  if (isComponentStatus(component.status)) return component.status
  return getLegacyComponentStatus(component)
}

export function legacyFieldsForComponentStatus(
  status: ComponentStatus,
): CanonicalLegacyStatusFields {
  return {
    isWorking: status === 'WORKING',
    underConstruction: status === 'UNDER_CONSTRUCTION',
    isBroken: status === 'BROKEN',
  }
}

export function hasLegacyStatusUpdate(
  patch: LegacyComponentStatusFields,
): boolean {
  return (
    typeof patch.isWorking === 'boolean' ||
    typeof patch.underConstruction === 'boolean' ||
    typeof patch.isBroken === 'boolean'
  )
}

export function resolveLegacyStatusUpdate(
  existing: LegacyComponentStatusFields,
  patch: LegacyComponentStatusFields,
): CanonicalLegacyStatusFields {
  if (patch.isBroken === true) {
    return legacyFieldsForComponentStatus('BROKEN')
  }
  if (patch.underConstruction === true) {
    return legacyFieldsForComponentStatus('UNDER_CONSTRUCTION')
  }
  if (patch.isWorking === true) {
    return legacyFieldsForComponentStatus('WORKING')
  }

  return legacyFieldsForComponentStatus(
    getLegacyComponentStatus({
      isWorking:
        typeof patch.isWorking === 'boolean'
          ? patch.isWorking
          : existing.isWorking,
      underConstruction:
        typeof patch.underConstruction === 'boolean'
          ? patch.underConstruction
          : existing.underConstruction,
      isBroken:
        typeof patch.isBroken === 'boolean'
          ? patch.isBroken
          : existing.isBroken,
    }),
  )
}
