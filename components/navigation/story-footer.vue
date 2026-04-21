<!-- /components/navigation/story-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-2 py-2"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
        >
          <icon name="kind-icon:story" class="h-6 w-6" />
        </div>

        <div class="flex min-w-0 flex-col gap-1">
          <div class="truncate text-sm font-semibold">
            {{ sectionLabel }}
          </div>

          <div v-if="isCreateSection" class="min-h-0">
            <textarea
              ref="storyMeasureRef"
              v-model="storyPrompt"
              class="textarea textarea-bordered h-16 min-h-0 w-full resize-none overflow-y-auto bg-base-100 px-3 py-2 text-sm leading-snug"
              placeholder="Start your story idea..."
            />
          </div>

          <div
            v-else
            class="truncate rounded-xl border border-base-300 bg-base-200 px-3 py-2 text-sm text-base-content/70"
          >
            {{ sectionDescription }}
          </div>
        </div>

        <div class="flex h-full flex-col items-end justify-between gap-2">
          <button class="btn btn-xs btn-ghost" @click="cycleSection">
            Next
          </button>

          <button
            class="btn btn-sm btn-primary text-white"
            :disabled="isCreateSection && !storyPrompt.trim()"
            @click="openStoryMode"
          >
            Open
          </button>
        </div>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[1.25fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">📖 Story Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            @click="openStoryMode"
          >
            Open Story
          </button>
        </div>

        <div class="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="link in links"
              :key="link.name"
              class="btn btn-sm"
              :class="
                activeSection === link.name
                  ? 'btn-primary text-white'
                  : 'btn-outline'
              "
              @click="setActiveSection(link.name)"
            >
              <icon :name="link.icon" class="h-4 w-4" />
              <span>{{ link.label }}</span>
            </button>
          </div>

          <div
            v-if="isCreateSection"
            class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <div class="text-sm font-semibold">Story Intro</div>

              <div class="flex flex-wrap gap-2">
                <button class="btn btn-xs btn-secondary" @click="fillStarter">
                  Starter
                </button>
                <button class="btn btn-xs btn-accent" @click="fillWeirdStarter">
                  Weird
                </button>
                <button class="btn btn-xs btn-warning" @click="resetFooter">
                  Reset
                </button>
              </div>
            </div>

            <div class="flex min-h-0 flex-1 flex-col gap-3">
              <textarea
                ref="storyMeasureRef"
                v-model="storyPrompt"
                class="textarea textarea-bordered h-32 min-h-32 w-full resize-none bg-base-100 text-sm"
                placeholder="Describe the story you want to create..."
              />

              <div
                class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-100 p-3"
              >
                <div
                  class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
                >
                  Ready to build
                </div>

                <div
                  class="min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed"
                >
                  {{ storyPrompt || 'No story intro yet...' }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 text-sm font-semibold">
              {{ sectionLabel }}
            </div>

            <div
              class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3 text-sm text-base-content/80"
            >
              {{ sectionDescription }}
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Story Preview
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Active Section
            </div>
            <div class="mt-1 text-lg font-semibold">
              {{ sectionLabel }}
            </div>
          </div>

          <div
            class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
          >
            <template v-if="isCreateSection">
              {{ storyPrompt || 'Your story idea preview will show up here.' }}
            </template>
            <template v-else>
              {{ sectionDescription }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[1.2fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">📖 Story Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            @click="openStoryMode"
          >
            Open Story
          </button>
        </div>

        <div
          class="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(14rem,18rem)_1fr]"
        >
          <div class="flex min-h-0 flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 text-sm font-semibold">Choose Section</div>

              <div class="flex max-h-48 min-h-0 flex-col gap-2 overflow-y-auto">
                <button
                  v-for="link in links"
                  :key="link.name"
                  class="flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition"
                  :class="
                    activeSection === link.name
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 bg-base-100 hover:bg-base-200'
                  "
                  @click="setActiveSection(link.name)"
                >
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-2xl border border-base-300 bg-base-200"
                  >
                    <icon :name="link.icon" class="h-5 w-5" />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="truncate font-semibold">
                      {{ link.label }}
                    </div>
                    <div class="line-clamp-2 text-xs text-base-content/70">
                      {{ getSectionSummary(link.name) }}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-sm font-semibold">
                {{ sectionLabel }}
              </div>
              <div class="mt-2 text-sm text-base-content/70">
                {{ sectionDescription }}
              </div>
            </div>
          </div>

          <div class="flex min-h-0 flex-col gap-3">
            <div
              v-if="isCreateSection"
              class="rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="text-sm font-semibold">Story Intro</div>

                <div class="flex flex-wrap gap-2">
                  <button class="btn btn-xs btn-secondary" @click="fillStarter">
                    Starter
                  </button>
                  <button
                    class="btn btn-xs btn-accent"
                    @click="fillWeirdStarter"
                  >
                    Weird
                  </button>
                  <button class="btn btn-xs btn-warning" @click="resetFooter">
                    Reset
                  </button>
                </div>
              </div>

              <div class="flex min-h-0 flex-1 flex-col gap-3">
                <textarea
                  ref="storyMeasureRef"
                  v-model="storyPrompt"
                  class="textarea textarea-bordered h-32 min-h-32 w-full resize-none bg-base-100 text-sm"
                  placeholder="Describe the story you want to create..."
                />

                <div
                  class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-100 p-3"
                >
                  <div
                    class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
                  >
                    Story Preview
                  </div>

                  <div
                    class="min-h-0 flex-1 overflow-y-auto text-sm leading-relaxed"
                  >
                    {{ storyPrompt || 'No story intro yet...' }}
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else
              class="flex min-h-0 flex-1 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-2 text-sm font-semibold">
                {{ sectionLabel }}
              </div>

              <div
                class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
              >
                {{ sectionDescription }}
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/70"
            >
              Story mode lives in the story section. This footer is the setup
              deck so you can jump in without wandering around the castle first.
            </div>
          </div>
        </div>
      </div>

      <div class="hidden min-h-0 xl:flex xl:flex-col">
        <div
          class="flex h-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
        >
          <div
            class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
          >
            Story Tools
          </div>

          <div class="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto">
            <button
              v-for="link in links"
              :key="`tool-${link.name}`"
              class="flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
              :class="
                activeSection === link.name
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-200 hover:bg-base-300'
              "
              @click="setActiveSection(link.name)"
            >
              <div
                class="flex h-14 w-14 items-center justify-center rounded-2xl border border-base-300 bg-base-100"
              >
                <icon :name="link.icon" class="h-6 w-6" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="truncate font-semibold">
                  {{ link.label }}
                </div>
                <div class="line-clamp-3 text-xs text-base-content/70">
                  {{ getSectionSummary(link.name) }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/story-footer.vue
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStoryStore } from '@/stores/storyStore'
import { useDisplayStore } from '@/stores/displayStore'

type SectionKey = 'create' | 'credits' | 'about'

const router = useRouter()
const storyStore = useStoryStore()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const links: { name: SectionKey; label: string; icon: string }[] = [
  { name: 'create', label: 'Create Story', icon: 'kind-icon:pencil' },
  { name: 'credits', label: 'Generate Credits', icon: 'kind-icon:generate' },
  { name: 'about', label: 'About', icon: 'kind-icon:info-circle' },
]

const activeSection = computed(() => storyStore.activeSection)

const storyPrompt = computed({
  get: () => storyStore.story.intro || '',
  set: (value: string) => {
    storyStore.setIntro(value)
  },
})

const isCreateSection = computed(() => activeSection.value === 'create')

const sectionLabel = computed(() => {
  const found = links.find((link) => link.name === activeSection.value)
  return found?.label || 'Story'
})

const sectionDescription = computed(() => {
  if (activeSection.value === 'create') {
    return (
      storyPrompt.value ||
      'Start with a title, premise, vibe, or impossible little problem.'
    )
  }

  if (activeSection.value === 'credits') {
    return 'Need more fuel for story generation? Head into credits and stock the cauldron.'
  }

  return 'Story mode is where scenarios, weirdness, and narrative experiments get to wear a cape.'
})

const storyMeasureRef = ref<HTMLTextAreaElement | null>(null)
let storyResizeObserver: ResizeObserver | null = null

function setActiveSection(section: SectionKey) {
  storyStore.setActiveSection(section)
  queuePromptOffsetRefresh()
}

function cycleSection() {
  const currentIndex = links.findIndex(
    (link) => link.name === activeSection.value,
  )
  const safeIndex = currentIndex >= 0 ? currentIndex : 0
  const next = links[(safeIndex + 1) % links.length]
  if (!next) return
  setActiveSection(next.name)
}

function getSectionSummary(section: SectionKey) {
  if (section === 'create') {
    return 'Build the story prompt, premise, and launch point.'
  }

  if (section === 'credits') {
    return 'Pick up the juice needed for more story generation.'
  }

  return 'A quick overview of what story mode is doing here.'
}

function fillStarter() {
  storyPrompt.value =
    'A desperate little town hires strange outsiders to solve a mystery that gets weirder every hour.'
  queuePromptOffsetRefresh()
}

function fillWeirdStarter() {
  storyPrompt.value =
    'A sentient carnival wanders between timelines, and every ticket sold rewrites one memory from the buyer’s past.'
  queuePromptOffsetRefresh()
}

function resetFooter() {
  storyPrompt.value = ''
  queuePromptOffsetRefresh()
}

function refreshPromptOffset() {
  if (displayStore.footerComponent !== 'story') {
    displayStore.clearPromptOffset('story')
    return
  }

  if (footerState.value === 'hidden') {
    displayStore.clearPromptOffset('story')
    return
  }

  if (footerState.value === 'priority') {
    displayStore.clearPromptOffset('story')
    return
  }

  const el = storyMeasureRef.value

  if (!el || !isCreateSection.value) {
    displayStore.clearPromptOffset('story')
    return
  }

  displayStore.refreshPromptOffset(
    'story',
    el.scrollHeight,
    el.clientHeight,
    footerState.value === 'compact' ? 1.5 : 2.5,
  )
}

function queuePromptOffsetRefresh() {
  nextTick(() => {
    refreshPromptOffset()
  })
}

async function openStoryMode() {
  await router.push('/story')
}

watch(
  () => [
    footerState.value,
    displayStore.footerComponent,
    activeSection.value,
    storyPrompt.value,
  ],
  () => {
    queuePromptOffsetRefresh()
  },
)

onMounted(() => {
  queuePromptOffsetRefresh()

  storyResizeObserver = new ResizeObserver(() => {
    refreshPromptOffset()
  })

  if (storyMeasureRef.value) {
    storyResizeObserver.observe(storyMeasureRef.value)
  }
})

onBeforeUnmount(() => {
  storyResizeObserver?.disconnect()
  storyResizeObserver = null
  displayStore.clearPromptOffset('story')
})
</script>
