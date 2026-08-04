<template>
  <section v-if="objectCount" class="border-t border-base-300 bg-base-200/25 p-5 sm:p-7">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.16em] text-primary">
          Complete bundle
        </p>
        <h3 class="mt-1 text-xl font-black">Objects in this Daily Dream</h3>
        <p class="mt-1 max-w-3xl text-sm text-base-content/55">
          The real shared cards, with their descriptions, metadata, artwork, and graceful
          placeholders when an older object is still waiting on generated art.
        </p>
      </div>
      <span class="badge badge-primary rounded-xl">{{ objectCount }} objects</span>
    </header>

    <div class="mt-6 space-y-7">
      <section v-if="relatedDreams.length" class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <Icon name="kind-icon:map" class="size-4 text-accent" />
          <h4 class="text-sm font-black uppercase tracking-wide text-base-content/60">
            Places & companion dreams
          </h4>
        </div>
        <div class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <dream-card
            v-for="relatedDream in relatedDreams"
            :key="relatedDream.id"
            :dream="relatedDream"
            :show-actions="false"
            :show-description="true"
            :allow-edit="false"
            :allow-delete="false"
          />
        </div>
      </section>

      <section v-if="dream.Characters.length" class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <Icon name="kind-icon:users" class="size-4 text-primary" />
          <h4 class="text-sm font-black uppercase tracking-wide text-base-content/60">
            Cast
          </h4>
        </div>
        <div class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <character-card
            v-for="character in dream.Characters"
            :key="character.id"
            :character="character"
            :show-actions="false"
            :show-description="true"
            :show-reaction="false"
            :show-mode-buttons="false"
            :show-inline-interact="false"
            :allow-edit="false"
            :allow-clone="false"
            :allow-delete="false"
          />
        </div>
      </section>

      <section v-if="dream.Rewards.length" class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <Icon name="kind-icon:gift" class="size-4 text-secondary" />
          <h4 class="text-sm font-black uppercase tracking-wide text-base-content/60">
            Discoveries
          </h4>
        </div>
        <div class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <reward-card
            v-for="reward in dream.Rewards"
            :key="reward.id"
            :reward="reward"
            :show-actions="false"
            :show-description="true"
            :show-reaction="false"
            :show-select-button="false"
            :allow-edit="false"
            :allow-delete="false"
          />
        </div>
      </section>

      <section v-if="dream.Scenarios.length" class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <Icon name="kind-icon:story" class="size-4 text-info" />
          <h4 class="text-sm font-black uppercase tracking-wide text-base-content/60">
            Scenarios
          </h4>
        </div>
        <div class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <scenario-card
            v-for="scenario in dream.Scenarios"
            :key="scenario.id"
            :scenario="scenario"
            :show-actions="false"
            :show-description="true"
            :show-reaction="false"
            :show-inspirations="false"
            :allow-edit="false"
            :allow-clone="false"
            :allow-delete="false"
          />
        </div>
      </section>

      <section v-if="dream.Bots.length" class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <Icon name="kind-icon:robot" class="size-4 text-warning" />
          <h4 class="text-sm font-black uppercase tracking-wide text-base-content/60">
            Narrators
          </h4>
        </div>
        <div class="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <bot-card
            v-for="bot in dream.Bots"
            :key="bot.id"
            :bot="bot"
            :show-actions="false"
            :show-description="true"
            :show-personality="true"
            :show-prompt-preview="false"
            :show-launch-button="false"
            :show-reaction="false"
            :allow-edit="false"
            :allow-clone="false"
            :allow-delete="false"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import type {
  DailyDreamArchiveEntry,
  DailyDreamRelatedDream,
} from '@/stores/dailyDreamArchiveStore'

const props = defineProps<{
  dream: DailyDreamArchiveEntry
}>()

const relatedDreams = computed<DreamWithRelations[]>(() => {
  const found = new Map<number, DailyDreamRelatedDream>()

  for (const relation of props.dream.RelationsFrom) {
    if (relation.ToDream.id !== props.dream.id) {
      found.set(relation.ToDream.id, relation.ToDream)
    }
  }

  for (const relation of props.dream.RelationsTo) {
    if (relation.FromDream.id !== props.dream.id) {
      found.set(relation.FromDream.id, relation.FromDream)
    }
  }

  return Array.from(found.values()) as unknown as DreamWithRelations[]
})

const objectCount = computed(
  () =>
    relatedDreams.value.length +
    props.dream.Characters.length +
    props.dream.Rewards.length +
    props.dream.Scenarios.length +
    props.dream.Bots.length,
)
</script>
