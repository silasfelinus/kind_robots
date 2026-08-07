<!-- /components/dreams/daily-dream-generator.vue -->
<template>
  <details
    class="group mb-2 shrink-0 rounded-2xl border border-secondary/30 bg-secondary/10"
  >
    <summary
      class="flex cursor-pointer list-none items-center gap-3 px-4 py-3 marker:hidden"
    >
      <span
        class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-content"
      >
        <Icon name="kind-icon:sparkles" class="size-5" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-black">Today’s Facet Dream</span>
        <span class="block truncate text-xs text-base-content/55">
          A complete Dream graph: world, cast, and material-driven objects.
        </span>
      </span>
      <span class="badge badge-secondary rounded-xl">{{ dateKey }}</span>
      <Icon
        name="kind-icon:chevron-down"
        class="size-4 transition-transform group-open:rotate-180"
      />
    </summary>

    <div class="border-t border-secondary/20 p-4">
      <div
        class="grid gap-3 md:grid-cols-[8rem_8rem_minmax(0,1fr)_auto] md:items-end"
      >
        <label class="form-control">
          <span class="label py-1 text-xs font-bold">Characters</span>
          <select
            v-model.number="characterCount"
            class="select select-bordered select-sm rounded-xl"
          >
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </label>
        <label class="form-control">
          <span class="label py-1 text-xs font-bold">Objects</span>
          <select
            v-model.number="rewardCount"
            class="select select-bordered select-sm rounded-xl"
          >
            <option :value="1">1</option>
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </label>
        <p class="text-xs leading-relaxed text-base-content/55">
          The date supplies a stable seed. Reopening today returns the same Dream
          rather than creating duplicates.
        </p>
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-xl"
          :disabled="loading"
          @click="createDailyDream"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:dream" class="size-4" />
          Build today’s Dream
        </button>
      </div>

      <div
        v-if="message"
        class="mt-3 rounded-xl border p-3 text-sm"
        :class="
          error ? 'kr-note-error' : 'kr-note-success'
        "
      >
        {{ message }}
      </div>

      <div v-if="blueprint" class="mt-3 grid gap-2 md:grid-cols-3">
        <div class="rounded-xl bg-base-100 p-3">
          <p
            class="text-[11px] font-black uppercase tracking-wide text-base-content/45"
          >
            Dream
          </p>
          <p class="mt-1 font-bold">{{ blueprint.title }}</p>
          <p class="mt-1 line-clamp-3 text-xs text-base-content/55">
            {{ blueprint.pitch }}
          </p>
        </div>
        <div class="rounded-xl bg-base-100 p-3">
          <p
            class="text-[11px] font-black uppercase tracking-wide text-base-content/45"
          >
            Cast
          </p>
          <p
            v-for="character in blueprint.characters"
            :key="character.name"
            class="mt-1 text-xs"
          >
            <strong>{{ character.name }}</strong> · {{ character.species }}
            {{ character.characterClass }} · {{ character.alignment }}
          </p>
        </div>
        <div class="rounded-xl bg-base-100 p-3">
          <p
            class="text-[11px] font-black uppercase tracking-wide text-base-content/45"
          >
            Objects
          </p>
          <p
            v-for="reward in blueprint.rewards"
            :key="reward.name"
            class="mt-1 text-xs"
          >
            <strong>{{ reward.name }}</strong> · {{ reward.rarity }}
          </p>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDailyDreamStore } from '@/stores/dailyDreamStore'
import type { DreamWithRelations } from '@/stores/dreamStore'

const emit = defineEmits<{ created: [dream: DreamWithRelations] }>()
const dailyDreamStore = useDailyDreamStore()
const { isCreating: loading, lastBlueprint: blueprint } =
  storeToRefs(dailyDreamStore)
const message = ref('')
const error = ref(false)
const characterCount = ref(2)
const rewardCount = ref(2)
const today = new Date()
const dateKey = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-')

async function createDailyDream(): Promise<void> {
  message.value = ''
  error.value = false
  dailyDreamStore.clearDailyDream()

  const result = await dailyDreamStore.createDailyDream({
    dateKey,
    characterCount: characterCount.value,
    rewardCount: rewardCount.value,
    isPublic: false,
    isMature: false,
  })

  if (!result.success || !result.data) {
    error.value = true
    message.value = result.message || 'Daily Dream could not be created.'
    return
  }

  message.value = result.message || 'Daily Dream ready.'
  emit('created', result.data.dream)
}
</script>
