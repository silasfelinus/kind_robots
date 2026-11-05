export type ColoringBookVariant = 'color' | 'bw'

export type ColoringBookStudioOperation =
  | 'generate-color-proposals'
  | 'accept-color'
  | 'generate-bw'
  | 'accept-bw'
  | 'finalize-pair'
  | 'generate-cover'
  | 'accept-cover'
  | 'finalize-cover'

export type ColoringBookHistoryKind =
  'revision' | 'semantic-rejection' | 'mechanical-rejection' | 'unverified'

export type ColoringBookAsset = {
  path: string
  kind: string
  url: string | null
}

export type ColoringBookHistoryItem = {
  id: string
  variant: ColoringBookVariant
  kind: ColoringBookHistoryKind
  path: string | null
  url: string | null
  createdAt: string | null
  status: string | null
  score: number | null
  verdict: string | null
  reasons: string[]
  artImageId: number | null
  seed: number | null
  engine: string | null
}

export type ColoringBookCoverHistoryItem = {
  id: string
  archivedPath: string | null
  archivedUrl: string | null
  requestedAt: string | null
  previousStatus: string | null
  artImageId: number | null
  semanticScore: number | null
}

export type ColoringBookPair = {
  color: string | null
  bw: string | null
}

export type ColoringBookQueueState = {
  status: string
  imagePath: string | null
  renderedPath: string | null
  artImageId: number | null
  semanticScore: number | null
  semanticVerdict: string | null
  semanticAttempts: number
  semanticGateError: string | null
  completedAt: string | null
  renderEngine: string | null
  revisionCount: number
  renderSettings: ColoringBookRenderSettings
  acceptedHistory: ColoringBookAcceptedVersion[]
}

/** Per-page engine/checkpoint/LoRA persisted on the color-art-jobs.yaml entry. */
export type ColoringBookRenderSettings = {
  engine: string | null
  checkpoint: string | null
  lora: string | null
  loraStrength: number | null
}

/** A master that adoption replaced; kept so a revert stays one click away. */
export type ColoringBookAcceptedVersion = {
  variant: ColoringBookVariant
  path: string
  replacedAt: string | null
}

export type ColoringBookRenderEngine =
  'krea2' | 'flux2-klein' | 'flux' | 'sdxl-checkpoint'

export type ColoringBookRenderSettingsRequest = {
  engine: ColoringBookRenderEngine
  checkpointId?: number | null
  loraId?: number | null
  loraStrength?: number | null
}

export type ColoringBookModelOption = {
  id: number
  label: string
  path: string
  generation: string | null
  supportedServer: string
  engines: ColoringBookRenderEngine[]
}

export type ColoringBookRenderOptions = {
  engines: { value: ColoringBookRenderEngine; label: string; hint: string }[]
  checkpoints: ColoringBookModelOption[]
  loras: ColoringBookModelOption[]
}

export type ColoringBookConceptUpdate = {
  bookSlug: string
  proposalId: string
  sourceLineage: string
  recast: string
}

export type ColoringBookUploadRequest = {
  bookSlug: string
  proposalId: string
  variant: ColoringBookVariant
  /** data:image/(png|jpeg|webp);base64,... */
  dataUrl: string
  fileName?: string
}

export type ColoringBookProductionState = {
  bookSlug: string
  proposalId: string
  colorStatus: string
  colorRenderedPath: string | null
  colorArtImageId: number | null
  colorApprovedAt: string | null
  seedLocked: boolean
  bwStatus: string
  bwRenderedPath: string | null
  bwUrl: string | null
  bwArtImageId: number | null
  bwSemanticScore: number | null
  bwSemanticVerdict: string | null
  bwSemanticReasons: string[]
  bwRejectedPath: string | null
  bwCompletedAt: string | null
  bwRevisionCount: number
  pairStatus: string | null
  pairSemanticScore: number | null
  pairSemanticReasons: string[]
  pairFinalizedAt: string | null
  history: ColoringBookHistoryItem[]
}

export type ColoringBookCoverState = {
  order: number
  bookSlug: string
  title: string
  prompt: string
  sourceRef: string | null
  imagePath: string
  status: string
  renderedPath: string | null
  renderedUrl: string | null
  artImageId: number | null
  renderSeed: number | null
  renderEngine: string | null
  completedAt: string | null
  semanticScore: number | null
  semanticVerdict: string | null
  semanticReasons: string[]
  rejectedPath: string | null
  rejectedUrl: string | null
  acceptedPath: string | null
  acceptedUrl: string | null
  approvedAt: string | null
  finalPath: string | null
  finalUrl: string | null
  finalizedAt: string | null
  revisionHistory: ColoringBookCoverHistoryItem[]
  notes: string[]
}

export type ColoringBookProposal = {
  slot: number
  id: string
  title: string
  prompt: string
  promptRef: string | null
  promptSourcePath: string
  inspirations: ColoringBookAsset[]
  accepted: ColoringBookPair
  final: ColoringBookPair
  notes: string[]
  queue: ColoringBookQueueState
  colorPath?: string | null
  colorUrl: string | null
  bwPath?: string | null
  bwUrl: string | null
  concept?: ColoringBookConcept | null
}

export type ColoringBookConcept = {
  workingTitle: string | null
  sourceLineage: string | null
  recast: string | null
  bodyDirection: string | null
  framing: string | null
  horrorEngine: string | null
  campEngine: string | null
  sensuality: string | null
  visualHook: string | null
  originalizationHook: string | null
}

export type ColoringBookCounts = {
  total: number
  prompts: number
  pending: number
  rendered: number
  acceptedColor: number
  acceptedPairs: number
  finalPairs: number
  needsReview: number
  blocked: number
}

export type ColoringBookStudioBook = {
  order: number
  slug: string
  title: string
  status: string
  targetProposals: number
  coverIsSeparate: boolean
  counts: ColoringBookCounts
  proposals: ColoringBookProposal[]
}

export type ColoringBookStudioData = {
  books: ColoringBookStudioBook[]
  fetchedAt: string
  sourceRepo: string
  sourceRef: string
}

export type ColoringBookProductionData = {
  states: Record<string, ColoringBookProductionState>
  covers?: Record<string, ColoringBookCoverState>
  fetchedAt: string
}

export type ColoringBookPromptUpdate = {
  bookSlug: string
  proposalId: string
  prompt: string
}

export type ColoringBookCoverPromptUpdate = {
  bookSlug: string
  prompt: string
}

/**
 * Where a new B&W comes from: the accepted color master (`color`, the default),
 * one specific color or B&W file from the page's history (`version`, with
 * `sourcePath`), or a fresh line-art render of the page prompt (`prompt`).
 */
export type ColoringBookBwSource = 'color' | 'version' | 'prompt'

export type ColoringBookRenderRequest = {
  operation?: ColoringBookStudioOperation
  bookSlug: string
  proposalId?: string
  sourcePath?: string
  /** generate-bw only. */
  bwSource?: ColoringBookBwSource
  force?: boolean
  note?: string
  renderSettings?: ColoringBookRenderSettingsRequest
}
