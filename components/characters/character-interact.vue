<!-- /components/content/characters/character-interact.vue -->
<!--
  The Character router: browse until you pick one, then work with them.

  The frame every core object shares, and the only thing the interact tier is
  for:

    <x-gallery v-if="!selected" />     <x-{activity} v-else />

  It used to be 923 lines -- 482 of template and 440 of script -- because both
  the chat and adventure modes were inlined here. All of it moved to
  character-chat.vue unchanged.

  WHY THE SESSION SIGNAL COMES FROM THE STORE. Interact mode is not just "a
  Character is selected": a conversation already under way keeps you here even
  after the Character is deselected. That was answered by a local
  `chatMessages` array, which is display state that moved out with the
  chat surface -- so the router would have lost sight of its own condition. The
  chat surface registers each real Chat id with chatStore under the 'character'
  scope, which is the same answer reward-interact and bot-interact use.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <character-gallery
      v-if="!isInteractMode"
      class="min-h-0 flex-1"
      variant="dashboard"
      title="Choose Your Character"
      subtitle="Pick someone to talk to, or send them on an adventure."
      :show-header="true"
      :show-controls="true"
      :show-card-actions="true"
    />

    <character-chat v-else class="min-h-0 flex-1" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChatStore } from '@/stores/chatStore'

const characterStore = useCharacterStore()
const chatStore = useChatStore()

/*
 * A conversation in progress keeps you in the chat surface even with no Character
 * selected, which is why this is not simply `Boolean(selectedCharacter)`.
 */
const isInteractMode = computed(
  () =>
    Boolean(characterStore.selectedCharacter) ||
    chatStore.sessionChats('character').length > 0,
)
</script>
