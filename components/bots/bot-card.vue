<!-- /components/content/bots/bot-card.vue -->
<template>
  <article
    :class="[
      'relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      activeSelected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectBot"
  >
    <div
      v-if="showActions && (activeSelected || compact)"
      class="absolute right-2 top-2 z-20 flex items-center gap-2"
    >
      <button
        v-if="allowEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow transition hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Bot"
        @click.stop="emit('edit', bot.id)"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowClone"
        class="rounded-full bg-base-100 p-2 text-secondary shadow transition hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Bot"
        @click.stop="emit('clone', bot.id)"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="canDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow transition hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Bot"
        @click.stop="deleteBot"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="showImage"
      :class="[
        'relative overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        compact ? 'h-32 w-full' : 'h-44 w-full',
      ]"
    >
      <img
        :src="botImage"
        :alt="bot.name || 'Bot avatar'"
        class="h-full w-full object-cover transition-transform hover:scale-105"
        loading="lazy"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span v-if="bot.isPublic" class="badge badge-success badge-sm">
          Public
        </span>

        <span v-else class="badge badge-warning badge-sm">
          Private
        </span>

        <span v-if="bot.underConstruction" class="badge badge-error badge-sm">
          Building
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="min-w-0">
        <h2
          :class="[
            'font-black leading-tight text-base-content',
            compact ? 'line-clamp-1 text-base' : 'text-xl',
          ]"
        >
          {{ bot.name || 'Unnamed Bot' }}
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
        <p class="text-xs font-bold uppercase text-base-content/50">
          Prompt
        </p>

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

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{ JSON.stringify(bot, null, 2) }}</pre>
      </details>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    fallbackImage: '/images/bot.webp',
  },
)

const emit = defineEmits<{
  select: [id: number]
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  launch: [id: number]
}>()

const botStore = useBotStore()
const userStore = useUserStore()

const activeSelected = computed(() => {
  return props.selected || botStore.currentBot?.id === props.bot.id
})

const botImage = computed(() => {
  return props.bot.avatarImage || props.fallbackImage
})

const canDelete = computed(() => {
  if (!props.allowDelete) return false
  if (props.bot.canDelete === false) return false

  return userStore.isAdmin || props.bot.userId === userStore.userId
})

async function selectBot() {
  await botStore.selectBot(props.bot.id)
  emit('select', props.bot.id)
}

async function deleteBot() {
  const result = await botStore.deleteBotById(props.bot.id)

  if (result.success) {
    emit('delete', props.bot.id)
  }
}

async function launchBot() {
  await botStore.selectBot(props.bot.id)
  emit('launch', props.bot.id)
}
</script>