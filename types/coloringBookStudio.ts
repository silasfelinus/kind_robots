export type ColoringBookVariant = 'color' | 'bw'

export type ColoringBookStudioOperation =
  | 'generate-color-proposals'
  | 'accept-color'
  | 'generate-bw'
  | 'accept-bw'
  | 'finalize-pair'

export type ColoringBookAsset = {
  path: string
  kind: string
  url: string | null
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
  colorUrl: string | null
  bwUrl: string | null
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
  fetchedAt: string
}

export type ColoringBookPromptUpdate = {
  bookSlug: string
  proposalId: string
  prompt: string
}

export type ColoringBookRenderRequest = {
  operation?: ColoringBookStudioOperation
  bookSlug: string
  proposalId: string
  force?: boolean
  note?: string
}
