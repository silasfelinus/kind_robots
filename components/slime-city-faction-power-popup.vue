<template>
  <dialog
    ref="dialog"
    class="sc-power-popup"
    aria-label="Faction powers"
    data-testid="slime-faction-power-popup"
    @close="emit('close')"
    @click.self="emit('close')"
  >
    <div class="sc-power-content kr-scroll">
      <header>
        <h2>{{ own ? 'Your faction powers' : 'Rival faction powers' }}</h2>
        <button type="button" autofocus @click="emit('close')">CLOSE</button>
      </header>
      <article v-for="team in teams" :key="team">
        <SlimeCityArtwork
          :image-id="slimeArtId('crews', team)"
          :alt="crew(team).name"
          compact
        />
        <div>
          <h3>{{ crew(team).name }}</h3>
          <p>{{ crew(team).hook }}</p>
          <b>{{ factionPower(team).symbol }} {{ factionPower(team).name }}</b>
          <p>{{ factionPower(team).text }}</p>
          <p>
            <strong>{{ charged ? 'OVERCHARGED NOW' : 'OVERCHARGE' }}:</strong>
            {{ factionPower(team).overcharge }}
          </p>
          <small>{{ OVERCHARGE_RULE }} One use per match; no card play spent.</small>
          <p role="status">{{ status(team) }}</p>
          <button
            v-if="own"
            type="button"
            :disabled="!ready(team)"
            :data-testid="'slime-activate-power-' + team"
            @click="emit('activate', team)"
          >
            ACTIVATE
          </button>
        </div>
      </article>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  clashOvercharged,
  clashPowers,
  clashPowerSpent,
  type ClashState,
} from '~/utils/slimeCity/clash'
import { factionPower, OVERCHARGE_RULE } from '~/utils/slimeCity/factionPowers'
import { TEAMS, type Side, type TeamId } from '~/utils/slimeCity/prototypes'
import { slimeArtId } from '~/utils/slimeCity/artManifest'

const props = defineProps<{
  game: ClashState
  side: Side
  own: boolean
  ready: (team: TeamId) => boolean
}>()
const emit = defineEmits<{ close: []; activate: [team: TeamId] }>()
const dialog = ref<HTMLDialogElement | null>(null)
onMounted(() => dialog.value?.showModal())
const teams = computed(() => clashPowers(props.game, props.side))
const charged = computed(() => clashOvercharged(props.game, props.side))
function crew(team: TeamId) {
  return TEAMS.find((entry) => entry.id === team)!
}
function status(team: TeamId): string {
  if (clashPowerSpent(props.game, props.side, team)) return 'Already used.'
  if (props.game.victor) return 'Match finished.'
  if (!props.own) return 'Rival power: inspect only.'
  if (props.game.active !== props.side) return 'Available on your turn.'
  if (props.game.phase !== 'play') return 'Available before you start fighting.'
  if (props.ready(team)) return 'Ready to activate.'
  const target = factionPower(team).target
  if (target !== 'none') {
    const targetSide =
      target === 'own'
        ? props.side
        : props.side === 'player'
          ? 'enemy'
          : 'player'
    if (!props.game.units.some((unit) => unit.side === targetSide))
      return target === 'own'
        ? 'Requires one of your fighters.'
        : 'Requires a rival fighter to target.'
  }
  return 'Wait for the current action to finish.'
}
</script>

<style scoped>
.sc-power-popup {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(36rem, 94vw);
  max-height: 85dvh;
  padding: 0;
  border: 1px solid #c5ff59;
  border-radius: 0.8rem;
  background: #112933;
  color: #f4fff0;
}
.sc-power-popup::backdrop {
  background: #0009;
}
.sc-power-content {
  max-height: 82dvh;
  overflow-y: auto;
  padding: 1rem;
}
.sc-power-content header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}
.sc-power-content h2,
.sc-power-content h3 {
  font-weight: 800;
}
.sc-power-content article {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: 0.8rem;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #586e68;
}
.sc-power-content article > div {
  display: grid;
  gap: 0.35rem;
}
.sc-power-content button {
  padding: 0.45rem 0.7rem;
  border-radius: 0.4rem;
  background: #c5ff59;
  color: #12200c;
  font-weight: 850;
}
.sc-power-content button:disabled {
  background: #52665e;
  color: #e1eee6;
}
</style>
