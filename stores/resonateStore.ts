import { defineStore } from 'pinia'
import { performFetch, handleError } from '@/stores/utils'

interface VisualizerState {
  inputSource: 'microphone' | 'file' | 'timer' | 'manual'
  currentImage: string
  currentChapter: Chapter
  story: Story
  availableCommands: VisualizerCommand[]
  activeInputs: string[] // ['volume-high', 'bass-peak', 'time-5s']
}

interface Story {
  title: string
  chapters: Chapter[]
}

interface Chapter {
  id: string
  title: string
  text: string[]
  images: string[]
}

interface VisualizerCommand {
  id: string
  label: string
  actionText: string
  icon?: string
  cooldown?: number // prevent button spam
}

export const useResonateStore = defineStore('resonateStore', {
  state: () => ({
    inputSource: 'microphone' as 'microphone' | 'file' | 'timer' | 'manual',
    currentImage: '',
    currentChapter: {
      id: '',
      title: '',
      text: [],
      images: [],
    } as Chapter,
    story: {
      title: 'New Resonance',
      chapters: [],
    } as Story,
    availableCommands: [] as VisualizerCommand[],
    activeInputs: [] as string[],
    isSaving: false,
    isInitialized: false,
    loading: false,
  }),

  getters: {
    totalChapters: (state) => state.story.chapters.length,
    hasActiveInputs: (state) => state.activeInputs.length > 0,
    hasUnsavedChanges: (state) => {
      const savedStory = localStorage.getItem('resonate-story')
      return savedStory !== JSON.stringify(state.story)
    },
  },

  actions: {
    async initialize() {
      if (this.isInitialized) return

      try {
        const savedStory = localStorage.getItem('resonate-story')
        const savedChapter = localStorage.getItem('resonate-chapter')
        const savedCommands = localStorage.getItem('resonate-commands')

        if (savedStory) {
          this.story = JSON.parse(savedStory) as Story
        }

        if (savedChapter) {
          this.currentChapter = JSON.parse(savedChapter) as Chapter
        }

        if (savedCommands) {
          this.availableCommands = JSON.parse(
            savedCommands,
          ) as VisualizerCommand[]
        } else {
          this.loadDefaultCommands()
        }

        this.isInitialized = true
      } catch (error) {
        handleError(error, 'initializing resonate store')
      }
    },
    async saveResonateArt() {
      const artStore = useArtStore()
      const userStore = useUserStore()

      if (!this.currentImage) {
        console.warn('[resonateStore] No current image to save.')
        return
      }

      this.isSaving = true
      try {
        const artPayload = {
          promptString: 'Generated from Resonate Lab',
          path: this.currentImage,
          seed: null,
          steps: null,
          galleryId: 21,
          promptId: null,
          pitchId: null,
          userId: userStore.userId || 10,
          designer: userStore.username || 'Kind Designer',
          artImageId: null, // Optional, handle later if needed
        }

        const savedArt = await artStore.createArt(artPayload)

        console.log('[resonateStore] Saved resonance to art:', savedArt)
      } catch (error) {
        handleError(error, 'saving resonate art')
      } finally {
        this.isSaving = false
      }
    },

    loadDefaultCommands() {
      this.availableCommands = [
        {
          id: 'change-image',
          label: 'Change Image',
          actionText: 'changeImage',
          icon: 'kind-icon:spark',
          cooldown: 2000,
        },
        {
          id: 'add-chapter',
          label: 'Add Chapter',
          actionText: 'addChapter',
          icon: 'kind-icon:book-plus',
          cooldown: 3000,
        },
        {
          id: 'add-text',
          label: 'Add Text',
          actionText: 'addText',
          icon: 'kind-icon:text',
          cooldown: 1000,
        },
        {
          id: 'save-story',
          label: 'Save Story',
          actionText: 'saveStory',
          icon: 'kind-icon:save',
          cooldown: 5000,
        },
      ]
    },

    syncToLocalStorage() {
      try {
        localStorage.setItem('resonate-story', JSON.stringify(this.story))
        localStorage.setItem(
          'resonate-chapter',
          JSON.stringify(this.currentChapter),
        )
        localStorage.setItem(
          'resonate-commands',
          JSON.stringify(this.availableCommands),
        )
      } catch (error) {
        console.error('Error syncing to localStorage:', error)
      }
    },

    resetResonance() {
      this.story = { title: 'New Resonance', chapters: [] }
      this.currentChapter = { id: '', title: '', text: [], images: [] }
      this.currentImage = ''
      this.activeInputs = []
      this.syncToLocalStorage()
    },

    selectInputSource(source: 'microphone' | 'file' | 'timer' | 'manual') {
      this.inputSource = source
    },

    triggerInputEvent(eventType: string) {
      if (!this.activeInputs.includes(eventType)) {
        this.activeInputs.push(eventType)
      }
    },

    clearInputEvent(eventType: string) {
      this.activeInputs = this.activeInputs.filter(
        (input) => input !== eventType,
      )
    },

    addChapter(title = 'New Chapter') {
      const newChapter: Chapter = {
        id: Date.now().toString(),
        title,
        text: [],
        images: [],
      }
      this.story.chapters.push(newChapter)
      this.currentChapter = newChapter
      this.syncToLocalStorage()
    },

    addTextToChapter(text: string) {
      if (!this.currentChapter.id) return
      this.currentChapter.text.push(text)
      this.updateChapter(this.currentChapter)
      this.syncToLocalStorage()
    },

    addImageToChapter(imageUrl: string) {
      if (!this.currentChapter.id) return
      this.currentChapter.images.push(imageUrl)
      this.updateChapter(this.currentChapter)
      this.syncToLocalStorage()
    },

    updateChapter(updated: Chapter) {
      const index = this.story.chapters.findIndex((ch) => ch.id === updated.id)
      if (index !== -1) {
        this.story.chapters[index] = { ...updated }
      }
    },

    async saveStory() {
      this.isSaving = true
      try {
        this.syncToLocalStorage()
        // Optional future external save goes here
      } catch (error) {
        handleError(error, 'saving resonate story')
      } finally {
        this.isSaving = false
      }
    },

    async loadStoryFromStorage() {
      try {
        const saved = localStorage.getItem('resonate-story')
        if (saved) {
          this.story = JSON.parse(saved) as Story
          this.currentChapter = this.story.chapters[
            this.story.chapters.length - 1
          ] || {
            id: '',
            title: '',
            text: [],
            images: [],
          }
        }
      } catch (error) {
        handleError(error, 'loading story from local storage')
      }
    },
  },
})

export type { VisualizerState, Story, Chapter, VisualizerCommand }
