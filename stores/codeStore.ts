// /stores/codeStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'
import { usePitchStore } from '@/stores/pitchStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useNavStore } from '@/stores/navStore'
import type { Code } from '~/prisma/generated/prisma/client'

export type CodeDataType =
  | 'text'
  | 'image'
  | 'model'
  | 'video'
  | 'character'
  | 'dream'
  | 'pitch'
  | 'prompt'
  | 'bot'
  | 'reward'
  | 'scenario'
  | 'collection'

export type CodeKind =
  | 'openai-text'
  | 'openai-image'
  | 'anthropic-text'
  | 'text-input'
  | 'image-upload-select'
  | 'stable-diffusion'
  | 'comfy-sdxl'
  | 'comfy-kombine'
  | 'comfy-kontext'
  | 'comfy-schnell'
  | 'comfy-dev'
  | 'image2vid'
  | 'text2vid'
  | 'img2model'
  | 'character'
  | 'dream'
  | 'pitch'
  | 'prompt'
  | 'bot'
  | 'random-image'
  | 'reward'
  | 'scenario'

export type CodePortDirection = 'input' | 'output'

export type CodeActionKind =
  | 'add-pitch'
  | 'add-dream'
  | 'add-character'
  | 'add-reward'
  | 'add-scenario'
  | 'create-art'
  | 'edit-target'
  | 'interact-target'
  | 'add-skill'
  | 'add-treasure'
  | 'expand-concept'

export type CodeModel =
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'art'

export type CodeDashboardKey =
  | 'art'
  | 'bot'
  | 'brainstorm'
  | 'builder'
  | 'user'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'footer'
  | 'theme'
  | 'giftshop'
  | 'server'
  | 'wonder'

export type CodePanelMode = 'closed' | 'node-settings' | 'templates' | 'library'

export type CodeMobileTrayMode =
  | 'closed'
  | 'toybox'
  | 'quick-plays'
  | 'settings'

export interface CodeActionCard {
  id: string
  title: string
  subtitle: string
  description: string
  icon: string
  kind: CodeActionKind
  model?: CodeModel
  targetId?: number
  targetTitle?: string
}

export interface CodeTarget {
  id: number
  title: string
  model: CodeModel
}

export interface CodePort {
  id: string
  label: string
  type: CodeDataType
  direction: CodePortDirection
  required?: boolean
}

export interface CodeDefinition {
  kind: CodeKind
  title: string
  subtitle: string
  description: string
  icon: string
  category: string
  accent: string
  inputs: CodePort[]
  outputs: CodePort[]
}

export interface CodeNode {
  id: string
  kind: CodeKind
  title: string
  x: number
  y: number
  values: Record<string, unknown>
}

export interface CodeConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
  type: CodeDataType
}

export interface PendingCodeConnection {
  fromNodeId: string
  fromPortId: string
  type: CodeDataType
}

export interface CodeTemplateNode {
  kind: CodeKind
  title?: string
  x: number
  y: number
}

export interface CodeTemplateConnection {
  fromIndex: number
  fromPortId: string
  toIndex: number
  toPortId: string
}

export interface CodeTemplate {
  id: string
  title: string
  description: string
  icon: string
  nodes: CodeTemplateNode[]
  connections: CodeTemplateConnection[]
}

export interface CodePoint {
  x: number
  y: number
}

export interface CodeViewport {
  width: number
  height: number
}

export interface CodeGraph {
  version: 1
  nodes: CodeNode[]
  connections: CodeConnection[]
  zoom: number
  panX: number
  panY: number
}

export interface CodeForm extends Omit<Partial<Code>, 'graph'> {
  graph?: CodeGraph
}

interface SelectableStore {
  selectPitch?: (id: number) => Promise<unknown> | unknown
  selectDream?: (id: number) => Promise<unknown> | unknown
  selectCharacter?: (id: number) => Promise<unknown> | unknown
  selectReward?: (id: number) => Promise<unknown> | unknown
  selectScenario?: (id: number) => Promise<unknown> | unknown
}

interface SavedCodeWorkbench {
  nodes: CodeNode[]
  connections: CodeConnection[]
  zoom?: number
  panX?: number
  panY?: number
}

const workbenchStorageKey = 'kindrobots-code-workbench'
const itemStorageKey = 'kindrobots-code-items'
const formStorageKey = 'kindrobots-code-form'
const minZoom = 0.25
const maxZoom = 2.5
const zoomStep = 0.1
const nodeWidth = 340
const nodeHeight = 280
const defaultCanvasWidth = 1800
const defaultCanvasHeight = 1000

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const shuffle = <T>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const roundZoom = (value: number) => {
  return Math.round(value * 100) / 100
}

const modelToDashboardKey = (model: CodeModel): CodeDashboardKey => {
  if (model === 'pitch') return 'brainstorm'
  if (model === 'art') return 'art'
  return model
}

const isCodeNode = (node: CodeNode | null): node is CodeNode => Boolean(node)

const isCodeActionCard = (
  card: CodeActionCard | undefined,
): card is CodeActionCard => Boolean(card)

const isCodeGraph = (graph: unknown): graph is CodeGraph => {
  if (!graph || typeof graph !== 'object') return false

  const candidate = graph as Partial<CodeGraph>

  return (
    candidate.version === 1 &&
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.connections)
  )
}

const fallbackGraph = (): CodeGraph => ({
  version: 1,
  nodes: [],
  connections: [],
  zoom: 1,
  panX: 0,
  panY: 0,
})

const definitionSeeds: CodeDefinition[] = [
  {
    kind: 'openai-text',
    title: 'OpenAI Text',
    subtitle: 'Improve, write, summarize, remix.',
    description: 'Sends text to OpenAI and returns text.',
    icon: 'kind-icon:openai',
    category: 'Text AI',
    accent: 'primary',
    inputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'openai-image',
    title: 'OpenAI Image',
    subtitle: 'Prompt to image.',
    description:
      'Sends a prompt to OpenAI image generation and returns an image.',
    icon: 'kind-icon:image',
    category: 'Image AI',
    accent: 'secondary',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'anthropic-text',
    title: 'Anthropic Text',
    subtitle: 'Claude-style text pass.',
    description: 'Sends text to Anthropic and returns text.',
    icon: 'kind-icon:sparkles',
    category: 'Text AI',
    accent: 'accent',
    inputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'text-input',
    title: 'Text Input',
    subtitle: 'Start with words.',
    description: 'A user-written text block that can feed other cards.',
    icon: 'kind-icon:chat',
    category: 'Input',
    accent: 'info',
    inputs: [],
    outputs: [
      {
        id: 'text',
        label: 'Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'image-upload-select',
    title: 'Image Upload / Select',
    subtitle: 'Start with an image.',
    description: 'Upload or select an ArtImage from the gallery.',
    icon: 'kind-icon:upload',
    category: 'Input',
    accent: 'info',
    inputs: [],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'stable-diffusion',
    title: 'Stable Diffusion',
    subtitle: 'Classic image modeler.',
    description:
      'Turns text prompts into ArtImage records through an SD server.',
    icon: 'kind-icon:paintbrush',
    category: 'Image AI',
    accent: 'secondary',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'comfy-sdxl',
    title: 'Comfy SDXL',
    subtitle: 'SDXL workflow.',
    description: 'Runs an SDXL Comfy workflow.',
    icon: 'kind-icon:workflow',
    category: 'Comfy',
    accent: 'secondary',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'comfy-kombine',
    title: 'Comfy Kombine',
    subtitle: 'Blend image ideas.',
    description: 'Combines image and text conditions into a new image.',
    icon: 'kind-icon:combine',
    category: 'Comfy',
    accent: 'secondary',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'comfy-kontext',
    title: 'Comfy Kontext',
    subtitle: 'Edit with context.',
    description: 'Uses an image plus prompt to make contextual edits.',
    icon: 'kind-icon:wand',
    category: 'Comfy',
    accent: 'secondary',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'comfy-schnell',
    title: 'Comfy Schnell',
    subtitle: 'Fast Flux.',
    description: 'Runs a fast Flux-style image generation card.',
    icon: 'kind-icon:bolt',
    category: 'Comfy',
    accent: 'warning',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'comfy-dev',
    title: 'Comfy Dev',
    subtitle: 'Higher quality Flux.',
    description: 'Runs a higher quality Flux-dev style image generation card.',
    icon: 'kind-icon:flask',
    category: 'Comfy',
    accent: 'warning',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'image2vid',
    title: 'Image to Video',
    subtitle: 'Animate an image.',
    description: 'Turns an image and optional prompt into video.',
    icon: 'kind-icon:video',
    category: 'Video',
    accent: 'accent',
    inputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'input',
        required: true,
      },
      {
        id: 'prompt',
        label: 'Motion Prompt',
        type: 'text',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'video',
        label: 'Video',
        type: 'video',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'text2vid',
    title: 'Text to Video',
    subtitle: 'Prompt to motion.',
    description: 'Turns a text prompt into video.',
    icon: 'kind-icon:movie',
    category: 'Video',
    accent: 'accent',
    inputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'text',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'video',
        label: 'Video',
        type: 'video',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'img2model',
    title: 'Image to 3D Model',
    subtitle: 'Image to printable model.',
    description: 'Turns an image or character sheet into a model output.',
    icon: 'kind-icon:cube',
    category: '3D',
    accent: 'primary',
    inputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'input',
        required: true,
      },
    ],
    outputs: [
      {
        id: 'model',
        label: '3D Model',
        type: 'model',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'character',
    title: 'Character',
    subtitle: 'Kind Robots character.',
    description: 'Creates, selects, or updates a Character record.',
    icon: 'kind-icon:character',
    category: 'Kind Models',
    accent: 'primary',
    inputs: [
      {
        id: 'text',
        label: 'Character Text',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Portrait',
        type: 'image',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'character',
        label: 'Character',
        type: 'character',
        direction: 'output',
      },
      {
        id: 'text',
        label: 'Character Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'dream',
    title: 'Dream',
    subtitle: 'Location or world.',
    description: 'Creates, selects, or updates a Dream location.',
    icon: 'kind-icon:dream',
    category: 'Kind Models',
    accent: 'primary',
    inputs: [
      {
        id: 'text',
        label: 'Dream Text',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Dream Image',
        type: 'image',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'dream',
        label: 'Dream',
        type: 'dream',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'pitch',
    title: 'Pitch',
    subtitle: 'Big idea fuel.',
    description: 'Creates, selects, or updates a Pitch.',
    icon: 'kind-icon:lightbulb',
    category: 'Kind Models',
    accent: 'info',
    inputs: [
      {
        id: 'text',
        label: 'Idea Text',
        type: 'text',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'pitch',
        label: 'Pitch',
        type: 'pitch',
        direction: 'output',
      },
      {
        id: 'text',
        label: 'Pitch Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'prompt',
    title: 'Prompt',
    subtitle: 'Specific AI instruction.',
    description: 'Creates, selects, or updates a Prompt.',
    icon: 'kind-icon:prompt',
    category: 'Kind Models',
    accent: 'info',
    inputs: [
      {
        id: 'text',
        label: 'Prompt Text',
        type: 'text',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'prompt',
        label: 'Prompt',
        type: 'prompt',
        direction: 'output',
      },
      {
        id: 'text',
        label: 'Prompt Text',
        type: 'text',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'bot',
    title: 'Bot',
    subtitle: 'Reusable persona.',
    description: 'Creates, selects, or updates a Bot.',
    icon: 'kind-icon:bot',
    category: 'Kind Models',
    accent: 'primary',
    inputs: [
      {
        id: 'text',
        label: 'Bot Text',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Avatar',
        type: 'image',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'bot',
        label: 'Bot',
        type: 'bot',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'random-image',
    title: 'Random Image',
    subtitle: 'Pull from collection.',
    description: 'Selects a random ArtImage from a collection.',
    icon: 'kind-icon:dice',
    category: 'Input',
    accent: 'warning',
    inputs: [
      {
        id: 'collection',
        label: 'Collection',
        type: 'collection',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'image',
        label: 'Image',
        type: 'image',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'reward',
    title: 'Reward',
    subtitle: 'Item, skill, power.',
    description: 'Creates, selects, or updates a Reward.',
    icon: 'kind-icon:treasure',
    category: 'Kind Models',
    accent: 'warning',
    inputs: [
      {
        id: 'text',
        label: 'Reward Text',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Reward Image',
        type: 'image',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'reward',
        label: 'Reward',
        type: 'reward',
        direction: 'output',
      },
    ],
  },
  {
    kind: 'scenario',
    title: 'Scenario',
    subtitle: 'Playable story setup.',
    description: 'Creates, selects, or updates a Scenario.',
    icon: 'kind-icon:scenario',
    category: 'Kind Models',
    accent: 'primary',
    inputs: [
      {
        id: 'text',
        label: 'Scenario Text',
        type: 'text',
        direction: 'input',
      },
      {
        id: 'image',
        label: 'Scenario Image',
        type: 'image',
        direction: 'input',
      },
      {
        id: 'character',
        label: 'Character',
        type: 'character',
        direction: 'input',
      },
    ],
    outputs: [
      {
        id: 'scenario',
        label: 'Scenario',
        type: 'scenario',
        direction: 'output',
      },
    ],
  },
]

const templateSeeds: CodeTemplate[] = [
  {
    id: 'text-tennis',
    title: 'Text Tennis',
    description:
      'OpenAI improves text, Anthropic improves it again, then the loop can be extended.',
    icon: 'kind-icon:tennis',
    nodes: [
      { kind: 'text-input', title: 'Original Text', x: 80, y: 110 },
      { kind: 'openai-text', title: 'OpenAI Pass', x: 390, y: 80 },
      { kind: 'anthropic-text', title: 'Anthropic Pass', x: 700, y: 120 },
      { kind: 'openai-text', title: 'OpenAI Polish', x: 1010, y: 80 },
      { kind: 'anthropic-text', title: 'Anthropic Final', x: 1320, y: 120 },
    ],
    connections: [
      { fromIndex: 0, fromPortId: 'text', toIndex: 1, toPortId: 'text' },
      { fromIndex: 1, fromPortId: 'text', toIndex: 2, toPortId: 'text' },
      { fromIndex: 2, fromPortId: 'text', toIndex: 3, toPortId: 'text' },
      { fromIndex: 3, fromPortId: 'text', toIndex: 4, toPortId: 'text' },
    ],
  },
  {
    id: 'art-maker',
    title: 'Art Maker',
    description:
      'A plain idea becomes a stronger art prompt, then generates an image.',
    icon: 'kind-icon:paintbrush',
    nodes: [
      { kind: 'text-input', title: 'Idea', x: 80, y: 160 },
      { kind: 'openai-text', title: 'Prompt Builder', x: 390, y: 120 },
      { kind: 'stable-diffusion', title: 'Local Art Modeler', x: 700, y: 160 },
    ],
    connections: [
      { fromIndex: 0, fromPortId: 'text', toIndex: 1, toPortId: 'text' },
      { fromIndex: 1, fromPortId: 'text', toIndex: 2, toPortId: 'prompt' },
    ],
  },
  {
    id: 'character-to-print',
    title: 'Character to Printable Model',
    description:
      'Text becomes a character sheet, then an image, then a 3D printable model.',
    icon: 'kind-icon:cube',
    nodes: [
      { kind: 'text-input', title: 'Character Idea', x: 80, y: 150 },
      { kind: 'character', title: 'Character Sheet', x: 390, y: 100 },
      { kind: 'comfy-dev', title: 'Character Image', x: 700, y: 150 },
      { kind: 'img2model', title: 'Printable Model', x: 1010, y: 150 },
    ],
    connections: [
      { fromIndex: 0, fromPortId: 'text', toIndex: 1, toPortId: 'text' },
      { fromIndex: 1, fromPortId: 'text', toIndex: 2, toPortId: 'prompt' },
      { fromIndex: 2, fromPortId: 'image', toIndex: 3, toPortId: 'image' },
    ],
  },
]

export const useCodeStore = defineStore('codeStore', () => {
  const userStore = useUserStore()
  const pitchStore = usePitchStore()
  const dreamStore = useDreamStore()
  const characterStore = useCharacterStore()
  const rewardStore = useRewardStore()
  const scenarioStore = useScenarioStore()
  const navStore = useNavStore()

  const items = ref<Code[]>([])
  const selected = ref<Code | null>(null)
  const form = ref<CodeForm>({})
  const isSaving = ref(false)
  const isInitialized = ref(false)
  const loading = ref(false)

  const definitions = ref<CodeDefinition[]>([...definitionSeeds])
  const templates = ref<CodeTemplate[]>([...templateSeeds])
  const nodes = ref<CodeNode[]>([])
  const connections = ref<CodeConnection[]>([])
  const selectedNodeId = ref<string | null>(null)
  const pendingConnection = ref<PendingCodeConnection | null>(null)
  const actionHand = ref<CodeActionCard[]>([])
  const actionHandSize = ref(6)
  const message = ref('')

  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const isPanMode = ref(false)
  const viewportWidth = ref(0)
  const viewportHeight = ref(0)
  const panelMode = ref<CodePanelMode>('closed')
  const mobileTrayMode = ref<CodeMobileTrayMode>('closed')
  const showToybox = ref(true)
  const showQuickPlays = ref(true)
  const showMiniMap = ref(true)
  const showCanvasGrid = ref(true)
  const snapToGrid = ref(false)
  const gridSize = ref(28)

  const ownedItems = computed(() => {
    return items.value.filter((item) => item.userId === userStore.user?.id)
  })

  const selectedNode = computed(() => {
    return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null
  })

  const selectedDefinition = computed(() => {
    if (!selectedNode.value) {
      return null
    }

    return getDefinition(selectedNode.value.kind)
  })

  const currentGraph = computed<CodeGraph>(() => ({
    version: 1,
    nodes: nodes.value,
    connections: connections.value,
    zoom: zoom.value,
    panX: panX.value,
    panY: panY.value,
  }))

  const zoomPercent = computed(() => {
    return Math.round(zoom.value * 100)
  })

  const isZoomed = computed(() => {
    return zoom.value !== 1
  })

  const hasNodes = computed(() => {
    return nodes.value.length > 0
  })

  const hasConnections = computed(() => {
    return connections.value.length > 0
  })

  const groupedDefinitions = computed(() => {
    return definitions.value.reduce<Record<string, CodeDefinition[]>>(
      (groups, definition) => {
        const category = definition.category
        groups[category] ??= []
        groups[category].push(definition)
        return groups
      },
      {},
    )
  })

  const canvasBounds = computed(() => {
    const right = Math.max(
      defaultCanvasWidth,
      ...nodes.value.map((node) => node.x + nodeWidth),
    )

    const bottom = Math.max(
      defaultCanvasHeight,
      ...nodes.value.map((node) => node.y + nodeHeight),
    )

    return {
      width: right,
      height: bottom,
    }
  })

  const transformedCanvasBounds = computed(() => {
    return {
      width: Math.round(canvasBounds.value.width * zoom.value),
      height: Math.round(canvasBounds.value.height * zoom.value),
    }
  })

  const nodeBounds = computed(() => {
    if (!nodes.value.length) {
      return {
        minX: 0,
        minY: 0,
        maxX: defaultCanvasWidth,
        maxY: defaultCanvasHeight,
        width: defaultCanvasWidth,
        height: defaultCanvasHeight,
      }
    }

    const minX = Math.min(...nodes.value.map((node) => node.x))
    const minY = Math.min(...nodes.value.map((node) => node.y))
    const maxX = Math.max(...nodes.value.map((node) => node.x + nodeWidth))
    const maxY = Math.max(...nodes.value.map((node) => node.y + nodeHeight))

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  })

  const codeTargets = computed<CodeTarget[]>(() => {
    const pitchTargets: CodeTarget[] = pitchStore.pitches
      .filter((pitch) => pitch?.id)
      .map((pitch) => ({
        id: pitch.id,
        title: pitch.title || pitch.pitch || `Pitch ${pitch.id}`,
        model: 'pitch',
      }))

    const dreamTargets: CodeTarget[] = dreamStore.dreams
      .filter((dream) => dream?.id)
      .map((dream) => ({
        id: dream.id,
        title: dream.title || `Dream ${dream.id}`,
        model: 'dream',
      }))

    const characterTargets: CodeTarget[] = characterStore.characters
      .filter((character) => character?.id)
      .map((character) => ({
        id: character.id,
        title: character.name || `Character ${character.id}`,
        model: 'character',
      }))

    const rewardTargets: CodeTarget[] = rewardStore.rewards
      .filter((reward) => reward?.id)
      .map((reward) => ({
        id: reward.id,
        title: reward.label || `Reward ${reward.id}`,
        model: 'reward',
      }))

    const scenarioTargets: CodeTarget[] = scenarioStore.scenarios
      .filter((scenario) => scenario?.id)
      .map((scenario) => ({
        id: scenario.id,
        title: scenario.title || `Scenario ${scenario.id}`,
        model: 'scenario',
      }))

    return [
      ...pitchTargets,
      ...dreamTargets,
      ...characterTargets,
      ...rewardTargets,
      ...scenarioTargets,
    ]
  })

  const baseActionCards = computed<CodeActionCard[]>(() => [
    {
      id: makeId('action'),
      title: 'Add Pitch',
      subtitle: 'Start a new world seed',
      description: 'Create the big strange idea everything else grows from.',
      icon: 'kind-icon:sparkles',
      kind: 'add-pitch',
      model: 'pitch',
    },
    {
      id: makeId('action'),
      title: 'Add Location',
      subtitle: 'Create a Dream',
      description:
        'Add a place, realm, set piece, dungeon, void mall, or suspicious moon.',
      icon: 'kind-icon:map',
      kind: 'add-dream',
      model: 'dream',
    },
    {
      id: makeId('action'),
      title: 'Add Character',
      subtitle: 'Create someone dramatic',
      description:
        'Add a hero, villain, chaos goblin, mentor, rival, or lore-adjacent menace.',
      icon: 'kind-icon:character',
      kind: 'add-character',
      model: 'character',
    },
    {
      id: makeId('action'),
      title: 'Add Reward',
      subtitle: 'Skill or treasure',
      description:
        'Create loot, magic, a special move, a cursed object, or a deeply suspicious sandwich.',
      icon: 'kind-icon:treasure',
      kind: 'add-reward',
      model: 'reward',
    },
    {
      id: makeId('action'),
      title: 'Add Scenario',
      subtitle: 'Create a story prompt',
      description:
        'Add a choice, challenge, art prompt, text prompt, or interactive situation.',
      icon: 'kind-icon:story',
      kind: 'add-scenario',
      model: 'scenario',
    },
  ])

  const targetActionCards = computed<CodeActionCard[]>(() => {
    return codeTargets.value.flatMap((target) => [
      {
        id: makeId('action'),
        title: 'Create Art',
        subtitle: target.title,
        description: `Generate art for ${target.title}.`,
        icon: 'kind-icon:paintbrush',
        kind: 'create-art' as const,
        model: target.model,
        targetId: target.id,
        targetTitle: target.title,
      },
      {
        id: makeId('action'),
        title: 'Edit',
        subtitle: target.title,
        description: `Open ${target.title} for revision and polish.`,
        icon: 'kind-icon:edit',
        kind: 'edit-target' as const,
        model: target.model,
        targetId: target.id,
        targetTitle: target.title,
      },
      {
        id: makeId('action'),
        title: 'Interact',
        subtitle: target.title,
        description: `Use ${target.title} as an interactive prompt tool.`,
        icon: 'kind-icon:chat',
        kind: 'interact-target' as const,
        model: target.model,
        targetId: target.id,
        targetTitle: target.title,
      },
    ])
  })

  const rewardFlavorActionCards = computed<CodeActionCard[]>(() => {
    const hasStoryTarget = codeTargets.value.some((target) => {
      return target.model === 'dream' || target.model === 'scenario'
    })

    if (!hasStoryTarget) {
      return []
    }

    return [
      {
        id: makeId('action'),
        title: 'Add Skill',
        subtitle: 'World ability',
        description:
          'Create a skill, power, trick, move, or special interaction for this world.',
        icon: 'kind-icon:magic',
        kind: 'add-skill',
        model: 'reward',
      },
      {
        id: makeId('action'),
        title: 'Add Treasure',
        subtitle: 'Loot with consequences',
        description:
          'Create an item, relic, artifact, key, device, prize, or cursed keepsake.',
        icon: 'kind-icon:gem',
        kind: 'add-treasure',
        model: 'reward',
      },
    ]
  })

  const actionDeck = computed<CodeActionCard[]>(() => [
    ...baseActionCards.value,
    ...targetActionCards.value,
    ...rewardFlavorActionCards.value,
  ])

  function syncToLocalStorage() {
    if (!import.meta.client) {
      return
    }

    const workbenchPayload: SavedCodeWorkbench = {
      nodes: nodes.value,
      connections: connections.value,
      zoom: zoom.value,
      panX: panX.value,
      panY: panY.value,
    }

    try {
      localStorage.setItem(itemStorageKey, JSON.stringify(items.value))
      localStorage.setItem(formStorageKey, JSON.stringify(form.value))
      localStorage.setItem(
        workbenchStorageKey,
        JSON.stringify(workbenchPayload),
      )
    } catch (error) {
      console.error('[codeStore] localStorage sync error:', error)
    }
  }

  function loadLocalStorage() {
    if (!import.meta.client) {
      return
    }

    try {
      const localItems = localStorage.getItem(itemStorageKey)
      const localForm = localStorage.getItem(formStorageKey)
      const localWorkbench = localStorage.getItem(workbenchStorageKey)

      if (localItems) {
        items.value = JSON.parse(localItems)
      }

      if (localForm) {
        const parsedForm = JSON.parse(localForm) as CodeForm
        form.value = {
          ...parsedForm,
          graph: parseGraph(parsedForm.graph),
        }
      }

      if (localWorkbench) {
        const parsed = JSON.parse(localWorkbench) as Partial<SavedCodeWorkbench>

        nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes : []
        connections.value = Array.isArray(parsed.connections)
          ? parsed.connections
          : []

        if (typeof parsed.zoom === 'number') {
          zoom.value = roundZoom(clamp(parsed.zoom, minZoom, maxZoom))
        }

        if (typeof parsed.panX === 'number') {
          panX.value = Math.round(parsed.panX)
        }

        if (typeof parsed.panY === 'number') {
          panY.value = Math.round(parsed.panY)
        }
      }
    } catch (error) {
      console.error('[codeStore] localStorage load error:', error)
      items.value = []
      form.value = {}
      nodes.value = []
      connections.value = []
      zoom.value = 1
      panX.value = 0
      panY.value = 0
    }
  }

  function parseGraph(graph: unknown): CodeGraph {
    if (isCodeGraph(graph)) {
      return {
        version: 1,
        nodes: graph.nodes,
        connections: graph.connections,
        zoom: typeof graph.zoom === 'number' ? graph.zoom : 1,
        panX: typeof graph.panX === 'number' ? graph.panX : 0,
        panY: typeof graph.panY === 'number' ? graph.panY : 0,
      }
    }

    return fallbackGraph()
  }

  function applyGraphToWorkbench(graph: unknown) {
    const parsed = parseGraph(graph)

    nodes.value = parsed.nodes
    connections.value = parsed.connections
    zoom.value = roundZoom(clamp(parsed.zoom, minZoom, maxZoom))
    panX.value = Math.round(parsed.panX)
    panY.value = Math.round(parsed.panY)
    selectedNodeId.value = null
    pendingConnection.value = null
    closeSelectedNodeSettings()
    syncToLocalStorage()
  }

  function saveCurrentToForm() {
    form.value = {
      ...form.value,
      graph: currentGraph.value,
    }

    syncToLocalStorage()
  }

  function loadFormToWorkbench() {
    applyGraphToWorkbench(form.value.graph)
  }

  function preparePayload(payload: Partial<CodeForm>) {
    const graph = payload.graph ?? currentGraph.value
    const title = payload.title?.trim() || 'Untitled Code Blueprint'

    return {
      title,
      description: payload.description?.trim() || null,
      icon: payload.icon?.trim() || 'kind-icon:blocks',
      graph,
      isPublic: payload.isPublic ?? false,
      isOfficial: payload.isOfficial ?? false,
      isActive: payload.isActive ?? true,
    }
  }

  async function initialize() {
    if (isInitialized.value) {
      return
    }

    try {
      definitions.value = [...definitionSeeds]
      templates.value = [...templateSeeds]
      loadLocalStorage()
      reshuffleActionHand()

      const fetched = await fetchAllModels()
      const fetchedIds = new Set(fetched.map((item) => item.id))

      items.value = [
        ...items.value.filter((item) => !fetchedIds.has(item.id)),
        ...fetched,
      ]

      syncToLocalStorage()
      isInitialized.value = true
    } catch (error) {
      handleError(error, 'initializing code store')
    }
  }

  async function fetchAllModels(): Promise<Code[]> {
    loading.value = true

    try {
      const res = await performFetch<Code[]>('/api/code')

      if (res.success && res.data) {
        items.value = res.data
        syncToLocalStorage()
        return res.data
      }

      throw new Error(res.message || 'Failed to fetch Code blueprints')
    } catch (error) {
      handleError(error, 'fetching Code blueprints')
      return []
    } finally {
      loading.value = false
    }
  }

  async function fetchModelById(id: number): Promise<Code | null> {
    try {
      const res = await performFetch<Code>(`/api/code/${id}`)

      if (res.success && res.data) {
        return res.data
      }

      throw new Error(res.message || `Failed to fetch Code blueprint ${id}`)
    } catch (error) {
      handleError(error, 'fetching Code blueprint by ID')
      return null
    }
  }

  async function addModel(payload: Partial<CodeForm>) {
    isSaving.value = true

    try {
      const res = await performFetch<Code>('/api/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(payload)),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to create Code blueprint')
      }

      items.value.push(res.data)
      selected.value = res.data
      form.value = {
        ...res.data,
        graph: parseGraph(res.data.graph),
      }

      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
      }
    } catch (error) {
      handleError(error, 'creating Code blueprint')

      return {
        success: false,
        message: (error as Error).message,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function updateModel(id: number, updates: Partial<CodeForm>) {
    isSaving.value = true

    try {
      const res = await performFetch<Code>(`/api/code/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(updates)),
      })

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to update Code blueprint')
      }

      const index = items.value.findIndex((item) => item.id === id)

      if (index !== -1) {
        items.value[index] = res.data
      } else {
        items.value.push(res.data)
      }

      selected.value = res.data
      form.value = {
        ...res.data,
        graph: parseGraph(res.data.graph),
      }

      syncToLocalStorage()

      return {
        success: true,
        data: res.data,
      }
    } catch (error) {
      handleError(error, 'updating Code blueprint')

      return {
        success: false,
        message: (error as Error).message,
      }
    } finally {
      isSaving.value = false
    }
  }

  async function deleteModel(id: number) {
    try {
      const res = await performFetch(`/api/code/${id}`, {
        method: 'DELETE',
      })

      if (res.success) {
        items.value = items.value.filter((item) => item.id !== id)

        if (selected.value?.id === id) {
          deselectModel()
        }

        syncToLocalStorage()
        return {
          success: true,
        }
      }

      throw new Error(res.message || 'Failed to delete Code blueprint')
    } catch (error) {
      handleError(error, 'deleting Code blueprint')

      return {
        success: false,
        message: (error as Error).message,
      }
    }
  }

  function selectModel(id: number) {
    const item = items.value.find((candidate) => candidate.id === id)

    if (item) {
      selected.value = item
      form.value = {
        ...item,
        graph: parseGraph(item.graph),
      }
    }
  }

  async function selectModelById(id: number) {
    const local = items.value.find((candidate) => candidate.id === id)

    if (local) {
      selectModel(id)
      return local
    }

    const fetched = await fetchModelById(id)

    if (fetched) {
      items.value.push(fetched)
      selectModel(fetched.id)
      syncToLocalStorage()
    }

    return fetched
  }

  function deselectModel() {
    selected.value = null
    form.value = {}
    syncToLocalStorage()
  }

  function createNewModel() {
    selected.value = null
    form.value = {
      title: 'Untitled Code Blueprint',
      description: '',
      icon: 'kind-icon:blocks',
      graph: currentGraph.value,
      isPublic: false,
      isOfficial: false,
      isActive: true,
    }

    syncToLocalStorage()
  }

  async function saveModel() {
    saveCurrentToForm()

    if (!form.value) {
      return {
        success: false,
        message: 'No Code form loaded.',
      }
    }

    if (form.value.id) {
      return await updateModel(form.value.id, form.value)
    }

    return await addModel(form.value)
  }

  async function saveCurrentModel(title?: string) {
    saveCurrentToForm()

    if (title?.trim()) {
      form.value.title = title.trim()
    }

    return await saveModel()
  }

  async function loadModelToWorkbench(id: number) {
    const item = await selectModelById(id)

    if (!item) {
      return {
        success: false,
        message: `Code blueprint ${id} not found.`,
      }
    }

    applyGraphToWorkbench(item.graph)

    return {
      success: true,
      data: item,
    }
  }

  function getDefinition(kind: CodeKind) {
    return (
      definitions.value.find((definition) => definition.kind === kind) ?? null
    )
  }

  function getNode(nodeId: string) {
    return nodes.value.find((node) => node.id === nodeId) ?? null
  }

  function getConnection(connectionId: string) {
    return (
      connections.value.find((connection) => connection.id === connectionId) ??
      null
    )
  }

  function getDataTypeAccent(type: CodeDataType) {
    const classes: Record<CodeDataType, string> = {
      text: 'info',
      image: 'secondary',
      model: 'accent',
      video: 'accent',
      character: 'warning',
      dream: 'primary',
      pitch: 'info',
      prompt: 'error',
      bot: 'primary',
      reward: 'warning',
      scenario: 'primary',
      collection: 'success',
    }

    return classes[type] ?? 'primary'
  }

  function getConnectionClass(type: CodeDataType) {
    const classes: Record<CodeDataType, string> = {
      text: 'stroke-info',
      image: 'stroke-secondary',
      model: 'stroke-accent',
      video: 'stroke-accent',
      character: 'stroke-warning',
      dream: 'stroke-primary',
      pitch: 'stroke-info',
      prompt: 'stroke-error',
      bot: 'stroke-primary',
      reward: 'stroke-warning',
      scenario: 'stroke-primary',
      collection: 'stroke-success',
    }

    return classes[type] ?? 'stroke-primary'
  }

  function setMessage(newMessage: string) {
    message.value = newMessage
  }

  function clearMessage() {
    message.value = ''
  }

  function setViewport(width: number, height: number) {
    viewportWidth.value = Math.max(0, Math.round(width))
    viewportHeight.value = Math.max(0, Math.round(height))
  }

  function setZoom(nextZoom: number) {
    zoom.value = roundZoom(clamp(nextZoom, minZoom, maxZoom))
    syncToLocalStorage()
    return zoom.value
  }

  function zoomIn() {
    return setZoom(zoom.value + zoomStep)
  }

  function zoomOut() {
    return setZoom(zoom.value - zoomStep)
  }

  function resetZoom() {
    return setZoom(1)
  }

  function fitToView(viewport?: CodeViewport, padding = 120) {
    const targetViewport = viewport ?? {
      width: viewportWidth.value,
      height: viewportHeight.value,
    }

    if (!targetViewport.width || !targetViewport.height) {
      return zoom.value
    }

    const bounds = nodeBounds.value
    const usableWidth = Math.max(1, targetViewport.width - padding)
    const usableHeight = Math.max(1, targetViewport.height - padding)
    const nextZoom = Math.min(
      usableWidth / Math.max(1, bounds.width),
      usableHeight / Math.max(1, bounds.height),
      1,
    )

    return setZoom(nextZoom)
  }

  function setPan(x: number, y: number) {
    panX.value = Math.round(x)
    panY.value = Math.round(y)
    syncToLocalStorage()

    return {
      x: panX.value,
      y: panY.value,
    }
  }

  function panBy(deltaX: number, deltaY: number) {
    return setPan(panX.value + deltaX, panY.value + deltaY)
  }

  function resetPan() {
    return setPan(0, 0)
  }

  function togglePanMode(force?: boolean) {
    isPanMode.value = typeof force === 'boolean' ? force : !isPanMode.value
    return isPanMode.value
  }

  function toCanvasPoint(x: number, y: number): CodePoint {
    return {
      x: Math.round((x - panX.value) / zoom.value),
      y: Math.round((y - panY.value) / zoom.value),
    }
  }

  function fromCanvasPoint(x: number, y: number): CodePoint {
    return {
      x: Math.round(x * zoom.value + panX.value),
      y: Math.round(y * zoom.value + panY.value),
    }
  }

  function normalizeNodePoint(x: number, y: number): CodePoint {
    const rawX = Math.max(0, Math.round(x))
    const rawY = Math.max(0, Math.round(y))

    if (!snapToGrid.value) {
      return {
        x: rawX,
        y: rawY,
      }
    }

    return {
      x: Math.round(rawX / gridSize.value) * gridSize.value,
      y: Math.round(rawY / gridSize.value) * gridSize.value,
    }
  }

  function openPanel(mode: CodePanelMode) {
    panelMode.value = mode
  }

  function closePanel() {
    panelMode.value = 'closed'
  }

  function openSelectedNodeSettings() {
    if (!selectedNode.value) {
      panelMode.value = 'closed'
      mobileTrayMode.value = 'closed'
      return false
    }

    panelMode.value = 'node-settings'
    mobileTrayMode.value = 'settings'
    return true
  }

  function closeSelectedNodeSettings() {
    if (panelMode.value === 'node-settings') {
      panelMode.value = 'closed'
    }

    if (mobileTrayMode.value === 'settings') {
      mobileTrayMode.value = 'closed'
    }
  }

  function setMobileTray(mode: CodeMobileTrayMode) {
    mobileTrayMode.value = mode
  }

  function toggleToybox(force?: boolean) {
    showToybox.value = typeof force === 'boolean' ? force : !showToybox.value
    return showToybox.value
  }

  function toggleQuickPlays(force?: boolean) {
    showQuickPlays.value =
      typeof force === 'boolean' ? force : !showQuickPlays.value
    return showQuickPlays.value
  }

  function toggleMiniMap(force?: boolean) {
    showMiniMap.value = typeof force === 'boolean' ? force : !showMiniMap.value
    return showMiniMap.value
  }

  function toggleCanvasGrid(force?: boolean) {
    showCanvasGrid.value =
      typeof force === 'boolean' ? force : !showCanvasGrid.value
    return showCanvasGrid.value
  }

  function toggleSnapToGrid(force?: boolean) {
    snapToGrid.value = typeof force === 'boolean' ? force : !snapToGrid.value
    return snapToGrid.value
  }

  function setGridSize(size: number) {
    gridSize.value = Math.max(4, Math.round(size))
    return gridSize.value
  }

  function drawActionCards(count = actionHandSize.value) {
    return shuffle(actionDeck.value).slice(0, count)
  }

  function reshuffleActionHand() {
    actionHand.value = drawActionCards()
    message.value =
      'Quick Plays reshuffled. Chaos has received fresh paperwork.'
  }

  function replaceActionCard(playedCard: CodeActionCard) {
    const usedIds = new Set(actionHand.value.map((card) => card.id))

    const availableCards = shuffle(actionDeck.value).filter((card) => {
      return !usedIds.has(card.id) && card.kind !== playedCard.kind
    })

    const replacement = availableCards[0] ?? drawActionCards(1)[0]

    if (!replacement) {
      actionHand.value = actionHand.value.filter((card) => {
        return card.id !== playedCard.id
      })
      return
    }

    actionHand.value = actionHand.value
      .map((card) => {
        if (card.id === playedCard.id) {
          return replacement
        }

        return card
      })
      .filter(isCodeActionCard)
  }

  function addNode(kind: CodeKind, x = 100, y = 100, title?: string) {
    const definition = getDefinition(kind)

    if (!definition) {
      message.value = `Unknown card type: ${kind}`
      return null
    }

    const point = normalizeNodePoint(x, y)

    const node: CodeNode = {
      id: makeId('node'),
      kind,
      title: title ?? definition.title,
      x: point.x,
      y: point.y,
      values: {},
    }

    nodes.value.push(node)
    selectedNodeId.value = node.id
    message.value = `${definition.title} added. Tiny plastic brick deployed.`
    syncToLocalStorage()

    return node
  }

  function duplicateNode(nodeId: string) {
    const node = getNode(nodeId)

    if (!node) {
      message.value = 'Node not found.'
      return null
    }

    return addNode(node.kind, node.x + 40, node.y + 40, `${node.title} Copy`)
  }

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const node = getNode(nodeId)

    if (!node) {
      return
    }

    const point = normalizeNodePoint(x, y)

    node.x = point.x
    node.y = point.y
    syncToLocalStorage()
  }

  function updateNodeTitle(nodeId: string, title: string) {
    const node = getNode(nodeId)

    if (!node) {
      return false
    }

    node.title = title.trim() || node.title
    syncToLocalStorage()
    return true
  }

  function updateNodeValue(nodeId: string, key: string, value: unknown) {
    const node = getNode(nodeId)

    if (!node) {
      return false
    }

    node.values = {
      ...node.values,
      [key]: value,
    }

    syncToLocalStorage()
    return true
  }

  function updateNodeValues(nodeId: string, values: Record<string, unknown>) {
    const node = getNode(nodeId)

    if (!node) {
      return false
    }

    node.values = {
      ...node.values,
      ...values,
    }

    syncToLocalStorage()
    return true
  }

  function clearNodeValues(nodeId: string) {
    const node = getNode(nodeId)

    if (!node) {
      return false
    }

    node.values = {}
    syncToLocalStorage()
    return true
  }

  function selectNode(nodeId: string | null, openSettings = false) {
    selectedNodeId.value = nodeId

    if (!nodeId) {
      closeSelectedNodeSettings()
      return
    }

    if (openSettings) {
      openSelectedNodeSettings()
    }
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter((node) => node.id !== nodeId)

    connections.value = connections.value.filter((connection) => {
      return connection.fromNodeId !== nodeId && connection.toNodeId !== nodeId
    })

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
      closeSelectedNodeSettings()
    }

    if (pendingConnection.value?.fromNodeId === nodeId) {
      pendingConnection.value = null
    }

    message.value = 'Card removed. The tiny brick has left the chat.'
    syncToLocalStorage()
  }

  function beginConnection(nodeId: string, portId: string) {
    const node = getNode(nodeId)
    const definition = node ? getDefinition(node.kind) : null
    const port = definition?.outputs.find((candidate) => {
      return candidate.id === portId
    })

    if (!node || !definition || !port) {
      return
    }

    pendingConnection.value = {
      fromNodeId: nodeId,
      fromPortId: portId,
      type: port.type,
    }

    message.value = `Connecting ${port.label}. Pick a matching input.`
  }

  function cancelConnection() {
    pendingConnection.value = null
    message.value = 'Connection cancelled.'
  }

  function completeConnection(nodeId: string, portId: string) {
    if (!pendingConnection.value) {
      return
    }

    const toNode = getNode(nodeId)
    const toDefinition = toNode ? getDefinition(toNode.kind) : null
    const toPort = toDefinition?.inputs.find((candidate) => {
      return candidate.id === portId
    })

    if (!toNode || !toDefinition || !toPort) {
      pendingConnection.value = null
      return
    }

    if (pendingConnection.value.fromNodeId === nodeId) {
      message.value =
        'A card cannot connect to itself. Even Legos need boundaries.'
      return
    }

    if (pendingConnection.value.type !== toPort.type) {
      message.value = `${pendingConnection.value.type} cannot connect to ${toPort.type}. Wrong peg shape.`
      return
    }

    const exists = connections.value.some((connection) => {
      return (
        connection.fromNodeId === pendingConnection.value?.fromNodeId &&
        connection.fromPortId === pendingConnection.value?.fromPortId &&
        connection.toNodeId === nodeId &&
        connection.toPortId === portId
      )
    })

    if (exists) {
      pendingConnection.value = null
      message.value = 'That connection already exists.'
      return
    }

    connections.value.push({
      id: makeId('connection'),
      fromNodeId: pendingConnection.value.fromNodeId,
      fromPortId: pendingConnection.value.fromPortId,
      toNodeId: nodeId,
      toPortId: portId,
      type: pendingConnection.value.type,
    })

    pendingConnection.value = null
    message.value = 'Connection snapped in. Satisfying click noise implied.'
    syncToLocalStorage()
  }

  function removeConnection(connectionId: string) {
    connections.value = connections.value.filter((connection) => {
      return connection.id !== connectionId
    })

    syncToLocalStorage()
  }

  function clearBoard() {
    nodes.value = []
    connections.value = []
    selectedNodeId.value = null
    pendingConnection.value = null
    closeSelectedNodeSettings()
    message.value = 'Workbench cleared.'
    syncToLocalStorage()
  }

  function loadTemplate(templateId: string) {
    const template = templates.value.find((candidate) => {
      return candidate.id === templateId
    })

    if (!template) {
      message.value = 'Template not found.'
      return
    }

    const createdNodes = template.nodes
      .map((templateNode) => {
        return addNode(
          templateNode.kind,
          templateNode.x,
          templateNode.y,
          templateNode.title,
        )
      })
      .filter(isCodeNode)

    template.connections.forEach((templateConnection) => {
      const fromNode = createdNodes[templateConnection.fromIndex]
      const toNode = createdNodes[templateConnection.toIndex]

      if (!fromNode || !toNode) {
        return
      }

      const fromDefinition = getDefinition(fromNode.kind)
      const fromPort = fromDefinition?.outputs.find((port) => {
        return port.id === templateConnection.fromPortId
      })

      if (!fromPort) {
        return
      }

      connections.value.push({
        id: makeId('connection'),
        fromNodeId: fromNode.id,
        fromPortId: templateConnection.fromPortId,
        toNodeId: toNode.id,
        toPortId: templateConnection.toPortId,
        type: fromPort.type,
      })
    })

    message.value = `${template.title} loaded. Toybox: officially weaponized.`
    syncToLocalStorage()
  }

  function openModelTab(model: CodeModel, tab: string) {
    const dashboardKey = modelToDashboardKey(model)
    navStore.setDashboardTab(dashboardKey, tab)
  }

  async function selectActionTarget(card: CodeActionCard) {
    if (!card.model || !card.targetId) {
      return
    }

    const pitchActions = pitchStore as SelectableStore
    const dreamActions = dreamStore as SelectableStore
    const characterActions = characterStore as SelectableStore
    const rewardActions = rewardStore as SelectableStore
    const scenarioActions = scenarioStore as SelectableStore

    if (card.model === 'pitch' && pitchActions.selectPitch) {
      await pitchActions.selectPitch(card.targetId)
    }

    if (card.model === 'dream' && dreamActions.selectDream) {
      await dreamActions.selectDream(card.targetId)
    }

    if (card.model === 'character' && characterActions.selectCharacter) {
      await characterActions.selectCharacter(card.targetId)
    }

    if (card.model === 'reward' && rewardActions.selectReward) {
      await rewardActions.selectReward(card.targetId)
    }

    if (card.model === 'scenario' && scenarioActions.selectScenario) {
      await scenarioActions.selectScenario(card.targetId)
    }
  }

  function openAddAction(model: CodeModel) {
    openModelTab(model, 'add')
  }

  async function openEditAction(card: CodeActionCard) {
    await selectActionTarget(card)

    if (card.model) {
      openModelTab(card.model, 'add')
    }
  }

  async function openInteractAction(card: CodeActionCard) {
    await selectActionTarget(card)

    if (card.model) {
      openModelTab(card.model, 'interact')
    }
  }

  async function openArtAction(card: CodeActionCard) {
    await selectActionTarget(card)
    openModelTab('art', 'add')
  }

  async function playActionCard(card: CodeActionCard) {
    clearMessage()

    if (card.kind === 'add-pitch') {
      openAddAction('pitch')
      addNode('pitch', 120, 140)
    }

    if (card.kind === 'add-dream') {
      openAddAction('dream')
      addNode('dream', 120, 180)
    }

    if (card.kind === 'add-character') {
      openAddAction('character')
      addNode('character', 120, 220)
    }

    if (card.kind === 'add-reward') {
      openAddAction('reward')
      addNode('reward', 120, 260)
    }

    if (card.kind === 'add-scenario') {
      openAddAction('scenario')
      addNode('scenario', 120, 300)
    }

    if (card.kind === 'create-art') {
      await openArtAction(card)

      addNode(
        'stable-diffusion',
        420,
        180,
        card.targetTitle ? `Art for ${card.targetTitle}` : undefined,
      )
    }

    if (card.kind === 'edit-target') {
      await openEditAction(card)
    }

    if (card.kind === 'interact-target') {
      await openInteractAction(card)
    }

    if (card.kind === 'add-skill') {
      openAddAction('reward')
      addNode('reward', 120, 260, 'New Skill')
      message.value = 'Skill reward mode selected. Teach the world a new trick.'
    }

    if (card.kind === 'add-treasure') {
      openAddAction('reward')
      addNode('reward', 120, 260, 'New Treasure')
      message.value =
        'Treasure reward mode selected. Probably cursed. Excellent.'
    }

    if (card.kind === 'expand-concept') {
      openModelTab('scenario', 'add')
      addNode('scenario', 120, 300, 'Expanded Concept')
    }

    replaceActionCard(card)
  }

  function resetWorkbench() {
    nodes.value = []
    connections.value = []
    selectedNodeId.value = null
    pendingConnection.value = null
    actionHand.value = []
    message.value = ''
    zoom.value = 1
    panX.value = 0
    panY.value = 0
    isPanMode.value = false
    panelMode.value = 'closed'
    mobileTrayMode.value = 'closed'
    syncToLocalStorage()
  }

  return {
    items,
    selected,
    form,
    isSaving,
    isInitialized,
    loading,
    ownedItems,
    definitions,
    templates,
    nodes,
    connections,
    selectedNodeId,
    pendingConnection,
    actionHand,
    actionHandSize,
    message,
    zoom,
    panX,
    panY,
    isPanMode,
    viewportWidth,
    viewportHeight,
    panelMode,
    mobileTrayMode,
    showToybox,
    showQuickPlays,
    showMiniMap,
    showCanvasGrid,
    snapToGrid,
    gridSize,
    selectedNode,
    selectedDefinition,
    currentGraph,
    zoomPercent,
    isZoomed,
    hasNodes,
    hasConnections,
    groupedDefinitions,
    canvasBounds,
    transformedCanvasBounds,
    nodeBounds,
    codeTargets,
    baseActionCards,
    targetActionCards,
    rewardFlavorActionCards,
    actionDeck,
    initialize,
    fetchAllModels,
    fetchModelById,
    addModel,
    updateModel,
    deleteModel,
    selectModel,
    selectModelById,
    deselectModel,
    createNewModel,
    saveModel,
    saveCurrentModel,
    loadModelToWorkbench,
    syncToLocalStorage,
    loadLocalStorage,
    parseGraph,
    applyGraphToWorkbench,
    saveCurrentToForm,
    loadFormToWorkbench,
    preparePayload,
    getDefinition,
    getNode,
    getConnection,
    getDataTypeAccent,
    getConnectionClass,
    setMessage,
    clearMessage,
    setViewport,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToView,
    setPan,
    panBy,
    resetPan,
    togglePanMode,
    toCanvasPoint,
    fromCanvasPoint,
    normalizeNodePoint,
    openPanel,
    closePanel,
    openSelectedNodeSettings,
    closeSelectedNodeSettings,
    setMobileTray,
    toggleToybox,
    toggleQuickPlays,
    toggleMiniMap,
    toggleCanvasGrid,
    toggleSnapToGrid,
    setGridSize,
    drawActionCards,
    reshuffleActionHand,
    replaceActionCard,
    addNode,
    duplicateNode,
    updateNodePosition,
    updateNodeTitle,
    updateNodeValue,
    updateNodeValues,
    clearNodeValues,
    selectNode,
    removeNode,
    beginConnection,
    cancelConnection,
    completeConnection,
    removeConnection,
    clearBoard,
    loadTemplate,
    openModelTab,
    selectActionTarget,
    openAddAction,
    openEditAction,
    openInteractAction,
    openArtAction,
    playActionCard,
    resetWorkbench,
  }
})

export type { Code }
