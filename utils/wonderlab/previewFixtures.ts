// /utils/wonderlab/previewFixtures.ts
export type WonderLabPreviewViewport = 'mobile' | 'tablet' | 'desktop' | 'full'

export type WonderLabPreviewFixture = {
  title?: string
  description?: string
  props?: Record<string, unknown>
  viewport?: WonderLabPreviewViewport
  minHeight?: string
  skipReason?: string
}

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'component-card': {
    title: 'Component Card specimen',
    description:
      'Uses a synthetic museum component and disables live reactions and edit actions.',
    viewport: 'desktop',
    minHeight: '20rem',
    props: {
      component: {
        id: -1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        folderName: 'wonderlab',
        componentName: 'component-card',
        isWorking: true,
        underConstruction: false,
        isBroken: false,
        title: 'Museum Component Card',
        notes:
          'A safe fixture used to demonstrate the Component Card without requiring a database record.',
        artImageId: null,
      },
      showReaction: false,
      allowEdit: false,
      allowCopyName: false,
      showMeta: true,
      showSelectButton: false,
    },
  },
  'component-sync': {
    title: 'Component reconciliation',
    skipReason:
      'This admin tool requires an authenticated admin session and performs deliberate server actions. Preview it from the WonderLab admin surface instead.',
  },
  'workspace-narrator': {
    title: 'Workspace Narrator',
    skipReason:
      'The narrator remote depends on active page, narrator, expression, chat, and layout stores. It needs a dedicated workspace fixture rather than a naked mount.',
  },
  'narrator-chat': {
    title: 'Narrator Chat',
    skipReason:
      'Narrator Chat depends on a resolved narrator identity, thread context, and chat server selection.',
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

export function getWonderLabPreviewFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function hasWonderLabPreviewFixture(
  componentName: string,
  sourcePath = '',
): boolean {
  return Boolean(getWonderLabPreviewFixture(componentName, sourcePath))
}

export function listWonderLabPreviewFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
