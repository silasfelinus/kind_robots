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
                <h3
                  class="truncate font-black leading-tight text-base-content"
                >
                  {{ project.label }}
                </h3>
                <p class="truncate text-xs text-base-content/50">
                  {{ project.repo }}
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
              <h3 class="text-lg font-black text-base-content">
                {{ selectedProject.label }}
              </h3>
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
          <div class="space-y-3">
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
          <div class="space-y-3">
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
  repo: string
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
    const doneMilestones = milestones.filter((m) => m.done)
    const totalWeight = milestones.reduce((s, m) => s + m.weight, 0)
    const doneWeight = doneMilestones.reduce((s, m) => s + m.weight, 0)
    return totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0
  }
  return Math.round((done / total) * 100)
}

const rawProjects: Omit<Project, 'statusCounts' | 'progress'>[] = [
  {
    slug: 'kind-robots',
    label: 'Kind Robots',
    repo: 'silasfelinus/kind_robots',
    description:
      'The main Kind Robots platform — Nuxt 3 app with AI bots, art generation, stories, and the Butterfly Sanctuary.',
    icon: 'kind-icon:robot-color',
    milestones: [
      { title: 'Core platform launch', weight: 30, done: true },
      { title: 'Workspace tab integration', weight: 20, done: false },
      { title: 'Conductor front-end', weight: 25, done: false },
      { title: 'Live GitHub data feed', weight: 25, done: false },
    ],
    tasks: [
      { title: 'Admin role gate (userStore.isAdmin)', status: 'done' },
      { title: 'dashboardHelper workspace tab', status: 'done' },
      { title: 'lab-manager workspace section', status: 'done' },
      { title: 'workspace-page component', status: 'claimed' },
      { title: 'Wire dashboardKey to wonder', status: 'review' },
      { title: 'Live Conductor API composable', status: 'ready' },
    ],
    pitches: [
      {
        title: 'Live GitHub API feed',
        summary:
          'Pull project/task state directly from Conductor via GitHub REST API on page load with a 5-minute TTL cache on the server route.',
      },
    ],
  },
  {
    slug: 'humboldt-scoop',
    label: 'Humboldt Scoop',
    repo: 'silasfelinus/humboldt-scoop',
    description:
      'Local news aggregator and publisher for Humboldt County. Pulls feeds, formats stories, and queues for editorial review.',
    icon: 'kind-icon:chat',
    milestones: [
      { title: 'Feed ingestion', weight: 40, done: true },
      { title: 'Editorial queue', weight: 35, done: false },
      { title: 'Publishing pipeline', weight: 25, done: false },
    ],
    tasks: [
      { title: 'RSS feed parser', status: 'done' },
      { title: 'Article deduplication', status: 'done' },
      { title: 'Editor review UI', status: 'waiting' },
      {
        title: 'Publish to CMS',
        status: 'blocked',
        dependsOn: 'humboldt-poop-scoop-cms',
      },
    ],
    pitches: [],
  },
  {
    slug: 'humboldt-poop-scoop-cms',
    label: 'Poop Scoop CMS',
    repo: 'silasfelinus/humboldt-poop-scoop-cms',
    description:
      'Headless CMS backing Humboldt Scoop. Manages articles, authors, tags, and publishing schedules.',
    icon: 'kind-icon:blueprint',
    milestones: [
      { title: 'Schema design', weight: 30, done: true },
      { title: 'API layer', weight: 40, done: false },
      { title: 'Admin panel', weight: 30, done: false },
    ],
    tasks: [
      { title: 'Prisma schema', status: 'done' },
      { title: 'Article CRUD API', status: 'claimed' },
      { title: 'Author management', status: 'ready' },
      { title: 'Staging deploy', status: 'needs-human' },
    ],
    pitches: [
      {
        title: 'Sanity.io migration',
        summary:
          'Evaluate moving to Sanity for the CMS layer instead of custom Prisma-backed API to reduce maintenance surface.',
      },
    ],
  },
  {
    slug: 'approval-portal',
    label: 'Approval Portal',
    repo: 'silasfelinus/approval-portal',
    description:
      'Internal tool for routing AI-generated content through human approval before publication.',
    icon: 'kind-icon:check',
    milestones: [
      { title: 'Review queue UI', weight: 50, done: false },
      { title: 'Webhook integration', weight: 50, done: false },
    ],
    tasks: [
      { title: 'Queue dashboard', status: 'ready' },
      { title: 'Approve/reject actions', status: 'waiting' },
      { title: 'Slack webhook notify', status: 'waiting' },
      { title: 'Auth guard', status: 'needs-human' },
    ],
    pitches: [],
  },
  {
    slug: 'digital-storefront',
    label: 'Digital Storefront',
    repo: 'silasfelinus/digital-storefront',
    description:
      'E-commerce frontend for Butterfly Sanctuary merch, prints, and digital products.',
    icon: 'kind-icon:gift',
    milestones: [
      { title: 'Product catalog', weight: 40, done: false },
      { title: 'Checkout flow', weight: 60, done: false },
    ],
    tasks: [
      { title: 'Product listing component', status: 'ready' },
      { title: 'Cart store', status: 'waiting' },
      { title: 'Stripe integration', status: 'needs-human' },
      { title: 'Order confirmation emails', status: 'waiting' },
    ],
    pitches: [
      {
        title: 'Gumroad as payment backend',
        summary:
          'Use Gumroad instead of raw Stripe to reduce PCI scope and get to launch faster.',
      },
    ],
  },
  {
    slug: 'brainstorm',
    label: 'Brainstorm',
    repo: 'silasfelinus/brainstorm',
    description:
      'Standalone pitch-generation and brainstorming tool powered by LLM riffing and collaborative voting.',
    icon: 'kind-icon:brain',
    milestones: [
      { title: 'Pitch generator', weight: 50, done: true },
      { title: 'Voting system', weight: 50, done: false },
    ],
    tasks: [
      { title: 'LLM pitch riff endpoint', status: 'done' },
      { title: 'Thumbs up/down voting', status: 'claimed' },
      { title: 'Export to Conductor pitches/', status: 'ready' },
    ],
    pitches: [],
  },
  {
    slug: 'mermaids-of-venice',
    label: 'Mermaids of Venice',
    repo: 'silasfelinus/mermaids-of-venice',
    description:
      'Interactive story set in near-future Venice with mermaid protagonists and canal mysteries.',
    icon: 'kind-icon:moon',
    milestones: [
      { title: 'World building', weight: 30, done: true },
      { title: 'Chapter one', weight: 40, done: false },
      { title: 'Art direction', weight: 30, done: false },
    ],
    tasks: [
      { title: 'Setting document', status: 'done' },
      { title: 'Character sheets', status: 'done' },
      { title: 'Chapter 1 prose draft', status: 'claimed' },
      { title: 'Canal map art', status: 'waiting' },
    ],
    pitches: [],
  },
  {
    slug: 'coat-dance',
    label: 'Coat Dance',
    repo: 'silasfelinus/coat-dance',
    description:
      'Generative art project exploring kinetic coat forms and dance notation as visual language.',
    icon: 'kind-icon:palette',
    milestones: [
      { title: 'Visual system', weight: 60, done: false },
      { title: 'Interactive demo', weight: 40, done: false },
    ],
    tasks: [
      { title: 'Coat silhouette generator', status: 'waiting' },
      { title: 'Motion path renderer', status: 'waiting' },
      { title: 'Export to SVG', status: 'waiting' },
    ],
    pitches: [
      {
        title: 'Dance notation DSL',
        summary:
          'Design a mini DSL for encoding movement sequences that drives the coat animation system.',
      },
    ],
  },
]

const projects: Project[] = rawProjects.map((p) => ({
  ...p,
  statusCounts: computeStatusCounts(p.tasks),
  progress: computeProgress(p.milestones, p.tasks),
}))
</script>
