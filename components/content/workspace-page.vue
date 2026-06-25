<!-- /components/content/workspace-page.vue -->
<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-6 overflow-auto px-4 py-6">
    <!-- Admin guard -->
    <div
      v-if="!userStore.isAdmin"
      class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-warning/40 bg-warning/10 p-12 text-center"
    >
      <Icon name="kind-icon:warning" class="size-12 text-warning" />
      <p class="text-lg font-black text-warning">Admin access required</p>
      <p class="text-sm text-base-content/60">
        This workspace is only visible to administrators.
      </p>
    </div>

    <template v-else>
      <!-- Summary stats -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          class="stat rounded-2xl border border-base-300 bg-base-200 py-4"
        >
          <div class="stat-figure text-primary">
            <Icon name="kind-icon:folder" class="size-7" />
          </div>
          <div class="stat-title text-xs">Projects</div>
          <div class="stat-value text-2xl">{{ projects.length }}</div>
        </div>

        <div
          class="stat rounded-2xl border border-base-300 bg-base-200 py-4"
        >
          <div class="stat-figure text-success">
            <Icon name="kind-icon:check" class="size-7" />
          </div>
          <div class="stat-title text-xs">Done</div>
          <div class="stat-value text-2xl">{{ totalDone }}</div>
        </div>

        <div
          class="stat rounded-2xl border border-base-300 bg-base-200 py-4"
        >
          <div class="stat-figure text-warning">
            <Icon name="kind-icon:warning" class="size-7" />
          </div>
          <div class="stat-title text-xs">Needs Human</div>
          <div class="stat-value text-2xl">{{ totalNeedsHuman }}</div>
        </div>

        <div
          class="stat rounded-2xl border border-base-300 bg-base-200 py-4"
        >
          <div class="stat-figure text-accent">
            <Icon name="kind-icon:sparkles" class="size-7" />
          </div>
          <div class="stat-title text-xs">Pitches</div>
          <div class="stat-value text-2xl">{{ totalPitches }}</div>
        </div>
      </div>

      <!-- Project grid -->
      <section class="space-y-3">
        <h2
          class="text-xs font-bold uppercase tracking-widest text-base-content/50"
        >
          Projects
        </h2>

        <div
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <div
            v-for="project in projects"
            :key="project.slug"
            class="flex cursor-pointer flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 transition-all duration-200 hover:border-primary/40 hover:bg-base-100 hover:shadow-md"
            :class="
              selectedSlug === project.slug
                ? 'border-primary/60 bg-base-100 shadow-lg'
                : ''
            "
            @click="toggleProject(project.slug)"
          >
            <!-- Card header -->
            <div class="flex items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"
              >
                <Icon :name="project.icon" class="size-6" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <h3
                    class="truncate font-black leading-tight text-base-content"
                  >
                    {{ project.label }}
                  </h3>
                  <span
                    class="badge badge-xs shrink-0"
                    :class="kindBadgeClass(project.kind)"
                  >
                    {{ project.kind }}
                  </span>
                </div>
                <p class="truncate text-xs text-base-content/50">
                  {{ project.repo ?? '(no repo)' }}
                </p>
              </div>

              <span
                class="shrink-0 text-xs font-bold"
                :class="
                  selectedSlug === project.slug
                    ? 'text-primary'
                    : 'text-base-content/30'
                "
              >
                {{ selectedSlug === project.slug ? '▲' : '▼' }}
              </span>
            </div>

            <!-- Progress bar -->
            <div class="space-y-1">
              <div
                class="flex justify-between text-xs text-base-content/60"
              >
                <span>Progress</span>
                <span>{{ project.progress }}%</span>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="project.progress"
                max="100"
              />
            </div>

            <!-- Status badges -->
            <div class="flex flex-wrap gap-1">
              <span
                v-for="(count, status) in project.statusCounts"
                :key="status"
                class="badge badge-sm"
                :class="statusBadgeClass(status as TaskStatus)"
              >
                {{ count }} {{ status }}
              </span>
            </div>

            <!-- Pitches chip -->
            <div
              v-if="project.pitches.length"
              class="flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-accent"
            >
              <Icon name="kind-icon:sparkles" class="size-3.5" />
              {{ project.pitches.length }}
              {{ project.pitches.length === 1 ? 'pitch' : 'pitches' }} awaiting
              vote
            </div>
          </div>
        </div>
      </section>

      <!-- Expanded project detail panel -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <section
          v-if="selectedProject"
          :key="selectedProject.slug"
          class="space-y-6 rounded-2xl border border-primary/30 bg-base-100 p-6 shadow-inner"
        >
          <!-- Panel header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"
              >
                <Icon :name="selectedProject.icon" class="size-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-black text-base-content">
                    {{ selectedProject.label }}
                  </h3>
                  <span
                    class="badge badge-sm shrink-0"
                    :class="kindBadgeClass(selectedProject.kind)"
                  >
                    {{ selectedProject.kind }}
                  </span>
                </div>
                <p v-if="selectedProject.repo" class="text-xs text-base-content/40">
                  {{ selectedProject.repo }}
                </p>
              </div>
            </div>

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              @click="selectedSlug = null"
            >
              Close ✕
            </button>
          </div>

          <p class="text-sm leading-relaxed text-base-content/70">
            {{ selectedProject.description }}
          </p>

          <!-- Milestones -->
          <div v-if="selectedProject.milestones.length" class="space-y-3">
            <h4
              class="text-xs font-bold uppercase tracking-widest text-base-content/50"
            >
              Milestones
            </h4>

            <div class="space-y-2">
              <div
                v-for="ms in selectedProject.milestones"
                :key="ms.title"
                class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-3"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  :class="
                    ms.done
                      ? 'bg-success/10 text-success'
                      : 'bg-base-300 text-base-content/40'
                  "
                >
                  <Icon
                    :name="ms.done ? 'kind-icon:check' : 'kind-icon:trophy'"
                    class="size-4"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold">{{ ms.title }}</p>
                  <p class="text-xs text-base-content/50">
                    weight {{ ms.weight }}
                  </p>
                </div>

                <span
                  class="badge badge-sm shrink-0"
                  :class="ms.done ? 'badge-success' : 'badge-ghost'"
                >
                  {{ ms.done ? 'done' : 'pending' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Tasks -->
          <div v-if="selectedProject.tasks.length" class="space-y-3">
            <h4
              class="text-xs font-bold uppercase tracking-widest text-base-content/50"
            >
              Tasks
            </h4>

            <div class="grid gap-2 sm:grid-cols-2">
              <div
                v-for="task in selectedProject.tasks"
                :key="task.title"
                class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200 p-3"
              >
                <Icon
                  :name="taskIcon(task.status)"
                  class="size-4 shrink-0"
                  :class="taskIconClass(task.status)"
                />

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">
                    {{ task.title }}
                  </p>
                  <p
                    v-if="task.dependsOn"
                    class="truncate text-xs text-base-content/40"
                  >
                    ↳ {{ task.dependsOn }}
                  </p>
                </div>

                <span
                  class="badge badge-sm shrink-0"
                  :class="statusBadgeClass(task.status)"
                >
                  {{ task.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Pitches -->
          <div v-if="selectedProject.pitches.length" class="space-y-3">
            <h4
              class="text-xs font-bold uppercase tracking-widest text-base-content/50"
            >
              Pitches Awaiting Vote
            </h4>

            <div class="space-y-2">
              <div
                v-for="pitch in selectedProject.pitches"
                :key="pitch.title"
                class="space-y-1 rounded-xl border border-accent/30 bg-accent/5 p-4"
              >
                <div class="flex items-center gap-2">
                  <Icon name="kind-icon:sparkles" class="size-4 shrink-0 text-accent" />
                  <p class="font-bold text-sm text-base-content">
                    {{ pitch.title }}
                  </p>
                </div>
                <p class="text-xs leading-relaxed text-base-content/60 pl-6">
                  {{ pitch.summary }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'

defineProps<{
  showHeader?: boolean
}>()

type TaskStatus =
  | 'ready'
  | 'waiting'
  | 'claimed'
  | 'review'
  | 'done'
  | 'needs-human'
  | 'blocked'

type ProjectKind = 'software' | 'content' | 'proposal'

interface Task {
  title: string
  status: TaskStatus
  dependsOn?: string
}

interface Milestone {
  title: string
  weight: number
  done: boolean
}

interface Pitch {
  title: string
  summary: string
}

interface Project {
  slug: string
  label: string
  repo: string | null
  kind: ProjectKind
  description: string
  icon: string
  progress: number
  milestones: Milestone[]
  tasks: Task[]
  pitches: Pitch[]
  statusCounts: Partial<Record<TaskStatus, number>>
}

const userStore = useUserStore()
const selectedSlug = ref<string | null>(null)

function toggleProject(slug: string) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

const selectedProject = computed<Project | null>(
  () => projects.find((p) => p.slug === selectedSlug.value) ?? null,
)

const totalDone = computed(() =>
  projects.reduce((sum, p) => sum + (p.statusCounts.done ?? 0), 0),
)

const totalNeedsHuman = computed(() =>
  projects.reduce((sum, p) => sum + (p.statusCounts['needs-human'] ?? 0), 0),
)

const totalPitches = computed(() =>
  projects.reduce((sum, p) => sum + p.pitches.length, 0),
)

function statusBadgeClass(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    done: 'badge-success',
    review: 'badge-info',
    claimed: 'badge-info',
    ready: 'badge-primary',
    waiting: 'badge-ghost',
    'needs-human': 'badge-warning',
    blocked: 'badge-error',
  }
  return map[status] ?? 'badge-ghost'
}

function kindBadgeClass(kind: ProjectKind): string {
  const map: Record<ProjectKind, string> = {
    software: 'badge-primary',
    content: 'badge-accent',
    proposal: 'badge-ghost',
  }
  return map[kind] ?? 'badge-ghost'
}

function taskIcon(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    done: 'kind-icon:check',
    review: 'kind-icon:sparkles',
    claimed: 'kind-icon:person',
    ready: 'kind-icon:trophy',
    waiting: 'kind-icon:robot',
    'needs-human': 'kind-icon:warning',
    blocked: 'kind-icon:hammer',
  }
  return map[status] ?? 'kind-icon:sparkles'
}

function taskIconClass(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    done: 'text-success',
    review: 'text-info',
    claimed: 'text-info',
    ready: 'text-primary',
    waiting: 'text-base-content/40',
    'needs-human': 'text-warning',
    blocked: 'text-error',
  }
  return map[status] ?? 'text-base-content/40'
}

function computeStatusCounts(
  tasks: Task[],
): Partial<Record<TaskStatus, number>> {
  const counts: Partial<Record<TaskStatus, number>> = {}
  for (const task of tasks) {
    counts[task.status] = (counts[task.status] ?? 0) + 1
  }
  return counts
}

function computeProgress(milestones: Milestone[], tasks: Task[]): number {
  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  if (!total) {
    const totalWeight = milestones.reduce((s, m) => s + m.weight, 0)
    const doneWeight = milestones
      .filter((m) => m.done)
      .reduce((s, m) => s + m.weight, 0)
    return totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0
  }
  return Math.round((done / total) * 100)
}

const rawProjects: Omit<Project, 'statusCounts' | 'progress'>[] = [
  {
    slug: 'conductor',
    label: 'Conductor',
    repo: 'silasfelinus/conductor',
    kind: 'software',
    description:
      'The autonomous multi-agent coordination system that orchestrates all projects, manages the worker/reviewer loop, and maintains roadmaps and pitches.',
    icon: 'kind-icon:gearhammer',
    milestones: [],
    tasks: [],
    pitches: [
      {
        title: 'Add a CI build/lint gate for software projects',
        summary:
          'A lightweight GitHub Actions CI check (lint + build) on every worker/* PR, giving the Reviewer an objective green-checks signal rather than judging by eye — and making branch protection actually meaningful.',
      },
      {
        title: 'Per-cycle cost + run-budget guard for AI_Networker',
        summary:
          'A check the Worker runs each cycle tracking daily agent runs/PRs and pauses new work if the daily budget is hit — protecting against the Pro-tier 5-routine/day limit and runaway API spend.',
      },
    ],
  },
  {
    slug: 'kind-robots',
    label: 'Kind Robots',
    repo: 'silasfelinus/kind_robots',
    kind: 'software',
    description:
      'The main Kind Robots Nuxt 4 platform. Agents consume the shared backend as read-only — build app-owned logic in this project, do not reimplement or modify shared backend concerns.',
    icon: 'kind-icon:robot-color',
    milestones: [
      {
        title: 'App scope + boundary defined (app-owned vs shared backend)',
        weight: 100,
        done: false,
      },
    ],
    tasks: [
      {
        title: 'Draft the app/backend boundary doc for Silas to approve',
        status: 'ready',
      },
    ],
    pitches: [],
  },
  {
    slug: 'humboldt-scoop',
    label: 'Humboldt Scoop',
    repo: 'silasfelinus/humboldt-scoop',
    kind: 'software',
    description:
      'Existing Humboldt Scoop site — the first real test of the agent loop. Do NOT deploy or touch DNS unattended.',
    icon: 'kind-icon:chat',
    milestones: [
      { title: 'Loop proven end-to-end on this repo', weight: 10, done: false },
      { title: 'Existing site imported + building cleanly', weight: 20, done: false },
      { title: 'Content + copy refresh', weight: 25, done: false },
      { title: 'Contact / quote-request flow', weight: 25, done: false },
      { title: 'SEO + analytics', weight: 20, done: false },
    ],
    tasks: [
      {
        title: 'Confirm the loop: trivial no-op PR through the full cycle',
        status: 'ready',
      },
      {
        title: 'Audit the imported site and report build/run steps',
        status: 'ready',
      },
    ],
    pitches: [],
  },
  {
    slug: 'humboldt-poop-scoop-cms',
    label: 'Poop Scoop CMS',
    repo: 'silasfelinus/humboldt-poop-scoop-cms',
    kind: 'software',
    description:
      'New customer-management software for the poop-scoop service: customers, pets/yards, service schedules, visit logs, billing. Build with seed/dummy data only until Silas says otherwise.',
    icon: 'kind-icon:blueprint',
    milestones: [
      { title: 'Stack chosen + skeleton app runs locally', weight: 15, done: false },
      { title: 'Customer + property data model', weight: 20, done: false },
      { title: 'Recurring service scheduling', weight: 25, done: false },
      { title: 'Visit logging + history', weight: 20, done: false },
      { title: 'Invoicing (draft-only, no live payments)', weight: 20, done: false },
    ],
    tasks: [
      {
        title: 'Propose a stack + scaffold a running skeleton',
        status: 'ready',
      },
      {
        title: 'Design the customer + property schema',
        status: 'ready',
      },
    ],
    pitches: [],
  },
  {
    slug: 'approval-portal',
    label: 'Approval Portal',
    repo: 'silasfelinus/approval-portal',
    kind: 'software',
    description:
      'The portal Silas lives in: review projects, pick from pitches, validate/reject upgrade plans, confirm updates, and roll back. Repo stays source of truth — portal reads roadmaps and writes decisions back as commits/PRs.',
    icon: 'kind-icon:check',
    milestones: [
      {
        title: 'Read-only dashboard: projects, progress %, tasks, pitches',
        weight: 25,
        done: false,
      },
      {
        title: 'Pitch voting: approve/reject writes back to the repo',
        weight: 25,
        done: false,
      },
      {
        title: 'Update confirmation: see open PRs, approve-merge or reject',
        weight: 20,
        done: false,
      },
      {
        title: 'Rollback: one-click revert of a merged change',
        weight: 15,
        done: false,
      },
      {
        title: 'Login + deploy (gated for Silas to approve going live)',
        weight: 15,
        done: false,
      },
    ],
    tasks: [
      {
        title: 'Spec the portal: data sources, screens, and repo-write strategy',
        status: 'ready',
      },
      {
        title: 'Build read-only dashboard from repo data',
        status: 'waiting',
        dependsOn: 'portal spec (t-001)',
      },
      {
        title: 'Pitch voting that writes approve/reject back to the repo',
        status: 'waiting',
        dependsOn: 'dashboard (t-002)',
      },
      {
        title: 'One-click rollback via git revert',
        status: 'waiting',
        dependsOn: 'pitch voting (t-003)',
      },
      {
        title: 'Plan auth + deploy (do NOT deploy)',
        status: 'waiting',
        dependsOn: 'rollback (t-004)',
      },
    ],
    pitches: [],
  },
  {
    slug: 'digital-storefront',
    label: 'Digital Storefront',
    repo: 'silasfelinus/digital-storefront',
    kind: 'content',
    description:
      'Content pipeline: research stores → brainstorm concepts → create drafts → market → advertise. Only build within product-types.yaml. Never publish a listing, post marketing, or spend ad money unattended.',
    icon: 'kind-icon:gift',
    milestones: [
      { title: 'Store/platform landscape researched', weight: 20, done: false },
      {
        title: 'Content concepts brainstormed (per approved product type)',
        weight: 20,
        done: false,
      },
      { title: 'First products created (drafts)', weight: 25, done: false },
      { title: 'Organic marketing on discovered channels', weight: 20, done: false },
      { title: 'Paid advertising (within human-set budget)', weight: 15, done: false },
    ],
    tasks: [
      {
        title: 'Research candidate stores/platforms and recommend a shortlist',
        status: 'ready',
      },
      {
        title: 'Brainstorm content concepts for the chosen stores',
        status: 'waiting',
        dependsOn: 'store research (t-001)',
      },
      {
        title: 'Create first product drafts from approved concepts',
        status: 'waiting',
        dependsOn: 'concepts (t-002)',
      },
      {
        title: 'Identify organic marketing channels for the products',
        status: 'waiting',
        dependsOn: 'product drafts (t-003)',
      },
      {
        title: 'Draft paid-ad plans for human-budgeted channels',
        status: 'waiting',
        dependsOn: 'organic channels (t-004)',
      },
    ],
    pitches: [
      {
        title: '“Acts of Kindness” coloring book (PDF + POD)',
        summary:
          'Each page illustrates a small act of kindness with a one-line prompt to do it this week. Uses two already-approved product types (pdf-coloring, pod-text-art), reinforces the brand social-good angle, and works as a first testable storefront product.',
      },
    ],
  },
  {
    slug: 'brainstorm',
    label: 'Brainstorm',
    repo: null,
    kind: 'proposal',
    description:
      'Generates ideas for Silas to vote on. Quality over quantity — a few strong, specific, buildable pitches beat a pile of vague ones. Max 3 new pitches per cycle; respects CONTROL.md genre guidance.',
    icon: 'kind-icon:brain',
    milestones: [
      {
        title: 'Idea engine running and producing votable pitches',
        weight: 0,
        done: false,
      },
    ],
    tasks: [
      {
        title: 'Generate this cycle pitches (recurring)',
        status: 'ready',
      },
    ],
    pitches: [],
  },
  {
    slug: 'mermaids-of-venice',
    label: 'Mermaids of Venice',
    repo: null,
    kind: 'content',
    description:
      'A creative content project. Direction TBD — Silas will fill in the roadmap before the first cycle runs on this project.',
    icon: 'kind-icon:moon',
    milestones: [
      { title: 'Define concept and scope', weight: 10, done: false },
      { title: 'First content draft', weight: 30, done: false },
      { title: 'Silas review and approval', weight: 10, done: false },
    ],
    tasks: [
      {
        title: 'Draft concept brief for Silas to review',
        status: 'needs-human',
      },
    ],
    pitches: [],
  },
  {
    slug: 'coat-dance',
    label: 'Coat Dance',
    repo: null,
    kind: 'content',
    description:
      'A creative content project. Direction TBD — Silas will fill in the roadmap before the first cycle runs on this project.',
    icon: 'kind-icon:palette',
    milestones: [
      { title: 'Define concept and scope', weight: 10, done: false },
      { title: 'First content draft', weight: 30, done: false },
      { title: 'Silas review and approval', weight: 10, done: false },
    ],
    tasks: [
      {
        title: 'Draft concept brief for Silas to review',
        status: 'needs-human',
      },
    ],
    pitches: [],
  },
]

const projects: Project[] = rawProjects.map((p) => ({
  ...p,
  statusCounts: computeStatusCounts(p.tasks),
  progress: computeProgress(p.milestones, p.tasks),
}))
</script>
