<template>
  <div
    v-if="lab.campaignFavors.length"
    class="campaign-favors"
    role="group"
    aria-label="Choose earned story support"
    data-testid="slime-campaign-favors"
  >
    <span class="favors-overline">{{ heading }}</span>
    <div class="campaign-favor-row">
      <button
        v-for="favor in lab.campaignFavors"
        :key="favor.chapterIndex"
        type="button"
        class="campaign-favor"
        :class="{
          active: favor.chapterIndex === lab.campaignFavorIndex,
        }"
        :aria-pressed="favor.chapterIndex === lab.campaignFavorIndex"
        :title="
          'Chapter ' +
          (favor.chapterIndex + 1) +
          ' · ' +
          favor.choice +
          ' · ' +
          describeTerms(favor.echo.terms)
        "
        :data-testid="'slime-favor-' + favor.chapterIndex"
        @click="lab.selectCampaignFavor(favor.chapterIndex)"
      >
        <SlimeCityArtwork
          class="campaign-favor-art"
          :image-id="slimeArtId('crews', favor.ally)"
          :alt="teamName(favor.ally) + ' earned ally portrait'"
          :fallback="teamName(favor.ally)"
          compact
        />
        <strong>{{ favor.echo.title }}</strong>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// The earned-favor picker (t-009): story fights in a campaign, and a finished
// campaign's crew legacy for district rivals and contracts.
import { describeTerms } from '~/utils/slimeCity/campaign'
import { slimeArtId } from '~/utils/slimeCity/artManifest'
import { useSlimeCityStore } from '~/stores/slimeCity'
import type { TeamId } from '~/utils/slimeCity/prototypes'

defineProps<{ heading: string }>()

const lab = useSlimeCityStore()
function teamName(id: TeamId): string {
  return lab.teams.find((team) => team.id === id)?.name ?? id
}
</script>

<style scoped>
.favors-overline {
  display: block;
  color: var(--campaign-accent, #f3e2a2);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.campaign-favors {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}
.campaign-favor-row {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  scrollbar-width: thin;
}
.campaign-favor {
  display: flex;
  align-items: center;
  flex: none;
  gap: 0.5rem;
  max-width: 14rem;
  min-height: 3.25rem;
  padding: 0.3rem 0.7rem 0.3rem 0.3rem;
  border: 2px solid #5a7077;
  border-radius: 0.6rem;
  background: #192633d9;
  color: #f4f4ec;
  text-align: left;
}
.campaign-favor.active {
  border-color: #f3e2a2;
  background: #354038e6;
  box-shadow: 0 0 16px #f3e2a255;
}
.campaign-favor:focus-visible {
  outline: 3px solid #f5efbf;
  outline-offset: 2px;
}
.campaign-favor .campaign-favor-art {
  flex: 0 0 2.4rem;
  width: 2.4rem;
  height: 2.8rem;
  border-radius: 0.35rem;
}
.campaign-favor strong {
  overflow: hidden;
  font-size: 0.78rem;
  line-height: 1.2;
}
</style>
