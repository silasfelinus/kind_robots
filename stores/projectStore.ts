// ~/stores/projectStore.ts
import { defineStore } from 'pinia'
import {
  Project as ProjectRecord,
  fetchProjects,
  fetchProjectById,
  addProjects,
  updateProject,
  deleteProject
} from '../server/api/projects'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Project = ProjectRecord

interface ProjectState {
  projects: Project[]
  selectedProject: Project | null
}

export const useProjectStore = defineStore({
  id: 'projects',
  state: (): ProjectState => ({
    projects: [],
    selectedProject: null
  }),
  getters: {
    getSelectedProject(): Project | null {
      return this.selectedProject
    }
  },
  actions: {
    async fetchProjects(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.projects = await fetchProjects(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Projects fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch projects.'
      )
    },
    async fetchProjectById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const project = await fetchProjectById(id)
          if (project) {
            const projectIndex = this.projects.findIndex(
              (existingProject) => existingProject.id === id
            )
            if (projectIndex !== -1) {
              this.projects.splice(projectIndex, 1, project)
            } else {
              this.projects.push(project)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch project by id.'
      )
    },
    async addProjects(projectData: Partial<Project>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { projects: newProjects } = await addProjects(projectData)
          this.projects.push(...newProjects)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newProjects.length} project(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add projects.'
      )
    },
    async updateProject(id: number, data: Partial<Project>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedProject = await updateProject(id, data)
          if (updatedProject) {
            const projectIndex = this.projects.findIndex((project) => project.id === id)
            if (projectIndex !== -1) {
              this.projects.splice(projectIndex, 1, updatedProject)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update project.'
      )
    },
    async deleteProject(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const deleteSuccess = await deleteProject(id)
          if (deleteSuccess) {
            const projectIndex = this.projects.findIndex((project) => project.id === id)
            if (projectIndex !== -1) {
              this.projects.splice(projectIndex, 1)
              statusStore.setStatus(StatusType.SUCCESS, 'Project deleted successfully.')
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete project.'
      )
    },
    selectProject(projectId: number): void {
      const project = this.projects.find((project) => project.id === projectId)
      if (project) {
        this.selectedProject = project
      } else {
        throw new Error('Cannot select project that does not exist')
      }
    },
    deselectProject(): void {
      this.selectedProject = null
    }
  }
})
