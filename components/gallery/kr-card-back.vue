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
      <!--
        NO FIXED ASPECT. A 4:3 plate around a portrait left wide grey bars down
        both sides -- Silas, 2026-08-09: "Layout when selected is still
        formatted oddly, we want something more vertical". The plate now takes
        the image's own shape, capped at max-h-72, so a tall Bot portrait reads
        tall and a wide one reads wide, and neither is padded out to a ratio
        it does not have.

        CONTAIN, not cover, and the title sits BELOW rather than on top.
        Silas, 2026-08-09: "layout should be card like and not cut off the
        image". `object-cover` filled the plate by cropping, which on a tall
        Bot portrait meant slicing the head off; `object-contain` shows the
        whole frame and letterboxes the remainder against the plate.

        The title moved out of the scrim for the same reason -- a scrim over a
        CONTAINED image sits on empty plate as often as on artwork, so it read
        as a bar rather than a caption. Art up top, name beneath it: the shape
        an actual card back has.
      -->
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
    <!--
      NO overflow HERE. kr-card-flip's panel is already the scroll owner, and
      giving this its own `overflow-y-auto` made two nested scrollers where the
      inner one's parent (this section) has no bounded height -- so the inner
      region never became scrollable and the outer one never received the
      overflow. Silas, 2026-08-09, on the edit view: "we cannot scroll."

      Plain flow content, one scroller above it. The footer scrolls with the
      body as a result, which is the right trade: an action bar pinned over a
      form you cannot reach is worse than one you scroll to.
    -->
    <div class="p-3">
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
          Reviews used to sit here unconditionally, on the reasoning that
          "reacting to a thing is a response to having read about it, so it
          belongs at the end of the reading rather than in the row of things you
          can go and do."

          Silas, 2026-08-11, reversed the placement: reviews are a clickable
          button in the same row as the interact links and Edit. The content
          still renders here -- a review panel in a button-height row would be
          unreadable -- but it is now revealed BY that button rather than
          sitting open, so the row is the entry point for all three of interact,
          edit and review. That matches the three abilities verifyCardActionContract
          already names as the card's job.
        -->
        <div
          v-if="$slots.reviews && reviewsOpen"
          class="mt-4 border-t border-base-300 pt-3"
        >
          <slot name="reviews" />
        </div>
      </template>
    </div>

    <!--
      Actions last, and only out of edit mode: while a form is open the buttons
      that would navigate away from it are a trap.
    -->
    <footer
      v-if="!editing && (canEdit || canInteract || canReview || $slots.actions)"
      class="flex shrink-0 items-center justify-end gap-2 border-t border-base-300 bg-base-200/60 p-3"
    >
      <!--
        MODEL-SPECIFIC ACTIONS FIRST. Silas, 2026-08-09: "the buttons that are
        currently on the gallery card before clicking need to be moved to the
        bottom row of the selected back". What those buttons ARE is per-object
        -- a Resource joins an art build, a Bot does not -- so they arrive
        through a slot for the same reason `#details` does, and this file still
        names nothing model-specific.
      -->
      <slot name="actions" />

      <button
        v-if="canReview && $slots.reviews"
        type="button"
        class="btn btn-sm rounded-xl"
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
import { computed, ref, watch } from 'vue'
import { resolveEntityArtwork, type ArtImageSrcLike } from '@/utils/artImageSrc'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    description?: string
    /**
     * The record itself, so the back can fall back through the SAME art chain
     * the front already uses.
     *
     * Silas, 2026-08-10: "only about half the bots are showing images when
     * selecting ... as long as one exists (and it does because we clicked on it
     * to select) we have something to show."
     *
     * Exactly right, and the asymmetry was the bug. The front renders through
     * kr-art-plate with `:source="record"`, which resolves imagePath, cardPath,
     * heroPath and iconPath; every gallery then handed this component ONE field
     * (`avatarImage` for Bots, `imagePath` for the other five). A Bot with a
     * cardPath and no avatarImage therefore had art on the tile and a blank
     * plate on the back. resolveEntityArtwork walks the same order the front
     * does, so the back can no longer show less than the front did.
     */
    source?: ArtImageSrcLike | null
    /** Explicit first choice, tried before `source`'s chain. */
    artSrc?: string
    badges?: string[]
    canEdit?: boolean
    canInteract?: boolean
    /**
     * Whether this record accepts reviews. Hosts pass the record's
     * `allowReviews`; an owner who turned reviews off loses the button, and the
     * API refuses the write too, so the gate is no longer decorative.
     */
    canReview?: boolean
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

/*
 * Uncontrolled unless the host binds it. defineModel keeps local state when
 * nothing is passed, so a gallery that does not care about edit mode writes
 * nothing, and one that does (to block a close mid-edit, say) can bind
 * v-model:editing and see it.
 */
const editing = defineModel<boolean>('editing', { default: false })

/*
 * Local, and closed by default. The panel opens on request rather than sitting
 * open under every card: on a Facet with forty reviews it would otherwise push
 * the action row off the bottom of the flip.
 */
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
