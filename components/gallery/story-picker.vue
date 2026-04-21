<!-- /components/gallery/story-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search story draft…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <ul class="picker-list">
      <li
        v-for="section in filteredSections"
        :key="section.key"
        class="picker-row"
        :class="{
          'picker-row--active': storyStore.activeSection === section.key,
        }"
        @click="selectSection(section.key)"
      >
        <span class="picker-icon">
          <icon :name="section.icon" class="h-5 w-5" />
        </span>

        <span class="picker-label">
          <span class="picker-name">{{ section.label }}</span>
          <span class="picker-sub">{{ section.description }}</span>
        </span>

        <button
          class="picker-action btn btn-xs rounded-full"
          :class="
            storyStore.activeSection === section.key
              ? 'btn-primary'
              : 'btn-ghost'
          "
          @click.stop="selectSection(section.key)"
        >
          Open
        </button>
      </li>
    </ul>

    <div class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="text-sm font-bold">Current Story Draft</div>
        <button
          class="btn btn-xs btn-outline rounded-full"
          @click="storyStore.clearStory()"
        >
          Clear
        </button>
      </div>

      <div class="grid gap-2 sm:grid-cols-2">
        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Creator</div>
          <div class="text-sm">
            {{ storyStore.story.creator?.name || 'None selected' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Scenario</div>
          <div class="text-sm">
            {{ storyStore.story.scenario?.description || 'None selected' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Storyteller</div>
          <div class="text-sm">
            {{ storyStore.story.storyteller || 'Not set' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Genre</div>
          <div class="text-sm">
            {{ storyStore.story.genre || 'Not set' }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Characters</div>
          <div class="text-sm">
            {{ storyStore.story.characters.length }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Rewards</div>
          <div class="text-sm">
            {{ storyStore.story.rewards.length }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Chats</div>
          <div class="text-sm">
            {{ storyStore.story.chats.length }}
          </div>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-2">
          <div class="text-xs font-semibold opacity-70">Tags</div>
          <div class="text-sm">
            {{
              storyStore.story.tags.length
                ? storyStore.story.tags.join(', ')
                : 'No tags'
            }}
          </div>
        </div>
      </div>

      <div class="mt-3 rounded-xl border border-base-300 bg-base-200 p-2">
        <div class="text-xs font-semibold opacity-70">Intro</div>
        <div class="text-sm leading-snug">
          {{ introPreview }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStoryStore } from '@/stores/storyStore'

type StorySection = 'create' | 'credits' | 'about'

type SectionItem = {
  key: StorySection
  label: string
  icon: string
  description: string
}

const storyStore = useStoryStore()
const query = ref('')

const sections: SectionItem[] = [
  {
    key: 'create',
    label: 'Create Story',
    icon: 'kind-icon:pencil',
    description: 'Build the current story draft',
  },
  {
    key: 'credits',
    label: 'Generate Credits',
    icon: 'kind-icon:generate',
    description: 'Manage story credit generation',
  },
  {
    key: 'about',
    label: 'About',
    icon: 'kind-icon:info-circle',
    description: 'Learn about the story system',
  },
]

const filteredSections = computed(() => {
  const q = query.value.trim().toLowerCase()

  if (!q) return sections

  return sections.filter((section) => {
    return (
      section.label.toLowerCase().includes(q) ||
      section.description.toLowerCase().includes(q) ||
      section.key.toLowerCase().includes(q)
    )
  })
})

const introPreview = computed(() => {
  const intro = storyStore.story.intro?.trim() || 'No intro written yet.'
  return intro.length > 140 ? `${intro.slice(0, 140)}…` : intro
})

function selectSection(section: StorySection) {
  storyStore.setActiveSection(section)
}
</script>
