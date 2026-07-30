// The shared entity-art manager always supplies a quality fallback after its
// mode-specific preset lookup. This overload is limited to arrays with that
// preset shape, leaving ordinary Array.find calls unchanged.
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
    this: EntityArtGenerationPreset[],
    predicate: (
      value: EntityArtGenerationPreset,
      index: number,
      obj: EntityArtGenerationPreset[],
    ) => unknown,
    thisArg?: unknown,
  ): EntityArtGenerationPreset
}
