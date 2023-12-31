<template>
  <div class="bg-base-200 p-1"><ami-loader /></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useUserStore } from './stores/userStore';
import { errorHandler } from './server/api/utils/error';
import { useArtStore } from './stores/artStore';
import { useChannelStore } from './stores/channelStore';
import { useMilestoneStore } from './stores/milestoneStore';
import { useTagStore } from './stores/tagStore';
import { useMatureStore } from './stores/matureStore';
import { useThemeStore } from './stores/themeStore';
import { useBotStore } from './stores/botStore';
import { useLayoutStore } from './stores/layoutStore';
import { usePitchStore } from './stores/pitchStore';
import { useChatStore } from './stores/chatStore';
import { usePageStore } from './stores/pageStore';

const layoutStore = useLayoutStore();

const tagStore = useTagStore();
const userStore = useUserStore();
const artStore = useArtStore();
const matureStore = useMatureStore();
const themeStore = useThemeStore();
const botStore = useBotStore();
const pitchStore = usePitchStore();
const channelStore = useChannelStore();
const milestoneStore = useMilestoneStore();
const chatStore = useChatStore();
const pageStore = usePageStore();

useSeoMeta({
  title: 'Kind Robots',
  ogTitle: 'Welcome to the Kind Robots',
  description: 'OpenAI-supported Promptbots here to assist humanity.',
  ogDescription: 'Make and Share OpenAI prompts, AI-assisted art, and find the secret jellybeans',
  ogImage: '/images/kindtitle.webp',
  twitterCard: 'summary_large_image',
});
onMounted(() => {
  try {
    // Initialize user data
    layoutStore.initialize();
    botStore.loadStore();
    matureStore.initialize();
    userStore.initializeUser();
    artStore.init();
    tagStore.initializeTags();
    themeStore.initTheme();
    pitchStore.initializePitches();
    channelStore.initializeChannels();
    milestoneStore.initializeMilestones();
    chatStore.fetchChatExchanges();
    pageStore.loadPages();
    console.log('Welcome to Kind Robots, random person who reads console logs! Are you a developer?');
  } catch (error: any) {
    errorHandler({ success: false, message: `Initialization failed: ${error}` });
  }
});
</script>
