<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="group flex h-full min-h-0 cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    :class="cardClass"
    @click="$emit('choose', dream)"
  >
    <figure
      v-if="showImage"
      class="relative overflow-hidden bg-base-300"
      :class="compact ? 'aspect-video' : 'aspect-4/5'"
    >
      <img
        v-if="previewImage"
        :src="previewImage"
        :alt="`${dreamTitle} preview`"
        class="h-full w-full transition duration-300 group-hover:scale-[1.02]"
        :class="imageFit === 'contain' ? 'object-contain' : 'object-cover'"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
      >
        <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-primary badge-sm rounded-xl">
          {{ dreamTypeLabel(dream.dreamType) }}
        </span>

        <span
          v-if="dream.isMature"
          class="badge badge-warning badge-sm rounded-xl"
        >
          Mature
        </span>
      </div>
    </figure>

    <section class="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3
            class="font-black leading-tight text-base-content"
            :class="compact ? 'line-clamp-1 text-base' : 'line-clamp-2 text-lg'"
          >
            {{ dreamTitle }}
          </h3>

          <p v-if="showMeta" class="mt-1 text-xs text-base-content/50">
            #{{ dream.id }} · {{ dream.isPublic ? 'Public' : 'Private' }} ·
            {{ dream.isActive ? 'Active' : 'Archived' }}
          </p>
        </div>
      </header>

      <p
        v-if="showDescription"
        class="text-sm leading-relaxed text-base-content/70"
        :class="compact ? 'line-clamp-2' : 'line-clamp-3'"
      >
        {{ dreamDescription }}
      </p>

      <div v-if="showStats" class="grid grid-cols-4 gap-2 text-center text-xs">
        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-primary">{{ scenarioCount }}</p>
          <p class="text-base-content/50">Worlds</p>
        </div>

        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-accent">{{ characterCount }}</p>
          <p class="text-base-content/50">Cast</p>
        </div>

        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-info">{{ artCount }}</p>
          <p class="text-base-content/50">Art</p>
        </div>

        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-secondary">{{ rewardCount }}</p>
          <p class="text-base-content/50">Items</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-1">
        <span
          v-if="scenarioCount"
          class="badge badge-secondary badge-sm rounded-xl"
        >
          {{ scenarioCount }} Scenario{{ scenarioCount === 1 ? '' : 's' }}
        </span>

        <span
          v-if="characterCount"
          class="badge badge-accent badge-sm rounded-xl"
        >
          {{ characterCount }} Cast
        </span>

        <span v-if="artCount" class="badge badge-info badge-sm rounded-xl">
          {{ artCount }} Art
        </span>

        <span
          v-if="rewardCount"
          class="badge badge-outline badge-sm rounded-xl"
        >
          {{ rewardCount }} Reward{{ rewardCount === 1 ? '' : 's' }}
        </span>
      </div>

      <footer
        v-if="showActions && (allowEdit || allowDelete)"
        class="mt-auto flex flex-wrap justify-end gap-2 pt-1"
        @click.stop
      >
        <button
          v-if="allowEdit"
          type="button"
          class="btn btn-outline btn-sm rounded-2xl"
          @click="$emit('edit', dream.id)"
        >
          <Icon name="kind-icon:edit" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowDelete"
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl text-error"
          @click="$emit('delete', dream.id)"
        >
          <Icon name="kind-icon:archive" class="h-4 w-4" />
        </button>
      </footer>

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-200 p-2 text-xs"
        @click.stop
      >
        <summary class="cursor-pointer font-bold text-primary">Debug</summary>
        <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{{
          dream
        }}</pre>
      </details>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { DreamWithRelations } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    selected?: boolean
    isSelected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    imageFit?: 'cover' | 'contain'
  }>(),
  {
    selected: false,
    isSelected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: false,
    showMeta: true,
    showStats: false,
    showDebug: false,
    allowEdit: true,
    allowDelete: false,
    imageFit: 'cover',
  },
)

defineEmits<{
  (event: 'choose', dream: DreamWithRelations): void
  (event: 'edit', id: number): void
  (event: 'delete', id: number): void
}>()

const dreamTitle = computed(() => {
  return props.dream.title || `Dream ${props.dream.id}`
})

const dreamDescription = computed(() => {
  return (
    props.dream.pitch ||
    props.dream.description ||
    props.dream.flavorText ||
    props.dream.artPrompt ||
    'No Dream summary yet.'
  )
})

const collectionArt = computed<Partial<ArtImage>[]>(() => {
  return [
    ...(props.dream.ArtImages ?? []),
    ...(props.dream.ArtCollection?.ArtImages ?? []),
    ...(props.dream.ArtCollections ?? []).flatMap(
      (collection) => collection.ArtImages ?? [],
    ),
  ]
})

const previewImage = computed(() => {
  const firstCollectionImage = collectionArt.value.find(
    (art) => art.imagePath || art.path || art.fileName,
  )

  return (
    props.dream.imagePath ||
    props.dream.highlightImage ||
    props.dream.ArtImage?.imagePath ||
    props.dream.ArtImage?.path ||
    props.dream.ArtImage?.fileName ||
    firstCollectionImage?.imagePath ||
    firstCollectionImage?.path ||
    firstCollectionImage?.fileName ||
    ''
  )
})

const scenarioCount = computed(() => {
  return (
    props.dream._count?.Scenarios ??
    props.dream.Scenarios?.length ??
    (props.dream.Scenario ? 1 : 0)
  )
})

const characterCount = computed(() => {
  return props.dream._count?.Characters ?? props.dream.Characters?.length ?? 0
})

const rewardCount = computed(() => {
  return props.dream._count?.Rewards ?? props.dream.Rewards?.length ?? 0
})

const artCount = computed(() => {
  return props.dream._count?.ArtImages ?? collectionArt.value.length ?? 0
})

const cardClass = computed(() => {
  if (props.selected || props.isSelected) {
    return 'border-primary bg-primary/5 ring-2 ring-primary/20'
  }

  if (props.dream.isActive === false) {
    return 'border-base-300 opacity-70'
  }

  return 'border-base-300'
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>
