export const BRAINSTORM_MIN_RESULTS = 1
export const BRAINSTORM_MAX_RESULTS = 24
export const BRAINSTORM_DEFAULT_RESULTS = 8

export const BRAINSTORM_RETURN_TYPES = [
  {
    id: 'dark-humor',
    label: 'Dark humor',
    description: 'Gallows humor, irony, cartoon peril, and darker comic premises where allowed.',
  },
  {
    id: 'pun',
    label: 'Pun / wordplay',
    description: 'Language-driven ideas with an actual premise, not just a word swapped into a title.',
  },
  {
    id: 'dad-joke',
    label: 'Dad joke',
    description: 'Earnest groaners, literal misunderstandings, and proudly obvious comic machinery.',
  },
  {
    id: 'dry-observation',
    label: 'Dry observation',
    description: 'Underplayed, deadpan, or sharply observed responses that trust the premise.',
  },
  {
    id: 'absurd-escalation',
    label: 'Absurd escalation',
    description: 'Take one coherent mechanism farther until the consequences become delightfully unreasonable.',
  },
  {
    id: 'practical',
    label: 'Practical',
    description: 'Useful, buildable, or actionable answers that still avoid the obvious first draft.',
  },
  {
    id: 'inversion',
    label: 'Inversion',
    description: 'Reverse a role, assumption, incentive, cause, or expected outcome.',
  },
  {
    id: 'left-field',
    label: 'Left field',
    description: 'A surprising but premise-connected angle that changes the mechanism rather than adding random nouns.',
  },
] as const

export type BrainstormReturnTypeId = (typeof BRAINSTORM_RETURN_TYPES)[number]['id']
export type BrainstormBatchShape = 'focused' | 'assortment'

export type BrainstormReturnTypeRequest = {
  id: BrainstormReturnTypeId
  count?: number
}

export type BrainstormCandidateStatus = 'pending' | 'kept' | 'rejected'

export type BrainstormRevisionReason =
  | 'generated'
  | 'edited'
  | 'regenerated'
  | 'branched'
  | 'restored'

export type BrainstormGenerationState =
  | 'idle'
  | 'generating'
  | 'success'
  | 'error'

export type BrainstormErrorKind =
  | 'validation'
  | 'auth'
  | 'mana'
  | 'server'
  | 'provider'
  | 'malformed'
  | 'network'

export type BrainstormSourceRef = {
  modelType: string
  id?: number
  slug?: string
  intent?: string
}

export type BrainstormCandidateRevision = {
  title?: string
  text: string
  createdAt: string
  reason: BrainstormRevisionReason
  returnType?: BrainstormReturnTypeId | null
}

export type BrainstormBranchOrigin = {
  candidateId: string
  revisionIndex: number
  title?: string
  text: string
}

export type BrainstormCandidateArtMeta = {
  jobIds: number[]
  imageIds: number[]
}

export type BrainstormCandidateMeta = {
  source?: BrainstormSourceRef | null
  intent?: string | null
  returnType?: BrainstormReturnTypeId | null
  branchOrigin?: BrainstormBranchOrigin | null
  art?: BrainstormCandidateArtMeta
}

export type BrainstormCandidate = {
  id: string
  batchId: string
  title: string
  text: string
  status: BrainstormCandidateStatus
  feedback: string
  edited: boolean
  parentId?: string | null
  revisions: BrainstormCandidateRevision[]
  meta: BrainstormCandidateMeta
}

export type BrainstormReferenceCandidate = {
  title?: string
  text: string
}

export type BrainstormGenerateRequest = {
  premise: string
  count: number
  constraints?: string
  examples?: string[]
  mode?: string
  batchShape?: BrainstormBatchShape
  returnTypes?: BrainstormReturnTypeRequest[]
  source?: BrainstormSourceRef | null
  replaceCandidateId?: string | null
  parentCandidateId?: string | null
  referenceCandidate?: BrainstormReferenceCandidate | null
  feedback?: string
}

export type BrainstormServerSnapshot = {
  id?: number | null
  serverType?: string | null
  baseUrl?: string | null
  endpointPath?: string | null
  model?: string | null
}

export type BrainstormGeneratePayload = BrainstormGenerateRequest & {
  server?: BrainstormServerSnapshot
}

export type BrainstormGeneratedCandidate = {
  title?: string
  text: string
  returnType?: BrainstormReturnTypeId
}

export type BrainstormGenerateData = {
  candidates: BrainstormGeneratedCandidate[]
}

export type BrainstormBatch = {
  id: string
  createdAt: string
  premise: string
  request: BrainstormGenerateRequest
  candidateIds: string[]
}

export type BrainstormError = {
  kind: BrainstormErrorKind
  message: string
  status?: number | null
}

export type BrainstormSessionSnapshot = {
  version: 1
  premise: string
  resultCount: number
  constraints: string
  examples: string[]
  mode: string
  batchShape: BrainstormBatchShape
  returnTypes: BrainstormReturnTypeRequest[]
  source: BrainstormSourceRef | null
  candidates: BrainstormCandidate[]
  batches: BrainstormBatch[]
  activeBatchId: string | null
  lastGeneratedAt: string | null
}
