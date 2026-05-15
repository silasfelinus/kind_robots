<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="cursor-pointer rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
    :class="cardClass"
    @click="selectDream"
  >
    <div class="flex items-start gap-3">
      <div
        v-if="showImages"
        class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
      >
        <img
          v-if="previewImage"
          :src="previewImage"
          class="h-full w-full object-cover"
          :alt="dream.title"
        />
        <Icon v-else name="kind-icon:door" class="h-10 w-10 text-primary" />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="line-clamp-2 text-lg font-black text-primary">
            {{ dream.title }}
          </h3>

          <div class="flex shrink-0 flex-col gap-1 text-right">
            <span v-if="!dream.isActive" class="badge badge-warning">
              Archived
            </span>
            <span v-if="dream.isMature" class="badge badge-error">
              Mature
            </span>
            <span v-if="!dream.isPublic" class="badge badge-secondary">
              Private
            </span>
          </div>
        </div>

        <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
          {{ dream.description || dream.currentVibe }}
        </p>

        <p
          v-if="collectionArt.length"
          class="mt-2 flex items-center gap-1 text-xs font-bold text-accent"
        >
          <Icon name="kind-icon:image" class="h-3.5 w-3.5" />
          {{ collectionArt.length }} collection image{{
            collectionArt.length === 1 ? '' : 's'
          }}
        </p>
      </div>
    </div>

    <div
      v-if="showStats"
      class="mt-3 grid grid-cols-3 gap-2 text-center text-xs"
    >
      <div class="rounded-2xl bg-base-200 p-2">
        <div class="font-black text-secondary">
          {{ dream._count?.Characters ?? dream.Characters?.length ?? 0 }}
        </div>
        <div class="text-base-content/60">Cast</div>
      </div>

      <div class="rounded-2xl bg-base-200 p-2">
        <div class="font-black text-secondary">
          {{ dream._count?.Rewards ?? dream.Rewards?.length ?? 0 }}
        </div>
        <div class="text-base-content/60">Items</div>
      </div>

      <div class="rounded-2xl bg-base-200 p-2">
        <div class="font-black text-secondary">
          {{ dream._count?.Chats ?? dream.Chats?.length ?? 0 }}
        </div>
        <div class="text-base-content/60">Notes</div>
      </div>
    </div>

    <div v-if="showActions" class="mt-3 flex flex-wrap gap-2" @click.stop>
      <button
        v-if="showOpenButton"
        class="btn btn-xs btn-primary rounded-2xl"
        type="button"
        @click="openDream"
      >
        <Icon name="kind-icon:door-open" class="h-4 w-4" />
        Open
      </button>

      <button
        class="btn btn-xs btn-secondary rounded-2xl"
        type="button"
        @click="editDream"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
        Edit
      </button>

      <button
        class="btn btn-xs btn-warning rounded-2xl"
        type="button"
        :disabled="dreamStore.isDeleting"
        @click="archiveDream"
      >
        <Icon name="kind-icon:archive" class="h-4 w-4" />
        Archive
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'

const dreamStore = useDreamStore()
const navStore = useNavStore()
const dashboardKey = 'dream' as const

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    selected?: boolean
    showImages?: boolean
    showStats?: boolean
    showActions?: boolean
    showOpenButton?: boolean
  }>(),
  {
    selected: false,
    showImages: true,
    showStats: true,
    showActions: true,
    showOpenButton: true,
  },
)

const isSelected = computed(() => {
  return props.selected || dreamStore.selectedDream?.id === props.dream.id
})

const collectionArt = computed(() => props.dream.ArtCollection?.art ?? [])

const randomCollectionArt = computed(() => {
  if (!collectionArt.value.length) return null

  const index =
    Math.abs(
      props.dream.id + props.dream.title.length + collectionArt.value.length,
    ) % collectionArt.value.length

  return collectionArt.value[index] ?? null
})

const previewImage = computed(() => {
  return (
    randomCollectionArt.value?.imagePath ||
    randomCollectionArt.value?.path ||
    props.dream.Art?.imagePath ||
    props.dream.Art?.path ||
    props.dream.ArtImage?.imagePath ||
    props.dream.ArtImage?.path ||
    props.dream.ArtImage?.fileName ||
    props.dream.Gallery?.highlightImage ||
    ''
  )
})

const cardClass = computed(() => {
  return isSelected.value
    ? 'border-primary bg-primary/10 shadow'
    : 'border-base-300 bg-base-100'
})

async function selectDream() {
  await dreamStore.selectDreamById(props.dream.id)
}

async function openDream() {
  await dreamStore.selectDreamById(props.dream.id)
  navStore.setDashboardTab(dashboardKey, 'interact')
}

async function editDream() {
  await dreamStore.startEditingDream(props.dream.id)
  navStore.setDashboardTab(dashboardKey, 'add')
}

async function archiveDream() {
  await dreamStore.deleteDream(props.dream.id)
}
</script>
