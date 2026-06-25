<!-- /components/content/workspace-page.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <header v-if="showHeader" class="flex shrink-0 flex-col gap-3 rounded-2xl border border-primary/25 bg-base-200/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Icon name="kind-icon:gearhammer" class="size-7" />
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-[0.22em] text-primary/70">Conductor</p>
          <h2 class="text-xl font-black sm:text-2xl">Workspace Control Deck</h2>
          <p class="text-sm text-base-content/65">Project progress, task status, pitch votes, and review queues.</p>
        </div>
      </div>
      <div class="stats stats-vertical overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal">
        <div class="stat px-4 py-3"><div class="stat-title text-xs">Projects</div><div class="stat-value text-xl">{{ projectList.length }}</div></div>
        <div class="stat px-4 py-3"><div class="stat-title text-xs">Review</div><div class="stat-value text-xl text-warning">{{ reviewCount }}</div></div>
        <div class="stat px-4 py-3"><div class="stat-title text-xs">Votes</div><div class="stat-value text-xl text-accent">{{ voteCount }}</div></div>
      </div>
    </header>

    <section v-if="!userStore.isAdmin" class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-6 text-center">
      <div class="max-w-md space-y-3">
        <Icon name="kind-icon:lock" class="mx-auto size-10 text-warning" />
        <h3 class="text-2xl font-black">Admin workspace locked</h3>
        <p class="text-base-content/70">The Conductor workspace is available to admin users only.</p>
      </div>
    </section>

    <section v-else class="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(18rem,0.9fr)_minmax(0,1.4fr)]">
      <aside class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-3 shadow-sm">
        <div class="mb-3 flex items-center justify-between px-1">
          <div><p class="text-xs font-black uppercase tracking-[0.2em] text-primary/70">Project Deck</p><h3 class="text-lg font-black">Choose a mission</h3></div>
          <Icon name="kind-icon:cards" class="size-7 text-primary/60" />
        </div>
        <div class="workspace-scroll min-h-0 flex-1 space-y-3 overflow-auto pr-1">
          <button v-for="project in projectList" :key="project.key" type="button" class="workspace-card group w-full overflow-hidden rounded-2xl border bg-base-100 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl" :class="project.key === selectedKey ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'" @click="selectedKey = project.key">
            <div class="card-flip relative min-h-[12rem]">
              <div class="card-face card-front flex min-h-[12rem] flex-col gap-3 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex size-12 items-center justify-center rounded-2xl bg-base-200 text-primary"><Icon :name="project.icon" class="size-7" /></div>
                  <div class="radial-progress text-primary" :style="progressStyle(project.progress)" role="progressbar"><span class="text-xs font-black">{{ project.progress }}%</span></div>
                </div>
                <div><h4 class="text-lg font-black leading-tight">{{ project.name }}</h4><p class="line-clamp-2 text-sm text-base-content/65">{{ project.description }}</p></div>
                <div class="mt-auto flex flex-wrap gap-2">
                  <span v-for="status in statusOrder" :key="`${project.key}-${status}`" class="badge badge-sm rounded-xl" :class="statusClass(status)">{{ project.statuses[status] }} {{ status }}</span>
                </div>
              </div>
              <div class="card-face card-back absolute inset-0 flex flex-col justify-between rounded-2xl bg-base-100 p-4">
                <div><p class="text-xs font-black uppercase tracking-[0.2em] text-accent">Needs review</p><p class="text-sm text-base-content/70">{{ project.humanNeed }}</p></div>
                <div class="flex items-center justify-between rounded-2xl bg-base-200 p-3"><span class="text-sm font-bold">Pitches awaiting vote</span><span class="badge badge-accent rounded-xl font-black">{{ project.pitchesAwaitingVote }}</span></div>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <main class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <section v-if="selectedProject" class="shrink-0 border-b border-base-300 bg-base-200/70 p-4">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="flex gap-3">
              <div class="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><Icon :name="selectedProject.icon" class="size-8" /></div>
              <div><p class="text-xs font-black uppercase tracking-[0.22em] text-primary/70">Active Project</p><h3 class="text-2xl font-black">{{ selectedProject.name }}</h3><p class="max-w-3xl text-sm text-base-content/70">{{ selectedProject.description }}</p></div>
            </div>
            <div class="grid grid-cols-3 gap-2 sm:min-w-[20rem]">
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"><p class="text-xs text-base-content/55">Progress</p><p class="text-xl font-black text-primary">{{ selectedProject.progress }}%</p></div>
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"><p class="text-xs text-base-content/55">Votes</p><p class="text-xl font-black text-accent">{{ selectedProject.pitchesAwaitingVote }}</p></div>
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3 text-center"><p class="text-xs text-base-content/55">Tasks</p><p class="text-xl font-black text-secondary">{{ selectedProject.tasks.length }}</p></div>
            </div>
          </div>
          <div class="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-3"><p class="font-black text-warning">What needs the human</p><p class="text-sm text-base-content/75">{{ selectedProject.humanNeed }}</p></div>
        </section>

        <section v-if="selectedProject" class="min-h-0 flex-1 overflow-auto p-4">
          <div class="mb-3 flex items-center justify-between"><div><p class="text-xs font-black uppercase tracking-[0.2em] text-primary/70">Sub-projects & Tasks</p><h4 class="text-lg font-black">Read-only drilldown</h4></div><span class="badge badge-outline rounded-xl">Preview data</span></div>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article v-for="task in selectedProject.tasks" :key="task.key" class="flex min-h-[12rem] flex-col rounded-2xl border border-base-300 bg-base-200/70 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/50 hover:bg-base-100 hover:shadow-lg">
              <div class="mb-3 flex items-start justify-between gap-3"><h5 class="font-black">{{ task.title }}</h5><span class="badge badge-sm rounded-xl" :class="statusClass(task.status)">{{ task.status }}</span></div>
              <p class="text-sm text-base-content/70">{{ task.summary }}</p>
              <div class="mt-auto pt-4"><progress class="progress progress-primary" :value="task.progress" max="100" /><p class="mt-1 text-xs font-bold text-base-content/60">{{ task.progress }}% complete</p></div>
            </article>
          </div>
        </section>
      </main>
    </section>
  </section>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'

type TaskStatus = 'todo' | 'working' | 'blocked' | 'review' | 'done'
type ConductorTask = { key: string; title: string; summary: string; status: TaskStatus; progress: number }
type ConductorProject = { key: string; name: string; description: string; icon: string; progress: number; pitchesAwaitingVote: number; humanNeed: string; statuses: Record<TaskStatus, number>; tasks: ConductorTask[] }

const fallbackProjects: ConductorProject[] = [
  { key: 'workspace', name: 'Workspace Cockpit', description: 'Project cards, task status, pitch review, and decision queues in one surface.', icon: 'kind-icon:gearhammer', progress: 68, pitchesAwaitingVote: 3, humanNeed: 'Approve the read-only layout and the first real Conductor data shape.', statuses: { todo: 2, working: 3, blocked: 1, review: 2, done: 6 }, tasks: [{ key: 'deck', title: 'Project card deck', summary: 'Render projects as Kind Robots cards with progress and status badges.', status: 'review', progress: 90 }, { key: 'data', title: 'Data placeholder', summary: 'Use props with fallback data until the live Conductor feed is ready.', status: 'working', progress: 70 }, { key: 'gate', title: 'Admin gate', summary: 'Keep the workspace private with a friendly locked-state panel.', status: 'done', progress: 100 }] },
  { key: 'pitchsheets', name: 'PitchSheet Loop', description: 'Coordinate dream pitches, sizzle shots, vote queues, and generated sheet assets.', icon: 'kind-icon:blueprint', progress: 54, pitchesAwaitingVote: 7, humanNeed: 'Review the newest pitch batch and choose which dreams get the next art pass.', statuses: { todo: 4, working: 5, blocked: 2, review: 3, done: 8 }, tasks: [{ key: 'queue', title: 'Sizzle shot queue', summary: 'Track portraits, landscapes, prompt rewrites, and final sheet art.', status: 'working', progress: 62 }, { key: 'votes', title: 'Vote routing', summary: 'Surface pitch decisions in the workspace for fast review.', status: 'review', progress: 76 }, { key: 'layout', title: 'Layout pass', summary: 'Keep landscape batches crisp and ready for the sheet layout.', status: 'blocked', progress: 35 }] },
  { key: 'ami', name: 'AMI Swarm System', description: 'Manage butterfly avatars, emotion variants, story hooks, and narrator-facing swarm state.', icon: 'kind-icon:butterfly', progress: 81, pitchesAwaitingVote: 1, humanNeed: 'Approve the next AMI mood-pack labels before generating another expression set.', statuses: { todo: 1, working: 2, blocked: 0, review: 2, done: 12 }, tasks: [{ key: 'expressions', title: 'Expression pack', summary: 'Track neutral, loving, thinking, whispering, cheering, and other mood states.', status: 'working', progress: 84 }, { key: 'identity', title: 'Avatar identity', summary: 'Preserve AMI as a butterfly hivemind.', status: 'done', progress: 100 }, { key: 'sponsor', title: 'Sponsor thread', summary: 'Connect visual assets and chatbot tone back to anti-malaria sponsorship.', status: 'review', progress: 72 }] },
]

const statusOrder: TaskStatus[] = ['todo', 'working', 'blocked', 'review', 'done']
const props = withDefaults(defineProps<{ showHeader?: boolean; projects?: ConductorProject[] }>(), { showHeader: true, projects: () => fallbackProjects })
const userStore = useUserStore()
const selectedKey = ref(props.projects[0]?.key ?? '')
const projectList = computed(() => (props.projects.length ? props.projects : fallbackProjects))
const selectedProject = computed(() => projectList.value.find((project) => project.key === selectedKey.value) ?? projectList.value[0])
const voteCount = computed(() => projectList.value.reduce((total, project) => total + project.pitchesAwaitingVote, 0))
const reviewCount = computed(() => projectList.value.reduce((total, project) => total + project.statuses.review + project.statuses.blocked, 0))

function progressStyle(progress: number): CSSProperties { return { '--value': String(progress), '--size': '3.5rem', '--thickness': '0.35rem' } as CSSProperties }
function statusClass(status: TaskStatus): string { return { todo: 'badge-ghost', working: 'badge-info', blocked: 'badge-error', review: 'badge-warning', done: 'badge-success' }[status] }

watch(projectList, (projects) => { if (!projects.some((project) => project.key === selectedKey.value)) selectedKey.value = projects[0]?.key ?? '' }, { deep: true })
</script>

<style scoped>
.workspace-scroll { scrollbar-width: thin; scrollbar-color: hsl(var(--p, 280 90% 70%) / 0.35) transparent; }
.workspace-card { transform-style: preserve-3d; }
.workspace-card:hover .card-flip, .workspace-card:focus-visible .card-flip { transform: rotateY(180deg); }
.card-flip { transform-style: preserve-3d; transition: transform 360ms cubic-bezier(0.4, 0.1, 0.2, 1); }
.card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.card-back { transform: rotateY(180deg); }
@media (prefers-reduced-motion: reduce) { .workspace-card, .card-flip { transition: none; } .workspace-card:hover .card-flip, .workspace-card:focus-visible .card-flip { transform: none; } }
</style>
