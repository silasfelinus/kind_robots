<!-- components/stages/stage-manager.vue -->
<!--
  Stage Manager — rebuilt on the hand/stage/sheet pattern.
  Four cards: Stage → Cast → Settings → Run.
  Reuses existing: stage-preset.vue, stage-slot.vue, stage-message.vue.
  Sidebar shows live cast status + show progress.
-->
<template>
  <div class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm"
    >
      <div class="flex items-center gap-2.5">
        <Icon name="mdi:theater" class="h-5 w-5 text-primary" />
        <h1 class="text-lg font-black tracking-tight">Stage</h1>
        <span
          v-if="store.selectedStage"
          class="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          {{ store.selectedStage.label }}
        </span>
        <span
          v-if="store.isRunning && !store.isPaused"
          class="rounded-full border border-success/40 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success"
        >
          ● Live
        </span>
        <span
          v-else-if="store.isPaused"
          class="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-xs font-bold text-warning"
        >
          Paused
        </span>
      </div>

      <!-- Run controls always visible in header when running -->
      <div class="flex items-center gap-1.5">
        <template v-if="store.isRunning">
          <button
            v-if="!store.isPaused"
            type="button"
            class="btn btn-warning btn-xs rounded-xl"
            @click="store.pause()"
          >
            <Icon name="mdi:pause" class="h-3.5 w-3.5" /> Pause
          </button>
          <button
            v-else
            type="button"
            class="btn btn-success btn-xs rounded-xl"
            @click="store.resume()"
          >
            <Icon name="mdi:play" class="h-3.5 w-3.5" /> Resume
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl"
            @click="store.stop()"
          >
            <Icon name="mdi:stop" class="h-3.5 w-3.5" />
          </button>
        </template>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl"
          @click="store.persist()"
        >
          <Icon name="mdi:content-save" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-xl text-error/60 hover:text-error"
          @click="store.clearTranscript()"
        >
          <Icon name="mdi:broom" class="h-3.5 w-3.5" />
        </button>
      </div>
    </header>

    <!-- ── Body ────────────────────────────────────────────────────────── -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar: cast status + progress -->
      <aside
        v-if="!isMobile"
        class="flex w-64 shrink-0 flex-col border-r border-base-300 bg-base-100/60 backdrop-blur-sm overflow-y-auto p-4 gap-3"
      >
        <p
          class="text-xs font-bold uppercase tracking-widest text-base-content/40"
        >
          Show Status
        </p>

        <!-- Stage -->
        <div
          v-if="store.selectedStage"
          class="overflow-hidden rounded-2xl border border-base-300"
        >
          <img
            v-if="store.selectedStageImagePath"
            :src="store.selectedStageImagePath"
            :alt="store.selectedStage.label"
            class="h-20 w-full object-cover opacity-80"
          />
          <div class="p-2.5">
            <p class="text-xs font-black text-base-content">
              {{ store.selectedStage.label }}
            </p>
            <p class="text-xs text-base-content/50 mt-0.5 line-clamp-2">
              {{ store.selectedStage.tagline }}
            </p>
          </div>
        </div>
        <div
          v-else
          class="rounded-2xl border border-dashed border-base-300 p-4 text-center"
        >
          <Icon
            name="mdi:theater"
            class="mx-auto h-6 w-6 text-base-content/20"
          />
          <p class="mt-1 text-xs text-base-content/30">No stage selected</p>
        </div>

        <!-- Cast status -->
        <div v-if="store.selectedStage" class="flex flex-col gap-1.5">
          <p
            class="text-xs font-bold uppercase tracking-widest text-base-content/40"
          >
            Cast
          </p>
          <div
            v-for="role in store.selectedStage.roles"
            :key="role.key"
            class="flex flex-col gap-0.5"
          >
            <p class="text-xs font-semibold text-base-content/60">
              {{ role.label }}
            </p>
            <div class="flex flex-wrap gap-1">
              <div
                v-for="slot in slotsForRole(role.key)"
                :key="slot.slotId"
                class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2"
                :class="
                  isSlotFilled(slot)
                    ? 'border-success bg-success/15'
                    : 'border-base-300 bg-base-200'
                "
              >
                <Icon
                  v-if="!isSlotFilled(slot)"
                  name="mdi:account-outline"
                  class="h-3.5 w-3.5 text-base-content/30"
                />
                <img
                  v-else-if="slotImage(slot)"
                  :src="slotImage(slot)!"
                  alt=""
                  class="h-full w-full object-cover"
                />
                <Icon
                  v-else
                  name="mdi:check"
                  class="h-3.5 w-3.5 text-success"
                />
              </div>
              <div
                v-for="i in Math.max(
                  0,
                  role.min - slotsForRole(role.key).length,
                )"
                :key="`empty-${i}`"
                class="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dashed border-warning/40 bg-warning/8"
              >
                <Icon name="mdi:plus" class="h-3 w-3 text-warning/50" />
              </div>
            </div>
          </div>
        </div>

        <!-- Turn progress -->
        <div v-if="store.transcript.length" class="flex flex-col gap-1.5">
          <p
            class="text-xs font-bold uppercase tracking-widest text-base-content/40"
          >
            Progress
          </p>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-1.5 rounded-full bg-base-300 overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all"
                :style="`width: ${Math.min(100, (store.turnIndex / store.maxTurns) * 100)}%`"
              />
            </div>
            <span class="text-xs text-base-content/50 shrink-0"
              >{{ store.turnIndex }}/{{ store.maxTurns }}</span
            >
          </div>
        </div>

        <!-- Cast ready badge -->
        <div
          class="rounded-xl p-2.5 text-center text-xs font-bold"
          :class="
            store.castReady
              ? 'bg-success/10 text-success'
              : 'bg-base-200 text-base-content/40'
          "
        >
          {{ store.castReady ? '✓ Cast ready' : 'Cast not ready' }}
        </div>
      </aside>

      <!-- ── Stage area ──────────────────────────────────────────────── -->
      <main class="flex flex-1 flex-col overflow-hidden">
        <!-- Stage → Select a preset -->
        <section
          v-if="activeCard === 'stage'"
          class="flex flex-1 flex-col overflow-y-auto p-5 gap-4"
        >
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-black text-base-content">Pick a Stage</h2>
            <p class="text-sm text-base-content/60">
              Choose the format. This determines the roles, rotation, and tone
              of the performance.
            </p>
          </div>

          <div
            class="grid gap-3"
            style="
              grid-template-columns: repeat(
                auto-fill,
                minmax(min(200px, 100%), 1fr)
              );
            "
          >
            <StagePresetCard
              v-for="preset in store.presets"
              :key="preset.id"
              :preset="preset"
              :is-selected="preset.id === store.selectedStageId"
              @select="onSelectStage"
            />
          </div>
        </section>

        <!-- Cast → Assign performers to roles -->
        <section
          v-else-if="activeCard === 'cast'"
          class="flex flex-1 flex-col overflow-y-auto p-5 gap-4"
        >
          <div
            v-if="!store.selectedStage"
            class="flex flex-1 items-center justify-center text-center"
          >
            <div>
              <Icon
                name="mdi:theater"
                class="mx-auto h-10 w-10 text-base-content/20"
              />
              <p class="mt-2 text-sm text-base-content/40">
                Select a stage first.
              </p>
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-xl mt-3"
                @click="activeCard = 'stage'"
              >
                Go to Stage
              </button>
            </div>
          </div>

          <template v-else>
            <div class="flex flex-col gap-1">
              <h2 class="text-2xl font-black text-base-content">
                Cast the Show
              </h2>
              <p class="text-sm text-base-content/60">
                Assign characters, bots, or preset performers to each role.
                Required slots are shown first.
              </p>
            </div>

            <!-- Performer gallery toggle -->
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <button
                type="button"
                class="flex items-center gap-2 text-sm font-semibold text-base-content/70 hover:text-base-content"
                @click="showPerformerGallery = !showPerformerGallery"
              >
                <Icon
                  :name="
                    showPerformerGallery
                      ? 'mdi:chevron-down'
                      : 'mdi:chevron-right'
                  "
                  class="h-4 w-4"
                />
                Performer Gallery ({{ store.performers.length }} preset
                performers)
              </button>
              <Transition name="expand">
                <div
                  v-if="showPerformerGallery"
                  class="mt-3 grid gap-2"
                  style="
                    grid-template-columns: repeat(
                      auto-fill,
                      minmax(min(180px, 100%), 1fr)
                    );
                  "
                >
                  <button
                    v-for="p in store.performers"
                    :key="p.id"
                    type="button"
                    class="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-2.5 text-left hover:border-primary/40 transition-all"
                    :draggable="true"
                    @click="pendingPerformer = p"
                  >
                    <img
                      :src="p.imagePath"
                      :alt="p.name"
                      class="h-10 w-10 shrink-0 rounded-xl object-cover"
                    />
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-base-content truncate">
                        {{ p.name }}
                      </p>
                      <p class="text-xs text-base-content/50 truncate">
                        {{ p.species }}
                      </p>
                    </div>
                  </button>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn btn-primary btn-sm rounded-xl gap-1.5"
                      @click="openPerformerCreator()"
                    >
                      <Icon name="mdi:account-plus" class="h-4 w-4" />
                      Create Custom Performer
                    </button>

                    <button
                      v-if="pendingCustomPerformer"
                      type="button"
                      class="btn btn-ghost btn-sm rounded-xl gap-1.5"
                      @click="pendingCustomPerformer = null"
                    >
                      <Icon name="mdi:close" class="h-4 w-4" />
                      Clear Custom
                    </button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Pending performer to assign -->
            <Transition name="slide-up">
              <div
                v-if="hasPendingCastMember"
                class="flex items-center gap-3 rounded-2xl border-2 border-primary bg-primary/10 p-3"
              >
                <img
                  v-if="pendingCastImage"
                  :src="pendingCastImage"
                  :alt="pendingCastName"
                  class="h-12 w-12 rounded-2xl object-cover"
                />
                <div
                  v-else
                  class="flex h-12 w-12 items-center justify-center rounded-2xl bg-base-300"
                >
                  <Icon name="mdi:account-star" class="h-6 w-6 text-primary" />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-black text-primary">
                    {{ pendingCastName }}
                  </p>
                  <p class="truncate text-xs text-base-content/60">
                    {{ pendingCastSpecies }} · click a slot below to assign
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-ghost btn-xs rounded-xl"
                  @click="clearPendingCastMember"
                >
                  <Icon name="mdi:close" class="h-3.5 w-3.5" />
                </button>
              </div>
            </Transition>

            <!-- Role slots -->
            <div
              v-for="role in store.selectedStage.roles"
              :key="role.key"
              class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <header class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <img
                    v-if="role.badgeImagePath"
                    :src="role.badgeImagePath"
                    :alt="role.label"
                    class="h-10 w-10 rounded-2xl border border-base-300 object-cover"
                  />
                  <div>
                    <h3 class="text-sm font-black text-base-content">
                      {{ role.label }}
                    </h3>
                    <p class="text-xs text-base-content/60">
                      {{ role.description }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5">
                  <span
                    class="rounded-full border border-base-300 px-2 py-0.5 text-xs text-base-content/50"
                    >{{ role.min }}–{{ role.max }}</span
                  >
                  <button
                    v-if="canAddSlot(role.key)"
                    type="button"
                    class="btn btn-ghost btn-xs rounded-xl"
                    @click="store.addCastSlot(role.key)"
                  >
                    <Icon name="mdi:plus" class="h-3.5 w-3.5" />
                  </button>
                </div>
              </header>

              <div
                class="grid gap-2"
                style="
                  grid-template-columns: repeat(
                    auto-fill,
                    minmax(min(220px, 100%), 1fr)
                  );
                "
              >
                <div
                  v-for="slot in slotsForRole(role.key)"
                  :key="slot.slotId"
                  class="relative"
                  :class="hasPendingCastMember ? 'cursor-pointer' : ''"
                  @click="
                    hasPendingCastMember
                      ? assignPendingCastMember(slot.slotId)
                      : null
                  "
                >
                  <div
                    v-if="hasPendingCastMember && !isSlotFilled(slot)"
                    class="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-2xl border-2 border-dashed border-primary"
                  />
                  <StageRoleSlot
                    :slot="slot"
                    :characters="characterStore.characters || []"
                    :bots="botStore.bots || []"
                    :performers="performersForRole(role.key)"
                    :removable="slotsForRole(role.key).length > role.min"
                    :resolve-image="resolveImage"
                    @assign-performer="assignPerformer"
                    @assign-character="store.assignCharacter"
                    @assign-bot="store.assignBot"
                    @clear="store.clearSlot"
                    @remove-slot="store.removeCastSlot"
                    @request-temporary="onRequestTemporary"
                  />
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="button"
                class="btn btn-primary rounded-xl gap-1.5"
                :disabled="!store.castReady"
                @click="activeCard = 'settings'"
              >
                Cast ready — configure show
                <Icon name="mdi:arrow-right" class="h-4 w-4" />
              </button>
            </div>
          </template>
        </section>

        <!-- Settings → Topic, turns, server -->
        <section
          v-else-if="activeCard === 'settings'"
          class="flex flex-1 flex-col overflow-y-auto p-5 gap-4"
        >
          <div class="flex flex-col gap-1">
            <h2 class="text-2xl font-black text-base-content">
              Configure the Show
            </h2>
            <p class="text-sm text-base-content/60">
              Optional topic, custom opening, turn count, and server settings.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Show title -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Show Title</label
              >
              <input
                v-model="store.showTitle"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                placeholder="Optional title"
                @change="store.persist()"
              />
            </div>

            <!-- Topic -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Topic / Premise</label
              >
              <input
                v-model="store.showTopic"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                placeholder="What's the show about tonight?"
                @change="store.persist()"
              />
            </div>

            <!-- Custom opening -->
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Custom Opening Cue</label
              >
              <input
                v-model="store.customOpening"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                :placeholder="
                  store.selectedStage?.openingCue || 'Opening cue...'
                "
                @change="store.persist()"
              />
            </div>

            <!-- Turns -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Turns ({{ store.maxTurns }})</label
              >
              <input
                v-model.number="store.maxTurns"
                type="range"
                min="2"
                max="40"
                step="1"
                class="range range-primary range-sm"
                @change="store.persist()"
              />
              <div class="flex justify-between text-xs text-base-content/30">
                <span>2</span><span>20</span><span>40</span>
              </div>
            </div>

            <!-- Delay -->
            <div class="flex flex-col gap-2">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Delay between turns ({{ store.turnDelayMs }}ms)</label
              >
              <input
                v-model.number="store.turnDelayMs"
                type="range"
                min="0"
                max="3000"
                step="100"
                class="range range-sm"
                @change="store.persist()"
              />
              <div class="flex justify-between text-xs text-base-content/30">
                <span>instant</span><span>1.5s</span><span>3s</span>
              </div>
            </div>

            <!-- Server -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Text Server</label
              >
              <select
                v-model="store.selectedTextServerId"
                class="select select-bordered rounded-2xl bg-base-100 focus:border-primary"
                @change="store.persist()"
              >
                <option :value="null">Default (botcafe)</option>
                <option
                  v-for="server in textServers"
                  :key="server.id"
                  :value="server.id"
                >
                  {{ server.title }}
                </option>
              </select>
            </div>

            <!-- Model -->
            <div class="flex flex-col gap-1.5">
              <label
                class="text-xs font-bold uppercase tracking-widest text-base-content/50"
                >Model</label
              >
              <input
                v-model="store.selectedModel"
                type="text"
                class="input input-bordered rounded-2xl bg-base-100 focus:border-primary"
                placeholder="gpt-4o-mini, llama3.1..."
                @change="store.persist()"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="button"
              class="btn btn-outline rounded-xl"
              @click="activeCard = 'cast'"
            >
              <Icon name="mdi:arrow-left" class="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              class="btn btn-primary rounded-xl gap-1.5"
              :disabled="!store.castReady"
              @click="goToRun"
            >
              <Icon name="mdi:play" class="h-4 w-4" />
              Start the show
            </button>
          </div>
        </section>

        <!-- Run → Live performance -->
        <section
          v-else-if="activeCard === 'run'"
          class="flex flex-1 flex-col overflow-hidden"
        >
          <!-- Transcript -->
          <div
            class="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
            :style="transcriptStyle"
          >
            <StageMessageCard
              v-for="entry in store.transcript"
              :key="entry.id"
              :entry="entry"
              :resolve-image="resolveImage"
            />
            <div
              v-if="!store.transcript.length"
              class="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center"
            >
              <img
                v-if="store.splashImagePath"
                :src="store.splashImagePath"
                alt="Stage"
                class="mx-auto h-32 w-auto rounded-2xl object-cover opacity-60"
              />
              <div>
                <p class="text-lg font-black text-base-content/40">
                  {{
                    store.castReady ? 'Cast is ready.' : 'Cast is not ready.'
                  }}
                </p>
                <p class="mt-1 text-sm text-base-content/30">
                  {{
                    store.castReady
                      ? 'Hit Start to begin the performance.'
                      : 'Go to Cast to fill the roles.'
                  }}
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="!store.castReady"
                  type="button"
                  class="btn btn-outline btn-sm rounded-xl"
                  @click="activeCard = 'cast'"
                >
                  <Icon name="mdi:account-multiple-plus" class="h-4 w-4" /> Cast
                  Roles
                </button>
                <button
                  type="button"
                  class="btn btn-primary btn-sm rounded-xl gap-1.5"
                  :disabled="!store.castReady"
                  @click="store.start()"
                >
                  <Icon name="mdi:play" class="h-4 w-4" /> Start Show
                </button>
              </div>
            </div>
            <div ref="transcriptBottom" />
          </div>

          <!-- Controls bar -->
          <div
            class="flex shrink-0 flex-wrap items-center gap-2 border-t border-base-300 bg-base-100/90 px-4 py-2.5 backdrop-blur-sm"
          >
            <!-- Start/Pause/Resume/Stop -->
            <template v-if="!store.isRunning">
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-2xl gap-1.5"
                :disabled="!store.castReady"
                @click="store.start()"
              >
                <Icon name="mdi:play" class="h-4 w-4" /> Start
              </button>
            </template>
            <template v-else-if="!store.isPaused">
              <button
                type="button"
                class="btn btn-warning btn-sm rounded-2xl"
                @click="store.pause()"
              >
                <Icon name="mdi:pause" class="h-4 w-4" /> Pause
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="btn btn-primary btn-sm rounded-2xl"
                @click="store.resume()"
              >
                <Icon name="mdi:play" class="h-4 w-4" /> Resume
              </button>
            </template>

            <button
              v-if="store.isRunning"
              type="button"
              class="btn btn-ghost btn-sm rounded-2xl"
              @click="store.stop()"
            >
              <Icon name="mdi:stop" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-2xl"
              :disabled="store.isGenerating || !store.transcript.length"
              @click="store.regenerateLastTurn()"
            >
              <Icon name="mdi:refresh" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-2xl"
              :disabled="store.isGenerating"
              @click="store.generateNextTurn()"
            >
              <Icon name="mdi:skip-next" class="h-4 w-4" />
            </button>

            <span class="flex-1 text-xs text-base-content/50">
              Turn {{ store.turnIndex }}/{{ store.maxTurns }}
              <span
                v-if="store.isGenerating"
                class="loading loading-dots loading-xs ml-1.5"
              />
            </span>
            <span
              v-if="!store.castReady"
              class="text-xs italic text-base-content/40"
              >Fill required roles to start.</span
            >
          </div>

          <!-- Interjection bar -->
          <div
            class="flex shrink-0 flex-col gap-2 border-t border-base-300 bg-base-100/90 px-4 py-2.5 backdrop-blur-sm"
          >
            <div class="flex gap-2">
              <input
                v-model="interjection"
                type="text"
                class="input input-bordered input-sm flex-1 rounded-2xl bg-base-100 focus:border-primary"
                placeholder="Jump in as yourself…"
                @keydown.enter.prevent="submitInterjection"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm rounded-2xl"
                :disabled="!interjection.trim()"
                @click="submitInterjection"
              >
                <Icon name="mdi:send" class="h-4 w-4" />
              </button>
            </div>
            <div class="flex gap-2">
              <input
                v-model="narratorBeat"
                type="text"
                class="input input-bordered input-sm flex-1 rounded-2xl bg-base-100 focus:border-primary"
                placeholder="Add a stage direction or scene beat…"
                @keydown.enter.prevent="submitNarratorBeat"
              />
              <button
                type="button"
                class="btn btn-ghost btn-sm rounded-2xl"
                :disabled="!narratorBeat.trim()"
                @click="submitNarratorBeat"
              >
                <Icon name="mdi:script-text" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <!-- No card selected -->
        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center"
        >
          <img
            v-if="store.splashImagePath"
            :src="store.splashImagePath"
            alt="Stage"
            class="mx-auto h-40 w-auto rounded-3xl object-cover opacity-70 shadow-xl"
          />
          <div class="max-w-sm">
            <h2 class="text-2xl font-black text-base-content">
              Cast the chaos.
            </h2>
            <p class="mt-2 text-sm text-base-content/60">
              Pick a stage, cast your performers, and run the show.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary rounded-2xl gap-2"
            @click="activeCard = 'stage'"
          >
            <Icon name="mdi:theater" class="h-5 w-5" />
            Pick a stage
          </button>
        </div>
      </main>
    </div>

    <!-- ── Hand tray ────────────────────────────────────────────────────── -->
    <div
      class="flex shrink-0 items-center gap-2 overflow-x-auto border-t border-base-300 bg-base-100/80 px-4 py-2.5 backdrop-blur-sm scrollbar-thin"
    >
      <button
        v-for="card in CARDS"
        :key="card.key"
        type="button"
        class="relative flex shrink-0 flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200"
        style="width: 72px"
        :class="handCardClass(card.key)"
        @click="activeCard = card.key"
      >
        <!-- Deck thumbnail -->
        <div class="relative h-10 w-full shrink-0 overflow-hidden bg-base-200">
          <img
            v-if="card.deckImage"
            :src="card.deckImage"
            :alt="card.label"
            class="h-full w-full object-cover opacity-80"
          />
          <div v-else class="flex h-full items-center justify-center">
            <Icon :name="card.icon" class="h-4 w-4 opacity-40" />
          </div>
          <div
            v-if="activeCard === card.key"
            class="absolute inset-0 bg-primary/20"
          />
        </div>
        <!-- Label -->
        <div class="flex items-center justify-center gap-1 px-1 py-1.5">
          <Icon :name="card.icon" class="h-3 w-3 shrink-0" />
          <span class="text-[10px] font-black leading-none">{{
            card.label
          }}</span>
        </div>
        <span
          v-if="card.key === 'cast' && store.castReady"
          class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-content shadow"
        >
          <Icon name="mdi:check" class="h-2.5 w-2.5" />
        </span>
        <span
          v-else-if="card.key === 'stage' && store.selectedStage"
          class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-content shadow"
        >
          <Icon name="mdi:check" class="h-2.5 w-2.5" />
        </span>
        <span
          v-else-if="card.key === 'run' && store.transcript.length"
          class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-content shadow"
        >
          <span class="text-[8px] font-black">{{ store.turnIndex }}</span>
        </span>
      </button>
    </div>
    <PerformerCreator
      v-if="showPerformerCreator"
      :role-key="activeCreatorRoleKey"
      :stage-label="activeCreatorStageLabel"
      :genre="activeCreatorGenre"
      @assign="assignCreatedPerformer"
      @close="closePerformerCreator"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useStageStore } from '@/stores/stageStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useBotStore } from '@/stores/botStore'
import { useServerStore } from '@/stores/serverStore'
import StagePresetCard from './stage-preset.vue'
import StageRoleSlot from './stage-slot.vue'
import StageMessageCard from './stage-message.vue'
import {
  getStagePerformerById,
  performersForStageRole,
  performerToTemporaryParticipant,
  type StagePerformer,
} from '@/stores/helpers/stageCards'
import type {
  CastSlot,
  TemporaryParticipant,
} from '@/stores/helpers/stageHelper'

// ── Types ──────────────────────────────────────────────────────────────────

type CardKey = 'stage' | 'cast' | 'settings' | 'run'
type TextServerOption = {
  id: number
  title: string
  serverType: string
  isActive: boolean
}

// ── Stores ─────────────────────────────────────────────────────────────────

const store = useStageStore()
const characterStore = useCharacterStore()
const botStore = useBotStore()
const serverStore = useServerStore()

// ── UI state ───────────────────────────────────────────────────────────────

const activeCard = ref<CardKey | null>(null)
const isMobile = ref(false)
const showPerformerGallery = ref(false)
const pendingPerformer = ref<StagePerformer | null>(null)
const interjection = ref('')
const narratorBeat = ref('')
const transcriptBottom = ref<HTMLElement | null>(null)
const showPerformerCreator = ref(false)
const performerCreatorSlotId = ref<string | null>(null)
const performerCreatorRoleKey = ref<string | null>(null)
const pendingCustomPerformer = ref<TemporaryParticipant | null>(null)

// ── Card definitions ───────────────────────────────────────────────────────

const CARDS = [
  {
    key: 'stage' as CardKey,
    label: 'Stage',
    icon: 'mdi:theater',
    deckImage: '/images/stage/utility/stage-preset.webp',
  },
  {
    key: 'cast' as CardKey,
    label: 'Cast',
    icon: 'mdi:account-multiple',
    deckImage: '/images/stage/utility/performer-gallery.webp',
  },
  {
    key: 'settings' as CardKey,
    label: 'Settings',
    icon: 'mdi:tune',
    deckImage: '/images/stage/utility/director.webp',
  },
  {
    key: 'run' as CardKey,
    label: 'Run',
    icon: 'mdi:play-circle',
    deckImage: '/images/stage/utility/splash.webp',
  },
]

// ── Computed ───────────────────────────────────────────────────────────────

const textServers = computed<TextServerOption[]>(() => {
  const servers =
    (serverStore as { servers?: TextServerOption[] }).servers ?? []
  return servers.filter(
    (s) =>
      s.isActive &&
      (s.serverType === 'TEXT' || s.serverType === 'OPENAI_COMPATIBLE'),
  )
})

const transcriptStyle = computed(() => {
  if (!store.transcriptBackgroundImagePath) return {}
  return {
    backgroundImage: `linear-gradient(rgba(18,18,24,0.78),rgba(18,18,24,0.78)),url(${store.transcriptBackgroundImagePath})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────

function handCardClass(key: string): string {
  if (activeCard.value === key)
    return 'border-primary bg-primary/10 text-primary scale-105 shadow-md shadow-primary/20'
  return 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/40 hover:text-primary hover:-translate-y-0.5 hover:shadow-sm'
}

const activeCreatorRoleKey = computed<string | undefined>(() => {
  return performerCreatorRoleKey.value ?? undefined
})

const activeCreatorStageLabel = computed<string | undefined>(() => {
  return store.selectedStage?.label ?? undefined
})

const activeCreatorGenre = computed<string | undefined>(() => {
  return store.showTopic.trim() || store.selectedStage?.tagline || undefined
})

const hasPendingCastMember = computed<boolean>(() => {
  return Boolean(pendingPerformer.value || pendingCustomPerformer.value)
})

const pendingCastName = computed<string>(() => {
  return (
    pendingPerformer.value?.name ||
    pendingCustomPerformer.value?.name ||
    'Custom Performer'
  )
})

const pendingCastImage = computed<string | null>(() => {
  return (
    pendingPerformer.value?.imagePath ||
    pendingCustomPerformer.value?.imagePath ||
    store.temporaryPerformerImagePath ||
    null
  )
})

const pendingCastSpecies = computed<string>(() => {
  return (
    pendingPerformer.value?.species ||
    pendingCustomPerformer.value?.species ||
    'Temporary Performer'
  )
})

function slotsForRole(roleKey: string) {
  return store.cast.filter((slot) => slot.roleKey === roleKey)
}

function canAddSlot(roleKey: string): boolean {
  const stage = store.selectedStage
  if (!stage) return false
  const role = stage.roles.find((r) => r.key === roleKey)
  if (!role) return false
  return slotsForRole(roleKey).length < role.max
}

function isSlotFilled(slot: CastSlot): boolean {
  return slot.participantId != null || slot.temporary != null
}

function slotImage(slot: CastSlot): string | null {
  if (slot.temporary?.imagePath) return slot.temporary.imagePath
  if (slot.participantType === 'character' && slot.participantId) {
    const c = (characterStore.characters ?? []).find(
      (c) => c.id === slot.participantId,
    )
    return c?.imagePath ?? null
  }
  if (slot.participantType === 'bot' && slot.participantId) {
    const b = (botStore.bots ?? []).find((b) => b.id === slot.participantId)
    return b?.avatarImage ?? null
  }
  return null
}

function performersForRole(roleKey: string): StagePerformer[] {
  return performersForStageRole(store.selectedStageId, roleKey)
}

function resolveImage(artImageId: number | null): string | null {
  if (!artImageId) return null
  return `/api/art/image/${artImageId}/thumb`
}

function assignPerformer(slotId: string, performerId: string): void {
  const performer = getStagePerformerById(performerId)
  if (!performer) return
  store.assignTemporary(slotId, performerToTemporaryParticipant(performer))
}

function onSelectStage(stageId: string): void {
  store.selectStage(stageId)
  activeCard.value = 'cast'
}

function goToRun(): void {
  activeCard.value = 'run'
  store.start()
}

function openPerformerCreator(
  slotId: string | null = null,
  roleKey = '',
): void {
  performerCreatorSlotId.value = slotId
  performerCreatorRoleKey.value = roleKey || null
  showPerformerCreator.value = true
}

function closePerformerCreator(): void {
  showPerformerCreator.value = false
  performerCreatorSlotId.value = null
  performerCreatorRoleKey.value = null
}

function onRequestTemporary(slotId: string, roleKey: string): void {
  openPerformerCreator(slotId, roleKey)
}

function assignCreatedPerformer(performer: TemporaryParticipant): void {
  const payload: TemporaryParticipant = {
    ...performer,
    imagePath:
      performer.imagePath ||
      store.temporaryPerformerImagePath ||
      '/images/stage/utility/temporary-performer.webp',
    artImageId: performer.artImageId ?? null,
  }

  if (performerCreatorSlotId.value) {
    store.assignTemporary(performerCreatorSlotId.value, payload)
    closePerformerCreator()
    return
  }

  pendingPerformer.value = null
  pendingCustomPerformer.value = payload
  closePerformerCreator()
}

function clearPendingCastMember(): void {
  pendingPerformer.value = null
  pendingCustomPerformer.value = null
}

function assignPendingCastMember(slotId: string): void {
  if (pendingPerformer.value) {
    store.assignTemporary(
      slotId,
      performerToTemporaryParticipant(pendingPerformer.value),
    )
    clearPendingCastMember()
    return
  }

  if (pendingCustomPerformer.value) {
    store.assignTemporary(slotId, pendingCustomPerformer.value)
    clearPendingCastMember()
  }
}

function submitInterjection(): void {
  const text = interjection.value.trim()
  if (!text) return
  store.addUserInterjection(text)
  interjection.value = ''
}

function submitNarratorBeat(): void {
  const text = narratorBeat.value.trim()
  if (!text) return
  store.addNarratorBeat(text)
  narratorBeat.value = ''
}

// Auto-scroll transcript
watch(
  () => store.transcript.length,
  async () => {
    await nextTick()
    transcriptBottom.value?.scrollIntoView({ behavior: 'smooth' })
  },
)

// ── Lifecycle ─────────────────────────────────────────────────────────────

function maybeInit(source: unknown): void {
  if (
    source &&
    typeof source === 'object' &&
    'initialize' in source &&
    typeof (source as { initialize: unknown }).initialize === 'function'
  ) {
    void (source as { initialize: () => Promise<void> }).initialize()
  }
}

function updateBreakpoint() {
  isMobile.value = window.innerWidth < 1024
}

onMounted(() => {
  store.hydrate()
  maybeInit(characterStore)
  maybeInit(botStore)
  maybeInit(serverStore)
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 200ms ease,
    max-height 300ms ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 800px;
}

.slide-up-enter-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.slide-up-leave-active {
  transition: opacity 150ms ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
