// /stores/forumModerationStore.ts
//
// rainbow-butterflies/t-031: owns the fetch/restore/remove calls behind the
// admin forum-moderation review queue (pages/admin/forum-moderation.vue).
// Components never call APIs directly, per AGENTS.md -- same shape as
// socialDraftsStore.ts. There is exactly one queue: posts the health-claim
// flag-escalation threshold auto-hid, pending a human decision.
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { performFetch, handleError } from './utils'

export type HiddenForumPost = {
  id: number
  content: string
  sender: string
  botName: string | null
  channel: string | null
  userId: number | null
  botId: number | null
  createdAt: string
  updatedAt: string | null
}

export const useForumModerationStore = defineStore(
  'forumModerationStore',
  () => {
    const posts = ref<HiddenForumPost[]>([])
    const loading = ref(false)
    const error = ref('')

    async function fetchHiddenPosts() {
      loading.value = true
      error.value = ''
      try {
        const res = await performFetch<{ posts: HiddenForumPost[] }>(
          '/api/admin/forum/hidden-posts',
        )
        if (res.success && res.data) {
          posts.value = res.data.posts
        } else {
          error.value = res.message || 'Failed to load hidden forum posts.'
        }
      } catch (err) {
        handleError(err, 'forumModerationStore.fetchHiddenPosts')
        error.value = 'Failed to load hidden forum posts.'
      } finally {
        loading.value = false
      }
    }

    async function restore(id: number) {
      error.value = ''
      try {
        const res = await performFetch(
          `/api/admin/forum/hidden-posts/${id}/restore`,
          {
            method: 'POST',
          },
        )
        if (res.success) {
          posts.value = posts.value.filter((post) => post.id !== id)
        } else {
          error.value = res.message || 'Failed to restore forum post.'
        }
        return res
      } catch (err) {
        handleError(err, 'forumModerationStore.restore')
        error.value = 'Failed to restore forum post.'
        return null
      }
    }

    async function remove(id: number) {
      error.value = ''
      try {
        const res = await performFetch(
          `/api/admin/forum/hidden-posts/${id}/remove`,
          {
            method: 'POST',
          },
        )
        if (res.success) {
          posts.value = posts.value.filter((post) => post.id !== id)
        } else {
          error.value = res.message || 'Failed to remove forum post.'
        }
        return res
      } catch (err) {
        handleError(err, 'forumModerationStore.remove')
        error.value = 'Failed to remove forum post.'
        return null
      }
    }

    return {
      posts,
      loading,
      error,
      fetchHiddenPosts,
      restore,
      remove,
    }
  },
)
