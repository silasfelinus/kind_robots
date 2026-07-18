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

const fixtureDate = new Date('2026-01-01T00:00:00.000Z')

const fixtures: Record<string, WonderLabPreviewFixture> = {
  'bot-card': {
    title: 'Bot Card specimen',
    description:
      'Uses a synthetic bot with all live actions, reactions, image lookups, and chat launch controls disabled.',
    viewport: 'mobile',
    minHeight: '24rem',
    props: {
      bot: {
        id: -101,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        BotType: 'ASSISTANT',
        name: 'Dotti Fixturewright',
        subtitle: 'A careful specimen bot',
        description:
          'A synthetic WonderLab record for checking bot-card typography, badges, spacing, and responsive behavior.',
        personality:
          'Precise, curious, and delighted by well-labeled component boundaries.',
        prompt: '',
        theme: '',
        designer: 'WonderLab',
        serverName: null,
        avatarImage: null,
        imagePath: null,
        artImageId: null,
        userId: 0,
        isPublic: true,
        isActive: true,
        isMature: false,
        underConstruction: false,
        canDelete: false,
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showLaunchButton: false,
      showDescription: true,
      showMeta: true,
      allowEdit: false,
      allowClone: false,
      allowDelete: false,
    },
  },
  'character-card': {
    title: 'Character Card specimen',
    description:
      'Uses a synthetic public character and disables reactions, editing, cloning, deletion, and inline interactions.',
    viewport: 'mobile',
    minHeight: '24rem',
    props: {
      character: {
        id: -102,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        name: 'Mira',
        honorific: 'the Mapmaker',
        class: 'Cartographer',
        species: 'Human',
        genre: 'Hopeful fantasy',
        presentation:
          'Mira charts paths through unfinished worlds and leaves clear notes for whoever explores next.',
        personality: 'Observant, patient, and quietly adventurous.',
        backstory: '',
        imagePath: null,
        artImageId: null,
        userId: 0,
        isPublic: true,
        isMature: false,
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showModeButtons: false,
      showInlineInteract: false,
      showDescription: true,
      showMeta: true,
      allowEdit: false,
      allowClone: false,
      allowDelete: false,
    },
  },
  'component-card': {
    title: 'Component Card specimen',
    description:
      'Uses a synthetic museum component and disables live reactions and edit actions.',
    viewport: 'desktop',
    minHeight: '20rem',
    props: {
      component: {
        id: -1,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
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
  'component-review-feed': {
    title: 'Component Review Feed',
    description:
      'Uses a non-persistent negative component ID so the feed renders its ordinary empty state without making an API request.',
    viewport: 'desktop',
    props: {
      componentId: -1,
      targetTitle: 'Synthetic Component Exhibit',
    },
  },
  'dream-card': {
    title: 'Dream Card specimen',
    description:
      'Uses a relation-complete synthetic Dream with no live art or collection IDs, and disables edit/archive actions.',
    viewport: 'mobile',
    minHeight: '22rem',
    props: {
      dream: {
        id: -201,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        title: 'The Museum That Dreams Back',
        slug: 'museum-that-dreams-back',
        dreamType: 'STORY',
        description:
          'A gallery where every exhibit can explain the context it needs to become useful.',
        pitch: 'A gentle backstage adventure through a living component museum.',
        flavorText: 'Please do not feed the recursive preview hosts after midnight.',
        examples: null,
        artPrompt: null,
        imagePath: null,
        cardPath: null,
        highlightImage: null,
        icon: 'kind-icon:dream',
        designer: 'WonderLab',
        creationSource: 'FIXTURE',
        userId: 0,
        isPublic: true,
        isMature: false,
        isActive: true,
        artImageId: null,
        artCollectionId: null,
        ArtImage: null,
        ArtCollection: null,
        ArtCollections: [],
        ArtImages: [],
        Scenarios: [],
        Scenario: null,
        Characters: [],
        Rewards: [],
        _count: {
          Scenarios: 2,
          Characters: 3,
          Rewards: 1,
          ArtImages: 0,
        },
      },
      showImage: false,
      showActions: false,
      showDescription: true,
      showMeta: true,
      showStats: true,
      allowEdit: false,
      allowDelete: false,
    },
  },
  'image-card': {
    title: 'Art Image Card specimen',
    description:
      'Uses a synthetic ArtImage with image loading, reactions, mutation controls, coloring-page launch, prompt copying, and selection disabled.',
    viewport: 'mobile',
    minHeight: '20rem',
    props: {
      artImage: {
        id: -202,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        promptString:
          'A clean museum placard glowing beside a carefully labeled component.',
        negativePrompt: 'mystery errors, accidental network calls',
        fileName: 'wonderlab-fixture.webp',
        imagePath: null,
        imageData: '',
        thumbnailData: null,
        fileType: 'webp',
        isMature: false,
        isPublic: true,
        checkpoint: 'wonderlab-fixture.safetensors',
        sampler: 'Euler',
        steps: 24,
        cfg: 7,
        cfgHalf: false,
        seed: 424242,
        designer: 'WonderLab',
        userId: 0,
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showSelectButton: false,
      showPrompt: true,
      showNegativePrompt: true,
      showMeta: true,
      showGenerationMeta: true,
      allowEdit: false,
      allowDelete: false,
      allowCopyPrompt: false,
      allowColoringPage: false,
      autoLoadImage: false,
    },
  },
  'collection-card': {
    title: 'Art Collection Card specimen',
    description:
      'Uses a synthetic empty collection with preview loading, reactions, selection, editing, and deletion disabled.',
    viewport: 'mobile',
    minHeight: '18rem',
    props: {
      collection: {
        id: -203,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        label: 'Museum Lighting Studies',
        description:
          'A synthetic collection used to inspect empty-state typography and metadata.',
        username: 'WonderLab',
        userId: 0,
        isPublic: true,
        isMature: false,
        ArtImages: [],
        artImages: [],
        images: [],
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showSelectButton: false,
      showDescription: true,
      showMeta: true,
      showStats: false,
      allowEdit: false,
      allowDelete: false,
      autoLoadPreviewImage: false,
    },
  },
  'reward-card': {
    title: 'Reward Card specimen',
    description:
      'Uses a synthetic reward with story, edit, delete, selection, reactions, and image loading disabled.',
    viewport: 'mobile',
    minHeight: '20rem',
    props: {
      reward: {
        id: -103,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        title: 'Lantern of Useful Errors',
        slug: 'lantern-of-useful-errors',
        description:
          'Illuminates the exact boundary where a component needs clearer context.',
        effect:
          'Reveal one actionable diagnostic instead of a mysterious blank panel.',
        icon: 'kind-icon:gift',
        collection: 'WonderLab',
        rarity: 'RARE',
        rewardType: 'STORY',
        imagePath: null,
        artImageId: null,
        userId: 0,
        isPublic: true,
        isMature: false,
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showSelectButton: false,
      showDescription: true,
      showMeta: true,
      showStats: true,
      allowEdit: false,
      allowDelete: false,
    },
  },
  'scenario-card': {
    title: 'Scenario Card specimen',
    description:
      'Uses a synthetic scenario with image loading, reactions, editing, cloning, deletion, and store selection controls disabled.',
    viewport: 'tablet',
    minHeight: '20rem',
    props: {
      scenario: {
        id: -104,
        createdAt: fixtureDate,
        updatedAt: fixtureDate,
        title: 'The Museum After Midnight',
        description:
          'Every component wakes up and tries to explain what context it expected from its parent.',
        intros: JSON.stringify([
          'At midnight, a tiny status badge clears its throat.',
          'The gallery lights flicker on one exhibit at a time.',
        ]),
        genres: 'Whimsical mystery',
        locations: 'WonderLab archive',
        inspirations: 'Component museums, backstage tours, and helpful error messages',
        imagePath: null,
        artImageId: null,
        userId: 0,
        isPublic: true,
        isMature: false,
      },
      showImage: false,
      showActions: false,
      showReaction: false,
      showDescription: true,
      showMeta: true,
      showInspirations: true,
      allowEdit: false,
      allowDelete: false,
      allowClone: false,
    },
  },
  'wonderlab-preview-host': {
    title: 'Preview Host specimen',
    description:
      'Demonstrates the preview harness by safely mounting the synthetic Component Card fixture inside it.',
    viewport: 'desktop',
    minHeight: '28rem',
    props: {
      componentName: 'component-card',
      folderName: 'wonderlab',
      sourcePath: 'components/wonderlab/component-card.vue',
      showControls: true,
    },
  },
  'component-sync': {
    title: 'Component reconciliation',
    skipReason:
      'This admin tool requires an authenticated admin session and performs deliberate server actions. Preview it from the WonderLab admin surface instead.',
  },
  'component-test-fixture-cleanup': {
    title: 'Historical test-fixture cleanup',
    skipReason:
      'This destructive admin utility is intentionally available only inside the authenticated Component reconciliation panel after a reviewed dry run.',
  },
  'lab-interact': {
    title: 'Component WonderLab museum',
    skipReason:
      'The museum is the current application surface and depends on live Component, User, Reaction, and router stores. Previewing the museum inside itself would create a recursive operational shell.',
  },
  'lab-manager': {
    title: 'WonderLab route manager',
    skipReason:
      'This route-level manager chooses between the museum, Memory Dungeon, and Screen FX using router and dashboard state. Test it through its explicit routes instead of mounting it as an exhibit.',
  },
  'wonderlab-selection-router': {
    title: 'WonderLab selection router',
    skipReason:
      'This headless router synchronizes the selected Component with the page query string and has no standalone visual surface.',
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
