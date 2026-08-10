export const BRAINSTORM_MIN_RESULTS = 1
export const BRAINSTORM_MAX_RESULTS = 24
export const BRAINSTORM_DEFAULT_RESULTS = 8

export type BrainstormCandidateStatus = 'pending' | 'kept' | 'rejected'

export type BrainstormRevisionReason =
  | 'generated'
  | 'edited'
  | 'regenerated'
  | 'branched'

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
}

export type BrainstormCandidateArtMeta = {
  jobIds: number[]
  imageIds: number[]
}

export type BrainstormCandidateMeta = {
  source?: BrainstormSourceRef | null
  intent?: string | null
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
  source: BrainstormSourceRef | null
  candidates: BrainstormCandidate[]
  batches: BrainstormBatch[]
  activeBatchId: string | null
  lastGeneratedAt: string | null
}
