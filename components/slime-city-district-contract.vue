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
      <small
        >{{ lab.storyBoutLabel('blackout') }} /
        {{ lab.contractPlan.opponent }}</small
      >
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
      <p
        v-if="lab.campaignLegacy"
        class="contract-legacy"
        data-testid="slime-contract-legacy"
      >
        CREW LEGACY · {{ lab.campaignLegacy.echo.title }} ·
        {{ describeTerms(lab.campaignLegacy.echo.terms) }}
      </p>
      <small
        >Replayable if lost. This local story fight awards no account XP, Meat,
        or card packs.</small
      >
    </div>
  </article>
</template>

<script setup lang="ts">
import { useSlimeCityStore } from '~/stores/slimeCity'
import { describeTerms } from '~/utils/slimeCity/campaign'

const lab = useSlimeCityStore()
</script>

<style scoped>
.contract-legacy {
  margin: 0;
  color: #f3e2a2;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}
.district-contract {
  display: grid;
  grid-template-columns: minmax(9rem, 0.8fr) minmax(0, 1.5fr);
  gap: 1rem;
  border: 1px solid #b8ff7880;
  border-radius: 0.9rem;
  background: #0b1424e6;
  box-shadow: 0 18px 48px #000a;
  backdrop-filter: blur(6px);
  overflow: hidden;
  container-type: inline-size;
}
.contract-poster {
  min-height: 14rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.4rem;
  background: radial-gradient(
    circle at 72% 20%,
    #78d2bf 0,
    #284b74 45%,
    #10172d 96%
  );
  border-right: 2px solid #b8ff7870;
  color: #f6ffeb;
  text-shadow: 0 2px 10px #000;
}
.contract-poster span,
.contract-kicker {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}
.contract-poster strong {
  font-size: clamp(1.5rem, 5cqw, 2.8rem);
  font-style: italic;
  font-weight: 1000;
  line-height: 0.94;
  text-transform: uppercase;
}
.contract-poster small {
  font-size: 0.75rem;
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
  gap: 0.75rem;
  align-content: center;
  min-width: 0;
  padding: 1rem 1rem 1rem 0;
}
.contract-info p {
  margin: 0;
  font-size: clamp(0.95rem, 2cqw, 1.15rem);
  line-height: 1.5;
  color: #eee6f4;
}
.contract-info .contract-kicker {
  color: #d1fa8b;
  font-size: 0.7rem;
}
.contract-info small {
  font-size: 0.72rem;
  color: #aebdcc;
}
.contract-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.contract-actions span {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #c4ec91;
}
.contract-actions strong {
  color: #d1fa8b;
  font-size: 0.9rem;
}
.contract-actions button {
  min-height: 3.25rem;
  padding: 0.8rem 1.5rem;
  color: #122221;
  background: #d1fa8b;
  border: 0;
  border-radius: 0.6rem;
  font-weight: 1000;
  font-size: clamp(0.85rem, 2cqw, 1.05rem);
  letter-spacing: 0.1em;
  box-shadow: 0 0 28px #c5ff5955;
}
.contract-actions button:disabled {
  opacity: 0.5;
}
@container (max-width: 560px) {
  .district-contract {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  .contract-info {
    padding: 0 0.9rem 0.9rem;
  }
  .contract-poster {
    min-height: 7rem;
  }
  .contract-actions button {
    flex: 1 1 auto;
  }
}
</style>
