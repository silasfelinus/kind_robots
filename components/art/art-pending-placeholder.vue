<!-- /components/art/art-pending-placeholder.vue -->
<!--
  ONE shared visual for a card with no art to show right now
  (interface-vision/t-138).

  The problem this exists for: a card whose art was detected missing and
  queued through the /api/conductor/art-request fallback must not look like
  the same thing as a card whose art is genuinely broken. Silas hit this
  directly -- a queued-but-not-yet-rendered image and a broken one read
  identically, and he guessed the art server was down when the art was
  simply queued.

  Three states, in the order they should read as more concerning:
    pending  -- art has been queued (stores/artRequestStore.ts, usually via
               plugins/missing-image-reporter.client.ts) and is on its way.
               Calm: a soft icon and quiet copy, not an error.
    failed   -- an <img> was attempted here and its load genuinely errored,
               and nothing is known to have queued replacement art for it.
               This is the only state that reads as a problem.
    (none)   -- no art was ever attempted -- the entity simply has none yet.
               Renders the caller's own placeholder icon/label unchanged, so
               every existing "no art" fallback keeps its current voice.

  `pending` wins over `failed`: a src that just failed to load but is now
  known to be queued should read as "coming", not sit on "broken".
-->
<template>
  <span
    class="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center text-base-content/40"
  >
    <Icon :name="displayIcon" :class="iconClass" aria-hidden="true" />
    <span
      v-if="displayLabel"
      class="uppercase tracking-wide"
      :class="labelClass"
    >
      {{ displayLabel }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Art was queued through the art-request fallback; not yet rendered. */
    pending?: boolean
    /** An <img> was attempted here and genuinely failed to load. */
    failed?: boolean
    /** Icon/label shown when neither pending nor failed -- no art at all. */
    icon?: string
    label?: string
    size?: 'sm' | 'md'
  }>(),
  {
    pending: false,
    failed: false,
    icon: 'kind-icon:image',
    label: '',
    size: 'md',
  },
)

const displayIcon = computed(() => {
  if (props.pending) return 'kind-icon:sparkles'
  if (props.failed) return 'kind-icon:warning'
  return props.icon || 'kind-icon:image'
})

const displayLabel = computed(() => {
  if (props.pending) return 'Art is on its way'
  if (props.failed) return "Couldn't load"
  return props.label
})

const iconClass = computed(() =>
  props.size === 'sm' ? 'kr-icon-5' : 'kr-icon-8',
)

const labelClass = computed(() => {
  const textSize = props.size === 'sm' ? 'text-[9px]' : 'text-[10px]'
  if (props.failed) return `${textSize} text-error/70`
  if (props.pending) return `${textSize} text-base-content/50 animate-pulse`
  return `${textSize} text-base-content/40`
})
</script>
