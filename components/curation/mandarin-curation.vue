<template>
  <section class="space-y-4">
    <div class="kr-panel space-y-4 p-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-xl font-black">Mandarin catalog</h1>
          <p class="mt-1 max-w-3xl text-xs leading-5 text-base-content/55">
            Curate one canonical learner-facing entry while the pinned source
            data stays untouched. Changes are global overrides with an
            append-only audit trail, not parallel editions.
          </p>
        </div>
        <button
          class="btn btn-sm rounded-xl"
          type="button"
          :disabled="loading"
          @click="store.load()"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          Refresh
        </button>
      </div>

      <div
        v-if="payload"
        class="stats stats-horizontal max-w-full overflow-x-auto bg-base-200 shadow-sm"
      >
        <div class="stat px-4 py-2">
          <div class="stat-title text-xs">Canonical cards</div>
          <div class="stat-value text-xl">{{ payload.stats.cards }}</div>
        </div>
        <div class="stat px-4 py-2">
          <div class="stat-title text-xs">Overrides</div>
          <div class="stat-value text-xl">{{ payload.stats.overridden }}</div>
        </div>
        <div class="stat px-4 py-2">
          <div class="stat-title text-xs">Audio cached</div>
          <div class="stat-value text-xl">{{ payload.stats.withAudio }}</div>
        </div>
        <div class="stat px-4 py-2">
          <div class="stat-title text-xs">HSK 1</div>
          <div class="stat-value text-xl">{{ payload.stats.hsk1 }}</div>
        </div>
        <div class="stat px-4 py-2">
          <div class="stat-title text-xs">HSK 2</div>
          <div class="stat-value text-xl">{{ payload.stats.hsk2 }}</div>
        </div>
      </div>

      <div
        class="grid gap-3"
        style="
          grid-template-columns: repeat(
            auto-fit,
            minmax(min(12rem, 100%), 1fr)
          );
        "
      >
        <label class="form-control gap-1">
          <span class="text-xs font-black text-base-content/55"
            >Search catalog</span
          >
          <input
            v-model="search"
            type="search"
            class="input input-bordered input-sm rounded-xl"
            placeholder="Hanzi, pinyin, meaning, source…"
          />
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-black text-base-content/55">Category</span>
          <select
            v-model="categoryFilter"
            class="select select-bordered select-sm rounded-xl"
          >
            <option value="all">All categories</option>
            <option
              v-for="category in payload?.categories || []"
              :key="category"
              :value="category"
            >
              {{ category }}
            </option>
          </select>
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-black text-base-content/55">HSK</span>
          <select
            v-model="hskFilter"
            class="select select-bordered select-sm rounded-xl"
          >
            <option value="all">All levels</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
          </select>
        </label>

        <label class="form-control gap-1">
          <span class="text-xs font-black text-base-content/55">Sort</span>
          <select
            v-model="sortKey"
            class="select select-bordered select-sm rounded-xl"
          >
            <option value="hsk">HSK / frequency</option>
            <option value="hanzi">Hanzi</option>
            <option value="pinyin">Pinyin</option>
            <option value="meaning">English meaning</option>
            <option value="category">Category</option>
          </select>
        </label>

        <label
          class="mt-auto flex cursor-pointer items-center gap-2 rounded-xl border border-base-300 px-3 py-2 text-sm font-bold"
        >
          <input
            v-model="overrideOnly"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          Changed only
        </label>
      </div>
    </div>

    <div
      v-if="notice"
      class="alert border border-success/25 bg-success/10 text-sm"
    >
      <span>{{ notice }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="notice = ''">
        Dismiss
      </button>
    </div>
    <div v-if="error" class="alert border border-error/25 bg-error/10 text-sm">
      <span class="min-w-0 flex-1 break-words">{{ error }}</span>
      <button class="kr-btn-ghost-xs-plain" type="button" @click="error = ''">
        Dismiss
      </button>
    </div>

    <div
      v-if="loading && !payload"
      class="grid min-h-64 place-items-center kr-panel"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <div
      v-else
      class="grid min-h-0 gap-4"
      style="
        grid-template-columns: repeat(auto-fit, minmax(min(25rem, 100%), 1fr));
      "
    >
      <div class="kr-panel min-w-0 overflow-hidden">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-200/60 px-4 py-3"
        >
          <p class="font-black">{{ visibleRows.length }} words shown</p>
          <p class="text-xs text-base-content/45">
            Source identity is immutable. Select a row to edit its effective
            learner-facing values.
          </p>
        </div>

        <div class="max-h-[68vh] overflow-auto">
          <table class="table table-pin-rows table-sm min-w-[64rem]">
            <thead>
              <tr>
                <th>Hanzi</th>
                <th>Pinyin</th>
                <th>Meaning</th>
                <th>HSK</th>
                <th>Categories</th>
                <th>Media</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in visibleRows"
                :key="row.cardKey"
                class="cursor-pointer hover:bg-base-200/60"
                :class="{ 'bg-primary/5': row.cardKey === selectedCardKey }"
                @click="store.selectCard(row.cardKey)"
              >
                <td>
                  <div class="flex items-center gap-2">
                    <span class="text-2xl font-black">{{
                      row.effective.simplified
                    }}</span>
                    <span
                      v-if="row.effective.traditional"
                      class="text-xs text-base-content/45"
                    >
                      {{ row.effective.traditional }}
                    </span>
                  </div>
                </td>
                <td class="font-semibold">
                  {{ row.effective.pinyin }}
                  <span
                    v-if="fieldChanged(row, 'pinyin')"
                    class="text-warning"
                    title="Admin override"
                    >•</span
                  >
                </td>
                <td class="max-w-80">
                  <span class="line-clamp-2">{{ row.effective.meaning }}</span>
                </td>
                <td>
                  <span
                    v-if="row.effective.hskLevel"
                    class="badge badge-sm badge-outline"
                  >
                    {{ row.effective.hskLevel }}
                  </span>
                </td>
                <td class="max-w-72">
                  <div class="flex max-h-12 flex-wrap gap-1 overflow-hidden">
                    <span
                      v-for="category in row.effective.categories"
                      :key="category"
                      class="badge badge-ghost badge-sm"
                    >
                      {{ category }}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    class="badge badge-sm"
                    :class="
                      row.audioReady
                        ? 'badge-success badge-outline'
                        : 'badge-ghost'
                    "
                  >
                    {{ row.audioReady ? 'audio' : 'no audio' }}
                  </span>
                </td>
                <td>
                  <span
                    v-if="row.hasOverride"
                    class="badge badge-warning badge-sm"
                    >overridden</span
                  >
                  <span v-else class="text-xs text-base-content/35"
                    >source</span
                  >
                </td>
                <td>
                  <button
                    class="kr-btn-ghost-xs-plain"
                    type="button"
                    @click.stop="store.selectCard(row.cardKey)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <aside
        v-if="selectedRow && draft"
        class="kr-panel min-w-0 overflow-hidden xl:sticky xl:top-4 xl:self-start"
      >
        <div
          class="flex items-start justify-between gap-3 border-b border-base-300 bg-base-200/60 p-4"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-4xl font-black">{{
                selectedRow.effective.simplified
              }}</span>
              <span v-if="selectedRow.hasOverride" class="badge badge-warning"
                >global override</span
              >
              <span v-if="draftDirty" class="badge badge-info badge-outline"
                >unsaved</span
              >
            </div>
            <p class="mt-1 text-xs text-base-content/50">
              {{ selectedRow.cardKey }} · {{ selectedRow.source.sourceLabel }}
            </p>
          </div>
          <button
            class="btn btn-circle btn-ghost btn-sm"
            type="button"
            aria-label="Close editor"
            @click="store.closeEditor()"
          >
            ×
          </button>
        </div>

        <div class="max-h-[74vh] space-y-4 overflow-y-auto p-4">
          <div
            v-if="draftDirty"
            class="rounded-xl border border-info/30 bg-info/10 p-3 text-xs leading-5"
            role="status"
          >
            This draft has unsaved changes. Saving, discarding, or restoring to
            the source is explicit so a row switch cannot erase work silently.
          </div>

          <div
            class="rounded-xl border border-base-300 bg-base-200/40 p-3 text-xs leading-5"
          >
            <p class="font-black uppercase tracking-wide text-base-content/55">
              Immutable source
            </p>
            <p class="mt-1">
              <strong>{{ selectedRow.source.pinyin }}</strong> ·
              {{ selectedRow.source.meaning }}
            </p>
            <p class="mt-1 text-base-content/50">
              {{ selectedRow.source.sourceVersion }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="category in selectedRow.source.categories"
                :key="category"
                class="badge badge-ghost badge-xs"
              >
                {{ category }}
              </span>
            </div>
          </div>

          <div
            v-if="selectedRow.overriddenFields.length"
            class="flex flex-wrap gap-1"
          >
            <span class="mr-1 text-xs font-black">Overridden:</span>
            <span
              v-for="field in selectedRow.overriddenFields"
              :key="field"
              class="badge badge-warning badge-outline badge-sm"
            >
              {{ field }}
            </span>
          </div>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Traditional form</span>
            <input
              v-model="draft.traditional"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Leave blank if none"
            />
          </label>

          <label class="form-control gap-1">
            <span
              class="flex items-center justify-between gap-2 text-xs font-black"
            >
              Pinyin
              <span
                v-if="draft.pinyin !== selectedRow.source.pinyin"
                class="text-warning"
                >changed</span
              >
            </span>
            <input
              v-model="draft.pinyin"
              class="input input-bordered input-sm rounded-xl"
            />
            <span class="text-[11px] text-base-content/45"
              >Use tone marks, not tone numbers.</span
            >
          </label>

          <label class="form-control gap-1">
            <span
              class="flex items-center justify-between gap-2 text-xs font-black"
            >
              Primary meaning
              <span
                v-if="draft.meaning !== selectedRow.source.meaning"
                class="text-warning"
                >changed</span
              >
            </span>
            <input
              v-model="draft.meaning"
              class="input input-bordered input-sm rounded-xl"
            />
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Meanings / senses</span>
            <textarea
              v-model="draft.meaningsText"
              class="textarea textarea-bordered min-h-28 rounded-xl text-sm leading-5"
              placeholder="One sense per line"
            />
            <span class="text-[11px] text-base-content/45"
              >One sense per line. The primary meaning is always kept
              first.</span
            >
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Topical categories</span>
            <input
              v-model="draft.categoriesText"
              class="input input-bordered input-sm rounded-xl"
              placeholder="animals, food-drink, casino"
            />
            <span class="text-[11px] leading-5 text-base-content/45">
              Comma-separated. Beginner and HSK tags are source-controlled and
              cannot be removed here.
            </span>
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Usage note</span>
            <textarea
              v-model="draft.usageNote"
              class="textarea textarea-bordered min-h-20 rounded-xl text-sm leading-5"
              placeholder="Regional, formal, colloquial, casino-specific, or other learner context"
            />
          </label>

          <label class="form-control gap-1">
            <span class="text-xs font-black">Change note</span>
            <textarea
              v-model="draft.note"
              class="textarea textarea-bordered min-h-16 rounded-xl text-sm leading-5"
              placeholder="Why are we changing this entry?"
            />
            <span class="text-[11px] text-base-content/45"
              >Stored with the audit record. Useful, but not required.</span
            >
          </label>

          <div class="flex flex-wrap gap-2">
            <button
              class="kr-btn-primary"
              type="button"
              :disabled="!canSave"
              @click="store.saveSelected()"
            >
              <span v-if="saving" class="loading loading-spinner loading-xs" />
              Save changes
            </button>
            <button
              v-if="draftDirty"
              class="kr-btn-ghost"
              type="button"
              :disabled="saving"
              @click="store.discardDraft()"
            >
              Discard draft
            </button>
            <button
              class="btn btn-outline btn-sm rounded-xl"
              type="button"
              :disabled="saving"
              @click="store.resetDraftToSource()"
            >
              Restore source values
            </button>
          </div>

          <details
            v-if="selectedRow.changes.length"
            class="rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <summary class="cursor-pointer text-xs font-black">
              Audit history · {{ selectedRow.changes.length }} recent change{{
                selectedRow.changes.length === 1 ? '' : 's'
              }}
            </summary>
            <div class="mt-3 space-y-3">
              <article
                v-for="change in selectedRow.changes"
                :key="change.id"
                class="rounded-lg bg-base-200/60 p-3 text-xs leading-5"
              >
                <div
                  class="flex flex-wrap justify-between gap-2 text-base-content/50"
                >
                  <span>#{{ change.id }} · admin {{ change.adminUserId }}</span>
                  <span>{{ formatTime(change.createdAt) }}</span>
                </div>
                <p v-if="change.note" class="mt-1 font-semibold">
                  {{ change.note }}
                </p>
                <p class="mt-1">
                  <span class="text-base-content/45">Before:</span>
                  {{ change.before.pinyin }} · {{ change.before.meaning }}
                </p>
                <p>
                  <span class="text-base-content/45">After:</span>
                  {{ change.after.pinyin }} · {{ change.after.meaning }}
                </p>
              </article>
            </div>
          </details>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import type { MandarinCurationRow } from '@/types/mandarinCuration'
import { useMandarinCurationStore } from '@/stores/mandarinCurationStore'

const store = useMandarinCurationStore()
const {
  payload,
  loading,
  saving,
  error,
  notice,
  search,
  categoryFilter,
  hskFilter,
  sortKey,
  overrideOnly,
  selectedCardKey,
  draft,
  selectedRow,
  draftDirty,
  canSave,
  visibleRows,
} = storeToRefs(store)

function fieldChanged(row: MandarinCurationRow, field: string): boolean {
  return row.overriddenFields.includes(field)
}

function formatTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

onMounted(() => {
  void store.load()
})
</script>
