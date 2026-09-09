<template>
  <section class="flex flex-col gap-4">
    <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="kr-text-eyebrow text-xs tracking-widest text-primary">
          Forum moderation
        </p>
        <p class="kr-text-black-2xl mt-1">Health-claim escalation queue</p>
        <p class="kr-text-dim-sm mt-1 max-w-2xl">
          Posts here were auto-hidden because at least two distinct people flagged them as
          misinformation or unsafe. Restore the post if the flag was wrong, or confirm removal
          if it should stay down.
        </p>
      </div>
      <button
        type="button"
        class="kr-btn-ghost"
        :disabled="loading"
        @click="moderationStore.fetchHiddenPosts()"
      >
        <span v-if="loading" class="kr-spinner-xs" />
        Refresh
      </button>
    </header>

    <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
      <span class="kr-spinner-lg-primary" />
    </div>

    <div
      v-else-if="!userStore.isAdmin"
      class="kr-note kr-note-error p-8 text-center font-normal"
    >
      <p class="kr-text-black-xl text-base-content">Administrator access required</p>
      <p class="kr-text-dim-sm mt-2">
        The forum moderation queue is restricted to administrators.
      </p>
    </div>

    <template v-else>
      <p
        v-if="moderationStore.error"
        class="kr-note kr-note-error rounded-xl p-3 font-normal"
      >
        {{ moderationStore.error }}
      </p>

      <div class="forum-moderation-grid grid gap-4">
        <article
          v-for="post in moderationStore.posts"
          :key="post.id"
          class="kr-panel flex flex-col gap-3 p-4"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2">
              <span class="kr-badge-warning-sm">pending review</span>
              <span v-if="post.channel" class="kr-badge-outline">
                {{ post.channel }}
              </span>
            </div>
            <span class="kr-text-dim-xs-40">#{{ post.id }}</span>
          </div>

          <p class="whitespace-pre-line text-sm">{{ post.content }}</p>

          <p class="kr-text-dim-xs">
            By {{ post.botName || post.sender }} · posted {{ formatDate(post.createdAt) }}
            <template v-if="post.updatedAt">
              · hidden {{ formatDate(post.updatedAt) }}
            </template>
          </p>

          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-success btn-sm flex-1 rounded-xl"
              @click="moderationStore.restore(post.id)"
            >
              Restore
            </button>
            <button
              type="button"
              class="btn btn-error btn-outline btn-sm flex-1 rounded-xl"
              @click="moderationStore.remove(post.id)"
            >
              Confirm removal
            </button>
          </div>
        </article>

        <p
          v-if="!moderationStore.posts.length"
          class="kr-text-dim-sm-50 col-span-full rounded-xl border border-dashed border-base-300 p-6 text-center"
        >
          Nothing pending review right now.
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useForumModerationStore } from '@/stores/forumModerationStore'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const moderationStore = useForumModerationStore()
const ready = ref(false)
const loading = computed(() => moderationStore.loading)

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) await moderationStore.fetchHiddenPosts()
  ready.value = true
})

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}
</script>

<style scoped>
.forum-moderation-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
}
</style>
