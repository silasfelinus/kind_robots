// ~/store/media.ts
import { defineStore } from 'pinia'
import { Media as MediaRecord } from '@prisma/client'
import axios from 'axios'

export type Media = MediaRecord

interface MediaState {
  media: Media[]
  currentMedia: Media | null
  totalMedia: number
  errors: string[]
}

export const useMediaStore = defineStore({
  id: 'media',
  state: (): MediaState => ({
    media: [],
    currentMedia: null,
    totalMedia: 0,
    errors: []
  }),
  actions: {
    async getMedia(page = 1, pageSize = 10) {
      const { data } = await axios.get(`/api/media?page=${page}&pageSize=${pageSize}`)
      this.media = data
    },
    async getMediaById(id: number) {
      const { data } = await axios.get(`/api/media/${id}`)
      this.currentMedia = data
    },
    async addMedia(mediaData: Partial<Media>[]) {
      const { data } = await axios.post(`/api/media`, mediaData)
      this.media = data.media
      this.errors = data.errors

      // Update the total media count after adding new media
      await this.countMedia()
    },
    async updateMedia(id: number, data: Partial<Media>) {
      const { data: updatedMedia } = await axios.put(`/api/media/${id}`, data)
      this.currentMedia = updatedMedia

      // Fetch the updated list of media after updating a media
      await this.getMedia()
    },
    async deleteMedia(id: number) {
      await axios.delete(`/api/media/${id}`)

      // Fetch the updated list of media and total media count after deleting a media
      await this.getMedia()
      await this.countMedia()
    },
    async randomMedia() {
      const { data } = await axios.get(`/api/media/random`)
      this.currentMedia = data
    },
    async countMedia() {
      const { data } = await axios.get(`/api/media/count`)
      this.totalMedia = data
    }
  }
})
