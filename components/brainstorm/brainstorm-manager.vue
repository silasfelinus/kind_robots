<template>
  <section
    class="kr-container-wide flex flex-col gap-4 px-1 pb-8 sm:gap-5 sm:px-2"
    aria-label="Brainstorm idea workbench"
    data-testid="brainstorm-manager"
  >
    <form
      class="kr-panel-flat border border-base-content/10 bg-base-100/95 p-4 shadow-xl backdrop-blur sm:p-6"
      data-testid="brainstorm-composer"
      @submit.prevent="generate"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-[min(100%,28rem)] flex-1">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary"
            data-testid="brainstorm-persona-badge"
          >
            <img
              v-if="persona?.avatarImage && !personaAvatarFailed"
              :src="persona.avatarImage"
              :alt="persona.name"
              class="h-4 w-4 rounded-full object-cover"
              loading="lazy"
              @error="personaAvatarFailed = true"
            />
            <span v-else aria-hidden="true">🧠</span>
            Brainstorm
          </div>
          <h2 class="text-2xl font-black tracking-tight text-base-content sm:text-3xl">
            What are we trying to invent?
          </h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-base-content/65">
            Give Brainstorm a premise, problem, joke setup, art target, or half-formed thought.
            It will propose a batch. You keep the sparks and bully the beige ones into doing better.
          </p>
          <p
            v-if="persona?.tagline"
            class="mt-1 text-xs italic text-base-content/45"
            data-testid="brainstorm-persona-tagline"
          >
            {{ persona.tagline }}
          </p>
        </div>

        <div class="rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-base-content/75">
          <p class="font-black text-secondary">Human taste stays in charge.</p>
          <p class="mt-1 max-w-56 leading-5">The model makes options. None become anything else until you choose.</p>
        </div>
      </div>

      <div class="mt-5">
        <label for="brainstorm-premise" class="text-sm font-black text-base-content">
          Premise
        </label>
        <textarea
          id="brainstorm-premise"
          v-model="premiseModel"
          class="textarea textarea-bordered mt-2 min-h-28 w-full resize-y bg-base-100 text-base leading-6"
          maxlength="12000"
          placeholder="Invent ten terrible ice cream flavors with an actual comic premise…"
          :disabled="isGenerating"
          data-testid="brainstorm-premise"
          @keydown.meta.enter.prevent="generate"
          @keydown.ctrl.enter.prevent="generate"
        />
      </div>

      <div class="mt-4" data-testid="brainstorm-output-domain">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
            Output
          </p>
        </div>
        <div class="mt-2 flex flex-wrap gap-2" role="group" aria-label="Output domain">
          <button
            v-for="domain in BRAINSTORM_OUTPUT_DOMAINS"
            :key="domain.id"
            type="button"
            class="btn btn-sm h-auto min-h-9 rounded-full px-3 py-2"
            :class="outputDomain === domain.id ? 'btn-primary' : 'btn-ghost border border-base-content/10 bg-base-100'"
            :aria-pressed="outputDomain === domain.id"
            :disabled="isGenerating"
            :data-testid="`brainstorm-output-domain-${domain.id}`"
            @click="store.setOutputDomain(domain.id)"
          >
            {{ domain.label }}
          </button>
        </div>
        <p class="mt-2 max-w-3xl text-xs leading-5 text-base-content/55">
          {{ BRAINSTORM_OUTPUT_DOMAINS.find((domain) => domain.id === outputDomain)?.description }}
        </p>
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label for="brainstorm-count" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
            {{ isArtPromptDomain ? 'Prompts' : 'Ideas' }}
          </label>
          <input
            id="brainstorm-count"
            v-model.number="resultCountModel"
            type="number"
            :min="minimumMixResults"
            :max="BRAINSTORM_MAX_RESULTS"
            class="input input-bordered mt-1 w-24 bg-base-100 font-bold"
            :disabled="isGenerating"
            data-testid="brainstorm-count"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary min-w-36"
          :disabled="!canGenerate"
          data-testid="brainstorm-generate"
        >
          <span v-if="isBatchGenerating" class="loading loading-spinner loading-sm" aria-hidden="true" />
          {{ isBatchGenerating ? 'Brainstorming…' : activeCandidates.length ? 'Fresh batch' : (isArtPromptDomain ? 'Generate art prompts' : 'Generate ideas') }}
        </button>

        <p class="max-w-xl text-xs leading-5 text-base-content/50">
          {{ resultCountModel }} distinct direction{{ resultCountModel === 1 ? '' : 's' }}. A fresh batch does not erase the previous one.
        </p>
      </div>

      <div class="mt-4" data-testid="brainstorm-creative-directions">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
            Push the batch
          </p>
          <p class="text-xs text-base-content/45">Creative moves, not model knobs.</p>
        </div>
        <div class="mt-2 flex flex-wrap gap-2" role="group" aria-label="Creative direction">
          <button
            v-for="direction in creativeDirections"
            :key="direction.id"
            type="button"
            class="btn btn-sm h-auto min-h-9 rounded-full px-3 py-2"
            :class="mode === direction.id ? 'btn-secondary' : 'btn-ghost border border-base-content/10 bg-base-100'"
            :aria-pressed="mode === direction.id"
            :disabled="isGenerating"
            :data-testid="`brainstorm-direction-${direction.id}`"
            @click="store.setMode(direction.id)"
          >
            {{ direction.label }}
          </button>
        </div>
        <p class="mt-2 max-w-3xl text-xs leading-5 text-base-content/55">
          {{ activeCreativeDirection.description }}
        </p>
      </div>

      <details
        class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/45 p-3"
        data-testid="brainstorm-response-mix"
      >
        <summary class="cursor-pointer select-none text-sm font-bold text-base-content/75">
          Response mix
          <span class="ml-2 font-normal text-base-content/45">{{ responseMixSummary }}</span>
        </summary>

        <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Batch shape">
          <button
            type="button"
            class="btn btn-sm rounded-full"
            :class="batchShape === 'focused' ? 'btn-primary' : 'btn-ghost border border-base-content/10 bg-base-100'"
            :aria-pressed="batchShape === 'focused'"
            :disabled="isGenerating"
            data-testid="brainstorm-shape-focused"
            @click="store.setBatchShape('focused')"
          >
            Focused
          </button>
          <button
            type="button"
            class="btn btn-sm rounded-full"
            :class="batchShape === 'assortment' ? 'btn-primary' : 'btn-ghost border border-base-content/10 bg-base-100'"
            :aria-pressed="batchShape === 'assortment'"
            :disabled="isGenerating"
            data-testid="brainstorm-shape-assortment"
            @click="store.setBatchShape('assortment')"
          >
            Assortment
          </button>
        </div>

        <p class="mt-2 max-w-3xl text-xs leading-5 text-base-content/55">
          <template v-if="batchShape === 'focused'">
            Keep one coherent response family while the ideas themselves diverge.
          </template>
          <template v-else-if="returnTypes.length === 0">
            Adaptive assortment: Brainstorm chooses several response lenses that fit the premise.
          </template>
          <template v-else>
            Selected lenses appear at least once. Leave a count blank for Auto, or pin an exact quota.
          </template>
        </p>

        <div
          v-if="batchShape === 'assortment'"
          class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-3"
          data-testid="brainstorm-return-types"
        >
          <div
            v-for="option in BRAINSTORM_RETURN_TYPES"
            :key="option.id"
            class="rounded-2xl border p-3"
            :class="returnTypeSelected(option.id) ? 'border-secondary/35 bg-secondary/8' : 'border-base-content/10 bg-base-100/70'"
          >
            <label class="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-secondary checkbox-sm mt-0.5"
                :checked="returnTypeSelected(option.id)"
                :disabled="isGenerating"
                :data-testid="`brainstorm-return-type-${option.id}`"
                @change="store.toggleReturnType(option.id)"
              />
              <span class="min-w-0">
                <span class="block text-sm font-black text-base-content">{{ option.label }}</span>
                <span class="mt-1 block text-xs leading-5 text-base-content/55">{{ option.description }}</span>
              </span>
            </label>

            <div
              v-if="returnTypeSelected(option.id)"
              class="mt-3 flex flex-wrap items-center gap-2 border-t border-base-content/8 pt-3"
            >
              <label :for="`brainstorm-return-count-${option.id}`" class="text-xs font-bold text-base-content/55">
                How many?
              </label>
              <input
                :id="`brainstorm-return-count-${option.id}`"
                type="number"
                min="1"
                :max="BRAINSTORM_MAX_RESULTS"
                :value="returnTypeCount(option.id) ?? ''"
                placeholder="Auto"
                class="input input-bordered input-sm w-24 bg-base-100"
                :disabled="isGenerating"
                @input="updateReturnTypeCount(option.id, $event)"
              />
              <span class="text-xs text-base-content/45">
                {{ returnTypeCount(option.id) ? 'pinned' : 'Auto' }}
              </span>
            </div>
          </div>
        </div>

        <p
          v-if="batchShape === 'assortment' && returnTypes.length"
          class="mt-3 text-xs leading-5 text-base-content/45"
        >
          Pinned quotas plus one slot for each Auto lens require at least {{ minimumMixResults }} ideas. Extra slots stay flexible.
        </p>
      </details>

      <details class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/45 p-3">
        <summary class="cursor-pointer select-none text-sm font-bold text-base-content/75">
          Add constraints or examples
        </summary>
        <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
          <div>
            <label for="brainstorm-constraints" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
              Constraints
            </label>
            <textarea
              id="brainstorm-constraints"
              v-model="constraintsModel"
              class="textarea textarea-bordered mt-1 min-h-24 w-full resize-y bg-base-100"
              maxlength="8000"
              placeholder="Each under 15 words. No repeats. Make the danger obvious but cartoonish."
              :disabled="isGenerating"
            />
          </div>
          <div>
            <label for="brainstorm-examples" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
              Your examples
            </label>
            <textarea
              id="brainstorm-examples"
              v-model="examplesText"
              class="textarea textarea-bordered mt-1 min-h-24 w-full resize-y bg-base-100"
              maxlength="12000"
              placeholder="One example per line. These are context, not a mold."
              :disabled="isGenerating"
            />
          </div>
        </div>
      </details>

      <details
        class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/45 p-3"
        data-testid="brainstorm-source"
      >
        <summary class="cursor-pointer select-none text-sm font-bold text-base-content/75">
          Ground it in a Kind Robots object
          <span v-if="source" class="ml-2 font-normal text-success">linked</span>
        </summary>

        <p class="mt-3 max-w-3xl text-xs leading-5 text-base-content/55">
          Pick a Character or Dream to brainstorm around. It rides along with the session and every candidate, but never changes what the model can see beyond what you'd normally share.
        </p>

        <div
          v-if="resolvedSource"
          class="mt-3 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3"
          data-testid="brainstorm-source-selected"
        >
          <img
            v-if="resolvedSource.thumbnailUrl"
            :src="resolvedSource.thumbnailUrl"
            :alt="resolvedSource.title"
            class="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
          <div
            v-else
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-base-300 text-lg"
            aria-hidden="true"
          >
            🧩
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black text-base-content">
              {{ resolvedSource.title }}
            </p>
            <p class="truncate text-xs text-base-content/55">
              {{ resolvedSource.subtitle || resolvedSource.modelType }}
            </p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl text-error"
            data-testid="brainstorm-source-remove"
            @click="clearSource"
          >
            <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
        <p v-else-if="isResolvingSource" class="mt-3 text-xs text-base-content/50">
          Loading selected source…
        </p>

        <div class="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2">
          <label class="form-control">
            <span class="label py-1"
              ><span class="label-text text-xs font-bold uppercase tracking-[0.12em] text-base-content/55"
                >Type</span
              ></span
            >
            <select
              v-model="sourceModelType"
              class="select select-bordered select-sm rounded-xl bg-base-100"
              data-testid="brainstorm-source-type"
            >
              <option v-for="adapter in sourceAdapters" :key="adapter.modelType" :value="adapter.modelType">
                {{ adapter.label }}
              </option>
            </select>
          </label>
          <label class="form-control">
            <span class="label py-1"
              ><span class="label-text text-xs font-bold uppercase tracking-[0.12em] text-base-content/55"
                >Search</span
              ></span
            >
            <input
              v-model="sourceQuery"
              type="search"
              class="input input-bordered input-sm rounded-xl bg-base-100"
              placeholder="Search by name…"
              data-testid="brainstorm-source-query"
              @keydown.enter.prevent="runSourceSearch"
            />
          </label>
          <button
            type="button"
            class="btn btn-sm rounded-xl"
            :disabled="isSearchingSource"
            data-testid="brainstorm-source-search"
            @click="runSourceSearch"
          >
            <span v-if="isSearchingSource" class="loading loading-spinner loading-xs" aria-hidden="true" />
            Search
          </button>
        </div>

        <ul
          v-if="sourceSearchResults.length"
          class="mt-3 grid gap-2"
          data-testid="brainstorm-source-results"
        >
          <li v-for="option in sourceSearchResults" :key="`${option.modelType}-${option.id}`">
            <button
              type="button"
              class="w-full rounded-xl border border-base-content/10 bg-base-100 p-2 text-left text-sm hover:border-primary/40"
              @click="pickSource(option)"
            >
              <span class="font-bold">{{ option.title }}</span>
              <span v-if="option.subtitle" class="ml-2 text-xs text-base-content/50">{{ option.subtitle }}</span>
            </button>
          </li>
        </ul>
        <p
          v-else-if="!isSearchingSource && sourceQuery"
          class="mt-3 text-xs text-base-content/45"
        >
          No {{ sourceModelType }} matched "{{ sourceQuery }}".
        </p>
      </details>

      <details
        class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/45 p-3"
        data-testid="brainstorm-saved-work"
      >
        <summary class="cursor-pointer select-none text-sm font-bold text-base-content/75">
          Saved work
          <span v-if="savedSessionId" class="ml-2 font-normal text-success">linked</span>
        </summary>

        <p class="mt-3 max-w-3xl text-xs leading-5 text-base-content/55">
          Unsaved work stays private in this browser. Signed-in saves are private to your account and preserve batches, candidate IDs, curation, revisions, and branch lineage.
        </p>

        <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
          <div class="rounded-2xl border border-base-content/10 bg-base-100/75 p-3">
            <label for="brainstorm-session-name" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
              Session name
            </label>
            <input
              id="brainstorm-session-name"
              v-model="sessionNameModel"
              class="input input-bordered mt-2 w-full bg-base-100"
              maxlength="255"
              :placeholder="suggestedSessionName"
              :disabled="isPersisting"
              data-testid="brainstorm-session-name"
            />

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="isPersisting || !premise.trim()"
                @click="store.useSuggestedSessionName()"
              >
                Use premise
              </button>
              <button
                type="button"
                class="btn btn-success btn-sm"
                :disabled="!canSaveSession || isGenerating"
                data-testid="brainstorm-save-session"
                @click="saveSession"
              >
                <span v-if="persistenceState === 'saving'" class="loading loading-spinner loading-xs" aria-hidden="true" />
                {{ savedSessionId ? 'Update saved session' : 'Save session' }}
              </button>
              <button
                v-if="savedSessionId"
                type="button"
                class="btn btn-ghost btn-sm"
                :disabled="isPersisting"
                data-testid="brainstorm-save-as-new"
                @click="store.detachSavedSession()"
              >
                Save as new
              </button>
            </div>

            <p v-if="lastSavedAt" class="mt-2 text-xs text-base-content/45">
              Last saved {{ formatSavedTime(lastSavedAt) }}.
            </p>
          </div>

          <div class="rounded-2xl border border-base-content/10 bg-base-100/75 p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
                History
              </p>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                :disabled="isPersisting"
                data-testid="brainstorm-load-saved-list"
                @click="loadSavedSessions"
              >
                {{ savedSessions.length ? 'Refresh list' : 'Load saved sessions' }}
              </button>
            </div>

            <p
              v-if="!savedSessions.length"
              class="mt-2 text-xs leading-5 text-base-content/45"
            >
              No saved sessions loaded yet.
            </p>

            <ul
              v-else
              class="mt-2 flex flex-col gap-1.5"
              data-testid="brainstorm-saved-session-list"
            >
              <li v-for="saved in savedSessions" :key="saved.id">
                <button
                  type="button"
                  class="flex w-full items-start justify-between gap-2 rounded-xl border p-2 text-left transition"
                  :class="
                    saved.id === savedSessionId
                      ? 'border-secondary/40 bg-secondary/10'
                      : 'border-base-content/10 bg-base-100 hover:border-secondary/30'
                  "
                  :disabled="isPersisting"
                  data-testid="brainstorm-open-saved-session"
                  @click="openSavedSession(saved.id)"
                >
                  <span class="min-w-0">
                    <span
                      class="block truncate text-sm font-bold text-base-content"
                    >
                      {{ saved.name }}
                    </span>
                    <span
                      class="mt-0.5 block truncate text-xs text-base-content/50"
                    >
                      {{ saved.premise || 'No premise recorded.' }}
                    </span>
                  </span>
                  <span class="flex shrink-0 flex-col items-end gap-0.5">
                    <span class="badge badge-ghost badge-sm">
                      {{ saved.candidateCount }} idea{{
                        saved.candidateCount === 1 ? '' : 's'
                      }}
                    </span>
                    <span class="text-[10px] text-base-content/40">
                      {{ formatSavedTime(saved.updatedAt) }}
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div
          v-if="persistenceError"
          class="alert mt-4 border border-warning/25 bg-warning/10 text-base-content"
          role="alert"
          data-testid="brainstorm-persistence-error"
        >
          <span aria-hidden="true">⚠</span>
          <div class="min-w-0 flex-1">
            <p class="font-black">{{ persistenceErrorHeading }}</p>
            <p class="mt-1 break-words text-sm opacity-80">{{ persistenceError.message }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="store.clearPersistenceError()">
            Dismiss
          </button>
        </div>
      </details>
    </form>

    <div
      v-if="generationError"
      class="alert border border-error/25 bg-error/10 text-base-content"
      role="alert"
      data-testid="brainstorm-error"
    >
      <span aria-hidden="true">⚠</span>
      <div class="min-w-0 flex-1">
        <p class="font-black">{{ errorHeading }}</p>
        <p class="mt-1 break-words text-sm opacity-80">{{ generationError.message }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="store.clearGenerationError()">
        Dismiss
      </button>
    </div>

    <details
      v-if="allKeptCandidates.length"
      class="kr-panel-flat border border-base-content/10 bg-base-100/85 p-3"
      data-testid="brainstorm-kept-export"
    >
      <summary
        class="flex cursor-pointer select-none flex-wrap items-center justify-between gap-2"
      >
        <span class="text-sm font-bold text-base-content/75">
          Kept ideas
          <span class="ml-1 font-normal text-base-content/45">
            {{ selectedKeptCandidates.length }}/{{ allKeptCandidates.length }}
            selected
          </span>
        </span>
        <span class="text-xs text-base-content/40"
          >Copy or export without leaving this page</span
        >
      </summary>

      <ul class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="candidate in allKeptCandidates"
          :key="candidate.id"
          class="flex items-start gap-2 rounded-xl border border-base-content/10 bg-base-100 p-2"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-secondary mt-0.5"
            :checked="!excludedKeptIds.has(candidate.id)"
            :data-testid="`brainstorm-kept-select-${candidate.id}`"
            @change="toggleKeptSelection(candidate.id)"
          />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-bold text-base-content">{{
              candidate.title
            }}</span>
            <span class="line-clamp-2 text-xs leading-5 text-base-content/55">{{
              candidate.text
            }}</span>
          </span>
        </li>
      </ul>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="!selectedKeptCandidates.length"
          data-testid="brainstorm-copy-kept"
          @click="copySelectedKept"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Copy selected
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm border border-base-content/10"
          :disabled="!selectedKeptCandidates.length"
          data-testid="brainstorm-export-kept"
          @click="exportSelectedKept"
        >
          <Icon name="kind-icon:download" class="h-4 w-4" />
          Export .md
        </button>
        <span v-if="keptExportMessage" class="text-xs text-base-content/50">{{
          keptExportMessage
        }}</span>
      </div>
    </details>

    <div
      v-if="batches.length > 1"
      class="kr-panel-flat flex flex-wrap items-center gap-2 border border-base-content/10 bg-base-100/85 p-3"
      aria-label="Brainstorm batch history"
    >
      <span class="mr-1 text-xs font-black uppercase tracking-[0.12em] text-base-content/45">Batches</span>
      <button
        v-for="(batch, index) in batches"
        :key="batch.id"
        type="button"
        class="btn btn-sm"
        :class="batch.id === activeBatchId ? 'btn-primary' : 'btn-ghost'"
        :disabled="isGenerating"
        @click="setActiveBatch(batch.id)"
      >
        {{ index + 1 }} · {{ batch.candidateIds.length }}
      </button>
    </div>

    <div
      v-if="activeCandidates.length"
      class="flex flex-wrap items-center justify-between gap-3 px-1"
    >
      <div>
        <p class="text-xs font-black uppercase tracking-[0.14em] text-base-content/45">Current batch</p>
        <p class="mt-1 text-sm text-base-content/65">
          {{ activeCandidates.length }} candidate{{ activeCandidates.length === 1 ? '' : 's' }} ·
          {{ keptCandidates.length }} kept · {{ rejectedCandidates.length }} rejected
        </p>
      </div>
      <p v-if="isGenerating && generationTargetId" class="text-sm font-bold text-secondary">
        Working on one idea without touching the others…
      </p>
    </div>

    <div
      v-if="keptCandidates.length"
      class="kr-panel-flat flex flex-wrap items-center justify-between gap-3 border border-secondary/20 bg-secondary/5 p-3"
      data-testid="brainstorm-art-batch"
    >
      <div class="min-w-0">
        <p
          class="text-xs font-black uppercase tracking-[0.14em] text-secondary/80"
        >
          Generate art
        </p>
        <p class="mt-1 text-sm text-base-content/65">
          {{ selectedForArtCount }} of {{ keptCandidates.length }} kept idea{{
            keptCandidates.length === 1 ? '' : 's'
          }}
          selected · Krea 2
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          :disabled="!selectedForArtCount || isGeneratingArt"
          @click="store.clearArtSelection()"
        >
          Clear selection
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm gap-1.5"
          :disabled="!selectedForArtCount || isGeneratingArt"
          data-testid="brainstorm-generate-art"
          @click="generateArt"
        >
          <span
            v-if="isGeneratingArt"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
          {{
            isGeneratingArt
              ? artProgressLabel
              : `Generate art for ${selectedForArtCount} selected`
          }}
        </button>
      </div>
    </div>

    <div
      v-if="artGenerationError"
      class="alert border border-error/25 bg-error/10 text-base-content"
      role="alert"
      data-testid="brainstorm-art-error"
    >
      <span aria-hidden="true">⚠</span>
      <div class="min-w-0 flex-1">
        <p class="font-black">Art generation hit a snag</p>
        <p class="mt-1 break-words text-sm opacity-80">
          {{ artGenerationError.message }}
        </p>
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="store.clearArtGenerationError()"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="activeCandidates.length"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-start gap-4"
      data-testid="brainstorm-candidates"
    >
      <BrainstormCandidateCard
        v-for="candidate in activeCandidates"
        :key="candidate.id"
        :candidate="candidate"
        :parent-candidate="parentCandidateFor(candidate)"
        :disabled="isGenerating"
        :busy="isCandidateBusy(candidate.id)"
        :busy-action="candidateBusyAction(candidate.id)"
        :selected-for-art="store.isSelectedForArt(candidate.id)"
        @keep="keepCandidate(candidate.id)"
        @reject="rejectCandidate(candidate.id)"
        @reset="resetCandidate(candidate.id)"
        @delete="deleteCandidate(candidate.id)"
        @feedback="setCandidateFeedback(candidate.id, $event)"
        @edit="editCandidate(candidate.id, $event)"
        @restore-revision="restoreRevision(candidate.id, $event)"
        @regenerate="regenerate(candidate.id)"
        @branch="branch(candidate.id)"
        @promote="promoteCandidate(candidate.id)"
        @toggle-art-selection="store.toggleArtSelection(candidate.id)"
      />
    </div>

    <div
      v-else-if="isBatchGenerating"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4"
      aria-label="Generating Brainstorm candidates"
    >
      <div
        v-for="index in skeletonCount"
        :key="index"
        class="kr-panel-flat min-h-56 animate-pulse border border-base-content/8 bg-base-100/75 p-5"
      >
        <div class="h-4 w-24 rounded bg-base-300" />
        <div class="mt-4 h-5 w-2/3 rounded bg-base-300" />
        <div class="mt-4 h-3 w-full rounded bg-base-200" />
        <div class="mt-2 h-3 w-5/6 rounded bg-base-200" />
        <div class="mt-2 h-3 w-4/6 rounded bg-base-200" />
      </div>
    </div>

    <div
      v-else
      class="kr-panel-flat border border-dashed border-base-content/20 bg-base-100/65 p-7 text-center shadow-sm"
      data-testid="brainstorm-empty"
    >
      <p class="text-3xl" aria-hidden="true">✦</p>
      <h3 class="mt-2 text-xl font-black text-base-content">No candidates yet.</h3>
      <p class="mx-auto mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
        The blank page is currently winning. Give Brainstorm something to push against, then decide which ideas deserve to survive.
      </p>
      <div class="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Brainstorm starters">
        <button
          v-for="starter in starterPremises"
          :key="starter.label"
          type="button"
          class="btn btn-ghost btn-sm h-auto min-h-10 max-w-full whitespace-normal border border-base-content/10 bg-base-100 px-3 py-2 text-left"
          :disabled="isGenerating"
          @click="applyStarter(starter)"
        >
          <span class="font-black">{{ starter.label }}</span>
          <span class="text-base-content/55">{{ starter.teaser }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import {
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_OUTPUT_DOMAINS,
  BRAINSTORM_RETURN_TYPES,
} from '@/types/brainstorm'
import type {
  BrainstormCandidate,
  BrainstormOutputDomainId,
  BrainstormReturnTypeId,
} from '@/types/brainstorm'
import { useBrainstormStore } from '@/stores/brainstormStore'
import {
  listBrainstormSourceAdapters,
  resolveBrainstormSource,
  searchBrainstormSources,
} from '@/stores/helpers/brainstormSourceAdapters'
import type {
  BrainstormSourceDisplay,
  BrainstormSourceOption,
} from '@/stores/helpers/brainstormSourceAdapters'
import { useBotStore } from '@/stores/botStore'
import type { Bot } from '~/prisma/generated/prisma/client'

const creativeDirections = [
  {
    id: 'freeform',
    label: 'Open field',
    description: 'Follow the premise wherever the strongest distinct ideas lead.',
  },
  {
    id: 'stranger',
    label: 'Stranger',
    description: 'Push beyond the first obvious answers without drifting into random noun soup.',
  },
  {
    id: 'grounded',
    label: 'More grounded',
    description: 'Keep the variety, but favor ideas a human could actually use or build on.',
  },
  {
    id: 'darker-funnier',
    label: 'Darker / funnier',
    description: 'Look for sharper comic premise, escalation, irony, cartoon peril, and darker absurdity where allowed.',
  },
  {
    id: 'shorter',
    label: 'Shorter',
    description: 'Cut throat-clearing and explanations. Keep the strongest useful seed.',
  },
  {
    id: 'different-angle',
    label: 'Different angle',
    description: 'Change the viewpoint, mechanism, relationship, structure, or assumption.',
  },
  {
    id: 'genre-shift',
    label: 'Genre shift',
    description: 'Recast the premise through genuinely different creative grammars, not costume changes.',
  },
  {
    id: 'invert',
    label: 'Invert it',
    description: 'Reverse a central assumption, role, incentive, cause, or expected outcome.',
  },
] as const

const starterPremises = [
  {
    label: 'Bad ice cream',
    teaser: 'Comic premise, not random gross nouns.',
    premise:
      'Invent ten terrible ice cream flavors. Each should have an actual comic premise, not just a random gross ingredient.',
    mode: 'darker-funnier',
    batchShape: 'assortment',
  },
  {
    label: 'Useful weirdness',
    teaser: 'Make an ordinary problem less ordinary.',
    premise:
      'Give me eight genuinely different ways to make waiting in a long line more fun without using phones or spending much money.',
    mode: 'different-angle',
    batchShape: 'focused',
  },
  {
    label: 'Cartoon peril',
    teaser: 'Safe does not mean bland.',
    premise:
      'Invent eight family-friendly comedy premises involving ridiculous cartoon peril. Find the joke instead of merely listing accidents.',
    mode: 'darker-funnier',
    batchShape: 'assortment',
  },
  {
    label: 'Visual directions',
    teaser: 'Different compositions, not adjective swaps.',
    premise: 'A clockwork librarian who is terrified of overdue books.',
    mode: 'stranger',
    batchShape: 'focused',
    outputDomain: 'art-prompts',
  },
] as const

const route = useRoute()
const router = useRouter()
const store = useBrainstormStore()
const {
  premise,
  resultCount,
  constraints,
  examples,
  mode,
  outputDomain,
  batchShape,
  returnTypes,
  activeCandidates,
  keptCandidates,
  allKeptCandidates,
  rejectedCandidates,
  batches,
  activeBatchId,
  minimumMixResults,
  isGenerating,
  canGenerate,
  generationError,
  generationTargetId,
  savedSessionId,
  sessionName,
  savedSessions,
  persistenceState,
  persistenceError,
  lastSavedAt,
  isPersisting,
  canSaveSession,
  suggestedSessionName,
  source,
  selectedForArtCandidates,
  artGenerationState,
  artGenerationError,
  artGenerationProgress,
  artGeneratingCandidateIds,
} = storeToRefs(store)

const pendingCandidateAction = ref<{
  id: string
  action: 'regenerate' | 'branch' | 'promote'
} | null>(null)

// Kept ideas are selected for copy/export by default; deselect individual
// ones by id rather than tracking a growing "selected" set.
const excludedKeptIds = ref<Set<string>>(new Set())
const keptExportMessage = ref('')
let keptExportMessageTimer: ReturnType<typeof setTimeout> | null = null

const premiseModel = computed({
  get: () => premise.value,
  set: (value: string) => store.setPremise(value),
})

const resultCountModel = computed({
  get: () => resultCount.value,
  set: (value: number) => store.setResultCount(value),
})

const constraintsModel = computed({
  get: () => constraints.value,
  set: (value: string) => store.setConstraints(value),
})

const examplesText = computed({
  get: () => examples.value.join('\n'),
  set: (value: string) => store.setExamplesFromText(value),
})

const sessionNameModel = computed({
  get: () => sessionName.value,
  set: (value: string) => store.setSessionName(value),
})

// Source object (brainstorm/t-012): ground the premise in an existing Kind
// Robots entity via the adapter registry in brainstormSourceAdapters.ts.
const sourceAdapters = listBrainstormSourceAdapters()
const sourceModelType = ref(sourceAdapters[0]?.modelType ?? 'character')
const sourceQuery = ref('')
const sourceSearchResults = ref<BrainstormSourceOption[]>([])
const isSearchingSource = ref(false)
const resolvedSource = ref<BrainstormSourceDisplay | null>(null)
const isResolvingSource = ref(false)

// Request-identity token: an overlapping earlier resolve (e.g. two rapid
// source changes) must not overwrite a later selection or resurrect a
// removed source once it finally settles (reviewer finding on PR #1820).
let sourceResolveToken = 0

watch(
  source,
  async (ref) => {
    const token = ++sourceResolveToken
    if (!ref) {
      resolvedSource.value = null
      isResolvingSource.value = false
      return
    }
    isResolvingSource.value = true
    try {
      const resolved = await resolveBrainstormSource(ref)
      if (token !== sourceResolveToken) return
      resolvedSource.value = resolved
    } finally {
      if (token === sourceResolveToken) {
        isResolvingSource.value = false
      }
    }
  },
  { immediate: true },
)

// Request-identity token: an overlapping earlier search (e.g. the user
// changes the type or edits the query while a prior search is still in
// flight) must not overwrite a newer search's results or clear the loading
// flag out from under it (follow-up reviewer finding on PR #1820).
let sourceSearchToken = 0

async function runSourceSearch() {
  const token = ++sourceSearchToken
  isSearchingSource.value = true
  try {
    const results = await searchBrainstormSources(
      sourceModelType.value,
      sourceQuery.value,
    )
    if (token !== sourceSearchToken) return
    sourceSearchResults.value = results
  } finally {
    if (token === sourceSearchToken) {
      isSearchingSource.value = false
    }
  }
}

function pickSource(option: BrainstormSourceOption) {
  store.setSource({ modelType: option.modelType, id: option.id })
  sourceSearchResults.value = []
  sourceQuery.value = ''
}

function clearSource() {
  store.setSource(null)
}

const activeCreativeDirection = computed(
  () => creativeDirections.find((direction) => direction.id === mode.value) || creativeDirections[0],
)

// conductor brainstorm/t-015: art-prompt output domain toggle.
const isArtPromptDomain = computed(() => outputDomain.value === 'art-prompts')

const responseMixSummary = computed(() => {
  if (batchShape.value === 'focused') return 'Focused'
  if (!returnTypes.value.length) return 'Assortment · adaptive'
  const pinned = returnTypes.value.filter((entry) => entry.count).length
  return `Assortment · ${returnTypes.value.length} lens${returnTypes.value.length === 1 ? '' : 'es'}${pinned ? ` · ${pinned} pinned` : ''}`
})

const isBatchGenerating = computed(
  () => isGenerating.value && !generationTargetId.value,
)

const selectedKeptCandidates = computed(() =>
  allKeptCandidates.value.filter(
    (candidate) => !excludedKeptIds.value.has(candidate.id),
  ),
)

const skeletonCount = computed(() => Math.min(resultCount.value, 6))

// brainstorm/t-016: batch art generation from explicitly selected kept
// candidates.
const isGeneratingArt = computed(
  () => artGenerationState.value === 'generating',
)
const selectedForArtCount = computed(
  () => selectedForArtCandidates.value.length,
)
const artProgressLabel = computed(() => {
  const progress = artGenerationProgress.value
  return progress
    ? `Generating ${progress.completed}/${progress.total}…`
    : 'Generating…'
})

const errorHeading = computed(() => {
  switch (generationError.value?.kind) {
    case 'auth':
      return 'Sign in to generate ideas'
    case 'mana':
      return 'Brainstorm needs more mana'
    case 'server':
      return 'Text server unavailable'
    case 'malformed':
      return 'That batch failed quality control'
    case 'provider':
      return 'The text provider stumbled'
    case 'validation':
      return 'Brainstorm needs a premise'
    default:
      return 'Brainstorm hit a snag'
  }
})

const persistenceErrorHeading = computed(() => {
  if (persistenceError.value?.kind === 'auth') return 'Sign in to save Brainstorms'
  if (persistenceError.value?.kind === 'validation') return 'Check this saved session'
  return 'Saved work hit a snag'
})

/*
 * ARRIVING WITH A SOURCE ALREADY CHOSEN (brainstorm/t-013).
 *
 * Mirrors storybook-page.vue's seedFromQuery(): a source object elsewhere in
 * the app (today, a Character's "Brainstorm variations" button) can launch
 * straight into a grounded session instead of making the user find and pick
 * it again in the "Ground it in a Kind Robots object" panel. Generic over
 * modelType -- any adapter registered in brainstormSourceAdapters.ts works
 * here, not just Character, so a future Dream/Scenario/Reward entry point
 * (brainstorm/t-014, t-019) needs no change to this function.
 *
 * Seeds on top of the restored session (called after initializeSession), and
 * clears the consumed query keys immediately so a reload/bookmark/share
 * doesn't silently re-seed after the user has moved the session on.
 */
function seedFromQuery(): void {
  const single = (value: unknown): string | null => {
    const raw = Array.isArray(value) ? value[0] : value
    return typeof raw === 'string' && raw ? raw : null
  }

  const modelType = single(route.query.source)
  const rawId = single(route.query.sourceId)
  const id = rawId ? Number(rawId) : NaN
  const intent = single(route.query.intent)

  if (modelType && Number.isInteger(id) && id > 0) {
    store.setSource({ modelType, id, ...(intent ? { intent } : {}) })
  }

  // Prefill the premise from intent only when the composer is still empty --
  // never clobber a premise the user (or the restored session) already has.
  if (intent && !premise.value.trim()) {
    store.setPremise(intent)
  }

  const consumed = ['source', 'sourceId', 'intent']
  if (!consumed.some((key) => route.query[key])) return

  const query = Object.fromEntries(
    Object.entries(route.query).filter(([key]) => !consumed.includes(key)),
  )
  void router.replace({ query })
}

// Purely decorative persona flourish (brainstorm/t-018): the historical
// Brainstorm bot persona survives in the live Bot table (slug
// "brainstorm-bot") with modern generated avatar/tagline art. Showing it here
// is soft flavor only -- generation never reads `persona` and works
// identically whether this bot exists, is renamed, or fails to load.
const botStore = useBotStore()
const persona = ref<Bot | null>(null)
const personaAvatarFailed = ref(false)

async function loadBrainstormPersona(): Promise<void> {
  try {
    const bots = await botStore.fetchBots()
    persona.value =
      bots.find(
        (bot) =>
          bot.slug === 'brainstorm-bot' &&
          bot.isPublic !== false &&
          bot.isActive !== false &&
          !bot.underConstruction,
      ) ?? null
  } catch {
    // Decorative only -- a failed/blocked bot fetch must never affect the
    // generation workbench, so it silently falls back to no persona flair.
    persona.value = null
  }
}

onMounted(() => {
  store.initializeSession()
  seedFromQuery()
  void loadBrainstormPersona()
})

function returnTypeSelected(id: BrainstormReturnTypeId): boolean {
  return returnTypes.value.some((entry) => entry.id === id)
}

function returnTypeCount(id: BrainstormReturnTypeId): number | null {
  return returnTypes.value.find((entry) => entry.id === id)?.count ?? null
}

function updateReturnTypeCount(id: BrainstormReturnTypeId, event: Event): void {
  const value = (event.target as HTMLInputElement).value
  store.setReturnTypeCount(id, value ? Number(value) : null)
}

function applyStarter(starter: (typeof starterPremises)[number]): void {
  store.setPremise(starter.premise)
  store.setMode(starter.mode)
  store.setBatchShape(starter.batchShape)
  store.setOutputDomain(
    ('outputDomain' in starter ? starter.outputDomain : 'ideas') as BrainstormOutputDomainId,
  )
}

function candidateBusyAction(
  candidateId: string,
): 'regenerate' | 'branch' | 'promote' | 'art' | null {
  if (pendingCandidateAction.value?.id === candidateId) {
    return pendingCandidateAction.value.action
  }
  return artGeneratingCandidateIds.value.includes(candidateId) ? 'art' : null
}

function isCandidateBusy(candidateId: string): boolean {
  return (
    generationTargetId.value === candidateId ||
    pendingCandidateAction.value?.id === candidateId ||
    artGeneratingCandidateIds.value.includes(candidateId)
  )
}

function parentCandidateFor(candidate: BrainstormCandidate): BrainstormCandidate | null {
  if (!candidate.parentId) return null
  return activeCandidates.value.find((entry) => entry.id === candidate.parentId) ?? null
}

function setActiveBatch(batchId: string): void {
  store.setActiveBatch(batchId)
}

function keepCandidate(candidateId: string): void {
  store.keepCandidate(candidateId)
}

function rejectCandidate(candidateId: string): void {
  store.rejectCandidate(candidateId)
}

function resetCandidate(candidateId: string): void {
  store.resetCandidateStatus(candidateId)
}

function deleteCandidate(candidateId: string): void {
  store.removeCandidate(candidateId)
}

function setCandidateFeedback(candidateId: string, value: string): void {
  store.setCandidateFeedback(candidateId, value)
}

function editCandidate(
  candidateId: string,
  patch: { title: string; text: string },
): void {
  store.editCandidate(candidateId, patch)
}

function restoreRevision(candidateId: string, revisionIndex: number): void {
  store.restoreCandidateRevision(candidateId, revisionIndex)
}

function formatSavedTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'recently'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

function toggleKeptSelection(candidateId: string): void {
  const next = new Set(excludedKeptIds.value)
  if (next.has(candidateId)) next.delete(candidateId)
  else next.add(candidateId)
  excludedKeptIds.value = next
}

function showKeptExportMessage(message: string): void {
  keptExportMessage.value = message
  if (keptExportMessageTimer) clearTimeout(keptExportMessageTimer)
  keptExportMessageTimer = setTimeout(() => {
    keptExportMessage.value = ''
  }, 4000)
}

function formatKeptCandidatesAsMarkdown(
  candidates: BrainstormCandidate[],
): string {
  return candidates
    .map((candidate) => `## ${candidate.title}\n\n${candidate.text}`)
    .join('\n\n---\n\n')
}

async function copySelectedKept(): Promise<void> {
  const selected = selectedKeptCandidates.value
  if (!selected.length) return
  try {
    await navigator.clipboard.writeText(
      formatKeptCandidatesAsMarkdown(selected),
    )
    showKeptExportMessage(
      `Copied ${selected.length} idea${selected.length === 1 ? '' : 's'}.`,
    )
  } catch {
    showKeptExportMessage(
      'Could not copy — your browser blocked clipboard access.',
    )
  }
}

function exportSelectedKept(): void {
  const selected = selectedKeptCandidates.value
  if (!selected.length) return
  const text = formatKeptCandidatesAsMarkdown(selected)
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `brainstorm-kept-ideas-${stamp}.md`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  showKeptExportMessage(
    `Exported ${selected.length} idea${selected.length === 1 ? '' : 's'}.`,
  )
}

async function saveSession(): Promise<void> {
  if (isGenerating.value) return
  await store.saveCurrentSession()
}

async function loadSavedSessions(): Promise<void> {
  await store.loadSavedSessions()
}

async function openSavedSession(id: number): Promise<void> {
  await store.openSavedSession(id)
}

async function generate(): Promise<void> {
  if (!canGenerate.value) return
  await store.generateBatch()
}

async function regenerate(candidateId: string): Promise<void> {
  pendingCandidateAction.value = { id: candidateId, action: 'regenerate' }
  try {
    await store.regenerateCandidate(candidateId)
  } finally {
    pendingCandidateAction.value = null
  }
}

async function branch(candidateId: string): Promise<void> {
  pendingCandidateAction.value = { id: candidateId, action: 'branch' }
  try {
    await store.branchCandidate(candidateId)
  } finally {
    pendingCandidateAction.value = null
  }
}

async function promoteCandidate(candidateId: string): Promise<void> {
  pendingCandidateAction.value = { id: candidateId, action: 'promote' }
  try {
    const result = await store.promoteCandidateToCharacter(candidateId)
    showKeptExportMessage(result.message)
  } finally {
    pendingCandidateAction.value = null
  }
}

async function generateArt(): Promise<void> {
  if (isGeneratingArt.value || !selectedForArtCount.value) return
  await store.generateArtForSelected()
}
</script>
