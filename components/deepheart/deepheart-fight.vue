<template>
  <div v-if="run && combat" class="dh-fight" data-testid="dh-fight">
    <ul class="dh-enemies" aria-label="Enemies">
      <li v-for="e in combat.enemies" :key="e.uid">
        <button
          type="button"
          class="dh-enemy"
          :class="{
            'is-target': target === e.uid,
            'is-dead': e.hp === 0,
            'is-boss': e.boss,
          }"
          :disabled="e.hp === 0"
          :aria-pressed="target === e.uid"
          :data-testid="`dh-enemy-${e.uid}`"
          @click="target = e.uid"
        >
          <span class="dh-enemy-glyph" aria-hidden="true">{{
            e.boss ? '♛' : '☠'
          }}</span>
          <span class="dh-enemy-name">{{ e.name }}</span>
          <span class="dh-enemy-hp">
            <span :style="{ width: `${Math.round((e.hp / e.max) * 100)}%` }" />
          </span>
          <span class="text-[0.65rem] tabular-nums opacity-80"
            >{{ e.hp }}/{{ e.max }}</span
          >
          <span class="flex flex-wrap justify-center gap-0.5">
            <span v-if="e.weak" class="badge badge-xs badge-info">Weak</span>
            <span v-if="e.exposed" class="badge badge-xs badge-warning"
              >Exposed</span
            >
            <span v-if="e.poison" class="badge badge-xs badge-success"
              >Poison</span
            >
          </span>
        </button>
      </li>
    </ul>

    <div class="flex flex-wrap justify-center gap-1 text-xs opacity-80">
      <span>Round {{ combat.round }}</span>
      <span v-if="combat.shield">· Shield Wall</span>
      <span v-if="combat.anthem">· Anthem</span>
      <span v-if="combat.turret">· Turret</span>
    </div>

    <div
      v-if="actor"
      class="dh-deck"
      role="group"
      :aria-label="`${who}'s turn`"
    >
      <p class="dh-turn">
        <strong>{{ who }}</strong>
        <span class="opacity-75"> · {{ role.label }}</span>
      </p>
      <div class="dh-actions">
        <button
          type="button"
          class="btn btn-primary btn-sm rounded-2xl"
          data-testid="dh-attack"
          @click="dh.act({ kind: 'attack', target: chosen })"
        >
          <Icon name="kind-icon:swords" class="size-4" /> Attack
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-2xl"
          :disabled="actor.cooldown > 0"
          :title="role.skill.text"
          data-testid="dh-skill"
          @click="dh.act({ kind: 'skill', target: chosen })"
        >
          <Icon name="kind-icon:magic" class="size-4" />
          {{ role.skill.name }}
          <span v-if="actor.cooldown" class="tabular-nums"
            >({{ actor.cooldown }})</span
          >
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl border border-base-content/20"
          @click="dh.act({ kind: 'defend' })"
        >
          <Icon name="kind-icon:shield" class="size-4" /> Defend
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl border border-base-content/20"
          :disabled="run.potions === 0 || !weakest"
          :title="weakest ? `Heal ${weakestName}` : ''"
          @click="weakest && dh.act({ kind: 'potion', target: weakest })"
        >
          <Icon name="kind-icon:health-potion" class="size-4" /> Potion ({{
            run.potions
          }})
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl border border-base-content/20"
          :disabled="combat.boss || combat.parleyTried"
          :title="
            combat.boss
              ? 'The layer guardian must be confronted'
              : 'Attempt a nonviolent d20 Wits check'
          "
          data-testid="dh-parley"
          @click="dh.attemptParley()"
        >
          <Icon name="kind-icon:handshake" class="size-4" />
          Parley (d20)
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          data-testid="dh-auto-turn"
          @click="dh.autoTurn()"
        >
          Auto turn
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-2xl"
          data-testid="dh-auto-fight"
          @click="dh.autoFight()"
        >
          Auto fight
        </button>
      </div>
      <p class="text-center text-xs opacity-70">{{ role.skill.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useDeepheartStore } from '~/stores/deepheartStore'
import * as engine from '~/utils/deepheart/engine'
import { ROLES } from '~/utils/deepheart/roster'
import { roleFor } from '~/utils/deepheart/party'

const dh = useDeepheartStore()
const run = computed(() => dh.run)
const combat = computed(() => run.value?.combat ?? null)
const actor = computed(() =>
  run.value ? engine.currentActor(run.value) : null,
)
const role = computed(
  () => ROLES[roleFor(actor.value?.id ?? 'idris', run.value?.hero)],
)
const who = computed(() =>
  run.value && actor.value ? engine.nameOf(run.value, actor.value.id) : '',
)
const target = ref('')

const chosen = computed(() => {
  const living = combat.value?.enemies.filter((e) => e.hp > 0) ?? []
  return living.find((e) => e.uid === target.value)?.uid ?? living[0]?.uid ?? ''
})

watch(chosen, (uid) => {
  if (uid !== target.value) target.value = uid
})

const weakest = computed(() => {
  const r = run.value
  if (!r) return ''
  const hurt = r.party
    .filter((m) => !m.down)
    .sort(
      (a, b) => a.hp / engine.maxHp(r, a.id) - b.hp / engine.maxHp(r, b.id),
    )[0]
  return hurt?.id ?? ''
})
const weakestName = computed(() =>
  run.value && weakest.value ? engine.nameOf(run.value, weakest.value) : '',
)
</script>

<style scoped>
.dh-fight {
  display: grid;
  gap: 0.6rem;
}
.dh-enemies {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}
.dh-enemy {
  display: grid;
  width: 8.5rem;
  justify-items: center;
  gap: 0.2rem;
  border-radius: var(--radius-box);
  border: 1px solid color-mix(in oklch, var(--color-error) 40%, transparent);
  background:
    radial-gradient(
      90% 70% at 50% 20%,
      color-mix(in oklch, var(--color-error) 22%, transparent),
      transparent
    ),
    var(--color-base-200);
  padding: 0.6rem 0.4rem;
}
.dh-enemy.is-boss {
  width: 12rem;
  border-color: var(--color-secondary);
}
.dh-enemy.is-target {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.dh-enemy.is-dead {
  opacity: 0.35;
}
.dh-enemy-glyph {
  font-size: 2rem;
  line-height: 1;
  color: var(--color-error);
}
.dh-enemy-name {
  font-weight: 700;
  font-size: 0.8rem;
  text-align: center;
}
.dh-enemy-hp {
  width: 100%;
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-content) 15%, transparent);
  overflow: clip;
}
.dh-enemy-hp > span {
  display: block;
  height: 100%;
  background: var(--color-error);
  transition: width 200ms ease;
}
.dh-deck {
  display: grid;
  gap: 0.4rem;
  border-radius: var(--radius-box);
  border: 1px solid color-mix(in oklch, var(--color-primary) 35%, transparent);
  background: color-mix(in oklch, var(--color-base-200) 90%, transparent);
  padding: 0.6rem;
}
.dh-turn {
  text-align: center;
}
.dh-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
}
</style>
