<!-- /components/navigation/tutorial-flyer.vue -->
<template>
  <!-- Inline: lightweight, single-column on sm, image+text two-up on lg/xl -->
  <div v-if="inline && config" class="flex flex-col gap-4">
    <!-- Lead image -->
    <img
      v-if="heroImage"
      :src="heroImage"
      :alt="`${config.title} tutorial`"
      loading="lazy"
      class="w-full rounded-2xl object-cover shadow-sm md:max-h-72 lg:max-h-80"
    />

    <!-- Overview text -->
    <div class="flex flex-col gap-3">
      <p
        class="text-sm font-medium leading-relaxed text-base-content/80 md:text-base"
      >
        {{ config.overview }}
      </p>

      <div
        v-if="config.earnings"
        class="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5"
      >
        <span class="mt-0.5 leading-none text-success" aria-hidden="true">
          ✦
        </span>
        <p
          class="text-sm font-semibold leading-relaxed text-success-content/90"
        >
          {{ config.earnings }}
        </p>
      </div>
    </div>

    <!-- Sections: image then text, side-by-side only on lg+ -->
    <section
      v-for="section in config.sections"
      :key="section.key"
      class="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5"
    >
      <img
        v-if="section.image"
        :src="section.image"
        :alt="`${section.title} tutorial illustration`"
        loading="lazy"
        class="w-full rounded-xl object-cover shadow-sm md:max-h-56 lg:max-h-none lg:w-2/5 lg:shrink-0"
        :class="{ 'opacity-50 grayscale': section.underConstruction }"
      />

      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <h3
            class="text-base font-black leading-tight text-base-content md:text-lg"
          >
            {{ section.title }}
          </h3>

          <span
            v-if="section.underConstruction"
            class="badge badge-warning badge-sm gap-1 rounded-lg font-semibold"
          >
            <Icon name="kind-icon:wrench" class="h-3 w-3" />
            Coming soon
          </span>
        </div>

        <p
          class="text-sm font-medium leading-relaxed text-base-content/70 md:text-base"
        >
          {{ section.body }}
        </p>
      </div>
    </section>
  </div>

  <!-- Modal: unchanged full-flyer experience -->
  <Transition v-else name="tutorial-fade">
    <div
      v-if="visible && config"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        class="absolute inset-0 bg-base-300/60 backdrop-blur-md"
        @click="close"
      />

      <article
        class="tutorial-flyer relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-base-300/70 bg-base-100 shadow-2xl ring-1 ring-base-content/5"
        role="dialog"
        :aria-modal="true"
        :aria-label="`${config.title} tutorial`"
      >
        <!-- Hero band -->
        <header
          class="relative shrink-0 overflow-hidden border-b border-base-300/60 bg-linear-to-br from-primary/10 via-base-200/50 to-secondary/10 px-5 pb-5 pt-6 sm:px-7 sm:pt-7"
        >
          <div
            class="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-secondary/10 blur-2xl"
            aria-hidden="true"
          />

          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10 bg-base-100/70 shadow-sm backdrop-blur transition hover:rotate-90 hover:bg-base-100"
            aria-label="Close tutorial"
            @click="close"
          >
            ✕
          </button>

          <div class="relative flex items-start gap-4">
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/25 bg-base-100/80 shadow-md ring-1 ring-primary/10 sm:h-16 sm:w-16"
            >
              <img
                v-if="heroImage"
                :src="heroImage"
                :alt="`${config.title} tutorial`"
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <Icon v-else name="kind-icon:info" class="h-7 w-7 text-primary" />
            </div>

            <div class="min-w-0 flex-1 pr-8">
              <p
                class="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-base-100/70 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur"
              >
                <Icon name="kind-icon:info" class="h-3 w-3" />
                Tutorial
              </p>

              <h2
                class="mt-2.5 text-2xl font-black leading-[1.1] tracking-tight text-base-content sm:text-3xl"
              >
                {{ config.title }}
              </h2>

              <p
                v-if="config.tagline"
                class="mt-1.5 text-sm font-semibold italic leading-relaxed text-base-content/55"
              >
                {{ config.tagline }}
              </p>
            </div>
          </div>

          <!-- Step progress -->
          <div
            v-if="stepCount > 1"
            class="relative mt-5 flex items-center gap-2"
            aria-hidden="true"
          >
            <span
              v-for="n in stepCount"
              :key="n"
              class="h-1.5 flex-1 rounded-full bg-primary/20"
            />
            <span
              class="ml-1 shrink-0 text-[0.65rem] font-bold uppercase tracking-widest text-base-content/40"
            >
              {{ stepCount }} steps
            </span>
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <!-- Overview -->
          <section
            class="rounded-2xl border border-base-300/60 bg-base-200/50 p-4 sm:p-5"
          >
            <p
              class="text-sm font-medium leading-relaxed text-base-content/80 sm:text-[0.95rem]"
            >
              {{ config.overview }}
            </p>

            <div
              v-if="config.earnings"
              class="mt-3.5 flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5"
            >
              <span
                class="mt-0.5 text-sm leading-none text-success"
                aria-hidden="true"
              >
                ✦
              </span>
              <p
                class="text-sm font-semibold leading-relaxed text-success-content/90"
              >
                {{ config.earnings }}
              </p>
            </div>
          </section>

          <!-- Steps -->
          <ol class="mt-5 space-y-3">
            <li
              v-for="(section, index) in config.sections"
              :key="section.key"
              class="group relative overflow-hidden rounded-2xl border border-base-300/60 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div class="flex items-start gap-3.5 p-4 sm:p-5">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-content shadow-sm ring-2 ring-primary/15 transition group-hover:scale-105"
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
                      class="badge badge-warning badge-sm gap-1 rounded-lg font-semibold"
                    >
                      <Icon name="kind-icon:wrench" class="h-3 w-3" />
                      Coming soon
                    </span>
                  </div>

                  <p
                    class="mt-1.5 text-sm font-medium leading-relaxed text-base-content/70"
                  >
                    {{ section.body }}
                  </p>
                </div>
              </div>

              <figure
                v-if="section.image"
                class="border-t border-base-300/60 bg-base-200/40 p-2.5"
              >
                <img
                  :src="section.image"
                  :alt="`${section.title} tutorial illustration`"
                  loading="lazy"
                  class="max-h-56 w-full rounded-xl object-cover shadow-sm"
                  :class="{ 'opacity-50 grayscale': section.underConstruction }"
                />
              </figure>
            </li>
          </ol>
        </div>

        <footer
          class="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-base-300/60 bg-base-200/40 px-5 py-4 sm:px-7"
        >
          <label
            class="flex cursor-pointer select-none items-center gap-2.5 text-sm"
          >
            <input
              v-model="showNextTime"
              type="checkbox"
              class="checkbox checkbox-sm checkbox-primary"
            />
            <span class="font-medium text-base-content/70">
              Show this next time
            </span>
          </label>

          <button
            type="button"
            class="btn btn-primary btn-sm gap-1.5 rounded-xl px-5 font-bold shadow-sm"
            @click="close"
          >
            Got it
            <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
          </button>
        </footer>
      </article>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, watch } from 'vue'
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

const stepCount = computed(() => config.value?.sections?.length ?? 0)

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

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && visible.value && !props.inline) {
    close()
  }
}

// Lock body scroll while the modal flyer is open.
watch(
  () => visible.value && !props.inline,
  (isModalOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isModalOpen ? 'hidden' : ''
  },
)

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
  }
  if (!props.inline && props.autoOpen && channelKey.value) {
    tutorialStore.maybeAutoOpen(channelKey.value)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', onKeydown)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
/* Open/close transition for the modal layer */
.tutorial-fade-enter-active,
.tutorial-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tutorial-fade-enter-active .tutorial-flyer,
.tutorial-fade-leave-active .tutorial-flyer {
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.tutorial-fade-enter-from,
.tutorial-fade-leave-to {
  opacity: 0;
}

.tutorial-fade-enter-from .tutorial-flyer,
.tutorial-fade-leave-to .tutorial-flyer {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tutorial-fade-enter-active,
  .tutorial-fade-leave-active,
  .tutorial-fade-enter-active .tutorial-flyer,
  .tutorial-fade-leave-active .tutorial-flyer {
    transition: none;
  }
}
</style>
