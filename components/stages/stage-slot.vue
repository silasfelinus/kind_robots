<!-- /components/stages/stage-slot.vue -->
<template>
  <div
    class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/40 p-2"
  >
    <template v-if="isFilled">
      <div class="flex items-center gap-2">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="displayName || 'participant'"
            class="h-full w-full object-cover"
          />
          <Icon v-else :name="typeIcon" class="h-5 w-5 opacity-60" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium">
            {{ displayName || 'Unknown' }}
          </div>
          <div class="truncate text-xs opacity-60">
            {{ typeLabel }}
          </div>
        </div>

        <button
          class="btn btn-ghost btn-xs"
          title="Clear slot"
          @click="emit('clear', slot.slotId)"
        >
          <Icon name="mdi:close" class="h-3 w-3" />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="flex items-center gap-1">
        <select
          class="select select-bordered select-xs min-w-0 flex-1"
          :value="''"
          @change="onPick"
        >
          <option value="">Cast someone…</option>

          <optgroup v-if="characters.length" label="Characters">
            <option
              v-for="character in characters"
              :key="`c-${character.id}`"
              :value="`character:${character.id}`"
            >
              {{ character.name }}
            </option>
          </optgroup>

          <optgroup v-if="bots.length" label="Bots">
            <option
              v-for="bot in bots"
              :key="`b-${bot.id}`"
              :value="`bot:${bot.id}`"
            >
              {{ bot.name }}
            </option>
          </optgroup>

          <optgroup v-if="performers?.length" label="Performers">
            <option
              v-for="performer in performers"
              :key="`p-${performer.id}`"
              :value="`performer:${performer.id}`"
            >
              {{ performer.name }}
            </option>
          </optgroup>
        </select>

        <button
          class="btn btn-ghost btn-xs"
          title="Generate temporary bot for this role"
          @click="emit('requestTemporary', slot.slotId, slot.roleKey)"
        >
          <Icon name="mdi:auto-fix" class="h-3 w-3" />
        </button>

        <button
          v-if="removable"
          class="btn btn-ghost btn-xs"
          title="Remove slot"
          @click="emit('removeSlot', slot.slotId)"
        >
          <Icon name="mdi:close" class="h-3 w-3" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Bot, Character } from '~/prisma/generated/prisma/client'
import type { CastSlot } from '@/stores/helpers/stageHelper'
import type { StagePerformer } from '@/stores/helpers/stageCards'

const props = defineProps<{
  slot: CastSlot
  characters: Character[]
  bots: Bot[]
  performers?: StagePerformer[]
  removable: boolean
  resolveImage?: (artImageId: number | null) => string | null
}>()

const emit = defineEmits<{
  assignCharacter: [slotId: string, characterId: number]
  assignBot: [slotId: string, botId: number]
  assignPerformer: [slotId: string, performerId: string]
  clear: [slotId: string]
  removeSlot: [slotId: string]
  requestTemporary: [slotId: string, roleKey: string]
}>()

const isFilled = computed<boolean>(() => {
  return props.slot.participantId != null || props.slot.temporary != null
})

const filledParticipant = computed<Character | Bot | null>(() => {
  if (props.slot.participantType === 'character' && props.slot.participantId) {
    return (
      props.characters.find(
        (character) => character.id === props.slot.participantId,
      ) ?? null
    )
  }

  if (props.slot.participantType === 'bot' && props.slot.participantId) {
    return props.bots.find((bot) => bot.id === props.slot.participantId) ?? null
  }

  return null
})

const displayName = computed<string | undefined>(() => {
  if (props.slot.temporary?.name) return props.slot.temporary.name

  return filledParticipant.value?.name
})

const imageUrl = computed<string | null>(() => {
  if (props.slot.temporary?.imagePath) {
    return props.slot.temporary.imagePath
  }

  if (props.slot.participantType === 'character' && filledParticipant.value) {
    const imagePath =
      'imagePath' in filledParticipant.value
        ? filledParticipant.value.imagePath
        : null

    if (typeof imagePath === 'string' && imagePath) return imagePath
  }

  if (props.slot.participantType === 'bot' && filledParticipant.value) {
    const avatarImage =
      'avatarImage' in filledParticipant.value
        ? filledParticipant.value.avatarImage
        : null

    if (typeof avatarImage === 'string' && avatarImage) return avatarImage
  }

  const artImageId =
    props.slot.temporary?.artImageId ??
    filledParticipant.value?.artImageId ??
    null

  if (!artImageId) return null

  return props.resolveImage ? props.resolveImage(artImageId) : null
})

const typeLabel = computed<string>(() => {
  switch (props.slot.participantType) {
    case 'character':
      return 'Character'
    case 'bot':
      return 'Bot'
    case 'temporary-bot':
      return 'Temporary Bot'
    case 'narrator':
      return 'Narrator'
    default:
      return ''
  }
})

const typeIcon = computed<string>(() => {
  switch (props.slot.participantType) {
    case 'bot':
    case 'temporary-bot':
      return 'mdi:robot'
    case 'narrator':
      return 'mdi:script-text'
    default:
      return 'mdi:account'
  }
})

function resetSelect(target: HTMLSelectElement): void {
  target.value = ''
}

function onPick(event: Event): void {
  const target = event.target as HTMLSelectElement | null

  if (!target) return

  const raw = target.value

  if (!raw) {
    resetSelect(target)
    return
  }

  const [type, idValue] = raw.split(':')

  if (!type || !idValue) {
    resetSelect(target)
    return
  }

  if (type === 'performer') {
    emit('assignPerformer', props.slot.slotId, idValue)
    resetSelect(target)
    return
  }

  const id = Number(idValue)

  if (!Number.isInteger(id) || id <= 0) {
    resetSelect(target)
    return
  }

  if (type === 'character') {
    emit('assignCharacter', props.slot.slotId, id)
  } else if (type === 'bot') {
    emit('assignBot', props.slot.slotId, id)
  }

  resetSelect(target)
}
</script>
