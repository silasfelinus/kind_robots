<!-- /components/content/brainstorm/prompt-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="prompt.id"
    target-type="prompt"
    reaction-category="PROMPT"
    :target-title="promptTitle"
    @select="selectPrompt"
  >
    <template #actions>
      <button
        v-if="
          showActions && allowEdit && canEdit && (activeSelected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Prompt"
        @click.stop="startEditing"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowClone && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Prompt"
        @click.stop="startCloning"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="
          showActions && allowDelete && canDelete && (activeSelected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Prompt"
        @click.stop="deletePrompt"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <header class="min-w-0">
        <div class="flex items-start gap-2">
          <Icon
            :name="fallbackIcon"
            class="mt-1 h-5 w-5 shrink-0 text-primary"
          />

          <div class="min-w-0 flex-1">
            <h2
              :class="[
                'font-black leading-tight text-base-content',
                compact ? 'line-clamp-2 text-base' : 'line-clamp-3 text-xl',
              ]"
              :title="promptTitle"
            >
              {{ promptTitle }}
            </h2>

            <p
              v-if="linkedPitch"
              class="mt-1 truncate text-xs font-semibold text-base-content/50"
            >
              Pitch:
              <span class="text-primary">
                {{ linkedPitchLabel }}
              </span>
            </p>
          </div>
        </div>

        <p
          v-if="showPromptText && !compact"
          class="mt-3 whitespace-pre-wrap rounded-2xl border border-base-300 bg-base-100 p-3 text-sm leading-relaxed text-base-content/75"
        >
          {{ prompt.prompt || 'No prompt text yet.' }}
        </p>
      </header>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="prompt.creationSource" class="badge badge-outline badge-sm">
          {{ prompt.creationSource }}
        </span>

        <span v-if="prompt.pitchId" class="badge badge-primary badge-sm">
          Pitch {{ prompt.pitchId }}
        </span>

        <span v-if="prompt.botId" class="badge badge-secondary badge-sm">
          Bot {{ prompt.botId }}
        </span>

        <span v-if="prompt.galleryId" class="badge badge-accent badge-sm">
          Gallery {{ prompt.galleryId }}
        </span>

        <span v-if="prompt.artImageId" class="badge badge-info badge-sm">
          Image {{ prompt.artImageId }}
        </span>

        <span v-if="prompt.userId" class="badge badge-ghost badge-sm">
          User {{ prompt.userId }}
        </span>

        <span v-if="activeSelected" class="badge badge-success badge-sm">
          Selected
        </span>
      </div>

      <div
        v-if="showPitch && linkedPitch"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
      >
        <div
          class="mb-1 text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Parent Pitch
        </div>

        <p class="font-semibold text-base-content">
          {{ linkedPitchLabel }}
        </p>

        <p
          v-if="linkedPitch.description || linkedPitch.pitch"
          class="mt-1 line-clamp-3 text-base-content/65"
        >
          {{ linkedPitch.description || linkedPitch.pitch }}
        </p>
      </div>

      <div
        v-if="showArtCount"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
      >
        <div
          class="mb-1 text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Generated Art
        </div>

        <p class="text-base-content/70">
          {{ artCount }} linked art object{{ artCount === 1 ? '' : 's' }}
        </p>
      </div>

      <div
        v-if="showLaunchButton"
        class="mt-auto grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3"
      >
        <button
          class="btn btn-sm btn-primary rounded-xl text-white"
          type="button"
          @click.stop="usePromptNow"
        >
          <Icon name="kind-icon:quote" class="h-4 w-4" />
          Use
        </button>

        <button
          class="btn btn-sm btn-info rounded-xl"
          type="button"
          @click.stop="promotePrompt"
        >
          <Icon name="kind-icon:idea" class="h-4 w-4" />
          Promote
        </button>

        <button
          class="btn btn-sm btn-outline rounded-xl"
          type="button"
          @click.stop="selectPrompt"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
          Select
        </button>
      </div>

      <div
        v-if="statusMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{
          JSON.stringify(prompt, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { useNavStore } from '@/stores/navStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'

type PromptWithRelations = Prompt & {
  Pitch?: Pitch | null
}

const props = withDefaults(
  defineProps<{
    prompt: PromptWithRelations
    selected?: boolean
    compact?: boolean
    showActions?: boolean
    showPromptText?: boolean
    showMeta?: boolean
    showPitch?: boolean
    showArtCount?: boolean
    showLaunchButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    fallbackIcon?: string
  }>(),
  {
    selected: false,
    compact: false,
    showActions: true,
    showPromptText: true,
    showMeta: true,
    showPitch: true,
    showArtCount: true,
    showLaunchButton: true,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    fallbackIcon: 'kind-icon:quote',
  },
)

const navStore = useNavStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const userStore = useUserStore()

const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const activeSelected = computed(() => {
  return props.selected || promptStore.selectedPrompt?.id === props.prompt.id
})

const promptTitle = computed(() => {
  return props.prompt.prompt || `Prompt #${props.prompt.id}`
})

const canEdit = computed(() => {
  return userStore.isAdmin || props.prompt.userId === userStore.userId
})

const canDelete = computed(() => {
  return canEdit.value
})

const linkedPitch = computed<Pitch | null>(() => {
  if (props.prompt.Pitch) return props.prompt.Pitch
  if (!props.prompt.pitchId) return null

  return (
    pitchStore.pitches.find((pitch) => {
      return pitch.id === props.prompt.pitchId
    }) || null
  )
})

const linkedPitchLabel = computed(() => {
  const pitch = linkedPitch.value

  if (!pitch) return 'Unknown Pitch'

  return pitch.title || pitch.pitch || `Pitch ${pitch.id}`
})

const artCount = computed(() => {
  return promptStore.artByPromptId[props.prompt.id]?.length || 0
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function selectPrompt() {
  await promptStore.selectPrompt(props.prompt.id)
}

async function startEditing() {
  const prompt = await promptStore.startEditingPrompt(props.prompt.id)

  if (!prompt) {
    setStatus('Prompt could not be loaded for editing.', 'error')
    return
  }

  setStatus('Prompt loaded for editing.')
}

async function startCloning() {
  const form = await promptStore.startCloningPrompt(props.prompt.id)

  if (!form) {
    setStatus('Prompt could not be cloned.', 'error')
    return
  }

  setStatus('Prompt cloned into the form.')
}

async function deletePrompt() {
  const result = await promptStore.deletePromptById(props.prompt.id)

  if (result.success) {
    setStatus(result.message || 'Prompt deleted.')
    return
  }

  setStatus(result.message || 'Failed to delete prompt.', 'error')
}

function usePromptNow() {
  promptStore.usePrompt(props.prompt)
  setStatus('Prompt loaded.')
}

async function promotePrompt() {
  const result = await promptStore.promoteToPitch(props.prompt.id)

  if (result.success) {
    navStore.setDashboardTab('brainstorm', 'pitches')
    setStatus(result.message || 'Prompt promoted to pitch.')
    return
  }

  setStatus(result.message || 'Failed to promote prompt.', 'error')
}
</script>
