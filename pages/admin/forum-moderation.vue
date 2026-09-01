<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header
        class="kr-toolbar flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            Forum moderation
          </p>
          <p class="mt-1 text-2xl font-black">Health-claim escalation queue</p>
          <p class="mt-1 max-w-2xl text-sm text-base-content/60">
            Posts here were auto-hidden because at least two distinct people
            flagged them as misinformation or unsafe. Restore the post if the
            flag was wrong, or confirm removal if it should stay down.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          :disabled="loading"
          @click="moderationStore.fetchHiddenPosts()"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Refresh
        </button>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="text-xl font-black text-base-content">
          Administrator access required
        </p>
        <p class="mt-2 text-sm text-base-content/60">
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

        <section class="grid gap-4 md:grid-cols-2">
          <article
            v-for="post in moderationStore.posts"
            :key="post.id"
            class="kr-panel flex flex-col gap-3 p-4"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-warning badge-sm">
                  pending review
                </span>
                <span v-if="post.channel" class="badge badge-outline">
                  {{ post.channel }}
                </span>
              </div>
              <span class="text-xs text-base-content/40">#{{ post.id }}</span>
            </div>

            <p class="whitespace-pre-line text-sm">{{ post.content }}</p>

            <p class="text-xs text-base-content/50">
              By {{ post.botName || post.sender }} &middot; posted
              {{ formatDate(post.createdAt) }}
              <template v-if="post.updatedAt">
                &middot; hidden {{ formatDate(post.updatedAt) }}
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
            class="col-span-full rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/50"
          >
            Nothing pending review right now.
          </p>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useForumModerationStore } from '@/stores/forumModerationStore'

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
