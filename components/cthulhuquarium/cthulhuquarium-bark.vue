<!-- components/cthulhuquarium/cthulhuquarium-bark.vue
     One line from Charlotte or Wilbur (the canon's story/barks.yaml). With a
     `context`, the line that screen shows today; without one, whatever was
     last said over the tank (tankStore.sayBark), dismissible. -->
<template>
  <Transition name="cq-bark">
    <div
      v-if="bark"
      class="flex items-end gap-2"
      :class="bark.speaker === 'wilbur' ? 'flex-row-reverse text-right' : ''"
    >
      <img
        :src="portraitUrl ?? undefined"
        :alt="speakerName"
        class="size-12 shrink-0 rounded-full border-2 border-base-300 bg-base-200 object-cover object-top shadow"
      />
      <div
        class="relative max-w-md rounded-2xl border border-base-300 bg-base-100/90 px-3 py-2 shadow backdrop-blur-sm"
      >
        <p class="font-serif text-sm leading-snug">{{ bark.text }}</p>
        <p class="mt-0.5 text-[0.65rem] uppercase tracking-wide opacity-60">
          {{ speakerName }}
        </p>
        <button
          v-if="!context"
          type="button"
          class="btn btn-ghost btn-xs absolute -right-2 -top-2 min-h-8 min-w-8 rounded-full bg-base-100"
          aria-label="Dismiss"
          @click="tankStore.dismissBark()"
        >
          <Icon name="kind-icon:close" class="size-3" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCthulhuquariumTankStore } from '@/stores/cthulhuquariumTankStore'
import { portraitFor } from '~/utils/cthulhuquariumArt'
import { CTHULHUQUARIUM_CHARACTERS } from '~/utils/cthulhuquariumCanon.generated'

const props = withDefaults(defineProps<{ context?: string }>(), {
  context: '',
})

const tankStore = useCthulhuquariumTankStore()

const bark = computed(() =>
  props.context ? tankStore.screenBark(props.context) : tankStore.spokenBark,
)
const speakerName = computed(() =>
  bark.value ? CTHULHUQUARIUM_CHARACTERS[bark.value.speaker].name : '',
)
const portraitUrl = computed(() =>
  bark.value ? portraitFor(bark.value.speaker, bark.value.pose) : null,
)
</script>

<style scoped>
.cq-bark-enter-active,
.cq-bark-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.cq-bark-enter-from,
.cq-bark-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
