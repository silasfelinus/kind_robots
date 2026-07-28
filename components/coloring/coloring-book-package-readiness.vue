<template>
  <section
    v-if="packageData"
    id="coloring-package-readiness"
    class="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
  >
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge badge-primary rounded-2xl">Print package</span>
          <span
            v-if="!packageData.generated"
            class="badge badge-warning badge-outline rounded-2xl"
          >
            Initial canonical refresh pending
          </span>
        </div>
        <h3 class="mt-2 text-2xl font-black">Publishing readiness</h3>
        <p class="mt-1 max-w-3xl text-sm text-base-content/55">
          Source art, physical layout decisions, and export files are tracked as separate
          gates. A finished illustration is not secretly a paperback wearing sunglasses.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="badge badge-outline rounded-2xl">
          {{ sourceReadyCount }}/{{ packageData.books.length }} source-ready
        </span>
        <span
          class="badge rounded-2xl"
          :class="packageData.allPackageReady ? 'badge-success' : 'badge-warning'"
        >
          {{ packageData.allPackageReady ? 'All packages ready' : 'Packaging in progress' }}
        </span>
      </div>
    </header>

    <div class="grid gap-3 lg:grid-cols-3">
      <button
        v-for="book in packageData.books"
        :key="book.slug"
        type="button"
        class="rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
        :class="
          studio.selectedBookSlug === book.slug
            ? 'border-primary bg-primary/10'
            : 'border-base-300 bg-base-100'
        "
        @click="studio.selectBook(book.slug)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-base-content/40">
              Book {{ book.order }}
            </p>
            <h4 class="text-xl font-black">{{ book.title }}</h4>
          </div>
          <span class="badge rounded-2xl" :class="packageStatusTone(book.status)">
            {{ statusLabel(book.status) }}
          </span>
        </div>

        <progress
          class="progress progress-primary my-3 w-full"
          :value="book.finalPairCount"
          :max="book.expectedInteriorCount || 1"
        />

        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black">
              {{ book.finalPairCount }}/{{ book.expectedInteriorCount }}
            </p>
            <p class="text-base-content/45">Final pairs</p>
          </div>
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black" :class="book.coverStatus === 'final' ? 'text-success' : ''">
              {{ book.coverStatus }}
            </p>
            <p class="text-base-content/45">Cover</p>
          </div>
          <div class="rounded-2xl bg-base-200 p-2">
            <p class="font-black">
              {{ book.missingLayoutFields.length + book.missingExportFields.length }}
            </p>
            <p class="text-base-content/45">Package gaps</p>
          </div>
        </div>

        <p class="mt-3 text-xs leading-relaxed text-base-content/55">
          {{ book.nextAction }}
        </p>
      </button>
    </div>

    <div v-if="selectedPackage" class="flex flex-col gap-4">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="stage in stages"
          :key="stage.label"
          class="rounded-2xl border border-base-300 bg-base-200/40 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <icon :name="stage.icon" class="size-6" :class="stage.ready ? 'text-success' : 'text-warning'" />
            <span class="badge badge-sm rounded-2xl" :class="stage.ready ? 'badge-success' : 'badge-warning'">
              {{ stage.ready ? 'Ready' : 'Pending' }}
            </span>
          </div>
          <h4 class="mt-3 font-black">{{ stage.label }}</h4>
          <p class="mt-1 text-xs leading-relaxed text-base-content/50">
            {{ stage.detail }}
          </p>
        </article>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <article class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <h4 class="text-lg font-black">Source-production blockers</h4>
          <p class="mt-1 text-xs text-base-content/50">
            {{ selectedPackage.finalPairCount }}/{{ selectedPackage.expectedInteriorCount }} final pairs ·
            cover {{ selectedPackage.coverStatus }}
          </p>

          <div v-if="sourceBlockers.length" class="mt-3 flex flex-col gap-3">
            <div
              v-for="blocker in sourceBlockers"
              :key="blocker.label"
              class="rounded-2xl bg-base-200/60 p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-sm font-black">{{ blocker.label }}</span>
                <span class="badge badge-error badge-sm rounded-2xl">
                  {{ blocker.values.length }}
                </span>
              </div>
              <p class="mt-1 break-words text-xs text-base-content/50">
                {{ summarizeValues(blocker.values) }}
              </p>
            </div>
          </div>
          <div v-else class="alert alert-success mt-3 rounded-2xl">
            <icon name="kind-icon:check" class="size-5" />
            <span>All canonical source assets are complete and verified.</span>
          </div>
        </article>

        <article class="rounded-3xl border border-base-300 bg-base-100 p-4">
          <h4 class="text-lg font-black">Layout and export blockers</h4>
          <p class="mt-1 text-xs text-base-content/50">
            These fields stay unresolved until a printer, trim, binding, and template are chosen.
          </p>

          <div class="mt-4">
            <p class="text-xs font-black uppercase tracking-widest text-base-content/40">
              Missing layout decisions
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="field in selectedPackage.missingLayoutFields"
                :key="field"
                class="badge badge-warning badge-outline rounded-2xl"
              >
                {{ fieldLabel(field) }}
              </span>
              <span
                v-if="!selectedPackage.missingLayoutFields.length"
                class="badge badge-success rounded-2xl"
              >
                Layout configured
              </span>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-xs font-black uppercase tracking-widest text-base-content/40">
              Missing exports
            </p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="field in selectedPackage.missingExportFields"
                :key="field"
                class="badge badge-info badge-outline rounded-2xl"
              >
                {{ fieldLabel(field) }}
              </span>
              <span
                v-if="!selectedPackage.missingExportFields.length"
                class="badge badge-success rounded-2xl"
              >
                Export files verified
              </span>
            </div>
          </div>

          <p
            v-if="selectedPackage.orderedInteriorManifest"
            class="mt-4 break-all text-xs text-base-content/45"
          >
            Ordered manifest: {{ selectedPackage.orderedInteriorManifest }}
          </p>
        </article>
      </div>

      <div class="alert alert-info rounded-2xl">
        <icon name="kind-icon:info" class="size-5" />
        <span>
          Canonical source art is {{ packageData.requirements.sourcePixelSize }} at
          {{ packageData.requirements.sourceAspectRatio }}. It will not be cropped into a
          printer template until the physical format is explicitly chosen.
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ColoringBookPackageStatus } from '~/types/coloringBookPackage'
import {
  packageStatusTone,
} from '@/utils/coloringBookPackage'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'

const studio = useColoringBookStudioStore()
const packageData = computed(() => studio.packageData)
const selectedPackage = computed(() => studio.selectedPackage)
const sourceReadyCount = computed(
  () => packageData.value?.books.filter((book) => book.sourceReady).length ?? 0,
)

const stages = computed(() => {
  const book = selectedPackage.value
  if (!book) return []
  return [
    {
      label: 'Source assets',
      ready: book.sourceReady,
      detail: `${book.finalPairCount}/${book.expectedInteriorCount} final interior pairs; cover ${book.coverStatus}.`,
      icon: 'kind-icon:gallery',
    },
    {
      label: 'Print layout',
      ready: book.layoutReady,
      detail: book.layoutReady
        ? 'Trim, bleed, binding, paper, color, and printer template are configured.'
        : `${book.missingLayoutFields.length} physical-layout decisions remain.`,
      icon: 'kind-icon:ruler',
    },
    {
      label: 'Package exports',
      ready: book.exportsReady,
      detail: book.exportsReady
        ? 'Interior PDF, cover-wrap PDF, and source archive exist.'
        : `${book.missingExportFields.length} export files remain.`,
      icon: 'kind-icon:download',
    },
    {
      label: 'Publish package',
      ready: book.packageReady,
      detail: book.packageReady
        ? 'Validated files are ready for the publishing hand-off.'
        : book.nextAction,
      icon: 'kind-icon:book',
    },
  ]
})

const sourceBlockers = computed(() => {
  const issues = selectedPackage.value?.sourceIssues
  if (!issues) return []
  const blockers = [
    { label: 'Missing slots', values: issues.missingSlots.map(String) },
    { label: 'Duplicate slots', values: issues.duplicateSlots.map(String) },
    { label: 'Missing prompts', values: issues.missingPrompts },
    { label: 'Missing final color', values: issues.missingFinalColor },
    { label: 'Missing final B&W', values: issues.missingFinalBw },
    { label: 'Missing color files', values: issues.missingColorFiles },
    { label: 'Missing B&W files', values: issues.missingBwFiles },
    ...(issues.coverNotFinal ? [{ label: 'Cover source', values: ['not final'] }] : []),
  ]
  return blockers.filter((blocker) => blocker.values.length)
})

function statusLabel(status: ColoringBookPackageStatus): string {
  if (status === 'package-ready') return 'Package ready'
  if (status === 'exports-needed') return 'Exports needed'
  if (status === 'layout-needed') return 'Layout needed'
  return 'Source production'
}

function fieldLabel(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function summarizeValues(values: string[]): string {
  if (values.length <= 8) return values.join(', ')
  return `${values.slice(0, 8).join(', ')} +${values.length - 8} more`
}
</script>
