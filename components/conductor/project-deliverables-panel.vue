<!-- /components/conductor/project-deliverables-panel.vue -->
<!--
  "What's been done / what's next" surface for a project. Public-read; admins (or
  the project owner) get an inline editor for the goal + expected last
  deliverables, persisted via projectStore.updateProject.
-->
<template>
  <section class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
    <div class="mb-3 flex items-center gap-2">
      <Icon name="kind-icon:check-circle" class="size-5 text-primary" />
      <h3
        class="text-sm font-black uppercase tracking-wide text-base-content/70"
      >
        Deliverables &amp; status
      </h3>
      <button
        v-if="canEdit"
        type="button"
        class="btn btn-ghost btn-xs ml-auto rounded-lg"
        @click="editing = !editing"
      >
        <Icon
          :name="editing ? 'kind-icon:x' : 'kind-icon:edit'"
          class="size-3.5"
        />
        {{ editing ? 'Close' : 'Edit' }}
      </button>
    </div>

    <!-- Goal / expected final deliverable -->
    <div v-if="goalText || editing" class="mb-4">
      <p class="mb-1 text-xs font-semibold text-base-content/50">
        What 100% looks like
      </p>
      <textarea
        v-if="editing"
        v-model="goalDraft"
        class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
        rows="3"
        placeholder="One clear paragraph: what does this project look like when it's complete?"
      />
      <p v-else class="text-sm leading-relaxed text-base-content/80">
        {{ goalText }}
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div v-if="doneList.length">
        <p class="mb-1.5 text-xs font-semibold text-success">Shipped</p>
        <ul class="space-y-1.5">
          <li
            v-for="(item, i) in doneList"
            :key="`done-${i}`"
            class="flex items-start gap-2 text-sm text-base-content/75"
          >
            <Icon
              name="kind-icon:check-circle"
              class="mt-0.5 size-4 shrink-0 text-success"
            />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
      <div v-if="nextList.length">
        <p class="mb-1.5 text-xs font-semibold text-warning">Up next</p>
        <ul class="space-y-1.5">
          <li
            v-for="(item, i) in nextList"
            :key="`next-${i}`"
            class="flex items-start gap-2 text-sm text-base-content/75"
          >
            <Icon
              name="kind-icon:circle"
              class="mt-0.5 size-4 shrink-0 text-warning/70"
            />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="editing" class="mt-4 flex items-center justify-end gap-2">
      <span
        v-if="saveMessage"
        class="mr-auto text-xs"
        :class="saveError ? 'text-error' : 'text-success'"
        >{{ saveMessage }}</span
      >
      <button
        type="button"
        class="btn btn-primary btn-sm rounded-xl"
        :disabled="saving"
        @click="save"
      >
        <span v-if="saving" class="loading loading-spinner loading-xs" />
        Save
      </button>
    </div>

    <p
      v-if="!goalText && !doneList.length && !nextList.length && !editing"
      class="text-sm text-base-content/40"
    >
      Progress notes are on the way.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectWithRelations } from '@/stores/projectStore'

const props = defineProps<{
  project: ProjectWithRelations | null
  fallback?: { done?: string[]; next?: string[] }
  goal?: string
}>()

const userStore = useUserStore()
const projectStore = useProjectStore()

const canEdit = computed(
  () =>
    !!props.project &&
    (userStore.isAdmin || props.project.userId === userStore.userId),
)

const goalText = computed(() => props.project?.goal || props.goal || '')
const doneList = computed(() => props.fallback?.done ?? [])
const nextList = computed(() => props.fallback?.next ?? [])

const editing = ref(false)
const goalDraft = ref(goalText.value)
watch(goalText, (v) => {
  if (!editing.value) goalDraft.value = v
})

const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)

async function save() {
  if (!props.project) return
  saving.value = true
  saveMessage.value = ''
  saveError.value = false
  try {
    await projectStore.updateProject(props.project.id, {
      goal: goalDraft.value,
    })
    saveMessage.value = 'Saved'
    editing.value = false
  } catch (cause) {
    saveError.value = true
    saveMessage.value = cause instanceof Error ? cause.message : 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>
