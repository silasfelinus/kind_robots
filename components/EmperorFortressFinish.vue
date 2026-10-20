<template>
  <div v-if="!unheard" class="flex flex-wrap items-center gap-2">
    <template v-if="confirming">
      <p class="text-sm italic">
        Nobody has ridden out today. End the day anyway?
      </p>
      <button
        type="button"
        class="eod-finish px-4 py-1.5 text-sm"
        @click="court.finish()"
      >
        End the day
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="confirming = false"
      >
        Not yet
      </button>
    </template>
    <button
      v-else
      type="button"
      class="eod-finish px-5 py-1.5 text-sm"
      :class="idle ? 'opacity-55 hover:opacity-100' : ''"
      :title="
        idle
          ? `${idle} follower${idle === 1 ? ' is' : 's are'} still at the fortress`
          : 'Every order is given'
      "
      @click="finish"
    >
      Finish Day {{ run.day }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useEmperorFortressStore } from '~/stores/emperorFortressStore'
import {
  audiencesToday,
  followerStatus,
} from '~/utils/emperorOfDust/fortress/engine'
import type { FortressRun } from '~/utils/emperorOfDust/fortress/types'

// Finish appears once every petition is heard. It dims while healthy
// followers sit idle with quests on the board, and asks first when nobody
// was sent at all.
const props = defineProps<{ run: FortressRun }>()
const court = useEmperorFortressStore()
const confirming = ref(false)

const unheard = computed(
  () =>
    audiencesToday(props.run).filter(
      (audience) => !props.run.audiencesHeard.includes(audience.id),
    ).length,
)
const idle = computed(() =>
  props.run.board.length
    ? props.run.roster.filter(
        (state) => followerStatus(props.run, state.id) === 'ready',
      ).length
    : 0,
)
const sentToday = computed(() =>
  props.run.active.some((quest) => quest.departedDay === props.run.day),
)

watch(
  () => props.run.day,
  () => {
    confirming.value = false
  },
)

function finish() {
  if (idle.value && !sentToday.value) confirming.value = true
  else court.finish()
}
</script>
