// ~/store/projects.ts
import { defineStore } from 'pinia'
import { Project as ProjectRecord } from '@prisma/client'
import axios from 'axios'

export type Project = ProjectRecord

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  totalProjects: number
  errors: string[]
}

export const useProjectStore = defineStore({
  id: 'projects',
  state: (): ProjectState => ({
    projects: [],
    currentProject: null,
    totalProjects: 0,
    errors: []
  }),
  actions: {
    async getProjects(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/projects?page=${page}&pageSize=${pageSize}`)
      this.projects = data
    },
    async getProjectById(id: number) {
      const { data } = await axios.get(`/api/projects/${id}`)
      this.currentProject = data
    },
    async addProjects(projectData: Partial<Project>[]) {
      const { data } = await axios.post(`/api/projects`, projectData)
      this.projects = data.projects
      this.errors = data.errors

      // Update the total projects count after adding new projects
      await this.countProjects()
    },
    async updateProject(id: number, data: Partial<Project>) {
      const { data: updatedProject } = await axios.put(`/api/projects/${id}`, data)
      this.currentProject = updatedProject

      // Fetch the updated list of projects after updating a project
      await this.getProjects()
    },
    async deleteProject(id: number) {
      await axios.delete(`/api/projects/${id}`)

      // Fetch the updated list of projects and total projects count after deleting a project
      await this.getProjects()
      await this.countProjects()
    },
    async randomProject() {
      const { data } = await axios.get(`/api/projects/random`)
      this.currentProject = data
    },
    async countProjects() {
      const { data } = await axios.get(`/api/projects/count`)
      this.totalProjects = data
    }
  }
})
