<!-- /components/stages/stage-manager.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 overflow-y-auto p-3">
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Icon name="mdi:theater" class="h-7 w-7 text-primary" />
        <h1 class="text-xl font-bold leading-none md:text-2xl">Stage</h1>
        <span v-if="store.selectedStage" class="badge badge-outline badge-sm">
          {{ store.selectedStage.label }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <button
          class="btn btn-ghost btn-sm"
          title="Persist now"
          @click="store.persist()"
        >
          <Icon name="mdi:content-save" class="h-4 w-4" />
        </button>

        <button
          class="btn btn-ghost btn-sm text-error"
          title="Clear transcript"
          @click="store.clearTranscript()"
        >
          <Icon name="mdi:broom" class="h-4 w-4" />
        </button>
      </div>
    </header>

    <section
      v-if="store.splashImagePath"
      class="overflow-hidden rounded-2xl border border-base-300 bg-base-200 shadow"
    >
      <div class="relative h-44 w-full overflow-hidden md:h-64">
        <img
          :src="store.splashImagePath"
          alt="Kind Robots Stage"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-linear-to-r from-base-100/90 via-base-100/40 to-transparent"
        />
        <div
          class="absolute inset-0 flex max-w-xl flex-col justify-end gap-2 p-4"
        >
          <p class="text-xs font-bold uppercase tracking-wide text-primary">
            Kind Robots Stage
          </p>
          <h2 class="text-2xl font-black leading-tight md:text-4xl">
            Cast the chaos. Run the show.
          </h2>
          <p class="max-w-md text-sm text-base-content/80">
            Pick a stage, cast performers, then let your characters and bots
            improvise their tiny multidimensional hearts out.
          </p>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold uppercase opacity-70">Pick a Stage</h2>

      <div class="grid gap-2 stage-preset-grid">
        <StagePresetCard
          v-for="preset in store.presets"
          :key="preset.id"
          :preset="preset"
          :is-selected="preset.id === store.selectedStageId"
          @select="store.selectStage($event)"
        />
      </div>

      <p v-if="store.selectedStage" class="px-1 text-xs italic opacity-70">
        {{ store.selectedStage.description }}
      </p>
    </section>

    <section class="grid gap-2 md:grid-cols-2">
      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Show Title
          </span>
        </div>
        <input
          v-model="store.showTitle"
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="Optional"
          @change="store.persist()"
        />
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Topic / Premise
          </span>
        </div>
        <input
          v-model="store.showTopic"
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="What's the show about tonight?"
          @change="store.persist()"
        />
      </label>

      <label class="form-control w-full md:col-span-2">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Custom Opening Cue
          </span>
        </div>
        <input
          v-model="store.customOpening"
          type="text"
          class="input input-bordered input-sm w-full"
          :placeholder="store.selectedStage?.openingCue || ''"
          @change="store.persist()"
        />
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Turns ({{ store.maxTurns }})
          </span>
        </div>
        <input
          v-model.number="store.maxTurns"
          type="range"
          min="2"
          max="40"
          step="1"
          class="range range-primary range-sm"
          @change="store.persist()"
        />
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Delay between turns ({{ store.turnDelayMs }}ms)
          </span>
        </div>
        <input
          v-model.number="store.turnDelayMs"
          type="range"
          min="0"
          max="3000"
          step="100"
          class="range range-sm"
          @change="store.persist()"
        />
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">
            Text Server
          </span>
        </div>
        <select
          v-model="store.selectedTextServerId"
          class="select select-bordered select-sm w-full"
          @change="store.persist()"
        >
          <option :value="null">Default (botcafe)</option>
          <option
            v-for="server in textServers"
            :key="server.id"
            :value="server.id"
          >
            {{ server.title }}
          </option>
        </select>
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs uppercase opacity-70">Model</span>
        </div>
        <input
          v-model="store.selectedModel"
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="gpt-4o-mini, llama3.1, claude-3-5-sonnet, …"
          @change="store.persist()"
        />
      </label>
    </section>

    <section v-if="store.selectedStage" class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold uppercase opacity-70">Cast</h2>

      <div
        v-for="role in store.selectedStage.roles"
        :key="role.key"
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <header class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-3">
            <img
              v-if="role.badgeImagePath"
              :src="role.badgeImagePath"
              :alt="role.label"
              class="h-10 w-10 shrink-0 rounded-2xl border border-base-300 object-cover"
            />
            <div class="min-w-0">
              <h3 class="text-sm font-semibold">{{ role.label }}</h3>
              <p class="text-xs opacity-70">{{ role.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <span class="badge badge-outline badge-xs">
              {{ role.min }}–{{ role.max }}
            </span>

            <button
              v-if="canAddSlot(role.key)"
              class="btn btn-ghost btn-xs"
              title="Add another seat"
              @click="store.addCastSlot(role.key)"
            >
              <Icon name="mdi:plus" class="h-3 w-3" />
            </button>
          </div>
        </header>

        <div class="grid gap-2 stage-slot-grid">
          <StageRoleSlot
            v-for="slot in slotsForRole(role.key)"
            :key="slot.slotId"
            :slot="slot"
            :characters="characterStore.characters || []"
            :bots="botStore.bots || []"
            :performers="performersForRole(role.key)"
            :removable="slotsForRole(role.key).length > role.min"
            :resolve-image="resolveImage"
            @assign-performer="assignPerformer"
            @assign-character="store.assignCharacter"
            @assign-bot="store.assignBot"
            @clear="store.clearSlot"
            @remove-slot="store.removeCastSlot"
            @request-temporary="onRequestTemporary"
          />
        </div>
      </div>
    </section>

    <section
      class="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-2xl bg-base-200/90 p-2 backdrop-blur"
    >
      <button
        v-if="!store.isRunning"
        class="btn btn-primary btn-sm"
        :disabled="!store.castReady"
        @click="store.start()"
      >
        <Icon name="mdi:play" class="h-4 w-4" />
        Start
      </button>

      <button
        v-else-if="!store.isPaused"
        class="btn btn-warning btn-sm"
        @click="store.pause()"
      >
        <Icon name="mdi:pause" class="h-4 w-4" />
        Pause
      </button>

      <button v-else class="btn btn-primary btn-sm" @click="store.resume()">
        <Icon name="mdi:play" class="h-4 w-4" />
        Resume
      </button>

      <button
        v-if="store.isRunning"
        class="btn btn-ghost btn-sm"
        @click="store.stop()"
      >
        <Icon name="mdi:stop" class="h-4 w-4" />
        Stop
      </button>

      <button
        class="btn btn-ghost btn-sm"
        :disabled="store.isGenerating || !store.transcript.length"
        @click="store.regenerateLastTurn()"
      >
        <Icon name="mdi:refresh" class="h-4 w-4" />
        Regen
      </button>

      <button
        class="btn btn-ghost btn-sm"
        :disabled="store.isGenerating"
        @click="store.generateNextTurn()"
      >
        <Icon name="mdi:skip-next" class="h-4 w-4" />
        Next
      </button>

      <div class="flex-1 px-2 text-xs opacity-70">
        Turn {{ store.turnIndex }} / {{ store.maxTurns }}
        <span
          v-if="store.isGenerating"
          class="loading loading-dots loading-xs ml-2"
        />
      </div>

      <span v-if="!store.castReady" class="text-xs italic opacity-70">
        Fill required cast roles to start.
      </span>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold uppercase opacity-70">Transcript</h2>

      <div
        class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100/70 p-2"
        :style="transcriptBackgroundStyle"
      >
        <StageMessageCard
          v-for="entry in store.transcript"
          :key="entry.id"
          :entry="entry"
          :resolve-image="resolveImage"
        />

        <div
          v-if="!store.transcript.length"
          class="py-8 text-center text-sm italic opacity-50"
        >
          No show running. Cast your stage and hit Start.
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-1 border-t border-base-300 pt-2">
      <div class="flex gap-2">
        <input
          v-model="interjection"
          type="text"
          class="input input-bordered input-sm flex-1"
          placeholder="Jump in as yourself…"
          @keydown.enter.prevent="submitInterjection"
        />

        <button
          class="btn btn-secondary btn-sm"
          :disabled="!interjection.trim()"
          @click="submitInterjection"
        >
          <Icon name="mdi:send" class="h-4 w-4" />
        </button>
      </div>

      <div class="flex gap-2">
        <input
          v-model="narratorBeat"
          type="text"
          class="input input-bordered input-sm flex-1"
          placeholder="Add a stage direction or scene beat…"
          @keydown.enter.prevent="submitNarratorBeat"
        />

        <button
          class="btn btn-ghost btn-sm"
          :disabled="!narratorBeat.trim()"
          @click="submitNarratorBeat"
        >
          <Icon name="mdi:script-text" class="h-4 w-4" />
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStageStore } from '@/stores/stageStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useBotStore } from '@/stores/botStore'
import { useServerStore } from '@/stores/serverStore'
import StagePresetCard from './stage-preset.vue'
import StageRoleSlot from './stage-slot.vue'
import StageMessageCard from './stage-message.vue'
import {
  getStagePerformerById,
  performersForStageRole,
  performerToTemporaryParticipant,
  type StagePerformer,
} from '@/stores/helpers/stageCards'

type TextServerOption = {
  id: number
  title: string
  serverType: string
  isActive: boolean
}

const store = useStageStore()
const characterStore = useCharacterStore()
const botStore = useBotStore()
const serverStore = useServerStore()

const interjection = ref('')
const narratorBeat = ref('')

const textServers = computed<TextServerOption[]>(() => {
  const servers =
    (serverStore as { servers?: TextServerOption[] }).servers || []

  return servers.filter((server) => {
    return (
      server.isActive &&
      (server.serverType === 'TEXT' ||
        server.serverType === 'OPENAI_COMPATIBLE')
    )
  })
})

const transcriptBackgroundStyle = computed(() => {
  if (!store.transcriptBackgroundImagePath) return {}

  return {
    backgroundImage: `linear-gradient(rgba(18, 18, 24, 0.78), rgba(18, 18, 24, 0.78)), url(${store.transcriptBackgroundImagePath})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

onMounted(() => {
  store.hydrate()
  maybeInitialize(characterStore)
  maybeInitialize(botStore)
  maybeInitialize(serverStore)
})

function maybeInitialize(source: unknown): void {
  if (
    source &&
    typeof source === 'object' &&
    'initialize' in source &&
    typeof (source as { initialize: unknown }).initialize === 'function'
  ) {
    void (source as { initialize: () => Promise<void> }).initialize()
  }
}

function slotsForRole(roleKey: string) {
  return store.cast.filter((slot) => slot.roleKey === roleKey)
}

function canAddSlot(roleKey: string): boolean {
  const stage = store.selectedStage

  if (!stage) return false

  const role = stage.roles.find((entry) => entry.key === roleKey)

  if (!role) return false

  return slotsForRole(roleKey).length < role.max
}

function performersForRole(roleKey: string): StagePerformer[] {
  return performersForStageRole(store.selectedStageId, roleKey)
}

function assignPerformer(slotId: string, performerId: string): void {
  const performer = getStagePerformerById(performerId)

  if (!performer) return

  store.assignTemporary(slotId, performerToTemporaryParticipant(performer))
}

function resolveImage(artImageId: number | null): string | null {
  if (!artImageId) return null

  return `/api/art/image/${artImageId}/thumb`
}

function onRequestTemporary(slotId: string, roleKey: string): void {
  const name = window.prompt(`Name for this ${roleKey}?`) || ''

  if (!name.trim()) return

  const personality =
    window.prompt(`Personality / voice notes for ${name}?`) || ''

  store.assignTemporary(slotId, {
    name: name.trim(),
    imagePath: store.temporaryPerformerImagePath,
    personality: personality.trim() || undefined,
  })
}

function submitInterjection(): void {
  const text = interjection.value.trim()

  if (!text) return

  store.addUserInterjection(text)
  interjection.value = ''
}

function submitNarratorBeat(): void {
  const text = narratorBeat.value.trim()

  if (!text) return

  store.addNarratorBeat(text)
  narratorBeat.value = ''
}
</script>

<style scoped>
.stage-preset-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(180px, 100%), 1fr));
}

.stage-slot-grid {
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
}

section.sticky {
  box-shadow: 0 -4px 12px -8px rgba(0, 0, 0, 0.25);
}
</style>
