<template>
  <Teleport to="body">
    <article
      class="shifting-desks-print-dossier"
      aria-label="Printable Shifting Desks personnel dossier"
    >
      <header class="sd-print-heading">
        <div>
          <p class="sd-print-overline">Consolidated Wellness &amp; Defense · Personnel Division</p>
          <h1>Permanent Personnel Dossier</h1>
          <p class="sd-print-verdict">{{ ending?.title ?? 'Position Closed' }}</p>
        </div>
        <div class="sd-print-stamp">FILED</div>
      </header>

      <div class="sd-print-file-number">
        <strong>Record ID:</strong> {{ receipt.id }}
        <span><strong>Filed:</strong> {{ filedDate }}</span>
      </div>

      <section class="sd-print-hero" aria-label="Ending artwork and epilogue">
        <shifting-desks-art
          v-if="ending"
          class="sd-print-art"
          frame="h-full w-full"
          :src="stationArt('endings', ending.id)"
          :prompt="ending.epilogue.art_prompt"
          :alt="`Ending illustration: ${ending.title}`"
          fallback-icon="kind-icon:document"
          :show-brief="false"
        />
        <div class="sd-print-epilogue">
          <h2>{{ ending?.epilogue.title ?? 'End of employment' }}</h2>
          <p>{{ ending?.epilogue.text ?? 'The archive has no epilogue for this filing.' }}</p>
          <p v-for="(line, index) in personalEndingLines" :key="index" class="sd-print-italic">
            {{ line }}
          </p>
        </div>
      </section>

      <section class="sd-print-section" aria-label="Verified run receipt">
        <h2>Verified Run Receipt</h2>
        <dl class="sd-print-facts">
          <div><dt>Position</dt><dd>{{ receipt.jobTitle }}</dd></div>
          <div><dt>Secret society</dt><dd>{{ receipt.society }}</dd></div>
          <div><dt>Mutation</dt><dd>{{ receipt.mutation }}</dd></div>
          <div><dt>Departments cleared</dt><dd>{{ receipt.floors }}</dd></div>
          <div><dt>Files handled</dt><dd>{{ receipt.files }}</dd></div>
          <div><dt>Employees used</dt><dd>{{ receipt.employees }}</dd></div>
          <div><dt>Forms remaining</dt><dd>{{ receipt.forms }}</dd></div>
          <div><dt>Successors remaining</dt><dd>{{ receipt.successors }}</dd></div>
        </dl>
      </section>

      <section class="sd-print-section" aria-label="Psychological test report">
        <h2>Test Results · {{ resultsVerdict.title }}</h2>
        <p class="sd-print-small">{{ resultsVerdict.summary }}</p>
        <dl class="sd-print-grades">
          <div v-for="grade in grades" :key="grade.key">
            <dt>{{ grade.label }}</dt>
            <dd>{{ grade.score }} · {{ grade.level }}</dd>
          </div>
        </dl>
      </section>

      <section class="sd-print-section" aria-label="Personnel distinctions">
        <h2>Distinctions on Record</h2>
        <p class="sd-print-small">
          These are verified local archive milestones, not claims of additional account-level rewards.
        </p>
        <div v-if="awards.length" class="sd-print-awards">
          <div v-for="award in awards" :key="award.id" class="sd-print-award">
            <icon :name="award.icon" class="sd-print-award-icon" />
            <div>
              <strong>{{ award.title }}</strong>
              <small>Earned {{ award.date }}</small>
            </div>
          </div>
        </div>
        <p v-else class="sd-print-small">No award dates are on this file.</p>
      </section>

      <section v-if="matchingRun" class="sd-print-section" aria-label="Detailed personnel incidents">
        <h2>Department Record</h2>
        <div class="sd-print-departments">
          <div v-for="department in departmentRecord" :key="department.id">
            <strong>{{ department.title }}</strong>
            <p>{{ department.outcome ?? 'Not recorded' }}</p>
          </div>
        </div>
        <h2 v-if="matchingRun.terminations.length">Termination Notices</h2>
        <ul v-if="matchingRun.terminations.length">
          <li v-for="(notice, index) in matchingRun.terminations" :key="index">
            <strong>{{ notice.employee }}:</strong> {{ notice.cause }}
          </li>
        </ul>
        <h2 v-if="incidents.length">Key Incidents</h2>
        <ul v-if="incidents.length">
          <li v-for="(incident, index) in incidents" :key="index">{{ incident }}</li>
        </ul>
      </section>
      <p v-else class="sd-print-small">
        This historical receipt preserves counts and results. Detailed department decisions
        and termination notes were not retained in the archive.
      </p>

      <footer>
        This document is a keepsake of a completed Shifting Desks run.
        Official account achievements, where available, remain in Kind Robots.
      </footer>
    </article>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useShiftingDesksStore } from '~/stores/shiftingDesksStore'
import {
  DEPARTMENTS,
  ENDINGS,
  endingLines,
  finalVerdict,
  outcomeById,
  rankedGrades,
  stationArt,
  type RunState,
} from '~/utils/shiftingDesks/rules'
import { MILESTONES, type RunReceipt } from '~/utils/shiftingDesks/rewards'

const props = defineProps<{ receipt: RunReceipt; run?: RunState | null }>()
const store = useShiftingDesksStore()
const ending = computed(() => ENDINGS.find((entry) => entry.id === props.receipt.endingId))
const matchingRun = computed(() => {
  const run = props.run
  return run && run.seed + ':' + props.receipt.endingId === props.receipt.id ? run : null
})
const filedDate = computed(() => new Date(props.receipt.completedAt).toLocaleString())
const personalEndingLines = computed(() =>
  matchingRun.value && ending.value ? endingLines(matchingRun.value, ending.value) : [],
)
const grades = computed(() => rankedGrades(props.receipt.grades))
const resultsVerdict = computed(() => finalVerdict(props.receipt.grades))
const awards = computed(() =>
  MILESTONES.filter((m) => !!store.rewardArchive.milestones[m.id]).map((m) => ({
    ...m,
    date: new Date(store.rewardArchive.milestones[m.id]!).toLocaleDateString(),
  })),
)
const departmentRecord = computed(() =>
  DEPARTMENTS.map((entry) => ({
    id: entry.department.id,
    title: entry.department.title,
    outcome: outcomeById(matchingRun.value?.departmentOutcomes[entry.department.id] ?? null)?.title,
  })),
)
const incidents = computed(() =>
  matchingRun.value?.log
    .filter((entry) => entry.special === 'incident')
    .slice(-5)
    .map((entry) => entry.text) ?? [],
)
</script>

<style>
.shifting-desks-print-dossier {
  display: none;
}

@media print {
  @page {
    margin: 13mm;
    size: auto;
  }

  body:has(> .shifting-desks-print-dossier) > :not(.shifting-desks-print-dossier) {
    display: none !important;
  }

  body:has(> .shifting-desks-print-dossier),
  html:has(.shifting-desks-print-dossier) {
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  .shifting-desks-print-dossier {
    display: block !important;
    position: static !important;
    width: 100%;
    overflow: visible !important;
    color: #201c19;
    background: white;
    font: 10pt/1.4 Georgia, serif;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .shifting-desks-print-dossier h1,
  .shifting-desks-print-dossier h2,
  .shifting-desks-print-dossier dt,
  .sd-print-overline,
  .sd-print-stamp,
  .sd-print-file-number {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .shifting-desks-print-dossier h1 {
    font-size: 22pt;
    margin: 0.15em 0;
    line-height: 1.1;
  }

  .shifting-desks-print-dossier h2 {
    font-size: 12pt;
    margin: 0 0 0.4em;
    text-transform: uppercase;
  }

  .shifting-desks-print-dossier p {
    margin: 0.3em 0;
  }

  .sd-print-heading,
  .sd-print-file-number,
  .sd-print-hero,
  .sd-print-awards,
  .sd-print-facts,
  .sd-print-grades,
  .sd-print-departments {
    display: grid;
    gap: 8pt;
  }

  .sd-print-heading {
    grid-template-columns: 1fr auto;
    align-items: center;
    border-bottom: 3pt double #4b2526;
    padding-bottom: 7pt;
  }

  .sd-print-overline,
  .sd-print-file-number,
  .sd-print-small,
  .shifting-desks-print-dossier footer {
    font-size: 8pt;
  }

  .sd-print-verdict {
    font-weight: bold;
  }

  .sd-print-stamp {
    border: 3pt double #773737;
    padding: 5pt;
    font-size: 14pt;
    color: #773737;
    transform: rotate(-8deg);
  }

  .sd-print-file-number {
    grid-template-columns: 1fr auto;
    border-bottom: 1pt solid #666;
    padding: 6pt 0;
    overflow-wrap: anywhere;
  }

  .sd-print-hero {
    grid-template-columns: minmax(90pt, 30%) 1fr;
    margin-top: 9pt;
    align-items: start;
    break-inside: avoid;
  }

  .sd-print-art {
    width: 100%;
    max-height: 185pt;
    overflow: hidden;
    border: 1pt solid #4b2526;
  }

  .sd-print-epilogue {
    min-width: 0;
  }

  .sd-print-italic {
    font-style: italic;
  }

  .sd-print-section {
    margin-top: 10pt;
    padding-top: 6pt;
    border-top: 1pt solid #999;
    break-inside: auto;
  }

  .sd-print-section h2,
  .sd-print-section .sd-print-award,
  .sd-print-departments > div,
  .sd-print-facts > div {
    break-inside: avoid;
  }

  .sd-print-facts {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .sd-print-facts dt,
  .sd-print-grades dt {
    font-size: 7pt;
    text-transform: uppercase;
    color: #555;
  }

  .sd-print-facts dd,
  .sd-print-grades dd {
    margin: 0;
    font-weight: bold;
    overflow-wrap: anywhere;
  }

  .sd-print-grades,
  .sd-print-departments {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sd-print-awards {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 7pt;
  }

  .sd-print-award {
    display: flex;
    align-items: center;
    gap: 5pt;
    border: 1pt solid #888;
    padding: 4pt;
    font-size: 8pt;
    break-inside: avoid;
  }

  .sd-print-award small {
    display: block;
    font-size: 7pt;
    color: #555;
  }

  .sd-print-award-icon {
    width: 17pt;
    height: 17pt;
    flex-shrink: 0;
  }

  .shifting-desks-print-dossier ul {
    margin: 3pt 0;
    padding-left: 18pt;
  }

  .shifting-desks-print-dossier li {
    margin-bottom: 3pt;
    break-inside: avoid;
  }

  .shifting-desks-print-dossier footer {
    border-top: 1pt solid #999;
    margin-top: 12pt;
    padding-top: 6pt;
    font-style: italic;
  }
}
</style>
