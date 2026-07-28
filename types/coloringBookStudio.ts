export type ColoringBookVariant = 'color' | 'bw'

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

export type ColoringBookPromptUpdate = {
  bookSlug: string
  proposalId: string
  prompt: string
}

export type ColoringBookRenderRequest = {
  bookSlug: string
  proposalId: string
  force?: boolean
  note?: string
}
