<!--
  CREW SELECT. Silas, 2026-11-11 PT: "We repeat the faction select twice. The
  top one is too much freedom. The user should change the factions in specific
  formats as needed ... Make sure the elements that need it: story, vs,
  deckbuilder, have their space to select." One compact crew button lives in
  each screen that needs it (Journey, Practice, Collection) and opens a row of
  the six crew emblems.
-->
<template>
  <div
    ref="root"
    class="scs"
    :class="{ open }"
    data-testid="slime-crew-select"
    @focusout="onFocusOut"
    @keydown.esc="open = false"
  >
    <button
      type="button"
      class="scs-current"
      :aria-expanded="open"
      :aria-label="label + ': ' + lab.team.name + '. Change crew'"
      :title="label + ': ' + lab.team.name"
      data-testid="slime-crew-select-toggle"
      @click="toggle"
    >
      <SlimeCityArtwork
        :image-id="slimeArtId('crews', lab.activeTeam)"
        :alt="lab.team.name + ' crew emblem'"
        :fallback="lab.team.insignia"
        compact
      />
      <span v-if="!compact" class="scs-name">
        <small>{{ label }}</small>
        <b>{{ lab.team.name }}</b>
      </span>
      <span class="scs-caret" aria-hidden="true">▾</span>
    </button>
    <div
      v-if="open"
      ref="menu"
      class="scs-menu"
      :class="'align-' + (flipped ? flipSide(align) : align)"
      role="group"
      :aria-label="'Choose ' + label.toLowerCase()"
    >
      <button
        v-for="team in lab.teams"
        :key="team.id"
        type="button"
        class="scs-crew"
        :class="'tone-' + team.color"
        :aria-pressed="lab.activeTeam === team.id"
        :title="team.name"
        :data-testid="'slime-crew-' + team.id"
        @click="pick(team.id)"
      >
        <SlimeCityArtwork
          :image-id="slimeArtId('crews', team.id)"
          :alt="team.name + ' crew emblem'"
          :fallback="team.insignia"
          compact
        />
        <span>{{ team.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import type { TeamId } from '~/utils/slimeCity/prototypes'

const props = withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
    align?: 'left' | 'right'
  }>(),
  { label: 'Crew', compact: false, align: 'left' },
)
const emit = defineEmits<{ picked: [team: TeamId] }>()
const lab = useSlimeCityStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menu = ref<HTMLElement | null>(null)
/**
 * Silas, 2026-11-11 PT (iPad screenshot): the VS crew menu ran off the right
 * edge. The menu opens toward whichever side has room.
 */
const flipped = ref(false)
function flipSide(side: 'left' | 'right'): 'left' | 'right' {
  return side === 'left' ? 'right' : 'left'
}
async function toggle(): Promise<void> {
  open.value = !open.value
  flipped.value = false
  if (!open.value) return
  await nextTick()
  const box = menu.value?.getBoundingClientRect()
  if (!box) return
  const width = document.documentElement.clientWidth
  flipped.value = props.align === 'left' ? box.right > width - 4 : box.left < 4
}

function pick(team: TeamId): void {
  open.value = false
  if (team === lab.activeTeam) return
  lab.chooseTeam(team)
  emit('picked', team)
}
function onFocusOut(event: FocusEvent): void {
  const next = event.relatedTarget as Node | null
  if (next && root.value?.contains(next)) return
  if (next) open.value = false
}
</script>

<style scoped>
.scs {
  position: relative;
  flex: none;
  min-width: 0;
}
.scs-current {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  height: 100%;
  min-height: 1.9rem;
  padding: 0.15rem 0.45rem 0.15rem 0.15rem;
  border: 1px solid #b9f15177;
  border-radius: 0.55rem;
  background: #0e1a1ff0;
  color: #eef6ef;
  cursor: pointer;
  font: inherit;
}
.scs-current :deep(.slime-art) {
  flex: none;
  width: 1.7rem;
  height: 1.7rem;
  margin: 0;
  overflow: hidden;
  border-radius: 0.4rem;
}
.scs-current :deep(img),
.scs-crew :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.scs-name {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.05;
  text-align: left;
}
.scs-name small {
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #a6c7bc;
}
.scs-name b {
  max-width: 11rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.scs-caret {
  font-size: 0.65rem;
  color: #b9f151;
}
.scs.open .scs-current {
  border-color: #b9f151;
  box-shadow: 0 0 10px #b9f15155;
}
.scs-menu {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: repeat(3, 5.2rem);
  gap: 0.35rem;
  padding: 0.4rem;
  border: 1px solid #b9f15188;
  border-radius: 0.7rem;
  background: #071115f5;
  box-shadow: 0 14px 30px #000c;
}
.scs-menu.align-right {
  left: auto;
  right: 0;
}
.scs-crew {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.25rem;
  border: 2px solid transparent;
  border-radius: 0.55rem;
  background: #0f1d22;
  color: #dfeee7;
  cursor: pointer;
  font: inherit;
}
.scs-crew :deep(.slime-art) {
  width: 3.2rem;
  height: 3.2rem;
  margin: 0;
  overflow: hidden;
  border-radius: 0.45rem;
}
.scs-crew span {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.5rem;
  font-weight: 850;
  letter-spacing: 0.04em;
}
.scs-crew[aria-pressed='true'] {
  border-color: #b9f151;
  box-shadow: 0 0 10px #b9f15166;
}
.scs-crew:hover {
  border-color: #b9f15188;
}
</style>
