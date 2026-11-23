<template>
  <section
    class="@container mt-6 rounded-2xl border border-amber-300/30 bg-slate-950/60 p-3 sm:p-5"
    aria-label="Private production art review"
    data-testid="capes-production-gallery"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p
          class="text-[11px] font-black uppercase tracking-widest text-amber-300"
        >
          Rendered ArtImage receipts / private review
        </p>
        <h3 class="mt-1 text-xl font-black">
          Eight review groups, thirty-five production candidates
        </h3>
        <p class="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
          These records have DONE ArtImage IDs in private Conductor art ledgers.
          Thumbnails appear only after authenticated retrieval succeeds. Source
          receipts do not certify visual approval or in-game attachment.
        </p>
      </div>
      <span
        class="rounded-lg border border-slate-600 px-3 py-1 text-xs text-slate-300"
      >
        Private · {{ artForSelected.length }} plates · {{ reviewCount }} locally
        reviewed
      </span>
    </div>
    <div
      class="mt-4 flex gap-2 overflow-x-auto pb-2"
      role="tablist"
      aria-label="Production cast"
    >
      <button
        v-for="person in CAPES_PRODUCTION_IDENTITIES"
        :key="person.signature"
        type="button"
        role="tab"
        :aria-selected="selected === person.signature"
        :data-testid="'capes-production-' + person.signature"
        class="shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-bold transition-colors"
        :class="
          selected === person.signature
            ? 'border-amber-300 bg-amber-300/20 text-amber-100'
            : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-amber-300'
        "
        @click="selected = person.signature"
      >
        {{ person.label }}
        <small class="block text-[10px] font-normal">{{
          person.subtitle
        }}</small>
      </button>
    </div>
    <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-xs text-slate-300">
        QA decisions are saved only in this browser and are not production
        approvals. Review composition, anatomy, canon, style, and lookalikes
        after the image loads.
      </p>
      <button
        type="button"
        class="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-100"
        data-testid="capes-export-production-qa"
        :disabled="reviewCount === 0"
        @click="exportReviews"
      >
        EXPORT IMAGE QA RECEIPTS
      </button>
    </div>
    <div class="mt-4 grid grid-cols-1 gap-3 @sm:grid-cols-2 @xl:grid-cols-3">
      <figure
        v-for="item in artForSelected"
        :key="item.key"
        class="min-w-0 overflow-hidden rounded-xl border border-slate-600/70 bg-slate-900"
        :class="{ '@sm:col-span-2': isLandscape(item.size) }"
        :data-testid="'capes-production-plate-' + item.key"
      >
        <div
          class="relative grid place-items-center overflow-hidden bg-slate-800/60"
          :class="isLandscape(item.size) ? 'aspect-[2/1]' : 'aspect-[3/4]'"
        >
          <img
            v-if="store.productionImageFor(item.artImageId)"
            :src="store.productionImageFor(item.artImageId)"
            :alt="item.title"
            class="h-full w-full object-contain"
            loading="lazy"
          />
          <div
            v-else
            class="p-4 text-center text-xs text-slate-300"
            role="status"
          >
            <span class="block text-2xl text-amber-300" aria-hidden="true"
              >✦</span
            >
            Private preview unavailable or loading
            <span class="mt-1 block text-[10px] text-slate-400">
              ArtImage #{{ item.artImageId }} · delivery unverified
            </span>
          </div>
        </div>
        <figcaption class="space-y-1 p-3">
          <strong class="block text-sm">{{ item.title }}</strong>
          <span class="block text-[11px] text-slate-300">
            {{ item.size }} · Job #{{ item.artJobId }} · ArtImage #{{
              item.artImageId
            }}
          </span>
          <code class="block break-all text-[10px] text-amber-100/80">
            {{ item.asset }}
          </code>
          <div class="space-y-2 border-t border-slate-600/70 pt-2">
            <p class="text-[11px] text-slate-300">
              {{ localReview[item.artImageId]?.decision ?? 'Not reviewed' }}
              <span v-if="localReview[item.artImageId]">
                · locally saved
                {{ localReview[item.artImageId]?.reviewedAt.slice(0, 10) }}
              </span>
            </p>
            <label class="block text-[11px] text-slate-200">
              Composition / anatomy / canon / style / originality notes
              <textarea
                v-model="reviewNotes[item.artImageId]"
                :aria-label="'Review notes for ' + item.title"
                maxlength="500"
                rows="2"
                class="mt-1 w-full rounded border border-slate-500 bg-slate-950 p-2 text-xs text-white"
                placeholder="Describe visual strengths or problems, including duplicate or copyright lookalikes."
              ></textarea>
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded border border-emerald-500 px-2 py-1 text-[11px]"
                :disabled="!store.productionImageFor(item.artImageId)"
                :data-testid="'capes-approve-' + item.key"
                @click="setReview(item.artImageId, 'approved')"
              >
                MARK ACCEPTABLE
              </button>
              <button
                type="button"
                class="rounded border border-rose-400 px-2 py-1 text-[11px]"
                :disabled="
                  !store.productionImageFor(item.artImageId) ||
                  !(reviewNotes[item.artImageId] ?? '').trim()
                "
                :data-testid="'capes-reject-' + item.key"
                @click="setReview(item.artImageId, 'rejected')"
              >
                FLAG REPLACEMENT
              </button>
            </div>
          </div>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCapesStyleCheckStore } from '~/stores/capesStyleCheckStore'
import {
  CAPES_PRODUCTION_IDENTITIES,
  CAPES_REVIEWABLE_PRODUCTION,
  capesProductionFor,
} from '~/utils/capesProductionArt'

const store = useCapesStyleCheckStore()
const selected =
  ref<(typeof CAPES_PRODUCTION_IDENTITIES)[number]['signature']>(
    'accident-earth',
  )
const artForSelected = computed(() => capesProductionFor(selected.value))
const isLandscape = (size: string) => size === '1536x768' || size === '1344x768'
watch(
  selected,
  (signature) => {
    void store.loadProductionImages(signature)
  },
  { immediate: true },
)

const REVIEW_STORAGE_KEY = 'capes-unstable-production-image-qa-v1'
type Decision = 'approved' | 'rejected'
type LocalReview = {
  decision: Decision
  note: string
  reviewedAt: string
  artImageId: number
}
const localReview = ref<Record<number, LocalReview>>({})
const reviewNotes = ref<Record<number, string>>({})
const reviewCount = computed(
  () =>
    CAPES_REVIEWABLE_PRODUCTION.filter(
      (entry) => localReview.value[entry.artImageId],
    ).length,
)

onMounted(() => {
  try {
    const saved = localStorage.getItem(REVIEW_STORAGE_KEY)
    if (!saved) return
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return
    const records = parsed as Record<string, unknown>
    for (const entry of CAPES_REVIEWABLE_PRODUCTION) {
      const raw = records[
        String(entry.artImageId)
      ] as Partial<LocalReview> | null
      if (!raw || !['approved', 'rejected'].includes(raw.decision ?? ''))
        continue
      if (raw.artImageId !== entry.artImageId || typeof raw.note !== 'string')
        continue
      if (raw.decision === 'rejected' && !raw.note.trim()) continue
      if (typeof raw.reviewedAt !== 'string') continue
      localReview.value[entry.artImageId] = raw as LocalReview
      reviewNotes.value[entry.artImageId] = raw.note.slice(0, 500)
    }
  } catch {
    // Browser cache is optional; an invalid cache never certifies a review.
  }
})

function setReview(artImageId: number, decision: Decision): void {
  if (!store.productionImageFor(artImageId)) return
  const allowed = CAPES_REVIEWABLE_PRODUCTION.some(
    (entry) => entry.artImageId === artImageId,
  )
  if (!allowed) return
  const note = (reviewNotes.value[artImageId] ?? '').trim().slice(0, 500)
  if (decision === 'rejected' && !note) return
  localReview.value = {
    ...localReview.value,
    [artImageId]: {
      artImageId,
      decision,
      note,
      reviewedAt: new Date().toISOString(),
    },
  }
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(localReview.value))
  } catch {
    // Session-only review remains visible if local storage is unavailable.
  }
}

function exportReviews(): void {
  if (!import.meta.client || !reviewCount.value) return
  const reviewed = CAPES_REVIEWABLE_PRODUCTION.flatMap((entry) => {
    const review = localReview.value[entry.artImageId]
    return review
      ? [
          {
            ...entry,
            ...review,
            source: 'browser-local-art-qa',
            productionApproved: false,
          },
        ]
      : []
  })
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ version: 1, reviewed }, null, 2)], {
      type: 'application/json',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = 'capes-production-image-qa.json'
  link.click()
  URL.revokeObjectURL(url)
}
</script>
