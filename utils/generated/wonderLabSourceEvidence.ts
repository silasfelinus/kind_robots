import type { WonderLabComponentSourceEvidence } from '@/utils/wonderlab/componentManifest'

// Overwritten by utils/scripts/create-component-json.mjs before every Nuxt build.
export const wonderLabSourceEvidenceByPath: Readonly<
  Record<string, WonderLabComponentSourceEvidence>
> = {}
