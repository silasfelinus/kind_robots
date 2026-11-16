import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch } from '@/stores/utils'
import { useUserStore } from '@/stores/userStore'

type PublicNote = {
  path: string
  text: string
  hasRecord: boolean
  publishedAt: string | null
}

export type EditorNote = {
  path: string
  draftText: string | null
  publishedText: string | null
  publishedAt: string | null
  updatedAt: string | null
}

type NoteAction = 'draft' | 'publish' | 'unpublish'

export const useTutorialNotesStore = defineStore('tutorialNotesStore', () => {
  const userStore = useUserStore()
  const publicNotes = ref<Record<string, string>>({})
  const loadedPaths = ref<Record<string, boolean>>({})
  const overrides = ref<Record<string, boolean>>({})
  const editorNotes = ref<Record<string, EditorNote>>({})
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')
  const notice = ref('')

  async function loadPublic(path: string): Promise<void> {
    if (loadedPaths.value[path]) return
    try {
      const response = await performFetch<PublicNote>(
        '/api/tutorial-notes?path=' + encodeURIComponent(path),
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load developer note.')
      }
      publicNotes.value[path] = response.data.text
      overrides.value[path] = response.data.hasRecord
      loadedPaths.value[path] = true
    } catch {
      publicNotes.value[path] = ''
    }
  }

  async function loadEditor(path: string): Promise<EditorNote | null> {
    if (!userStore.isAdmin) return null
    loading.value = true
    error.value = ''
    try {
      const response = await performFetch<EditorNote>(
        '/api/admin/tutorial-notes?path=' + encodeURIComponent(path),
        { cache: 'no-store' },
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not load developer draft.')
      }
      editorNotes.value[path] = response.data
      return response.data
    } catch (cause) {
      error.value =
        cause instanceof Error
          ? cause.message
          : 'Could not load developer draft.'
      return null
    } finally {
      loading.value = false
    }
  }

  async function save(
    path: string,
    text: string,
    action: NoteAction,
  ): Promise<boolean> {
    if (!userStore.isAdmin) return false
    saving.value = true
    error.value = ''
    notice.value = ''
    try {
      const response = await performFetch<EditorNote>(
        '/api/admin/tutorial-notes?path=' + encodeURIComponent(path),
        {
          method: 'PUT',
          body: JSON.stringify({ action, text }),
        },
      )
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Could not save developer note.')
      }
      editorNotes.value[path] = response.data
      publicNotes.value[path] = response.data.publishedText ?? ''
      overrides.value[path] = true
      loadedPaths.value[path] = true
      notice.value = response.message || 'Developer note saved.'
      return true
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Save failed.'
      return false
    } finally {
      saving.value = false
    }
  }

  return {
    publicNotes,
    loadedPaths,
    overrides,
    editorNotes,
    loading,
    saving,
    error,
    notice,
    loadPublic,
    loadEditor,
    save,
  }
})
