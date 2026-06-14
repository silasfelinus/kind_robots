<!-- /components/tutorial-page.vue -->
<!--
  Single tutorial component. Pass a `channel` (a FooterKey) and it renders that
  channel's overview + one section per tab, pulling everything from
  tutorialCards. Visibility and the "don't show again" preference live in
  tutorialStore, so this component reads state rather than owning it.

  Usage:
    <tutorial-page channel="character" />

  By default it acts as a modal driven by tutorialStore.activeChannel. Set
  :auto-open="true" to have it offer itself on first visit (respecting the
  user's dismissal), or :inline="true" to render in-flow without the overlay.
-->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTutorialStore } from '~/stores/tutorialStore'
import {
  getTutorialChannel,
  getTutorialHero,
  isTutorialChannelKey,
  type TutorialChannelKey,
} from '~/stores/helpers/tutorialCards'

const props = withDefaults(
  defineProps<{
    channel: TutorialChannelKey | string
    // Offer the tutorial automatically on mount if not dismissed.
    autoOpen?: boolean
    // Render in-flow instead of as an overlay modal.
    inline?: boolean
  }>(),
  {
    autoOpen: false,
    inline: false,
  },
)

const tutorialStore = useTutorialStore()

const channelKey = computed<TutorialChannelKey | null>(() =>
  isTutorialChannelKey(props.channel) ? props.channel : null,
)

const config = computed(() =>
  channelKey.value ? getTutorialChannel(channelKey.value) : null,
)

const heroImage = computed(() =>
  channelKey.value ? getTutorialHero(channelKey.value) : null,
)

// In inline mode we always show. As a modal, we show when this channel is the
// store's active channel.
const visible = computed(() => {
  if (!channelKey.value) return false
  if (props.inline) return true
  return tutorialStore.activeChannel === channelKey.value
})

// Bound to the "Show this tutorial next time" checkbox. Inverted from the
// store's internal "show" flag for nicer UI phrasing.
const showNextTime = computed({
  get: () =>
    channelKey.value ? tutorialStore.shouldAutoShow(channelKey.value) : true,
  set: (value: boolean) => {
    if (channelKey.value) {
      tutorialStore.setShowForChannel(channelKey.value, value)
    }
  },
})

function close() {
  tutorialStore.close()
}

onMounted(() => {
  if (props.autoOpen && channelKey.value) {
    tutorialStore.maybeAutoOpen(channelKey.value)
  }
})
</script>

<template>
  <div
    v-if="visible && config"
    :class="
      inline
        ? 'tutorial-inline'
        : 'fixed inset-0 z-50 flex items-center justify-center p-4'
    "
  >
    <!-- Backdrop (modal only) -->
    <div
      v-if="!inline"
      class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"
      @click="close"
    />

    <section
      class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl"
      role="dialog"
      aria-modal="true"
      :aria-label="`${config.title} tutorial`"
    >
      <!-- Hero header: illustrative title art with the channel name overlaid -->
      <header class="relative shrink-0">
        <div class="relative aspect-16/6 w-full overflow-hidden bg-base-200">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="`${config.title} tutorial`"
            class="h-full w-full object-cover"
          />
          <!-- Legibility gradient under the title -->
          <div
            class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/30 to-transparent"
          />
          <div class="absolute inset-x-0 bottom-0 px-6 pb-4">
            <h2 class="text-2xl font-bold text-base-content drop-shadow-sm">
              {{ config.title }}
            </h2>
            <p
              v-if="config.tagline"
              class="mt-1 text-sm italic text-base-content/80 drop-shadow-sm"
            >
              {{ config.tagline }}
            </p>
          </div>
        </div>

        <button
          v-if="!inline"
          type="button"
          class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 bg-base-100/70 backdrop-blur-sm"
          aria-label="Close tutorial"
          @click="close"
        >
          ✕
        </button>
      </header>

      <!-- Scrollable body -->
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <!-- Overview -->
        <p class="text-base leading-relaxed text-base-content/90">
          {{ config.overview }}
        </p>

        <!-- Creator-earnings callout (monetizable channels only) -->
        <div
          v-if="config.earnings"
          class="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3"
        >
          <span class="text-lg leading-none" aria-hidden="true">✦</span>
          <p class="text-sm leading-relaxed text-base-content/90">
            {{ config.earnings }}
          </p>
        </div>

        <!-- Sections: one per tab, each with a single screenshot -->
        <ol class="mt-6 space-y-6">
          <li
            v-for="(section, index) in config.sections"
            :key="section.key"
            class="rounded-xl border border-base-200 bg-base-200/40 p-4"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
              >
                {{ index + 1 }}
              </span>
              <h3 class="text-base font-semibold text-base-content">
                {{ section.title }}
              </h3>
              <span
                v-if="section.underConstruction"
                class="badge badge-warning badge-sm gap-1"
              >
                Under construction
              </span>
            </div>

            <p class="mt-2 text-sm leading-relaxed text-base-content/80">
              {{ section.body }}
            </p>

            <figure
              class="mt-3 overflow-hidden rounded-lg border border-base-300"
            >
              <img
                :src="section.image"
                :alt="`${section.title} screenshot`"
                loading="lazy"
                class="w-full object-cover"
                :class="{ 'opacity-60 grayscale': section.underConstruction }"
              />
            </figure>
          </li>
        </ol>
      </div>

      <!-- Footer: dismissal preference + close -->
      <footer
        class="shrink-0 flex items-center justify-between gap-4 border-t border-base-200 px-6 py-4"
      >
        <label class="flex cursor-pointer items-center gap-2 text-sm">
          <input
            v-model="showNextTime"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          <span class="text-base-content/80">Show this tutorial next time</span>
        </label>

        <button
          v-if="!inline"
          type="button"
          class="btn btn-primary btn-sm"
          @click="close"
        >
          Got it
        </button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.tutorial-inline {
  width: 100%;
}
</style>
