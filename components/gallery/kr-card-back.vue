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
    <!--
      The art stays small here on purpose. On the front it is the whole card
      because that is how you FIND a thing in a grid; on the back you have
      already found it, and the stats are what you came for.
    -->
    <header class="relative shrink-0 border-b border-base-300 bg-base-200/60">
      <!--
        THE ART IS THE CARD, not a favicon beside a heading. It was a 64px
        square thumbnail, which reads as a list row rather than the back of
        something -- Silas, 2026-08-08: "should definitely look card like, with
        better image size".

        A 4:3 plate the width of the panel is what makes it a card again, and
        it is capped rather than free so a tall image cannot push the stats off
        a phone. The title sits in a scrim ON the art, the same relationship
        the FRONT of the card already uses, so turning it over reads as the
        same object rather than a different screen.
      -->
      <div
        v-if="artSrc"
        class="relative aspect-[4/3] max-h-56 w-full shrink-0 overflow-hidden bg-base-300"
      >
        <img :src="artSrc" :alt="title" class="h-full w-full object-cover" />

        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-3 pt-8"
        >
          <h2 class="break-words text-lg font-black leading-tight text-white">
            {{ title }}
          </h2>

          <p v-if="subtitle" class="mt-0.5 text-xs text-white/75">
            {{ subtitle }}
          </p>
        </div>

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

      <!-- No art: the title has to carry the header on its own, so it keeps
           the badges beside it rather than leaving an empty plate. -->
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

      <!--
        `back` rather than a close X. Silas asked for "a back option to flip the
        card back down to the gallery", and the host wires this to the flip's
        `commit` so the turn plays in reverse -- returning to the grid is the
        deliberate exit, not a dismissal.
      -->
      <button
        type="button"
        class="btn btn-sm absolute right-2 top-2 rounded-xl border-none bg-black/55 text-white hover:bg-black/75"
        @click="emit('back')"
      >
        <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
        Back
      </button>
    </header>

    <!--
      min-h-0 is what lets this shrink below its content so kr-card-flip's
      scroll container has something to scroll. Without it the flex child is
      floored at content height and the panel grows instead, which is the same
      failure the stage's height fix addresses from the other end.
    -->
    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <!--
        The edit form REPLACES the info body rather than flipping again --
        "the edit option is just an on-screen change to the modal". A second
        flip inside a flipped card would say the object changed, when all that
        changed is what you are doing to it.
      -->
      <template v-if="editing">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h3 class="text-sm font-black uppercase tracking-wide opacity-60">
            Editing
          </h3>

          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl"
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

        <!-- The stats. Everything genuinely per-object lives here, and this
             file never learns what any of it means. -->
        <div class="mt-3">
          <slot name="details" />
        </div>

        <!--
          Reviews sit with the info, not with the actions. Silas: "this also
          feels like it should be where we show the toggle to give a review,
          which we've talked about as an interact object." Reacting to a thing
          is a response to having read about it, so it belongs at the end of
          the reading rather than in the row of things you can go and do.
        -->
        <div v-if="$slots.reviews" class="mt-4 border-t border-base-300 pt-3">
          <slot name="reviews" />
        </div>
      </template>
    </div>

    <!--
      Actions last, and only out of edit mode: while a form is open the buttons
      that would navigate away from it are a trap.
    -->
    <footer
      v-if="!editing && (canEdit || canInteract)"
      class="flex shrink-0 items-center justify-end gap-2 border-t border-base-300 bg-base-200/60 p-3"
    >
      <button
        v-if="canEdit"
        type="button"
        class="btn btn-outline btn-sm rounded-xl"
        @click="editing = true"
      >
        <Icon name="kind-icon:edit" class="h-4 w-4" />
        Edit
      </button>

      <button
        v-if="canInteract"
        type="button"
        class="btn btn-primary btn-sm rounded-xl"
        @click="emit('interact')"
      >
        {{ interactLabel }}
        <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
      </button>
    </footer>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    description?: string
    artSrc?: string
    badges?: string[]
    canEdit?: boolean
    canInteract?: boolean
    /**
     * What the interact tier is CALLED for this object -- "Chat", "Play",
     * "Open". The verb is per-model even though the button is not, which is
     * the same line verifyCardActionContract draws around `open`.
     */
    interactLabel?: string
  }>(),
  {
    subtitle: '',
    description: '',
    artSrc: '',
    badges: () => [],
    canEdit: false,
    canInteract: false,
    interactLabel: 'Open',
  },
)

const emit = defineEmits<{
  back: []
  interact: []
}>()

/*
 * Uncontrolled unless the host binds it. defineModel keeps local state when
 * nothing is passed, so a gallery that does not care about edit mode writes
 * nothing, and one that does (to block a close mid-edit, say) can bind
 * v-model:editing and see it.
 */
const editing = defineModel<boolean>('editing', { default: false })

function stopEditing(): void {
  editing.value = false
}
</script>
