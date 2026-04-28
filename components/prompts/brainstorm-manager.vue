<!-- /components/content/prompts/brainstorm-manager.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3 text-base-content"
  >
    <header
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <icon name="kind-icon:brain" class="h-5 w-5 text-primary" />
        <h1 class="text-xl font-bold">Brainstorm Manager</h1>
        <span
          v-if="selectedPitch"
          class="badge badge-primary max-w-48 truncate"
        >
          {{ selectedPitch.title }}
        </span>
        <span :class="sourceBadgeClass(activeCreationSource)">
          {{ activeCreationSource }}
        </span>
      </div>

      <nav class="flex flex-wrap gap-2">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          class="btn btn-sm rounded-2xl"
          :class="activeSection === section.key ? 'btn-primary' : 'btn-outline'"
          @click="activeSection = section.key"
        >
          <icon :name="section.icon" class="h-4 w-4" />
          {{ section.label }}
        </button>
      </nav>
    </header>

    <div
      v-if="activeSection === 'add'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]"
    >
      <main
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-3">
          <div
            class="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_170px]"
          >
            <input
              v-model="pitchForm.title"
              class="input input-bordered rounded-2xl text-base font-bold"
              placeholder="Vanderbilt Lacrosse"
              @input="markEdited"
            />

            <select
              v-model="pitchForm.PitchType"
              class="select select-bordered rounded-2xl"
              @change="markEdited"
            >
              <option
                v-for="type in pitchStore.pitchTypes"
                :key="type"
                :value="type"
              >
                {{ type }}
              </option>
            </select>

            <select
              v-model="activeCreationSource"
              class="select select-bordered rounded-2xl"
              @change="markEdited"
            >
              <option
                v-for="source in creationSources"
                :key="source"
                :value="source"
              >
                {{ source }}
              </option>
            </select>
          </div>
        </div>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Core pitch</span>
              </div>
              <textarea
                v-model="pitchForm.pitch"
                class="textarea textarea-bordered min-h-32 rounded-2xl"
                placeholder="A wildly specific idea worth expanding..."
                @input="markEdited"
              />
            </label>

            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold"
                  >Generator instructions</span
                >
              </div>
              <textarea
                v-model="pitchForm.description"
                class="textarea textarea-bordered min-h-32 rounded-2xl"
                placeholder="Tone, rules, vibe, forbidden goblin behavior..."
                @input="markEdited"
              />
            </label>
          </div>

          <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <label class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Flavor text</span>
              </div>
              <textarea
                v-model="pitchForm.flavorText"
                class="textarea textarea-bordered min-h-32 rounded-2xl"
                placeholder="A little card sparkle..."
                @input="markEdited"
              />
            </label>

            <div class="form-control">
              <div class="label py-1">
                <span class="label-text font-semibold">Image prompt</span>
              </div>
              <div class="grid min-h-0 gap-2">
                <textarea
                  v-model="pitchForm.imagePrompt"
                  class="textarea textarea-bordered min-h-32 rounded-2xl"
                  placeholder="Optional art prompt..."
                  @input="markEdited"
                />
                <button
                  type="button"
                  class="btn btn-accent rounded-2xl"
                  :disabled="isGeneratingArt || !pitchForm.imagePrompt?.trim()"
                  @click="generateArtImage"
                >
                  <span
                    v-if="isGeneratingArt"
                    class="loading loading-spinner loading-sm"
                  />
                  <icon v-else name="kind-icon:palette" class="h-4 w-4" />
                  Get Art Image
                </button>
              </div>
            </div>
          </div>

          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="font-bold">
                  Sample lines
                  <span class="badge badge-neutral badge-sm ml-1">{{
                    examples.length
                  }}</span>
                </h2>
                <p class="text-xs opacity-60">
                  More room, more weird little gems.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-xs btn-outline rounded-2xl"
                @click="addExample"
              >
                <icon name="kind-icon:plus" class="h-3 w-3" />
                Add line
              </button>
            </div>

            <transition-group
              name="example-list"
              tag="div"
              class="grid grid-cols-1 gap-2 lg:grid-cols-2"
            >
              <div
                v-for="(_, index) in examples"
                :key="`ex-${index}`"
                class="group grid grid-cols-[auto_1fr_auto] items-start gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
              >
                <span class="pt-2.5 text-right font-mono text-xs opacity-40">
                  {{ index + 1 }}
                </span>

                <textarea
                  v-model="examples[index]"
                  class="textarea textarea-bordered textarea-sm min-h-20 resize-y rounded-xl font-mono text-xs"
                  :placeholder="`Sample line ${index + 1}`"
                  @input="markEdited"
                />

                <button
                  type="button"
                  class="btn btn-xs btn-square btn-ghost rounded-xl text-error opacity-60 transition-opacity group-hover:opacity-100"
                  @click="removeExample(index)"
                >
                  <icon name="kind-icon:close" class="h-3 w-3" />
                </button>
              </div>
            </transition-group>
          </section>

          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="font-bold">Generate lines</h2>
                <p class="text-xs opacity-60">
                  Uses the title, pitch, instructions, and sample lines above.
                </p>
              </div>

              <button
                type="button"
                class="btn btn-info rounded-2xl"
                :disabled="pitchStore.loading || !canGenerate"
                @click="generateBrainstorm"
              >
                <span
                  v-if="pitchStore.loading"
                  class="loading loading-spinner loading-sm"
                />
                <icon v-else name="kind-icon:brain" class="h-4 w-4" />
                {{ pitchStore.loading ? 'Generating...' : 'Generate Lines' }}
              </button>
            </div>

            <div v-if="apiLines.length" class="mt-3 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="font-bold text-info">
                  AI candidates
                  <span class="badge badge-info badge-sm ml-1">{{
                    apiLines.length
                  }}</span>
                </h3>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-xs btn-info rounded-2xl"
                    @click="acceptAllLines"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs btn-secondary rounded-2xl"
                    @click="saveLinesAsPitch"
                  >
                    Save as pitch
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <div
                  v-for="(line, index) in apiLines"
                  :key="`ai-${index}`"
                  class="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-base-300 bg-base-100 p-2"
                >
                  <p class="text-sm">{{ line }}</p>

                  <button
                    type="button"
                    class="btn btn-xs btn-primary rounded-xl"
                    @click="acceptLine(line)"
                  >
                    Keep
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else-if="statusMessage && !pitchStore.loading"
              class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
              :class="
                lastActionSuccess ? 'border-success/40' : 'border-warning/60'
              "
            >
              {{ statusMessage }}
            </div>
          </section>
        </div>
      </main>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p
                class="text-xs font-semibold uppercase tracking-wider opacity-50"
              >
                Controls
              </p>
              <h2 class="font-bold">Pitch settings</h2>
            </div>
            <span :class="sourceBadgeClass(activeCreationSource)">{{
              activeCreationSource
            }}</span>
          </div>
        </div>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <label class="form-control">
            <div class="label py-0.5">
              <span class="label-text text-xs">Creation source</span>
            </div>
            <select
              v-model="activeCreationSource"
              class="select select-sm select-bordered rounded-2xl"
              @change="markEdited"
            >
              <option
                v-for="source in creationSources"
                :key="source"
                :value="source"
              >
                {{ source }}
              </option>
            </select>
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label class="form-control">
              <div class="label py-0.5">
                <span class="label-text text-xs">Requests</span>
              </div>
              <input
                v-model.number="pitchStore.numberOfRequests"
                type="number"
                min="1"
                max="10"
                class="input input-sm input-bordered rounded-2xl"
              />
            </label>

            <label class="form-control">
              <div class="label py-0.5">
                <span class="label-text text-xs">Max tokens</span>
              </div>
              <input
                v-model.number="pitchStore.maxTokens"
                type="number"
                min="100"
                max="3000"
                step="100"
                class="input input-sm input-bordered rounded-2xl"
              />
            </label>
          </div>

          <label class="form-control">
            <div class="label py-0.5">
              <span class="label-text text-xs">Temperature</span>
              <span class="label-text-alt font-mono font-bold">{{
                pitchStore.temperature.toFixed(1)
              }}</span>
            </div>
            <input
              v-model.number="pitchStore.temperature"
              type="range"
              min="0.1"
              max="1.5"
              step="0.1"
              class="range range-sm range-primary"
            />
          </label>

          <div class="grid grid-cols-2 gap-2">
            <label
              class="label cursor-pointer justify-start gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="pitchForm.isPublic"
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                @change="markEdited"
              />
              <span class="label-text text-sm">Public</span>
            </label>

            <label
              class="label cursor-pointer justify-start gap-2 rounded-2xl border border-base-300 bg-base-200 px-3 py-2"
            >
              <input
                v-model="pitchForm.isMature"
                type="checkbox"
                class="checkbox checkbox-warning checkbox-sm"
                @change="markEdited"
              />
              <span class="label-text text-sm">Mature</span>
            </label>
          </div>

          <div class="divider my-0" />

          <button
            type="button"
            class="btn btn-primary w-full rounded-2xl"
            :disabled="isSaving || !canSave"
            @click="savePitch"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-sm" />
            <icon v-else name="kind-icon:save" class="h-4 w-4" />
            {{ selectedPitch ? 'Update Pitch' : 'Create Pitch' }}
          </button>

          <button
            v-if="selectedPitch"
            type="button"
            class="btn btn-error btn-outline w-full rounded-2xl"
            :disabled="isSaving"
            @click="deleteSelectedPitch"
          >
            <icon name="kind-icon:trash" class="h-4 w-4" />
            Delete Pitch
          </button>

          <div
            v-if="statusMessage"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-sm"
            :class="
              lastActionSuccess ? 'border-success/40' : 'border-warning/60'
            "
          >
            {{ statusMessage }}
          </div>
        </div>
      </aside>
    </div>

    <div
      v-else-if="activeSection === 'gallery'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[320px_1fr]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 space-y-2 border-b border-base-300 p-3">
          <input
            v-model="searchQuery"
            class="input input-sm input-bordered w-full rounded-2xl"
            placeholder="Search pitches..."
          />

          <select
            v-model="selectedType"
            class="select select-sm select-bordered w-full rounded-2xl"
          >
            <option value="">All types</option>
            <option
              v-for="type in pitchStore.pitchTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>

          <button
            type="button"
            class="btn btn-sm btn-secondary w-full rounded-2xl"
            @click="startFreshPitch"
          >
            <icon name="kind-icon:plus" class="h-4 w-4" />
            Add Brainstorm
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
          <button
            v-for="pitch in filteredPitches"
            :key="pitch.id"
            type="button"
            class="w-full rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-200"
            :class="
              selectedPitch?.id === pitch.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-100'
            "
            @click="selectPitch(pitch.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <h2 class="line-clamp-1 text-sm font-bold">
                {{ pitch.title || 'Untitled' }}
              </h2>
              <span class="badge badge-xs shrink-0">{{ pitch.PitchType }}</span>
            </div>

            <p class="mt-0.5 line-clamp-2 text-xs opacity-70">
              {{ pitch.pitch }}
            </p>

            <div class="mt-1.5 flex flex-wrap gap-1">
              <span :class="sourceBadgeClass(getPitchSource(pitch))">{{
                getPitchSource(pitch)
              }}</span>
              <span v-if="pitch.isPublic" class="badge badge-success badge-xs"
                >public</span
              >
              <span v-else class="badge badge-warning badge-xs">private</span>
            </div>
          </button>
        </div>
      </aside>

      <main
        class="min-h-0 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div
          v-if="selectedPitch"
          class="space-y-3 rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-2xl font-bold">
              {{ selectedPitch.title || 'Untitled Brainstorm' }}
            </h2>
            <span :class="sourceBadgeClass(getPitchSource(selectedPitch))">{{
              getPitchSource(selectedPitch)
            }}</span>
          </div>

          <p class="text-sm opacity-80">{{ selectedPitch.pitch }}</p>
          <p v-if="selectedPitch.description" class="text-sm opacity-70">
            {{ selectedPitch.description }}
          </p>
          <p
            v-if="selectedPitch.flavorText"
            class="rounded-2xl bg-base-100 p-3 text-sm italic opacity-80"
          >
            {{ selectedPitch.flavorText }}
          </p>

          <div class="flex flex-wrap gap-2">
            <span class="badge badge-outline">{{
              selectedPitch.PitchType
            }}</span>
            <span v-if="selectedPitch.isPublic" class="badge badge-success"
              >public</span
            >
            <span v-else class="badge badge-warning">private</span>
            <span v-if="selectedPitch.isMature" class="badge badge-error"
              >mature</span
            >
          </div>

          <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <h3 class="mb-2 font-bold">Examples</h3>
            <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <p
                v-for="(example, index) in splitExamples(
                  selectedPitch.examples,
                )"
                :key="`gallery-example-${index}`"
                class="rounded-xl bg-base-200 p-2 text-sm"
              >
                {{ example }}
              </p>
            </div>
          </section>

          <section
            v-if="pitchPrompts.length"
            class="rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <h3 class="mb-2 font-bold">Linked prompts</h3>
            <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <button
                v-for="prompt in pitchPrompts"
                :key="prompt.id"
                type="button"
                class="rounded-xl border border-base-300 bg-base-200 p-2 text-left text-xs transition hover:border-primary"
                @click="selectPrompt(prompt.id)"
              >
                <div class="mb-1 flex flex-wrap items-center gap-1">
                  <span :class="sourceBadgeClass(getPromptSource(prompt))">{{
                    getPromptSource(prompt)
                  }}</span>
                  <span class="opacity-50">#{{ prompt.id }}</span>
                </div>
                <p class="line-clamp-3">{{ prompt.prompt }}</p>
              </button>
            </div>
          </section>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-primary rounded-2xl"
              @click="activeSection = 'add'"
            >
              <icon name="kind-icon:edit" class="h-4 w-4" />
              Edit selected
            </button>

            <button
              type="button"
              class="btn btn-info rounded-2xl"
              @click="generateBrainstorm"
            >
              <icon name="kind-icon:brain" class="h-4 w-4" />
              Generate from this
            </button>
          </div>
        </div>

        <div
          v-else
          class="flex h-full min-h-80 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center"
        >
          <icon name="kind-icon:tap" class="h-10 w-10 opacity-40" />
          <h2 class="text-xl font-bold">Pick a brainstorm</h2>
          <p class="max-w-md text-sm opacity-70">
            Choose a pitch from the gallery list, then edit, generate from it,
            or admire it like a tiny idea dragon.
          </p>
        </div>
      </main>
    </div>

    <div
      v-else-if="activeSection === 'prompts'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[340px_1fr]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-3">
          <h2 class="font-bold">Prompt Builder</h2>
          <p class="text-xs opacity-70">
            PromptStore handles reusable prompt fragments and local prompt
            state.
          </p>
        </div>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <label class="form-control">
            <div class="label py-1">
              <span class="label-text text-xs">Prompt fragment</span>
            </div>
            <textarea
              v-model="promptStore.promptField"
              class="textarea textarea-bordered min-h-28 rounded-2xl"
              placeholder="Add a reusable prompt fragment..."
            />
          </label>

          <button
            type="button"
            class="btn btn-secondary w-full rounded-2xl"
            :disabled="!promptStore.promptField.trim()"
            @click="addPromptFragment"
          >
            <icon name="kind-icon:plus" class="h-4 w-4" />
            Add Fragment
          </button>

          <div class="space-y-2">
            <div
              v-for="(fragment, index) in promptStore.promptArray"
              :key="`fragment-${index}`"
              class="grid grid-cols-[1fr_auto] gap-2 rounded-2xl border border-base-300 bg-base-200 p-2"
            >
              <p class="text-xs">{{ fragment }}</p>
              <button
                type="button"
                class="btn btn-xs btn-square btn-ghost text-error"
                @click="promptStore.removePromptFromArray(index)"
              >
                <icon name="kind-icon:close" class="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 p-3">
          <h2 class="font-bold">Prompt Output</h2>
        </div>

        <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <label class="form-control">
            <div class="label py-1">
              <span class="label-text text-xs">Final prompt string</span>
            </div>
            <textarea
              :value="promptStore.finalPromptString"
              class="textarea textarea-bordered min-h-32 rounded-2xl font-mono text-xs"
              readonly
            />
          </label>

          <label class="form-control">
            <div class="label py-1">
              <span class="label-text text-xs">Current prompt</span>
            </div>
            <textarea
              v-model="promptStore.currentPrompt"
              class="textarea textarea-bordered min-h-32 rounded-2xl font-mono text-xs"
              placeholder="Write or paste a prompt..."
            />
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-outline rounded-2xl"
              :disabled="!promptStore.currentPrompt.trim()"
              @click="cleanCurrentPrompt"
            >
              <icon name="kind-icon:broom" class="h-4 w-4" />
              Clean
            </button>

            <button
              type="button"
              class="btn btn-info rounded-2xl"
              :disabled="
                promptStore.isStreaming || !promptStore.currentPrompt.trim()
              "
              @click="streamCurrentPrompt"
            >
              <span
                v-if="promptStore.isStreaming"
                class="loading loading-spinner loading-sm"
              />
              <icon v-else name="kind-icon:magic" class="h-4 w-4" />
              Stream Completion
            </button>

            <button
              type="button"
              class="btn btn-primary rounded-2xl"
              :disabled="!promptStore.currentPrompt.trim()"
              @click="saveCurrentPrompt"
            >
              <icon name="kind-icon:save" class="h-4 w-4" />
              Save Prompt
            </button>
          </div>

          <section
            v-if="promptStore.streamedText"
            class="rounded-2xl border border-info bg-info/10 p-3"
          >
            <h3 class="mb-2 font-bold text-info">Streamed response</h3>
            <p class="whitespace-pre-wrap text-sm">
              {{ promptStore.streamedText }}
            </p>
          </section>

          <section
            v-if="promptStore.selectedPrompt"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <h3 class="mb-2 font-bold">Selected prompt</h3>
            <p class="whitespace-pre-wrap text-sm">
              {{ promptStore.selectedPrompt.prompt }}
            </p>
          </section>
        </div>
      </main>
    </div>

    <div
      v-else
      class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <server-manager class="h-full w-full" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { usePitchStore, PitchType } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

type BrainstormSection = 'add' | 'gallery' | 'prompts' | 'server'
type CreationSourceType = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'

type ActionResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const userStore = useUserStore()

const creationSources: CreationSourceType[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]
const sections: { key: BrainstormSection; label: string; icon: string }[] = [
  { key: 'add', label: 'Builder', icon: 'kind-icon:plus' },
  { key: 'gallery', label: 'Gallery', icon: 'kind-icon:gallery' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:prompt' },
  { key: 'server', label: 'Server', icon: 'kind-icon:server' },
]

const defaultBrainstormSeed = {
  title: 'Vanderbilt Lacrosse',
  pitch:
    'Vanderbilt Lacrosse is an absurdly wealthy person completely disconnected from reality and normal human experience.',
  description:
    "Create short one-liner humor bits describing Vanderbilt Lacrosse's life. Keep them punchy, specific, surreal, and easy to edit.",
  imagePrompt:
    'A satirical portrait of Vanderbilt Lacrosse, an absurdly wealthy aristocrat surrounded by impossible luxury, surreal comedy, gilded nonsense, cinematic lighting',
  flavorText:
    'A billionaire so disconnected from reality that reality sends him invoices.',
  examples: [
    'Vanderbilt Lacrosse got back 2 million dollars on his last income tax.',
    'Vanderbilt Lacrosse owns three planets.',
    'Vanderbilt Lacrosse has personally killed 12 dinosaurs.',
    "When Vanderbilt Lacrosse's money gets dirty, he throws it away.",
  ],
}

const activeSection = ref<BrainstormSection>('add')
const searchQuery = ref('')
const selectedType = ref<string>('')
const examples = ref<string[]>(defaultExamples())
const isSaving = ref(false)
const isGeneratingArt = ref(false)
const statusMessage = ref('')
const lastActionSuccess = ref(true)
const hasHumanEdits = ref(false)
const generatedThisSession = ref(false)
const activeCreationSource = ref<CreationSourceType>('HUMAN')

const pitchForm = reactive<Partial<Pitch>>({
  title: defaultBrainstormSeed.title,
  pitch: defaultBrainstormSeed.pitch,
  description: defaultBrainstormSeed.description,
  flavorText: defaultBrainstormSeed.flavorText,
  imagePrompt: defaultBrainstormSeed.imagePrompt,
  PitchType: PitchType.TITLE,
  isPublic: true,
  isMature: false,
})

const selectedPitch = computed(() => pitchStore.selectedPitch as Pitch | null)

const filteredPitches = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return pitchStore.pitches.filter((pitch) => {
    const matchesType = selectedType.value
      ? pitch.PitchType === selectedType.value
      : true
    if (!matchesType) return false
    if (!query) return true

    const haystack = [
      pitch.title,
      pitch.pitch,
      pitch.description,
      pitch.examples,
      pitch.flavorText,
      pitch.imagePrompt,
      getPitchSource(pitch),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const pitchPrompts = computed(() => {
  const pitchId = selectedPitch.value?.id
  if (!pitchId) return []
  return promptStore.prompts.filter((prompt) => prompt.pitchId === pitchId)
})

const apiLines = computed(() => parseLines(pitchStore.apiResponse))

const canSave = computed(() =>
  Boolean(pitchForm.pitch?.trim() && pitchForm.title?.trim()),
)
const canGenerate = computed(() =>
  Boolean(pitchForm.title?.trim() && pitchForm.pitch?.trim()),
)

watch(
  selectedPitch,
  (pitch) => {
    if (!pitch) return

    pitchForm.title = pitch.title ?? ''
    pitchForm.pitch = pitch.pitch ?? ''
    pitchForm.description = pitch.description ?? ''
    pitchForm.flavorText = pitch.flavorText ?? ''
    pitchForm.imagePrompt = pitch.imagePrompt ?? ''
    pitchForm.PitchType = pitch.PitchType
    pitchForm.isPublic = pitch.isPublic
    pitchForm.isMature = pitch.isMature
    activeCreationSource.value = getPitchSource(pitch)
    examples.value = splitExamples(pitch.examples)
    hasHumanEdits.value = false
    generatedThisSession.value = false
    promptStore.setPromptsFromString(buildPromptFragmentString())
  },
  { immediate: true },
)

onMounted(async () => {
  await Promise.all([pitchStore.initialize(), promptStore.initialize()])
  promptStore.setPromptsFromString(buildPromptFragmentString())
})

function selectPitch(pitchId: number) {
  pitchStore.setSelectedPitch(pitchId)
  pitchStore.setSelectedTitle(pitchId)
}

function startFreshPitch() {
  pitchStore.selectedPitch = null
  pitchStore.selectedTitle = null

  Object.assign(pitchForm, {
    title: defaultBrainstormSeed.title,
    pitch: defaultBrainstormSeed.pitch,
    description: defaultBrainstormSeed.description,
    flavorText: defaultBrainstormSeed.flavorText,
    imagePrompt: defaultBrainstormSeed.imagePrompt,
    PitchType: PitchType.TITLE,
    isPublic: true,
    isMature: false,
  })

  examples.value = defaultExamples()
  pitchStore.apiResponse = ''
  promptStore.currentPrompt = defaultBrainstormSeed.imagePrompt
  promptStore.setPromptsFromString(buildPromptFragmentString())
  activeCreationSource.value = 'HUMAN'
  statusMessage.value = ''
  hasHumanEdits.value = false
  generatedThisSession.value = false
  activeSection.value = 'add'
}

function markEdited() {
  hasHumanEdits.value = true
  if (generatedThisSession.value && activeCreationSource.value === 'AI') {
    activeCreationSource.value = 'HYBRID'
  }
}

function addExample() {
  examples.value.push('')
  markEdited()
}

function removeExample(index: number) {
  examples.value.splice(index, 1)
  if (!examples.value.length) examples.value.push('')
  markEdited()
}

function acceptLine(line: string) {
  examples.value.push(line)
  generatedThisSession.value = true
  activeCreationSource.value =
    activeCreationSource.value === 'HUMAN'
      ? 'HYBRID'
      : activeCreationSource.value
  markEdited()
}

function acceptAllLines() {
  apiLines.value.forEach(acceptLine)
  setAction('Accepted generated lines.', true)
}

async function generateBrainstorm() {
  if (!canGenerate.value) return

  pitchStore.apiResponse = ''
  pitchStore.selectedTitle = buildPitchContext()
  pitchStore.exampleString = joinExamples(examples.value)
  setAction('Generating lines...', true)

  try {
    const result =
      (await pitchStore.fetchBrainstormPitches()) as ActionResult<string> | void
    const responseText = pitchStore.apiResponse?.trim() || result?.data || ''

    if (responseText.trim()) {
      generatedThisSession.value = true
      activeCreationSource.value = hasHumanEdits.value ? 'HYBRID' : 'AI'
      setAction(
        `Generated ${parseLines(responseText).length || 1} line(s).`,
        true,
      )
      return
    }

    setAction(
      result?.message ||
        'No brainstorm lines returned. Check /api/botcafe/brainstorm.',
      false,
    )
  } catch (error) {
    setAction(
      error instanceof Error ? error.message : 'Brainstorm request failed.',
      false,
    )
  }
}

async function savePitch() {
  if (!canSave.value) return

  isSaving.value = true
  setAction('Saving pitch...', true)

  const payload = buildPitchPayload()
  const result = selectedPitch.value
    ? await pitchStore.updatePitch(selectedPitch.value.id, payload)
    : await pitchStore.createPitch(payload)

  if (result.success) {
    await pitchStore.fetchPitches(true)

    if (!selectedPitch.value && 'data' in result && result.data?.id) {
      pitchStore.setSelectedPitch(result.data.id)
      pitchStore.setSelectedTitle(result.data.id)
    }

    hasHumanEdits.value = false
    generatedThisSession.value = false
    setAction(selectedPitch.value ? 'Pitch updated.' : 'Pitch created.', true)
  } else {
    setAction(result.message || 'Save failed.', false)
  }

  isSaving.value = false
}

async function saveLinesAsPitch() {
  const lines = joinExamples(apiLines.value)
  if (!lines) {
    setAction('No generated lines to save.', false)
    return
  }

  isSaving.value = true

  const result = await pitchStore.createPitch({
    ...buildPitchPayload(),
    pitch: lines,
    examples: lines,
    PitchType: PitchType.BRAINSTORM,
    creationSource: 'AI' as never,
  })

  if (result.success && result.data) {
    await pitchStore.fetchPitches(true)
    pitchStore.setSelectedPitch(result.data.id)
    pitchStore.setSelectedTitle(result.data.id)
    setAction('Generated lines saved as a brainstorm pitch.', true)
  } else {
    setAction(
      result.message || 'Could not save generated lines as pitch.',
      false,
    )
  }

  isSaving.value = false
}

async function generateArtImage() {
  const prompt = pitchForm.imagePrompt?.trim()
  if (!prompt) return

  isGeneratingArt.value = true
  setAction('Requesting art image...', true)

  try {
    const response = await performFetch<unknown>('/api/art/image', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        pitchId: selectedPitch.value?.id,
        userId: userStore.userId,
        title: pitchForm.title,
        imagePrompt: prompt,
      }),
    })

    setAction(
      response.success
        ? 'Art image requested.'
        : response.message || 'Art image request failed.',
      response.success,
    )
  } catch (error) {
    setAction(
      error instanceof Error ? error.message : 'Art image request failed.',
      false,
    )
  } finally {
    isGeneratingArt.value = false
  }
}

async function saveCurrentPrompt() {
  const prompt = promptStore.currentPrompt.trim()
  if (!prompt) return
  await createLinkedPrompt(
    prompt,
    selectedPitch.value?.id,
    selectedPitch.value ? 'HYBRID' : 'HUMAN',
  )
}

async function createLinkedPrompt(
  prompt: string,
  pitchId?: number,
  creationSource: CreationSourceType = 'HUMAN',
) {
  const response = await performFetch<Prompt>('/api/prompts', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      pitchId,
      userId: userStore.userId,
      creationSource,
    }),
  })

  if (!response.success || !response.data) {
    setAction(response.message || 'Prompt save failed.', false)
    return
  }

  promptStore.prompts.push(response.data)
  promptStore.selectedPrompt = response.data
  promptStore.currentPrompt = prompt
  promptStore.syncToLocalStorage()
  setAction('Prompt saved.', true)
}

async function deleteSelectedPitch() {
  if (!selectedPitch.value) return

  isSaving.value = true
  const result = await pitchStore.deletePitch(selectedPitch.value.id)
  setAction(result.message, result.success)
  if (result.success) startFreshPitch()
  isSaving.value = false
}

function addPromptFragment() {
  const fragment = promptStore.promptField.trim()
  if (!fragment) return

  promptStore.addPromptToArray(fragment)
  promptStore.currentPrompt = promptStore.finalPromptString
  promptStore.promptField = ''
  promptStore.syncToLocalStorage()
}

function cleanCurrentPrompt() {
  promptStore.currentPrompt = promptStore.processPromptPlaceholders(
    promptStore.currentPrompt,
  )
  promptStore.syncToLocalStorage()
}

async function streamCurrentPrompt() {
  const prompt = promptStore.currentPrompt.trim()
  if (!prompt) return

  setAction('Streaming prompt completion...', true)
  await promptStore.streamPromptCompletion(prompt)

  if (promptStore.streamedText.trim()) {
    promptStore.currentPrompt = promptStore.streamedText.trim()
    promptStore.syncToLocalStorage()
    setAction('Prompt completion received.', true)
    return
  }

  setAction('No streamed text returned.', false)
}

async function selectPrompt(promptId: number) {
  await promptStore.selectPrompt(promptId)

  if (promptStore.selectedPrompt) {
    promptStore.currentPrompt = promptStore.selectedPrompt.prompt
    activeSection.value = 'prompts'
  }
}

function buildPitchPayload(): Partial<Pitch> {
  return {
    title: pitchForm.title?.trim(),
    pitch: pitchForm.pitch?.trim(),
    description: pitchForm.description?.trim() || undefined,
    flavorText: pitchForm.flavorText?.trim() || undefined,
    imagePrompt: pitchForm.imagePrompt?.trim() || undefined,
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId,
    examples: joinExamples(examples.value) || undefined,
    creationSource: activeCreationSource.value as never,
  }
}

type ApiLineObject = {
  text?: unknown
  content?: unknown
  message?: unknown
  data?: unknown
  title?: unknown
  pitch?: unknown
  description?: unknown
}

function isApiLineObject(value: unknown): value is ApiLineObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringifyLineSource(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') return value

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyLineSource(item))
      .filter(Boolean)
      .join('\n')
  }

  if (isApiLineObject(value)) {
    const directPitchParts = [value.title, value.pitch, value.description]
      .map((part) => stringifyLineSource(part).trim())
      .filter(Boolean)

    if (directPitchParts.length) {
      return directPitchParts.join(': ')
    }

    return stringifyLineSource(
      value.text ?? value.content ?? value.message ?? value.data,
    )
  }

  return String(value)
}

function parseLines(value?: unknown): string[] {
  return stringifyLineSource(value)
    .split('\n')
    .flatMap((line) => line.split(/(?<=\.)\s+(?=[A-Z])/))
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
}

function splitExamples(value?: unknown): string[] {
  const parsed = stringifyLineSource(value)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)

  return parsed.length ? parsed : defaultExamples()
}

function buildPitchContext(): Pitch {
  return {
    ...(selectedPitch.value ?? {}),
    id: selectedPitch.value?.id ?? 0,
    title: pitchForm.title ?? '',
    pitch: pitchForm.pitch ?? '',
    description: pitchForm.description ?? '',
    examples: joinExamples(examples.value),
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId,
    creationSource: activeCreationSource.value,
  } as Pitch
}

function buildPromptFragmentString() {
  return [
    `Title: ${pitchForm.title || defaultBrainstormSeed.title}`,
    `Premise: ${pitchForm.pitch || defaultBrainstormSeed.pitch}`,
    `Instructions: ${pitchForm.description || defaultBrainstormSeed.description}`,
    `Examples: ${joinExamples(examples.value)}`,
  ].join(' | ')
}

function joinExamples(arr: string[]): string {
  return arr
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' | ')
}

function defaultExamples(): string[] {
  return [...defaultBrainstormSeed.examples]
}

function getPitchSource(pitch: Pitch): CreationSourceType {
  return (
    (pitch as Pitch & { creationSource?: CreationSourceType }).creationSource ??
    'UNKNOWN'
  )
}

function getPromptSource(prompt: Prompt): CreationSourceType {
  return (
    (prompt as Prompt & { creationSource?: CreationSourceType })
      .creationSource ?? 'UNKNOWN'
  )
}

function sourceBadgeClass(source: CreationSourceType): string {
  return (
    {
      HUMAN: 'badge badge-success badge-xs',
      AI: 'badge badge-info badge-xs',
      HYBRID: 'badge badge-warning badge-xs',
      UPLOAD: 'badge badge-secondary badge-xs',
      UNKNOWN: 'badge badge-ghost badge-xs',
    }[source] ?? 'badge badge-ghost badge-xs'
  )
}

function setAction(message: string, success = true) {
  statusMessage.value = message
  lastActionSuccess.value = success
}
</script>

<style scoped>
.example-list-enter-active,
.example-list-leave-active {
  transition: all 0.15s ease;
}

.example-list-enter-from,
.example-list-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
