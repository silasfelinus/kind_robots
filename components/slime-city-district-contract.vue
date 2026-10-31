<template>
  <article
    v-if="
      lab.here && !lab.streetEvent && lab.city.cleared.includes(lab.districtId)
    "
    class="district-contract"
    data-testid="slime-district-contract"
  >
    <div
      class="contract-poster"
      :class="'contract-' + lab.districtId"
      aria-hidden="true"
    >
      <span>AFTER HOURS</span>
      <strong>{{ lab.contractPlan.title }}</strong>
      <small>BLACKOUT / {{ lab.contractPlan.opponent }}</small>
    </div>
    <div class="contract-info">
      <p class="contract-kicker">
        DISTRICT ENCORE · {{ lab.city.contracts.length }}/7 COMPLETED
      </p>
      <p>{{ lab.contractPlan.briefing }}</p>
      <div class="contract-actions">
        <span>+{{ lab.contractPlan.standing }} STANDING ON VICTORY</span>
        <strong v-if="lab.city.contracts.includes(lab.districtId)"
          >CLEARED ✓</strong
        >
        <button
          v-else
          type="button"
          data-testid="slime-fight-contract"
          :disabled="!!lab.contractGate"
          @click="lab.fightContract()"
        >
          TAKE CONTRACT →
        </button>
      </div>
      <small
        >Replayable if lost. This local story fight awards no account XP, Meat,
        or card packs.</small
      >
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  useSlimeCityStore;
} from '~/stores/slimeCity'

const lab = useSlimeCityStore()
</script>

<style scoped>
.district-contract {
  display: grid;
  grid-template-columns: minmax(7rem, 0.8fr) minmax(0, 1.5fr);
  gap: 0.75rem;
  margin-top: 0.65rem;
  border: 1px solid #b8ff7880;
  border-radius: 0.7rem;
  background: #0e1728;
  overflow: hidden;
}
.contract-poster {
  min-height: 9rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  background: radial-gradient(circle at 72% 20%, #78d2bf 0, #284b74 45%, #10172d 96%);
  border-right: 2px solid #b8ff7870;
  color: #f6ffeb;
  text-shadow: 0 2px 10px #000;
}
.contract-poster span,
.contract-kicker {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.13em;
}
.contract-poster strong {
  font-size: clamp(1rem, 3cqw, 1.75rem);
  line-height: 0.94;
}
.contract-poster small {
  font-size: 0.65rem;
}
.contract-chimera {
  background: radial-gradient(circle at 70% 20%, #e878b1, #4c225a 55%, #121529);
}
.contract-needles {
  background: radial-gradient(circle at 70% 20%, #fb6471, #7d254f 55%, #171125);
}
.contract-foundry {
  background: radial-gradient(circle at 70% 20%, #ffb451, #5c4524 55%, #101d21);
}
.contract-undertow {
  background: radial-gradient(circle at 70% 20%, #68d6b6, #135b63 55%, #101329);
}
.contract-crown {
  background: radial-gradient(circle at 70% 20%, #ffe18a, #796438 55%, #201b26);
}
.contract-redline {
  background: radial-gradient(circle at 70% 20%, #ff8264, #78253d 55%, #1c1731);
}
.contract-info {
  display: grid;
  gap: 0.5rem;
  align-content: center;
  min-width: 0;
  padding: 0.75rem 0.75rem 0.75rem 0;
}
.contract-info p {
  margin: 0;
  font-size: 0.73rem;
  line-height: 1.4;
  color: #eee6f4;
}
.contract-info .contract-kicker {
  color: #d1fa8b;
}
.contract-info small {
  font-size: 0.62rem;
  color: #aebdcc;
}
.contract-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.contract-actions span {
  font-size: 0.6rem;
  color: #c4ec91;
}
.contract-actions strong {
  color: #d1fa8b;
  font-size: 0.7rem;
}
.contract-actions button {
  padding: 0.5rem 0.65rem;
  color: #122221;
  background: #d1fa8b;
  border: 0;
  border-radius: 0.3rem;
  font-weight: 900;
  font-size: 0.7rem;
}
.contract-actions button:disabled {
  opacity: 0.5;
}
@media (max-width: 660px) {
  .district-contract {
    grid-template-columns: 1fr;
  }
  .contract-info {
    padding: 0 0.75rem 0.75rem;
  }
  .contract-poster {
    min-height: 6rem;
  }
}
</style>
