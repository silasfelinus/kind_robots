<template>
  <section
    v-if="proposal"
    class="flex flex-col gap-4 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
  >
    <header class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="badge badge-primary rounded-2xl">Production actions</span>
          <span class="text-xs font-black uppercase tracking-widest text-base-content/40">
            {{ book?.title }} · {{ proposal.id }}
          </span>
        </div>
        <h3 class="mt-2 text-xl font-black">{{ proposal.title }}</h3>
        <p class="mt-1 max-w-3xl text-sm text-base-content/55">
          Human decisions and counterpart generation write directly to the canonical
          Conductor ledger. Generation may suggest. Only these controls accept.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <span class="badge badge-outline rounded-2xl">
          Color {{ production?.colorStatus || proposal.queue.status }}
        </span>
        <span class="badge badge-outline rounded-2xl">
          B&amp;W {{ production?.bwStatus || 'missing' }}
        </span>
        <span v-if="production?.pairStatus" class="badge badge-outline rounded-2xl">
          Pair {{ production.pairStatus }}
        </span>
      </div>
    </header>

    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <ProductionStageCard
        label="Color candidate"
        :done="Boolean(proposal.colorUrl)"
        :detail="colorCandidateDetail"
        icon-name="kind-icon:palette"
      />
      <ProductionStageCard
        label="Accepted color"
        :done="Boolean(proposal.accepted.color)"
        :detail="proposal.accepted.color || 'Awaiting human acceptance'"
        icon-name="kind-icon:check"
      />
      <ProductionStageCard
        label="B&W candidate"
        :done="Boolean(production?.bwRenderedPath || proposal.bwPath)"
        :detail="bwCandidateDetail"
        icon-name="kind-icon:pencil"
      />
      <ProductionStageCard
        label="Accepted B&W"
        :done="Boolean(proposal.accepted.bw)"
        :detail="proposal.accepted.bw || 'Awaiting human acceptance'"
        icon-name="kind-icon:check"
      />
      <ProductionStageCard
        label="Final pair"
        :done="isFinalPair"
        :detail="isFinalPair ? 'Confirmed print-ready pair' : 'Not finalized'"
        icon-name="kind-icon:book"
      />
    </div>

    <div
      v-if="colorUsesLegacyAsset || bwUsesLegacyAsset"
      class="alert alert-info rounded-2xl"
    >
      <icon name="kind-icon:archive" class="size-5" />
      <span>
        The displayed {{ legacyAssetLabel }} predates the current ArtJob queue. Adopting it
        keeps the existing Conductor file and does not fabricate missing generation metadata.
      </span>
    </div>

    <div
      v-if="production?.bwUrl || proposal.bwUrl"
      class="grid gap-4 rounded-2xl border border-base-300 bg-base-200/40 p-4 lg:grid-cols-[10rem_minmax(0,1fr)]"
    >
      <img
        :src="production?.bwUrl || proposal.bwUrl || ''"
        :alt="`${proposal.title} black-and-white candidate`"
        class="aspect-[2/3] w-full rounded-2xl border border-base-300 bg-white object-contain"
      />
      <div class="flex flex-col gap-2">
        <h4 class="font-black">Current B&amp;W production candidate</h4>
        <p class="break-all text-xs text-base-content/50">
          {{
            production?.bwRenderedPath ||
            proposal.bwPath ||
            proposal.accepted.bw ||
            proposal.final.bw
          }}
        </p>
        <div class="flex flex-wrap gap-2 text-xs">
          <span v-if="hasBwScore" class="badge badge-info rounded-2xl">
            Pair score {{ production?.bwSemanticScore }}
          </span>
          <span v-if="production?.bwSemanticVerdict" class="badge badge-outline rounded-2xl">
            {{ production.bwSemanticVerdict }}
          </span>
          <span v-if="production?.bwRevisionCount" class="badge badge-outline rounded-2xl">
            {{ production.bwRevisionCount }} archived revision{{ production.bwRevisionCount === 1 ? '' : 's' }}
          </span>
        </div>
        <ul
          v-if="production?.bwSemanticReasons.length"
          class="mt-1 list-disc space-y-1 pl-5 text-xs text-warning"
        >
          <li v-for="reason in production.bwSemanticReasons" :key="reason">
            {{ reason }}
          </li>
        </ul>
      </div>
    </div>

    <div v-if="userStore.isAdmin" class="flex flex-col gap-3">
      <input
        v-model="actionNote"
        type="text"
        class="input input-bordered w-full rounded-2xl"
        placeholder="Optional decision or revision note"
      />

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ProductionActionButton
          :label="colorUsesLegacyAsset ? 'Adopt displayed color' : 'Accept color master'"
          :confirm-label="colorUsesLegacyAsset ? 'Confirm legacy color adoption' : 'Confirm color acceptance'"
          icon-name="kind-icon:palette"
          :enabled="canAcceptColor"
          :armed="armedAction === 'accept-color'"
          :busy="studio.requestingAction"
          @click="runHumanAction('accept-color')"
        />

        <button
          type="button"
          class="btn rounded-2xl"
          :class="canRequestBw ? 'btn-secondary' : 'btn-disabled'"
          :disabled="!canRequestBw || studio.requestingAction"
          @click="requestBw(false)"
        >
          <span v-if="studio.requestingAction" class="loading loading-spinner loading-sm" />
          <icon v-else name="kind-icon:pencil" class="size-5" />
          Generate B&amp;W counterpart
        </button>

        <ProductionActionButton
          :label="bwUsesLegacyAsset ? 'Adopt displayed B&W' : 'Accept B&W master'"
          :confirm-label="bwUsesLegacyAsset ? 'Confirm legacy B&W adoption' : 'Confirm B&W acceptance'"
          icon-name="kind-icon:check"
          :enabled="canAcceptBw"
          :armed="armedAction === 'accept-bw'"
          :busy="studio.requestingAction"
          @click="runHumanAction('accept-bw')"
        />

        <ProductionActionButton
          label="Finalize matched pair"
          confirm-label="Confirm final pair"
          icon-name="kind-icon:book"
          :enabled="canFinalizePair"
          :armed="armedAction === 'finalize-pair'"
          :busy="studio.requestingAction"
          @click="runHumanAction('finalize-pair')"
        />
      </div>

      <button
        v-if="canReviseBw"
        type="button"
        class="btn btn-outline btn-warning self-start rounded-2xl"
        :disabled="studio.requestingAction"
        @click="requestBw(true)"
      >
        <icon name="kind-icon:refresh" class="size-5" />
        Archive and regenerate B&amp;W
      </button>

      <p v-if="armedAction" class="text-xs font-semibold text-warning">
        This writes a production decision to Conductor. Click the highlighted button again to confirm.
      </p>
    </div>

    <div v-else class="alert rounded-2xl">
      <icon name="kind-icon:lock" class="size-5" />
      <span>Production decisions are visible to everyone and writable by admins.</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ColoringBookStudioOperation } from '~/types/coloringBookStudio'
import ProductionActionButton from './production-action-button.vue'
import ProductionStageCard from './production-stage-card.vue'
import { useColoringBookStudioStore } from '@/stores/coloringBookStudioStore'
import { useUserStore } from '@/stores/userStore'

const studio = useColoringBookStudioStore()
const userStore = useUserStore()
const actionNote = ref('')
const armedAction = ref<ColoringBookStudioOperation | null>(null)

const book = computed(() => studio.selectedBook)
const proposal = computed(() => studio.selectedProposal)
const production = computed(() => studio.selectedProductionState)

const isFinalPair = computed(() =>
  Boolean(proposal.value?.final.color && proposal.value?.final.bw),
)

const hasBwScore = computed(
  () => typeof production.value?.bwSemanticScore === 'number',
)

function adoptablePath(value: string | null | undefined): string {
  const path = String(value || '').trim().replace(/\\/g, '/')
  if (
    !path ||
    path.startsWith('/') ||
    path.includes(':') ||
    path.split('/').includes('..') ||
    !/\.(?:webp|png|jpe?g)$/i.test(path)
  ) {
    return ''
  }
  return path
}

const colorAcceptanceSource = computed(() => {
  if (proposal.value?.queue.status === 'done' && proposal.value.queue.renderedPath) {
    return ''
  }
  return adoptablePath(proposal.value?.colorPath)
})

const bwAcceptanceSource = computed(() => {
  if (
    production.value?.bwStatus === 'done' &&
    production.value.bwRenderedPath
  ) {
    return ''
  }
  return adoptablePath(proposal.value?.bwPath)
})

const colorUsesLegacyAsset = computed(
  () => Boolean(!proposal.value?.accepted.color && colorAcceptanceSource.value),
)

const bwUsesLegacyAsset = computed(
  () => Boolean(!proposal.value?.accepted.bw && bwAcceptanceSource.value),
)

const legacyAssetLabel = computed(() => {
  if (colorUsesLegacyAsset.value && bwUsesLegacyAsset.value) return 'color and B&W files'
  if (colorUsesLegacyAsset.value) return 'color file'
  return 'B&W file'
})

const canAcceptColor = computed(() =>
  Boolean(
    proposal.value &&
      !proposal.value.accepted.color &&
      proposal.value.colorUrl &&
      (proposal.value.queue.status === 'done' || colorAcceptanceSource.value),
  ),
)

const canRequestBw = computed(() => {
  if (!proposal.value?.accepted.color || proposal.value.accepted.bw) return false
  const status = production.value?.bwStatus || 'missing'
  return !['running', 'done', 'approved', 'needs_review'].includes(status)
})

const canReviseBw = computed(() => {
  if (!proposal.value?.accepted.color || proposal.value.accepted.bw) return false
  return ['done', 'needs_review', 'failed'].includes(
    production.value?.bwStatus || '',
  )
})

const canAcceptBw = computed(() =>
  Boolean(
    proposal.value?.accepted.color &&
      !proposal.value.accepted.bw &&
      ((production.value?.bwStatus === 'done' &&
        production.value.bwRenderedPath) ||
        bwAcceptanceSource.value),
  ),
)

const canFinalizePair = computed(() =>
  Boolean(
    proposal.value?.accepted.color &&
      proposal.value.accepted.bw &&
      !isFinalPair.value,
  ),
)

const colorCandidateDetail = computed(() => {
  if (proposal.value?.accepted.color) return 'Accepted master recorded'
  if (colorUsesLegacyAsset.value) return 'Existing Conductor set asset'
  if (typeof proposal.value?.queue.semanticScore === 'number') {
    return `Semantic score ${proposal.value.queue.semanticScore}`
  }
  return proposal.value?.queue.status || 'No candidate'
})

const bwCandidateDetail = computed(() => {
  if (proposal.value?.accepted.bw) return 'Accepted master recorded'
  if (bwUsesLegacyAsset.value) return 'Existing Conductor set asset'
  if (typeof production.value?.bwSemanticScore === 'number') {
    return `Pair score ${production.value.bwSemanticScore}`
  }
  return production.value?.bwStatus || 'No candidate'
})

watch(
  () => `${studio.selectedBookSlug}:${studio.selectedProposalId}`,
  () => {
    armedAction.value = null
    actionNote.value = ''
  },
)

async function runHumanAction(
  operation: 'accept-color' | 'accept-bw' | 'finalize-pair',
): Promise<void> {
  if (armedAction.value !== operation) {
    armedAction.value = operation
    return
  }
  const sourcePath =
    operation === 'accept-color'
      ? colorAcceptanceSource.value
      : operation === 'accept-bw'
        ? bwAcceptanceSource.value
        : ''
  const success = await studio.requestProductionAction(operation, {
    note: actionNote.value,
    sourcePath,
  })
  if (success) {
    armedAction.value = null
    actionNote.value = ''
  }
}

async function requestBw(force: boolean): Promise<void> {
  armedAction.value = null
  const success = await studio.requestBw(force, actionNote.value)
  if (success) actionNote.value = ''
}
</script>
