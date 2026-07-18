// /stores/projectStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  ArtCollection,
  ArtImage,
  Bot,
  PitchSheet,
  Project,
} from '~/prisma/generated/prisma/client'
import { performFetch } from '@/stores/utils'
import {
  PROJECT_PLACEMENTS,
  placementLiveUrl,
} from '~/utils/projectPlacements'

export type ProjectWithRelations = Project & {
  Manager?: Pick<
    Bot,
    'id' | 'name' | 'slug' | 'avatarImage' | 'imagePath'
  > | null
  ArtImage?: Partial<ArtImage> | null
  ArtCollection?: Partial<ArtCollection> | null
  PitchSheet?: Partial<PitchSheet> | null
  _count?: {
    Chats?: number
    Todos?: number
    Reactions?: number
    ArtJobs?: number
    ArtImageLinks?: number
    ArtCollectionLinks?: number
  }
}

export type ProjectPriorityLevel = Project['priority']

export type ProjectListOptions = {
  mine?: boolean
  includeInactive?: boolean
  includeMature?: boolean
  status?: Project['status']
  priority?: Project['priority']
  channelKey?: string
  search?: string
  take?: number
  skip?: number
}

export type ProjectPlacementFailure = {
  slug: string
  message: string
}

export type ApplyPlacementsResult = {
  updated: string[]
  unchanged: string[]
  missing: string[]
  failed: ProjectPlacementFailure[]
}

function queryString(options: ProjectListOptions): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }

  const value = query.toString()
  return value ? `?${value}` : ''
}

function mergeProjectDetail(
  existing: ProjectWithRelations,
  incoming: Project,
): ProjectWithRelations {
  const merged: ProjectWithRelations = {
    ...existing,
    ...incoming,
  }

  if (incoming.managerBotId !== existing.managerBotId) {
    merged.Manager = null
  }

  if (incoming.artImageId !== existing.artImageId) {
    merged.ArtImage = null
  }

  if (incoming.artCollectionId !== existing.artCollectionId) {
    merged.ArtCollection = null
  }

  return merged
}

export const useProjectStore = defineStore('projectStore', () => {
  const projects = ref<ProjectWithRelations[]>([])
  const selectedProject = ref<ProjectWithRelations | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const activeProjects = computed(() =>
    projects.value.filter(
      (project) => project.isActive && project.status !== 'ARCHIVED',
    ),
  )
  const publicProjects = computed(() =>
    activeProjects.value.filter(
      (project) => project.isPublic && !project.isMature,
    ),
  )
  const projectsBySlug = computed(() => {
    const index = new Map<string, ProjectWithRelations>()

    for (const project of projects.value) {
      if (project.slug) index.set(project.slug, project)
      if (project.conductorSlug) index.set(project.conductorSlug, project)
    }

    return index
  })

  function projectForSlug(slug?: string | null): ProjectWithRelations | null {
    if (!slug) return null
    return projectsBySlug.value.get(slug) ?? null
  }

  function replaceProject(project: Project): ProjectWithRelations {
    const index = projects.value.findIndex((entry) => entry.id === project.id)
    const previous =
      index >= 0
        ? projects.value[index]
        : selectedProject.value?.id === project.id
          ? selectedProject.value
          : null
    const next = previous ? mergeProjectDetail(previous, project) : project

    if (index >= 0) projects.value[index] = next
    else projects.value.unshift(next)

    if (selectedProject.value?.id === project.id) {
      selectedProject.value = next
    }

    return next
  }

  async function fetchProjects(
    options: ProjectListOptions = {},
  ): Promise<ProjectWithRelations[]> {
    loading.value = true
    error.value = null

    try {
      const response = await performFetch<ProjectWithRelations[]>(
        `/api/projects${queryString(options)}`,
      )

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch Projects.')
      }

      projects.value = response.data ?? []
      loaded.value = true

      return projects.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function fetchProject(
    key: number | string,
  ): Promise<ProjectWithRelations> {
    loading.value = true
    error.value = null

    try {
      const response = await performFetch<ProjectWithRelations>(
        `/api/projects/${key}`,
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Project not found.')
      }

      selectedProject.value = replaceProject(response.data)

      return selectedProject.value
    } finally {
      loading.value = false
    }
  }

  async function createProject(
    input: Partial<Project> & Pick<Project, 'title'>,
  ): Promise<ProjectWithRelations> {
    saving.value = true

    try {
      const response = await performFetch<Project>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create Project.')
      }

      return replaceProject(response.data)
    } finally {
      saving.value = false
    }
  }

  async function updateProject(
    id: number,
    input: Partial<Project>,
  ): Promise<ProjectWithRelations> {
    saving.value = true

    try {
      const response = await performFetch<Project>(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update Project.')
      }

      return replaceProject(response.data)
    } finally {
      saving.value = false
    }
  }

  async function archiveProject(id: number): Promise<ProjectWithRelations> {
    saving.value = true

    try {
      const response = await performFetch<ProjectWithRelations>(
        `/api/projects/${id}`,
        { method: 'DELETE' },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to archive Project.')
      }

      return replaceProject(response.data)
    } finally {
      saving.value = false
    }
  }

  async function applyPlacements(
    overwriteLiveUrl = false,
  ): Promise<ApplyPlacementsResult> {
    const updated: string[] = []
    const unchanged: string[] = []
    const missing: string[] = []
    const failed: ProjectPlacementFailure[] = []

    for (const [slug, placement] of Object.entries(PROJECT_PLACEMENTS)) {
      const project =
        projectForSlug(slug) ??
        projects.value.find((entry) => entry.conductorSlug === slug) ??
        null

      if (!project) {
        missing.push(slug)
        continue
      }

      const nextLiveUrl =
        overwriteLiveUrl || !project.liveUrl
          ? placementLiveUrl(placement)
          : project.liveUrl

      if (
        project.channelKey === placement.channelKey &&
        project.tabKey === placement.tabKey &&
        project.liveUrl === nextLiveUrl
      ) {
        unchanged.push(slug)
        continue
      }

      try {
        await updateProject(project.id, {
          channelKey: placement.channelKey,
          tabKey: placement.tabKey,
          liveUrl: nextLiveUrl,
        })
        updated.push(slug)
      } catch (cause) {
        failed.push({
          slug,
          message:
            cause instanceof Error
              ? cause.message
              : 'Unknown Project update error',
        })
      }
    }

    return { updated, unchanged, missing, failed }
  }

  return {
    projects,
    selectedProject,
    loading,
    saving,
    loaded,
    error,
    activeProjects,
    publicProjects,
    projectsBySlug,
    projectForSlug,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    archiveProject,
    applyPlacements,
  }
})
