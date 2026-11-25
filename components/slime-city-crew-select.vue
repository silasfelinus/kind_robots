<!--
  CREW SELECT. Silas, 2026-11-11 PT: "We repeat the faction select twice. The
  top one is too much freedom. The user should change the factions in specific
  formats as needed ... Make sure the elements that need it: story, vs,
  deckbuilder, have their space to select." One compact crew button lives in each screen that needs it and opens
  an illustrated comic dossier. Controlled callers own their selection.
  Silas, 2026-11-24 PT: "vs. mode no longer shows description of the factions
  when selecting a team." The menu carries a dossier: a first tap previews a
  crew (motto, story, how it wins, how to beat it); the confirm button or a
  second tap on the same emblem picks it.
-->
<template>
  <div class="scs" :class="{ open }" data-testid="slime-crew-select">
    <button
      ref="trigger"
      type="button"
      class="scs-current"
      :aria-expanded="open"
      aria-haspopup="dialog"
      :aria-label="label + ': ' + (currentTeam?.name ?? 'Choose crew')"
      :title="label + ': ' + (currentTeam?.name ?? 'Choose crew')"
      data-testid="slime-crew-select-toggle"
      @click="toggle"
    >
      <SlimeCityArtwork
        :image-id="currentTeam ? slimeArtId('crews', currentTeam.id) : null"
        :alt="(currentTeam?.name ?? 'Choose crew') + ' crew emblem'"
        :fallback="currentTeam?.insignia ?? '+'"
        compact
      />
      <span v-if="!compact" class="scs-name">
        <small>{{ label }}</small>
        <b>{{ currentTeam?.name ?? 'Choose crew' }}</b>
      </span>
      <span class="scs-caret" aria-hidden="true">▾</span>
    </button>
    <dialog
      v-if="open"
      ref="menu"
      class="scs-menu"
      :aria-label="'Choose ' + label.toLowerCase()"
      @cancel.prevent="close"
    >
      <div class="scs-spread">
        <header class="scs-heading">
          <span>SLIME CITY · CHOOSE YOUR CREW</span>
          <button type="button" aria-label="Close crew showcase" @click="close">
            ✕
          </button>
        </header>
        <div class="scs-roster" role="group" aria-label="Preview a crew">
          <button
            v-for="team in availableTeams"
            :key="team.id"
            type="button"
            class="scs-crew"
            :class="'tone-' + team.color"
            :aria-pressed="preview.id === team.id"
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
        </div>
        <article
          class="scs-dossier"
          :class="'tone-' + preview.color"
          aria-live="polite"
          data-testid="slime-crew-dossier"
        >
          <div class="scs-cover">
            <SlimeCityArtwork
              :image-id="slimeArtId('crews', preview.id)"
              :alt="preview.name + ' faction poster'"
              :fallback="preview.insignia"
              compact
            />
            <div class="scs-cover-title">
              <span class="scs-turf"
                >{{ preview.insignia }} HOME TURF · {{ preview.district }}</span
              >
              <strong>{{ preview.name }}</strong>
              <em>{{ preview.motto }}</em>
            </div>
          </div>
          <div class="scs-copy kr-scroll">
            <p>{{ preview.hook }}</p>
            <section class="scs-power" data-testid="slime-crew-power">
              <span class="scs-kicker">SIGNATURE POWER · ONCE PER MATCH</span>
              <h3>{{ power.symbol }} {{ power.name }}</h3>
              <p>{{ power.text }}</p>
              <p><b>OVERCHARGED:</b> {{ power.overcharge }}</p>
              <small>{{ OVERCHARGE_RULE }}</small>
            </section>
            <section class="scs-traits" data-testid="slime-crew-traits">
              <h3>CREW SPECIALTIES</h3>
              <div v-for="trait in specialties[preview.id]" :key="trait.name">
                <b>{{ trait.name }}</b>
                <span>{{ trait.text }}</span>
              </div>
            </section>
            <dl>
              <dt>WINS BY</dt>
              <dd>{{ identities[preview.id].pattern }}</dd>
              <dt>BEAT IT</dt>
              <dd>{{ identities[preview.id].counters }}</dd>
            </dl>
          </div>
        </article>
        <button
          type="button"
          class="scs-confirm"
          :disabled="preview.id === activeTeam"
          data-testid="slime-crew-confirm"
          @click="pick(preview.id)"
        >
          {{
            preview.id === activeTeam
              ? 'CURRENT CREW'
              : 'PLAY AS ' + preview.name + ' ›'
          }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useSlimeCityStore } from '~/stores/slimeCity'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { factionPower, OVERCHARGE_RULE } from '~/utils/slimeCity/factionPowers'
import type { TeamId } from '~/utils/slimeCity/prototypes'

const props = withDefaults(
  defineProps<{
    label?: string
    compact?: boolean
    align?: 'left' | 'right'
    teamId?: TeamId | null
    excludeTeam?: TeamId
  }>(),
  { label: 'Crew', compact: false, align: 'left' },
)
const emit = defineEmits<{ picked: [team: TeamId] }>()
const lab = useSlimeCityStore()
const open = ref(false)
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLDialogElement | null>(null)
/** The crew the dossier describes: the active crew until another is tapped. */
const previewId = ref<TeamId | null>(null)
const activeTeam = computed(() =>
  props.teamId === undefined ? lab.activeTeam : props.teamId,
)
const availableTeams = computed(() =>
  lab.teams.filter((team) => team.id !== props.excludeTeam),
)
const currentTeam = computed(() =>
  availableTeams.value.find((team) => team.id === activeTeam.value),
)
const preview = computed(
  () =>
    availableTeams.value.find((team) => team.id === previewId.value) ??
    currentTeam.value ??
    availableTeams.value[0] ??
    lab.team,
)
const power = computed(() => factionPower(preview.value.id))
const specialties: Record<TeamId, { name: string; text: string }[]> = {
  catgirls: [
    {
      name: 'Ambush',
      text: 'Strike immediately, with +1 power on the first blow.',
    },
    {
      name: 'Regeneration',
      text: 'Recover extra life at the end of the round.',
    },
  ],
  bloodfairies: [
    { name: 'Swarm', text: 'Fight harder beside another friendly fighter.' },
    { name: 'Leech', text: 'Recover life when dealing damage in combat.' },
  ],
  ironjaw: [
    { name: 'Armor', text: 'Absorb incoming damage before losing life.' },
    {
      name: 'Bulldoze',
      text: 'Excess damage on a defeated fighter hits the boss.',
    },
  ],
  riot: [
    {
      name: 'Volatile',
      text: 'On defeat, damage the opposite fighter or boss.',
    },
    { name: 'Blast', text: 'Damage multiple enemies with explosive specials.' },
  ],
  undertow: [
    { name: 'Snare', text: 'Stun enemies so they cannot strike.' },
    { name: 'Pierce', text: 'Bypass some of the enemy’s armor.' },
  ],
  exchange: [
    { name: 'Collect', text: 'Gain power when defeating a rival fighter.' },
    {
      name: 'Life drain',
      text: 'Steal life from the enemy boss to sustain your own.',
    },
  ],
}

const identities: Record<TeamId, { pattern: string; counters: string }> = {
  catgirls: {
    pattern:
      'Strike immediately with Ambush, then keep your fighters alive with Regeneration and Nine Lives.',
    counters:
      'Finish wounded fighters before the round ends; stun can delay their attacks until Nine Lives clears it.',
  },
  bloodfairies: {
    pattern:
      'Pack adjacent alleys, hit harder together, and heal through combat. Mosh Pit rewards a full lineup.',
    counters: 'Break up adjacent allies and use armor to absorb smaller hits.',
  },
  ironjaw: {
    pattern:
      'Absorb damage behind armor, then turn excess damage into boss damage with Bulldoze.',
    counters:
      'Use Pierce and stuns rather than trading blows with a heavily armored wall.',
  },
  riot: {
    pattern:
      'Use volatile fighters and explosive specials to deal damage even when your own fighters fall.',
    counters:
      'Use armor and healing to survive blasts; fuse-cutting snares can remove Volatile.',
  },
  undertow: {
    pattern:
      'Stun dangerous opponents, bypass armor, and eliminate a key fighter with Sewer Snipe.',
    counters:
      'Field several threats instead of relying on one heavily armored fighter.',
  },
  exchange: {
    pattern:
      'Grow your collectors by defeating rival fighters and drain the rival boss to sustain your own.',
    counters:
      'Deny easy finishing blows and pressure their boss before the collectors grow stronger.',
  },
}

async function toggle(): Promise<void> {
  if (open.value) {
    close()
    return
  }
  previewId.value = activeTeam.value
  open.value = true
  await nextTick()
  menu.value?.showModal()
}

function close(): void {
  menu.value?.close()
  open.value = false
  trigger.value?.focus()
}

function tap(team: TeamId): void {
  if (previewId.value === team) pick(team)
  else previewId.value = team
}
function pick(team: TeamId): void {
  close()
  if (team === activeTeam.value) return
  if (props.teamId === undefined) lab.chooseTeam(team)
  emit('picked', team)
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
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(56rem, calc(100% - 1rem));
  max-width: none;
  max-height: calc(100% - 1rem);
  padding: 0;
  overflow: hidden;
  border: 3px solid #b9f151;
  border-radius: 0.75rem;
  background: #101c22;
  color: #eef6ef;
  box-shadow:
    8px 8px 0 #000,
    0 24px 80px #000c;
}
.scs-menu::backdrop {
  background: #03080ce0;
}
.scs-spread {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: calc(100dvh - 1rem - 6px);
  padding: 0.65rem;
}
.scs-heading {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: clamp(0.8rem, 2vw, 1.25rem);
  font-weight: 950;
  letter-spacing: 0.07em;
}
.scs-heading button {
  padding: 0.3rem 0.65rem;
  border: 1px solid #b9f15188;
  border-radius: 0.4rem;
  cursor: pointer;
}
.scs-roster {
  flex: none;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.35rem;
}
.scs-crew {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.25rem;
  border: 2px solid #52626a;
  background: #091217;
  color: #eef6ef;
  cursor: pointer;
  font: inherit;
}
.scs-crew :deep(.slime-art) {
  width: 100%;
  height: clamp(2rem, 8vh, 4.75rem);
}
.scs-crew span {
  font-size: clamp(0.6rem, 1.2vw, 0.8rem);
  font-weight: 850;
  line-height: 1.15;
  overflow-wrap: anywhere;
}
.scs-crew[aria-pressed='true'] {
  border-color: #b9f151;
  box-shadow: inset 0 0 0 1px #b9f151;
}
.scs-crew:hover,
.scs-crew:focus-visible {
  border-color: #b9f151;
}
.scs-dossier {
  --ink: #b9f151;
  flex: 1 1 auto;
  min-height: 0;
  max-height: min(55vh, 32rem);
  overflow-y: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 0.55rem;
  min-width: 0;
  color: #eef6ef;
  line-height: 1.35;
}
.scs-dossier.tone-red {
  --ink: #ff777b;
}
.scs-dossier.tone-blue {
  --ink: #82d8ff;
}
.scs-dossier.tone-purple {
  --ink: #e0a5ff;
}
.scs-dossier.tone-green {
  --ink: #b9f151;
}
.scs-dossier.tone-gold {
  --ink: #ffd176;
}
.scs-cover {
  position: relative;
  min-width: 0;
  min-height: 15rem;
  overflow: hidden;
  border: 3px solid var(--ink);
  box-shadow: 3px 3px 0 #000;
}
.scs-cover :deep(.slime-art) {
  position: absolute;
  inset: 0;
}
.scs-cover-title {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 2rem 0.65rem 0.65rem;
  background: linear-gradient(transparent, #000e 45%);
}
.scs-turf,
.scs-kicker {
  color: var(--ink);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.scs-dossier strong {
  color: white;
  font-size: clamp(1.35rem, 3.6vw, 2.5rem);
  font-weight: 950;
  font-style: italic;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 2px 2px #000;
}
.scs-dossier em {
  color: var(--ink);
  font-weight: 800;
}
.scs-copy {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 0.25rem;
  font-size: 0.9rem;
}
.scs-copy p,
.scs-copy dl,
.scs-copy dd {
  margin: 0;
}
.scs-power,
.scs-traits,
.scs-copy dl {
  padding: 0.6rem;
  border: 2px solid var(--ink);
  background: #17252b;
  box-shadow: 3px 3px 0 #000;
}
.scs-power h3,
.scs-traits h3 {
  margin: 0.2rem 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 950;
  font-style: italic;
}
.scs-power p + p {
  margin-top: 0.35rem;
}
.scs-power small {
  display: block;
  margin-top: 0.35rem;
  color: #c0d1d0;
}
.scs-traits div {
  display: grid;
  gap: 0.1rem;
  margin-top: 0.3rem;
}
.scs-traits b,
.scs-copy dt {
  color: var(--ink);
  font-weight: 900;
}
.scs-copy dt:not(:first-child) {
  margin-top: 0.4rem;
}
.scs-confirm {
  flex: none;
  padding: 0.65rem;
  border: 2px solid #b9f151;
  border-radius: 0.35rem;
  background: #b9f151;
  color: #071115;
  cursor: pointer;
  font: inherit;
  font-weight: 950;
  letter-spacing: 0.06em;
}
.scs-confirm:disabled {
  background: transparent;
  color: #a6c7bc;
  cursor: default;
}
@media (max-width: 600px) {
  .scs-roster {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .scs-dossier {
    grid-template-columns: minmax(0, 1fr);
  }
  .scs-cover {
    min-height: 10rem;
    height: 25vh;
  }
  .scs-copy {
    overflow: visible;
  }
}
</style>
