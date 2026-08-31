import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { performFetch } from '@/stores/utils'

type ForumAttachment = {
  kind: 'ART_IMAGE' | 'PROJECT' | 'CHARACTER'
  id: number
  title: string
  canonicalUrl: string
}

type ForumPost = {
  id: number
  threadId: number
  title: string | null
  content: string
  isMature: boolean
  attachments: ForumAttachment[]
  author: {
    kind: 'HUMAN' | 'AI_AGENT'
    displayName: string
  }
}

type QueueMode = 'attach' | 'contribute'

type QueueResponse = {
  jobId: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  postId: number
  threadId: number
  mode: QueueMode
  mana: {
    balance: number
    charged: number
  }
}

type ArtJob = {
  id: number
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED'
  artImageId?: number | null
  error?: string | null
}

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 200
const MAX_PROMPT_LENGTH = 4000

function defaultPrompt(post: ForumPost): string {
  const source = [post.title?.trim(), post.content.trim()]
    .filter(Boolean)
    .join('\n\n')
  const prefix =
    'Create a new illustration that builds constructively on this public forum contribution. Preserve the useful idea, but make a distinct reusable work:\n\n'
  return `${prefix}${source}`.slice(0, MAX_PROMPT_LENGTH)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const useForumGenerationStore = defineStore(
  'forumGenerationStore',
  () => {
    const sourcePost = ref<ForumPost | null>(null)
    const promptDraft = ref('')
    const loadingPost = ref(false)
    const queueing = ref(false)
    const job = ref<ArtJob | null>(null)
    const queueMode = ref<QueueMode | null>(null)
    const completedArtId = ref<number | null>(null)
    const message = ref('')
    const error = ref('')

    const attachedArt = computed(
      () =>
        sourcePost.value?.attachments.find(
          (entry) => entry.kind === 'ART_IMAGE',
        ) ?? null,
    )

    const completedArtUrl = computed(() =>
      completedArtId.value
        ? `https://kindrobots.org/art?art=${completedArtId.value}`
        : null,
    )

    async function loadPost(postId: number): Promise<boolean> {
      loadingPost.value = true
      error.value = ''

      try {
        const response = await performFetch<ForumPost>(
          `/api/v1/forum/posts/${postId}?includeMature=true`,
          { method: 'GET' },
        )

        if (!response.success || !response.data) {
          error.value = response.message || 'Forum post could not be loaded.'
          sourcePost.value = null
          return false
        }

        sourcePost.value = response.data
        promptDraft.value = defaultPrompt(response.data)
        return true
      } finally {
        loadingPost.value = false
      }
    }

    async function refreshPost(): Promise<void> {
      if (!sourcePost.value) return
      await loadPost(sourcePost.value.id)
    }

    async function pollJob(jobId: number): Promise<void> {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        const response = await performFetch<{ job: ArtJob }>(
          `/api/art/queue/${jobId}`,
          { method: 'GET' },
        )

        const next = response.data?.job
        if (!response.success || !next) {
          error.value = response.message || 'Could not read the queued ArtJob.'
          return
        }

        job.value = next
        if (next.status === 'DONE') {
          completedArtId.value = next.artImageId ?? null
          if (queueMode.value === 'contribute') {
            message.value = next.artImageId
              ? `ArtImage #${next.artImageId} finished as a new contribution in the source Commons thread. The original object remains intact.`
              : 'The contribution job finished.'
          } else {
            message.value = next.artImageId
              ? `ArtImage #${next.artImageId} finished and was attached to the forum post.`
              : 'The art job finished.'
            await refreshPost()
          }
          return
        }

        if (next.status === 'FAILED' || next.status === 'CANCELLED') {
          error.value = next.error || `Art job ${next.status.toLowerCase()}.`
          return
        }

        await sleep(POLL_INTERVAL_MS)
      }

      message.value =
        'The art job is still queued. It will keep running on the Kind Robots ArtJob relay even if you leave this page.'
    }

    async function queueArt(): Promise<boolean> {
      const post = sourcePost.value
      const prompt = promptDraft.value.trim()
      if (!post || queueing.value) return false
      if (prompt.length < 3) {
        error.value = 'Write a slightly longer illustration prompt first.'
        return false
      }
      if (prompt.length > MAX_PROMPT_LENGTH) {
        error.value = `Prompt is too long. Maximum is ${MAX_PROMPT_LENGTH} characters.`
        return false
      }

      queueing.value = true
      error.value = ''
      message.value = ''
      job.value = null
      queueMode.value = null
      completedArtId.value = null

      try {
        const response = await performFetch<QueueResponse>(
          `/api/v1/forum/posts/${post.id}/generate-art`,
          {
            method: 'POST',
            body: JSON.stringify({ prompt }),
          },
        )

        if (!response.success || !response.data) {
          error.value = response.message || 'Could not queue forum art.'
          return false
        }

        queueMode.value = response.data.mode
        job.value = {
          id: response.data.jobId,
          status: response.data.status,
        }
        const destination =
          response.data.mode === 'contribute'
            ? 'as a new Commons contribution'
            : 'onto the source post'
        message.value = `Queued ArtJob #${response.data.jobId} ${destination}. Charged ${response.data.mana.charged} generation units; this compute spend is not a charitable donation.`
        void pollJob(response.data.jobId)
        return true
      } finally {
        queueing.value = false
      }
    }

    function reset(): void {
      sourcePost.value = null
      promptDraft.value = ''
      job.value = null
      queueMode.value = null
      completedArtId.value = null
      message.value = ''
      error.value = ''
    }

    return {
      sourcePost,
      promptDraft,
      loadingPost,
      queueing,
      job,
      queueMode,
      completedArtId,
      completedArtUrl,
      message,
      error,
      attachedArt,
      loadPost,
      refreshPost,
      queueArt,
      reset,
    }
  },
)
