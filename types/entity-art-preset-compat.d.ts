// The shared entity-art manager always supplies a quality fallback after its
// mode-specific preset lookup. This overload is callable only for arrays whose
// own element type has the preset shape, and returns that same element type.
type EntityArtGenerationPreset = {
  key: string
  label: string
  description: string
  denoise?: number
  originalWeight?: number
  steps?: number
}

interface Array<T> {
  find(
    this: T extends EntityArtGenerationPreset ? T[] : never,
    predicate: (value: T, index: number, obj: T[]) => unknown,
    thisArg?: unknown,
  ): T
}
