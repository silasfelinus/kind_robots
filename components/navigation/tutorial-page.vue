<!-- /components/navigation/tutorial-page.vue -->
<template>
  <div
    v-if="visible && config"
    :class="
      inline
        ? 'tutorial-inline'
        : 'fixed inset-0 z-50 flex items-center justify-center p-4'
    "
  >
    <div
      v-if="!inline"
      class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"
      @click="close"
    />

    <section
      class="relative flex w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl"
      :class="inline ? '' : 'max-h-[90vh] max-w-2xl'"
      :role="inline ? undefined : 'dialog'"
      :aria-modal="inline ? undefined : true"
      :aria-label="`${config.title} tutorial`"
    >
      <header class="relative shrink-0">
        <div class="relative aspect-16/6 w-full overflow-hidden bg-base-200">
          <img
            v-if="heroImage"
            :src="heroImage"
            :alt="`${config.title} tutorial`"
            class="h-full w-full object-cover"
          />

          <div
            class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/30 to-transparent"
          />

          <div class="absolute inset-x-0 bottom-0 px-5 pb-4 sm:px-6">
            <p
              class="mb-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-base-100/80 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary shadow-sm backdrop-blur"
            >
              <Icon name="kind-icon:info" class="h-3.5 w-3.5" />
              Tutorial
            </p>

            <h2 class="text-2xl font-black text-base-content drop-shadow-sm">
              {{ config.title }}
            </h2>

            <p
              v-if="config.tagline"
              class="mt-1 text-sm font-semibold italic text-base-content/80 drop-shadow-sm"
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

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        <p class="text-base font-semibold leading-relaxed text-base-content/80">
          {{ config.overview }}
        </p>

        <div
          v-if="config.earnings"
          class="mt-4 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3"
        >
          <span class="text-lg leading-none text-success" aria-hidden="true">
            ✦
          </span>

          <p class="text-sm font-semibold leading-relaxed text-base-content/85">
            {{ config.earnings }}
          </p>
        </div>

        <ol class="mt-6 space-y-4">
          <li
            v-for="(section, index) in config.sections"
            :key="section.key"
            class="overflow-hidden rounded-2xl border border-base-300 bg-base-200/40"
          >
            <div class="flex items-start gap-3 p-4">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary"
              >
                {{ index + 1 }}
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-base font-black text-base-content">
                    {{ section.title }}
                  </h3>

                  <span
                    v-if="section.underConstruction"
                    class="badge badge-warning badge-sm gap-1"
                  >
                    Under construction
                  </span>
                </div>

                <p
                  class="mt-2 text-sm font-semibold leading-relaxed text-base-content/75"
                >
                  {{ section.body }}
                </p>
              </div>
            </div>

            <figure
              v-if="section.image"
              class="border-t border-base-300 bg-base-300"
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

      <footer
        v-if="!inline"
        class="flex shrink-0 items-center justify-between gap-4 border-t border-base-200 px-6 py-4"
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
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="close"
        >
          Got it
        </button>
      </footer>
    </section>
  </div>
</template>

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
    autoOpen?: boolean
    inline?: boolean
  }>(),
  {
    autoOpen: false,
    inline: false,
  },
)

const tutorialStore = useTutorialStore()

const channelKey = computed<TutorialChannelKey | null>(() => {
  return isTutorialChannelKey(props.channel) ? props.channel : null
})

const config = computed(() => {
  return channelKey.value ? getTutorialChannel(channelKey.value) : null
})

const heroImage = computed(() => {
  return channelKey.value ? getTutorialHero(channelKey.value) : null
})

const visible = computed(() => {
  if (!channelKey.value) return false
  if (props.inline) return true

  return tutorialStore.activeChannel === channelKey.value
})

const showNextTime = computed({
  get: () => {
    return channelKey.value
      ? tutorialStore.shouldAutoShow(channelKey.value)
      : true
  },
  set: (value: boolean) => {
    if (channelKey.value) {
      tutorialStore.setShowForChannel(channelKey.value, value)
    }
  },
})

function close(): void {
  tutorialStore.close()
}

onMounted(() => {
  if (!props.inline && props.autoOpen && channelKey.value) {
    tutorialStore.maybeAutoOpen(channelKey.value)
  }
})
</script>

<style scoped>
.tutorial-inline {
  width: 100%;
}
</style>
