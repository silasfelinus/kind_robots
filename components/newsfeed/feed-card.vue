<!-- /components/newsfeed/feed-card.vue -->
<template>
  <a
    :href="item.url"
    target="_blank"
    rel="noopener noreferrer"
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
  >
    <figure
      v-if="showImage"
      class="relative aspect-video w-full overflow-hidden bg-base-300"
    >
      <img
        v-if="imageSrc && !imageFailed"
        :src="imageSrc"
        :alt="item.title"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        loading="lazy"
        @error="imageFailed = true"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
      >
        <Icon name="kind-icon:news" class="h-10 w-10 opacity-70" />
      </div>

      <span
        v-if="primaryCategory"
        class="badge badge-primary badge-sm absolute left-2 top-2 rounded-xl shadow"
      >
        {{ primaryCategory }}
      </span>
    </figure>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <h3
        class="line-clamp-2 text-sm font-black leading-tight text-base-content sm:text-base"
      >
        {{ item.title }}
      </h3>

      <p
        v-if="item.summary"
        class="line-clamp-2 text-xs leading-relaxed text-base-content/65 sm:text-sm"
      >
        {{ item.summary }}
      </p>

      <div
        class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1"
      >
        <span
          class="truncate text-xs font-bold text-base-content/55"
          :title="item.source"
        >
          {{ item.source }}
        </span>
        <span
          class="flex shrink-0 items-center gap-1 text-xs text-base-content/45"
        >
          <Icon name="kind-icon:clock" class="size-3" />
          {{ relativeTime(item.publishedAt) }}
          <Icon name="kind-icon:external-link" class="size-3" />
        </span>
      </div>
    </div>
  </a>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NewsFeedItem } from '@/stores/helpers/newsfeed'

const props = withDefaults(
  defineProps<{
    item: NewsFeedItem
    showImage?: boolean
  }>(),
  {
    showImage: true,
  },
)

const imageFailed = ref(false)

const imageSrc = computed(() => props.item.image || '')

const primaryCategory = computed(() => props.item.category?.[0] || '')

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs)) return ''

  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.round(days / 30)
  return `${months}mo ago`
}
</script>
