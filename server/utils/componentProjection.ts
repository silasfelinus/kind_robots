// /server/utils/componentProjection.ts
export type PublicComponentProjection<T extends { notes?: unknown }> = Omit<
  T,
  'notes'
>

export function projectComponentForViewer<T extends { notes?: unknown }>(
  component: T,
  isAdmin: boolean,
): T | PublicComponentProjection<T> {
  if (isAdmin) return component

  const { notes: _internalNotes, ...publicComponent } = component
  return publicComponent
}
