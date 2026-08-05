<!-- /components/taskmaster/taskmaster-sample-tasks.vue -->
<template>
  <section
    v-if="!taskmasterStore.session"
    class="space-y-3"
    aria-labelledby="taskmaster-samples-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p
          class="text-[0.68rem] font-black uppercase tracking-[0.15em] text-accent"
        >
          Serendipity's sparks
        </p>
        <h3 id="taskmaster-samples-heading" class="mt-1 text-base font-black">
          Borrow a beginning
        </h3>
        <p class="mt-1 text-xs leading-relaxed text-base-content/55">
          Each spark builds a reviewable plan. Nothing is applied automatically.
        </p>
      </div>
      <span
        v-if="gateProject"
        class="badge badge-warning badge-outline badge-sm h-auto rounded-xl py-1 text-[0.65rem]"
      >
        {{ gateProject.gateCount }} human
        {{ gateProject.gateCount === 1 ? 'gate' : 'gates' }}
      </span>
    </div>

    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
      <button
        v-for="sample in sampleTasks"
        :key="sample.id"
        type="button"
        class="taskmaster-spark group relative min-h-28 overflow-hidden rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
        :class="
          sample.id === 'conductor-gates'
            ? 'border-warning/45 bg-warning/10'
            : 'border-base-300/90 bg-base-100/90'
        "
        :disabled="startingId !== null || taskmasterStore.isWeaving"
        @click="useSample(sample)"
      >
        <span
          class="absolute -right-5 -top-5 size-20 rounded-full bg-accent/10 transition group-hover:scale-125 motion-reduce:transition-none"
          aria-hidden="true"
        />
        <span class="relative flex h-full flex-col gap-2">
          <span class="flex items-start justify-between gap-2">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-current/15 bg-base-100/80 text-accent shadow-sm"
              aria-hidden="true"
            >
              <span
                v-if="startingId === sample.id"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else :name="sample.icon" class="size-5" />
            </span>
            <Icon
              name="kind-icon:chevron-right"
              class="mt-1 size-4 shrink-0 text-base-content/25 transition group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none"
            />
          </span>
          <span class="block text-sm font-black leading-snug">
            {{ sample.task }}
          </span>
          <span class="block text-xs leading-relaxed text-base-content/50">
            {{ sample.helper }}
          </span>
          <span
            v-if="sample.id === 'conductor-gates' && gateProject"
            class="mt-auto block text-[0.65rem] font-black uppercase tracking-wide text-warning"
          >
            Starts with {{ gateProject.name }}
          </span>
        </span>
      </button>
    </div>

    <p v-if="errorMessage" class="text-xs text-error" role="alert">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useConductorStore } from '@/stores/conductorStore'
import {
  useTaskmasterStore,
  type TaskmasterTone,
} from '@/stores/taskmasterStore'

type SampleTask = {
  id: string
  task: string
  helper: string
  icon: string
  tone: TaskmasterTone
  vibeTags: string[]
  conductorGates?: boolean
}

const taskmasterStore = useTaskmasterStore()
const conductorStore = useConductorStore()
const startingId = ref<string | null>(null)
const errorMessage = ref('')

const sampleTasks: SampleTask[] = [
  {
    id: 'conductor-gates',
    task: 'Look at my conductor repo and help me clear any current human gates.',
    helper:
      'Load the current Conductor surface and start with the project carrying the most needs-human work.',
    icon: 'kind-icon:gearhammer',
    tone: 'adventurous',
    vibeTags: ['clear-eyed', 'collaborative', 'practical'],
    conductorGates: true,
  },
  {
    id: 'ship-feature',
    task: 'Help me choose the next feature to ship and identify the smallest useful first step.',
    helper: 'Turn an open product decision into a short, concrete sequence.',
    icon: 'kind-icon:story',
    tone: 'mysterious',
    vibeTags: ['decisive', 'focused', 'small wins'],
  },
  {
    id: 'reclaim-space',
    task: 'Help me turn the messiest corner of my home into a usable space.',
    helper: 'Break a physical cleanup project into approachable checkpoints.',
    icon: 'kind-icon:dream',
    tone: 'cozy',
    vibeTags: ['gentle', 'visible progress', 'no shame'],
  },
  {
    id: 'hard-conversation',
    task: 'Help me prepare for a conversation I have been putting off.',
    helper: 'Clarify the goal, gather the facts, and plan the opening words.',
    icon: 'kind-icon:alert',
    tone: 'tender',
    vibeTags: ['honest', 'calm', 'respectful'],
  },
]

const gateProject = computed(() => {
  let best: { slug: string; name: string; gateCount: number } | null = null

  for (const project of conductorStore.projects) {
    const gateCount = (project.tasks ?? []).filter(
      (task) => task.status === 'needs-human',
    ).length
    if (!project.slug || gateCount === 0 || gateCount <= (best?.gateCount ?? 0)) {
      continue
    }
    best = {
      slug: project.slug,
      name: project.name || project.slug,
      gateCount,
    }
  }

  return best
})

async function refreshConductorGates(): Promise<void> {
  await conductorStore.fetchProjects(true)
}

async function useSample(sample: SampleTask): Promise<void> {
  if (startingId.value || taskmasterStore.isWeaving) return

  startingId.value = sample.id
  errorMessage.value = ''
  try {
    await Promise.all([
      taskmasterStore.loadRealSurfaces(),
      sample.conductorGates ? refreshConductorGates() : Promise.resolve(),
    ])
    const projectSlug = sample.conductorGates ? gateProject.value?.slug : undefined
    const prepared = await taskmasterStore.prepareQuest({
      tone: sample.tone,
      taskTitle: sample.task,
      vibeTags: sample.vibeTags,
      projectSlug,
      surprise: false,
    })

    if (!prepared) {
      errorMessage.value =
        'Taskmaster could not build a checkpoint plan for that example. Try entering it in the quest builder below.'
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Taskmaster could not load that sample quest.'
  } finally {
    startingId.value = null
  }
}

onMounted(() => {
  void refreshConductorGates()
})
</script>
