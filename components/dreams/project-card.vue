<!-- /components/dreams/project-card.vue -->
<!-- Flip card for PROJECT-type Dreams. Front = cover image + title.
     Back = description, status badge, and external links.
     Hover flips; click on back emits 'choose'. -->
<template>
  <div
    class="group relative h-full min-h-0 cursor-pointer"
    @mouseenter="flipKey++"
    @mouseleave="flipKey++"
  >
    <flip-card
      :trigger-key="flipKey"
      :duration-ms="520"
      radius="1rem"
      class="h-full w-full"
    >
      <!-- ── Front ─────────────────────────────────────────────── -->
      <template #front>
        <article
          class="relative flex h-full min-h-64 w-full flex-col overflow-hidden rounded-2xl border bg-base-100 shadow-sm"
          :class="cardClass"
        >
          <figure class="relative h-full w-full overflow-hidden bg-base-300" :class="compact ? 'aspect-video' : 'aspect-4/5'">
            <img
              v-if="coverImage"
              :src="coverImage"
              :alt="`${projectTitle} cover`"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />

            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 text-primary"
            >
              <Icon name="kind-icon:project" class="h-16 w-16 opacity-70" />
            </div>

            <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/10 to-transparent" />

            <div class="absolute left-2 top-2 flex flex-wrap gap-1">
              <span class="badge badge-primary badge-sm rounded-xl shadow">Project</span>
              <span
                v-if="dream.projectStatus"
                class="badge badge-sm rounded-xl shadow"
                :class="statusBadgeClass"
              >
                {{ dream.projectStatus }}
              </span>
              <span v-if="dream.isMature" class="badge badge-warning badge-sm rounded-xl shadow">Mature</span>
            </div>

            <footer class="absolute inset-x-0 bottom-0 p-3">
              <h3 class="line-clamp-2 text-lg font-black leading-tight text-base-content drop-shadow">
                {{ projectTitle }}
              </h3>
              <p v-if="dream.flavorText" class="mt-1 line-clamp-1 text-xs text-base-content/70 drop-shadow">
                {{ dream.flavorText }}
              </p>
            </footer>
          </figure>
        </article>
      </template>

      <!-- ── Back ──────────────────────────────────────────────── -->
      <template #back>
        <article
          class="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl border bg-base-200 p-4 shadow-sm"
          :class="cardClass"
          @click="$emit('choose', dream)"
        >
          <div>
            <h3 class="mb-1 line-clamp-2 text-lg font-black leading-tight text-base-content">
              {{ projectTitle }}
            </h3>

            <p v-if="dream.description" class="line-clamp-4 text-sm text-base-content/70">
              {{ dream.description }}
            </p>
            <p v-else-if="dream.pitch" class="line-clamp-4 text-sm text-base-content/70">
              {{ dream.pitch }}
            </p>
          </div>

          <div class="mt-3 space-y-2">
            <div class="flex flex-wrap gap-2">
              <span
                v-if="dream.projectStatus"
                class="badge badge-sm rounded-xl"
                :class="statusBadgeClass"
              >
                {{ dream.projectStatus }}
              </span>
              <span v-if="botCount" class="badge badge-secondary badge-sm rounded-xl">
                {{ botCount }} Agent{{ botCount === 1 ? '' : 's' }}
              </span>
              <span v-if="chatCount" class="badge badge-accent badge-sm rounded-xl">
                {{ chatCount }} Note{{ chatCount === 1 ? '' : 's' }}
              </span>
            </div>

            <div v-if="dream.liveUrl || dream.repoUrl" class="flex flex-wrap gap-2">
              <a
                v-if="dream.liveUrl"
                :href="dream.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
                @click.stop
              >
                <Icon name="kind-icon:external-link" class="h-3 w-3" />
                Live
              </a>
              <a
                v-if="dream.repoUrl"
                :href="dream.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
                @click.stop
              >
                <Icon name="kind-icon:code" class="h-3 w-3" />
                Repo
              </a>
            </div>

            <div v-if="showActions && (allowEdit || allowDelete)" class="flex gap-1" @click.stop>
              <button
                v-if="allowEdit"
                type="button"
                class="btn btn-circle btn-sm border-base-300 bg-base-100/90 shadow"
                title="Edit Project"
                @click="$emit('edit', dream.id)"
              >
                <Icon name="kind-icon:edit" class="h-4 w-4" />
              </button>
              <button
                v-if="allowDelete"
                type="button"
                class="btn btn-circle btn-sm border-base-300 bg-base-100/90 text-error shadow"
                title="Archive Project"
                @click="$emit('delete', dream.id)"
              >
                <Icon name="kind-icon:archive" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>
      </template>
    </flip-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    dream: DreamWithRelations
    compact?: boolean
    showActions?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    selected?: boolean
  }>(),
  {
    compact: false,
    showActions: true,
    allowEdit: true,
    allowDelete: false,
    selected: false,
  },
)

defineEmits<{
  (event: 'choose', dream: DreamWithRelations): void
  (event: 'edit', id: number): void
  (event: 'delete', id: number): void
}>()

const flipKey = ref(0)

const projectTitle = computed(() => props.dream.title || `Project ${props.dream.id}`)

const coverImage = computed(() => {
  return (
    props.dream.cardPath ||
    props.dream.imagePath ||
    props.dream.highlightImage ||
    props.dream.ArtImage?.imagePath ||
    props.dream.ArtImages?.[0]?.imagePath ||
    props.dream.ArtCollection?.imagePath ||
    ''
  )
})

const botCount = computed(() => props.dream.Bots?.length ?? props.dream._count?.Chats ?? 0)
const chatCount = computed(() => props.dream._count?.Chats ?? props.dream.Chats?.length ?? 0)

const cardClass = computed(() => {
  if (props.selected) return 'border-primary ring-2 ring-primary/30'
  if (props.dream.isActive === false) return 'border-base-300 opacity-70 grayscale-[35%]'
  return 'border-base-300'
})

const statusBadgeClass = computed(() => {
  switch (props.dream.projectStatus) {
    case 'ACTIVE': return 'badge-success'
    case 'PAUSED': return 'badge-warning'
    case 'DONE': return 'badge-info'
    case 'ARCHIVED': return 'badge-ghost'
    default: return 'badge-ghost'
  }
})
</script>
