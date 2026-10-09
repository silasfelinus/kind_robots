<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll kr-container-wide space-y-5 p-3 pb-24 sm:p-5">
      <div v-if="!ready" class="grid min-h-72 place-items-center kr-panel">
        <span class="kr-spinner-lg-primary" />
      </div>
      <div v-else-if="!userStore.isAdmin" class="kr-note kr-note-error p-10 text-center">
        Administrator access required for the Zuzu world studio.
      </div>
      <template v-else>
        <section class="relative isolate overflow-hidden rounded-2xl border border-base-content/10 bg-base-300 shadow-xl">
          <div
            v-if="studio.items[0] && !brokenIds.includes(studio.items[0].id)"
            class="absolute inset-0 bg-cover bg-center opacity-35"
            :style="{ backgroundImage: `url('${studio.items[0].thumbnailUrl}')` }"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-base-300 via-base-300/90 to-base-300/25" />
          <div class="relative flex min-h-48 flex-wrap items-end justify-between gap-4 p-5 md:min-h-56 md:p-8">
            <div class="max-w-xl">
              <p class="kr-text-eyebrow text-primary">Shared universe · Private worldbuilding</p>
              <h2 class="mt-2 text-3xl font-black tracking-tight md:text-5xl">Zuzu World</h2>
              <p class="mt-3 max-w-lg text-sm text-base-content/75 md:text-base">
                Every image has a story. Find it, compare it, and give it a new role in another production.
              </p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span class="kr-badge-outline">{{ studio.recordedCount }} ledger references</span>
                <span class="kr-badge-outline">{{ studio.ledgerCount }} source ledgers</span>
                <span class="kr-badge-outline">{{ studio.total }} visible matches</span>
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <a
                href="https://github.com/silasfelinus/conductor/tree/main/worlds/zuzu"
                class="kr-btn btn-outline"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="kind-icon:book-open" class="kr-icon-4" />
                Canon &amp; lore
              </a>
              <NuxtLink to="/characters" class="kr-btn-primary">
                <Icon name="kind-icon:plus" class="kr-icon-4" />
                Add character
              </NuxtLink>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          <NuxtLink
            v-for="destination in quickLinks"
            :key="destination.label"
            :to="destination.to"
            class="group flex items-center gap-2 rounded-xl border border-base-content/10 bg-base-200 p-3 text-xs font-bold transition hover:border-primary/60 hover:bg-primary/10"
          >
            <Icon :name="destination.icon" class="h-5 w-5 shrink-0 text-primary group-hover:scale-110" />
            <span>{{ destination.label }}</span>
          </NuxtLink>
        </div>

        <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-content/10 bg-base-200/80 p-3">
          <label class="input input-bordered flex min-w-44 flex-1 items-center gap-2 rounded-xl">
            <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
            <input
              type="search"
              class="min-w-0 grow bg-transparent text-sm outline-none"
              :value="studio.search"
              placeholder="Search art, job IDs, subjects…"
              aria-label="Search Zuzu world assets"
              @input="onSearch"
            />
          </label>
          <label class="flex items-center gap-2 text-xs">
            <span class="sr-only">Filter by project</span>
            <select
              class="select select-bordered select-sm max-w-48 rounded-xl"
              :value="studio.projectFilter"
              aria-label="Project filter"
              @change="onFilter('project', $event)"
            >
              <option value="">All projects</option>
              <option v-for="project in ZUZU_PROJECTS" :key="project.slug" :value="project.slug">
                {{ project.label }}
              </option>
            </select>
          </label>
          <label class="flex items-center gap-2">
            <span class="sr-only">Media type</span>
            <select
              class="select select-bordered select-sm rounded-xl"
              :value="studio.kindFilter"
              aria-label="Media type filter"
              @change="onFilter('kind', $event)"
            >
              <option value="all">All media</option>
              <option value="image">Images</option>
              <option value="video">Video &amp; clips</option>
              <option value="sheets">Character sheets</option>
            </select>
          </label>
          <button type="button" class="kr-btn btn-outline" :disabled="studio.loading" @click="studio.load()">
            <Icon name="kind-icon:refresh" class="kr-icon-4" />
            Refresh
          </button>
        </div>

        <p v-if="studio.error" class="kr-note kr-note-error" role="alert">{{ studio.error }}</p>
        <p v-if="studio.notice" class="kr-note kr-note-success" role="status">{{ studio.notice }}</p>

        <div class="grid min-h-80 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(285px,330px)]">
          <section class="min-w-0 space-y-3" aria-label="Zuzu asset gallery">
            <div class="flex flex-wrap items-center justify-between gap-2 px-1">
              <div class="flex items-center gap-2">
                <span class="font-black">Asset Library</span>
                <span class="kr-badge-outline">{{ studio.total }} live matches</span>
                <span v-if="studio.loading" class="kr-spinner-xs" />
              </div>
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span>Page {{ studio.page }} / {{ studio.pageCount }}</span>
                <button
                  class="kr-btn btn-outline btn-sm"
                  type="button"
                  :disabled="studio.page <= 1 || studio.loading"
                  aria-label="Previous page"
                  @click="studio.goToPage(studio.page - 1)"
                >‹</button>
                <button
                  class="kr-btn btn-outline btn-sm"
                  type="button"
                  :disabled="studio.page >= studio.pageCount || studio.loading"
                  aria-label="Next page"
                  @click="studio.goToPage(studio.page + 1)"
                >›</button>
              </div>
            </div>

            <div v-if="studio.loading && !studio.items.length" class="grid min-h-72 place-items-center kr-panel">
              <span class="kr-spinner-lg-primary" />
            </div>
            <div v-else-if="!studio.items.length" class="kr-panel grid min-h-72 place-items-center gap-2 p-8 text-center">
              <Icon name="kind-icon:gallery" class="h-10 w-10 text-base-content/40" />
              <p class="font-bold">No accessible artwork matches these filters</p>
              <p class="max-w-md text-sm text-base-content/60">
                The registry records historical render IDs; images only appear here when the live database permits access.
              </p>
              <button type="button" class="kr-btn btn-outline" @click="clearFilters">Clear filters</button>
            </div>
            <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
              <article
                v-for="asset in studio.items"
                :key="asset.id"
                class="group relative min-w-0 overflow-hidden rounded-xl border bg-base-200 shadow-sm transition hover:shadow-lg"
                :class="studio.focusId === asset.id ? 'border-primary ring-2 ring-primary/40' : 'border-base-content/10'"
              >
                <div class="relative aspect-[4/3] overflow-hidden bg-base-300">
                  <button
                    type="button"
                    class="absolute inset-0 z-0 h-full w-full"
                    :aria-label="`Inspect ${asset.title}, art image ${asset.id}`"
                    @click="studio.focus(asset.id)"
                  >
                    <img
                      :src="brokenIds.includes(asset.id) ? fallbackImage : asset.thumbnailUrl"
                      :alt="asset.title"
                      loading="lazy"
                      class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      @error="markBroken(asset.id)"
                    />
                    <span
                      v-if="asset.mediaKind === 'video'"
                      class="pointer-events-none absolute inset-0 grid place-items-center"
                    >
                      <Icon name="kind-icon:play" class="h-12 w-12 rounded-full bg-base-300/75 p-3 text-white" />
                    </span>
                  </button>
                  <button
                    type="button"
                    class="absolute left-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg border border-white/30 bg-base-300/80 text-white shadow-lg"
                    :aria-label="`${studio.selectedIds.includes(asset.id) ? 'Deselect' : 'Select'} ${asset.title}`"
                    :aria-pressed="studio.selectedIds.includes(asset.id)"
                    @click="studio.toggle(asset.id)"
                  >
                    <Icon
                      :name="studio.selectedIds.includes(asset.id) ? 'kind-icon:check' : 'kind-icon:plus'"
                      class="h-4 w-4"
                    />
                  </button>
                  <span class="absolute right-2 top-2 z-10 rounded-lg bg-base-300/85 px-2 py-1 text-[10px] font-bold text-white">
                    #{{ asset.id }}
                  </span>
                </div>
                <div class="space-y-2 p-3">
                  <button type="button" class="block w-full truncate text-left text-sm font-bold hover:text-primary" @click="studio.focus(asset.id)">
                    {{ asset.title }}
                  </button>
                  <div class="flex flex-wrap gap-1">
                    <span v-if="asset.entity" class="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] text-primary">{{ asset.entity }}</span>
                    <span class="rounded-md bg-base-300 px-2 py-0.5 text-[10px]">{{ asset.mediaKind }}</span>
                    <span v-if="asset.linkedProjectIds.length" class="rounded-md bg-success/15 px-2 py-0.5 text-[10px] text-success">{{ asset.linkedProjectIds.length }} linked</span>
                  </div>
                </div>
              </article>
            </div>
            <p class="px-1 text-xs text-base-content/55">
              Images are shown from authorized Kind Robots records referenced by the Conductor ledger; recorded render status alone does not guarantee a surviving file.
            </p>
          </section>

          <aside class="xl:sticky xl:top-2" aria-label="Selected asset inspector">
            <div v-if="studio.focused" class="overflow-hidden rounded-2xl border border-base-content/10 bg-base-200 shadow-lg">
              <div class="relative aspect-[4/3] bg-base-300">
                <video
                  v-if="studio.focused.mediaKind === 'video' && !brokenIds.includes(studio.focused.id)"
                  :key="studio.focused.id"
                  :src="studio.focused.previewUrl"
                  controls
                  preload="none"
                  class="h-full w-full object-contain"
                />
                <img
                  v-else
                  :src="brokenIds.includes(studio.focused.id) ? fallbackImage : studio.focused.thumbnailUrl"
                  :alt="studio.focused.title"
                  class="h-full w-full object-contain"
                  @error="markBroken(studio.focused.id)"
                />
              </div>
              <div class="space-y-4 p-4">
                <div>
                  <p class="text-xs font-mono text-base-content/60">ArtImage #{{ studio.focused.id }}</p>
                  <h3 class="mt-1 text-lg font-black">{{ studio.focused.title }}</h3>
                  <p class="mt-1 text-xs text-base-content/65">{{ studio.focused.entity || 'Concept / production art' }}</p>
                </div>
                <div class="space-y-1 rounded-xl bg-base-300/60 p-3 text-xs">
                  <div class="flex justify-between gap-3"><span class="text-base-content/60">Source project</span><strong>{{ labelFor(studio.focused.sourceProject) }}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-base-content/60">Format</span><strong>{{ studio.focused.fileType }}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-base-content/60">Published</span><strong>{{ studio.focused.isPublic ? 'Yes' : 'Private' }}</strong></div>
                  <div class="flex justify-between gap-3"><span class="text-base-content/60">Project links</span><strong>{{ studio.focused.linkedProjectIds.length }}</strong></div>
                </div>
                <div>
                  <p class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/60">Used as a project resource</p>
                  <div v-if="studio.focused.linkedProjectIds.length" class="flex flex-wrap gap-1">
                    <span
                      v-for="projectId in studio.focused.linkedProjectIds"
                      :key="projectId"
                      class="rounded-lg bg-primary/20 px-2 py-1 text-xs"
                    >{{ studio.projects.find((p) => p.id === projectId)?.title || `Project #${projectId}` }}</span>
                  </div>
                  <p v-else class="text-xs text-base-content/55">No explicit shared project links yet.</p>
                </div>
                <p v-if="studio.focused.promptString" class="line-clamp-3 text-xs leading-relaxed text-base-content/70">{{ studio.focused.promptString }}</p>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" class="kr-btn-primary" @click="openAssignment">
                    <Icon name="kind-icon:plus" class="kr-icon-4" />
                    Use in project
                  </button>
                  <button type="button" class="kr-btn btn-outline" @click="showRequest = true">
                    <Icon name="kind-icon:sparkles" class="kr-icon-4" />
                    Request edit
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2 text-xs">
                  <NuxtLink to="/artjob" class="link link-primary">Open ArtQueue</NuxtLink>
                  <span v-if="studio.focused.artJobIds.length">Jobs: {{ studio.focused.artJobIds.join(', ') }}</span>
                </div>
                <p class="break-all text-[10px] text-base-content/45">Source: {{ studio.focused.source }}</p>
              </div>
            </div>
            <div v-else class="kr-panel grid min-h-60 place-items-center p-6 text-center text-sm text-base-content/60">
              Select an image to inspect its source and share it between productions.
            </div>
          </aside>
        </div>

        <div
          v-if="studio.selectedItems.length"
          class="sticky bottom-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-base-300 p-3 shadow-2xl"
        >
          <div class="flex min-w-0 items-center gap-2">
            <strong class="text-sm">{{ studio.selectedItems.length }} selected</strong>
            <div class="flex max-w-52 gap-1 overflow-hidden">
              <img v-for="asset in studio.selectedItems.slice(0, 4)" :key="asset.id" :src="asset.thumbnailUrl" :alt="asset.title" class="h-9 w-9 rounded-md object-cover" />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="kr-btn btn-outline btn-sm" @click="studio.clearSelection()">Clear</button>
            <button type="button" class="kr-btn-primary btn-sm" @click="openAssignment">
              <Icon name="kind-icon:plus" class="kr-icon-4" />
              Use in project
            </button>
          </div>
        </div>
      </template>

      <div v-if="showAssign" class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-3" @click.self="showAssign = false">
        <section class="w-full max-w-lg space-y-4 rounded-2xl border border-base-content/20 bg-base-200 p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Assign art to projects">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xl font-black">Use in another production</h2>
            <button type="button" class="kr-btn btn-ghost btn-sm" aria-label="Close project assignment" @click="showAssign = false">✕</button>
          </div>
          <p class="text-sm text-base-content/70">
            Link {{ studio.selectedIds.length || 1 }} existing art {{ studio.selectedIds.length === 1 ? 'asset' : 'assets' }} as general references. The original image stays intact and can be used by several productions.
          </p>
          <div class="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            <label
              v-for="project in studio.projects"
              :key="project.id"
              class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-content/10 bg-base-300/60 p-3 text-sm hover:border-primary/50"
            >
              <input type="checkbox" class="checkbox checkbox-primary checkbox-sm" :checked="targetProjectIds.includes(project.id)" @change="toggleTarget(project.id)" />
              <span>{{ project.title }}</span>
            </label>
          </div>
          <p v-if="!studio.projects.length" class="text-sm text-warning">No synchronized Zuzu projects are available for linking.</p>
          <div class="rounded-xl bg-base-300 p-3 text-xs text-base-content/70">
            <strong>Link</strong> shares a reference. <strong>Unlink</strong> removes only the reference, never the image. To request a new crop, variant or animation, use the art request panel.
          </div>
          <div class="flex flex-wrap justify-end gap-2">
            <button type="button" class="kr-btn btn-outline" :disabled="studio.saving || !targetProjectIds.length" @click="saveAssignment('unlink')">Unlink from selected</button>
            <button type="button" class="kr-btn-primary" :disabled="studio.saving || !targetProjectIds.length" @click="saveAssignment('link')">
              <span v-if="studio.saving" class="kr-spinner-xs" />
              Link to projects
            </button>
          </div>
        </section>
      </div>

      <div v-if="showRequest" class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/70 p-3" @click.self="showRequest = false">
        <form class="w-full max-w-lg space-y-4 rounded-2xl border border-base-content/20 bg-base-200 p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Request a new art variation" @submit.prevent="submitRequest">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xl font-black">Request a visual change</h2>
            <button type="button" class="kr-btn btn-ghost btn-sm" aria-label="Close request" @click="showRequest = false">✕</button>
          </div>
          <p class="text-sm text-base-content/70">
            Source ArtImage #{{ studio.focused?.id }}. Make a new derivative, never overwrite the locked original.
          </p>
          <label class="block space-y-1 text-sm">
            <span>Target production</span>
            <select v-model="requestProject" class="select select-bordered w-full rounded-xl">
              <option v-for="project in ZUZU_PROJECTS" :key="project.slug" :value="project.slug">{{ project.label }}</option>
            </select>
          </label>
          <label class="block space-y-1 text-sm">
            <span>What should change?</span>
            <textarea
              v-model="requestDirection"
              rows="5"
              class="textarea textarea-bordered w-full rounded-xl"
              placeholder="Reframe this for a Gamebook chapter, preserve the locked character, change the background…"
              required
            />
          </label>
          <p class="text-xs text-base-content/60">Creates a private Kind Robots agent Todo linked to the project. No render or publication starts automatically.</p>
          <div class="flex justify-end gap-2">
            <button type="button" class="kr-btn btn-outline" @click="showRequest = false">Cancel</button>
            <button type="submit" class="kr-btn-primary" :disabled="studio.requesting || !requestDirection.trim()">
              <span v-if="studio.requesting" class="kr-spinner-xs" />
              Submit request
            </button>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore } from '~/stores/userStore'
import { useZuzuWorldStore } from '~/stores/zuzuWorldStore'
import { ZUZU_PROJECTS } from '~/utils/zuzuWorld'

const userStore = useUserStore()
const studio = useZuzuWorldStore()
const ready = ref(false)
const showAssign = ref(false)
const showRequest = ref(false)
const targetProjectIds = ref<number[]>([])
const requestProject = ref<string>('zuzu-gamebook')
const requestDirection = ref('')
const brokenIds = ref<number[]>([])
const fallbackImage = '/images/kindart.webp'

const quickLinks = [
  { label: 'Characters', icon: 'kind-icon:users', to: '/characters' },
  { label: 'Story scenarios', icon: 'kind-icon:book-open', to: '/stories' },
  { label: 'Props & rewards', icon: 'kind-icon:gift', to: '/rewards' },
  { label: 'LoRAs & models', icon: 'kind-icon:database', to: '/resources' },
  { label: 'Comic Studio', icon: 'kind-icon:book', to: '/play/comics/studio' },
  { label: 'Music videos', icon: 'kind-icon:video', to: '/play/music-video' },
  { label: 'Gamebook', icon: 'kind-icon:book-open', to: '/play/zuzu-gamebook' },
]

onMounted(async () => {
  try {
    await userStore.initialize()
    if (userStore.isAdmin) await studio.load()
  } finally {
    ready.value = true
  }
})

function markBroken(id: number) {
  if (!brokenIds.value.includes(id)) brokenIds.value.push(id)
}

function labelFor(slug: string): string {
  return ZUZU_PROJECTS.find((project) => project.slug === slug)?.label ?? slug
}

function onSearch(event: Event) {
  studio.setSearch((event.target as HTMLInputElement).value)
}

function onFilter(key: 'project' | 'kind', event: Event) {
  studio.setFilter(key, (event.target as HTMLSelectElement).value)
}

function clearFilters() {
  studio.setSearch('')
  studio.setFilter('project', '')
  studio.setFilter('kind', 'all')
}

function openAssignment() {
  targetProjectIds.value = []
  showAssign.value = true
}

function toggleTarget(id: number) {
  targetProjectIds.value = targetProjectIds.value.includes(id)
    ? targetProjectIds.value.filter((value) => value !== id)
    : [...targetProjectIds.value, id]
}

async function saveAssignment(action: 'link' | 'unlink') {
  if (await studio.assign(targetProjectIds.value, action)) {
    showAssign.value = false
    targetProjectIds.value = []
  }
}

async function submitRequest() {
  if (await studio.requestArtChange(requestProject.value, requestDirection.value)) {
    requestDirection.value = ''
    showRequest.value = false
  }
}
</script>
