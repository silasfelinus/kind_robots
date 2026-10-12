import { ARCADE_GAMES } from '@/utils/arcade/games'
import type {
  ConductorPitch,
  ConductorProject,
} from '@/server/utils/conductorProjection'
import type { ConductorTask } from '@/server/utils/conductorRoadmap'

export type PitchBuildStage =
  | 'awaiting-intake'
  | 'scaffolded'
  | 'building'
  | 'page-linked'
  | 'shared-project'

export interface ApprovedPitchProgress {
  pitch: ConductorPitch
  project: ConductorProject | null
  projectSlug: string
  publicReady: boolean
  stage: PitchBuildStage
  completedBuildTasks: number
  totalBuildTasks: number
  pageUrl: string | null
  isSharedProject: boolean
}

export const DAILY_PITCH_START = '2026-10-01'

export function safeProjectPageUrl(url?: string | null): string | null {
  const trimmed = url?.trim() ?? ''
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (/^https:\/\/[^/\s]+(?:\/[^\s]*)?$/i.test(trimmed)) return trimmed
  return null
}

export function pitchProjectSlug(pitch: ConductorPitch): string {
  if (pitch.projectTarget && pitch.projectTarget !== 'new') {
    return pitch.projectTarget
  }
  return pitch.slug.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

export function mayVisitPitchFrontend(
  entry: Pick<ApprovedPitchProgress, 'publicReady' | 'pageUrl'>,
  isAdmin: boolean,
): boolean {
  return Boolean(entry.pageUrl && (isAdmin || entry.publicReady))
}

function arcadePitchPageUrl(pitch: ConductorPitch): string | null {
  const matched = pitch.slug.match(/^\d{4}-\d{2}-\d{2}-kr-cabinet-(.+)$/)
  const game = matched
    ? ARCADE_GAMES.find((item) => item.slug === matched[1])
    : undefined
  return game
    ? safeProjectPageUrl(game.route || '/play/arcade?game=' + encodeURIComponent(game.slug))
    : null
}

export function isImplementationTask(task: ConductorTask): boolean {
  return !/^(confirm scope|scope approval|approve scope|write (the )?design brief|draft (the )?design brief|create (the )?design brief)\b/i.test(
    task.title.trim(),
  )
}

export function approvedDailyPitchProgress(
  pitches: readonly ConductorPitch[],
  projects: readonly ConductorProject[],
): ApprovedPitchProgress[] {
  const bySlug = new Map(projects.map((project) => [project.slug, project]))
  return pitches
    .filter(
      (pitch) =>
        pitch.date >= DAILY_PITCH_START &&
        pitch.status.trim().toLowerCase() === 'approved',
    )
    .map((pitch) => {
      const projectSlug = pitchProjectSlug(pitch)
      const project = bySlug.get(projectSlug) ?? null
      const isSharedProject = Boolean(
        pitch.projectTarget && pitch.projectTarget !== 'new',
      )
      const buildTasks = project?.tasks.filter(isImplementationTask) ?? []
      const completedBuildTasks = buildTasks.filter(
        (task) => task.status === 'done',
      ).length
      const pageUrl = isSharedProject
        ? projectSlug === 'kr-arcade'
          ? arcadePitchPageUrl(pitch)
          : null
        : safeProjectPageUrl(project?.liveUrl)
      const stage: PitchBuildStage = isSharedProject
        ? 'shared-project'
        : !project
          ? 'awaiting-intake'
          : pageUrl
            ? 'page-linked'
            : completedBuildTasks > 0
              ? 'building'
              : 'scaffolded'
      return {
        pitch,
        project,
        projectSlug,
        publicReady: pitch.publicReady === true,
        stage,
        completedBuildTasks,
        totalBuildTasks: buildTasks.length,
        pageUrl,
        isSharedProject,
      }
    })
    .sort(
      (a, b) =>
        b.pitch.date.localeCompare(a.pitch.date) ||
        a.pitch.title.localeCompare(b.pitch.title),
    )
}

export const PITCH_STAGE_LABELS: Record<PitchBuildStage, string> = {
  'awaiting-intake': 'Approved · not scaffolded',
  scaffolded: 'Scaffolded · build not started',
  building: 'Implementation recorded',
  'page-linked': 'Page linked · not verified live',
  'shared-project': 'Approved for existing project',
}
