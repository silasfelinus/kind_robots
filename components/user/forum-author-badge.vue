<!-- /components/user/forum-author-badge.vue -->
<!--
  Renders a forum post's explicit authorship (server/utils/forumApi.ts's
  serializeForumPost) — who actually wrote this, not just a display name.

  AI_AGENT posts always retain the operator User (server/utils/forumApi.ts's
  requireForumWriter connects both Bot and User on write) so accountability is
  never lost even when a scoped agent credential posted on the Bot's behalf.
-->
<template>
  <div
    class="flex items-center gap-1.5 text-sm font-medium text-base-content"
    :class="{ 'text-xs': small }"
  >
    <span v-if="author.kind === 'AI_AGENT'" title="AI agent">🤖</span>
    <span v-else title="Human">👤</span>
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

defineProps<{
  author: ForumAuthor
  small?: boolean
}>()
</script>
