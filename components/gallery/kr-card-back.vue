<!-- /components/gallery/kr-card-back.vue -->
<!--
  The back of the card: everything about one object, and the buttons that act
  on it.

  WHY THIS EXISTS. Silas, 2026-08-08: "selecting the card brings us to the full
  info display with the animation ... think the back of a baseball card with
  stats. Then the edit option is just an on-screen change to the modal and
  clicking returns to the info screen, with a back option to flip the card back
  down to the gallery ... info is first, and interactions come after."

  IT IS THE FRAME THE CARD CONTRACT ALREADY DESCRIBED. verifyCardActionContract
  says of the pick action: "Model-specific verbs (`launch`, `adventure`,
  `clone`, `delete`) are ADDITIONS, never replacements -- the interact tier is
  where models legitimately differ, but the entry point is the frame." That
  frame was specified and never built, so `open` went straight from the grid
  into the model-specific tier with nothing shared in between. This is the
  missing step, which is why it is one component for every object rather than
  one per gallery.

  WHAT IS SHARED AND WHAT IS NOT, the same split kr-entity-card-body settled:
  art, title, badges, description, the action row and the info/edit swap are
  here; the stats that only a Bot or only a Reward has go in `#details`, and
  the form goes in `#edit`. Nothing model-specific is named in this file.

  INTERACT LEAVES. `interact` is an emit, not a panel: the interact surfaces
  are working spaces -- a chat window, an encounter engine -- and a centred
  modal is the wrong frame for them. The host dismisses this and hands over to
  the interact tier, so the tier keeps owning per-model behaviour exactly as it
  does today and this only decides WHEN you get there.

  NO STORE, NO FETCH. Same reason kr-gallery and kr-card-flip have none: a
  shell that owns the consequence cannot be reused by the next caller.
-->
<template>
  <section class="flex flex-col">
    <header class="relative shrink-0 border-b border-base-300 bg-base-200/60">
      <div
        v-if="resolvedArtSrc"
        class="relative flex max-h-72 w-full shrink-0 justify-center overflow-hidden bg-base-200"
      >
        <img
          :src="resolvedArtSrc"
          :alt="title"
          class="max-h-72 w-auto max-w-full object-contain"
        />

        <div
          v-if="badges.length"
          class="absolute left-2 top-2 flex flex-wrap gap-1"
        >
          <span
            v-for="badge in badges"
            :key="badge"
            class="badge badge-sm border-none bg-black/60 text-white"
          >
            {{ badge }}
          </span>
        </div>
      </div>

      <div v-if="resolvedArtSrc" class="min-w-0 px-3 pb-3 pt-2">
        <h2 class="break-words text-lg font-black leading-tight">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="mt-0.5 text-xs text-base-content/60">
          {{ subtitle }}
        </p>
      </div>

      <div v-else class="min-w-0 flex-1 p-3">
        <h2 class="break-words text-lg font-black leading-tight">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="mt-0.5 text-xs text-base-content/60">
          {{ subtitle }}
        </p>

        <div v-if="badges.length" class="mt-1.5 flex flex-wrap gap-1">
          <span
            v-for="badge in badges"
            :key="badge"
            class="badge badge-outline badge-sm"
          >
            {{ badge }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="btn btn-sm absolute right-2 top-2 rounded-xl border-none bg-black/55 text-white hover:bg-black/75"
        @click="emit('back')"
      >
        <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
        Back
      </button>
    </header>

    <div class="p-3">
      <template v-if="editing">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-sm font-black uppercase tracking-wide opacity-60">
            Editing
          </h3>

          <button
            type="button"
            class="kr-btn-ghost-xs"
            @click="editing = false"
          >
            <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
            Done
          </button>
        </div>

        <slot name="edit" :done="stopEditing" />
      </template>

      <template v-else>
        <p
          v-if="description"
          class="whitespace-pre-wrap text-sm text-base-content/75"
        >
          {{ description }}
        </p>

        <div class="mt-3">
          <slot name="details" />
        </div>

        <div
          v-if="$slots.reviews && reviewsOpen"
          class="mt-4 border-t border-base-300 pt-3"
        >
          <slot name="reviews" />
        </div>
      </template>
    </div>

    <footer
      v-if="!editing && (canEdit || canInteract || canReview || $slots.actions)"
      class="flex shrink-0 items-center justify-end gap-2 border-t border-base-300 bg-base-200/60 p-3"
    >
      <slot name="actions" />

      <button
        v-if="canReview && $slots.reviews"
        type="button"
        class="kr-btn"
        :class="reviewsOpen ? 'btn-accent' : 'btn-outline'"
        :aria-expanded="reviewsOpen"
        @click="reviewsOpen = !reviewsOpen"
      >
        <Icon name="kind-icon:comment" class="h-4 w-4" />
        Reviews
      </button>

      <button
        v-if="canEdit"
        type="button"
        class="kr-btn btn-outline"
        @click="editing = true"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
        Edit
      </button>

      <button
        v-if="canInteract"
        type="button"
        class="kr-btn-primary"
        @click="emit('interact')"
      >
        {{ interactLabel }}
        <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { resolveEntityArtwork, type ArtImageSrcLike } from '@/utils/artImageSrc'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    description?: string
    source?: ArtImageSrcLike | null
    artSrc?: string
    badges?: string[]
    canEdit?: boolean
    canInteract?: boolean
    canReview?: boolean
    interactLabel?: string
  }>(),
  {
    subtitle: '',
    description: '',
    source: null,
    artSrc: '',
    badges: () => [],
    canEdit: false,
    canInteract: false,
    canReview: false,
    interactLabel: 'Open',
  },
)

const resolvedArtSrc = computed(
  () =>
    props.artSrc ||
    (props.source ? resolveEntityArtwork(props.source) : '') ||
    '',
)

const emit = defineEmits<{
  back: []
  interact: []
}>()

const editing = defineModel<boolean>('editing', { default: false })
const reviewsOpen = ref(false)

watch(
  () => props.title,
  () => {
    reviewsOpen.value = false
  },
)

function stopEditing(): void {
  editing.value = false
}
</script>
