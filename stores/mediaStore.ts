// ~/stores/mediaStore.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { Media as MediaRecord } from '@prisma/client'
import { useErrorStore, ErrorType } from '../stores/errorStore'
import { useStatusStore, StatusType } from '../stores/statusStore'
import { mediaData } from './seeds/seedMedia'

const errorStore = useErrorStore()
const statusStore = useStatusStore()

export type Media = MediaRecord

interface MediaStoreState {
  media: Media[]
  currentMedia: Media | null
  totalMedia: number
  errors: string[]
  page: number
  pageSize: number
}

export const useMediaStore = defineStore({
  id: 'media',
  state: (): MediaStoreState => ({
    media: [],
    currentMedia: null,
    totalMedia: 0,
    errors: [],
    page: 1,
    pageSize: 10
  }),
  actions: {
    async loadStore(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Loading media store...')
      try {
        await this.countMedia()
        if (this.totalMedia === 0) {
          await this.seedMedia()
        }

        await this.getMedia(this.page, this.pageSize)

        statusStore.setStatus(StatusType.SUCCESS, `Loaded ${this.media.length} media`)
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error initializing media store: ' + error)
      }
    },
    async getMedia(page = 1, pageSize = 10): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching media...')
      try {
        const { data } = await axios.get(`/api/media?page=${page}&pageSize=${pageSize}`)
        this.media = [...this.media, ...data]
        this.page++
        statusStore.setStatus(StatusType.SUCCESS, `Fetched ${this.media.length} media`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch media: ' + error)
      }
    },
    async getMediaById(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Fetching media with id ${id}...`)
      try {
        const { data } = await axios.get(`/api/media/${id}`)
        this.currentMedia = data
        statusStore.setStatus(StatusType.SUCCESS, `Fetched media with id ${id}`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch media by id: ' + error)
      }
    },
    async addMedia(mediaData: Partial<Media>[]): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Adding new media...')
      try {
        const { data } = await axios.post(`/api/media`, mediaData)
        this.media = [...this.media, ...data.media]
        this.errors = data.errors
        statusStore.setStatus(StatusType.SUCCESS, `Added ${this.media.length} media`)
        await this.countMedia()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to add media: ' + error)
      }
    },
    async updateMedia(id: number, data: Partial<Media>): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Updating media with id ${id}...`)
      try {
        const { data: updatedMedia } = await axios.put(`/api/media/${id}`, data)
        this.currentMedia = updatedMedia
        statusStore.setStatus(StatusType.SUCCESS, `Updated media with id ${id}`)
        await this.getMedia()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to update media: ' + error)
      }
    },
    async deleteMedia(id: number): Promise<void> {
      statusStore.setStatus(StatusType.INFO, `Deleting media with id ${id}...`)
      try {
        await axios.delete(`/api/media/${id}`)
        statusStore.setStatus(StatusType.SUCCESS, `Deleted media with id ${id}`)
        await this.getMedia()
        await this.countMedia()
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to delete media: ' + error)
      }
    },
    async randomMedia(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Fetching a random media...')
      try {
        const { data } = await axios.get(`/api/media/random`)
        this.currentMedia = data
        statusStore.setStatus(StatusType.SUCCESS, 'Fetched a random media')
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to fetch a random media: ' + error)
      }
    },
    async countMedia(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Counting media...')
      try {
        const { data } = await axios.get(`/api/media/count`)
        this.totalMedia = data
        statusStore.setStatus(StatusType.SUCCESS, `Counted a total of ${this.totalMedia} media`)
      } catch (error) {
        errorStore.setError(ErrorType.NETWORK_ERROR, 'Failed to count media: ' + error)
      }
    },
    async seedMedia(): Promise<void> {
      statusStore.setStatus(StatusType.INFO, 'Seeding media...')
      try {
        await this.addMedia(mediaData)
        statusStore.setStatus(StatusType.SUCCESS, 'Media successfully seeded.')
      } catch (error) {
        errorStore.setError(ErrorType.UNKNOWN_ERROR, 'Error loading media: ' + error)
      }

      await this.getMedia()
      await this.countMedia()
    }
  }
})
