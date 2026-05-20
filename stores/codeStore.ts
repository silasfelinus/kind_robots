// /stores/codeStore.ts
import { defineStore } from 'pinia'

export type CodeCardDataType = 'text' | 'image' | 'model' | 'character' | 'dream' | 'pitch' | 'prompt' | 'bot' | 'reward' | 'scenario' | 'collection'

export type CodeCardKind =
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

export type CodeCardPortDirection = 'input' | 'output'

export interface CodeCardPort {
  id: string
  label: string
  type: CodeCardDataType
  direction: CodeCardPortDirection
  required?: boolean
}

export interface CodeCardDefinition {
  kind: CodeCardKind
  title: string
  subtitle: string
  description: string
  icon: string
  category: string
  accent: string
  inputs: CodeCardPort[]
  outputs: CodeCardPort[]
}

export interface CodeCardNode {
  id: string
  kind: CodeCardKind
  title: string
  x: number
  y: number
  values: Record<string, unknown>
}

export interface CodeCardConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
  type: CodeCardDataType
}

export interface PendingConnection {
  fromNodeId: string
  fromPortId: string
  type: CodeCardDataType
}

export interface CodeCardTemplateNode {
  kind: CodeCardKind
  title?: string
  x: number
  y: number
}

export interface CodeCardTemplateConnection {
  fromIndex: number
  fromPortId: string
  toIndex: number
  toPortId: string
}

export interface CodeCardTemplate {
  id: string
  title: string
  description: string
  icon: string
  nodes: CodeCardTemplateNode[]
  connections: CodeCardTemplateConnection[]
}

interface CodeCardState {
  definitions: CodeCardDefinition[]
  nodes: CodeCardNode[]
  connections: CodeCardConnection[]
  selectedNodeId: string | null
  pendingConnection: PendingConnection | null
  templates: CodeCardTemplate[]
  message: string
}

const storageKey = 'kindrobots-code-card-workbench'

const makeId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const definitionSeeds: CodeCardDefinition[] = [
  {
    kind: 'openai-text',
    title: 'OpenAI Text',
    subtitle: 'Improve, write, summarize, remix.',
    description: 'Sends text to OpenAI and returns text.',
    icon: 'kind-icon:openai',
    category: 'Text AI',
    accent: 'primary',
    inputs: [{ id: 'text', label: 'Text', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'text', label: 'Text', type: 'text', direction: 'output' }],
  },
  {
    kind: 'openai-image',
    title: 'OpenAI Image',
    subtitle: 'Prompt to image.',
    description: 'Sends a prompt to OpenAI image generation and returns an image.',
    icon: 'kind-icon:image',
    category: 'Image AI',
    accent: 'secondary',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
  },
  {
    kind: 'anthropic-text',
    title: 'Anthropic Text',
    subtitle: 'Claude-style text pass.',
    description: 'Sends text to Anthropic and returns text.',
    icon: 'kind-icon:sparkles',
    category: 'Text AI',
    accent: 'accent',
    inputs: [{ id: 'text', label: 'Text', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'text', label: 'Text', type: 'text', direction: 'output' }],
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
    outputs: [{ id: 'text', label: 'Text', type: 'text', direction: 'output' }],
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
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
  },
  {
    kind: 'stable-diffusion',
    title: 'Stable Diffusion',
    subtitle: 'Classic image modeler.',
    description: 'Turns text prompts into ArtImage records through an SD server.',
    icon: 'kind-icon:paintbrush',
    category: 'Image AI',
    accent: 'secondary',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
  },
  {
    kind: 'comfy-sdxl',
    title: 'Comfy SDXL',
    subtitle: 'SDXL workflow.',
    description: 'Runs an SDXL Comfy workflow.',
    icon: 'kind-icon:workflow',
    category: 'Comfy',
    accent: 'secondary',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
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
      { id: 'prompt', label: 'Prompt', type: 'text', direction: 'input' },
      { id: 'image', label: 'Image', type: 'image', direction: 'input' },
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
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
      { id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true },
      { id: 'image', label: 'Image', type: 'image', direction: 'input', required: true },
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
  },
  {
    kind: 'comfy-schnell',
    title: 'Comfy Schnell',
    subtitle: 'Fast Flux.',
    description: 'Runs a fast Flux-style image generation card.',
    icon: 'kind-icon:bolt',
    category: 'Comfy',
    accent: 'warning',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
  },
  {
    kind: 'comfy-dev',
    title: 'Comfy Dev',
    subtitle: 'Higher quality Flux.',
    description: 'Runs a higher quality Flux-dev style image generation card.',
    icon: 'kind-icon:flask',
    category: 'Comfy',
    accent: 'warning',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
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
      { id: 'image', label: 'Image', type: 'image', direction: 'input', required: true },
      { id: 'prompt', label: 'Motion Prompt', type: 'text', direction: 'input' },
    ],
    outputs: [{ id: 'video-model', label: 'Video Model', type: 'model', direction: 'output' }],
  },
  {
    kind: 'text2vid',
    title: 'Text to Video',
    subtitle: 'Prompt to motion.',
    description: 'Turns a text prompt into video.',
    icon: 'kind-icon:movie',
    category: 'Video',
    accent: 'accent',
    inputs: [{ id: 'prompt', label: 'Prompt', type: 'text', direction: 'input', required: true }],
    outputs: [{ id: 'video-model', label: 'Video Model', type: 'model', direction: 'output' }],
  },
  {
    kind: 'img2model',
    title: 'Image to 3D Model',
    subtitle: 'Image to printable model.',
    description: 'Turns an image or character sheet into a model output.',
    icon: 'kind-icon:cube',
    category: '3D',
    accent: 'primary',
    inputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'input', required: true }],
    outputs: [{ id: 'model', label: '3D Model', type: 'model', direction: 'output' }],
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
      { id: 'text', label: 'Character Text', type: 'text', direction: 'input' },
      { id: 'image', label: 'Portrait', type: 'image', direction: 'input' },
    ],
    outputs: [
      { id: 'character', label: 'Character', type: 'character', direction: 'output' },
      { id: 'text', label: 'Character Text', type: 'text', direction: 'output' },
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
      { id: 'text', label: 'Dream Text', type: 'text', direction: 'input' },
      { id: 'image', label: 'Dream Image', type: 'image', direction: 'input' },
    ],
    outputs: [{ id: 'dream', label: 'Dream', type: 'dream', direction: 'output' }],
  },
  {
    kind: 'pitch',
    title: 'Pitch',
    subtitle: 'Big idea fuel.',
    description: 'Creates, selects, or updates a Pitch.',
    icon: 'kind-icon:lightbulb',
    category: 'Kind Models',
    accent: 'info',
    inputs: [{ id: 'text', label: 'Idea Text', type: 'text', direction: 'input' }],
    outputs: [
      { id: 'pitch', label: 'Pitch', type: 'pitch', direction: 'output' },
      { id: 'text', label: 'Pitch Text', type: 'text', direction: 'output' },
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
    inputs: [{ id: 'text', label: 'Prompt Text', type: 'text', direction: 'input' }],
    outputs: [
      { id: 'prompt', label: 'Prompt', type: 'prompt', direction: 'output' },
      { id: 'text', label: 'Prompt Text', type: 'text', direction: 'output' },
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
      { id: 'text', label: 'Bot Text', type: 'text', direction: 'input' },
      { id: 'image', label: 'Avatar', type: 'image', direction: 'input' },
    ],
    outputs: [{ id: 'bot', label: 'Bot', type: 'bot', direction: 'output' }],
  },
  {
    kind: 'random-image',
    title: 'Random Image',
    subtitle: 'Pull from collection.',
    description: 'Selects a random ArtImage from a collection.',
    icon: 'kind-icon:dice',
    category: 'Input',
    accent: 'warning',
    inputs: [{ id: 'collection', label: 'Collection', type: 'collection', direction: 'input' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image', direction: 'output' }],
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
      { id: 'text', label: 'Reward Text', type: 'text', direction: 'input' },
      { id: 'image', label: 'Reward Image', type: 'image', direction: 'input' },
    ],
    outputs: [{ id: 'reward', label: 'Reward', type: 'reward', direction: 'output' }],
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
      { id: 'text', label: 'Scenario Text', type: 'text', direction: 'input' },
      { id: 'image', label: 'Scenario Image', type: 'image', direction: 'input' },
      { id: 'character', label: 'Character', type: 'character', direction: 'input' },
    ],
    outputs: [{ id: 'scenario', label: 'Scenario', type: 'scenario', direction: 'output' }],
  },
]

const templateSeeds: CodeCardTemplate[] = [
  {
    id: 'text-tennis',
    title: 'Text Tennis',
    description: 'OpenAI improves text, Anthropic improves it again, then the loop can be extended.',
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
    description: 'A plain idea becomes a stronger art prompt, then generates an image.',
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
    description: 'Text becomes a character sheet, then an image, then a 3D printable model.',
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

export const useCodeCardStore = defineStore('codeCardStore', {
  state: (): CodeCardState => ({
    definitions: definitionSeeds,
    nodes: [],
    connections: [],
    selectedNodeId: null,
    pendingConnection: null,
    templates: templateSeeds,
    message: '',
  }),

  getters: {
    selectedNode: (state) =>
      state.nodes.find((node) => node.id === state.selectedNodeId) ?? null,

    groupedDefinitions: (state) => {
      return state.definitions.reduce<Record<string, CodeCardDefinition[]>>((groups, definition) => {
        if (!groups[definition.category]) {
          groups[definition.category] = []
        }

        groups[definition.category].push(definition)
        return groups
      }, {})
    },

    canvasBounds: (state) => {
      const right = Math.max(1600, ...state.nodes.map((node) => node.x + 340))
      const bottom = Math.max(900, ...state.nodes.map((node) => node.y + 260))

      return {
        width: right,
        height: bottom,
      }
    },
  },

  actions: {
    initialize() {
      this.definitions = definitionSeeds
      this.templates = templateSeeds
      this.loadLocal()
    },

    getDefinition(kind: CodeCardKind) {
      return this.definitions.find((definition) => definition.kind === kind) ?? null
    },

    addNode(kind: CodeCardKind, x = 100, y = 100, title?: string) {
      const definition = this.getDefinition(kind)

      if (!definition) {
        this.message = `Unknown card type: ${kind}`
        return null
      }

      const node: CodeCardNode = {
        id: makeId('node'),
        kind,
        title: title ?? definition.title,
        x,
        y,
        values: {},
      }

      this.nodes.push(node)
      this.selectedNodeId = node.id
      this.message = `${definition.title} added. Tiny plastic brick deployed.`
      this.saveLocal()

      return node
    },

    updateNodePosition(nodeId: string, x: number, y: number) {
      const node = this.nodes.find((candidate) => candidate.id === nodeId)

      if (!node) {
        return
      }

      node.x = Math.max(0, Math.round(x))
      node.y = Math.max(0, Math.round(y))
      this.saveLocal()
    },

    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId
    },

    removeNode(nodeId: string) {
      this.nodes = this.nodes.filter((node) => node.id !== nodeId)
      this.connections = this.connections.filter(
        (connection) => connection.fromNodeId !== nodeId && connection.toNodeId !== nodeId,
      )

      if (this.selectedNodeId === nodeId) {
        this.selectedNodeId = null
      }

      if (this.pendingConnection?.fromNodeId === nodeId) {
        this.pendingConnection = null
      }

      this.message = 'Card removed. The tiny brick has left the chat.'
      this.saveLocal()
    },

    beginConnection(nodeId: string, portId: string) {
      const node = this.nodes.find((candidate) => candidate.id === nodeId)
      const definition = node ? this.getDefinition(node.kind) : null
      const port = definition?.outputs.find((candidate) => candidate.id === portId)

      if (!node || !definition || !port) {
        return
      }

      this.pendingConnection = {
        fromNodeId: nodeId,
        fromPortId: portId,
        type: port.type,
      }

      this.message = `Connecting ${port.label}. Pick a matching input.`
    },

    completeConnection(nodeId: string, portId: string) {
      if (!this.pendingConnection) {
        return
      }

      const toNode = this.nodes.find((candidate) => candidate.id === nodeId)
      const toDefinition = toNode ? this.getDefinition(toNode.kind) : null
      const toPort = toDefinition?.inputs.find((candidate) => candidate.id === portId)

      if (!toNode || !toDefinition || !toPort) {
        this.pendingConnection = null
        return
      }

      if (this.pendingConnection.fromNodeId === nodeId) {
        this.message = 'A card cannot connect to itself. Even Legos need boundaries.'
        return
      }

      if (this.pendingConnection.type !== toPort.type) {
        this.message = `${this.pendingConnection.type} cannot connect to ${toPort.type}. Wrong peg shape.`
        return
      }

      const exists = this.connections.some(
        (connection) =>
          connection.fromNodeId === this.pendingConnection?.fromNodeId &&
          connection.fromPortId === this.pendingConnection?.fromPortId &&
          connection.toNodeId === nodeId &&
          connection.toPortId === portId,
      )

      if (exists) {
        this.pendingConnection = null
        this.message = 'That connection already exists.'
        return
      }

      this.connections.push({
        id: makeId('connection'),
        fromNodeId: this.pendingConnection.fromNodeId,
        fromPortId: this.pendingConnection.fromPortId,
        toNodeId: nodeId,
        toPortId: portId,
        type: this.pendingConnection.type,
      })

      this.pendingConnection = null
      this.message = 'Connection snapped in. Satisfying click noise implied.'
      this.saveLocal()
    },

    removeConnection(connectionId: string) {
      this.connections = this.connections.filter((connection) => connection.id !== connectionId)
      this.saveLocal()
    },

    clearBoard() {
      this.nodes = []
      this.connections = []
      this.selectedNodeId = null
      this.pendingConnection = null
      this.message = 'Workbench cleared.'
      this.saveLocal()
    },

    loadTemplate(templateId: string) {
      const template = this.templates.find((candidate) => candidate.id === templateId)

      if (!template) {
        this.message = 'Template not found.'
        return
      }

      const createdNodes = template.nodes
        .map((templateNode) =>
          this.addNode(templateNode.kind, templateNode.x, templateNode.y, templateNode.title),
        )
        .filter((node): node is CodeCardNode => Boolean(node))

      template.connections.forEach((templateConnection) => {
        const fromNode = createdNodes[templateConnection.fromIndex]
        const toNode = createdNodes[templateConnection.toIndex]

        if (!fromNode || !toNode) {
          return
        }

        const fromDefinition = this.getDefinition(fromNode.kind)
        const fromPort = fromDefinition?.outputs.find((port) => port.id === templateConnection.fromPortId)

        if (!fromPort) {
          return
        }

        this.connections.push({
          id: makeId('connection'),
          fromNodeId: fromNode.id,
          fromPortId: templateConnection.fromPortId,
          toNodeId: toNode.id,
          toPortId: templateConnection.toPortId,
          type: fromPort.type,
        })
      })

      this.message = `${template.title} loaded. Toybox: officially weaponized.`
      this.saveLocal()
    },

    saveLocal() {
      if (!import.meta.client) {
        return
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          nodes: this.nodes,
          connections: this.connections,
        }),
      )
    },

    loadLocal() {
      if (!import.meta.client) {
        return
      }

      const raw = localStorage.getItem(storageKey)

      if (!raw) {
        return
      }

      try {
        const parsed = JSON.parse(raw) as Pick<CodeCardState, 'nodes' | 'connections'>

        this.nodes = Array.isArray(parsed.nodes) ? parsed.nodes : []
        this.connections = Array.isArray(parsed.connections) ? parsed.connections : []
      } catch {
        this.nodes = []
        this.connections = []
      }
    },
  },
})