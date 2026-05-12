<!-- /components/dreams/dream-card.vue -->
<template>
  <article
    class="cursor-pointer rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
    :class="cardClass"
    @click="selectDream"
  >
    <div class="flex items-start gap-3">
      <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300">
        <img
          v-if="image"
          :src="image"
          class="h-full w-full object-cover"
          :alt="dream.title"
        />
        <Icon
          v-else
          name="kind-icon:door"
          class="h-9 w-9 text-primary"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="line-clamp-2 text-lg font-black text-primary">
            {{ dream.title }}
          </h3>

          <div class="flex shrink-0 flex-col gap-1 text-right">
            <span
              v-if="!dream.isActive"
              class="badge badge-warning"
            >
              Archived
            </span>
            <span
              v-if="dream.isMature"
              class="badge badge-error"
            >
              Mature
            </span>
            <span
              v-if="!dream.isPublic"
              class="badge badge-secondary"
            >
              Private
            </span>
          </div>
        </div>

        <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
          {{ dream.description || dream.currentVibe }}
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

    <div
      v-if="showActions"
      class="mt-3 flex flex-wrap gap-2"
      @click.stop
    >
      <button
        class="btn btn-xs btn-primary rounded-2xl"
        type="button"
        @click="selectDream"
      >
        Open
      </button>

      <button
        class="btn btn-xs btn-secondary rounded-2xl"
        type="button"
        @click="editDream"
      >
        Edit
      </button>

      <button
        class="btn btn-xs btn-warning rounded-2xl"
        type="button"
        :disabled="dreamStore.isDeleting"
        @click="archiveDream"
      >
        Archive
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    selected?: boolean
    showStats?: boolean
    showActions?: boolean
  }>(),
  {
    selected: false,
    showStats: true,
    showActions: true,
  },
)

const emit = defineEmits<{
  edit: [id: number]
  selected: [id: number]
  archived: [id: number]
}>()

const dreamStore = useDreamStore()

const isSelected = computed(() => {
  return props.selected || dreamStore.selectedDream?.id === props.dream.id
})

const image = computed(() => {
  return (
    props.dream.Art?.imagePath ??
    props.dream.ArtImage?.fileName ??
    props.dream.Gallery?.highlightImage ??
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
  emit('selected', props.dream.id)
}

async function editDream() {
  await dreamStore.startEditingDream(props.dream.id)
  emit('edit', props.dream.id)
}

async function archiveDream() {
  const result = await dreamStore.deleteDream(props.dream.id)

  if (result.success) {
    emit('archived', props.dream.id)
  }
}
</script>
