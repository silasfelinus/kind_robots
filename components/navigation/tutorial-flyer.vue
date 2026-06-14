<!-- /components/navigation/tutorial-flyer.vue -->
<template>
  <div
    v-if="visible && config"
    :class="
      inline
        ? 'tutorial-flyer-inline'
        : 'fixed inset-0 z-50 flex items-center justify-center p-4'
    "
  >
    <div
      v-if="!inline"
      class="absolute inset-0 bg-base-300/70 backdrop-blur-sm"
      @click="close"
    />

    <article
      class="tutorial-flyer relative flex w-full flex-col overflow-hidden rounded-2xl border border-base-300/80 bg-base-100 shadow-xl"
      :class="inline ? '' : 'max-h-[90vh] max-w-2xl'"
      :role="inline ? undefined : 'dialog'"
      :aria-modal="inline ? undefined : true"
      :aria-label="`${config.title} tutorial`"
    >
      <button
        v-if="!inline"
        type="button"
        class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 bg-base-100/80 shadow-sm backdrop-blur"
        aria-label="Close tutorial"
        @click="close"
      >
        ✕
      </button>

      <div class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <header class="flex items-start gap-3">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-sm"
          >
            <img
              v-if="heroImage"
              :src="heroImage"
              :alt="`${config.title} tutorial`"
              loading="lazy"
              class="h-full w-full object-cover"
            />

            <Icon
              v-else
              name="kind-icon:info"
              class="h-6 w-6 text-primary/70"
            />
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-primary"
            >
              <Icon name="kind-icon:info" class="h-3.5 w-3.5" />
              Tutorial flyer
            </p>

            <h2
              class="mt-2 text-xl font-black leading-tight tracking-tight text-base-content sm:text-2xl"
            >
              {{ config.title }}
            </h2>

            <p
              v-if="config.tagline"
              class="mt-1 text-sm font-bold italic leading-relaxed text-base-content/60"
            >
              {{ config.tagline }}
            </p>
          </div>
        </header>

        <section
          class="mt-4 rounded-2xl border border-base-300/70 bg-base-200/60 p-4"
        >
          <p class="text-sm font-semibold leading-relaxed text-base-content/75">
            {{ config.overview }}
          </p>

          <div
            v-if="config.earnings"
            class="mt-3 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 px-3 py-2.5"
          >
            <span
              class="text-base leading-none text-success"
              aria-hidden="true"
            >
              ✦
            </span>

            <p
              class="text-sm font-semibold leading-relaxed text-base-content/80"
            >
              {{ config.earnings }}
            </p>
          </div>
        </section>

        <ol class="mt-4 space-y-3">
          <li
            v-for="(section, index) in config.sections"
            :key="section.key"
            class="group overflow-hidden rounded-2xl border border-base-300/70 bg-base-100/80 shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-base-100"
          >
            <div class="flex items-start gap-3 p-3.5 sm:p-4">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-xs font-black text-primary"
              >
                {{ index + 1 }}
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3
                    class="text-base font-black leading-tight text-base-content"
                  >
                    {{ section.title }}
                  </h3>

                  <span
                    v-if="section.underConstruction"
                    class="badge badge-warning badge-sm gap-1 rounded-xl"
                  >
                    Under construction
                  </span>
                </div>

                <p
                  class="mt-1.5 text-sm font-semibold leading-relaxed text-base-content/65"
                >
                  {{ section.body }}
                </p>
              </div>
            </div>

            <figure
              v-if="section.image"
              class="border-t border-base-300/70 bg-base-300/70 p-2"
            >
              <img
                :src="section.image"
                :alt="`${section.title} tutorial image`"
                loading="lazy"
                class="max-h-52 w-full rounded-xl object-cover"
                :class="{ 'opacity-60 grayscale': section.underConstruction }"
              />
            </figure>
          </li>
        </ol>
      </div>

      <footer
        v-if="!inline"
        class="flex shrink-0 items-center justify-between gap-4 border-t border-base-200 px-5 py-4"
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
    </article>
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
.tutorial-flyer-inline {
  width: 100%;
  padding-left: 0.75rem;
}

.tutorial-flyer-inline .tutorial-flyer {
  border-left-width: 4px;
}
</style>
