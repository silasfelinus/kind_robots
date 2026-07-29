<!-- /components/taskmaster/taskmaster-sample-tasks.vue -->
<template>
  <section
    v-if="!taskmasterStore.session"
    class="rounded-2xl border border-secondary/25 bg-secondary/5 p-4"
    aria-labelledby="taskmaster-samples-heading"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[0.7rem] font-bold uppercase tracking-wide text-secondary/75">
          Try a sample task
        </p>
        <h2 id="taskmaster-samples-heading" class="mt-1 text-lg font-black">
          Start with a ready-made quest
        </h2>
        <p class="mt-1 max-w-3xl text-xs leading-relaxed text-base-content/55">
          Pick an example to build a reviewable checkpoint plan. Nothing is applied or
          marked complete automatically.
        </p>
      </div>
      <span
        v-if="gateProject"
        class="badge badge-warning badge-sm rounded-xl"
      >
        {{ gateProject.gateCount }} current human
        {{ gateProject.gateCount === 1 ? 'gate' : 'gates' }}
      </span>
    </div>

    <div class="mt-3 grid gap-2 md:grid-cols-2">
      <button
        v-for="sample in sampleTasks"
        :key="sample.id"
        type="button"
        class="group rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
        :class="
          sample.id === 'conductor-gates'
            ? 'border-warning/40 bg-warning/5'
            : 'border-base-300 bg-base-100'
        "
        :disabled="startingId !== null || taskmasterStore.isWeaving"
        @click="useSample(sample)"
      >
        <span class="flex items-start gap-3">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-xl border border-current/15 bg-base-100/70 text-secondary"
            aria-hidden="true"
          >
            <span
              v-if="startingId === sample.id"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else :name="sample.icon" class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-black leading-snug">
              {{ sample.task }}
            </span>
            <span class="mt-1 block text-xs leading-relaxed text-base-content/50">
              {{ sample.helper }}
            </span>
            <span
              v-if="sample.id === 'conductor-gates' && gateProject"
              class="mt-2 block text-[0.68rem] font-bold uppercase tracking-wide text-warning"
            >
              Starts with {{ gateProject.name }}
            </span>
          </span>
        </span>
      </button>
    </div>

    <p v-if="errorMessage" class="mt-3 text-xs text-error" role="alert">
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
      'Loads the current Conductor surface and scopes the checkpoint plan to the project with the most needs-human work.',
    icon: 'kind-icon:gearhammer',
    tone: 'adventurous',
    vibeTags: ['clear-eyed', 'collaborative', 'practical'],
    conductorGates: true,
  },
  {
    id: 'ship-feature',
    task: 'Help me choose the next feature to ship and identify the smallest useful first step.',
    helper: 'Turn an open-ended product decision into a short, concrete sequence.',
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
    helper: 'Clarify the goal, gather the important facts, and plan the opening words.',
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
