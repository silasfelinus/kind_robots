<!-- /components/art/generate-button.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <div
      class="grid w-full grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs font-black uppercase tracking-wide">
            Image Server
          </span>
        </div>

        <select
          class="select select-bordered w-full rounded-2xl font-semibold"
          :class="props.compact ? 'select-sm text-sm' : 'min-h-14 text-base'"
          :value="selectedServerId"
          :disabled="artStore.isGenerating || !serverOptions.length"
          @change="handleServerChange"
        >
          <option disabled value="">Select image server</option>

          <option
            v-for="server in serverOptions"
            :key="server.id"
            :value="server.id"
          >
            {{ getServerDisplayLabel(server) }}
          </option>
        </select>
      </label>

      <button
        class="btn w-full rounded-2xl font-black transition-all duration-200 sm:w-auto sm:min-w-48"
        :class="[
          artStore.isGenerating
            ? 'btn-primary cursor-not-allowed opacity-80'
            : canClick
              ? 'btn-primary shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0'
              : 'btn-disabled',
          props.compact ? 'btn-sm text-sm' : 'min-h-14 text-base',
        ]"
        type="button"
        :disabled="!canClick"
        @click="handleGenerate"
      >
        <span v-if="artStore.isGenerating" class="flex items-center gap-2">
          <span class="loading loading-dots loading-sm" />
          {{ busyLabel }}
        </span>

        <span v-else class="flex items-center gap-2">
          <icon :name="icon" class="h-5 w-5" />
          {{ canAfford ? label : 'Out of mana — top up' }}
        </span>
      </button>
    </div>

    <div
      v-if="activeServer"
      class="rounded-2xl border border-base-300 bg-base-200/70 p-3 text-xs font-semibold text-base-content/70"
    >
      <div class="flex flex-wrap items-center gap-2">
        <span class="badge badge-primary badge-sm rounded-2xl">
          {{ getServerEngineLabel(activeServer) }}
        </span>

        <span class="truncate">
          {{
            activeServer.title ||
            activeServer.label ||
            `Server #${activeServer.id}`
          }}
        </span>
      </div>
    </div>

    <div
      v-if="showMessage && artStore.generationMessage"
      class="flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
      :class="
        artStore.generationMessageTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      <icon
        :name="
          artStore.generationMessageTone === 'error'
            ? 'kind-icon:alert'
            : 'kind-icon:check'
        "
        class="mt-0.5 h-4 w-4 shrink-0"
      />
      {{ artStore.generationMessage }}
    </div>

    <div
      v-if="showResult && resultImage"
      class="rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <image-card :art-image="resultImage" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ArtImage, Server } from '~/prisma/generated/prisma/client'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore, type GenerateArtData } from '@/stores/artStore'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    label?: string
    busyLabel?: string
    icon?: string
    compact?: boolean
    showResult?: boolean
    showMessage?: boolean
    overrides?: Partial<GenerateArtData>
  }>(),
  {
    label: 'Generate Image',
    busyLabel: 'Generating…',
    icon: 'kind-icon:sparkles',
    compact: false,
    showResult: true,
    showMessage: true,
    overrides: () => ({}),
  },
)

const emit = defineEmits<{
  generated: [image: ArtImage]
  failed: [message: string]
}>()

const artStore = useArtStore()
const errorStore = useErrorStore()
const manaStore = useManaStore()
const userStore = useUserStore()

const resultImage = computed(
  () => artStore.lastGeneratedArtImage || artStore.currentArtImage || null,
)

const serverOptions = computed(() => artStore.generationServers)

const selectedServerId = computed(() => {
  return artStore.artForm.serverId ? String(artStore.artForm.serverId) : ''
})

const activeServer = computed(() => artStore.activeGenerationServer)

// Can the user afford to generate? Family is always free; BYO/local is free;
// otherwise they need a positive balance. We don't know exact cost client-side,
// so we gate on "has any mana" and let the server 402 handle the exact check.
const canAfford = computed(() => {
  if (manaStore.isFamily) return true
  const server = activeServer.value
  // No server, or a metered platform server → needs mana.
  const metered =
    !server || (server as Server & { isMetered?: boolean }).isMetered
  if (!metered) return true
  return manaStore.balance > 0
})

const canClick = computed(
  () => artStore.canGenerateArt && !artStore.isGenerating && canAfford.value,
)

onMounted(async () => {
  await artStore.prepareArtGenerator()
})

function getServerEngineLabel(server: Server): string {
  if (server.generationEngine === 'OPENAI_IMAGE') return 'OpenAI Images'
  if (server.generationEngine === 'FLUX' || server.supportsFlux)
    return 'Comfy Flux'
  if (server.generationEngine === 'COMFY' || server.serverType === 'COMFY')
    return 'Comfy SDXL'
  if (server.generationEngine === 'A1111' || server.serverType === 'A1111')
    return 'Stable Diffusion'
  return server.generationEngine || server.serverType || 'Image'
}

function getServerDisplayLabel(server: Server): string {
  const title = server.label || server.title || `Server #${server.id}`
  return `${title} · ${getServerEngineLabel(server)}`
}

function handleServerChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const serverId = Number(target.value)

  if (!Number.isInteger(serverId) || serverId <= 0) {
    artStore.selectGenerationServer(null)
    return
  }

  artStore.selectGenerationServer(serverId)
}

async function handleGenerate() {
  const result = await artStore.generateCurrentArt(props.overrides)

  if (!result.success || !result.data) {
    const message = result.message || 'Generation failed.'

    // Insufficient mana → point them at the wallet instead of a dead-end error.
    if (/mana|⚡/i.test(message)) {
      errorStore.addError(
        ErrorType.INTERACTION_ERROR,
        `${message} Visit your wallet to top up.`,
      )
    } else {
      errorStore.addError(ErrorType.GENERAL_ERROR, message)
    }

    emit('failed', message)
    return
  }

  emit('generated', result.data)
}
</script>
