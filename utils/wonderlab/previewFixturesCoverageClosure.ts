// /utils/wonderlab/previewFixturesCoverageClosure.ts
import type { WonderLabPreviewFixture } from './previewFixtures'

const fixtureDate = new Date('2026-01-01T00:00:00.000Z')

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'character-sheet': {
    title: 'Character Sheet specimen',
    description:
      'Renders a complete synthetic character in read-only sheet mode with no portrait or database identifiers.',
    viewport: 'desktop',
    minHeight: '44rem',
    props: {
      sheet: {
        id: null,
        name: 'Mira Vale',
        honorific: 'the Mapmaker',
        title: 'Curator of Unfinished Roads',
        role: 'Guide',
        class: 'Cartographer',
        species: 'Human',
        gender: 'Woman',
        presentation: 'Weathered field coat, bright scarf, ink-stained gloves',
        genre: 'Hopeful fantasy',
        alignment: 'Kindly Chaotic',
        personality:
          'Patient, observant, and delighted by systems that explain themselves.',
        drive: 'Make every confusing path navigable for the next traveler.',
        backstory:
          'Mira once mapped a city that rearranged itself nightly. She learned to annotate assumptions, record uncertainty, and leave generous margins.',
        achievements:
          'Charted the Recursive Gallery; found the missing context placard.',
        quirks: 'Labels tea mugs by emotional function rather than contents.',
        luck: 'UNCOMMON',
        might: 'COMMON',
        wits: 'EPIC',
        grace: 'RARE',
        charm: 'UNCOMMON',
        empathy: 'LEGENDARY',
        artPrompt:
          'Older field cartographer, strong readable silhouette, clean linework, minimal map-room background.',
        artImageId: null,
        imagePath: null,
        userId: 0,
        designer: 'WonderLab',
        isPublic: true,
        isMature: false,
        isActive: true,
        rewards: [
          {
            id: null,
            rewardId: null,
            slotKey: 'starting-skill',
            label: 'Context Compass',
            text: 'Points toward the dependency everyone forgot to mention.',
            power: 'Reveal one missing prop, store, slot, or route assumption.',
            collection: 'starting-character-reward',
            rewardType: 'SKILL',
            rarity: 'RARE',
            icon: 'kind-icon:compass',
            imagePath: null,
            artImageId: null,
            artPrompt: '',
          },
          {
            id: null,
            rewardId: null,
            slotKey: 'starting-item',
            label: 'Margin Notebook',
            text: 'A weatherproof notebook with room for caveats.',
            power: 'Preserve a useful explanation beside uncertain data.',
            collection: 'starting-character-reward',
            rewardType: 'ITEM',
            rarity: 'UNCOMMON',
            icon: 'kind-icon:book',
            imagePath: null,
            artImageId: null,
            artPrompt: '',
          },
        ],
      },
      rewardSlots: [
        {
          key: 'starting-skill',
          label: 'Starting Skill',
          description: 'A reliable problem-solving talent.',
          rewardType: 'SKILL',
          rarity: 'COMMON',
          icon: 'kind-icon:sparkles',
        },
        {
          key: 'starting-item',
          label: 'Starting Item',
          description: 'A useful object or suspicious artifact.',
          rewardType: 'ITEM',
          rarity: 'COMMON',
          icon: 'kind-icon:treasure',
        },
      ],
      isBuilderMode: false,
      canCreateArt: false,
      allowArt: false,
    },
  },
  'coloring-canvas': {
    title: 'SVG Coloring Canvas specimen',
    description:
      'Renders a small synthetic region map with a local palette resolver and interaction disabled.',
    viewport: 'tablet',
    minHeight: '22rem',
    props: {
      page: {
        id: 'wonderlab/fixture-page',
        version: 1,
        title: 'The Helpful Greenhouse',
        viewBox: { width: 480, height: 320 },
        mode: 'svg-regions',
        layers: {
          decor:
            'M40 270 C120 220 200 285 280 235 C350 195 410 220 445 185',
        },
        regions: [
          {
            id: 'sky',
            label: 'Sky',
            d: 'M0 0 H480 V180 C400 150 320 170 240 140 C150 105 70 145 0 120 Z',
          },
          {
            id: 'greenhouse',
            label: 'Greenhouse',
            d: 'M115 115 L240 45 L365 115 V270 H115 Z',
          },
          {
            id: 'door',
            label: 'Door',
            d: 'M210 175 H270 V270 H210 Z',
          },
          {
            id: 'ground',
            label: 'Ground',
            d: 'M0 180 C100 155 180 190 260 165 C350 140 420 175 480 150 V320 H0 Z',
          },
        ],
        palette: [
          { id: 'sky-blue', name: 'Sky Blue', value: '#bde7ff' },
          { id: 'leaf-green', name: 'Leaf Green', value: '#8fd18b' },
          { id: 'warm-gold', name: 'Warm Gold', value: '#f4c76b' },
          { id: 'earth', name: 'Earth', value: '#b9855b' },
        ],
      },
      fills: {
        sky: 'sky-blue',
        greenhouse: 'leaf-green',
        door: 'warm-gold',
        ground: 'earth',
      },
      selectedRegionIds: ['greenhouse'],
      interactive: false,
      strokeWidth: 3,
      paletteResolver: (colorId: string) => {
        const values: Record<string, string> = {
          'sky-blue': '#bde7ff',
          'leaf-green': '#8fd18b',
          'warm-gold': '#f4c76b',
          earth: '#b9855b',
        }
        return values[colorId] || '#ffffff'
      },
    },
  },
  'dream-pitch-sheet': {
    title: 'Dream PitchSheet specimen',
    description:
      'Uses a synthetic Dream and embedded sheet with auto-loading, persistence, actions, and image lookup disabled.',
    viewport: 'desktop',
    minHeight: '38rem',
    props: {
      dream: {
        id: -601,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        title: 'The Museum That Dreams Back',
        slug: 'museum-that-dreams-back',
        dreamType: 'PITCH',
        description:
          'A living component museum where every exhibit can explain the context it needs.',
        flavorText: 'Please label recursive previews before midnight.',
        pitch:
          'Visitors explore a whimsical technical museum, review reusable components, and turn hidden dependencies into clear, actionable placards.',
        icon: 'kind-icon:file-sparkles',
        imagePath: null,
        artImageId: null,
        userId: 0,
        isPublic: true,
        isMature: false,
        isActive: true,
        PitchSheet: null,
      },
      sheet: {
        id: -602,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        dreamId: -601,
        title: 'The Museum That Dreams Back',
        subtitle: 'A guided tour through a living component registry',
        hook: 'What if every broken preview could tell you exactly what it needs?',
        pitch:
          'Build a safe public museum for the project’s reusable Vue components, backed by a canonical manifest, explicit status, synthetic fixtures, and ordinary Reaction authorship.',
        icon: 'kind-icon:robot',
        type: 'PITCH',
        highlight1Label: 'Inventory',
        highlight1Value: 'Recursive source manifest',
        highlight1Icon: 'kind-icon:list',
        highlight2Label: 'Safety',
        highlight2Value: 'Dry-run reconciliation and fixture guards',
        highlight2Icon: 'kind-icon:shield',
        highlight3Label: 'Community',
        highlight3Value: 'Visible human and bot reviews',
        highlight3Icon: 'kind-icon:comment',
        detail1Label: 'Explore',
        detail1Body: 'Browse by folder, status, or direct URL.',
        detail2Label: 'Understand',
        detail2Body: 'See source paths, preview context, and review history.',
        detail3Label: 'Improve',
        detail3Body: 'Turn missing context into a measured implementation backlog.',
        imagePath: null,
        artImageId: null,
        userId: 0,
      },
      variant: 'detail',
      autoLoad: false,
      ensureOnLoad: false,
      allowEnsure: false,
      allowEdit: false,
      allowActions: false,
      showImage: false,
      showDetails: true,
    },
  },
  'art-builder': {
    title: 'Art Builder Workflow',
    skipReason:
      'Art Builder embeds upload, gallery, generation, prompt synchronization, server selection, and context-specific store workflows. It should be exercised through a Character, Dream, Reward, or Scenario builder with disposable art data.',
  },
  'project-deliverables-panel': {
    title: 'Conductor Deliverables Panel',
    skipReason:
      'This project panel derives deliverables and linked repository state from a live Conductor project object. It needs a complete project-context fixture shared with the Conductor front page rather than a partial prop shell.',
  },
  'project-front-page': {
    title: 'Conductor Project Front Page',
    skipReason:
      'This route-scale surface fetches project metadata, documents, roadmap state, art, and repository links by slug. Test it through a real Conductor project route or a dedicated full project-context harness.',
  },
  'project-pitch-board': {
    title: 'Conductor Project Pitch Board',
    skipReason:
      'Pitch Board resolves live project identity and pitch artifacts by slug. It belongs in the Conductor project shell where project and repository context are already loaded.',
  },
  'dream-sheet-toolbar': {
    title: 'Dream PitchSheet Toolbar',
    skipReason:
      'This toolbar fetches PitchSheets and can create missing database rows for every visible Dream. Its status is meaningful only beside a live Dream collection and authenticated sheet store.',
  },
  'model-builder-batch-editor': {
    title: 'Model Builder Batch Editor',
    skipReason:
      'The batch editor reads and mutates model-builder output collections by output key. A useful preview requires seeded model-builder store state and disposable batch actions.',
  },
  'model-builder-item-panel': {
    title: 'Model Builder Item Panel',
    skipReason:
      'This item editor resolves a live model-builder record by item ID and coordinates editing, validation, and persistence. It should be tested inside the Model Builder workspace with disposable records.',
  },
  'conductor-art-gallery': {
    title: 'Conductor Art Gallery Page',
    skipReason:
      'This page-level gallery resolves project art and collections by Conductor slug. It should be verified through a project route with real project context rather than mounted recursively as a component exhibit.',
  },
  'conductor-project-chat': {
    title: 'Conductor Project Chat Page',
    skipReason:
      'Project Chat requires a complete project ID, title, context document, authenticated chat state, and server selection. It needs a dedicated disposable conversation harness, not a passive museum mount.',
  },
  'chat-card': {
    title: 'Chat Card',
    skipReason:
      'Chat Card resolves participant identities and artwork through User, Bot, Character, and Art stores, marks messages read, and exposes reply/delete actions. It needs a seeded messaging fixture with actions disabled before standalone previewing is safe.',
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

export function getWonderLabCoverageClosureFixture(
  componentName: string,
  sourcePath = '',
): WonderLabPreviewFixture | null {
  const sourceKey = normalizeFixtureKey(sourcePath)
  const componentKey = normalizeFixtureKey(componentName)

  return fixtures[sourceKey] ?? fixtures[componentKey] ?? null
}

export function listWonderLabCoverageClosureFixtureKeys(): string[] {
  return Object.keys(fixtures).sort()
}
