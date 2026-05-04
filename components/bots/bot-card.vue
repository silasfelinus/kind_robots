<!-- /components/content/bots/bot-card.vue -->
<template>
  <reactable-card
    :selected="activeSelected"
    :compact="compact"
    :show-reaction="showReaction"
    :target-id="bot.id"
    target-type="bot"
    reaction-category="BOT"
    :target-title="botTitle"
    @select="selectBot"
  >
    <template #actions>
      <button
        v-if="
          showActions && allowEdit && canEdit && (activeSelected || compact)
        "
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Bot"
        @click.stop="startEditing"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && allowClone && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Bot"
        @click.stop="startCloning"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="showActions && canDelete && (activeSelected || compact)"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Bot"
        @click.stop="deleteBot"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </template>

    <div
      v-if="showImage"
      :class="[
        'relative overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        compact ? 'h-32 w-full' : 'h-44 w-full',
      ]"
    >
      <img
        :src="resolvedBotImage"
        :alt="botTitle"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span
          class="badge badge-sm"
          :class="bot.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{ bot.isPublic ? 'Public' : 'Private' }}
        </span>

        <span v-if="bot.underConstruction" class="badge badge-error badge-sm">
          Building
        </span>

        <span v-if="bot.BotType" class="badge badge-primary badge-sm">
          {{ bot.BotType }}
        </span>

        <span v-if="activeSelected" class="badge badge-accent badge-sm">
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
            compact ? 'line-clamp-1 text-base' : 'text-xl',
          ]"
          :title="botTitle"
        >
          {{ botTitle }}
        </h2>

        <p
          v-if="bot.subtitle"
          class="mt-1 line-clamp-1 text-sm font-semibold italic text-base-content/55"
        >
          {{ bot.subtitle }}
        </p>

        <p
          v-if="showDescription"
          :class="[
            'mt-1 text-base-content/70',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-3 text-sm',
          ]"
        >
          {{ bot.description || bot.personality || 'No bot description yet.' }}
        </p>
      </div>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="bot.BotType" class="badge badge-outline badge-sm">
          {{ bot.BotType }}
        </span>

        <span v-if="bot.theme" class="badge badge-ghost badge-sm">
          {{ bot.theme }}
        </span>

        <span v-if="bot.designer" class="badge badge-primary badge-sm">
          {{ bot.designer }}
        </span>

        <span v-if="bot.userId" class="badge badge-secondary badge-sm">
          User {{ bot.userId }}
        </span>

        <span v-if="bot.serverName" class="badge badge-info badge-sm">
          {{ bot.serverName }}
        </span>
      </div>

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

      <div v-if="showLaunchButton" class="mt-auto grid grid-cols-2 gap-2 pt-1">
        <button
          class="btn btn-sm btn-primary rounded-xl text-white"
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
          JSON.stringify(bot, null, 2)
        }}</pre>
      </details>
    </div>
  </reactable-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Bot } from '~/prisma/generated/prisma/client'
import { useBotStore } from '@/stores/botStore'
import { useUserStore } from '@/stores/userStore'

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
  }>(),
  {
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
  },
)

const botStore = useBotStore()
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

const resolvedBotImage = computed(() => {
  return loadedBotImage.value || props.bot.avatarImage || props.fallbackImage
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

  try {
    loadedBotImage.value = await botStore.getBotImage(props.bot.id)
  } catch {
    loadedBotImage.value = props.bot.avatarImage || props.fallbackImage
  }
}

async function selectBot() {
  const selected = await botStore.selectBot(props.bot.id)

  if (!selected) {
    setStatus('Bot could not be selected.', 'error')
  }
}

async function startEditing() {
  const bot = await botStore.startEditingBot(props.bot.id)

  if (!bot) {
    setStatus('Bot could not be loaded for editing.', 'error')
    return
  }

  setStatus('Bot loaded for editing.')
}

async function startCloning() {
  const bot = await botStore.startCloningBot(props.bot.id)

  if (!bot) {
    setStatus('Bot could not be cloned.', 'error')
    return
  }

  setStatus('Bot cloned into the form.')
}

async function deleteBot() {
  const result = await botStore.deleteBotById(props.bot.id)

  if (result.success) {
    setStatus(result.message || 'Bot deleted.')
    return
  }

  setStatus(result.message || 'Failed to delete bot.', 'error')
}

async function launchBot() {
  const selected = await botStore.selectBot(props.bot.id)

  if (!selected) {
    setStatus('Bot could not be launched.', 'error')
    return
  }

  botStore.setPendingLaunchMessage(
    `Ready to chat with ${selected.name || 'this bot'}.`,
  )

  setStatus('Bot selected for chat.')
}

onMounted(async () => {
  await loadBotImage()
})

watch(
  () => [props.bot.id, props.bot.avatarImage, props.showImage],
  async () => {
    await loadBotImage()
  },
)
</script>
