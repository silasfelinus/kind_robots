// /utils/wonderlab/componentStatus.ts
export type LegacyComponentStatus =
  | 'UNREVIEWED'
  | 'WORKING'
  | 'UNDER_CONSTRUCTION'
  | 'BROKEN'

export type LegacyComponentStatusFields = {
  isWorking?: boolean | null
  underConstruction?: boolean | null
  isBroken?: boolean | null
}

export type CanonicalLegacyStatusFields = {
  isWorking: boolean
  underConstruction: boolean
  isBroken: boolean
}

export function getLegacyComponentStatus(
  component: LegacyComponentStatusFields,
): LegacyComponentStatus {
  if (component.isBroken) return 'BROKEN'
  if (component.underConstruction) return 'UNDER_CONSTRUCTION'
  if (component.isWorking) return 'WORKING'
  return 'UNREVIEWED'
}

export function legacyFieldsForComponentStatus(
  status: LegacyComponentStatus,
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
  // A newly enabled state is an explicit selection and should replace the old
  // state even when callers send only one boolean field.
  if (patch.isBroken === true) {
    return legacyFieldsForComponentStatus('BROKEN')
  }
  if (patch.underConstruction === true) {
    return legacyFieldsForComponentStatus('UNDER_CONSTRUCTION')
  }
  if (patch.isWorking === true) {
    return legacyFieldsForComponentStatus('WORKING')
  }

  // False-only patches clear the supplied flags and preserve any other
  // existing state. The result is normalized before it reaches Prisma.
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
