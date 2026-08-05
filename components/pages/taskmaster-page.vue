<!-- /components/pages/taskmaster-page.vue -->
<!-- Taskmaster turns real work into a second-person narrative while keeping
     every real-world write explicit and reviewable. Art direction is automatic;
     users choose story ingredients, never image-model settings. -->
<template>
  <section
    class="kr-surface taskmaster-shell min-h-0 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 sm:p-4"
  >
    <header
      class="flex shrink-0 items-start gap-3 border-b border-base-300 pb-3"
    >
      <div
        class="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary shadow-sm"
      >
        <Icon name="kind-icon:gearhammer" class="size-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p
          class="text-[0.65rem] font-black uppercase tracking-[0.18em] text-secondary"
        >
          Taskmaster
        </p>
        <h2 class="text-xl font-black leading-tight sm:text-2xl">
          Turn the next real thing into a quest
        </h2>
        <p class="mt-1 max-w-2xl text-xs leading-relaxed text-base-content/60">
          The story adds momentum. The real objective stays honest, visible, and
          under your control.
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap justify-end gap-2">
        <span
          class="badge badge-success badge-outline hidden h-auto gap-1.5 rounded-xl px-2.5 py-1.5 text-[0.65rem] font-bold sm:flex"
        >
          <Icon name="kind-icon:shield" class="size-3.5" />
          Nothing changes without approval
        </span>
        <button
          v-if="store.session"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          :disabled="store.isWeaving"
          @click="startOver"
        >
          <Icon name="kind-icon:wand" class="size-4" />
          <span class="hidden sm:inline">New quest</span>
        </button>
      </div>
    </header>

    <!-- SETUP: one document scroll, objective first, optional story recipe second. -->
    <div v-if="!store.session" class="space-y-3">
      <nav
        class="flex items-center gap-2 overflow-hidden text-[0.7rem] font-bold"
        aria-label="Quest setup progress"
      >
        <span class="flex items-center gap-1.5 text-base-content">
          <span
            class="flex size-6 items-center justify-center rounded-full bg-secondary text-secondary-content"
          >
            1
          </span>
          Objective
        </span>
        <span class="h-px min-w-5 max-w-14 flex-1 bg-base-300" />
        <span class="flex items-center gap-1.5 text-base-content/45">
          <span
            class="flex size-6 items-center justify-center rounded-full border border-base-300 bg-base-200"
          >
            2
          </span>
          Recipe
        </span>
        <span class="h-px min-w-5 max-w-14 flex-1 bg-base-300" />
        <span class="flex items-center gap-1.5 text-base-content/45">
          <span
            class="flex size-6 items-center justify-center rounded-full border border-base-300 bg-base-200"
          >
            3
          </span>
          Review
        </span>
      </nav>

      <div
        class="grid items-start gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
      >
        <section
          class="space-y-3 rounded-2xl border border-base-300 bg-base-200/35 p-3 sm:p-4"
        >
          <div>
            <p
              class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-base-content/55"
            >
              The real objective
            </p>
            <textarea
              v-model="taskInput"
              rows="4"
              class="textarea textarea-bordered mt-2 w-full resize-none rounded-2xl bg-base-100 text-base font-semibold leading-relaxed sm:text-lg"
              placeholder="Clean the garage, finish the proposal, decide which feature ships next…"
              :disabled="store.isWeaving"
            />
          </div>

          <label class="form-control w-full">
            <div class="label py-1">
              <span
                class="label-text text-[0.68rem] font-black uppercase tracking-[0.12em] text-base-content/55"
              >
                Project or task source
                <span class="font-normal normal-case tracking-normal">(optional)</span>
              </span>
            </div>
            <select
              v-model="selectedProjectSlug"
              class="select select-bordered w-full rounded-xl bg-base-100"
              :disabled="store.isWeaving"
            >
              <option value="">No linked project</option>
              <option
                v-for="project in projectStore.activeProjects"
                :key="project.slug ?? project.id"
                :value="project.slug"
              >
                {{ project.title || project.slug }}
              </option>
            </select>
          </label>

          <div class="border-t border-base-300 pt-3">
            <div class="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p class="text-sm font-black">Need a spark?</p>
                <p class="text-xs text-base-content/50">
                  Start from a real task, a decision, or something around the house.
                </p>
              </div>
              <span class="badge badge-warning badge-outline badge-sm rounded-xl">
                Human gates stay explicit
              </span>
            </div>
            <TaskmasterSampleTasks class="taskmaster-samples" />
          </div>
        </section>

        <aside
          class="space-y-4 rounded-2xl border border-base-300 bg-base-200/35 p-3 sm:p-4"
        >
          <div>
            <p
              class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-base-content/55"
            >
              Quest recipe
            </p>
            <p class="mt-1 text-xs leading-relaxed text-base-content/50">
              Set the flavor without exposing image-model machinery.
            </p>
          </div>

          <div class="space-y-2">
            <p
              class="text-[0.68rem] font-black uppercase tracking-[0.12em] text-base-content/55"
            >
              Tone
            </p>
            <kr-choice-list
              layout="row"
              label="Tone"
              :choices="toneChoices"
              :selected-key="selectedTone"
              :disabled="store.isWeaving"
              :show-index="false"
              @select="selectedTone = $event.key as TaskmasterTone"
            />
          </div>

          <details
            class="group rounded-2xl border border-base-300 bg-base-100"
          >
            <summary
              class="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
              >
                <Icon name="kind-icon:dream" class="size-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block text-[0.65rem] font-black uppercase tracking-[0.12em] text-base-content/45"
                >
                  Setting
                </span>
                <span class="block truncate text-sm font-bold">
                  {{ selectedLocationLabel }}
                </span>
              </span>
              <Icon
                name="kind-icon:chevron-down"
                class="size-4 text-base-content/45 transition-transform group-open:rotate-180"
              />
            </summary>
            <div class="border-t border-base-300 p-3">
              <NarrativeIngredientPicker
                v-model="selectedLocationSlug"
                :items="locationOptions"
                label="Setting"
                helper="Choose a reusable LOCATION Dream. Artwork is shown when the location already has it."
                empty-label="Anywhere"
                empty-description="Let Taskmaster choose a setting that fits the objective and tone."
                empty-icon="kind-icon:dream"
                empty-state="No active LOCATION Dreams are available yet."
                :disabled="store.isWeaving"
                :loading="dreamStore.loading"
                :error="dreamStore.error"
                :initial-limit="5"
              />
            </div>
          </details>

          <details
            class="group rounded-2xl border border-base-300 bg-base-100"
          >
            <summary
              class="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden"
            >
              <span
                class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info"
              >
                <Icon name="kind-icon:story" class="size-5" />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  class="block text-[0.65rem] font-black uppercase tracking-[0.12em] text-base-content/45"
                >
                  Genre, mood, and style
                </span>
                <span class="block truncate text-sm font-bold">
                  {{ selectedGrammarLabel }}
                </span>
              </span>
              <Icon
                name="kind-icon:chevron-down"
                class="size-4 text-base-content/45 transition-transform group-open:rotate-180"
              />
            </summary>
            <div class="border-t border-base-300 p-3">
              <NarrativeIngredientPicker
                v-model="selectedGrammarSlug"
                :items="grammarOptions"
                label="Genre, mood, and style"
                helper="Choose from the canonical Facet library. Cards use Facet artwork first and fall back to the Facet icon."
                empty-label="Any adventure"
                empty-description="Let Taskmaster choose the genre and story grammar automatically."
                empty-icon="kind-icon:story"
                empty-state="No active narrative Facets are available yet."
                :disabled="store.isWeaving"
                :loading="facetStore.loading"
                :error="facetStore.error"
                :initial-limit="8"
              />
            </div>
          </details>

          <label class="form-control w-full">
            <div class="label py-1">
              <span
                class="label-text text-[0.68rem] font-black uppercase tracking-[0.12em] text-base-content/55"
              >
                Extra flavor
                <span class="font-normal normal-case tracking-normal">(optional)</span>
              </span>
            </div>
            <input
              v-model="vibeInput"
              type="text"
              placeholder="storm-lit, clockwork, defiant"
              class="input input-bordered w-full rounded-xl bg-base-100"
              :disabled="store.isWeaving"
            />
          </label>

          <div
            class="flex items-start gap-2 rounded-xl border border-success/20 bg-success/5 p-2.5 text-[0.7rem] leading-relaxed text-base-content/60"
          >
            <Icon name="kind-icon:shield" class="mt-0.5 size-4 shrink-0 text-success" />
            <p>
              Story answers become proposed progress. Real updates still require an
              explicit <strong>Apply</strong> action.
            </p>
          </div>
        </aside>
      </div>

      <p v-if="store.errorMessage" class="text-xs text-error">
        {{ store.errorMessage }}
      </p>

      <footer
        class="sticky bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-lg backdrop-blur"
      >
        <p class="min-w-48 flex-1 text-xs leading-relaxed text-base-content/55">
          Next: review a practical checkpoint plan before the story begins.
        </p>
        <button
          type="button"
          class="btn btn-ghost rounded-xl border border-base-300 bg-base-200"
          :disabled="store.isWeaving || !canBegin"
          @click="begin(true)"
        >
          <Icon name="kind-icon:wand" class="size-4" /> Surprise me
        </button>
        <button
          type="button"
          class="btn btn-secondary rounded-xl"
          :disabled="store.isWeaving || !canBegin"
          @click="begin(false)"
        >
          <span v-if="store.isWeaving" class="loading loading-dots loading-sm" />
          <template v-else>
            Build my quest
            <Icon name="kind-icon:chevron-right" class="size-4" />
          </template>
        </button>
        <p
          v-if="!canBegin"
          class="w-full text-right text-[0.7rem] text-base-content/45"
        >
          Enter an objective or choose a linked project to begin.
        </p>
      </footer>
    </div>

    <!-- PLAN REVIEW: practical actions dominate; story flavor becomes context. -->
    <div
      v-else-if="store.session.status === 'draft'"
      class="grid items-start gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]"
    >
      <section
        class="space-y-3 rounded-2xl border border-secondary/25 bg-secondary/5 p-3 sm:p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-secondary/75"
            >
              Review the practical plan
            </p>
            <h3 class="mt-1 text-xl font-black">
              The quest starts with real checkpoints
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Taskmaster weaves these actions into the fiction in order. Nothing is
              written back without a separate Apply action.
            </p>
          </div>
          <span class="badge badge-secondary rounded-xl">
            {{ store.session.checkpoints.length }} checkpoints
          </span>
        </div>

        <ol class="space-y-2">
          <li
            v-for="(checkpoint, index) in store.session.checkpoints"
            :key="checkpoint.id"
            class="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-secondary-content"
            >
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-bold">{{ checkpoint.title }}</p>
              <p v-if="checkpoint.detail" class="mt-1 text-xs text-base-content/55">
                {{ checkpoint.detail }}
              </p>
              <p
                class="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/35"
              >
                {{ checkpoint.sourceKind.replace('-', ' ') }}
              </p>
            </div>
          </li>
        </ol>
      </section>

      <aside class="space-y-3">
        <section class="rounded-2xl border border-base-300 bg-base-200/35 p-4">
          <p
            class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-base-content/55"
          >
            Quest briefing
          </p>
          <dl class="mt-3 space-y-3 text-sm">
            <div>
              <dt class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40">
                Objective
              </dt>
              <dd class="mt-0.5 font-bold">
                {{ store.session.seed.taskTitle || 'Linked project objective' }}
              </dd>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <dt class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40">
                  Tone
                </dt>
                <dd class="mt-0.5 capitalize">{{ store.session.seed.tone }}</dd>
              </div>
              <div>
                <dt class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40">
                  Setting
                </dt>
                <dd class="mt-0.5">
                  {{ store.session.location?.title || 'Taskmaster chooses' }}
                </dd>
              </div>
            </div>
            <div v-if="store.session.genre">
              <dt class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40">
                Genre
              </dt>
              <dd class="mt-0.5">{{ store.session.genre.title }}</dd>
            </div>
          </dl>
        </section>

        <div
          class="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/5 p-3 text-xs leading-relaxed text-base-content/60"
        >
          <Icon name="kind-icon:shield" class="mt-0.5 size-4 shrink-0 text-success" />
          <p>
            This review is the handrail: the fiction can be surprising, but the work
            cannot silently change beneath it.
          </p>
        </div>

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>

        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <button
            type="button"
            class="btn btn-ghost rounded-xl border border-base-300 bg-base-100"
            :disabled="store.isWeaving"
            @click="startOver"
          >
            Edit setup
          </button>
          <button
            type="button"
            class="btn btn-secondary rounded-xl"
            :disabled="store.isWeaving || !store.session.checkpoints.length"
            @click="store.startQuest()"
          >
            <Icon name="kind-icon:story" class="size-4" /> Start the adventure
          </button>
        </div>
      </aside>
    </div>

    <!-- QUEST: story and response on the left, real mission rail on the right. -->
    <div
      v-else
      class="grid min-h-0 flex-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div class="flex min-h-0 flex-col gap-3">
        <LazyKrNarratorStage
          :stage-image="tabImage"
          class="taskmaster-stage min-h-56 shrink-0 lg:min-h-64"
        />

        <KrChatWindow
          class="min-h-80 flex-1"
          :turns="chatTurns"
          label="Story transcript"
          :is-streaming="store.isWeaving"
          :streaming-text="store.streamingText"
          streaming-label="Taskmaster is building the next scene…"
          empty-label="Taskmaster is preparing the opening scene."
        >
          <template #after-turn="{ turn }">
            <NarrativeArtStatus
              v-if="beatForTurn(turn)"
              class="mt-2"
              :art="beatForTurn(turn)?.art"
              :label="`Illustration for ${store.session?.seed.taskTitle || 'this quest'}`"
              @retry="store.retryBeatArt(beatForTurn(turn)!.id)"
            />
          </template>

          <template #footer>
            <div
              v-if="store.isComplete"
              class="space-y-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4"
            >
              <div class="text-center">
                <p class="text-sm font-bold text-secondary">Quest complete</p>
                <p class="mt-1 text-xs text-base-content/60">
                  Review any real-world updates below before applying them.
                </p>
              </div>
              <dl
                v-if="sessionRecap.length"
                class="grid gap-2 text-xs leading-relaxed sm:grid-cols-2"
              >
                <div
                  v-for="item in sessionRecap"
                  :key="item.label"
                  class="rounded-xl border border-base-300 bg-base-100 p-3"
                >
                  <dt class="font-bold text-base-content/70">{{ item.label }}</dt>
                  <dd class="mt-0.5 text-base-content/60">{{ item.value }}</dd>
                </div>
              </dl>
            </div>

            <div
              v-if="store.pendingWriteBacks.length"
              class="space-y-2 rounded-2xl border border-warning/30 bg-warning/5 p-4"
            >
              <div class="flex items-center gap-2">
                <Icon name="kind-icon:gearhammer" class="size-4 text-warning" />
                <h3 class="text-xs font-bold uppercase tracking-wide text-warning">
                  Quest ledger
                </h3>
              </div>
              <p class="text-[0.7rem] leading-relaxed text-base-content/50">
                Nothing is written automatically. Apply only the updates you want.
              </p>
              <article
                v-for="item in store.pendingWriteBacks"
                :key="item.beatId"
                class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed"
              >
                <div class="flex items-start gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="font-bold">{{ item.title }}</p>
                    <p class="mt-1 text-base-content/70">“{{ item.answer }}”</p>
                    <p class="mt-1 text-base-content/50">
                      <span class="font-semibold">Apply will:</span>
                      {{ item.proposedWrite }}
                    </p>
                  </div>
                  <span
                    v-if="item.status === 'written'"
                    class="badge badge-success badge-sm rounded-xl"
                  >
                    written
                  </span>
                  <button
                    v-else
                    type="button"
                    class="btn btn-warning btn-xs rounded-xl"
                    :disabled="item.status === 'queued'"
                    @click="store.applyWriteBack(item.beatId)"
                  >
                    <span
                      v-if="item.status === 'queued'"
                      class="loading loading-spinner loading-xs"
                    />
                    <template v-else>Apply</template>
                  </button>
                </div>
              </article>
            </div>
          </template>
        </KrChatWindow>

        <section
          v-if="
            !store.isComplete && store.awaitingAnswer && store.currentCheckpoint
          "
          class="shrink-0 space-y-2 rounded-2xl border border-info/25 bg-info/5 p-3"
        >
          <div>
            <p class="text-[0.7rem] font-bold uppercase tracking-wide text-info/75">
              What happened in the real world?
            </p>
            <p class="mt-1 text-xs text-base-content/55">
              Choose the honest checkpoint outcome, then describe what happened below.
            </p>
          </div>
          <kr-choice-list
            layout="row"
            label="Checkpoint outcome"
            :choices="outcomeChoices"
            :selected-key="selectedOutcome"
            :show-index="false"
            @select="selectedOutcome = $event.key as TaskmasterCheckpointOutcome"
          />
        </section>

        <NarrativeResponseComposer
          v-if="!store.isComplete && !store.canClose"
          v-model="answerInput"
          class="shrink-0"
          :options="store.currentBeat?.question.options ?? []"
          :disabled="!store.awaitingAnswer"
          :loading="store.isWeaving"
          :placeholder="
            store.awaitingAnswer
              ? 'What do you do?'
              : 'Taskmaster is building the next scene…'
          "
          button-label="Continue"
          hint="Story answers become proposed progress first. Real task changes still require an explicit Apply action."
          @submit="submitAnswer"
        />
      </div>

      <aside class="space-y-3 lg:sticky lg:top-0">
        <section
          v-if="store.session.seed.taskTitle"
          class="rounded-2xl border border-info/30 bg-info/5 p-3"
        >
          <p class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-info/80">
            Real objective
          </p>
          <p class="mt-1 text-sm font-bold leading-relaxed">
            {{ store.session.seed.taskTitle }}
          </p>
        </section>

        <section
          v-if="store.session.checkpoints.length"
          class="rounded-2xl border border-secondary/20 bg-secondary/5 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p
                class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-secondary/75"
              >
                Practical checkpoint plan
              </p>
              <p v-if="store.currentCheckpoint" class="mt-1 text-sm font-bold">
                Current action: {{ store.currentCheckpoint.title }}
              </p>
              <p v-else class="mt-1 text-xs text-base-content/55">
                Every planned checkpoint has an outcome.
              </p>
            </div>
            <span class="badge badge-secondary badge-sm rounded-xl">
              {{ store.remainingCheckpoints.length }} left
            </span>
          </div>
          <details class="mt-3">
            <summary
              class="cursor-pointer text-[0.68rem] font-black uppercase tracking-wide text-secondary/65"
            >
              Full checkpoint plan
            </summary>
            <ol class="mt-2 space-y-2">
              <li
                v-for="checkpoint in store.session.checkpoints"
                :key="checkpoint.id"
                class="rounded-xl border border-base-300 bg-base-100 p-2.5 text-xs"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-bold">{{ checkpoint.title }}</p>
                  <span
                    class="badge badge-sm rounded-xl"
                    :class="
                      checkpoint.status === 'completed'
                        ? 'badge-success'
                        : checkpoint.status === 'active'
                          ? 'badge-secondary'
                          : checkpoint.status === 'blocked' ||
                              checkpoint.status === 'needs-info'
                            ? 'badge-warning'
                            : 'badge-ghost'
                    "
                  >
                    {{ checkpoint.status.replace('-', ' ') }}
                  </span>
                </div>
                <p v-if="checkpoint.proposedNote" class="mt-1 text-base-content/55">
                  {{ checkpoint.proposedNote }}
                </p>
              </li>
            </ol>
          </details>
        </section>

        <div
          v-if="store.currentHookContext && store.awaitingAnswer"
          class="flex items-start gap-2 rounded-2xl border border-info/30 bg-info/5 p-3"
        >
          <Icon name="kind-icon:alert" class="mt-0.5 size-4 shrink-0 text-info" />
          <div class="min-w-0 flex-1 text-xs leading-relaxed">
            <p class="font-bold text-info">This scene connects to:</p>
            <p class="mt-0.5 text-base-content/75">
              {{ store.currentHookContext.title }}
            </p>
            <p class="mt-1 text-base-content/45">
              An answer proposes progress. It does not approve or complete the work.
            </p>
          </div>
        </div>

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>

        <section
          v-if="store.canClose"
          class="space-y-2 rounded-2xl border border-success/30 bg-success/5 p-3"
        >
          <div>
            <p class="text-sm font-bold text-success">
              All checkpoints have an outcome
            </p>
            <p class="mt-0.5 text-xs text-base-content/55">
              Review any optional Apply actions, then finish for a practical recap.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-success btn-sm w-full rounded-xl"
            @click="store.closeStory()"
          >
            Finish the quest
          </button>
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { getDashboardTabImagePath } from '@/stores/helpers/dashboardHelper'
import { useProjectStore } from '@/stores/projectStore'
import {
  TASKMASTER_TONES,
  useTaskmasterStore,
  type TaskmasterCheckpointOutcome,
  type TaskmasterIngredient,
  type TaskmasterTone,
} from '@/stores/taskmasterStore'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import {
  parseNarrativeTags,
  pickRandomNarrativeIngredient,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'
import {
  beatIdFromTurnId,
  narrativeBeatsToTurns,
} from '@/utils/narrativeTurns'

const store = useTaskmasterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const projectStore = useProjectStore()

const tabImage = computed(() =>
  getDashboardTabImagePath('scenario', 'taskmaster'),
)

const taskInput = ref('')
const selectedTone = ref<TaskmasterTone>('adventurous')
const selectedLocationSlug = ref<string | null>(null)
const selectedGrammarSlug = ref<string | null>(null)
const selectedProjectSlug = ref('')
const vibeInput = ref('')
const answerInput = ref('')
const selectedOutcome = ref<TaskmasterCheckpointOutcome>('completed')

const checkpointOutcomes: {
  value: TaskmasterCheckpointOutcome
  label: string
  helper: string
}[] = [
  { value: 'completed', label: 'Completed', helper: 'The action is genuinely done.' },
  { value: 'blocked', label: 'Blocked', helper: 'Something external prevents progress.' },
  { value: 'deferred', label: 'Deferred', helper: 'This is intentionally postponed.' },
  { value: 'needs-info', label: 'Needs info', helper: 'A question or missing fact comes next.' },
]

const outcomeChoices = computed(() =>
  checkpointOutcomes.map((outcome) => ({
    key: outcome.value,
    label: outcome.label,
    hint: outcome.helper,
  })),
)

const toneChoices = computed(() =>
  TASKMASTER_TONES.map((tone) => ({
    key: tone,
    label: tone.charAt(0).toUpperCase() + tone.slice(1),
  })),
)

const chatTurns = computed(() =>
  narrativeBeatsToTurns(store.session?.beats ?? []),
)

function beatForTurn(turn: NarrativeTurn) {
  const beatId = beatIdFromTurnId(turn.id)
  if (!beatId) return null
  return store.session?.beats.find((beat) => beat.id === beatId) ?? null
}

const canBegin = computed(
  () => Boolean(taskInput.value.trim() || selectedProjectSlug.value),
)

const locationDreams = computed(() =>
  dreamStore.dreams.filter(
    (dream) => dream.dreamType === 'LOCATION' && dream.isActive && dream.slug,
  ),
)

const locationOptions = computed<NarrativeIngredientOption[]>(() =>
  locationDreams.value.map((dream) => ({
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
    icon: 'kind-icon:dream',
    badge: 'Location',
  })),
)

const selectedLocationLabel = computed(
  () =>
    locationOptions.value.find(
      (item) => item.slug === selectedLocationSlug.value,
    )?.title || 'Let Taskmaster choose',
)

const storyGrammarTaxonomies = new Set(['GENRE', 'CORE', 'THEME', 'MOOD', 'STYLE'])
const grammarFacets = computed(() =>
  facetStore.activeFacets.filter(
    (facet) => storyGrammarTaxonomies.has(facet.taxonomy) && facet.slug,
  ),
)

const grammarOptions = computed<NarrativeIngredientOption[]>(() =>
  grammarFacets.value.map((facet) => ({
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

const selectedGrammarLabel = computed(
  () =>
    grammarOptions.value.find(
      (item) => item.slug === selectedGrammarSlug.value,
    )?.title || 'Any adventure',
)

const sessionRecap = computed(() => {
  const active = store.session
  if (!active || active.status !== 'complete') return []

  const answered = active.beats.filter((beat) => beat.answer?.text)
  const realThreadCount = answered.filter(
    (beat) => beat.question.realWorldKind !== 'preference',
  ).length
  const items: { label: string; value: string }[] = [
    { label: 'Tone', value: active.seed.tone },
  ]

  if (active.seed.taskTitle) {
    items.unshift({ label: 'Objective', value: active.seed.taskTitle })
  }
  if (active.location) {
    items.push({ label: 'Setting', value: active.location.title })
  }
  if (active.genre) items.push({ label: 'Genre', value: active.genre.title })
  if (active.seed.vibeTags.length) {
    items.push({ label: 'Flavor', value: active.seed.vibeTags.join(', ') })
  }
  if (realThreadCount) {
    items.push({
      label: 'Real threads',
      value: `${realThreadCount} answer${realThreadCount === 1 ? '' : 's'} captured`,
    })
  }
  const completed = active.checkpoints.filter(
    (checkpoint) => checkpoint.status === 'completed',
  ).length
  const unresolved = active.checkpoints.length - completed
  items.push({
    label: 'Checkpoint result',
    value: `${completed} completed · ${unresolved} blocked, deferred, or awaiting follow-up`,
  })
  return items
})

function taxonomyLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toIngredient(
  option: NarrativeIngredientOption | undefined,
): TaskmasterIngredient | undefined {
  if (!option) return undefined
  return {
    slug: option.slug,
    title: option.title,
    description: option.description,
    flavorText: option.flavorText,
  }
}

async function begin(surprise: boolean) {
  if (!canBegin.value) return

  const tone = surprise
    ? (TASKMASTER_TONES[
        Math.floor(Math.random() * TASKMASTER_TONES.length)
      ] ?? 'surprising')
    : selectedTone.value
  const location = surprise
    ? toIngredient(pickRandomNarrativeIngredient(locationOptions.value))
    : toIngredient(
        locationOptions.value.find(
          (item) => item.slug === selectedLocationSlug.value,
        ),
      )
  const genre = surprise
    ? toIngredient(pickRandomNarrativeIngredient(grammarOptions.value))
    : toIngredient(
        grammarOptions.value.find(
          (item) => item.slug === selectedGrammarSlug.value,
        ),
      )

  await store.prepareQuest({
    tone,
    taskTitle: taskInput.value.trim() || undefined,
    vibeTags: parseNarrativeTags(vibeInput.value),
    surprise,
    location,
    genre,
    projectSlug: selectedProjectSlug.value || undefined,
  })
}

async function submitAnswer(value: string) {
  const text = value.trim()
  if (!text || !store.awaitingAnswer) return
  answerInput.value = ''
  const outcome = selectedOutcome.value
  selectedOutcome.value = 'completed'
  await store.answerCurrentBeat(text, outcome)
}

function startOver() {
  if (store.isWeaving) return
  store.resetSession()
}

onMounted(() => {
  store.restoreFromLocalStorage()
  if (!dreamStore.hasLoaded || !locationDreams.value.length) {
    void dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })
  }
  if (!facetStore.loaded) void facetStore.fetchFacets({ take: 250 })
  void store.loadRealSurfaces()
})
</script>
