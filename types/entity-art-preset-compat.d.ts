// The shared entity-art manager always supplies a quality fallback after its
// mode-specific preset lookup. This overload records that invariant without
// weakening indexed-access checks for the rest of the application.
import type { ComputedGetter, ComputedRef, DebuggerOptions } from 'vue'

type EntityArtGenerationPreset = {
  key: string
  label: string
  description: string
  denoise?: number
  originalWeight?: number
  steps?: number
}

declare module 'vue' {
  export function computed<T extends EntityArtGenerationPreset>(
    getter: ComputedGetter<T | undefined>,
    debugOptions?: DebuggerOptions,
  ): ComputedRef<T>
}
