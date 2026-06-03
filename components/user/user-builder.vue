<!-- /components/users/user-builder.vue -->
<template>
  <div class="hidden" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import type {
  BuilderCard,
  BuilderProjectConfig,
  BuilderSheet,
} from '@/stores/helpers/builderCards'
import { useBuilderStore } from '@/stores/builderStore'
import { useUserStore } from '@/stores/userStore'

const builder = useBuilderStore()
const userStore = useUserStore()

const builderKey = 'user'
const startCard = 'account'

const USER_CARDS: BuilderCard[] = [
  {
    key: 'account',
    label: 'Account',
    title: 'Sign in or create account',
    icon: 'kind-icon:login',
    tagline: 'Builder progress needs a real user.',
    narrative:
      'Log in or create an account so your work has somewhere reliable to live.',
    required: true,
    restoresFields: [],
    unlockCondition: 'always',
    steps: [
      {
        key: 'account',
        title: 'Account',
        narrative:
          'Use the account tools to log in or create a profile before building.',
        inputType: 'custom',
      },
    ],
  },
  {
    key: 'designer',
    label: 'Designer',
    title: 'Your creative identity',
    icon: 'kind-icon:signature',
    tagline: 'Username for access. Designer name for the work.',
    narrative: 'Choose the public creative byline attached to your creations.',
    required: false,
    restoresFields: ['designerName'],
    unlockCondition: 'always',
    steps: [
      {
        key: 'designerName',
        title: 'Designer Name',
        narrative: 'Set the creative name that appears on your work.',
        inputType: 'text',
        field: 'designerName',
        placeholder: 'The Velvet Goblin Atelier',
        inputLabel: 'Designer Name',
      },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    title: 'Privacy and maturity',
    icon: 'kind-icon:sliders',
    tagline: 'Defaults for new creations.',
    narrative:
      'Choose visibility and content preferences for future creations.',
    required: false,
    restoresFields: ['isPublic', 'showMature'],
    unlockCondition: 'always',
    steps: [
      {
        key: 'visibility',
        title: 'Default Visibility',
        narrative: 'Choose whether new creations start public or private.',
        inputType: 'visibility',
        field: 'isPublic',
      },
      {
        key: 'showMature',
        title: 'Mature Content',
        narrative: 'Choose whether mature content is visible while building.',
        inputType: 'toggle',
        field: 'showMature',
      },
    ],
  },
]

function sheetText(key: string): string {
  const value = builder.sheet[key]
  return typeof value === 'string' ? value : ''
}

function sheetBoolean(key: string, fallback = false): boolean {
  const value = builder.sheet[key]
  return typeof value === 'boolean' ? value : fallback
}

function defaultUserSheet(): BuilderSheet {
  return {
    username: userStore.username ?? '',
    designerName: userStore.user?.designerName ?? userStore.username ?? '',
    avatarImage: userStore.user?.avatarImage ?? null,
    isPublic: true,
    showMature: userStore.user?.showMature ?? false,
    userId: userStore.userId ?? userStore.user?.id ?? 10,
  }
}

async function saveUserBuilder() {
  builder.clearError()

  try {
    await userStore.updateUser({
      designerName: sheetText('designerName'),
      showMature: sheetBoolean('showMature', false),
    })

    builder.setStatus('User settings saved.')
    return {
      success: true,
      message: 'User settings saved.',
      data: userStore.user,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to save user settings.'
    builder.setLastError(error, message)
    return { success: false, message, data: null }
  }
}

function resetUserBuilder() {
  builder.resetBuilder(true)
  builder.selectCard(startCard)
}

const userBuilderConfig: BuilderProjectConfig = {
  key: builderKey,
  label: 'User Builder',
  title: 'User Builder',
  modelType: 'user',
  storageKey: 'kindrobots.builder.user.v1',
  cards: USER_CARDS,
  splash: {
    title: 'User Builder',
    subtitle: 'Set up your account, designer identity, and defaults.',
    tagline: 'A tiny foyer before the larger nonsense.',
    description:
      'Configure the account details and preferences that shape the rest of the workshop.',
    imagePath: '/images/users/splash.webp',
    ctaLabel: 'Start Profile',
    secondaryLabel: 'Review Settings',
  },
  defaultSheet: defaultUserSheet,
  coreCardKeys: ['account'],
  requiredCardKeys: ['account'],
  finalCardKey: 'settings',
  clearFieldDefaults: {
    avatarImage: null,
    isPublic: true,
    showMature: false,
    userId: 10,
  },
  persistActiveCard: true,
  allowCompletedCardsInDeck: true,
  suggestContext: {
    builder: 'user',
    tone: 'Friendly, concise, and onboarding-focused.',
  },
  startCardKey: startCard,
  save: saveUserBuilder,
  reset: resetUserBuilder,
}

onMounted(() => {
  builder.registerBuilder(userBuilderConfig)
  builder.setBuilder(builderKey, true)

  if (!builder.activeCardKey && builder.visibleCards.length)
    builder.selectCard(startCard)
})
</script>
