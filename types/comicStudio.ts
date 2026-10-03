// /types/comicStudio.ts
// Shapes shared by server/api/comics/** and stores/comicStudioStore.ts.
import type { ComicLane } from '~/utils/comicLanes'
import type { ComicIssueLayout } from '~/utils/comicLayouts'

export type ComicSeriesDto = {
  id: number
  slug: string
  title: string
  notes: string | null
  styleProse: string | null
  styleTags: string | null
  negativeTags: string | null
  lanes: ComicLane[]
  isPublicArt: boolean
  coverAttemptId: number | null
  updatedAt: string
}

export type ComicSeriesSummary = {
  id: number
  slug: string
  title: string
  entityCount: number
  slotCount: number
  coverThumbUrl: string | null
  updatedAt: string
}

export type ComicEntityDto = {
  id: number
  key: string
  kind: string
  name: string
  notes: string | null
  secretUntil: string | null
  sortOrder: number
  portraitAttemptId: number | null
}

export type ComicSlotDto = {
  id: number
  entityId: number | null
  issueId: number | null
  key: string
  kind: string
  title: string
  notes: string | null
  aspect: string
  promptProse: string | null
  promptTags: string | null
  negativePrompt: string | null
  useSeriesStyle: boolean
  laneKeys: string[] | null
  status: string
  sortOrder: number
}

export type ComicAttemptDto = {
  id: number
  slotId: number
  laneKey: string
  engine: string
  checkpoint: string | null
  prompt: string
  negativePrompt: string | null
  width: number | null
  height: number | null
  artJobId: number | null
  artImageId: number | null
  status: string
  error: string | null
  verdict: string
  note: string | null
  source: string
  createdAt: string
  thumbUrl: string | null
  fullUrl: string | null
}

export type ComicIssueDto = {
  id: number
  number: number
  title: string
  notes: string | null
  layout: ComicIssueLayout
  layoutVersion: number
}

export type ComicSnapshot = {
  series: ComicSeriesDto
  entities: ComicEntityDto[]
  slots: ComicSlotDto[]
  attempts: ComicAttemptDto[]
  issues: ComicIssueDto[]
  syncedAt: string
}

export type ComicRenderOutcome = {
  laneKey: string
  attemptId: number | null
  status: 'queued' | 'failed' | 'refused'
  message: string | null
}

export type ComicCritiqueDto = {
  id: number
  createdAt: string
  parentId: number | null
  targetType: string
  targetId: number | null
  targetName: string | null
  input: string
  verdict: string
  headline: string
  strengths: string[]
  problems: Array<{ area: string; severity: string; issue: string }>
  questions: string[]
  bar: string
  trigger: string
  model: string
}

export type ComicImportResult = {
  seriesId: number
  created: { entities: number; slots: number; attempts: number }
  skipped: string[]
  errors: string[]
}
