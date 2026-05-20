// /stores/codeStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { usePitchStore } from '@/stores/pitchStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useNavStore } from '@/stores/navStore'

export type CodeDataType =
  | 'text'
  | 'image'
  | 'model'
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
}

const storageKey = 'kindrobots-code-workbench'

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const shuffle = <T>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

const modelToDashboardKey = (model: CodeModel): CodeDashboardKey => {
  if (model === 'pitch') return 'brainstorm'
  if (model === 'art') return 'art'
  return model
}

const isCodeNode = (node: CodeNode | null): node is CodeNode => Boolean(node)

const isCodeActionCard = (
  card: CodeActionCard | undefined,
): card is CodeActionCard => Boolean(card)

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
        id: 'video-model',
        label: 'Video Model',
        type: 'model',
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
        id: 'video-model',
        label: 'Video Model',
        type: 'model',
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
  const pitchStore = usePitchStore()
  const dreamStore = useDreamStore()
  const characterStore = useCharacterStore()
  const rewardStore = useRewardStore()
  const scenarioStore = useScenarioStore()
  const navStore = useNavStore()

  const definitions = ref<CodeDefinition[]>([...definitionSeeds])
  const templates = ref<CodeTemplate[]>([...templateSeeds])
  const nodes = ref<CodeNode[]>([])
  const connections = ref<CodeConnection[]>([])
  const selectedNodeId = ref<string | null>(null)
  const pendingConnection = ref<PendingCodeConnection | null>(null)
  const actionHand = ref<CodeActionCard[]>([])
  const actionHandSize = ref(6)
  const message = ref('')
  const isInitialized = ref(false)

  const selectedNode = computed(() => {
    return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null
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
    const right = Math.max(1600, ...nodes.value.map((node) => node.x + 340))
    const bottom = Math.max(900, ...nodes.value.map((node) => node.y + 260))

    return {
      width: right,
      height: bottom,
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
        kind: 'create-art',
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
        kind: 'edit-target',
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
        kind: 'interact-target',
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

  function getDefinition(kind: CodeKind) {
    return (
      definitions.value.find((definition) => definition.kind === kind) ?? null
    )
  }

  function setMessage(newMessage: string) {
    message.value = newMessage
  }

  function clearMessage() {
    message.value = ''
  }

  function syncToLocalStorage() {
    if (!import.meta.client) {
      return
    }

    const payload: SavedCodeWorkbench = {
      nodes: nodes.value,
      connections: connections.value,
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(payload))
    } catch (error) {
      console.error('[codeStore] localStorage sync error:', error)
    }
  }

  function loadLocalStorage() {
    if (!import.meta.client) {
      return
    }

    try {
      const raw = localStorage.getItem(storageKey)

      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as Partial<SavedCodeWorkbench>

      nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes : []
      connections.value = Array.isArray(parsed.connections)
        ? parsed.connections
        : []
    } catch (error) {
      console.error('[codeStore] localStorage load error:', error)
      nodes.value = []
      connections.value = []
    }
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

    const node: CodeNode = {
      id: makeId('node'),
      kind,
      title: title ?? definition.title,
      x: Math.max(0, Math.round(x)),
      y: Math.max(0, Math.round(y)),
      values: {},
    }

    nodes.value.push(node)
    selectedNodeId.value = node.id
    message.value = `${definition.title} added. Tiny plastic brick deployed.`
    syncToLocalStorage()

    return node
  }

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const node = nodes.value.find((candidate) => candidate.id === nodeId)

    if (!node) {
      return
    }

    node.x = Math.max(0, Math.round(x))
    node.y = Math.max(0, Math.round(y))
    syncToLocalStorage()
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter((node) => node.id !== nodeId)

    connections.value = connections.value.filter((connection) => {
      return connection.fromNodeId !== nodeId && connection.toNodeId !== nodeId
    })

    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }

    if (pendingConnection.value?.fromNodeId === nodeId) {
      pendingConnection.value = null
    }

    message.value = 'Card removed. The tiny brick has left the chat.'
    syncToLocalStorage()
  }

  function beginConnection(nodeId: string, portId: string) {
    const node = nodes.value.find((candidate) => candidate.id === nodeId)
    const definition = node ? getDefinition(node.kind) : null
    const port = definition?.outputs.find(
      (candidate) => candidate.id === portId,
    )

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

  function completeConnection(nodeId: string, portId: string) {
    if (!pendingConnection.value) {
      return
    }

    const toNode = nodes.value.find((candidate) => candidate.id === nodeId)
    const toDefinition = toNode ? getDefinition(toNode.kind) : null
    const toPort = toDefinition?.inputs.find(
      (candidate) => candidate.id === portId,
    )

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
    message.value = 'Workbench cleared.'
    syncToLocalStorage()
  }

  function loadTemplate(templateId: string) {
    const template = templates.value.find(
      (candidate) => candidate.id === templateId,
    )

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

  function initialize() {
    if (isInitialized.value) {
      return
    }

    definitions.value = [...definitionSeeds]
    templates.value = [...templateSeeds]
    loadLocalStorage()
    reshuffleActionHand()
    isInitialized.value = true
  }

  function resetWorkbench() {
    nodes.value = []
    connections.value = []
    selectedNodeId.value = null
    pendingConnection.value = null
    actionHand.value = []
    message.value = ''
    isInitialized.value = false
    syncToLocalStorage()
  }

  return {
    definitions,
    templates,
    nodes,
    connections,
    selectedNodeId,
    pendingConnection,
    actionHand,
    actionHandSize,
    message,
    isInitialized,
    selectedNode,
    groupedDefinitions,
    canvasBounds,
    codeTargets,
    baseActionCards,
    targetActionCards,
    rewardFlavorActionCards,
    actionDeck,
    initialize,
    getDefinition,
    setMessage,
    clearMessage,
    syncToLocalStorage,
    loadLocalStorage,
    drawActionCards,
    reshuffleActionHand,
    replaceActionCard,
    addNode,
    updateNodePosition,
    selectNode,
    removeNode,
    beginConnection,
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
