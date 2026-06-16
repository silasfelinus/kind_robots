<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    :class="cardClass"
  >
    <figure
      v-if="showImage"
      class="relative aspect-[16/10] overflow-hidden bg-base-300"
    >
      <img
        v-if="previewImage"
        :src="previewImage"
        :alt="`${dream.title} preview`"
        class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
      >
        <Icon name="kind-icon:dream" class="h-16 w-16 opacity-70" />
      </div>

      <div class="absolute left-3 top-3 flex flex-wrap gap-2">
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

    <div class="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <header class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-lg font-black text-primary">
            {{ dream.title || 'Untitled Dream' }}
          </h3>
          <p v-if="showMeta" class="mt-1 text-xs text-base-content/50">
            #{{ dream.id }} · {{ dream.isPublic ? 'Public' : 'Private' }} ·
            {{ dream.isActive ? 'Active' : 'Archived' }}
          </p>
        </div>

        <button
          type="button"
          class="btn btn-circle btn-ghost btn-sm shrink-0"
          :disabled="isOpening"
          title="Select Dream"
          @click="selectDream"
        >
          <span v-if="isOpening" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:target" class="h-4 w-4" />
        </button>
      </header>

      <p class="line-clamp-3 min-h-14 text-sm leading-relaxed text-base-content/70">
        {{ dream.pitch || dream.description || dream.flavorText || 'No Dream pitch yet.' }}
      </p>

      <div v-if="showStats" class="grid grid-cols-4 gap-2 text-center text-xs">
        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-primary">{{ statCount('Characters') }}</p>
          <p class="text-base-content/50">Cast</p>
        </div>
        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-secondary">{{ statCount('Rewards') }}</p>
          <p class="text-base-content/50">Items</p>
        </div>
        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-accent">{{ artCount }}</p>
          <p class="text-base-content/50">Art</p>
        </div>
        <div class="rounded-xl bg-base-200 p-2">
          <p class="font-black text-info">{{ statCount('Chats') }}</p>
          <p class="text-base-content/50">Chat</p>
        </div>
      </div>

      <footer v-if="showActions" class="mt-auto flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          class="btn btn-primary btn-sm flex-1 rounded-2xl text-white"
          :disabled="isOpening"
          @click="openDream"
        >
          <Icon name="kind-icon:chat" class="h-4 w-4" />
          Open
        </button>

        <button
          type="button"
          class="btn btn-outline btn-sm rounded-2xl"
          :disabled="isEditing"
          @click="editDream"
        >
          <Icon name="kind-icon:edit" class="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl text-error"
          :disabled="isArchiving"
          @click="archiveDream"
        >
          <Icon name="kind-icon:archive" class="h-4 w-4" />
        </button>
      </footer>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    showImage?: boolean
    showActions?: boolean
    showStats?: boolean
    showMeta?: boolean
    openTab?: string
  }>(),
  {
    showImage: true,
    showActions: true,
    showStats: true,
    showMeta: true,
    openTab: 'interact',
  },
)

const emit = defineEmits<{
  (event: 'selected', dream: DreamWithRelations): void
  (event: 'opened', dream: DreamWithRelations): void
  (event: 'editing', dream: DreamWithRelations): void
  (event: 'archived', id: number): void
}>()

const dreamStore = useDreamStore()
const navStore = useNavStore()

const isOpening = ref(false)
const isEditing = ref(false)
const isArchiving = ref(false)

const isSelected = computed(() => dreamStore.selectedDream?.id === props.dream.id)

const collectionArt = computed(() => {
  const dream = props.dream as DreamWithRelations & {
    ArtCollection?: { ArtImages?: Array<{ imagePath?: string | null; path?: string | null; fileName?: string | null }> } | null
    ArtCollections?: Array<{ ArtImages?: Array<{ imagePath?: string | null; path?: string | null; fileName?: string | null }> }>
  }

  return [
    ...(dream.ArtImages ?? []),
    ...(dream.ArtCollection?.ArtImages ?? []),
    ...((dream.ArtCollections ?? []).flatMap((collection) => collection.ArtImages ?? [])),
  ]
})

const previewImage = computed(() => {
  return (
    props.dream.imagePath ||
    props.dream.highlightImage ||
    props.dream.ArtImage?.imagePath ||
    props.dream.ArtImage?.path ||
    props.dream.ArtImage?.fileName ||
    collectionArt.value.find((art) => art.imagePath || art.path || art.fileName)
      ?.imagePath ||
    collectionArt.value.find((art) => art.imagePath || art.path || art.fileName)
      ?.path ||
    collectionArt.value.find((art) => art.imagePath || art.path || art.fileName)
      ?.fileName ||
    ''
  )
})

const artCount = computed(() => {
  return props.dream._count?.ArtImages ?? collectionArt.value.length ?? 0
})

const cardClass = computed(() => {
  if (isSelected.value) return 'border-primary bg-primary/5 ring-2 ring-primary/20'
  if (props.dream.isActive === false) return 'border-base-300 opacity-70'
  return 'border-base-300'
})

function dreamTypeLabel(type?: string | null) {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statCount(key: 'Characters' | 'Rewards' | 'Chats') {
  return props.dream._count?.[key] ?? props.dream[key]?.length ?? 0
}

async function selectDream() {
  isOpening.value = true

  try {
    const dream = await dreamStore.selectDreamById(props.dream.id)
    if (dream) emit('selected', dream)
  } finally {
    isOpening.value = false
  }
}

async function openDream() {
  await selectDream()
  if (!dreamStore.selectedDream) return

  navStore.setDashboardTab?.('dream', props.openTab)
  emit('opened', dreamStore.selectedDream)
}

async function editDream() {
  isEditing.value = true

  try {
    const dream = await dreamStore.startEditingDream(props.dream.id)
    if (!dream) return

    navStore.setDashboardTab?.('dream', 'dreammaker')
    emit('editing', dream)
  } finally {
    isEditing.value = false
  }
}

async function archiveDream() {
  isArchiving.value = true

  try {
    const result = await dreamStore.deleteDream(props.dream.id)
    if (result.success) emit('archived', props.dream.id)
  } finally {
    isArchiving.value = false
  }
}
</script>
