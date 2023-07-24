// ~/stores/mediaStore.ts
import { defineStore } from 'pinia'
import {
  fetchMedia,
  fetchMediaById,
  Media as MediaRecord,
  addMedia,
  updateMedia,
  deleteMedia,
  randomMedia
} from '../server/api/media'
import { useErrorStore, ErrorType } from './errorStore'
import { useStatusStore, StatusType } from './statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Media = MediaRecord

interface MediaState {
  media: Media[]
  selectedMedia: Media[]
  activeMedia: Media | null
}

export const useMediaStore = defineStore({
  id: 'media',
  state: (): MediaState => ({
    media: [],
    selectedMedia: [],
    activeMedia: null
  }),
  getters: {
    getSelectedMedia(): Media[] {
      return this.selectedMedia
    },
    getActiveMedia(): Media | null {
      return this.activeMedia || this.selectedMedia.slice(-1)[0] || null
    }
  },
  actions: {
    async fetchMedia(page = 1, pageSize = 10): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.media = await fetchMedia(page, pageSize)
          statusStore.setStatus(StatusType.SUCCESS, 'Media fetched successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch media.'
      )
    },
    async fetchMediaById(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          const media = await fetchMediaById(id)
          if (media) {
            const mediaIndex = this.media.findIndex((existingMedia) => existingMedia.id === id)
            if (mediaIndex !== -1) {
              this.media.splice(mediaIndex, 1, media)
            } else {
              this.media.push(media)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to fetch media by id.'
      )
    },
    async addMedia(mediaData: Partial<Media>[]): Promise<void> {
      await errorStore.handleError(
        async () => {
          const { media: newMedia } = await addMedia(mediaData)
          this.media.push(...newMedia)
          statusStore.setStatus(
            StatusType.SUCCESS,
            `${newMedia.length} media item(s) added successfully.`
          )
        },
        ErrorType.NETWORK_ERROR,
        'Failed to add media.'
      )
    },
    async updateMedia(id: number, data: Partial<Media>): Promise<void> {
      await errorStore.handleError(
        async () => {
          const updatedMedia = await updateMedia(id, data)
          if (updatedMedia) {
            const mediaIndex = this.media.findIndex((media) => media.id === id)
            if (mediaIndex !== -1) {
              this.media.splice(mediaIndex, 1, updatedMedia)
            }
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to update media.'
      )
    },
    async deleteMedia(id: number): Promise<void> {
      await errorStore.handleError(
        async () => {
          await deleteMedia(id)
          const mediaIndex = this.media.findIndex((media) => media.id === id)
          if (mediaIndex !== -1) {
            this.media.splice(mediaIndex, 1)
            statusStore.setStatus(StatusType.SUCCESS, 'Media deleted successfully.')
          }
        },
        ErrorType.NETWORK_ERROR,
        'Failed to delete media.'
      )
    },
    selectMedia(mediaId: number): void {
      const media = this.media.find((media) => media.id === mediaId)
      if (media) {
        this.selectedMedia.push(media)
        this.activeMedia = media
      } else {
        throw new Error('Cannot select media that does not exist')
      }
    },
    setActiveMedia(mediaId: number): void {
      const media = this.media.find((media) => media.id === mediaId)
      if (media) {
        this.activeMedia = media
      } else {
        throw new Error('Cannot set active media that does not exist')
      }
    },
    deselectMedia(mediaId: number): void {
      const mediaIndex = this.selectedMedia.findIndex((media) => media.id === mediaId)
      if (mediaIndex !== -1) {
        this.selectedMedia.splice(mediaIndex, 1)
        this.activeMedia = this.selectedMedia.slice(-1)[0] || null
      } else {
        throw new Error('Cannot deselect media that is not selected')
      }
    },
    async randomMedia(): Promise<void> {
      await errorStore.handleError(
        async () => {
          this.activeMedia = await randomMedia()
          statusStore.setStatus(StatusType.SUCCESS, 'Random media selected successfully.')
        },
        ErrorType.NETWORK_ERROR,
        'Failed to select random media.'
      )
    }
  }
})
