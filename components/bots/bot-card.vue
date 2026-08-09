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
      <kr-entity-card-body
        :title="botTitle"
        :source="bot"
        :variant="variant"
        :fallback="artFallbackSrc"
        :show-image="showImage"
        :show-description="false"
        :compact="compact"
        :selected="activeSelected"
        :badges="badges"
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
          class="kr-panel-flat p-3 text-sm"
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
          class="kr-panel-flat p-3 text-sm"
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

        <details v-if="showDebug" class="kr-panel-flat p-2" @click.stop>
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
import type { ArtVariant } from '@/utils/artImageSrc'
import { botTypeMeta } from '@/utils/botTypeVocabulary'
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

/*
 * NO PRIVACY BADGE. Silas, 2026-08-09: "bots don't need to report privacy
 * status on the gallery front."
 *
 * Nearly every Bot in the gallery is Public, so the badge was a constant
 * occupying the same corner on all 69 tiles -- it told you nothing about the
 * one you were looking at, which is the test a badge has to pass. Privacy is
 * still on the card BACK, where it is one fact among the object's stats
 * rather than competing with the type for the front's only badge row.
 */
const botType = computed(() => botTypeMeta(props.bot.BotType))

const badges = computed<EntityCardChip[]>(() => {
  const result: EntityCardChip[] = []
  if (props.bot.underConstruction) {
    result.push({ label: 'Building', class: 'badge-error' })
  }
  /*
   * TYPE AS A GLYPH, not as a word. Silas, 2026-08-09: "The difference between
   * narrator and promptbot is a nice display but should be an icon for each."
   *
   * `NARRATOR` and `PROMPTBOT` are stored upper-case, so as text they were the
   * loudest thing on the card -- shouting a constant next to the Bot's actual
   * name. The glyphs come from utils/botTypeVocabulary.ts, which explains why
   * they are the monochrome ones rather than the illustrated ones the Dream
   * gallery uses. The label survives as the tooltip and the sr-only text.
   */
  if (botType.value) {
    result.push({
      label: '',
      title: botType.value.label,
      icon: botType.value.icon,
      class: 'badge-primary',
    })
  }
  if (activeSelected.value) {
    result.push({ label: 'Selected', class: 'badge-accent' })
  }
  return result
})

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
