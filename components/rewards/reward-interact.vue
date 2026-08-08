<!-- /components/content/rewards/reward-interact.vue -->
<!--
  The Reward router: browse until you pick one, then work on it.

  The frame every core object shares, and the only thing the interact tier is
  for:

    <x-gallery v-if="!selected" />     <x-{activity} v-else />

  It used to be 1097 lines -- 206 of template and 890 of script -- because a
  whole encounter engine was inlined here. All of it moved to
  reward-encounter.vue unchanged.

  WHY THE SESSION LIVES IN THE STORE NOW. Interact mode is not just "a Reward is
  selected": a conversation already in progress keeps you here even after the
  Reward is deselected. That was answered by a private
  `sessionChatIds = ref<number[]>([])` in this file -- which meant the router's
  own routing condition would have moved out with the encounter surface. Session
  membership is a fact about the chats, so it moved to chatStore instead, keyed
  by scope so Bots and Rewards do not share one. bot-interact had exactly the
  same knot and now uses the same answer.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <!-- show-header off: kr-manager renders the panel title. See bot-gallery. -->
    <reward-gallery
      v-if="!isInteractMode"
      class="min-h-0 flex-1"
      variant="dashboard"
      :show-header="false"
      :show-images="true"
      :show-controls="true"
      :show-card-actions="true"
    />

    <reward-encounter v-else class="min-h-0 flex-1" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useRewardStore } from '@/stores/rewardStore'

const rewardStore = useRewardStore()
const chatStore = useChatStore()

/*
 * A conversation in progress keeps you in the encounter surface even with no Reward
 * selected, which is why this is not simply `Boolean(selectedReward)`.
 */
const isInteractMode = computed(
  () =>
    Boolean(rewardStore.selectedReward) ||
    chatStore.sessionChats('reward').length > 0,
)
</script>
