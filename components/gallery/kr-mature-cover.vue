<!-- /components/gallery/kr-mature-cover.vue -->
<!--
  A curtain over a mature object card, with an uncover for its owner.

  Silas, 2026-09-18, choosing this over dropping the row: "in the case of mature
  objects I own, it's better to carve them out on the listing, it's more likely
  that I want them hidden for situational propriety, not gone for good."

  So the server keeps delivering YOUR mature rows when your maturity toggle is
  off (buildArtImageWhere and visibilityWhere both carve out own rows) and this
  covers them. Other people's mature content never arrives, so there is nothing
  here to uncover and no affordance implying otherwise.

  IT COVERS THE WHOLE CARD, not the picture. Silas, 2026-09-18: "the maturity
  toggle should cover the entire object card, including title and prompt." A
  blurred image above a legible title and prompt is not covered, and the same
  reasoning he gave for the API applies to a shared screen: an object someone
  should not be seeing should not announce itself in text either.

  The uncover is LOCAL and one card at a time. It never touches the account
  setting -- that is what the maturity toggle is for -- so the curtain falls
  again on the next load, which is the right default for the case this exists
  for: people are over.

  The queue card grew this pattern first (canShowJobContent / revealMatureJob);
  this is that idea as one component so every object card agrees.
-->
<template>
  <div class="relative">
    <!-- The card itself is always rendered: it keeps its own layout, and the
         cover sits over it rather than replacing it with a different shape. -->
    <div :class="covered ? 'pointer-events-none select-none blur-lg' : ''">
      <slot />
    </div>

    <div
      v-if="covered"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-warning/40 bg-base-100/90 p-3 text-center backdrop-blur-sm"
    >
      <Icon name="kind-icon:eye-off" class="kr-icon-6 text-warning" />
      <p class="kr-text-bold-sm">Mature — hidden</p>
      <p class="kr-text-dim-xs-60 max-w-[22ch]">{{ message }}</p>

      <button
        v-if="canReveal"
        type="button"
        class="kr-btn-outline-plain rounded-2xl"
        :aria-label="`Uncover ${label}`"
        @click.stop.prevent="revealed = true"
      >
        <Icon name="kind-icon:eye" class="kr-icon-4" />
        Uncover
      </button>
    </div>

    <button
      v-if="!covered && isMature && canReveal"
      type="button"
      class="absolute right-2 top-2 z-10 btn btn-ghost btn-xs rounded-xl border border-warning/50 bg-base-100/80"
      :aria-label="`Cover ${label}`"
      title="Hide this again"
      @click.stop.prevent="revealed = false"
    >
      <Icon name="kind-icon:eye-off" class="kr-icon-3-5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    /** The row's own flag. */
    isMature?: boolean | null
    /** The row's owner, so the uncover is offered to them and nobody else. */
    ownerId?: number | null
    /** Named in the aria-labels, e.g. "Fantasy_art_XL_V1". */
    label?: string
  }>(),
  { isMature: false, ownerId: null, label: 'this object' },
)

const userStore = useUserStore()
const revealed = ref(false)

// A new row in the same slot starts covered again.
watch(
  () => [props.ownerId, props.label] as const,
  () => {
    revealed.value = false
  },
)

const isOwner = computed<boolean>(() => {
  const viewerId = userStore.userId
  return typeof viewerId === 'number' && props.ownerId === viewerId
})

const covered = computed<boolean>(
  () => Boolean(props.isMature) && !userStore.showMature && !revealed.value,
)

/*
 * Offered to the owner only, and never to a maturity-restricted account -- for
 * whom this is not a preference but a restriction, and for whom the server will
 * refuse the content regardless. A cover with a button that cannot work is
 * worse than a cover.
 */
const canReveal = computed<boolean>(
  () => isOwner.value && !userStore.isMaturityRestricted,
)

const message = computed<string>(() => {
  if (userStore.isMaturityRestricted) {
    return 'Mature content is unavailable for this account.'
  }
  return canReveal.value
    ? 'Yours, hidden while mature content is off.'
    : 'Mature content is turned off.'
})
</script>
