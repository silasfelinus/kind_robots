<!-- /components/music-video/music-video-actions.vue -->
<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <button
      v-if="userStore.isLoggedIn"
      type="button"
      class="kr-btn-xs btn-secondary"
      :disabled="store.saving"
      :title="
        video.isOwner
          ? 'Copy this video into a new draft'
          : 'Make your own draft with every setting of this video'
      "
      @click.stop="onRemix"
    >
      <icon name="kind-icon:shuffle" class="kr-icon-4" />
      Remix
    </button>
    <template v-if="video.isOwner">
      <button
        type="button"
        class="kr-btn-xs btn-outline"
        :disabled="store.saving"
        :title="
          video.isPublic
            ? 'Everyone can watch the final cut. Make it private?'
            : 'Only you can see it. Make it public?'
        "
        @click.stop="store.setPublic(video.id, !video.isPublic)"
      >
        <icon
          :name="video.isPublic ? 'kind-icon:globe' : 'kind-icon:lock'"
          class="kr-icon-4"
        />
        {{ video.isPublic ? 'Public' : 'Private' }}
      </button>
      <button
        type="button"
        class="kr-btn-xs btn-error"
        :disabled="store.saving"
        @click.stop="onDelete"
      >
        <icon name="kind-icon:trash" class="kr-icon-4" />
        Delete
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMusicVideoStore } from '@/stores/musicVideoStore'
import { useUserStore } from '@/stores/userStore'

const props = defineProps<{
  video: { id: number; title: string; isOwner: boolean; isPublic: boolean }
}>()

const store = useMusicVideoStore()
const userStore = useUserStore()

async function onRemix() {
  await store.remix(props.video.id)
}

async function onDelete() {
  if (!window.confirm(`Delete "${props.video.title}"? This cannot be undone.`))
    return
  await store.remove(props.video.id)
}
</script>
