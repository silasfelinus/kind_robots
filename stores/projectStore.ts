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

export type ProjectWithRelations = Project & {
  Manager?: Pick<Bot, 'id' | 'name' | 'slug' | 'avatarImage' | 'imagePath'> | null
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

type ApiResult<T> = {
  success: boolean
  data?: T
  message?: string
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

export const useProjectStore = defineStore('projectStore', () => {
  const projects = ref<ProjectWithRelations[]>([])
  const selectedProject = ref<ProjectWithRelations | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const activeProjects = computed(() =>
    projects.value.filter((project) => project.isActive && project.status !== 'ARCHIVED'),
  )
  const publicProjects = computed(() =>
    activeProjects.value.filter((project) => project.isPublic && !project.isMature),
  )
  const projectsBySlug = computed(
    () => new Map(projects.value.flatMap((project) => (project.slug ? [[project.slug, project]] : []))),
  )

  function projectForSlug(slug?: string | null): ProjectWithRelations | null {
    if (!slug) return null
    return projectsBySlug.value.get(slug) ?? null
  }

  function replaceProject(project: ProjectWithRelations): ProjectWithRelations {
    const index = projects.value.findIndex((entry) => entry.id === project.id)
    if (index >= 0) projects.value[index] = project
    else projects.value.unshift(project)
    if (selectedProject.value?.id === project.id) selectedProject.value = project
    return project
  }

  async function fetchProjects(options: ProjectListOptions = {}): Promise<ProjectWithRelations[]> {
    loading.value = true
    error.value = null
    try {
      const response = await performFetch<ProjectWithRelations[]>(
        `/api/projects${queryString(options)}`,
      )
      if (!response.success) throw new Error(response.message || 'Failed to fetch Projects.')
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

  async function fetchProject(key: number | string): Promise<ProjectWithRelations> {
    loading.value = true
    error.value = null
    try {
      const response = await performFetch<ProjectWithRelations>(`/api/projects/${key}`)
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Project not found.')
      }
      selectedProject.value = replaceProject(response.data)
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function createProject(
    input: Partial<Project> & Pick<Project, 'title'>,
  ): Promise<ProjectWithRelations> {
    saving.value = true
    try {
      const response = await performFetch<ProjectWithRelations>('/api/projects', {
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
      const response = await performFetch<ProjectWithRelations>(`/api/projects/${id}`, {
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
      const response = await performFetch<ProjectWithRelations>(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to archive Project.')
      }
      return replaceProject(response.data)
    } finally {
      saving.value = false
    }
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
  }
})
