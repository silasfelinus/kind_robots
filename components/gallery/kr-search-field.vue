<!-- /components/gallery/kr-search-field.vue -->
<!--
  A SEARCH ICON THAT BECOMES AN INPUT, and only when you ask it to.

  Silas, 2026-08-10, with screenshots of /stories and /facets: "Search inputs
  are full-width text bars (see /stories 'Search scenarios...', /facets 'Search
  title, alias...'). Make them an ICON that expands to an input only when
  selected."

  He is describing a cost, not a style preference. A gallery toolbar is one row
  shared by the mode buttons, the filters and the pager, and a `flex-1` input
  takes every pixel the others do not claim -- on a phone that is most of the
  row, so the controls next to it wrap to a second line and the toolbar spends
  two rows on a field nobody has typed in yet. Collapsed, this is 2rem; the row
  fits, and the field is one tap away.

  WHAT IT DOES NOT DO: clear your query behind your back.

  The obvious implementation collapses on blur, which quietly hides the reason
  the grid is showing four items instead of four hundred -- an invisible filter
  is a bug report waiting to happen. So:

    - blur with an empty query   -> collapse (nothing to lose)
    - blur with a live query     -> STAY OPEN, because the text on screen is the
                                    explanation for what the grid is doing
    - Escape                     -> collapse, query intact
    - the ✕ inside the field     -> clear AND collapse, which is the one path
                                    that is allowed to drop the query, because
                                    it is the one the user asked for

  A collapsed field with a live query cannot happen by accident, but it can
  happen by Escape, so the trigger renders `btn-primary` with a dot in that
  state rather than looking like an untouched control.

  WHERE THE RECIPE COMES FROM
  ---------------------------
  dream-gallery.vue already did this, and Silas already signed it off -- "Search
  should be an icon", 2026-08-07, after a permanently-open input pushed its type
  filter toward a wrap on a 1366x768 laptop. What it did not have was a way to
  be reused, so /stories and /facets kept their full-width bars and the site
  showed two different search controls depending on which gallery you were in.
  This is that component's behaviour, extracted, with Escape, a clear control
  and the collapsed-but-filtering indicator added; dream-gallery now renders
  this rather than its own copy.

  Controlled, like every other primitive in this folder: the parent owns the
  query (`v-model`), this owns nothing but whether the box is showing. That is
  what lets a gallery keep its own debounce, URL sync, or store binding.
-->
<template>
  <div
    class="kr-search-field flex min-w-0 items-center"
    :class="expanded ? 'flex-1' : 'shrink-0'"
  >
    <button
      v-if="!expanded"
      type="button"
      class="btn btn-sm btn-square relative rounded-xl"
      :class="modelValue ? 'btn-primary' : 'btn-ghost'"
      :aria-label="expandLabel"
      :title="expandLabel"
      :aria-expanded="false"
      @click="expand"
    >
      <Icon name="kind-icon:search" class="h-4 w-4" />

      <!-- A filter you cannot see is the failure mode this whole component has
           to avoid; the dot is the collapsed state admitting it is doing
           something. -->
      <span
        v-if="modelValue"
        class="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-base-100"
        aria-hidden="true"
      />
    </button>

    <!--
      A <div>, though daisyUI's documented wrapper for this is a <label>, and
      the galleries this replaces all used one. A <label> wrapping BOTH the
      input and the ✕ makes a click on ✕ also a click on the label, which
      refocuses the input -- so clearing would fight its own collapse. The input
      is named by `aria-label` rather than by wrapping, so nothing is lost.
    -->
    <div
      v-else
      class="input input-bordered input-sm flex w-full min-w-0 items-center gap-2 rounded-xl bg-base-200"
    >
      <Icon name="kind-icon:search" class="h-4 w-4 shrink-0 opacity-50" />

      <input
        ref="inputEl"
        :value="modelValue"
        type="search"
        :aria-label="label"
        :placeholder="placeholder"
        class="min-w-0 grow bg-transparent"
        @input="onInput"
        @keydown.esc.prevent="collapse"
        @blur="onBlur"
      />

      <button
        type="button"
        class="btn btn-ghost btn-xs btn-square shrink-0 rounded-lg"
        :aria-label="modelValue ? 'Clear search' : 'Close search'"
        :title="modelValue ? 'Clear search' : 'Close search'"
        @click="clearAndCollapse"
      >
        <Icon name="kind-icon:close" class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Placeholder shown once the field is open. */
    placeholder?: string
    /** Accessible name for the input, e.g. "Search scenarios". */
    label?: string
  }>(),
  {
    placeholder: 'Search…',
    label: 'Search',
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

/*
 * Open on arrival when the parent already has a query.
 *
 * A gallery can restore its search from the URL or a store, and starting
 * collapsed in that case would show a filtered grid with no visible cause --
 * the same invisible-filter problem the blur rule above exists to prevent, just
 * arriving by a different door.
 */
const expanded = ref(Boolean(props.modelValue))
const inputEl = ref<HTMLInputElement | null>(null)

/*
 * The collapsed trigger says whether it is currently filtering, not just what
 * it opens. The dot beside it is `aria-hidden`, so without this a screen reader
 * gets "Search scenarios" whether or not a query is quietly cutting the grid
 * down -- exactly the invisible-filter problem the visual indicator exists to
 * solve, just for the users who cannot see it.
 */
const expandLabel = computed(() =>
  props.modelValue
    ? `${props.label} (filtering by "${props.modelValue}")`
    : props.label,
)

async function expand(): Promise<void> {
  expanded.value = true

  // The input does not exist until the v-if flips, so the focus has to wait for
  // the render that creates it.
  await nextTick()
  inputEl.value?.focus()
}

function collapse(): void {
  expanded.value = false
}

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function onBlur(): void {
  if (props.modelValue) return

  collapse()
}

function clearAndCollapse(): void {
  emit('update:modelValue', '')
  collapse()
}
</script>
