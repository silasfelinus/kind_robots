<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="group relative flex h-full min-h-0 cursor-pointer overflow-hidden rounded-2xl border bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    :class="cardClass"
    @click="$emit('choose', dream)"
  >
    <figure
      v-if="showImage"
      class="relative h-full min-h-64 w-full overflow-hidden bg-base-300"
      :class="compact ? 'aspect-video' : 'aspect-4/5'"
    >
      <img
        v-if="previewImage"
        :src="previewImage"
        :alt="`${dreamTitle} preview`"
        class="h-full w-full transition duration-300 group-hover:scale-[1.03]"
        :class="imageFit === 'contain' ? 'object-contain' : 'object-cover'"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
      >
        <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
      </div>

      <div
        class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-300/95 via-base-300/20 to-base-300/5"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span class="badge badge-primary badge-sm rounded-xl shadow">
          {{ dreamTypeLabel(dream.dreamType) }}
        </span>

        <span
          v-if="dream.isMature"
          class="badge badge-warning badge-sm rounded-xl shadow"
        >
          Mature
        </span>
      </div>

      <div
        v-if="selected || isSelected"
        class="absolute right-2 top-2 rounded-full border border-primary/40 bg-base-100/90 p-2 text-primary shadow backdrop-blur"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>

      <footer class="absolute inset-x-0 bottom-0 p-3">
        <h3
          class="line-clamp-2 text-lg font-black leading-tight text-base-content drop-shadow"
        >
          {{ dreamTitle }}
        </h3>

        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-if="scenarioCount"
            class="badge badge-secondary badge-sm rounded-xl bg-secondary/90 shadow"
          >
            {{ scenarioCount }} Scenario{{ scenarioCount === 1 ? '' : 's' }}
          </span>

          <span
            v-if="characterCount"
            class="badge badge-accent badge-sm rounded-xl bg-accent/90 shadow"
          >
            {{ characterCount }} Cast
          </span>

          <span
            v-if="artCount"
            class="badge badge-info badge-sm rounded-xl bg-info/90 shadow"
          >
            {{ artCount }} Art
          </span>

          <span
            v-if="rewardCount"
            class="badge badge-outline badge-sm rounded-xl border-base-content/30 bg-base-100/85 shadow backdrop-blur"
          >
            {{ rewardCount }} Item{{ rewardCount === 1 ? '' : 's' }}
          </span>
        </div>
      </footer>
    </figure>

    <section
      v-else
      class="flex min-h-56 flex-1 flex-col justify-end bg-linear-to-br from-primary/15 via-secondary/10 to-accent/15 p-3"
    >
      <h3 class="line-clamp-2 text-lg font-black leading-tight text-base-content">
        {{ dreamTitle }}
      </h3>

      <p v-if="showMeta" class="mt-1 text-xs text-base-content/50">
        #{{ dream.id }} · {{ dream.isPublic ? 'Public' : 'Private' }} ·
        {{ dream.isActive ? 'Active' : 'Archived' }}
      </p>
    </section>

    <div
      v-if="showActions && (allowEdit || allowDelete)"
      class="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100"
      @click.stop
    >
      <button
        v-if="allowEdit"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 shadow backdrop-blur"
        title="Edit Dream"
        @click="$emit('edit', dream.id)"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete"
        type="button"
        class="btn btn-circle btn-sm border-base-300 bg-base-100/90 text-error shadow backdrop-blur"
        title="Archive Dream"
        @click="$emit('delete', dream.id)"
      >
        <Icon name="kind-icon:archive" class="h-4 w-4" />
      </button>
    </div>

    <details
      v-if="showDebug"
      class="absolute inset-x-2 bottom-2 z-10 rounded-2xl border border-base-300 bg-base-100/95 p-2 text-xs shadow backdrop-blur"
      @click.stop
    >
      <summary class="cursor-pointer font-bold text-primary">Debug</summary>
      <pre class="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{{
        dream
      }}</pre>
    </details>
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
  return props.dream._count?.ArtImages ?? collectionArt.value.length
})

const cardClass = computed(() => {
  if (props.selected || props.isSelected) {
    return 'border-primary ring-2 ring-primary/30'
  }

  if (props.dream.isActive === false) {
    return 'border-base-300 opacity-70 grayscale-[35%]'
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