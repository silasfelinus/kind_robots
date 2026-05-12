<!-- /components/dreams/dream-list.vue -->
<template>
  <section class="flex min-h-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow">
    <header class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-primary">
          {{ title }}
        </p>
        <h3 class="text-xl font-black text-base-content">
          {{ dreamStore.selectedDream?.title || 'No Dream selected' }}
        </h3>
      </div>

      <button
        v-if="listType === 'chats'"
        class="btn btn-sm btn-secondary rounded-2xl"
        type="button"
        :disabled="!dreamStore.selectedDreamId || dreamStore.chatsLoading"
        @click="loadChats"
      >
        <Icon name="kind-icon:refresh" class="h-4 w-4" />
        Load
      </button>
    </header>

    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      <article
        v-for="entry in entries"
        :key="entry.key"
        class="rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <div class="flex items-start gap-3">
          <Icon :name="entry.icon" class="h-7 w-7 shrink-0 text-primary" />
          <div class="min-w-0 flex-1">
            <h4 class="font-black text-secondary">
              {{ entry.title }}
            </h4>
            <p class="mt-1 line-clamp-4 text-sm text-base-content/70">
              {{ entry.body }}
            </p>
          </div>
        </div>
      </article>

      <div
        v-if="!entries.length"
        class="rounded-2xl border border-dashed border-base-300 p-4 text-center text-sm text-base-content/60"
      >
        {{ emptyMessage }}
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'

const props = withDefaults(
  defineProps<{
    listType?: 'cast' | 'items' | 'art' | 'chats'
    autoLoad?: boolean
  }>(),
  {
    listType: 'chats',
    autoLoad: true,
  },
)

const dreamStore = useDreamStore()

const title = computed(() => {
  if (props.listType === 'cast') return 'Cast in Location'
  if (props.listType === 'items') return 'Items in Location'
  if (props.listType === 'art') return 'Scene Assets'
  return 'Room History'
})

const emptyMessage = computed(() => {
  if (props.listType === 'cast') return 'No Characters linked yet. The room is empty, which is suspiciously peaceful.'
  if (props.listType === 'items') return 'No Rewards linked yet. Add a cursed teapot. Be brave.'
  if (props.listType === 'art') return 'No scene art linked yet. The Dream is still wearing placeholder pajamas.'
  return 'No room history yet. Say something ominous but useful.'
})

const entries = computed(() => {
  if (props.listType === 'cast') {
    return dreamStore.selectedDreamCast.map((character) => ({
      key: `character-${character.id}`,
      title: character.name,
      body:
        character.personality ||
        character.backstory ||
        character.species ||
        'A linked Character waiting for narrative mischief.',
      icon: 'kind-icon:users',
    }))
  }

  if (props.listType === 'items') {
    return dreamStore.selectedDreamItems.map((reward) => ({
      key: `reward-${reward.id}`,
      title: reward.label || reward.text,
      body: reward.power || reward.collection || 'A linked Reward with suspicious potential.',
      icon: reward.icon || 'kind-icon:gift',
    }))
  }

  if (props.listType === 'art') {
    return dreamStore.selectedDreamCollectionArt.map((art) => ({
      key: `art-${art.id}`,
      title: `Art #${art.id}`,
      body: art.promptString || art.imagePath || 'Scene asset linked to this Dream.',
      icon: 'kind-icon:image',
    }))
  }

  return dreamStore.selectedDreamChats.map((chat) => ({
    key: `chat-${chat.id}`,
    title: chat.title || chat.sender || chat.type,
    body: chat.content,
    icon: chat.type === 'BotResponse' ? 'kind-icon:sparkles' : 'kind-icon:chat',
  }))
})

onMounted(async () => {
  if (props.autoLoad && props.listType === 'chats') {
    await loadChats()
  }
})

async function loadChats() {
  if (!dreamStore.selectedDreamId) return
  await dreamStore.fetchDreamChats({ dreamId: dreamStore.selectedDreamId })
}
</script>
