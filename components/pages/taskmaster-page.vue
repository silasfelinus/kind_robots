<!-- /components/pages/taskmaster-page.vue -->
<!-- Taskmaster turns real work into a second-person narrative while keeping
     every real-world write explicit and reviewable. Art direction is automatic;
     users choose story ingredients, never image-model settings. -->
<template>
  <section
    class="kr-surface taskmaster-shell relative min-h-0 gap-0 overflow-x-hidden rounded-[2rem] border border-secondary/25 bg-(--kr-surface-raised)"
  >
    <TaskmasterBackdrop :compact="Boolean(store.session)" />

    <div class="relative z-10 flex min-h-0 flex-1 flex-col">
      <template v-if="!store.session">
        <header class="taskmaster-hero relative flex min-h-64 items-start p-4 sm:min-h-72 sm:p-6 lg:min-h-80 lg:p-8">
          <div class="taskmaster-hero-copy max-w-2xl">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-base-100/80 px-3 py-1.5 text-[0.68rem] font-black uppercase tracking-[0.16em] text-secondary shadow-sm backdrop-blur"
            >
              <Icon name="kind-icon:gearhammer" class="size-4" />
              The Quest Desk
            </span>
            <h2
              class="mt-4 max-w-xl text-3xl font-black leading-[0.98] tracking-tight text-base-content sm:text-4xl lg:text-5xl"
            >
              Turn the next real thing into a quest
            </h2>
            <p
              class="mt-3 max-w-lg text-sm font-semibold leading-relaxed text-base-content/70 sm:text-base"
            >
              Name what matters. Shape the adventure. Review the practical plan
              before the story begins.
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-base-100/80 px-2.5 py-1.5 text-[0.68rem] font-bold shadow-sm backdrop-blur"
              >
                <Icon name="kind-icon:shield" class="size-3.5 text-success" />
                Nothing changes without approval
              </span>
              <span
                class="hidden items-center gap-1.5 rounded-full border border-info/30 bg-base-100/80 px-2.5 py-1.5 text-[0.68rem] font-bold shadow-sm backdrop-blur sm:inline-flex"
              >
                <Icon name="kind-icon:sparkles" class="size-3.5 text-info" />
                Story answers become progress proposals
              </span>
            </div>
          </div>

          <aside
            class="taskmaster-guide-bubble absolute bottom-5 right-4 hidden w-64 rounded-[1.5rem_1.5rem_0.4rem_1.5rem] border border-secondary/30 bg-base-100/85 p-4 shadow-xl backdrop-blur-xl lg:block xl:right-8"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-content shadow-md"
              >
                <Icon name="kind-icon:magic" class="size-5" />
              </span>
              <div class="min-w-0">
                <p
                  class="text-[0.65rem] font-black uppercase tracking-[0.14em] text-secondary"
                >
                  Your guide
                </p>
                <h3 class="truncate text-lg font-black">Serendipity</h3>
              </div>
            </div>
            <p class="mt-3 text-xs font-medium leading-relaxed text-base-content/65">
              I’ll help turn this objective into an adventure that moves you
              forward without disguising the real work.
            </p>
          </aside>
        </header>

        <TaskmasterQuestStepper
          active="objective"
          class="mx-3 -mt-5 sm:mx-5 lg:mx-8 lg:max-w-3xl"
        />

        <main
          class="taskmaster-desk grid items-start gap-4 px-3 pb-28 pt-7 sm:px-5 sm:pt-8 lg:grid-cols-2 lg:px-8 xl:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)_minmax(17rem,0.72fr)]"
        >
          <section
            class="taskmaster-panel taskmaster-panel--objective space-y-4 border border-info/30 p-4 sm:p-5"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info text-info-content shadow-md"
              >
                <Icon name="kind-icon:target" class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[0.68rem] font-black uppercase tracking-[0.15em] text-info"
                >
                  Your objective
                </p>
                <h3 class="mt-1 text-lg font-black sm:text-xl">
                  What needs to move?
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-base-content/55">
                  Be plain and specific. Serendipity can make it magical after it
                  is honest.
                </p>
              </div>
            </div>

            <textarea
              v-model="taskInput"
              rows="5"
              class="textarea textarea-bordered w-full resize-none rounded-2xl border-info/25 bg-base-100/90 text-base font-semibold leading-relaxed shadow-inner sm:text-lg"
              placeholder="Clean the garage, finish the proposal, decide which feature ships next…"
              :disabled="store.isWeaving"
            />

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
                class="select select-bordered w-full rounded-xl border-info/20 bg-base-100/90"
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

            <div
              class="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/10 p-3 text-xs leading-relaxed text-base-content/65"
            >
              <Icon
                name="kind-icon:shield"
                class="mt-0.5 size-4 shrink-0 text-success"
              />
              <p>
                Real updates still require a separate <strong>Apply</strong>
                action. The story may surprise you; the ledger may not.
              </p>
            </div>
          </section>

          <section
            class="taskmaster-panel taskmaster-panel--recipe border border-secondary/30 p-4 sm:p-5 xl:mt-5"
          >
            <div class="flex items-start gap-3">
              <span
                class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-content shadow-md"
              >
                <Icon name="kind-icon:flask" class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p
                  class="text-[0.68rem] font-black uppercase tracking-[0.15em] text-secondary"
                >
                  Quest recipe
                </p>
                <h3 class="mt-1 text-lg font-black">Shape the journey</h3>
                <p class="mt-1 text-xs leading-relaxed text-base-content/55">
                  Choose story ingredients, never model machinery.
                </p>
              </div>
            </div>

            <details class="taskmaster-recipe-details group mt-4">
              <summary
                class="flex cursor-pointer list-none items-center gap-3 rounded-2xl border border-secondary/25 bg-base-100/85 p-3 md:hidden [&::-webkit-details-marker]:hidden"
              >
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-black">Recipe ingredients</span>
                  <span class="block truncate text-xs text-base-content/50">
                    {{ selectedTone }} · {{ selectedLocationLabel }} ·
                    {{ selectedGrammarLabel }}
                  </span>
                </span>
                <Icon
                  name="kind-icon:chevron-down"
                  class="size-4 transition-transform group-open:rotate-180"
                />
              </summary>

              <div class="taskmaster-recipe-body space-y-4 pt-4 md:pt-0">
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
                  class="group rounded-2xl border border-base-300/90 bg-base-100/90"
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
                  class="group rounded-2xl border border-base-300/90 bg-base-100/90"
                >
                  <summary
                    class="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden"
                  >
                    <span
                      class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
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
                    class="input input-bordered w-full rounded-xl border-secondary/20 bg-base-100/90"
                    :disabled="store.isWeaving"
                  />
                </label>
              </div>
            </details>
          </section>

          <aside
            class="taskmaster-panel taskmaster-panel--sparks border border-accent/30 p-4 sm:p-5 lg:col-span-2 xl:col-span-1 xl:mt-10"
          >
            <TaskmasterSampleTasks />

            <div
              class="mt-4 rounded-[1.4rem_1.4rem_0.45rem_1.4rem] border border-secondary/25 bg-secondary/10 p-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-content"
                >
                  <Icon name="kind-icon:magic" class="size-4" />
                </span>
                <div>
                  <p
                    class="text-[0.65rem] font-black uppercase tracking-[0.13em] text-secondary"
                  >
                    Serendipity says
                  </p>
                  <p class="text-sm font-black">Small steps still count as adventure.</p>
                </div>
              </div>
            </div>
          </aside>
        </main>

        <p
          v-if="store.errorMessage"
          class="relative z-20 mx-4 mb-2 text-xs text-error sm:mx-6"
          role="alert"
        >
          {{ store.errorMessage }}
        </p>

        <footer
          class="taskmaster-action-rail sticky bottom-2 z-30 mx-3 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-base-300/80 bg-base-100/90 p-2.5 shadow-2xl backdrop-blur-xl sm:mx-5 sm:p-3 lg:mx-8"
        >
          <p
            class="hidden min-w-48 flex-1 text-xs font-medium leading-relaxed text-base-content/55 lg:block"
          >
            Next: review a practical checkpoint plan before the story begins.
          </p>
          <button
            type="button"
            class="btn btn-ghost flex-1 rounded-xl border border-base-300 bg-base-100 sm:flex-none"
            :disabled="store.isWeaving || !canBegin"
            @click="begin(true)"
          >
            <Icon name="kind-icon:wand" class="size-4" />
            Surprise me
          </button>
          <button
            type="button"
            class="taskmaster-primary-action btn flex-[1.3] rounded-xl border-0 text-primary-content shadow-lg sm:flex-none sm:px-8"
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
            class="w-full text-center text-[0.68rem] text-base-content/45 sm:text-right"
          >
            Enter an objective or choose a linked project to begin.
          </p>
        </footer>
      </template>

      <template v-else-if="store.session.status === 'draft'">
        <header class="taskmaster-state-hero relative px-4 pb-8 pt-5 sm:px-6 lg:px-8">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="max-w-2xl">
              <p
                class="text-[0.68rem] font-black uppercase tracking-[0.16em] text-secondary"
              >
                Quest briefing
              </p>
              <h2 class="mt-1 text-2xl font-black leading-tight sm:text-3xl">
                Review the practical plan
              </h2>
              <p class="mt-2 max-w-xl text-sm leading-relaxed text-base-content/65">
                The quest starts with real checkpoints. The story can embellish the
                road, never quietly move the destination.
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl border border-base-300 bg-base-100/80 backdrop-blur"
              :disabled="store.isWeaving"
              @click="startOver"
            >
              <Icon name="kind-icon:wand" class="size-4" />
              Edit setup
            </button>
          </div>
          <TaskmasterQuestStepper active="review" class="mt-5 max-w-3xl" />
        </header>

        <main
          class="grid items-start gap-4 px-3 pb-6 sm:px-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:px-8"
        >
          <section
            class="taskmaster-panel taskmaster-panel--plan border border-secondary/30 p-4 sm:p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p
                  class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-secondary"
                >
                  Practical route
                </p>
                <h3 class="mt-1 text-xl font-black">
                  The quest starts with real checkpoints
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-base-content/55">
                  Taskmaster weaves these actions into the fiction in order.
                  Nothing is written back without a separate Apply action.
                </p>
              </div>
              <span class="badge badge-secondary h-auto rounded-xl px-3 py-2">
                {{ store.session.checkpoints.length }} checkpoints
              </span>
            </div>

            <ol class="taskmaster-checkpoint-path mt-5 space-y-3">
              <li
                v-for="(checkpoint, index) in store.session.checkpoints"
                :key="checkpoint.id"
                class="taskmaster-checkpoint relative flex items-start gap-3 rounded-2xl border border-base-300/85 bg-base-100/90 p-3 shadow-sm backdrop-blur"
              >
                <span
                  class="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-secondary-content shadow-md"
                >
                  {{ index + 1 }}
                </span>
                <div class="min-w-0 flex-1 pt-1">
                  <p class="font-black">{{ checkpoint.title }}</p>
                  <p
                    v-if="checkpoint.detail"
                    class="mt-1 text-xs leading-relaxed text-base-content/55"
                  >
                    {{ checkpoint.detail }}
                  </p>
                  <p
                    class="mt-2 text-[0.65rem] font-bold uppercase tracking-wide text-base-content/35"
                  >
                    {{ checkpoint.sourceKind.replace('-', ' ') }}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <aside class="space-y-4 lg:pt-8">
            <section
              class="taskmaster-panel taskmaster-panel--briefing border border-info/30 p-4"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info text-info-content"
                >
                  <Icon name="kind-icon:map" class="size-5" />
                </span>
                <div>
                  <p
                    class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-info"
                  >
                    Quest briefing
                  </p>
                  <p class="text-base font-black">Check the map before departure</p>
                </div>
              </div>
              <dl class="mt-4 space-y-3 text-sm">
                <div>
                  <dt
                    class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40"
                  >
                    Objective
                  </dt>
                  <dd class="mt-0.5 font-black">
                    {{ store.session.seed.taskTitle || 'Linked project objective' }}
                  </dd>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <dt
                      class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40"
                    >
                      Tone
                    </dt>
                    <dd class="mt-0.5 capitalize">{{ store.session.seed.tone }}</dd>
                  </div>
                  <div>
                    <dt
                      class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40"
                    >
                      Setting
                    </dt>
                    <dd class="mt-0.5">
                      {{ store.session.location?.title || 'Taskmaster chooses' }}
                    </dd>
                  </div>
                </div>
                <div v-if="store.session.genre">
                  <dt
                    class="text-[0.65rem] font-bold uppercase tracking-wide text-base-content/40"
                  >
                    Genre
                  </dt>
                  <dd class="mt-0.5">{{ store.session.genre.title }}</dd>
                </div>
              </dl>
            </section>

            <section
              class="taskmaster-guide-card rounded-[1.7rem_1.7rem_0.5rem_1.7rem] border border-secondary/30 bg-base-100/85 p-4 shadow-xl backdrop-blur-xl"
            >
              <div class="flex items-start gap-3">
                <span
                  class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-content"
                >
                  <Icon name="kind-icon:magic" class="size-5" />
                </span>
                <div>
                  <p
                    class="text-[0.65rem] font-black uppercase tracking-[0.14em] text-secondary"
                  >
                    Serendipity's handrail
                  </p>
                  <p class="mt-1 text-xs leading-relaxed text-base-content/60">
                    The fiction can be surprising, but the work cannot silently
                    change beneath it.
                  </p>
                </div>
              </div>
            </section>

            <p v-if="store.errorMessage" class="text-xs text-error" role="alert">
              {{ store.errorMessage }}
            </p>

            <button
              type="button"
              class="taskmaster-primary-action btn w-full rounded-xl border-0 text-primary-content shadow-lg"
              :disabled="store.isWeaving || !store.session.checkpoints.length"
              @click="store.startQuest()"
            >
              <Icon name="kind-icon:story" class="size-4" />
              Start the adventure
            </button>
          </aside>
        </main>
      </template>

      <template v-else>
        <header
          class="taskmaster-mission-banner relative mx-3 mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-info/30 bg-base-100/85 p-3 shadow-xl backdrop-blur-xl sm:mx-5 lg:mx-8"
        >
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-info text-info-content"
          >
            <Icon name="kind-icon:target" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <p
              class="text-[0.65rem] font-black uppercase tracking-[0.14em] text-info"
            >
              Current quest
            </p>
            <p class="truncate text-sm font-black sm:text-base">
              {{ store.session.seed.taskTitle || 'Linked project objective' }}
            </p>
          </div>
          <span
            v-if="store.session.checkpoints.length"
            class="badge badge-secondary h-auto rounded-xl px-3 py-2"
          >
            {{ store.remainingCheckpoints.length }} left
          </span>
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            :disabled="store.isWeaving"
            @click="startOver"
          >
            New quest
          </button>
        </header>

        <main
          class="grid min-h-0 flex-1 items-start gap-4 px-3 pb-5 pt-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8"
        >
          <div class="flex min-h-0 flex-col gap-4">
            <LazyKrNarratorStage
              :stage-image="tabImage"
              class="taskmaster-stage min-h-56 shrink-0 overflow-hidden rounded-[2rem] border border-secondary/25 shadow-xl lg:min-h-64"
            />

            <KrChatWindow
              class="taskmaster-chat min-h-80 flex-1 overflow-hidden rounded-[2rem] border border-base-300/80 bg-base-100/90 shadow-xl backdrop-blur-xl"
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
                  class="space-y-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-4"
                >
                  <div class="text-center">
                    <p class="text-sm font-black text-secondary">Quest complete</p>
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
                  class="space-y-2 rounded-2xl border border-warning/30 bg-warning/10 p-4"
                >
                  <div class="flex items-center gap-2">
                    <Icon name="kind-icon:gearhammer" class="size-4 text-warning" />
                    <h3
                      class="text-xs font-black uppercase tracking-wide text-warning"
                    >
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
              v-if="!store.isComplete && store.awaitingAnswer && store.currentCheckpoint"
              class="taskmaster-panel shrink-0 space-y-2 border border-info/30 p-3"
            >
              <div>
                <p
                  class="text-[0.7rem] font-black uppercase tracking-wide text-info"
                >
                  What happened in the real world?
                </p>
                <p class="mt-1 text-xs text-base-content/55">
                  Choose the honest checkpoint outcome, then describe what happened
                  below.
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
              class="taskmaster-panel border border-info/30 p-3"
            >
              <p
                class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-info"
              >
                Real objective
              </p>
              <p class="mt-1 text-sm font-black leading-relaxed">
                {{ store.session.seed.taskTitle }}
              </p>
            </section>

            <section
              v-if="store.session.checkpoints.length"
              class="taskmaster-panel border border-secondary/25 p-3"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p
                    class="text-[0.68rem] font-black uppercase tracking-[0.14em] text-secondary"
                  >
                    Practical checkpoint plan
                  </p>
                  <p v-if="store.currentCheckpoint" class="mt-1 text-sm font-black">
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
                  class="cursor-pointer text-[0.68rem] font-black uppercase tracking-wide text-secondary/75"
                >
                  Full checkpoint plan
                </summary>
                <ol class="mt-2 space-y-2">
                  <li
                    v-for="checkpoint in store.session.checkpoints"
                    :key="checkpoint.id"
                    class="rounded-xl border border-base-300 bg-base-100/90 p-2.5 text-xs"
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
                    <p
                      v-if="checkpoint.proposedNote"
                      class="mt-1 text-base-content/55"
                    >
                      {{ checkpoint.proposedNote }}
                    </p>
                  </li>
                </ol>
              </details>
            </section>

            <div
              v-if="store.currentHookContext && store.awaitingAnswer"
              class="taskmaster-panel flex items-start gap-2 border border-info/30 p-3"
            >
              <Icon name="kind-icon:alert" class="mt-0.5 size-4 shrink-0 text-info" />
              <div class="min-w-0 flex-1 text-xs leading-relaxed">
                <p class="font-bold text-info">This scene connects to:</p>
                <p class="mt-0.5 text-base-content/75">
                  {{ store.currentHookContext.title }}
                </p>
                <p class="mt-1 text-base-content/45">
                  An answer proposes progress. It does not approve or complete the
                  work.
                </p>
              </div>
            </div>

            <p v-if="store.errorMessage" class="text-xs text-error" role="alert">
              {{ store.errorMessage }}
            </p>

            <section
              v-if="store.canClose"
              class="taskmaster-panel space-y-2 border border-success/30 p-3"
            >
              <div>
                <p class="text-sm font-black text-success">
                  All checkpoints have an outcome
                </p>
                <p class="mt-0.5 text-xs text-base-content/55">
                  Review any optional Apply actions, then finish for a practical
                  recap.
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
        </main>
      </template>
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
  {
    value: 'completed',
    label: 'Completed',
    helper: 'The action is genuinely done.',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    helper: 'Something external prevents progress.',
  },
  {
    value: 'deferred',
    label: 'Deferred',
    helper: 'This is intentionally postponed.',
  },
  {
    value: 'needs-info',
    label: 'Needs info',
    helper: 'A question or missing fact comes next.',
  },
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

<style scoped>
.taskmaster-shell {
  isolation: isolate;
  box-shadow:
    0 1px 0 color-mix(in oklab, var(--color-base-100) 75%, transparent) inset,
    0 1.5rem 4rem color-mix(in oklab, var(--color-primary) 10%, transparent);
}

.taskmaster-hero-copy {
  text-shadow: 0 2px 14px color-mix(in oklab, var(--color-base-100) 82%, transparent);
}

.taskmaster-panel {
  position: relative;
  background: color-mix(in oklab, var(--color-base-100) 90%, transparent);
  box-shadow:
    0 1px 0 color-mix(in oklab, var(--color-base-100) 82%, transparent) inset,
    0 1.25rem 3rem color-mix(in oklab, var(--color-primary) 12%, transparent);
  backdrop-filter: blur(18px) saturate(1.08);
}

.taskmaster-panel::before {
  content: '';
  position: absolute;
  inset: 0.35rem;
  pointer-events: none;
  border: 1px solid color-mix(in oklab, var(--color-base-100) 68%, transparent);
  border-radius: inherit;
}

.taskmaster-panel--objective {
  border-radius: 2rem 2rem 1.2rem 2rem;
}

.taskmaster-panel--recipe {
  border-radius: 1.2rem 2rem 2rem 1.4rem;
}

.taskmaster-panel--sparks {
  border-radius: 2rem 1.2rem 2rem 2rem;
}

.taskmaster-panel--plan {
  border-radius: 2rem 2rem 1.2rem 2rem;
}

.taskmaster-panel--briefing {
  border-radius: 1.4rem 2rem 2rem 1.4rem;
}

.taskmaster-primary-action {
  background: linear-gradient(
    115deg,
    var(--color-secondary),
    color-mix(in oklab, var(--color-secondary) 62%, var(--color-accent)),
    var(--color-primary)
  );
}

.taskmaster-primary-action:hover:not(:disabled) {
  filter: saturate(1.08) brightness(1.04);
}

.taskmaster-checkpoint-path {
  counter-reset: checkpoint;
}

.taskmaster-checkpoint:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 1.72rem;
  top: 3rem;
  bottom: -1rem;
  width: 2px;
  background: repeating-linear-gradient(
    to bottom,
    color-mix(in oklab, var(--color-secondary) 58%, transparent) 0 0.35rem,
    transparent 0.35rem 0.7rem
  );
}

.taskmaster-stage :deep(img) {
  object-position: 66% center;
}

@media (min-width: 768px) {
  .taskmaster-recipe-details > summary {
    display: none;
  }

  .taskmaster-recipe-details:not([open]) > .taskmaster-recipe-body {
    display: block;
  }
}

@media (max-width: 767px) {
  .taskmaster-hero {
    align-items: flex-end;
    padding-bottom: 3.5rem;
  }

  .taskmaster-hero-copy {
    max-width: 21rem;
  }

  .taskmaster-hero-copy h2 {
    max-width: 17rem;
  }

  .taskmaster-panel {
    backdrop-filter: blur(14px) saturate(1.04);
  }

  .taskmaster-action-rail {
    padding-bottom: max(0.625rem, env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .taskmaster-primary-action,
  .taskmaster-panel {
    scroll-behavior: auto;
  }
}
</style>
