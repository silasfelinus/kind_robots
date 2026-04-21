<!-- /components/navigation/story-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[1fr_auto] items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <textarea
          ref="storyMeasureRef"
          v-model="storyPrompt"
          class="textarea textarea-bordered h-full min-h-0 w-full resize-none overflow-y-auto bg-base-100 text-sm"
          placeholder="Start your story idea..."
          @input="queuePromptOffsetRefresh"
        />

        <button
          class="btn h-full min-h-0 w-24 font-semibold text-white bg-primary hover:bg-primary/90"
          :disabled="!storyPrompt.trim()"
          @click="openStoryMode"
        >
          Open Story
        </button>
      </div>
    </div>

    <div
      v-else-if="isOpen"
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1.25fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">📖 Story Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            :disabled="!storyPrompt.trim()"
            @click="openStoryMode"
          >
            Open Story
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div
              class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <div class="mb-2 text-sm font-semibold">Story Prompt</div>

              <textarea
                ref="storyMeasureRef"
                v-model="storyPrompt"
                class="textarea textarea-bordered min-h-32 w-full resize-none overflow-y-auto bg-base-100 text-sm"
                placeholder="Describe the story you want to create..."
                @input="queuePromptOffsetRefresh"
              />
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              Story mode lives in the story section. This footer is just the
              launchpad, so you can start the tale without wandering around the
              castle first.
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Story Preview
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed"
        >
          {{ storyPrompt || 'Your story idea preview will show up here.' }}
        </div>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[1.2fr_1fr]"
    >
      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">📖 Story Footer</h2>

          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            :disabled="!storyPrompt.trim()"
            @click="openStoryMode"
          >
            Open Story
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 text-sm font-semibold">Story Prompt</div>

              <textarea
                ref="storyMeasureRef"
                v-model="storyPrompt"
                class="textarea textarea-bordered min-h-40 w-full resize-none overflow-y-auto bg-base-100 text-sm"
                placeholder="Describe the story you want to create..."
                @input="queuePromptOffsetRefresh"
              />
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              Start with a premise, a vibe, a character problem, or one weird
              little impossible situation. Clean, simple, launchable. No goblin
              committee required.
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Story Preview
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto pr-1">
          <div class="flex flex-col gap-3">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Current Prompt
              </div>
              <div class="mt-2 text-sm leading-relaxed">
                {{ storyPrompt || 'No story intro yet...' }}
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Status
              </div>
              <div class="mt-2 text-sm font-semibold">
                {{
                  storyPrompt.trim()
                    ? 'Ready to launch'
                    : 'Waiting for a prompt'
                }}
              </div>
            </div>

            <div
              class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
            >
              Priority mode keeps it focused: write on the left, sanity-check on
              the right.
            </div>
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

const router = useRouter()
const storyStore = useStoryStore()
const displayStore = useDisplayStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isOpen = computed(() => footerState.value === 'open')

const storyPrompt = computed({
  get: () => storyStore.story.intro || '',
  set: (value: string) => {
    storyStore.setIntro(value)
  },
})

const storyMeasureRef = ref<HTMLTextAreaElement | null>(null)
let storyResizeObserver: ResizeObserver | null = null

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
  if (!el) {
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
  () => [footerState.value, displayStore.footerComponent, storyPrompt.value],
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
