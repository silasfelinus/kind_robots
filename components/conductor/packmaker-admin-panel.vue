<!-- /components/conductor/packmaker-admin-panel.vue -->
<!--
  Packmaker admin generator (conductor packmaker/t-004). Admin-only: renders
  nothing for everyone else. Loads a pack manifest (seeded launch packs or
  pasted JSON), runs generation per item through the existing pipelines via
  packStore, shows per-item progress, and marks a fully-generated pack ready.
  Releasing a pack (making items public / storefront wiring) is deliberately
  NOT a button here — that step stays human-gated.
-->
<template>
  <section
    v-if="userStore.isAdmin"
    class="flex flex-col gap-4 rounded-3xl border border-warning/40 bg-base-100 p-5 shadow-sm"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <span
          class="flex size-9 items-center justify-center rounded-xl bg-warning/15 text-warning"
        >
          <Icon name="kind-icon:box" class="size-5" />
        </span>
        <div>
          <h3 class="text-base font-black text-base-content">Pack Generator</h3>
          <p class="text-xs font-semibold text-base-content/50">
            Admin only — items are created private until release is approved
          </p>
        </div>
      </div>
      <button
        class="btn btn-ghost btn-xs rounded-xl"
        @click="showImport = !showImport"
      >
        <Icon name="kind-icon:plus" class="size-3.5" />
        Load manifest JSON
      </button>
    </div>

    <!-- Paste-a-manifest for the NEXT pack -->
    <div v-if="showImport" class="flex flex-col gap-2">
      <textarea
        v-model="importText"
        rows="6"
        class="textarea textarea-bordered w-full font-mono text-xs"
        placeholder='{"schemaVersion": 1, "id": "my-pack", "title": "My Pack", "visibility": "draft", "price": {"hook": "free"}, "items": [...]}'
      />
      <div class="flex items-center gap-2">
        <button class="btn btn-primary btn-sm rounded-xl" @click="onImport">
          Import pack
        </button>
        <span
          v-if="importMessage"
          class="text-xs font-semibold"
          :class="importOk ? 'text-success' : 'text-error'"
          >{{ importMessage }}</span
        >
      </div>
    </div>

    <!-- Pack selector -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="pack in packStore.manifests"
        :key="pack.id"
        class="btn btn-sm rounded-2xl"
        :class="
          pack.id === selectedPackId
            ? 'btn-primary'
            : 'btn-ghost border border-base-300'
        "
        @click="selectedPackId = pack.id"
      >
        {{ pack.title }}
        <span class="badge badge-xs" :class="progressBadgeClass(pack.id)">
          {{ packStore.packProgress(pack.id).done }}/{{
            packStore.packProgress(pack.id).total
          }}
        </span>
      </button>
    </div>

    <template v-if="selectedPack">
      <!-- Pack header -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-outline badge-sm rounded-xl">{{
          selectedPack.price.hook
        }}</span>
        <span
          class="badge badge-sm rounded-xl"
          :class="
            packStore.packBuildStatus(selectedPack.id) === 'ready'
              ? 'badge-success'
              : 'badge-ghost'
          "
          >{{ packStore.packBuildStatus(selectedPack.id) }}</span
        >
        <p class="w-full text-sm leading-relaxed text-base-content/70">
          {{ selectedPack.description }}
        </p>
      </div>

      <!-- Item table -->
      <div class="flex flex-col gap-2">
        <article
          v-for="item in selectedPack.items"
          :key="item.id"
          class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="badge badge-xs rounded-lg"
                :class="typeBadge(item.type)"
              >
                {{ item.type }}
              </span>
              <span class="truncate text-sm font-bold text-base-content">
                {{ item.draftPayload?.title || item.id }}
              </span>
              <span
                class="badge badge-xs rounded-lg"
                :class="statusBadge(stateFor(item.id).status)"
              >
                {{ statusLabel(stateFor(item.id).status) }}
              </span>
              <span
                v-if="stateFor(item.id).refId"
                class="text-xs font-mono text-base-content/50"
                >#{{ stateFor(item.id).refId }}</span
              >
            </div>
            <p class="mt-1 line-clamp-2 text-xs text-base-content/60">
              {{ item.draftPayload?.description }}
            </p>
            <p
              v-if="stateFor(item.id).error"
              class="mt-1 text-xs font-semibold text-error"
            >
              {{ stateFor(item.id).error }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              v-if="!stateFor(item.id).refId"
              class="btn btn-primary btn-xs rounded-xl"
              :disabled="isBusy(item.id)"
              @click="onCreate(item.id)"
            >
              <span
                v-if="stateFor(item.id).status === 'creating'"
                class="loading loading-spinner loading-xs"
              />
              Create record
            </button>
            <button
              v-if="stateFor(item.id).refId && !stateFor(item.id).artImageId"
              class="btn btn-secondary btn-xs rounded-xl"
              :disabled="isBusy(item.id)"
              @click="onArt(item.id)"
            >
              <span
                v-if="stateFor(item.id).status === 'generating-art'"
                class="loading loading-spinner loading-xs"
              />
              Generate art
            </button>
            <button
              v-if="stateFor(item.id).refId"
              class="btn btn-ghost btn-xs rounded-xl"
              :disabled="isBusy(item.id)"
              title="Forget the local link and start this item over as a fresh row"
              @click="packStore.resetItem(selectedPack.id, item.id)"
            >
              <Icon name="kind-icon:refresh" class="size-3.5" />
            </button>
          </div>
        </article>
      </div>

      <!-- Pack-level actions -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          class="btn btn-outline btn-sm rounded-2xl"
          :disabled="anyBusy"
          @click="onGenerateAll"
        >
          <Icon name="kind-icon:sparkles" class="size-4" />
          Create all remaining records
        </button>
        <button
          v-if="packStore.packBuildStatus(selectedPack.id) !== 'ready'"
          class="btn btn-success btn-sm rounded-2xl"
          :disabled="!packStore.isPackComplete(selectedPack.id)"
          @click="onMarkReady"
        >
          <Icon name="kind-icon:check" class="size-4" />
          Mark pack ready
        </button>
        <button
          v-else
          class="btn btn-ghost btn-sm rounded-2xl"
          @click="packStore.markPackDraft(selectedPack.id)"
        >
          Back to draft
        </button>
        <span
          v-if="actionMessage"
          class="text-xs font-semibold text-base-content/60"
          >{{ actionMessage }}</span
        >
      </div>
      <p class="text-xs text-base-content/40">
        Ready is local bookkeeping. Making pack items public and wiring the
        storefront remain separate, human-approved steps.
      </p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { usePackStore, type PackItemBuildStatus } from '@/stores/packStore'
import type { PackItemType } from '@/stores/seeds/packManifests'

const userStore = useUserStore()
const packStore = usePackStore()

const selectedPackId = ref<string>('')
const showImport = ref(false)
const importText = ref('')
const importMessage = ref('')
const importOk = ref(false)
const actionMessage = ref('')

onMounted(() => {
  packStore.initialize()
  const firstPack = packStore.manifests[0]
  if (!selectedPackId.value && firstPack) {
    selectedPackId.value = firstPack.id
  }
})

const selectedPack = computed(
  () => packStore.packById(selectedPackId.value) || null,
)

function stateFor(itemId: string) {
  return packStore.itemState(selectedPackId.value, itemId)
}

function isBusy(itemId: string): boolean {
  const status = stateFor(itemId).status
  return status === 'creating' || status === 'generating-art'
}

const anyBusy = computed(
  () => selectedPack.value?.items.some((item) => isBusy(item.id)) ?? false,
)

function progressBadgeClass(packId: string): string {
  const { done, total } = packStore.packProgress(packId)
  if (total > 0 && done === total) return 'badge-success'
  if (done > 0) return 'badge-warning'
  return 'badge-ghost'
}

function typeBadge(type: PackItemType): string {
  switch (type) {
    case 'location':
      return 'badge-info'
    case 'genre':
      return 'badge-secondary'
    case 'character':
      return 'badge-primary'
    case 'reward':
      return 'badge-accent'
  }
}

function statusBadge(status: PackItemBuildStatus): string {
  switch (status) {
    case 'complete':
      return 'badge-success'
    case 'created':
      return 'badge-info'
    case 'creating':
    case 'generating-art':
      return 'badge-warning'
    case 'error':
      return 'badge-error'
    default:
      return 'badge-ghost'
  }
}

function statusLabel(status: PackItemBuildStatus): string {
  switch (status) {
    case 'generating-art':
      return 'rendering'
    default:
      return status
  }
}

function onImport(): void {
  const result = packStore.importManifest(importText.value)
  importOk.value = result.success
  importMessage.value = result.message
  if (result.success) {
    importText.value = ''
    showImport.value = false
  }
}

async function onCreate(itemId: string): Promise<void> {
  const result = await packStore.createItemRecord(selectedPackId.value, itemId)
  actionMessage.value = result.message
}

async function onArt(itemId: string): Promise<void> {
  const result = await packStore.generateItemArt(selectedPackId.value, itemId)
  actionMessage.value = result.message
}

// Sequential on purpose: one shared generation backend, no reason to slam it.
async function onGenerateAll(): Promise<void> {
  const pack = selectedPack.value
  if (!pack) return
  for (const item of pack.items) {
    if (!stateFor(item.id).refId) {
      const result = await packStore.createItemRecord(pack.id, item.id)
      actionMessage.value = result.message
      if (!result.success) break
    }
  }
}

function onMarkReady(): void {
  const result = packStore.markPackReady(selectedPackId.value)
  actionMessage.value = result.message
}
</script>
