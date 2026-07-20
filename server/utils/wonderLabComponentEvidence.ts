import {
  loadWonderLabComponentManifest,
  resolveWonderLabManifestEntry,
  type WonderLabComponentSourceEvidence,
} from '@/utils/wonderlab/componentManifest'
import type { WonderLabExhibitProfile } from '@/utils/wonderlab/reviewerAffinity'

const MANIFEST_KEY = 'wonderlab-components.json'

async function serverManifest(): Promise<unknown> {
  const value = await useStorage('assets:wonderlab').getItem<unknown>(MANIFEST_KEY)
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    throw new Error('The packaged WonderLab component manifest is invalid JSON.')
  }
}

export async function loadWonderLabComponentSourceEvidence(
  exhibit: Pick<
    WonderLabExhibitProfile,
    'componentName' | 'folderName' | 'sourcePath'
  >,
): Promise<WonderLabComponentSourceEvidence> {
  const manifest = await loadWonderLabComponentManifest(serverManifest)
  const entry = resolveWonderLabManifestEntry(
    manifest.entries,
    exhibit.componentName,
    exhibit.folderName,
    exhibit.sourcePath || '',
  )

  if (!entry?.sourceEvidence?.facts.length) {
    throw new Error(
      `No packaged source evidence is available for ${exhibit.sourcePath || exhibit.componentName}.`,
    )
  }

  return entry.sourceEvidence
}
