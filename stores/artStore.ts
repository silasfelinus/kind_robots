// /stores/artStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'

interface Art {
  id: number
  galleryId: number
  path: string
  clapCount: number
  booCount: number
  prompt: string
  user: string
}

export const useArtStore = defineStore({
  id: 'artStore',
  state: () => ({
    artAssets: [] as Art[]
  }),
  actions: {
    async generateArt(prompt: string, user: string, designer: string) {
      const response = await axios.post('http://kindrobots.org/api/art/generate', {
        prompt,
        user,
        designer
      })
      if (response.data.success) {
        this.artAssets.push(response.data.newArt)
      }
    },
    async getArtByPromptId(promptId: number) {
      // Fetch art assets based on artPrompt id
    },
    async handleReactions(artId: number, reaction: any) {
      // Handle claps, boos, tags, etc.
    }
  }
})
