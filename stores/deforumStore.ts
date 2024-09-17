import { defineStore } from 'pinia'
import { useErrorStore, ErrorType } from './../stores/errorStore'

export interface GenerateDeforumData {
  promptString: string
  frames?: number
  checkpoint?: string
  translation2D?: string
  translation3D?: string
  seed?: number
  designer?: string
  userId?: number
}

export const useDeforumStore = defineStore({
  id: 'deforumStore',
  state: () => ({
    deforumVideos: [] as string[], // Stores generated video URLs
    selectedVideo: null as string | null, // Stores the currently selected video URL
    prompts: [] as string[], // Stores prompts
  }),
  actions: {
    init() {
      if (this.deforumVideos.length === 0) {
        this.fetchAllVideos()
      }
    },
    selectVideo(videoUrl: string) {
      this.selectedVideo = videoUrl
    },
    async fetchAllVideos() {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/deforum/videos')
          if (response.ok) {
            const data = await response.json()
            this.deforumVideos = data.videos
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch Deforum videos.',
      )
    },
    async generateVideo(
      data: GenerateDeforumData,
    ): Promise<{ success: boolean; message?: string; videoUrl?: string }> {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch('/api/art/deforum/post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
          if (response.ok) {
            const result = await response.json()
            if (result.videoUrl) {
              this.deforumVideos.push(result.videoUrl) // Save the new video URL
              this.prompts.push(data.promptString) // Save the prompt used
              return { success: true, videoUrl: result.videoUrl }
            }
            return { success: false, message: 'No video generated.' }
          } else {
            const errorResponse = await response.json()
            return { success: false, message: errorResponse.message }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to generate Deforum video.',
      )
    },
    getVideoByPrompt(prompt: string): string | null {
      const index = this.prompts.indexOf(prompt)
      if (index !== -1) {
        return this.deforumVideos[index]
      }
      return null
    },
    async deleteVideo(videoUrl: string) {
      const errorStore = useErrorStore()
      return errorStore.handleError(
        async () => {
          const response = await fetch(
            `/api/deforum/videos?videoUrl=${encodeURIComponent(videoUrl)}`,
            {
              method: 'DELETE',
            },
          )
          if (response.ok) {
            this.deforumVideos = this.deforumVideos.filter(
              (v) => v !== videoUrl,
            )
            if (this.selectedVideo === videoUrl) {
              this.selectedVideo = null
            }
          } else {
            const errorResponse = await response.json()
            throw new Error(errorResponse.message)
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete Deforum video.',
      )
    },
  },
})
