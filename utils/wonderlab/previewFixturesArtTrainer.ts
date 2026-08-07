// /utils/wonderlab/previewFixturesArtTrainer.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'artjob-trainer-redo-controls': {
    title: 'Art Trainer redo controls',
    description:
      'A completed synthetic image job exposes prompt-only and image-guided redo choices without submitting, fetching, or mutating anything until the button is clicked.',
    viewport: 'tablet',
    minHeight: '28rem',
    props: {
      job: {
        id: -1586,
        status: 'DONE',
        engine: 'COMFY',
        priority: 0,
        projectSlug: 'wonderlab-fixture',
        projectId: null,
        userId: 0,
        artImageId: 4242,
        error: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        payload: {
          media: 'image',
          promptString:
            'A friendly brass robot tending a moonlit greenhouse, cinematic depth, no readable text.',
        },
      },
      summary: 'Preserve the robot silhouette; make the greenhouse less cluttered.',
      tags: ['composition', 'prompt-fit'],
    },
  },
}

function normalizeFixtureKey(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/^.*\//, '')
    .replace(/\.vue$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function getWonderLabArtTrainerFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)
  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabArtTrainerFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
