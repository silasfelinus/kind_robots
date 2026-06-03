<!-- /components/bots/bot-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { BOT_CARDS } from '@/stores/helpers/botCards'
import type {
  BuilderProjectConfig,
  BuilderSaveResult,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBotStore } from '@/stores/botStore'
import { useBuilderStore } from '@/stores/builderStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const botStore = useBotStore()
const userStore = useUserStore()

const builderKey = 'bot'
const startCard = 'type'

function sheetText(key: string): string {
  const value = builder.sheet[key]

  return typeof value === 'string' ? value : ''
}

function sheetNumber(key: string): number | null {
  const value = builder.sheet[key]

  return typeof value === 'number' ? value : null
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]

  return typeof value === 'boolean' ? value : fallback
}

function defaultBotSheet(): BuilderSheet {
  const form = botStore.botForm as Record<string, unknown>

  return {
    BotType: typeof form.BotType === 'string' ? form.BotType : 'assistant',
    name: typeof form.name === 'string' ? form.name : '',
    subtitle: typeof form.subtitle === 'string' ? form.subtitle : '',
    description: typeof form.description === 'string' ? form.description : '',
    avatarImage: typeof form.avatarImage === 'string' ? form.avatarImage : '',
    botIntro: typeof form.botIntro === 'string' ? form.botIntro : '',
    userIntro: typeof form.userIntro === 'string' ? form.userIntro : '',
    prompt: typeof form.prompt === 'string' ? form.prompt : '',
    trainingPath:
      typeof form.trainingPath === 'string' ? form.trainingPath : '',
    theme: typeof form.theme === 'string' ? form.theme : '',
    personality: typeof form.personality === 'string' ? form.personality : '',
    modules: typeof form.modules === 'string' ? form.modules : '',
    sampleResponse:
      typeof form.sampleResponse === 'string' ? form.sampleResponse : '',
    tagline: typeof form.tagline === 'string' ? form.tagline : '',
    artPrompt: typeof form.artPrompt === 'string' ? form.artPrompt : '',
    artImageId: typeof form.artImageId === 'number' ? form.artImageId : null,
    userId:
      typeof form.userId === 'number'
        ? form.userId
        : (userStore.userId ?? userStore.user?.id ?? 10),
    isPublic: typeof form.isPublic === 'boolean' ? form.isPublic : true,
    underConstruction:
      typeof form.underConstruction === 'boolean'
        ? form.underConstruction
        : false,
    canDelete: typeof form.canDelete === 'boolean' ? form.canDelete : true,
  }
}

function syncSheetToBotForm() {
  const resolvedUserId =
    sheetNumber('userId') ?? userStore.userId ?? userStore.user?.id ?? 10

  botStore.setBotForm({
    BotType: sheetText('BotType'),
    name: sheetText('name'),
    subtitle: sheetText('subtitle'),
    description: sheetText('description'),
    avatarImage: sheetText('avatarImage'),
    botIntro: sheetText('botIntro'),
    userIntro: sheetText('userIntro'),
    prompt: sheetText('prompt'),
    trainingPath: sheetText('trainingPath'),
    theme: sheetText('theme'),
    personality: sheetText('personality'),
    modules: sheetText('modules'),
    sampleResponse: sheetText('sampleResponse'),
    tagline: sheetText('tagline'),
    artPrompt: sheetText('artPrompt'),
    artImageId: sheetNumber('artImageId') ?? undefined,
    userId: resolvedUserId,
    isPublic: sheetBoolean('isPublic', true),
    underConstruction: sheetBoolean('underConstruction', false),
    canDelete: sheetBoolean('canDelete', true),
  })
}

async function saveBotBuilder(): Promise<BuilderSaveResult> {
  builder.clearError()
  syncSheetToBotForm()

  const result = await botStore.saveBot()

  if (result.success && result.data) {
    builder.setStatus('Bot saved.')

    return {
      success: true,
      message: 'Bot saved.',
      data: result.data,
    }
  }

  const message = result.message || botStore.lastError || 'Failed to save bot.'

  builder.setLastError(new Error(message), message)

  return {
    success: false,
    message,
    data: result.data ?? null,
  }
}

function resetBotBuilder() {
  botStore.startAddingBot()
  builder.resetBuilder(true)
  builder.selectCard(startCard)
}

const botBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
  label: 'Bot Builder',
  title: 'Bot Builder',
  modelType: 'bot',
  storageKey: 'kindrobots.builder.bot.v1',
  cards: BOT_CARDS,
  splash: {
    title: 'Bot Builder',
    subtitle: 'Design a conversational robot with a job, voice, and vibe.',
    tagline: 'Give it a brain. Give it boundaries. Try not to create Clippy.',
    description:
      'Build a bot one card at a time: type, identity, prompt, personality, intros, presentation, visibility, and art.',
    imagePath: '/images/bots/splash.webp',
    ctaLabel: 'Start Bot',
    secondaryLabel: 'Surprise Me',
  },
  defaultSheet: defaultBotSheet,
  coreCardKeys: ['type', 'identity', 'prompt'],
  requiredCardKeys: ['type', 'identity', 'prompt'],
  finalCardKey: 'art',
  artPurpose: 'builder',
  artImageRole: 'avatar',
  artTitle: 'Bot Avatar Designer',
  artDescription:
    'Create, upload, select, or generate avatar art for this bot.',
  clearFieldDefaults: {
    avatarImage: '',
    artImageId: null,
    userId: 10,
    isPublic: true,
    underConstruction: false,
    canDelete: true,
  },
  persistActiveCard: true,
  allowCompletedCardsInDeck: false,
  suggestContext: {
    builder: 'bot',
    tone: 'Useful, specific, lively, and safe.',
  },
  startCardKey: startCard,
  save: saveBotBuilder,
  reset: resetBotBuilder,
}

onMounted(() => {
  builder.registerBuilder(botBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length) {
    builder.selectCard(startCard)
  }
})
</script>
