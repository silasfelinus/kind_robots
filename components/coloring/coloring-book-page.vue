<!-- /components/coloring/coloring-book-page.vue -->
<!--
  Public front page for the Coloring Book project. Wraps the shared
  <project-front-page> shell and drops a five-mode studio into the interactive
  slot: Color (the existing engine), Galleries (finished pages), Generate (make
  more color / black-and-white line art), Proposals (pitch new books), and
  Prompts (draft the prompts that feed generation).
-->
<template>
  <ProjectFrontPage
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <section
        class="rounded-3xl border border-base-300 bg-base-100 p-4 shadow-sm"
      >
        <!-- Studio sub-nav -->
        <div role="tablist" class="tabs tabs-boxed mb-4 flex-wrap">
          <button
            v-for="mode in modes"
            :key="mode.key"
            type="button"
            role="tab"
            class="tab gap-1"
            :class="activeMode === mode.key ? 'tab-active' : ''"
            @click="activeMode = mode.key"
          >
            <Icon :name="mode.icon" class="size-4" />
            {{ mode.label }}
          </button>
        </div>

        <!-- COLOR: the existing engine -->
        <div v-show="activeMode === 'color'">
          <coloring-book-manager />
        </div>

        <!-- GALLERIES: finished / candidate pages -->
        <div v-if="activeMode === 'galleries'" class="space-y-4">
          <p class="text-sm text-base-content/60">
            Finished pages and generated candidates. Pick one and it opens in
            the Color studio.
          </p>
          <ProjectGalleryStrip
            collection-label="coloring-book"
            title="Coloring pages"
          />
          <art-gallery
            class="min-h-[24rem]"
            variant="dashboard"
            :show-header="false"
            :show-selected-panel="false"
          />
        </div>

        <!-- GENERATE: more color or line art -->
        <div v-if="activeMode === 'generate'" class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/50 p-4"
            >
              <div class="flex items-center gap-2">
                <Icon
                  name="kind-icon:pencil"
                  class="size-5 text-base-content/70"
                />
                <h4 class="font-black">Black &amp; white line art</h4>
              </div>
              <p class="text-xs text-base-content/60">
                Clean, closed outlines ready to color. Describe a subject and
                add it to the book.
              </p>
              <input
                v-model="lineSubject"
                type="text"
                placeholder="e.g. a friendly robot watering a garden"
                class="input input-bordered input-sm rounded-xl"
              />
              <generate-button
                label="Generate line art"
                busy-label="Drawing outlines..."
                icon="kind-icon:pencil"
                :overrides="lineArtOverrides"
                @generated="onGenerated"
              />
            </div>

            <div
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/50 p-4"
            >
              <div class="flex items-center gap-2">
                <Icon name="kind-icon:palette" class="size-5 text-primary" />
                <h4 class="font-black">Full-color reference</h4>
              </div>
              <p class="text-xs text-base-content/60">
                A colored version to guide palette choices, or a finished piece
                for the gallery.
              </p>
              <input
                v-model="colorSubject"
                type="text"
                placeholder="e.g. the same robot, richly colored"
                class="input input-bordered input-sm rounded-xl"
              />
              <generate-button
                label="Generate color art"
                busy-label="Mixing colors..."
                icon="kind-icon:palette"
                :overrides="colorOverrides"
                @generated="onGenerated"
              />
            </div>
          </div>
          <p class="text-xs text-base-content/40">
            Generated images go to your art gallery and can be pulled into a
            book.
          </p>
        </div>

        <!-- PROPOSALS -->
        <ProjectPitchBoard
          v-if="activeMode === 'proposals'"
          slug="coloring-book"
          noun="proposal"
          title="Proposed books &amp; pitches"
          icon="kind-icon:book"
          body-placeholder="Pitch a themed coloring book — the concept, the vibe, why it sings."
          empty-text="No book pitches yet. Propose the next set."
        />

        <!-- PROMPTS -->
        <ProjectPitchBoard
          v-if="activeMode === 'prompts'"
          slug="coloring-book"
          noun="prompt"
          title="Prompt drafts"
          icon="kind-icon:prompt"
          body-placeholder="Draft a generation prompt (subject, style, 'thick clean outlines, no shading')."
          empty-text="No prompt drafts yet. Sketch one out."
        />
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

type Mode = 'color' | 'galleries' | 'generate' | 'proposals' | 'prompts'

const modes: { key: Mode; label: string; icon: string }[] = [
  { key: 'color', label: 'Color', icon: 'kind-icon:paintbrush' },
  { key: 'galleries', label: 'Galleries', icon: 'kind-icon:image' },
  { key: 'generate', label: 'Generate', icon: 'kind-icon:sparkles' },
  { key: 'proposals', label: 'Proposals', icon: 'kind-icon:book' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:prompt' },
]
const activeMode = ref<Mode>('color')

const lineSubject = ref('')
const colorSubject = ref('')

const LINE_STYLE =
  'coloring book page, thick clean black outlines, line art, white background, no shading, no color, high contrast'
const COLOR_STYLE = 'richly colored illustration, storybook art, soft shading'

const lineArtOverrides = computed(() => ({
  promptString: `${lineSubject.value || 'a whimsical scene'}, ${LINE_STYLE}`,
  negativePrompt: 'color, grayscale, shading, gradient, photo, realistic',
  collectionLabel: 'coloring-book',
}))
const colorOverrides = computed(() => ({
  promptString: `${colorSubject.value || 'a whimsical scene'}, ${COLOR_STYLE}`,
  negativePrompt: 'line art, sketch, monochrome, lowres',
  collectionLabel: 'coloring-book',
}))

function onGenerated() {
  // Nudge the user toward the freshly-filled gallery.
  activeMode.value = 'galleries'
}

const config: ProjectFrontConfig = {
  slug: 'coloring-book',
  title: 'Coloring Book',
  channelKey: 'art',
  tabKey: 'coloring',
  icon: 'kind-icon:paintbrush',
  tagline: 'Color AI-generated pages, or conjure a whole new book.',
  description:
    'A living coloring book. Open a page and tap regions to fill them, browse finished and candidate art, generate fresh line art or full-color references, and pitch entire themed books — Kind Robots, Monster Recast, and whatever the swarm dreams up next. Your palette saves itself as you go.',
  sections: [
    {
      key: 'color',
      title: 'Color anything',
      body: 'Region-fill and flood modes, a savable palette, undo, and export to PNG or JSON. Walk away mid-masterpiece — it remembers.',
      icon: 'kind-icon:paintbrush',
    },
    {
      key: 'generate',
      title: 'Make more art',
      body: 'Generate clean black-and-white line art to color, or full-color references, straight into your gallery via the shared art engine.',
      icon: 'kind-icon:sparkles',
    },
  ],
  deliverables: {
    done: [
      'Shared coloring engine (region + flood fill, undo, palette, export)',
      'Sampler and Cozy Corner sets live; Mural runs on the same engine',
    ],
    next: [
      'Generated Kind Robots and Monster Recast books',
      'Print-on-demand hand-off to the storefront',
    ],
  },
}
</script>
