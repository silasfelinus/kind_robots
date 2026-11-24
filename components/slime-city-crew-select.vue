<!--
  CREW SELECT. Silas, 2026-11-11 PT: "We repeat the faction select twice. The
  top one is too much freedom. The user should change the factions in specific
  formats as needed ... Make sure the elements that need it: story, vs,
  deckbuilder, have their space to select." One compact crew button lives in
  each screen that needs it (Journey, Practice, Collection) and opens a row of
  the six crew emblems.
  Silas, 2026-11-24 PT: "vs. mode no longer shows description of the factions
  when selecting a team." The menu carries a dossier: a first tap previews a
  crew (motto, story, how it wins, how to beat it); the confirm button or a
  second tap on the same emblem picks it.
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
        :class="['tone-' + team.color, { previewed: preview.id === team.id }]"
        :aria-pressed="lab.activeTeam === team.id"
        :title="team.name + ': ' + team.motto"
        :data-testid="'slime-crew-' + team.id"
        @click="tap(team.id)"
      >
        <SlimeCityArtwork
          :image-id="slimeArtId('crews', team.id)"
          :alt="team.name + ' crew emblem'"
          :fallback="team.insignia"
          compact
        />
        <span>{{ team.name }}</span>
      </button>
      <article
        class="scs-dossier"
        aria-live="polite"
        data-testid="slime-crew-dossier"
      >
        <span class="scs-turf"
          >{{ preview.insignia }} HOME TURF · {{ preview.district }}</span
        >
        <strong>{{ preview.name }}</strong>
        <em>{{ preview.motto }}</em>
        <p>{{ preview.hook }}</p>
        <dl>
          <dt>WINS BY</dt>
          <dd>{{ preview.pattern }}</dd>
          <dt>BEAT IT</dt>
          <dd>{{ preview.counters }}</dd>
        </dl>
        <button
          type="button"
          class="scs-confirm"
          :disabled="preview.id === lab.activeTeam"
          data-testid="slime-crew-confirm"
          @click="pick(preview.id)"
        >
          {{
            preview.id === lab.activeTeam
              ? 'CURRENT CREW'
              : 'PLAY AS ' + preview.name + ' ›'
          }}
        </button>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
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
/** The crew the dossier describes: the active crew until another is tapped. */
const previewId = ref<TeamId | null>(null)
const preview = computed(
  () => lab.teams.find((team) => team.id === previewId.value) ?? lab.team,
)
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
  previewId.value = lab.activeTeam
  if (!open.value) return
  await nextTick()
  const box = menu.value?.getBoundingClientRect()
  if (!box) return
  const width = document.documentElement.clientWidth
  flipped.value = props.align === 'left' ? box.right > width - 4 : box.left < 4
}

function tap(team: TeamId): void {
  if (previewId.value === team) pick(team)
  else previewId.value = team
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
  grid-template-columns: repeat(3, 5.6rem);
  max-height: min(34rem, calc(100dvh - 6rem));
  overflow-y: auto;
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
.scs-crew.previewed:not([aria-pressed='true']) {
  border-color: #7fd6ff;
  box-shadow: 0 0 10px #7fd6ff55;
}
.scs-crew:hover {
  border-color: #b9f15188;
}
.scs-dossier {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.45rem 0.5rem 0.5rem;
  border-top: 1px solid #b9f15144;
  color: #dfeee7;
  font-size: 0.66rem;
  line-height: 1.3;
}
.scs-turf {
  font-size: 0.5rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.scs-dossier strong {
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: #eef6ef;
}
.scs-dossier em {
  color: #b9f151;
}
.scs-dossier p,
.scs-dossier dl,
.scs-dossier dd {
  margin: 0;
}
.scs-dossier dt {
  margin-top: 0.25rem;
  font-size: 0.5rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  color: #a6c7bc;
}
.scs-confirm {
  margin-top: 0.4rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid #b9f151;
  border-radius: 0.5rem;
  background: #b9f151;
  color: #071115;
  cursor: pointer;
  font: inherit;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}
.scs-confirm:disabled {
  border-color: #b9f15155;
  background: transparent;
  color: #a6c7bc;
  cursor: default;
}
</style>
