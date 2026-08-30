<!-- /components/user/forum-author-badge.vue -->
<!--
  Renders a forum post's explicit authorship (server/utils/forumApi.ts's
  serializeForumPost) — who actually wrote this, not just a display name.

  AI_AGENT posts always retain the operator User (server/utils/forumApi.ts's
  requireForumWriter connects both Bot and User on write) so accountability is
  never lost even when a scoped agent credential posted on the Bot's behalf.

  rainbow-butterflies/t-033: both User and Bot already carry avatarImage, but
  nothing rendered it -- author identity was emoji-only. The emoji is kept as
  a small corner badge (still the fastest human/agent read) rather than
  dropped, and the avatar's own fallback follows the same `|| fallback` plus
  @error-swap convention as account-hub.vue / user-avatar.vue, not a one-off.
-->
<template>
  <div
    class="flex items-center gap-1.5 text-sm font-medium text-base-content"
    :class="{ 'text-xs': small }"
  >
    <span
      class="relative inline-flex shrink-0"
      :class="small ? 'size-4' : 'size-6'"
    >
      <img
        :src="avatarSrc"
        :alt="`${author.displayName}'s avatar`"
        class="h-full w-full rounded-full border border-base-300 bg-base-200 object-cover"
        @error="onAvatarError"
      />
      <span
        class="absolute -bottom-0.5 -right-0.5 leading-none"
        :class="small ? 'text-[0.5rem]' : 'text-[0.625rem]'"
        :title="author.kind === 'AI_AGENT' ? 'AI agent' : 'Human'"
      >
        {{ author.kind === 'AI_AGENT' ? '🤖' : '👤' }}
      </span>
    </span>
    <span>{{ author.displayName }}</span>
    <span
      v-if="author.kind === 'AI_AGENT' && author.user"
      class="text-base-content/50 font-normal"
    >
      via {{ author.user.username }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type ForumAuthor = {
  kind: 'HUMAN' | 'AI_AGENT'
  displayName: string
  user: { id: number; username: string; avatarImage: string | null } | null
  bot: {
    id: number
    name: string
    slug: string
    avatarImage: string | null
  } | null
}

const props = defineProps<{
  author: ForumAuthor
  small?: boolean
}>()

// Same fallback account-hub.vue and user-avatar.vue already use for a
// missing/broken avatar -- one convention, not a new default image.
const FALLBACK_AVATAR = '/images/kindart.webp'

// AI_AGENT posts carry both Bot and User (the operator) -- the Bot is the
// visible author, so its avatar takes priority; the operator's avatarImage
// only covers the rarer case of a bot with none of its own.
const rawAvatarSrc = computed(() => {
  if (props.author.kind === 'AI_AGENT') {
    return props.author.bot?.avatarImage || props.author.user?.avatarImage || ''
  }
  return props.author.user?.avatarImage || ''
})

const avatarSrc = ref(rawAvatarSrc.value || FALLBACK_AVATAR)

watch(rawAvatarSrc, (value) => {
  avatarSrc.value = value || FALLBACK_AVATAR
})

function onAvatarError(event: Event) {
  ;(event.target as HTMLImageElement).src = FALLBACK_AVATAR
}
</script>
