<!-- /components/content/bots/bot-card.vue -->
<template>
  <div :data-theme="botTheme" class="h-full rounded-2xl">
    <reactable-card
      :selected="activeSelected"
      :compact="compact"
      :show-reaction="showReaction"
      :allow-reviews="bot.allowReviews"
      :target-id="bot.id"
      target-type="bot"
      reaction-category="BOT"
      :target-title="botTitle"
      :earned-karma="earnedKarma"
      @select="selectBot"
    >
      <template #actions>
        <button
          v-if="
            showActions && allowEdit && canEdit && (activeSelected || compact)
          "
          class="rounded-full bg-base-100/90 p-2 text-primary shadow backdrop-blur transition hover:bg-primary hover:text-primary-content"
          type="button"
          title="Edit Bot"
          @click.stop="startEditing"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
        </button>

        <button
          v-if="showActions && allowClone && (activeSelected || compact)"
          class="rounded-full bg-base-100/90 p-2 text-secondary shadow backdrop-blur transition hover:bg-secondary hover:text-secondary-content"
          type="button"
          title="Clone Bot"
          @click.stop="startCloning"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
        </button>

        <button
          v-if="showActions && canDelete && (activeSelected || compact)"
          class="rounded-full bg-base-100/90 p-2 text-error shadow backdrop-blur transition hover:bg-error hover:text-error-content"
          type="button"
          title="Delete Bot"
          @click.stop="deleteBot"
        >
          <Icon name="kind-icon:trash" class="h-4 w-4" />
        </button>
      </template>

      <kr-entity-card-body
        :title="botTitle"
        :subtitle="bot.subtitle || ''"
        :source="bot"
        :variant="variant"
        :fallback="artFallbackSrc"
        :show-image="showImage"
        :show-description="false"
        :compact="compact"
        :selected="activeSelected"
        :badges="badges"
        :meta="showMeta ? metaChips : []"
        shape="card"
        compact-shape="hero"
        placeholder-icon="kind-icon:robot"
      />

      <section
        v-if="
          activeSelected &&
          !compact &&
          (showDescription ||
            showPersonality ||
            showPromptPreview ||
            showLaunchButton ||
            statusMessage ||
            showDebug)
        "
        class="mt-2 grid gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3"
        @click.stop
      >
        <p
          v-if="showDescription"
          class="line-clamp-3 text-sm leading-relaxed text-base-content/70"
        >
          {{ bot.description || bot.personality || 'No bot description yet.' }}
        </p>

        <div
          v-if="showPersonality && bot.personality"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
        >
          <p class="text-xs font-bold uppercase text-base-content/50">
            Personality
          </p>

          <p class="mt-1 line-clamp-4 text-base-content/70">
            {{ bot.personality }}
          </p>
        </div>

        <div
          v-if="showPromptPreview && bot.prompt"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm"
        >
          <p class="text-xs font-bold uppercase text-base-content/50">Prompt</p>

          <p class="mt-1 line-clamp-4 text-base-content/70">
            {{ bot.prompt }}
          </p>
        </div>

        <div v-if="showLaunchButton" class="grid grid-cols-2 gap-2 pt-1">
          <button
            class="btn btn-sm btn-primary rounded-xl text-primary-content"
            type="button"
            @click.stop="launchBot"
          >
            <Icon name="kind-icon:message" class="h-4 w-4" />
            Chat
          </button>

          <button
            class="btn btn-sm btn-outline rounded-xl"
            type="button"
            @click.stop="selectBot"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
            Select
          </button>
        </div>

        <div
          v-if="statusMessage"
          class="rounded-2xl border p-3 text-sm"
          :class="statusTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
        >
          {{ statusMessage }}
        </div>

        <details
          v-if="showDebug"
          class="rounded-2xl border border-base-300 bg-base-100 p-2"
          @click.stop
        >
          <summary
            class="cursor-pointer text-xs font-bold text-base-content/70"
          >
            Debug
          </summary>

          <pre
            class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70"
            >{{ JSON.stringify(bot, null, 2) }}</pre>
        </details>
      </section>
    </reactable-card>
  </div>
</template>

<script setup lang="ts">
// /components/content/bots/bot-card.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import { useBotStore } from '@/stores/botStore'
import { useNavStore } from '@/stores/navStore'
import { useUserStore } from '@/stores/userStore'
import type { ArtVariant } from '@/utils/artImageSrc'
import type { EntityCardChip } from '@/components/gallery/kr-entity-card-body.vue'

const props = withDefaults(
  defineProps<{
    bot: Bot
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showDescription?: boolean
    showMeta?: boolean
    showPersonality?: boolean
    showPromptPreview?: boolean
    showLaunchButton?: boolean
    showReaction?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    fallbackImage?: string
    /**
     * Which stored art to show, and at what aspect — the shared card/hero/icon
     * vocabulary. Hardcoding this made the gallery's mode bar decorative:
     * every mode rendered the identical portrait card. See
     * utils/scripts/verifyGalleryConsistency.ts.
     */
    variant?: ArtVariant
    /** Total karma this bot has earned from reactions to it. Omit/undefined
     *  renders no badge — see components/wonderlab/reactable-card.vue. */
    earnedKarma?: number | null
  }>(),
  {
    variant: 'card',
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showDescription: true,
    showMeta: true,
    showPersonality: false,
    showPromptPreview: false,
    showLaunchButton: true,
    showReaction: true,
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    fallbackImage: '/images/bot.webp',
    earnedKarma: undefined,
  },
)

const emit = defineEmits<{
  open: [id: number]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  launch: [id: number]
}>()

const botStore = useBotStore()
const navStore = useNavStore()
const userStore = useUserStore()

const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const loadedBotImage = ref('')

const activeSelected = computed(() => {
  return props.selected || botStore.currentBot?.id === props.bot.id
})

const botTitle = computed(() => {
  return props.bot.name || 'Unnamed Bot'
})

const botTheme = computed(() => {
  const theme = props.bot.theme?.trim()
  return theme || undefined
})

const avatarFallback = computed(() => {
  return props.bot.avatarImage?.trim() || props.fallbackImage
})

/*
 * What the shared card body falls back to once the Bot's own cardPath is out of
 * the picture: the async-fetched ArtImage, then the avatar crop. kr-art-plate
 * applies the cardPath/heroPath/iconPath half itself, so the explicit
 * `bot.cardPath?.trim() ||` that used to lead this chain is now redundant --
 * same order, one owner.
 */
const artFallbackSrc = computed(
  () => loadedBotImage.value || avatarFallback.value,
)

const badges = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = [
    props.bot.isPublic
      ? { label: 'Public', class: 'badge-success' }
      : { label: 'Private', class: 'badge-warning' },
  ]
  if (props.bot.underConstruction) {
    result.push({ label: 'Building', class: 'badge-error' })
  }
  if (props.bot.BotType) {
    result.push({ label: props.bot.BotType, class: 'badge-primary' })
  }
  if (activeSelected.value) {
    result.push({ label: 'Selected', class: 'badge-accent' })
  }
  return result
})

const metaChips = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = []
  if (props.bot.theme) {
    result.push({ label: props.bot.theme, class: 'badge-ghost' })
  }
  if (props.bot.designer) {
    result.push({ label: props.bot.designer, class: 'badge-outline' })
  }
  if (props.bot.serverName) {
    result.push({ label: props.bot.serverName, class: 'badge-info' })
  }
  return result
})

const canEdit = computed(() => {
  return userStore.isAdmin || props.bot.userId === userStore.userId
})

const canDelete = computed(() => {
  if (!props.allowDelete) return false
  if (props.bot.canDelete === false) return false

  return canEdit.value
})

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function loadBotImage() {
  loadedBotImage.value = ''

  if (!props.showImage) return

  if (!props.bot.artImageId) {
    loadedBotImage.value = avatarFallback.value
    return
  }

  try {
    const image = await botStore.getBotImage(props.bot.id)
    loadedBotImage.value = image || avatarFallback.value
  } catch {
    loadedBotImage.value = avatarFallback.value
  }
}

/*
 * Emit only. This selected the Bot itself and then emitted, which duplicated
 * bot-gallery -- selectBot() there already chooses between selecting (dropdown
 * variant) and launching, so the card was pre-empting a decision the gallery
 * exists to make.
 */
function selectBot() {
  emit('open', props.bot.id)
}

async function startEditing() {
  const bot = await botStore.startEditingBot(props.bot.id)

  if (!bot) {
    setStatus('Bot could not be loaded for editing.', 'error')
    return
  }

  navStore.setDashboardTab('bot', 'forge')
  emit('edit', props.bot.id)
  setStatus('Bot loaded for editing.')
}

async function startCloning() {
  const bot = await botStore.startCloningBot(props.bot.id)

  if (!bot) {
    setStatus('Bot could not be cloned.', 'error')
    return
  }

  emit('clone', props.bot.id)
  setStatus('Bot cloned into the form.')
}

async function deleteBot() {
  const result = await botStore.deleteBotById(props.bot.id)

  if (result.success) {
    emit('delete', props.bot.id)
    setStatus(result.message || 'Bot deleted.')
    return
  }

  setStatus(result.message || 'Failed to delete bot.', 'error')
}

/*
 * Also emit only: bot-gallery's launchBotById() already selects the Bot and
 * sets the pending launch message, so both were happening twice.
 */
function launchBot() {
  emit('launch', props.bot.id)
}

watch(
  () => [
    props.bot.id,
    props.bot.artImageId,
    props.bot.avatarImage,
    props.showImage,
  ],
  async () => {
    await loadBotImage()
  },
)

onMounted(async () => {
  await loadBotImage()
})
</script>
