<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-4 p-4 md:p-6">
      <header class="kr-toolbar flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-widest text-primary">
            Temporary catalog cleanup
          </p>
          <div class="mt-1 text-2xl font-black">LoRA maturity triage</div>
          <p class="mt-1 max-w-3xl text-sm text-base-content/60">
            Confirm LoRAs as SFW or NSFW here, then save the changed maturity flags in one pass.
            Review progress stays in this browser until this cleanup page is removed.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="btn btn-outline btn-sm rounded-xl"
            :disabled="triageStore.isSaving || loading"
            @click="refresh"
          >
            <span v-if="loading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="size-4" />
            Refresh
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm rounded-xl"
            :disabled="triageStore.isSaving || triageStore.pendingChanges.length === 0"
            @click="triageStore.saveChanges()"
          >
            <span v-if="triageStore.isSaving" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:save" class="size-4" />
            Save {{ triageStore.pendingChanges.length }} change{{ triageStore.pendingChanges.length === 1 ? '' : 's' }}
          </button>
        </div>
      </header>

      <div v-if="!ready" class="grid min-h-52 place-items-center kr-panel">
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="!userStore.isAdmin"
        class="kr-note kr-note-error p-8 text-center font-normal"
      >
        <p class="text-xl font-black text-base-content">Administrator access required</p>
        <p class="mt-2 text-sm text-base-content/60">
          LoRA maturity triage is restricted to administrators.
        </p>
      </div>

      <template v-else>
        <section class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="kr-panel p-3">
            <p class="text-xs font-black uppercase text-base-content/45">LoRAs</p>
            <p class="mt-1 text-2xl font-black">{{ triageStore.loras.length }}</p>
          </div>
          <div class="kr-panel p-3">
            <p class="text-xs font-black uppercase text-base-content/45">Confirmed</p>
            <p class="mt-1 text-2xl font-black text-success">{{ triageStore.confirmedCount }}</p>
          </div>
          <div class="kr-panel p-3">
            <p class="text-xs font-black uppercase text-base-content/45">Remaining</p>
            <p class="mt-1 text-2xl font-black">{{ triageStore.remainingCount }}</p>
          </div>
          <div class="kr-panel p-3">
            <p class="text-xs font-black uppercase text-base-content/45">Unsaved changes</p>
            <p class="mt-1 text-2xl font-black text-warning">{{ triageStore.pendingChanges.length }}</p>
          </div>
        </section>

        <section class="kr-panel space-y-3 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-model="query"
              type="search"
              class="input input-bordered input-sm min-w-52 flex-1 rounded-xl"
              placeholder="Search name, trigger, or base model"
              aria-label="Search LoRAs"
            />

            <select
              v-model="generation"
              class="select select-bordered select-sm w-auto max-w-56 rounded-xl"
              aria-label="Filter by base model"
            >
              <option value="ALL">All base models</option>
              <option v-for="base in generations" :key="base" :value="base">
                {{ base }}
              </option>
            </select>

            <label class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-sm">
              <input
                type="checkbox"
                class="toggle toggle-sm toggle-primary"
                :checked="triageStore.hideConfirmed"
                @change="handleHideConfirmed"
              />
              Hide confirmed
            </label>
          </div>

          <div class="flex flex-wrap items-center gap-2 border-t border-base-300 pt-3">
            <span class="text-sm font-bold">{{ triageStore.selectedCount }} selected</span>
            <button
              type="button"
              class="kr-btn-ghost-xs"
              :disabled="pageResources.length === 0"
              @click="selectPage"
            >
              Select page
            </button>
            <button
              type="button"
              class="kr-btn-ghost-xs"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.clearSelection()"
            >
              Clear selection
            </button>
            <button
              type="button"
              class="btn btn-success btn-sm ml-auto rounded-xl"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.markSelected('sfw')"
            >
              Mark selected SFW
            </button>
            <button
              type="button"
              class="btn btn-error btn-sm rounded-xl"
              :disabled="triageStore.selectedCount === 0"
              @click="triageStore.markSelected('nsfw')"
            >
              Mark selected NSFW
            </button>
          </div>
        </section>

        <div
          v-if="triageStore.saveMessage"
          class="kr-note kr-note-success p-3 font-normal"
        >
          {{ triageStore.saveMessage }}
        </div>
        <div
          v-if="triageStore.saveError"
          class="kr-note kr-note-error p-3 font-normal"
        >
          {{ triageStore.saveError }}
        </div>

        <section v-if="pageResources.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <article
            v-for="resource in pageResources"
            :key="resource.id"
            class="overflow-hidden kr-panel p-0"
            :class="triageStore.isSelected(resource.id) ? 'ring-2 ring-primary' : ''"
          >
            <div class="relative aspect-square overflow-hidden bg-base-200">
              <kr-deferred-image
                :src="previewSrc(resource)"
                :alt="resourceLabel(resource)"
                class="size-full object-cover"
              />

              <label class="absolute left-2 top-2 grid size-8 cursor-pointer place-items-center rounded-lg bg-base-100/90 shadow">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary checkbox-sm"
                  :checked="triageStore.isSelected(resource.id)"
                  :aria-label="`Select ${resourceLabel(resource)}`"
                  @change="handleSelection(resource.id, $event)"
                />
              </label>

              <div class="absolute right-2 top-2 flex flex-wrap justify-end gap-1">
                <span class="badge badge-sm" :class="resource.isMature ? 'badge-error' : 'badge-success'">
                  DB: {{ resource.isMature ? 'NSFW' : 'SFW' }}
                </span>
                <span
                  v-if="triageStore.decisionFor(resource.id)"
                  class="badge badge-sm badge-primary"
                >
                  Confirmed {{ triageStore.decisionFor(resource.id)?.toUpperCase() }}
                </span>
              </div>
            </div>

            <div class="space-y-3 p-3">
              <div class="min-w-0">
                <h2 class="line-clamp-2 break-words text-sm font-black" :title="resourceLabel(resource)">
                  {{ resourceLabel(resource) }}
                </h2>
                <p v-if="resource.generation" class="mt-1 text-xs text-base-content/50">
                  {{ resource.generation }}
                </p>
                <p
                  v-if="triggerText(resource)"
                  class="mt-2 line-clamp-2 break-words rounded-lg bg-base-200/70 px-2 py-1 font-mono text-xs"
                  :title="triggerText(resource)"
                >
                  {{ triggerText(resource) }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="btn btn-sm rounded-xl"
                  :class="triageStore.decisionFor(resource.id) === 'sfw' ? 'btn-success' : 'btn-outline'"
                  @click="triageStore.setDecision(resource.id, 'sfw')"
                >
                  SFW
                </button>
                <button
                  type="button"
                  class="btn btn-sm rounded-xl"
                  :class="triageStore.decisionFor(resource.id) === 'nsfw' ? 'btn-error' : 'btn-outline'"
                  @click="triageStore.setDecision(resource.id, 'nsfw')"
                >
                  NSFW
                </button>
              </div>
            </div>
          </article>
        </section>

        <div v-else class="grid min-h-64 place-items-center kr-panel text-center text-base-content/55">
          <div>
            <Icon name="kind-icon:check" class="mx-auto size-10 text-success" />
            <p class="mt-2 font-black">No LoRAs left in this view.</p>
            <p class="mt-1 text-sm">
              {{ triageStore.hideConfirmed ? 'Turn off “Hide confirmed” to review completed decisions.' : 'Try changing the search or base-model filter.' }}
            </p>
          </div>
        </div>

        <footer class="kr-panel flex flex-wrap items-center justify-between gap-3 p-3">
          <div class="text-sm text-base-content/60">
            Showing {{ pageStart }}–{{ pageEnd }} of {{ filteredResources.length }} matching LoRAs
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="kr-btn-ghost"
              :disabled="safePage <= 1"
              @click="page = safePage - 1"
            >
              Previous
            </button>
            <span class="text-sm font-bold">Page {{ safePage }} / {{ totalPages }}</span>
            <button
              type="button"
              class="kr-btn-ghost"
              :disabled="safePage >= totalPages"
              @click="page = safePage + 1"
            >
              Next
            </button>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-xl text-base-content/50"
            :disabled="triageStore.confirmedCount === 0"
            @click="clearProgress"
          >
            Clear local review progress
          </button>
        </footer>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useLoraTriageStore } from '@/stores/loraTriageStore'
import type { ResourceGalleryRecord } from '@/stores/resourceGalleryStore'

const PAGE_SIZE = 48

const userStore = useUserStore()
const triageStore = useLoraTriageStore()
const ready = ref(false)
const loading = ref(false)
const query = ref('')
const generation = ref('ALL')
const page = ref(1)

const generations = computed(() =>
  [...new Set(
    triageStore.loras
      .map((resource) => resource.generation?.trim())
      .filter((value): value is string => Boolean(value)),
  )].sort((a, b) => a.localeCompare(b)),
)

const filteredResources = computed(() => {
  const search = query.value.trim().toLowerCase()

  return triageStore.loras.filter((resource) => {
    if (triageStore.hideConfirmed && triageStore.decisionFor(resource.id)) return false
    if (generation.value !== 'ALL' && resource.generation !== generation.value) return false
    if (!search) return true

    return [
      resource.customLabel,
      resource.name,
      resource.generation,
      resource.defaultTrigger,
      resource.triggerWords,
      resource.description,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredResources.value.length / PAGE_SIZE)))
const safePage = computed(() => Math.min(page.value, totalPages.value))
const pageResources = computed(() => {
  const start = (safePage.value - 1) * PAGE_SIZE
  return filteredResources.value.slice(start, start + PAGE_SIZE)
})
const pageStart = computed(() => filteredResources.value.length ? (safePage.value - 1) * PAGE_SIZE + 1 : 0)
const pageEnd = computed(() => Math.min(safePage.value * PAGE_SIZE, filteredResources.value.length))

function resourceLabel(resource: ResourceGalleryRecord): string {
  return resource.customLabel || resource.name
}

function triggerText(resource: ResourceGalleryRecord): string {
  return resource.defaultTrigger || resource.triggerWords || resource.artPrompt || ''
}

function previewSrc(resource: ResourceGalleryRecord): string {
  return (
    resource.ArtImage?.thumbnailPath ||
    resource.ArtImage?.imagePath ||
    resource.ArtImage?.path ||
    resource.previewImageUrl ||
    resource.imagePath ||
    '/images/kindart.webp'
  )
}

function handleHideConfirmed(event: Event): void {
  const input = event.target
  if (input instanceof HTMLInputElement) triageStore.setHideConfirmed(input.checked)
}

function handleSelection(resourceId: number, event: Event): void {
  const input = event.target
  if (input instanceof HTMLInputElement) triageStore.setSelected(resourceId, input.checked)
}

function selectPage(): void {
  triageStore.selectIds(pageResources.value.map((resource) => resource.id))
}

function clearProgress(): void {
  if (typeof window === 'undefined') return
  if (window.confirm('Clear local triage decisions? Saved Resource maturity flags will not be changed.')) {
    triageStore.clearProgress()
  }
}

async function refresh(): Promise<void> {
  loading.value = true
  try {
    await triageStore.loadResources()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await userStore.initialize()
  if (userStore.isAdmin) await refresh()
  ready.value = true
})
</script>
