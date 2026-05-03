<!-- /components/content/dream/dream-card.vue -->
<template>
  <article
    :class="[
      'relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-100 transition-all hover:shadow-lg',
      compact ? 'gap-2' : 'gap-4',
      selected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectDream"
  >
    <div
      v-if="showActions && (selected || compact)"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="allowEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Dream"
        @click.stop="emit('edit', dream.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowClone"
        class="rounded-full bg-base-100 p-2 text-secondary shadow hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Dream"
        @click.stop="emit('clone', dream.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Dream"
        @click.stop="deleteDream"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <button
      v-if="showImage"
      type="button"
      :class="[
        'relative w-full overflow-hidden bg-base-300 text-left',
        compact ? 'h-28' : 'h-40',
      ]"
      @click.stop="selectDream"
    >
      <img
        v-if="dreamImage"
        :src="dreamImage"
        :alt="dream.title || 'Dream'"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />

      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/20 to-accent/20"
      >
        <Icon
          name="kind-icon:moon"
          :class="compact ? 'h-12 w-12' : 'h-16 w-16'"
          class="text-primary"
        />
      </div>

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span
          class="badge badge-sm"
          :class="dream.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{ dream.isPublic ? 'Public' : 'Private' }}
        </span>

        <span v-if="dream.isMature" class="badge badge-sm badge-error">
          Mature
        </span>

        <span v-if="!dream.isActive" class="badge badge-sm badge-neutral">
          Inactive
        </span>
      </div>
    </button>

    <div
      :class="['flex min-h-0 flex-1 flex-col gap-3', compact ? 'p-3' : 'p-4']"
    >
      <div class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-lg',
          ]"
        >
          {{ dream.title || `Dream ${dream.id}` }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'mt-1 leading-relaxed text-base-content/65',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-sm',
          ]"
        >
          {{ dream.currentVibe || dream.description || 'No vibe recorded.' }}
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="dream.slug" class="badge badge-outline badge-sm">
          {{ dream.slug }}
        </span>

        <span v-if="dream.User?.username" class="badge badge-ghost badge-sm">
          {{ dream.User.username }}
        </span>

        <span v-if="dream.Scenario?.title" class="badge badge-primary badge-sm">
          {{ dream.Scenario.title }}
        </span>
      </div>

      <div
        v-if="showStats"
        class="mt-auto grid grid-cols-3 gap-2 text-center text-xs"
      >
        <div class="rounded-2xl bg-base-200 p-2">
          <div class="font-black">
            {{ dream._count?.Chats ?? dream.Chats?.length ?? 0 }}
          </div>
          <div class="text-base-content/50">Chats</div>
        </div>

        <div class="rounded-2xl bg-base-200 p-2">
          <div class="font-black">
            {{ dream._count?.Reactions ?? dream.Reactions?.length ?? 0 }}
          </div>
          <div class="text-base-content/50">Reacts</div>
        </div>

        <div class="rounded-2xl bg-base-200 p-2">
          <div class="font-black">
            {{ dream.ArtCollection?.art?.length ?? 0 }}
          </div>
          <div class="text-base-content/50">Art</div>
        </div>
      </div>

      <div v-if="showOpenButton" class="flex gap-2">
        <button
          type="button"
          class="btn btn-xs btn-primary flex-1 rounded-2xl text-white"
          @click.stop="selectDream"
        >
          Open
        </button>

        <button
          v-if="allowEdit"
          type="button"
          class="btn btn-xs btn-secondary flex-1 rounded-2xl"
          @click.stop="emit('edit', dream.id)"
        >
          Edit
        </button>
      </div>
    </div>

    <div v-if="showDebug" class="px-4 pb-4">
      <button
        class="btn btn-ghost btn-xs rounded-xl"
        type="button"
        @click.stop="showDetails = !showDetails"
      >
        {{ showDetails ? 'Hide' : 'Show' }} Details
      </button>

      <pre
        v-if="showDetails"
        class="mt-2 max-h-48 overflow-auto rounded-xl bg-base-300 p-3 text-xs text-base-content/70"
        >{{ JSON.stringify(dream, null, 2) }}</pre
      >
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showOpenButton?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
  }>(),
  {
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showStats: true,
    showOpenButton: true,
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
  },
)

const emit = defineEmits<{
  select: [id: number]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
}>()

const dreamStore = useDreamStore()
const showDetails = ref(false)

const dreamImage = computed(() => {
  if (props.dream.Art?.imagePath) return props.dream.Art.imagePath
  if (props.dream.ArtImage?.imageData && props.dream.ArtImage?.fileType) {
    return `data:image/${props.dream.ArtImage.fileType};base64,${props.dream.ArtImage.imageData}`
  }
  if (props.dream.ArtImage?.fileName) return props.dream.ArtImage.fileName

  return ''
})

async function selectDream() {
  await dreamStore.selectDreamById(props.dream.id)
  emit('select', props.dream.id)
}

async function deleteDream() {
  const result = await dreamStore.deleteDream(props.dream.id)

  if (result.success) {
    emit('delete', props.dream.id)
  }
}
</script>
