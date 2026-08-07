<!-- /components/content/bots/bot-interact.vue -->
<!--
  The Bot router: browse until you pick one, then talk to them.

  The frame every core object shares, and the only thing the interact tier is
  for:

    <x-gallery v-if="!selected" />     <x-workspace v-else />

  It used to be 720 lines -- 367 of template and 348 of script -- because the
  whole conversation surface was inlined here: the chat window, the send
  controls, the runtime settings, the prompt preview. All of it moved to
  bot-workspace.vue unchanged.

  WHY THE SESSION SIGNAL COMES FROM THE STORE. Interact mode is not just "a Bot
  is selected" -- a conversation already under way keeps you here after the Bot
  is cleared, which is what `!currentBot && sessionChats.length === 0` said.
  That second half was a private `sessionChatIds = ref<number[]>([])` in this
  file, and it had to move out with the workspace, leaving the router unable to
  see its own routing condition. Session membership is a fact about the chats,
  so chatStore owns it, keyed by scope so Bots, Rewards and Characters do not
  share one session.

  The status banner is NOT here, unlike scenario-interact. Its only setters are
  a failed send and the prompt-preview copy, both of which require a Bot you are
  already working with -- it has nothing to say while you are still browsing.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <bot-gallery
      v-if="!isInteractMode"
      class="min-h-0 flex-1"
      variant="dashboard"
      title="Choose Your Bot"
      subtitle="Pick a bot to start a focused chat session."
      :show-header="true"
      :show-images="true"
      :show-controls="true"
      :show-card-actions="true"
      :show-launch-button="true"
    />

    <bot-workspace v-else />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'

const botStore = useBotStore()
const chatStore = useChatStore()

/*
 * A conversation in progress keeps you in the workspace even with no Bot
 * selected, which is why this is not simply `Boolean(currentBot)`.
 */
const isInteractMode = computed(
  () =>
    Boolean(botStore.currentBot) || chatStore.sessionChats('bot').length > 0,
)
</script>
