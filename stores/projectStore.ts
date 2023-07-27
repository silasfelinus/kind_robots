// ~/stores/projectStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Project as ProjectRecord } from '@prisma/client'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'
import { projectData } from './seeds/seedProjects'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Project = ProjectRecord

interface ProjectStoreState {
  projects: Project[]
  currentProject: Project | null
  totalProjects: number
  errors: string[]
  page: number
  pageSize: number
}

export const useProjectStore = defineStore({
  id: 'projects',
  state: (): ProjectStoreState => ({
    projects: [],
    currentProject: null,
    totalProjects: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading project store...')
      try {
        await this.countProjects()
        if (this.totalProjects === 0) {
          await this.seedProjects()
        }

        await this.getProjects(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.projects.length} projects`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing project store: ' + error)
      }
    },
    async getProjects(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching projects...')
      try {
        const { data } = await axios.get(`/api/projects?page=${page}&pageSize=${pageSize}`)
        this.projects = [...this.projects, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.projects.length} projects`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch projects: ' + error)
      }
    },
    async getProjectById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching project with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/projects/${id}`)
        this.currentProject = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched project with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch project by id: ' + error)
      }
    },
    async addProjects(projectData: Partial<Project>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new projects...')
      try {
        const { data } = await axios.post(`/api/projects`, projectData)
        this.projects = [...this.projects, ...data.projects]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.projects.length} projects`)
        await this.countProjects()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add projects: ' + error)
      }
    },
    async updateProject(id: number, data: Partial<Project>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating project with id ${id}...`)
      try {
        const { data: updatedProject } = await axios.put(`/api/projects/${id}`, data)
        this.currentProject = updatedProject
        statusStore.setStatus(StatusType.SUCCESS, `Updated project with id ${id}`)
        await this.getProjects()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update project: ' + error)
      }
    },
    async deleteProject(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting project with id ${id}...`)
      try {
        await axios.delete(`/api/projects/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted project with id ${id}`)
        await this.getProjects()
        await this.countProjects()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete project: ' + error)
      }
    },
    async randomProject(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random project...')
      try {
        const { data } = await axios.get(`/api/projects/random`)
        this.currentProject = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random project')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random project: ' + error)
      }
    },
    async countProjects(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting projects...')
      try {
        const { data } = await axios.get(`/api/projects/count`)
        this.totalProjects = data
        statusStore.setStatus(
          StatusType.SUCCESS,
          `Counted a total of ${this.totalProjects} projects`
        )
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count projects: ' + error)
      }
    },
    async seedProjects(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding projects...')
      try {
        await this.addProjects(projectData)
        statusStore.setStatus(StatusType.SUCCESS, 'Projects successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading projects: ' + error)
      }

      await this.getProjects()
      await this.countProjects()
    }
  }
})
