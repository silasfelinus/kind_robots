<!-- /components/content/weird/character-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="character.id"
    target-type="character"
    reaction-category="CHARACTER"
    :target-title="displayName"
    @select="selectCharacter"
  >
    <template #actions>
      <button
        v-if="showActions && allowEdit && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Character"
        @click.stop="emit('edit', character.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowClone && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Character"
        @click.stop="emit('clone', character.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Character"
        @click.stop="deleteCharacter"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div
      v-if="showImage"
      :class="[
        'relative overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        compact ? 'h-44 w-full' : 'h-72 w-full',
      ]"
    >
      <img
        :src="computedCharacterImage"
        :alt="displayName"
        class="h-full w-full transition-transform group-hover:scale-[1.02]"
        :class="imageFitClass"
        loading="lazy"
        @error="handleImageError"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="character.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm">Private</span>

        <span v-if="activeSelected" class="badge badge-primary badge-sm">
          Selected
        </span>
      </div>

      <div
        v-if="activeSelected"
        class="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-content shadow"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'line-clamp-2 text-xl',
          ]"
          :title="displayName"
        >
          {{ displayName }}
        </h2>

        <p
          v-if="showDescription"
          :class="[
            'mt-1 text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-sm',
          ]"
        >
          {{
            character.presentation ||
            character.personality ||
            character.backstory ||
            'No story yet.'
          }}
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="character.class" class="badge badge-outline badge-sm">
          {{ character.class }}
        </span>

        <span v-if="character.species" class="badge badge-ghost badge-sm">
          {{ character.species }}
        </span>

        <span v-if="character.genre" class="badge badge-primary badge-sm">
          {{ character.genre }}
        </span>
      </div>

      <div
        v-if="showStats"
        class="grid grid-cols-3 gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <div
          v-for="stat in statRows"
          :key="stat.key"
          class="rounded-xl border border-base-300 bg-base-200 p-2 text-center"
        >
          <div
            class="truncate text-[10px] font-bold uppercase text-base-content/60"
          >
            {{ stat.label }}
          </div>

          <div class="truncate text-xs font-black text-primary">
            {{ stat.value }}
          </div>
        </div>
      </div>

      <div v-if="showModeButtons" class="grid grid-cols-2 gap-2 pt-1">
        <button
          class="btn btn-sm rounded-xl"
          :class="
            activeMode === 'chat' ? 'btn-primary text-white' : 'btn-outline'
          "
          type="button"
          @click.stop="toggleMode('chat')"
        >
          <Icon name="kind-icon:message" class="h-4 w-4" />
          Chat
        </button>

        <button
          class="btn btn-sm rounded-xl"
          :class="activeMode === 'adventure' ? 'btn-secondary' : 'btn-outline'"
          type="button"
          @click.stop="toggleMode('adventure')"
        >
          <Icon name="kind-icon:compass" class="h-4 w-4" />
          Adventure
        </button>
      </div>

      <div
        v-if="activeMode === 'chat' && showInlineInteract"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
        @click.stop
      >
        <weird-chat :character="character" />
      </div>

      <div
        v-if="activeMode === 'adventure' && showInlineInteract"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
        @click.stop
      >
        <weird-card :character="character" />
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
          JSON.stringify(character, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { useArtStore, type ArtImage } from '@/stores/artStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useUserStore } from '@/stores/userStore'

type CharacterMode = 'chat' | 'adventure'

const CHARACTER_FALLBACK_IMAGES = [
  '/images/characters/fallbacks/alien-01.webp',
  '/images/characters/fallbacks/alien-02.webp',
  '/images/characters/fallbacks/alien-03.webp',
  '/images/characters/fallbacks/alien-04.webp',
  '/images/characters/fallbacks/alien-05.webp',
  '/images/characters/fallbacks/alien-06.webp',
] as const

const props = withDefaults(
  defineProps<{
    character: Character
    selected?: boolean
    isSelected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showStats?: boolean
    showModeButtons?: boolean
    showInlineInteract?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    fallbackImage?: string
    imageFit?: 'contain' | 'cover'
  }>(),
  {
    selected: false,
    isSelected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showStats: false,
    showModeButtons: false,
    showInlineInteract: false,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    fallbackImage: '',
    imageFit: 'contain',
  },
)

const emit = defineEmits<{
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  chat: [id: number]
  adventure: [id: number]
}>()

const characterStore = useCharacterStore()
const userStore = useUserStore()
const artStore = useArtStore()

const artImage = ref<ArtImage | null>(null)
const activeMode = ref<CharacterMode | null>(null)
const hasImageError = ref(false)

const activeSelected = computed(() => {
  return (
    props.selected ||
    props.isSelected ||
    characterStore.selectedCharacter?.id === props.character.id
  )
})

const canDelete = computed(() => {
  return (
    props.allowDelete &&
    (userStore.isAdmin || userStore.userId === props.character.userId)
  )
})

const displayName = computed(() => {
  const name = props.character.name?.trim()
  const honorific = props.character.honorific?.trim()

  if (!name && !honorific) return 'Unnamed Hero'
  if (!name) return honorific || 'Unnamed Hero'
  if (!honorific) return name

  return `${name} ${honorific}`.trim()
})

const rotatingFallbackImage = computed(() => {
  if (props.fallbackImage) return props.fallbackImage

  const id = Number(props.character.id)
  const stableIndex = Number.isFinite(id)
    ? Math.abs(id) % CHARACTER_FALLBACK_IMAGES.length
    : 0

  return CHARACTER_FALLBACK_IMAGES[stableIndex]
})

const imageFitClass = computed(() => {
  return props.imageFit === 'cover' ? 'object-cover' : 'object-contain'
})

function normalizeImageMime(fileType?: string | null) {
  const fallback = 'image/webp'
  const cleaned = fileType?.trim().replace(/^\./, '')

  if (!cleaned) return fallback
  if (cleaned.startsWith('image/')) return cleaned

  return `image/${cleaned}`
}

const computedCharacterImage = computed(() => {
  if (hasImageError.value) {
    return rotatingFallbackImage.value
  }

  if (artImage.value?.imageData) {
    return `data:${normalizeImageMime(artImage.value.fileType)};base64,${
      artImage.value.imageData
    }`
  }

  return props.character.imagePath || rotatingFallbackImage.value
})

const statRows = computed(() => [
  { key: 'charm', label: 'Charm', value: props.character.charm || 'COMMON' },
  {
    key: 'empathy',
    label: 'Empathy',
    value: props.character.empathy || 'COMMON',
  },
  { key: 'grace', label: 'Grace', value: props.character.grace || 'COMMON' },
  { key: 'luck', label: 'Luck', value: props.character.luck || 'COMMON' },
  { key: 'might', label: 'Might', value: props.character.might || 'COMMON' },
  { key: 'wits', label: 'Wits', value: props.character.wits || 'COMMON' },
])

function handleImageError() {
  hasImageError.value = true
}

async function selectCharacter() {
  await characterStore.selectCharacter(props.character.id)
}

async function deleteCharacter() {
  const result = await characterStore.deleteCharacter(props.character.id)

  if (result.success) {
    emit('delete', props.character.id)
  }
}

function toggleMode(mode: CharacterMode) {
  activeMode.value = activeMode.value === mode ? null : mode

  if (activeMode.value === 'chat') {
    emit('chat', props.character.id)
  }

  if (activeMode.value === 'adventure') {
    emit('adventure', props.character.id)
  }
}

async function loadCharacterImage() {
  artImage.value = null
  hasImageError.value = false

  if (!props.character.artImageId || !props.showImage) return

  try {
    artImage.value =
      (await artStore.getArtImageById(props.character.artImageId)) ?? null
  } catch (error) {
    console.error('Failed to load character art image:', error)
  }
}

onMounted(async () => {
  await loadCharacterImage()
})

watch(
  () => [props.character.id, props.character.artImageId, props.showImage],
  async () => {
    await loadCharacterImage()
  },
)
</script>
