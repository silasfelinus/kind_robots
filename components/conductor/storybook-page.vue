<!-- /components/conductor/storybook-page.vue -->
<!-- data-theme scopes the reading mode to THIS subtree, so picking
     Storybook Dark here does not hijack the rest of the app. Classic binds
     undefined, which Vue drops entirely, leaving the reader's global theme
     in charge — see storybookStore reading-mode state. -->
<template>
  <section :data-theme="store.dataTheme" class="kr-surface gap-4 kr-panel-flat p-4">
    <header class="flex shrink-0 flex-wrap items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"
      >
        <Icon name="kind-icon:book" class="size-6" />
      </div>
      <div class="min-w-0 flex-1 basis-full sm:basis-auto">
        <p class="text-2xl font-black leading-tight">
          Build a world, then step inside it
        </p>
        <p class="mt-1 max-w-3xl text-sm leading-relaxed text-base-content/65">
          Shape a premise, gather reusable Kind Robots characters and Facets,
          review the story bible, and let a dedicated narrator carry your
          choices forward. Storybook creates fiction; it never turns the tale
          into a task list.
        </p>
      </div>
      <div
        class="flex shrink-0 flex-wrap items-center gap-1 rounded-xl border border-base-300 bg-base-200/60 p-1"
        role="group"
        aria-label="Reading mode"
      >
        <button
          v-for="option in store.modes"
          :key="option.key"
          type="button"
          class="rounded-lg px-2.5 py-1.5 text-xs font-bold transition"
          :class="
            store.mode === option.key
              ? 'bg-primary text-primary-content shadow-sm'
              : 'text-base-content/60 hover:bg-base-300/60'
          "
          :title="option.hint"
          :aria-pressed="store.mode === option.key"
          @click="store.setMode(option.key)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="store.session" class="flex shrink-0 flex-wrap gap-2">
        <button
          v-if="store.canFinish"
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="store.finishStory()"
        >
          <Icon name="kind-icon:moon" class="size-4" /> Finish this tale
        </button>
        <!-- New story — arms on first click, fires on second, so an in-progress
             or finished tale can't be discarded by a single stray click. -->
        <button
          v-if="!newStoryArmed"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="newStoryArmed = true"
        >
          <Icon name="kind-icon:plus" class="size-4" /> New story
        </button>
        <button
          v-else
          type="button"
          class="btn btn-warning btn-sm rounded-xl"
          @click="startAnother"
          @blur="newStoryArmed = false"
        >
          <Icon name="kind-icon:alert" class="size-4" /> Discard this tale?
        </button>
      </div>
    </header>

    <LazyKrNarratorStage :stage-image="tabImage" class="shrink-0" />

    <!-- SETUP scrolls as a document: it is a four-step form that legitimately
         runs past the fold, so the page owns the scroll here. -->
    <div v-if="!store.session" class="kr-scroll space-y-4">
      <div class="space-y-4">
        <nav
          class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-2 sm:grid-cols-4"
          aria-label="Story setup progress"
        >
          <button
            v-for="(item, index) in setupSteps"
            :key="item.label"
            type="button"
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition"
            :class="
              setupStep === index
                ? 'bg-primary text-primary-content shadow-sm'
                : index < setupStep
                  ? 'bg-success/10 text-success'
                  : 'text-base-content/45'
            "
            :disabled="index > furthestStep"
            @click="setupStep = index"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/25"
            >
              <Icon
                v-if="index < setupStep"
                name="kind-icon:check"
                class="size-3.5"
              />
              <span v-else>{{ index + 1 }}</span>
            </span>
            <span class="truncate">{{ item.label }}</span>
          </button>
        </nav>

        <section
          v-if="setupStep === 0"
          class="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div>
            <h2 class="text-lg font-black">The spark</h2>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Begin with the promise of the story. A sentence is enough; a
              strange paragraph is welcome.
            </p>
          </div>

          <!-- Title and premise share one board card -- they're one decision
               (what this story is), the same reasoning that keeps cast and
               roles together on the casting board rather than splitting them
               across screens. -->
          <div class="kr-panel-flat space-y-3 p-3">
            <label class="form-control w-full">
              <span
                class="label-text mb-1 text-xs font-bold uppercase tracking-wide"
              >
                Working title (optional)
              </span>
              <input
                v-model="store.setupDraft.title"
                type="text"
                class="input input-bordered w-full rounded-xl bg-base-100"
                placeholder="The Clockwork Orchard"
              />
            </label>

            <label class="form-control w-full">
              <span
                class="label-text mb-1 text-xs font-bold uppercase tracking-wide"
              >
                Premise
              </span>
              <textarea
                v-model="store.setupDraft.premise"
                rows="5"
                class="textarea textarea-bordered w-full rounded-xl bg-base-100 text-sm leading-relaxed"
                placeholder="Every midnight, the town's abandoned observatory receives a letter from a star that should not exist…"
              />
              <span class="mt-1 text-[0.7rem] text-base-content/45">
                This is creative direction, not a prompt for model or generator
                settings.
              </span>
            </label>
          </div>

          <div class="kr-panel-flat space-y-2 p-3">
            <h3
              class="text-xs font-bold uppercase tracking-wide text-base-content/55"
            >
              Narrator voice
            </h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="style in STORYBOOK_NARRATOR_STYLES"
                :key="style"
                type="button"
                class="btn btn-sm rounded-xl capitalize"
                :class="
                  store.setupDraft.narratorStyle === style
                    ? 'btn-primary'
                    : 'btn-ghost border border-base-300 bg-base-100'
                "
                :aria-pressed="store.setupDraft.narratorStyle === style"
                @click="store.setupDraft.narratorStyle = style"
              >
                {{ style }}
              </button>
            </div>
          </div>

          <div class="kr-panel-flat space-y-2 p-3">
            <h3
              class="text-xs font-bold uppercase tracking-wide text-base-content/55"
            >
              Shape of the tale
            </h3>
            <div class="grid gap-2 md:grid-cols-3">
              <button
                v-for="structure in STORYBOOK_STRUCTURES"
                :key="structure.value"
                type="button"
                class="rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
                :class="
                  store.setupDraft.structure === structure.value
                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                    : 'border-base-300 bg-base-100'
                "
                :aria-pressed="store.setupDraft.structure === structure.value"
                @click="store.setupDraft.structure = structure.value"
              >
                <span class="text-sm font-black">{{ structure.label }}</span>
                <span
                  class="mt-1 block text-xs leading-relaxed text-base-content/55"
                >
                  {{ structure.description }}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section
          v-else-if="setupStep === 1"
          class="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div>
            <h2 class="text-lg font-black">The cast</h2>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Choose up to five existing characters. Leaving the cast empty lets
              Storybook invent whoever the premise requires.
            </p>
          </div>
          <NarrativeIngredientMultiPicker
            v-model="store.setupDraft.castSlugs"
            :items="characterOptions"
            label="Characters"
            helper="Existing character art and personality travel into the story bible."
            empty-state="No characters are available yet. Storybook can still invent a cast from the premise."
            :loading="characterStore.loading || characterStore.isInitializing"
            :error="characterStore.error"
            :initial-limit="9"
            :max-selections="5"
          />

          <!-- Roles live next to the cast picker rather than in the review
               step: choosing who is in the story and choosing what they are
               for is one decision, and splitting them across screens is how
               the cast ends up unassigned by default. -->
          <NarrativeRoleAssigner
            v-model="store.setupDraft.castRoles"
            :members="selectedCast"
          />
        </section>

        <section
          v-else-if="setupStep === 2"
          class="space-y-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div>
            <h2 class="text-lg font-black">The world and its flavor</h2>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Use canonical Dreams, Facets, and Rewards as ingredients. Their
              artwork becomes part of the setup surface while technical art
              direction remains automatic.
            </p>
          </div>

          <!-- The frame goes above the setting and flavor, because those are
               what bend it. -->
          <NarrativeIngredientPicker
            v-model="store.setupDraft.scenarioSlug"
            :items="scenarioOptions"
            label="Plot thread"
            helper="Frame this story on an existing Scenario. The cast, setting and Facets you pick will reshape how it plays out."
            empty-label="No plot thread — start from the premise alone"
            empty-description="Storybook builds the shape of the story from your premise."
            empty-state="No Scenarios are available yet."
            :allow-empty="true"
            :loading="scenarioStore.loading"
          />

          <NarrativeIngredientPicker
            v-model="store.setupDraft.locationSlug"
            :items="locationOptions"
            label="Primary setting"
            helper="Choose one reusable LOCATION Dream, or let the premise decide."
            empty-label="Invent a new place"
            empty-description="Storybook will derive the setting from the premise and selected Facets."
            empty-icon="kind-icon:moon"
            empty-state="No LOCATION Dreams are available yet."
            :loading="dreamStore.loading"
            :error="dreamStore.error"
            :initial-limit="6"
          />

          <NarrativeIngredientMultiPicker
            v-model="store.setupDraft.facetSlugs"
            :items="facetOptions"
            label="Creative Facets"
            helper="Mix genre, mood, theme, style, and art direction without exposing generator controls."
            empty-state="No active creative Facets are available yet."
            :loading="facetStore.loading"
            :error="facetStore.error"
            :initial-limit="9"
            :max-selections="5"
          />

          <NarrativeIngredientMultiPicker
            v-model="store.setupDraft.rewardSlugs"
            :items="rewardOptions"
            label="Possible story Rewards"
            helper="Choose up to three reusable Rewards the fiction may discover, grant, spend, or lose."
            empty-state="No active Rewards are available yet. The story can continue without inventory."
            :loading="rewardStore.isLoading || rewardStore.isInitializing"
            :error="rewardStore.error"
            :initial-limit="9"
            :max-selections="3"
          />

          <div class="kr-panel-flat space-y-2 p-3">
            <label class="form-control w-full">
              <span
                class="label-text mb-1 text-xs font-bold uppercase tracking-wide"
              >
                Extra story direction (optional)
              </span>
              <textarea
                v-model="store.setupDraft.notes"
                rows="3"
                class="textarea textarea-bordered w-full rounded-xl bg-base-100 text-sm leading-relaxed"
                placeholder="Keep the rivalry affectionate. Let every machine feel slightly alive. Avoid a chosen-one prophecy."
              />
            </label>
          </div>
        </section>

        <section
          v-else
          class="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
        >
          <div>
            <h2 class="text-lg font-black">Story bible</h2>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Review the creative contract before Storybook writes the opening
              scene.
            </p>
          </div>

          <dl class="grid gap-3 md:grid-cols-2">
            <div class="kr-panel-flat p-3 md:col-span-2">
              <dt
                class="text-[0.7rem] font-bold uppercase tracking-wide text-primary/70"
              >
                {{ reviewTitle }}
              </dt>
              <dd class="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {{ store.setupDraft.premise }}
              </dd>
            </div>
            <div class="kr-panel-flat p-3">
              <dt class="text-xs font-bold text-base-content/55">Narration</dt>
              <dd class="mt-1 text-sm capitalize">
                {{ store.setupDraft.narratorStyle }} · {{ structureLabel }}
              </dd>
            </div>
            <div class="kr-panel-flat p-3">
              <dt class="text-xs font-bold text-base-content/55">
                Plot thread
              </dt>
              <dd class="mt-2 flex items-center gap-3">
                <div v-if="selectedScenario" class="w-16 shrink-0">
                  <KrArtPlate
                    :source="selectedScenario"
                    variant="icon"
                    shape="square"
                    frame="thin"
                    :alt="selectedScenario.title"
                    placeholder-icon="kind-icon:map"
                  />
                </div>
                <span class="text-sm">
                  {{ selectedScenario?.title || 'Premise-led story' }}
                </span>
              </dd>
            </div>
            <div class="kr-panel-flat p-3">
              <dt class="text-xs font-bold text-base-content/55">Setting</dt>
              <dd class="mt-2 flex items-center gap-3">
                <div v-if="selectedLocation" class="w-16 shrink-0">
                  <KrArtPlate
                    :source="selectedLocation"
                    variant="icon"
                    shape="square"
                    frame="thin"
                    :alt="selectedLocation.title"
                    placeholder-icon="kind-icon:moon"
                  />
                </div>
                <span class="text-sm">
                  {{ selectedLocation?.title || 'Invented from the premise' }}
                </span>
              </dd>
            </div>
            <div class="kr-panel-flat p-3">
              <dt class="text-xs font-bold text-base-content/55">Cast</dt>
              <dd class="mt-2">
                <ul v-if="selectedCast.length" class="flex flex-wrap gap-2">
                  <li
                    v-for="member in selectedCast"
                    :key="member.slug"
                    class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 py-1 pl-1 pr-2.5"
                  >
                    <div class="size-8 shrink-0 overflow-hidden rounded-lg">
                      <KrArtPlate
                        :source="member"
                        variant="icon"
                        shape="square"
                        frame="none"
                        :alt="member.title"
                        :placeholder-icon="member.icon || 'kind-icon:mask'"
                      />
                    </div>
                    <span class="text-sm">{{ member.title }}</span>
                  </li>
                </ul>
                <span v-else class="text-sm">Invented as needed</span>
              </dd>
            </div>
            <div class="kr-panel-flat p-3">
              <dt class="text-xs font-bold text-base-content/55">Facets</dt>
              <dd class="mt-2">
                <ul v-if="selectedFacets.length" class="flex flex-wrap gap-2">
                  <li
                    v-for="facet in selectedFacets"
                    :key="facet.slug"
                    class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 py-1 pl-1 pr-2.5"
                  >
                    <div class="size-8 shrink-0 overflow-hidden rounded-lg">
                      <KrArtPlate
                        :source="facet"
                        variant="icon"
                        shape="square"
                        frame="none"
                        :alt="facet.title"
                        :placeholder-icon="facet.icon || 'kind-icon:sparkles'"
                      />
                    </div>
                    <span class="text-sm">{{ facet.title }}</span>
                  </li>
                </ul>
                <span v-else class="text-sm">None selected</span>
              </dd>
            </div>
            <div class="kr-panel-flat p-3 md:col-span-2">
              <dt class="text-xs font-bold text-base-content/55">
                Possible Rewards
              </dt>
              <dd class="mt-2">
                <ul v-if="selectedRewards.length" class="flex flex-wrap gap-2">
                  <li
                    v-for="reward in selectedRewards"
                    :key="reward.slug"
                    class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 py-1 pl-1 pr-2.5"
                  >
                    <div class="size-8 shrink-0 overflow-hidden rounded-lg">
                      <KrArtPlate
                        :source="reward"
                        variant="icon"
                        shape="square"
                        frame="none"
                        :alt="reward.title"
                        :placeholder-icon="reward.icon || 'kind-icon:gift'"
                      />
                    </div>
                    <span class="text-sm">{{ reward.title }}</span>
                  </li>
                </ul>
                <span v-else class="text-sm">No curated inventory pool</span>
              </dd>
            </div>
            <div
              v-if="store.setupDraft.notes.trim()"
              class="kr-panel-flat p-3 md:col-span-2"
            >
              <dt class="text-xs font-bold text-base-content/55">
                Additional direction
              </dt>
              <dd class="mt-1 whitespace-pre-line text-sm leading-relaxed">
                {{ store.setupDraft.notes }}
              </dd>
            </div>
          </dl>

          <div
            class="flex items-start gap-2 rounded-2xl border border-info/30 bg-info/5 p-3 text-xs leading-relaxed"
          >
            <Icon
              name="kind-icon:palette"
              class="mt-0.5 size-4 shrink-0 text-info"
            />
            <span>
              Scene art will be directed from this bible automatically.
              Storybook will not ask for a model, sampler, dimensions, or step
              count.
            </span>
          </div>
        </section>

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>

        <footer class="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            class="btn btn-ghost rounded-xl border border-base-300"
            :disabled="setupStep === 0 || store.isWeaving"
            @click="setupStep -= 1"
          >
            <Icon name="kind-icon:chevron-left" class="size-4" /> Back
          </button>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-ghost rounded-xl"
              :disabled="store.isWeaving"
              @click="clearDraft"
            >
              Clear draft
            </button>
            <button
              v-if="setupStep < setupSteps.length - 1"
              type="button"
              class="btn btn-primary rounded-xl"
              :disabled="!canAdvance"
              @click="advanceSetup"
            >
              Continue <Icon name="kind-icon:chevron-right" class="size-4" />
            </button>
            <button
              v-else
              type="button"
              class="btn btn-primary rounded-xl"
              :disabled="!canBegin || store.isWeaving"
              @click="beginStory"
            >
              <span
                v-if="store.isWeaving"
                class="loading loading-dots loading-sm"
              />
              <template v-else>
                <Icon name="kind-icon:sparkles" class="size-4" /> Write the
                opening scene
              </template>
            </button>
          </div>
        </footer>
      </div>
    </div>

    <!-- READING owns no scroll of its own: the chat window is the single scroll
         region, so the bible, the state panel and the composer stay pinned and
         only the story moves. This is what the shared window buys — the page it
         replaced had the transcript scrolling inside a scrolling page. -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="shrink-0 space-y-3">
        <details class="rounded-2xl border border-primary/25 bg-primary/5 p-3">
          <summary class="cursor-pointer text-sm font-black text-primary">
            {{ store.session.bible.title }} · Story bible
          </summary>
          <div class="mt-3 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
            <p
              class="rounded-xl border border-base-300 bg-base-100 p-3 sm:col-span-2"
            >
              {{ store.session.bible.premise }}
            </p>
            <p class="rounded-xl border border-base-300 bg-base-100 p-3">
              <span class="font-bold">Cast:</span>
              {{
                store.session.bible.cast.map((item) => item.title).join(', ') ||
                'Invented as needed'
              }}
            </p>
            <p class="rounded-xl border border-base-300 bg-base-100 p-3">
              <span class="font-bold">World:</span>
              {{
                store.session.bible.location?.title ||
                'Invented from the premise'
              }}
            </p>
            <p class="rounded-xl border border-base-300 bg-base-100 p-3">
              <span class="font-bold">Facets:</span>
              {{
                store.session.bible.facets
                  .map((item) => item.title)
                  .join(', ') || 'None selected'
              }}
            </p>
            <p class="rounded-xl border border-base-300 bg-base-100 p-3">
              <span class="font-bold">Reward pool:</span>
              {{
                store.session.bible.rewards
                  .map((item) => item.title)
                  .join(', ') || 'None selected'
              }}
            </p>
          </div>
        </details>

        <StorybookStatePanel :session="store.session" />

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>
      </div>

      <KrChatWindow
        class="min-h-0 flex-1"
        :turns="chatTurns"
        label="Story transcript"
        :is-streaming="store.isWeaving"
        :streaming-text="store.streamingText"
        streaming-label="Storybook is weaving the next scene…"
        empty-label="Storybook is preparing the opening scene."
      >
        <template #after-turn="{ turn }">
          <NarrativeArtStatus
            v-if="beatForTurn(turn)"
            class="mt-2"
            :art="beatForTurn(turn)?.art"
            :label="`Illustration from ${store.session?.bible.title || 'this story'}`"
            @retry="store.retryBeatArt(beatForTurn(turn)!.id)"
          />
        </template>

        <!-- The closing note scrolls WITH the tale rather than pinning below
             it; it is the last page, not a status bar. -->
        <template #footer>
          <div
            v-if="store.isComplete"
            class="rounded-2xl border border-success/30 bg-success/5 p-4 text-center"
          >
            <p class="font-black text-success">The tale rests here</p>
            <p class="mt-1 text-xs text-base-content/55">
              The completed session remains saved in this browser until you
              begin another.
            </p>
          </div>
        </template>
      </KrChatWindow>
    </div>

    <NarrativeResponseComposer
      v-if="store.session && !store.isComplete"
      v-model="answerInput"
      class="shrink-0"
      :disabled="!store.awaitingAnswer"
      :loading="store.isWeaving"
      :placeholder="
        store.awaitingAnswer ? 'What happens next?' : 'Storybook is weaving…'
      "
      button-label="Continue story"
      hint="Your response changes this fictional branch. It does not update projects or real-world tasks."
      @submit="submitAnswer"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useRewardStore } from '@/stores/rewardStore'
import {
  STORYBOOK_NARRATOR_STYLES,
  STORYBOOK_STRUCTURES,
  useStorybookStore,
  type StorybookIngredient,
} from '@/stores/storybookStore'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'
import { isNarrativeRoleKey } from '@/utils/narrativeRoles'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useRoute, useRouter } from 'vue-router'
import { beatIdFromTurnId, narrativeBeatsToTurns } from '@/utils/narrativeTurns'
import { getTutorialImagePath } from '@/stores/helpers/tutorialCards'

const store = useStorybookStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const scenarioStore = useScenarioStore()
const route = useRoute()
const router = useRouter()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()

const tabImage = computed(() => getTutorialImagePath('scenario', 'storybook'))

const setupStep = ref(0)
const furthestStep = ref(0)
const answerInput = ref('')
const newStoryArmed = ref(false)

// A "Discard this tale?" arm is a confirmation for THIS session, not a
// standing state. storybook-library-page.vue can swap the active session out
// from under it -- opening a different story, duplicating, or restarting all
// change `store.session.id` without this component's own startAnother() ever
// running. Without this reset, the next session renders straight into the
// armed, warning-colored button (never the plain "New story" one), so a
// single click that looks like a first press instead discards that session
// immediately, with no confirmation ever given for the story actually on
// screen.
watch(
  () => store.session?.id ?? null,
  () => {
    newStoryArmed.value = false
  },
)

/*
 * Beats persist as one record per scene (narration plus the reader's reply);
 * the shared chat window speaks one message per speaker. narrativeBeatsToTurns
 * is the single adapter between the two, so Taskmaster does not re-derive it.
 */
const chatTurns = computed(() =>
  narrativeBeatsToTurns(store.session?.beats ?? []),
)

/* The beat a narration turn came from — null for the reader's own turns, so a
   scene's illustration renders once rather than beside the answer as well. */
function beatForTurn(turn: NarrativeTurn) {
  const beatId = beatIdFromTurnId(turn.id)
  if (!beatId) return null
  return store.session?.beats.find((beat) => beat.id === beatId) ?? null
}

const setupSteps = [
  { label: 'Premise' },
  { label: 'Cast' },
  { label: 'World' },
  { label: 'Review' },
]

const characterOptions = computed<NarrativeIngredientOption[]>(() =>
  characterStore.characters.map((character) => ({
    id: character.id,
    // Match the real Character slug when one exists -- the same field
    // character-manager.vue's "Start a story with this character" link
    // reads (`?character=<slug>`) via seedFromQuery() below. scenarioOptions,
    // locationOptions, facetOptions and rewardOptions all already key off
    // their entity's own slug this way; a synthetic `character-${id}` slug
    // here was the one outlier, so a Character deep link never matched an
    // option's slug and the character silently never joined the cast (while
    // quietly consuming one of the 5 max cast selections with an orphaned,
    // never-displayed-as-selected entry). Falls back to the synthetic id
    // form only for the rare character with no slug of its own.
    slug: character.slug || `character-${character.id}`,
    title: character.name || `Character ${character.id}`,
    description:
      character.presentation || character.personality || character.backstory,
    flavorText: [character.species, character.class, character.genre]
      .filter(Boolean)
      .join(' · '),
    imagePath: character.imagePath,
    icon: 'kind-icon:mask',
    badge: character.isPublic ? 'Public character' : 'Private character',
  })),
)

/*
 * Scenarios as story FRAMES.
 *
 * Silas, 2026-08-06: "Scenario should be a special storybook story that is
 * framed on a specific plot thread ... so now we get a darker story about
 * cthulhu's presidential run with ami-butterfly as the main character." A
 * Scenario is therefore an ingredient like any other rather than a parallel
 * story engine -- it supplies the thread, and the cast, setting and Facets
 * chosen alongside it reshape how that thread plays out.
 */
const scenarioOptions = computed<NarrativeIngredientOption[]>(() =>
  scenarioStore.scenarios
    .filter((scenario) => scenario.slug)
    .map((scenario) => ({
      id: scenario.id,
      slug: scenario.slug || String(scenario.id),
      title: scenario.title || 'Untitled scenario',
      description: scenario.description,
      imagePath: scenario.imagePath,
      icon: 'kind-icon:map',
      badge: scenario.genres || undefined,
    })),
)

const selectedScenario = computed(() =>
  scenarioOptions.value.find(
    (item) => item.slug === store.setupDraft.scenarioSlug,
  ),
)

const locationOptions = computed<NarrativeIngredientOption[]>(() =>
  dreamStore.dreams
    .filter(
      (dream) => dream.dreamType === 'LOCATION' && dream.isActive && dream.slug,
    )
    .map((dream) => ({
      id: dream.id,
      slug: dream.slug || String(dream.id),
      title: dream.title || 'Untitled location',
      description: dream.description,
      flavorText: dream.flavorText,
      imagePath:
        dream.imagePath ||
        dream.highlightImage ||
        dream.ArtImage?.imagePath ||
        null,
      icon: 'kind-icon:moon',
      badge: 'Location',
    })),
)

const creativeFacetTaxonomies = new Set([
  'GENRE',
  'CORE',
  'THEME',
  'MOOD',
  'STYLE',
  'ART_DIRECTION',
])
const facetOptions = computed<NarrativeIngredientOption[]>(() =>
  facetStore.activeFacets
    .filter(
      (facet) => creativeFacetTaxonomies.has(facet.taxonomy) && facet.slug,
    )
    .map((facet) => ({
      id: facet.id,
      slug: facet.slug || String(facet.id),
      title: facet.title,
      description: facet.description,
      flavorText: facet.flavorText,
      imagePath: facet.imagePath,
      cardPath: facet.cardPath,
      heroPath: facet.heroPath,
      icon: facet.icon,
      badge: taxonomyLabel(facet.taxonomy),
    })),
)

const rewardOptions = computed<NarrativeIngredientOption[]>(() =>
  rewardStore.rewards
    .filter((reward) => reward.isActive && reward.slug)
    .map((reward) => ({
      id: reward.id,
      slug: reward.slug || String(reward.id),
      title: reward.name || `Reward ${reward.id}`,
      description: reward.description || reward.effect,
      flavorText: reward.flavorText,
      imagePath: reward.imagePath,
      icon: reward.icon || 'kind-icon:gift',
      badge: `${rarityLabel(reward.rarity)} ${reward.rewardType.toLowerCase()}`,
    })),
)

const selectedCast = computed(() =>
  characterOptions.value.filter((item) =>
    store.setupDraft.castSlugs.includes(item.slug),
  ),
)
const selectedLocation = computed(() =>
  locationOptions.value.find(
    (item) => item.slug === store.setupDraft.locationSlug,
  ),
)
const selectedFacets = computed(() =>
  facetOptions.value.filter((item) =>
    store.setupDraft.facetSlugs.includes(item.slug),
  ),
)
const selectedRewards = computed(() =>
  rewardOptions.value.filter((item) =>
    store.setupDraft.rewardSlugs.includes(item.slug),
  ),
)
const reviewTitle = computed(
  () => store.setupDraft.title.trim() || 'Untitled story',
)
const structureLabel = computed(
  () =>
    STORYBOOK_STRUCTURES.find(
      (item) => item.value === store.setupDraft.structure,
    )?.label || store.setupDraft.structure,
)
const canAdvance = computed(
  () => setupStep.value > 0 || store.setupDraft.premise.trim().length >= 10,
)
const canBegin = computed(() => store.setupDraft.premise.trim().length >= 10)

function taxonomyLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function rarityLabel(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

/** The stored role for a cast member, or null when it is unset or stale. */
function assignedRole(slug: string): string | null {
  const key = store.setupDraft.castRoles?.[slug]
  return key && isNarrativeRoleKey(key) ? key : null
}

function toIngredient(option: NarrativeIngredientOption): StorybookIngredient {
  const reward = rewardStore.rewards.find((item) => item.slug === option.slug)
  return {
    id: option.id,
    slug: option.slug,
    title: option.title,
    description: option.description,
    flavorText: option.flavorText,
    imagePath: option.cardPath || option.imagePath || option.heroPath || null,
    icon: option.icon,
    rarity: reward?.rarity || null,
    effect: reward?.effect || null,
  }
}

function advanceSetup() {
  if (!canAdvance.value) return
  setupStep.value = Math.min(setupStep.value + 1, setupSteps.length - 1)
  furthestStep.value = Math.max(furthestStep.value, setupStep.value)
}

function clearDraft() {
  store.resetSetup()
  setupStep.value = 0
  furthestStep.value = 0
}

async function beginStory() {
  if (!canBegin.value) return
  await store.beginStory({
    title: store.setupDraft.title,
    premise: store.setupDraft.premise,
    narratorStyle: store.setupDraft.narratorStyle,
    structure: store.setupDraft.structure,
    // Cast members carry their part into the story bible; the role map is
    // keyed by slug and validated on the way in, since it is persisted and a
    // draft can outlive a role being renamed.
    cast: selectedCast.value.map((member) => ({
      ...toIngredient(member),
      roleKey: assignedRole(member.slug),
    })),
    location: selectedLocation.value
      ? toIngredient(selectedLocation.value)
      : undefined,
    facets: selectedFacets.value.map(toIngredient),
    rewards: selectedRewards.value.map(toIngredient),
    scenario: selectedScenario.value
      ? toIngredient(selectedScenario.value)
      : undefined,
    notes: store.setupDraft.notes,
  })
}

async function submitAnswer(value: string) {
  answerInput.value = ''
  const wove = await store.answerCurrentBeat(value)
  // answerCurrentBeat's own rollback (see verifyStorybookAnswerRollbackGuard)
  // restores store consistency on a failed weaveBeat call, but it can't
  // restore the composer's local text -- without this, the reader's answer
  // is optimistically cleared above and then silently lost, forcing them to
  // recall and retype it from scratch on retry. weaveBeat always sets
  // errorMessage on a real failure, so checking it (not just `!wove`) avoids
  // repopulating the box when answerCurrentBeat's own no-op guard rejected
  // the submission before ever calling weaveBeat.
  if (!wove && store.errorMessage) answerInput.value = value
}

function startAnother() {
  if (store.isWeaving) return
  newStoryArmed.value = false
  store.resetSession()
  setupStep.value = 0
  furthestStep.value = 0
}

/*
 * ARRIVING WITH AN INGREDIENT ALREADY CHOSEN.
 *
 * Storybook had no query handling at all, so a Facet or Reward could be IN a
 * story only if you came here first and hunted for it in a picker. That is the
 * missing half of Silas's design: "we should have links to these elements that
 * start the process to tell a storybook story with that element as part of
 * it." Facets and Rewards do not need conversations of their own -- they need
 * a way in here.
 *
 * Seeds the draft rather than replacing it, so a link never destroys a story
 * someone was already assembling. The query is cleared immediately so a
 * reload, bookmark or share does not silently re-add the ingredient after the
 * author removed it -- the same one-shot treatment /facets?create=1 gets.
 */
function seedFromQuery(): void {
  const draft = store.setupDraft
  const single = (value: unknown): string | null => {
    const raw = Array.isArray(value) ? value[0] : value
    return typeof raw === 'string' && raw ? raw : null
  }
  const addOnce = (list: string[], slug: string | null) => {
    if (slug && !list.includes(slug)) list.push(slug)
  }

  const scenario = single(route.query.scenario)
  if (scenario) draft.scenarioSlug = scenario
  const location = single(route.query.location)
  if (location) draft.locationSlug = location
  addOnce(draft.castSlugs, single(route.query.character))
  addOnce(draft.facetSlugs, single(route.query.facet))
  addOnce(draft.rewardSlugs, single(route.query.reward))

  const consumed = ['scenario', 'location', 'character', 'facet', 'reward']
  if (!consumed.some((key) => route.query[key])) return

  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !consumed.includes(key)),
  )
  void router.replace({ query })
}

onMounted(() => {
  store.restoreFromLocalStorage()
  // After the restore, so a link seeds ON TOP of the saved draft rather than
  // being overwritten by it.
  seedFromQuery()
  void characterStore.initialize({
    fetchRemote: true,
    createDefaultForm: false,
  })
  if (!dreamStore.hasLoaded) {
    void dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })
  }
  if (!facetStore.loaded) void facetStore.fetchFacets({ take: 250 })
  void rewardStore.initialize({ fetchRemote: true })
  void scenarioStore.initialize({ fetchRemote: true })
})
</script>
