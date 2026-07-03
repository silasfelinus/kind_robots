<!-- /components/pages/appmaker-page.vue -->
<!-- AppMaker (appmaker/t-004): browse the app fleet, create a new app
     (self-serve; server enforces caps), and jump into each app's project. -->
<template>
  <section class="mx-auto w-full max-w-6xl space-y-6 p-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">AppMaker</h1>
        <p class="text-sm opacity-70">
          The app factory — every app is a workspace folder, a project roadmap,
          and a Dream sharing one slug.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn btn-sm" :disabled="loading" @click="refresh">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
        <button class="btn btn-sm btn-ghost" @click="pageStore.setWorkspaceCardKey('overview')">
          ← Workspace
        </button>
      </div>
    </header>

    <div v-if="error" class="alert alert-error text-sm">{{ error }}</div>

    <!-- Create -->
    <div class="card bg-base-200">
      <div class="card-body gap-3">
        <h2 class="card-title text-lg">Create an app</h2>
        <template v-if="userStore.user && !userStore.isGuest">
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="form-control">
              <span class="label-text pb-1">Name</span>
              <input
                v-model="form.title"
                type="text"
                class="input input-bordered"
                placeholder="Recipe Box"
                maxlength="60"
              />
            </label>
            <label class="form-control">
              <span class="label-text pb-1">Slug</span>
              <input
                v-model="form.slug"
                type="text"
                class="input input-bordered font-mono"
                :placeholder="slugPreview || 'recipe-box'"
              />
            </label>
          </div>
          <label class="form-control">
            <span class="label-text pb-1">What is it? (one line, also steers its art)</span>
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered"
              rows="2"
              placeholder="a cozy cooking companion"
            />
          </label>
          <div class="flex items-center gap-3">
            <button
              class="btn btn-primary btn-sm"
              :disabled="creating || !form.title.trim()"
              @click="createApp"
            >
              {{ creating ? 'Filing request…' : 'Create app' }}
            </button>
            <span v-if="createMessage" class="text-sm opacity-80">{{ createMessage }}</span>
          </div>
          <p class="text-xs opacity-60">
            Creating an app files a scaffold request for the agents: the
            workspace folder, project roadmap, and art prompts appear after the
            next Worker cycle. Free accounts can run
            {{ FREE_PROJECT_LIMIT }} active projects.
          </p>
        </template>
        <p v-else class="text-sm opacity-70">
          Sign in to create an app. Browsing is open to everyone.
        </p>
      </div>
    </div>

    <!-- Pending scaffolds -->
    <div v-if="pending.length" class="space-y-2">
      <h2 class="text-lg font-semibold">Being built</h2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="item in pending"
          :key="item.slug"
          class="badge badge-warning badge-lg gap-2"
          :title="`Requested ${formatDate(item.requestedAt)} — waiting for the next Worker cycle`"
        >
          <span class="loading loading-spinner loading-xs" />
          {{ item.slug }}
        </div>
      </div>
    </div>

    <!-- Fleet -->
    <div class="space-y-2">
      <h2 class="text-lg font-semibold">
        Apps <span class="opacity-60">({{ fleet.length }})</span>
      </h2>
      <p v-if="!fleet.length && !loading" class="text-sm opacity-70">
        No apps yet — create the first one above.
      </p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="app in fleet" :key="app.slug" class="card bg-base-200">
          <div class="card-body gap-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <h3 class="card-title text-base">{{ app.title }}</h3>
              <span class="badge badge-outline font-mono text-xs">{{ app.slug }}</span>
            </div>
            <p v-if="app.description" class="line-clamp-2 text-sm opacity-70">
              {{ app.description }}
            </p>
            <template v-if="app.taskTotal > 0">
              <progress
                class="progress progress-primary w-full"
                :value="app.taskDone"
                :max="app.taskTotal"
              />
              <p class="text-xs opacity-60">
                {{ app.taskDone }} of {{ app.taskTotal }} tasks done
                <span v-if="app.needsHuman > 0" class="badge badge-primary badge-xs ml-1">
                  {{ app.needsHuman }} need you
                </span>
              </p>
            </template>
            <div class="card-actions justify-end pt-1">
              <button
                class="btn btn-sm btn-outline"
                @click="pageStore.setWorkspaceCardKey(app.slug)"
              >
                Open project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'

const FREE_PROJECT_LIMIT = 2

type PendingScaffold = { slug: string; dreamId: number | null; requestedAt: string }
type AppsResponse = { scaffolded: string[]; pending: PendingScaffold[] }

type FleetApp = {
  slug: string
  title: string
  description: string
  taskDone: number
  taskTotal: number
  needsHuman: number
}

const conductorStore = useConductorStore()
const pageStore = usePageStore()
const userStore = useUserStore()

const loading = ref(false)
const creating = ref(false)
const error = ref('')
const createMessage = ref('')
const scaffolded = ref<string[]>([])
const pending = ref<PendingScaffold[]>([])

const form = reactive({ title: '', slug: '', description: '' })

const slugPreview = computed(() =>
  form.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40),
)

const fleet = computed<FleetApp[]>(() =>
  scaffolded.value.map((slug) => {
    const project = conductorStore.projects.find(
      (candidate) => candidate.slug === slug,
    )
    const tasks = project?.tasks ?? []
    return {
      slug,
      title: project?.name || titleize(slug),
      description: tasks.length === 0 ? 'Freshly scaffolded.' : '',
      taskDone: tasks.filter((task) => task.status === 'done').length,
      taskTotal: tasks.length,
      needsHuman: tasks.filter((task) => task.status === 'needs-human').length,
    }
  }),
)

function titleize(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? 'recently' : parsed.toLocaleDateString()
}

async function refresh(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const [appsRes] = await Promise.all([
      performFetch<AppsResponse>('/api/appmaker/apps'),
      conductorStore.fetchProjects(true),
    ])
    if (appsRes.success && appsRes.data) {
      scaffolded.value = appsRes.data.scaffolded
      pending.value = appsRes.data.pending
    } else {
      error.value = appsRes.message || 'Could not load apps.'
    }
  } catch (fetchError) {
    error.value = fetchError instanceof Error ? fetchError.message : String(fetchError)
  } finally {
    loading.value = false
  }
}

async function createApp(): Promise<void> {
  creating.value = true
  createMessage.value = ''
  error.value = ''
  try {
    const res = await performFetch<{ slug: string }>('/api/appmaker/scaffold-request', {
      method: 'POST',
      body: JSON.stringify({
        title: form.title.trim(),
        slug: (form.slug.trim() || slugPreview.value) || undefined,
        description: form.description.trim() || undefined,
      }),
    })
    if (res.success && res.data) {
      createMessage.value = `Request filed — '${res.data.slug}' will be scaffolded on the next agent cycle.`
      form.title = ''
      form.slug = ''
      form.description = ''
      await refresh()
    } else {
      error.value = res.message || 'Could not create the app.'
    }
  } catch (createError_) {
    error.value =
      createError_ instanceof Error ? createError_.message : String(createError_)
  } finally {
    creating.value = false
  }
}

onMounted(refresh)
</script>
