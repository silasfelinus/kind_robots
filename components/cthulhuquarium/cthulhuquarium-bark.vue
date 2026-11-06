<!-- components/cthulhuquarium/cthulhuquarium-bark.vue
     One line from Charlotte or Wilbur (the canon's story/barks.yaml). With a
     `context`, the line that screen shows today; without one, whatever was
     last said over the tank (tankStore.sayBark), dismissible. Drawn as a
     framed console speech bubble with the speaker's portrait roundel
     (cthulhuquarium/t-098). -->
<template>
  <Transition name="cq-bark">
    <div
      v-if="bark"
      class="cq-bark flex items-end gap-2"
      :class="bark.speaker === 'wilbur' ? 'flex-row-reverse text-right' : ''"
    >
      <img
        :src="portraitUrl ?? undefined"
        :alt="speakerName"
        class="cq-bark-portrait size-12 shrink-0 object-cover object-top"
      />
      <div class="cq-bark-bubble relative max-w-md px-3 py-2">
        <p class="cq-bark-text">{{ bark.text }}</p>
        <p class="cq-bark-speaker">
          {{ speakerName }}
        </p>
        <button
          v-if="!context"
          type="button"
          class="cq-bark-close absolute -right-2 -top-2 grid min-h-8 min-w-8 place-items-center"
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
.cq-bark-portrait {
  border: 2px solid #c49a52;
  border-radius: 999px;
  background: radial-gradient(circle at 50% 30%, #23302f, #0b1214);
  box-shadow:
    0 0 0 2px #0a0d0e,
    0 4px 10px rgb(0 0 0 / 0.5);
}
.cq-bark-bubble {
  border: 1px solid #c49a52;
  border-radius: 0.9rem;
  background: rgb(10 18 20 / 0.9);
  box-shadow:
    inset 0 0 0 3px rgb(10 18 20 / 0.9),
    inset 0 0 0 4px rgb(196 154 82 / 0.28),
    0 8px 20px rgb(0 0 0 / 0.45);
  backdrop-filter: blur(6px);
  color: #e9dfc8;
}
.cq-bark-text {
  font-family:
    'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua',
    'URW Palladio L', Georgia, serif;
  font-size: 0.9rem;
  font-style: italic;
  line-height: 1.35;
}
.cq-bark-speaker {
  margin-top: 0.15rem;
  color: #ecd08e;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.cq-bark-close {
  border: 1px solid #c49a52;
  border-radius: 999px;
  background: #0d1416;
  color: #e9dfc8;
}
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
@media (prefers-reduced-motion: reduce) {
  .cq-bark-enter-active,
  .cq-bark-leave-active {
    transition: none;
  }
}
</style>
