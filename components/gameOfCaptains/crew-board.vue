<template>
  <div class="crew-board" data-testid="space-couch-crew-roster">
    <ol class="crew-seats" aria-label="Your three officers">
      <li
        v-for="(id, seat) in seats"
        :key="seat"
        class="crew-seat"
        :class="{ filled: !!id, next: !id && seat === chosen.length }"
        :data-testid="'space-couch-crew-seat-' + (seat + 1)"
      >
        <template v-if="id">
          <button
            type="button"
            class="crew-seat-face"
            :aria-label="'View ' + profile(id).name"
            @click="focused = id"
          >
            <img
              v-if="portraitArt(profile(id).portraitKey)"
              :src="portraitArt(profile(id).portraitKey)!"
              alt=""
            />
            <span v-else class="crew-seat-mono">{{ monogram(id) }}</span>
            <span class="crew-seat-name">{{ profile(id).name }}</span>
          </button>
          <button
            type="button"
            class="crew-seat-release"
            :aria-label="'Release ' + profile(id).name"
            :data-testid="'space-couch-crew-release-' + id"
            @click="release(id)"
          >
            ✕
          </button>
        </template>
        <span v-else class="crew-seat-empty">
          <b>{{ seat + 1 }}</b>
          <small>{{
            seat === chosen.length ? 'Tap an officer' : 'Empty seat'
          }}</small>
        </span>
      </li>
    </ol>
    <div class="crew-grid" role="group" aria-label="All twelve officers">
      <button
        v-for="member in CREW"
        :key="member.id"
        type="button"
        class="crew-card"
        :class="{
          chosen: chosen.includes(member.id),
          focused: focused === member.id,
          locked: full && !chosen.includes(member.id),
        }"
        :aria-pressed="chosen.includes(member.id)"
        :data-testid="'space-couch-crew-card-' + member.id"
        @click="tap(member.id)"
      >
        <img
          v-if="portraitArt(profile(member.id).portraitKey)"
          class="crew-card-art"
          :src="portraitArt(profile(member.id).portraitKey)!"
          alt=""
        />
        <span v-else class="crew-card-art crew-card-mono">{{
          member.monogram
        }}</span>
        <span class="crew-card-copy">
          <strong>{{ member.name }}</strong>
          <small>{{ member.role }}</small>
        </span>
        <b v-if="chosen.includes(member.id)" class="crew-card-seat">{{
          chosen.indexOf(member.id) + 1
        }}</b>
      </button>
    </div>
    <p class="crew-board-status" aria-live="polite">
      {{ statusLine }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CREW, type CrewId } from '~/utils/gameOfCaptains/rules'
import { CREW_PROFILES } from '~/utils/gameOfCaptains/crewAssignments'
import { portraitArt } from '~/utils/gameOfCaptains/artSlots'

const chosen = defineModel<CrewId[]>('chosen', { required: true })
const focused = defineModel<CrewId>('focused', { required: true })

const full = computed(() => chosen.value.length >= 3)
const seats = computed(() =>
  [0, 1, 2].map((seat) => chosen.value[seat] ?? null),
)
const statusLine = computed(() => {
  const left = 3 - chosen.value.length
  if (!left) return 'Crew complete. Tap ✕ on a seat to swap someone out.'
  return left === 1 ? 'One seat left.' : left + ' seats left.'
})

function profile(id: CrewId) {
  return CREW_PROFILES.find((person) => person.id === id)!
}
function monogram(id: CrewId) {
  return CREW.find((member) => member.id === id)?.monogram ?? '?'
}
function release(id: CrewId) {
  chosen.value = chosen.value.filter((x) => x !== id)
}
function tap(id: CrewId) {
  const wasFocused = focused.value === id
  focused.value = id
  if (chosen.value.includes(id)) {
    if (wasFocused) release(id)
    return
  }
  if (!full.value) chosen.value = [...chosen.value, id]
}
</script>

<style scoped>
.crew-board {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: clamp(0.3rem, 1cqh, 0.7rem);
  min-width: 0;
  min-height: 0;
  container-type: inline-size;
}
.crew-seats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(0.3rem, 1cqi, 0.6rem);
  margin: 0;
  padding: 0;
  list-style: none;
}
.crew-seat {
  position: relative;
  display: flex;
  min-width: 0;
  height: clamp(3.2rem, 9cqh, 4.6rem);
  border: 2px dashed #7fa9b388;
  border-radius: 0.9rem;
  background: #0b1a2a99;
  transition:
    border-color 180ms ease,
    background 180ms ease;
}
.crew-seat.next {
  border-color: #ffd39d;
  animation: crew-seat-pulse 1.8s ease-in-out infinite;
}
.crew-seat.filled {
  border-style: solid;
  border-color: #ffd3a3;
  background: linear-gradient(120deg, #a9786366, #1f384fcc);
}
.crew-seat-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.7rem;
  color: #a7c6d0;
}
.crew-seat-empty b {
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: 1px solid currentColor;
  border-radius: 50%;
  font:
    900 0.95rem Georgia,
    serif;
}
.crew-seat-empty small {
  font-size: clamp(0.6rem, 2.4cqi, 0.8rem);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.crew-seat.next .crew-seat-empty {
  color: #ffd39d;
}
.crew-seat-face {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem;
  text-align: left;
}
.crew-seat-face img,
.crew-seat-mono {
  flex: 0 0 auto;
  height: 100%;
  aspect-ratio: 1;
  border-radius: 0.6rem;
  object-fit: cover;
  object-position: top;
}
.crew-seat-mono {
  display: grid;
  place-items: center;
  background: #30465d;
  color: #f7c994;
  font:
    900 1.3rem Georgia,
    serif;
}
.crew-seat-name {
  min-width: 0;
  overflow: hidden;
  color: #ffe2bc;
  font-weight: 900;
  font-size: clamp(0.68rem, 2.6cqi, 0.95rem);
  line-height: 1.15;
}
.crew-seat-release {
  position: absolute;
  top: -0.6rem;
  right: -0.5rem;
  display: grid;
  place-items: center;
  width: 2rem;
  min-height: 2rem;
  border: 1px solid #ffd3a3;
  border-radius: 50%;
  background: #172238;
  color: #ffd3a3;
  font-size: 0.75rem;
  font-weight: 900;
}
.crew-seat-release:hover,
.crew-seat-release:focus-visible {
  background: #8d3a3a;
}
.crew-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: clamp(0.25rem, 0.9cqi, 0.55rem);
  min-height: 0;
}
.crew-card {
  position: relative;
  display: block;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  border: 2px solid #91b8c055;
  border-radius: 0.9rem;
  background: #172238;
  color: #f3efea;
  text-align: left;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    opacity 160ms ease;
}
.crew-card:hover,
.crew-card:focus-visible {
  transform: translateY(-2px);
  border-color: #f7c69a;
}
.crew-card.focused {
  border-color: #9de6e8;
  box-shadow: 0 0 0 2px #9de6e855;
}
.crew-card.chosen {
  border-color: #ffd3a3;
  box-shadow: 0 0 18px #ffbd8d55;
}
.crew-card.locked {
  opacity: 0.55;
}
.crew-card-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
}
.crew-card-mono {
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #3a5068, #1a2638);
  color: #f7c994;
  font:
    900 2rem Georgia,
    serif;
}
.crew-card-copy {
  position: absolute;
  inset: auto 0 0;
  display: block;
  padding: 1.4rem 0.45rem 0.35rem;
  background: linear-gradient(180deg, transparent, #08121fee 55%);
}
.crew-card-copy strong,
.crew-card-copy small {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.crew-card-copy strong {
  font-size: clamp(0.68rem, 2.3cqi, 0.95rem);
  line-height: 1.15;
}
.crew-card-copy small {
  color: #bcdbdf;
  font-size: clamp(0.56rem, 1.8cqi, 0.74rem);
}
.crew-card-seat {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  background: #ffd39d;
  color: #132039;
  font:
    900 0.85rem Georgia,
    serif;
}
.crew-board-status {
  margin: 0;
  color: #9de6e8;
  font-size: clamp(0.6rem, 2cqi, 0.78rem);
  font-weight: 900;
  letter-spacing: 0.05em;
}
@container (max-width: 340px) {
  .crew-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
  }
  .crew-card-copy small,
  .crew-seat-empty small {
    display: none;
  }
}
@keyframes crew-seat-pulse {
  50% {
    background: #ffd39d1f;
  }
}
@media (prefers-reduced-motion: reduce) {
  .crew-seat.next {
    animation: none;
  }
  .crew-card {
    transition: none;
  }
}
</style>
