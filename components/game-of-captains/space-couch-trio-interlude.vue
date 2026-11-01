<template>
  <section
    v-if="due"
    class="trio"
    data-testid="space-couch-trio-step"
    aria-label="Party interlude"
  >
    <span class="trio-kicker"
      >INTERLUDE {{ due.index + 1 }}/3 // {{ partyNames }}</span
    >
    <h3>{{ due.adventure.title }} · {{ due.step.title }}</h3>
    <div class="trio-stage">
      <img
        v-if="stepArt"
        class="trio-art"
        :src="stepArt"
        :alt="due.step.title"
        @error="markArtFailed(stepArt)"
      />
      <div v-else class="trio-faces">
        <span v-for="face in faces" :key="face.id" class="trio-face">
          <img v-if="face.url" :src="face.url" :alt="face.name + ' portrait'" />
          <span v-else>{{ face.name }}</span>
        </span>
      </div>
    </div>
    <p v-if="due.index === 0" class="trio-premise">
      {{ due.adventure.premise }}
    </p>
    <p class="trio-setup">{{ due.step.setup }}</p>
    <button
      v-for="(option, index) in due.step.options"
      :key="option.label"
      class="trio-option"
      type="button"
      :data-trio-choice="index"
      @click="choose(index)"
    >
      <b>{{ option.label }}</b
      ><span>↗</span>
    </button>
  </section>
  <p
    v-else-if="outcome"
    class="trio-outcome"
    data-testid="space-couch-trio-outcome"
    aria-live="polite"
  >
    {{ outcome }}
  </p>
  <section
    v-else-if="ending && adventure"
    class="trio"
    data-testid="space-couch-trio-ending"
    aria-label="Party ending"
  >
    <span class="trio-kicker">PARTY ENDING // {{ partyNames }}</span>
    <h3>{{ adventure.title }} · {{ ending.title }}</h3>
    <img
      v-if="endingArt"
      class="trio-art"
      :src="endingArt"
      :alt="ending.title"
      @error="markArtFailed(endingArt)"
    />
    <div v-else class="trio-faces">
      <span v-for="face in faces" :key="face.id" class="trio-face">
        <img v-if="face.url" :src="face.url" :alt="face.name + ' portrait'" />
        <span v-else>{{ face.name }}</span>
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameOfCaptainsStore } from '~/stores/gameOfCaptainsStore'
import { warpArt } from '~/utils/gameOfCaptains/artManifest'
import { portraitArt } from '~/utils/gameOfCaptains/artSlots'
import { CREW_PROFILES } from '~/utils/gameOfCaptains/crewAssignments'
import {
  trioAdventureFor,
  trioArtKey,
  trioEnding,
  trioEndingIndex,
  trioKey,
  trioOutcomeThisChapter,
  trioStepDue,
} from '~/utils/gameOfCaptains/trioAdventures'

const store = useGameOfCaptainsStore()
const run = computed(() => store.run)
const adventure = computed(() =>
  run.value ? trioAdventureFor(run.value) : null,
)
const due = computed(() => (run.value ? trioStepDue(run.value) : null))
const outcome = computed(() =>
  run.value ? trioOutcomeThisChapter(run.value) : null,
)
const ending = computed(() =>
  run.value?.phase === 'ending' ? trioEnding(run.value) : null,
)
const faces = computed(() =>
  (adventure.value?.crew ?? []).map((id) => {
    const profile = CREW_PROFILES.find((entry) => entry.id === id)!
    return {
      id,
      name: profile.name,
      url: portraitArt(profile.portraitKey),
    }
  }),
)
const partyNames = computed(() =>
  faces.value.map((face) => face.name.toUpperCase()).join(' · '),
)
const failedArt = ref<string[]>([])
const trio = computed(() => adventure.value ? trioKey(adventure.value.crew) : null)
watch(trio, (key) => {
  if (key && import.meta.client) void store.loadTrioArtwork(key)
}, { immediate: true })
function artFor(key: string): string | null {
  const url = store.trioArtwork[key] || warpArt(key)
  return url && !failedArt.value.includes(url) ? url : null
}
function markArtFailed(url: string | null) {
  if (url && !failedArt.value.includes(url))
    failedArt.value = [...failedArt.value, url]
}
const stepArt = computed(() =>
  due.value && trio.value
    ? artFor(trioArtKey(trio.value, (due.value.index + 1) as 1 | 2 | 3))
    : null,
)
const endingArt = computed(() => {
  if (!run.value || !trio.value) return null
  const index = trioEndingIndex(run.value)
  return index === null
    ? null
    : artFor(trioArtKey(trio.value, index ? 'b' : 'a'))
})

function choose(index: number) {
  store.chooseTrio(index === 1 ? 1 : 0)
}
</script>

<style scoped>
.trio {
  margin: 1rem 0;
  padding: 0.9rem;
  border: 1px solid #c7ad8999;
  border-radius: 0.75rem;
  background: linear-gradient(155deg, #3a2a3fdd, #222c40e8);
  color: #fcf1e4;
}
.trio-kicker {
  color: #ffd5ab;
  font-size: 0.6rem;
  letter-spacing: 0.13em;
  font-weight: 900;
}
.trio h3 {
  margin: 0.25rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 800;
}
.trio-art {
  width: 100%;
  max-height: 14rem;
  object-fit: cover;
  border-radius: 0.5rem;
}
.trio-faces {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0.55rem 0;
}
.trio-face {
  display: grid;
  place-items: center;
  min-height: 3.4rem;
  min-width: 3.4rem;
  max-width: 5.3rem;
  overflow: hidden;
  padding: 0.25rem;
  border: 1px solid #d5b68d8f;
  border-radius: 0.45rem;
  color: #ffddb5;
  font-size: 0.6rem;
  font-weight: 800;
  background: #4a3a52;
}
.trio-face img {
  width: 100%;
  height: 4rem;
  object-fit: cover;
}
.trio-premise,
.trio-setup,
.trio-outcome {
  font-size: 0.78rem;
  line-height: 1.55;
  color: #dae4e6;
}
.trio-premise {
  font-style: italic;
}
.trio-outcome {
  border-left: 3px solid #efc49c;
  padding: 0.6rem 0.85rem;
  background: #4a3a5270;
}
.trio-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  text-align: left;
  border: 1px solid #c2a6c296;
  border-radius: 0.65rem;
  background: linear-gradient(90deg, #5a3f6894, #2b2a4b);
  padding: 0.9rem;
  margin: 0.5rem 0;
  color: #fcf1e4;
}
</style>
