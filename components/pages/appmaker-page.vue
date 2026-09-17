<!-- /components/pages/appmaker-page.vue -->
<!-- AppMaker (appmaker/t-004): browse the app fleet, create a new app
     (self-serve; server enforces caps), and jump into each app's project. -->
<template>
  <section class="kr-unbound kr-container space-y-6 p-4">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="kr-icon-tile">
          <Icon name="kind-icon:toolbox" class="kr-icon-7" />
        </span>
        <div>
          <p class="kr-text-black-2xl tracking-tight">AppMaker</p>
          <p class="kr-text-dim-sm">
            The app factory — every app is a workspace folder, a project
            roadmap, and a Dream sharing one slug.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="kr-btn-plain" :disabled="loading" @click="refresh">
          {{ loading ? 'Refreshing…' : 'Refresh' }}
        </button>
        <button
          class="kr-btn-ghost-plain"
          @click="pageStore.setWorkspaceCardKey('overview')"
        >
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
                :class="{ 'input-error': slugError }"
                :placeholder="slugPreview || 'recipe-box'"
                maxlength="41"
              />
            </label>
          </div>
          <p v-if="slugError" class="kr-text-error-xs">{{ slugError }}</p>
          <label class="form-control">
            <span class="label-text pb-1"
              >What is it? (one line, also steers its art)</span
            >
            <textarea
              v-model="form.description"
              class="textarea textarea-bordered"
              rows="2"
              placeholder="a cozy cooking companion"
            />
          </label>
          <div class="flex items-center gap-3">
            <button
              class="kr-btn-primary-plain"
              :disabled="creating || !form.title.trim() || !!slugError"
              @click="createApp"
            >
              {{ creating ? 'Filing request…' : 'Create app' }}
            </button>
            <span v-if="createMessage" class="kr-text-faded-sm-80">{{
              createMessage
            }}</span>
          </div>
          <p class="kr-text-faded-xs">
            Creating an app files a scaffold request for the agents: the
            workspace folder, project roadmap, and art prompts appear after the
            next Worker cycle. Free accounts can run
            {{ FREE_PROJECT_LIMIT }} active projects.
          </p>
        </template>
        <p v-else class="kr-text-faded-sm">
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
          <span class="kr-spinner-xs" />
          {{ item.slug }}
        </div>
      </div>
    </div>

    <!-- Fleet -->
    <div class="space-y-2">
      <h2 class="text-lg font-semibold">
        Apps <span class="opacity-60">({{ fleet.length }})</span>
      </h2>
      <p v-if="!fleet.length && !loading" class="kr-text-faded-sm">
        No apps yet — create the first one above.
      </p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="app in fleet" :key="app.slug" class="card bg-base-200">
          <div class="card-body gap-2 p-4">
            <div class="flex items-start justify-between gap-2">
              <h3 class="card-title text-base">{{ app.title }}</h3>
              <span class="badge badge-outline font-mono text-xs">{{
                app.slug
              }}</span>
            </div>
            <p v-if="app.description" class="kr-text-faded-sm line-clamp-2">
              {{ app.description }}
            </p>
            <template v-if="app.taskTotal > 0">
              <progress
                class="progress progress-primary w-full"
                :value="app.taskDone"
                :max="app.taskTotal"
              />
              <p class="kr-text-faded-xs">
                {{ app.taskDone }} of {{ app.taskTotal }} tasks done
                <span
                  v-if="app.needsHuman > 0"
                  class="kr-badge-primary-xs ml-1"
                >
                  {{ app.needsHuman }} need you
                </span>
              </p>
            </template>
            <div
              v-if="userStore.isAdmin && graduationBadge(app.slug)"
              class="badge badge-ghost badge-sm"
            >
              {{ graduationBadge(app.slug) }}
            </div>
            <div class="card-actions justify-end pt-1">
              <button
                v-if="userStore.isAdmin && !graduationBadge(app.slug)"
                class="kr-btn-outline-plain"
                @click="toggleGraduatePanel(app.slug)"
              >
                {{ graduatingSlug === app.slug ? 'Cancel' : 'Graduate' }}
              </button>
              <button
                class="kr-btn-outline-plain"
                @click="pageStore.setWorkspaceCardKey(app.slug)"
              >
                Open project
              </button>
            </div>
            <div
              v-if="graduatingSlug === app.slug"
              class="space-y-2 rounded-lg bg-base-300 p-3"
            >
              <p class="kr-text-faded-xs">
                Files an admin request to graduate '{{ app.slug }}' out to its
                own repo (squash graduation — see appmaker/t-010). This only
                files the request; nothing is pushed yet.
              </p>
              <label class="form-control">
                <span class="label-text pb-1 text-xs">Target repo</span>
                <select
                  v-model="graduateForm.target"
                  class="select select-bordered select-sm"
                >
                  <option :value="null" disabled>Choose a repo…</option>
                  <option
                    v-for="option in installationRepoOptions"
                    :key="`${option.installationId}:${option.owner}/${option.repo}`"
                    :value="option"
                  >
                    {{ option.owner }}/{{ option.repo }}
                  </option>
                </select>
              </label>
              <p
                v-if="!installationRepoOptions.length"
                class="kr-text-faded-xs"
              >
                No connected GitHub installation with an available repo yet —
                connect one via AppMaker's GitHub integration first.
              </p>
              <div class="flex items-center gap-3">
                <button
                  class="kr-btn-primary-plain"
                  :disabled="graduateSubmitting || !graduateForm.target"
                  @click="submitGraduate(app.slug)"
                >
                  {{
                    graduateSubmitting ? 'Filing…' : 'File graduation request'
                  }}
                </button>
              </div>
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
// Mirrors server/api/appmaker/scaffold-request.post.ts's SLUG_RE — keep in sync.
const SLUG_RE = /^[a-z][a-z0-9-]{1,40}$/

type PendingScaffold = {
  slug: string
  dreamId: number | null
  requestedAt: string
}
type PendingGraduation = { slug: string; requestedAt: string }
type AppsResponse = {
  scaffolded: string[]
  pending: PendingScaffold[]
  graduated: string[]
  pendingGraduations: PendingGraduation[]
}

type InstallationRepos = {
  id: number
  accountLogin: string
  suspended: boolean
  availableRepos: Array<{ owner: string; repo: string }>
}
type RepoOption = { installationId: number; owner: string; repo: string }

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
const graduated = ref<string[]>([])
const pendingGraduations = ref<PendingGraduation[]>([])

const installations = ref<InstallationRepos[]>([])
const graduatingSlug = ref<string | null>(null)
const graduateSubmitting = ref(false)
const graduateForm = reactive<{ target: RepoOption | null }>({ target: null })

const form = reactive({ title: '', slug: '', description: '' })

const slugPreview = computed(() =>
  form.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40),
)

const slugError = computed(() => {
  const candidate = form.slug.trim().toLowerCase() || slugPreview.value
  // An empty candidate is only "not yet an error" while the title itself is
  // still empty (the Create button is separately disabled by !form.title in
  // that case). Once the title is non-empty but reduces to nothing after
  // slugify (e.g. "###", "---", pure emoji/punctuation) — and the slug field
  // is also empty — there is no usable slug to submit. Treating that as "no
  // error" let the Create button stay enabled and every SLUG_RE.test('')
  // guard below fall through silently, so submission always reached the
  // server just to bounce off its mirrored SLUG_RE check instead of being
  // caught here as intended.
  if (!candidate) {
    return form.title.trim()
      ? 'Enter a slug — the title has no letters or digits to build one from.'
      : ''
  }
  if (SLUG_RE.test(candidate)) return ''
  return 'Slug must be kebab-case: start with a letter, then letters/digits/hyphens.'
})

const installationRepoOptions = computed<RepoOption[]>(() =>
  installations.value
    .filter((installation) => !installation.suspended)
    .flatMap((installation) =>
      installation.availableRepos.map((r) => ({
        installationId: installation.id,
        owner: r.owner,
        repo: r.repo,
      })),
    ),
)

// A slug already graduated (or mid-request) shows a status badge instead of
// the Graduate trigger — null means neither applies.
function graduationBadge(slug: string): string {
  if (graduated.value.includes(slug)) return 'Graduated'
  if (pendingGraduations.value.some((item) => item.slug === slug))
    return 'Graduation requested'
  return ''
}

function toggleGraduatePanel(slug: string): void {
  if (graduatingSlug.value === slug) {
    graduatingSlug.value = null
    return
  }
  graduatingSlug.value = slug
  graduateForm.target = null
}

async function submitGraduate(slug: string): Promise<void> {
  if (!graduateForm.target) return
  graduateSubmitting.value = true
  error.value = ''
  try {
    const res = await performFetch<{ slug: string }>(
      '/api/appmaker/graduate-request',
      {
        method: 'POST',
        body: JSON.stringify({
          slug,
          installationId: graduateForm.target.installationId,
          owner: graduateForm.target.owner,
          repo: graduateForm.target.repo,
        }),
      },
    )
    if (res.success) {
      graduatingSlug.value = null
      graduateForm.target = null
      await refresh()
    } else {
      error.value = res.message || 'Could not file the graduation request.'
    }
  } catch (graduateError) {
    error.value =
      graduateError instanceof Error
        ? graduateError.message
        : String(graduateError)
  } finally {
    graduateSubmitting.value = false
  }
}

const fleet = computed<FleetApp[]>(() =>
  scaffolded.value.map((slug) => {
    const project = conductorStore.projects.find(
      (candidate) => candidate.slug === slug,
    )
    const tasks = project?.tasks ?? []
    // scripts/new_app.py seeds every scaffolded app's roadmap.yaml with
    // milestones/tasks up front, so `tasks.length === 0` is essentially
    // never true for a real, registry-tracked app — it only happens in the
    // brief/degraded window before conductorStore has this project's data
    // at all. That made the old `tasks.length === 0 ? 'Freshly
    // scaffolded.' : ''` check backwards in practice: every successfully
    // tracked app showed a permanently blank description, and the "Freshly
    // scaffolded." message only ever appeared when the project lookup
    // *failed*. Prefer the project's real one-line description (`goal`,
    // falling back to `notesFromSilas` — new_app.py always seeds the
    // latter, even if just its "Define what this app is before building."
    // placeholder) so the card shows something meaningful once the app is
    // actually tracked, and reserve "Freshly scaffolded." for when there is
    // truly no project data yet.
    const description = project?.goal || project?.notesFromSilas || ''
    return {
      slug,
      title: project?.name || titleize(slug),
      description:
        description || (tasks.length === 0 ? 'Freshly scaffolded.' : ''),
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
  return Number.isNaN(parsed.getTime())
    ? 'recently'
    : parsed.toLocaleDateString()
}

// Guards against out-of-order responses: refresh() can be triggered
// concurrently (onMounted, the manual Refresh button, and createApp()'s
// post-create refresh), and a slower earlier request resolving after a
// newer one would otherwise silently overwrite fresh state with stale data.
let refreshToken = 0

async function refresh(): Promise<void> {
  const token = ++refreshToken
  loading.value = true
  error.value = ''
  try {
    const [appsRes, installationsRes] = await Promise.all([
      performFetch<AppsResponse>('/api/appmaker/apps'),
      userStore.isAdmin
        ? performFetch<InstallationRepos[]>('/api/appmaker/github/repos')
        : Promise.resolve(null),
      conductorStore.fetchProjects(true),
    ])
    if (token !== refreshToken) return
    if (appsRes.success && appsRes.data) {
      scaffolded.value = appsRes.data.scaffolded
      pending.value = appsRes.data.pending
      graduated.value = appsRes.data.graduated
      pendingGraduations.value = appsRes.data.pendingGraduations
    } else {
      error.value = appsRes.message || 'Could not load apps.'
    }
    // Best-effort: a failed/absent installations fetch just means the
    // Graduate panel shows "no repo available" rather than blocking the
    // whole page — non-admins never issue this request at all.
    if (installationsRes?.success && installationsRes.data) {
      installations.value = installationsRes.data
    }
  } catch (fetchError) {
    if (token !== refreshToken) return
    error.value =
      fetchError instanceof Error ? fetchError.message : String(fetchError)
  } finally {
    if (token === refreshToken) loading.value = false
  }
}

async function createApp(): Promise<void> {
  creating.value = true
  createMessage.value = ''
  error.value = ''
  try {
    const res = await performFetch<{ slug: string }>(
      '/api/appmaker/scaffold-request',
      {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          slug: form.slug.trim() || slugPreview.value || undefined,
          description: form.description.trim() || undefined,
        }),
      },
    )
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
      createError_ instanceof Error
        ? createError_.message
        : String(createError_)
  } finally {
    creating.value = false
  }
}

onMounted(refresh)
</script>
