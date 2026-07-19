<!-- /components/wonderlab/component-registry-health.vue -->
<template>
  <section
    class="rounded-3xl border border-base-300 bg-base-100/85 p-4 shadow-sm"
  >
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-primary">
          Registry Health
        </p>
        <h2 class="mt-1 text-xl font-black">Manifest ↔ database coverage</h2>
        <p class="mt-1 max-w-3xl text-sm leading-relaxed text-base-content/60">
          Read-only comparison of canonical Vue source identity and existing
          Component records. Reconciliation remains an explicit admin action.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm rounded-xl"
        :disabled="loading"
        @click="loadHealth(true)"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
        Refresh
      </button>
    </header>

    <div
      v-if="errorMessage"
      class="mt-4 rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div v-else-if="loading && !health" class="mt-4 grid gap-3 sm:grid-cols-3">
      <div v-for="index in 9" :key="index" class="skeleton h-20 rounded-2xl" />
    </div>

    <template v-else-if="health">
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-2xl border border-base-300 bg-base-200/60 p-3">
          <p class="text-xs font-black uppercase text-base-content/45">Source files</p>
          <p class="mt-1 text-2xl font-black">{{ health.manifestCount }}</p>
        </div>
        <div class="rounded-2xl border border-base-300 bg-base-200/60 p-3">
          <p class="text-xs font-black uppercase text-base-content/45">DB records</p>
          <p class="mt-1 text-2xl font-black">{{ health.recordCount }}</p>
        </div>
        <div class="rounded-2xl border border-success/30 bg-success/10 p-3">
          <p class="text-xs font-black uppercase text-success">Matched</p>
          <p class="mt-1 text-2xl font-black text-success">
            {{ health.matchedRecordCount }}
          </p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.canonicalMatchCount === health.matchedRecordCount
              ? 'border-success/30 bg-success/10'
              : 'border-info/35 bg-info/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Canonical identity
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.canonicalMatchCount }}</p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.legacyFallbackCount
              ? 'border-warning/35 bg-warning/10'
              : 'border-success/30 bg-success/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Legacy fallback
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.legacyFallbackCount }}</p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.undiscoveredRecordCount
              ? 'border-warning/35 bg-warning/10'
              : 'border-success/30 bg-success/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Not discovered
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.undiscoveredRecordCount }}</p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.staleRecordCount
              ? 'border-warning/35 bg-warning/10'
              : 'border-success/30 bg-success/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Records without source
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.staleRecordCount }}</p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.missingRecordCount
              ? 'border-info/35 bg-info/10'
              : 'border-success/30 bg-success/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Sources without record
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.missingRecordCount }}</p>
        </div>
        <div
          class="rounded-2xl border p-3"
          :class="
            health.duplicateNameCount
              ? 'border-secondary/35 bg-secondary/10'
              : 'border-success/30 bg-success/10'
          "
        >
          <p class="text-xs font-black uppercase text-base-content/55">
            Duplicate names
          </p>
          <p class="mt-1 text-2xl font-black">{{ health.duplicateNameCount }}</p>
        </div>
      </div>

      <details
        v-if="
          health.staleRecordCount ||
          health.missingRecordCount ||
          health.legacyFallbackCount ||
          health.duplicateNameCount
        "
        class="mt-4 rounded-2xl border border-base-300 bg-base-200/40 p-3"
      >
        <summary class="cursor-pointer font-black text-base-content/80">
          Review registry differences
        </summary>

        <div class="mt-3 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <section>
            <h3 class="text-sm font-black text-warning">
              Database-only records
            </h3>
            <p class="mt-1 text-xs text-base-content/55">
              Preserved records that do not resolve to a current source file.
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li
                v-for="record in health.staleRecords.slice(0, detailLimit)"
                :key="record.id"
                class="break-all rounded-lg bg-base-100 px-2 py-1.5 font-mono"
              >
                #{{ record.id }} · {{ record.folderName }}/{{ record.componentName }}
              </li>
              <li v-if="health.staleRecordCount > detailLimit" class="text-base-content/50">
                +{{ health.staleRecordCount - detailLimit }} more
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-black text-info">Manifest-only sources</h3>
            <p class="mt-1 text-xs text-base-content/55">
              Source files that do not yet have a matching Component record.
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li
                v-for="entry in health.missingEntries.slice(0, detailLimit)"
                :key="entry.sourceKey"
                class="break-all rounded-lg bg-base-100 px-2 py-1.5 font-mono"
              >
                {{ entry.sourcePath }}
              </li>
              <li v-if="health.missingRecordCount > detailLimit" class="text-base-content/50">
                +{{ health.missingRecordCount - detailLimit }} more
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-black text-warning">Legacy fallback matches</h3>
            <p class="mt-1 text-xs text-base-content/55">
              Matched by folder/name because canonical source identity is not populated yet.
            </p>
            <ul class="mt-2 space-y-1 text-xs">
              <li
                v-for="record in health.legacyFallbackRecords.slice(0, detailLimit)"
                :key="record.id"
                class="break-all rounded-lg bg-base-100 px-2 py-1.5 font-mono"
              >
                #{{ record.id }} · {{ record.folderName }}/{{ record.componentName }}
              </li>
              <li v-if="health.legacyFallbackCount > detailLimit" class="text-base-content/50">
                +{{ health.legacyFallbackCount - detailLimit }} more
              </li>
            </ul>
          </section>

          <section>
            <h3 class="text-sm font-black text-secondary">Duplicate names</h3>
            <p class="mt-1 text-xs text-base-content/55">
              Valid by source identity, but still blocked by legacy global name uniqueness.
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="name in health.duplicateNames.slice(0, detailLimit)"
                :key="name"
                class="badge badge-secondary badge-outline badge-sm font-mono"
              >
                {{ name }}
              </span>
              <span
                v-if="health.duplicateNameCount > detailLimit"
                class="badge badge-ghost badge-sm"
              >
                +{{ health.duplicateNameCount - detailLimit }} more
              </span>
            </div>
          </section>
        </div>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  clearWonderLabManifestCache,
  loadWonderLabComponentManifest,
  type WonderLabComponentManifest,
} from '@/utils/wonderlab/componentManifest'
import {
  summarizeWonderLabRegistry,
  type WonderLabRegistryHealth,
  type WonderLabRegistryRecord,
} from '@/utils/wonderlab/componentRegistryHealth'

const detailLimit = 8
const loading = ref(false)
const errorMessage = ref('')
const health = ref<WonderLabRegistryHealth | null>(null)

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`${url} request failed (${response.status}).`)
  }
  return response.json() as Promise<unknown>
}

function readComponentRecords(payload: unknown): WonderLabRegistryRecord[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Component API returned an invalid response.')
  }

  const data = (payload as { data?: unknown }).data
  if (!Array.isArray(data)) {
    throw new Error('Component API did not return a component list.')
  }

  return data.flatMap((value) => {
    if (!value || typeof value !== 'object') return []
    const candidate = value as Partial<WonderLabRegistryRecord>
    if (
      !Number.isInteger(candidate.id) ||
      typeof candidate.componentName !== 'string' ||
      typeof candidate.folderName !== 'string'
    ) {
      return []
    }

    return [
      {
        id: candidate.id as number,
        componentName: candidate.componentName,
        folderName: candidate.folderName,
        sourceKey:
          typeof candidate.sourceKey === 'string' ? candidate.sourceKey : null,
        sourcePath:
          typeof candidate.sourcePath === 'string' ? candidate.sourcePath : null,
        sourceHash:
          typeof candidate.sourceHash === 'string' ? candidate.sourceHash : null,
        isDiscovered: candidate.isDiscovered === true,
      },
    ]
  })
}

async function loadHealth(force = false): Promise<void> {
  loading.value = true
  errorMessage.value = ''

  try {
    if (force) clearWonderLabManifestCache()

    const [manifest, componentPayload] = await Promise.all([
      loadWonderLabComponentManifest(() =>
        fetchJson('/wonderlab-components.json'),
      ),
      fetchJson('/api/components'),
    ]) as [WonderLabComponentManifest, unknown]

    health.value = summarizeWonderLabRegistry(
      manifest.entries,
      readComponentRecords(componentPayload),
    )
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to inspect registry health.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadHealth()
})
</script>
