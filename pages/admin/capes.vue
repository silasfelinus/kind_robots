<template>
  <main
    class="capes-board kr-surface flex h-full min-h-0 flex-col overflow-hidden text-slate-100"
    data-layout="console-fixed"
    data-testid="capes-style-check"
  >
    <header
      class="capes-hero shrink-0 border-b border-amber-200/20 px-4 py-4 sm:px-7"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p
            class="text-[10px] font-black uppercase tracking-[.3em] text-amber-300"
          >
            Prom of Doom × Every Villain Tactics / Art bible
          </p>
          <h2
            class="mt-1 text-3xl font-black uppercase tracking-tight sm:text-4xl"
          >
            STYLE <span class="text-amber-300">CHECK</span>
          </h2>
          <p class="mt-1 text-xs text-slate-200 sm:text-sm">
            Eight scene types. Six checkpoint proposals. One shared cast and art
            bible for two superhero games, judged from actual renders.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-amber-200/50 bg-amber-200 px-4 py-2 text-xs font-black uppercase text-slate-950 disabled:opacity-50"
          :disabled="store.loading"
          @click="store.refresh()"
        >
          {{ store.loading ? 'Checking…' : 'Refresh ArtJobs ↻' }}
        </button>
      </div>
      <div
        class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-bold uppercase tracking-wide text-slate-200"
        aria-live="polite"
      >
        <span
          ><strong class="text-amber-300">{{ store.submitted }}</strong> /
          {{ totalCells }} accepted</span
        >
        <span
          ><strong class="text-emerald-300">{{ store.rendered }}</strong>
          rendered</span
        >
        <span
          ><strong class="text-sky-300">{{ store.pending }}</strong> queued or
          running</span
        >
        <span v-if="store.failed"
          ><strong class="text-rose-300">{{ store.failed }}</strong>
          failed</span
        >
        <span v-if="store.lastRefresh" class="text-slate-400"
          >Private previews · verified jobs only</span
        >
      </div>
    </header>

    <div
      v-if="!userStore.isAdmin"
      class="grid min-h-0 flex-1 place-items-center p-8"
    >
      <p>Administrator access required for private style-check images.</p>
    </div>
    <template v-else>
      <nav
        class="capes-section-nav shrink-0"
        aria-label="Capes art bible sections"
      >
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          :aria-pressed="view === section.key"
          :class="{ active: view === section.key }"
          :data-testid="'capes-section-' + section.key"
          @click="view = section.key"
        >
          <span>{{ section.number }}</span>
          {{ section.label }}
        </button>
      </nav>
      <section
        v-if="view === 'checkpoints'"
        class="shrink-0 border-b border-slate-500/30 bg-slate-950/80 px-4 py-3 sm:px-7"
      >
        <div class="flex items-center justify-between gap-3">
          <h2
            class="text-[11px] font-black uppercase tracking-[.18em] text-amber-200"
          >
            01 / Eight controlled benchmarks
          </h2>
          <span class="text-[11px] text-slate-400"
            >Same seed per subject · adapted model prompt grammar</span
          >
        </div>
        <div
          class="mt-2 flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Benchmark scene"
        >
          <button
            v-for="(subject, i) in CAPES_STYLE_SUBJECTS"
            :key="subject.key"
            type="button"
            role="tab"
            :aria-selected="store.selectedSubject === subject.key"
            :data-testid="'capes-subject-' + subject.key"
            class="min-w-[145px] shrink-0 rounded-lg border px-3 py-2 text-left transition-colors"
            :class="
              store.selectedSubject === subject.key
                ? 'border-amber-300 bg-amber-200/20 text-white'
                : 'border-slate-500/40 bg-slate-800/60 text-slate-300 hover:border-amber-200/60'
            "
            @click="store.selectSubject(subject.key)"
          >
            <span
              class="block text-[10px] font-black tracking-widest text-amber-300"
              >0{{ i + 1 }}</span
            >
            <strong class="block truncate text-sm">{{ subject.title }}</strong>
            <small class="block truncate text-[10px]">{{
              subject.subtitle
            }}</small>
          </button>
        </div>
      </section>

      <div
        v-if="view === 'checkpoints' && store.error"
        role="alert"
        class="border-b border-rose-300/50 bg-rose-950/80 px-5 py-2 text-sm text-rose-200"
      >
        {{ store.error }}
      </div>

      <section
        v-if="view === 'checkpoints'"
        class="capes-deck min-h-0 flex-1 overflow-x-auto overflow-y-auto px-4 py-4 sm:px-7"
        aria-label="Checkpoint comparison grid"
      >
        <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              class="text-[11px] font-black uppercase tracking-[.14em] text-slate-400"
            >
              {{ activeSubject.subtitle }}
            </p>
            <h2 class="text-xl font-black">{{ activeSubject.title }}</h2>
            <p class="text-xs text-slate-300">{{ activeSubject.purpose }}</p>
          </div>
          <p class="text-xs text-slate-400">
            Seed {{ activeSubject.seed }} · six independent engine render lanes
          </p>
        </div>

        <details
          class="mb-4 rounded-lg border border-amber-200/30 bg-slate-950/60 p-3"
          data-testid="capes-model-proposals"
        >
          <summary
            class="cursor-pointer text-xs font-black uppercase tracking-widest text-amber-200"
          >
            The six checkpoint proposals · model formulas and render settings
          </summary>
          <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="lane in CAPES_STYLE_LANES"
              :key="lane.key"
              class="rounded border border-slate-500/40 bg-slate-800 p-3"
            >
              <h3 class="font-black text-amber-100">{{ lane.title }}</h3>
              <p class="mt-1 text-xs text-slate-300">{{ lane.family }}</p>
              <p class="mt-1 break-all font-mono text-[10px] text-sky-200">
                {{ lane.model }}
              </p>
              <p class="mt-2 text-xs text-slate-200">{{ lane.tone }}</p>
              <p class="mt-1 text-[11px] text-amber-200">{{ lane.recipe }}</p>
            </article>
          </div>
          <p class="mt-3 text-xs text-slate-400">
            Same six controlled checkpoint settings for all eight concepts. Krea
            2, Arthemy, Nova Comic, Illustrij, DreamShaper Turbo and Unstable
            Diffusers; no generic Flux, Pony or furry-first lane.
          </p>
        </details>

        <div
          class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          <article
            v-for="lane in CAPES_STYLE_LANES"
            :key="lane.key"
            class="capes-card min-w-0 overflow-hidden rounded-xl border border-slate-500/50 bg-slate-900/90"
            :data-testid="'capes-lane-' + lane.key"
          >
            <header
              class="flex items-start justify-between gap-2 border-b border-slate-500/30 px-3 py-3"
            >
              <div class="min-w-0">
                <h3 class="truncate text-sm font-black text-amber-100">
                  {{ lane.title }}
                </h3>
                <p class="mt-0.5 text-[10px] text-slate-400">
                  {{ lane.family }}
                </p>
              </div>
              <span
                class="shrink-0 rounded bg-slate-700 px-2 py-1 text-[10px] font-bold uppercase"
                :class="statusClass(lane.key)"
              >
                {{ statusFor(lane.key) }}
              </span>
            </header>

            <div
              class="capes-image relative grid place-items-center overflow-hidden bg-slate-800"
              :style="{ aspectRatio: activeSubject.aspect }"
            >
              <img
                v-if="store.imageFor(activeSubject.key, lane.key)"
                :src="store.imageFor(activeSubject.key, lane.key)"
                :alt="activeSubject.title + ' rendered by ' + lane.title"
                class="h-full w-full object-contain"
              />
              <div
                v-else
                class="flex flex-col items-center gap-2 px-5 text-center"
              >
                <span class="text-4xl text-amber-300/50">✧</span>
                <strong
                  class="text-[11px] font-black uppercase tracking-widest text-slate-300"
                >
                  {{
                    statusFor(lane.key) === 'Not submitted'
                      ? 'Awaiting ArtJob'
                      : statusFor(lane.key) === 'Done'
                        ? 'Loading private image'
                        : 'Awaiting render'
                  }}
                </strong>
                <small class="text-[10px] text-slate-400">{{
                  lane.tone
                }}</small>
              </div>
            </div>

            <div class="space-y-2 p-3">
              <div
                class="flex items-center justify-between gap-2 text-[11px] text-slate-300"
              >
                <span>{{ lane.model }}</span>
                <span
                  v-if="store.jobFor(activeSubject.key, lane.key)"
                  class="font-mono"
                >
                  #{{ store.jobFor(activeSubject.key, lane.key)?.jobId }}
                </span>
              </div>
              <p
                v-if="store.jobFor(activeSubject.key, lane.key)?.error"
                class="text-xs text-rose-300"
              >
                {{ store.jobFor(activeSubject.key, lane.key)?.error }}
              </p>
              <details class="border-t border-slate-600/50 pt-2">
                <summary
                  class="cursor-pointer text-xs font-bold text-amber-200"
                >
                  Score & inspect
                </summary>
                <div class="mt-2 space-y-2">
                  <label
                    v-for="criterion in CAPES_STYLE_CRITERIA"
                    :key="criterion.key"
                    class="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span>{{ criterion.label }}</span>
                    <select
                      :aria-label="lane.title + ': ' + criterion.label"
                      class="max-w-[80px] rounded border border-slate-500 bg-slate-800 px-1 py-1 text-white"
                      :value="
                        store.scoreFor(
                          activeSubject.key,
                          lane.key,
                          criterion.key,
                        )
                      "
                      @change="
                        store.setScore(
                          activeSubject.key,
                          lane.key,
                          criterion.key,
                          Number(($event.target as HTMLSelectElement).value),
                        )
                      "
                    >
                      <option :value="0">—</option>
                      <option
                        v-for="score in [1, 2, 3, 4, 5]"
                        :key="score"
                        :value="score"
                      >
                        {{ score }}/5
                      </option>
                    </select>
                  </label>
                  <label class="block text-[11px]">
                    Art direction notes
                    <textarea
                      :value="store.noteFor(activeSubject.key, lane.key)"
                      rows="2"
                      maxlength="500"
                      placeholder="What reads well? What fails?"
                      class="mt-1 w-full rounded border border-slate-500 bg-slate-800 p-2 text-xs text-white"
                      @input="
                        store.setNote(
                          activeSubject.key,
                          lane.key,
                          ($event.target as HTMLTextAreaElement).value,
                        )
                      "
                    />
                  </label>
                  <p class="text-[10px] text-slate-400">
                    Notes and scores are saved on this device, not promoted to
                    the house style.
                  </p>
                  <details
                    v-if="store.jobFor(activeSubject.key, lane.key)?.prompt"
                  >
                    <summary
                      class="cursor-pointer text-[11px] font-bold text-sky-200"
                    >
                      Actual queued prompt
                    </summary>
                    <p
                      class="mt-1 max-h-36 overflow-auto whitespace-pre-wrap text-[10px] text-slate-300"
                    >
                      {{ store.jobFor(activeSubject.key, lane.key)?.prompt }}
                    </p>
                  </details>
                </div>
              </details>
            </div>
          </article>
        </div>
      </section>

      <section
        v-else-if="view === 'cast'"
        class="capes-deck min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-7"
      >
        <CapesCastAtlas />
      </section>
      <section
        v-else-if="view === 'production'"
        class="capes-deck min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7"
        data-testid="capes-asset-plan"
      >
        <p
          class="text-[11px] font-black uppercase tracking-widest text-amber-300"
        >
          03 / SHARED PRODUCTION BIBLE
        </p>
        <h2 class="mt-2 text-3xl font-black">
          EVERY CHARACTER <span class="text-amber-300">GETS A REVEAL.</span>
        </h2>
        <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Prom of Doom and Every Villain Tactics share canonical art keys,
          collectible card fronts, readable stats backs, portraits, expressive
          story illustrations and transparent-ready standees. Card-back
          typography and comic-panel names are rendered by the UI, never burned
          into AI images.
        </p>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="family in artFamilies"
            :key="family.title"
            class="rounded-xl border border-amber-200/30 bg-slate-900/80 p-4"
          >
            <p
              class="text-[11px] font-black uppercase tracking-wider text-sky-200"
            >
              {{ family.group }}
            </p>
            <strong class="mt-2 block text-3xl font-black text-amber-200">{{
              family.quantity
            }}</strong>
            <h3 class="mt-1 text-lg font-black">{{ family.title }}</h3>
            <p class="mt-2 text-xs leading-5 text-slate-300">
              {{ family.detail }}
            </p>
          </article>
        </div>
        <div class="mt-5 grid gap-3 lg:grid-cols-2">
          <article
            class="rounded-xl border border-slate-500/30 bg-slate-900 p-4"
          >
            <h3 class="font-black text-amber-200">STORY EXPRESSION SETS</h3>
            <p class="mt-2 text-sm text-slate-300">
              Six large hero reactions (neutral, warm, determined, shocked,
              angry, hurt) with portrait crops, plus three lieutenant reactions.
              Keep physical identity and costume continuous.
            </p>
          </article>
          <article
            class="rounded-xl border border-slate-500/30 bg-slate-900 p-4"
          >
            <h3 class="font-black text-amber-200">TACTICAL STANDEE STATES</h3>
            <p class="mt-2 text-sm text-slate-300">
              2:1 standees use CSS idle bob, selected bounce, hit shake,
              critical recoil, defensive overlay and sideways unconscious pose.
              Reduced motion stays respected.
            </p>
          </article>
        </div>
        <p class="mt-4 max-w-3xl text-xs leading-5 text-slate-400">
          Plans are not completed ArtJobs. A card unlock requires a real game
          event, and delivered art requires a verified ArtImage attached to its
          intended surface. The house style is chosen by a human after reviewing
          all eight benchmark scenes.
        </p>
      </section>
      <footer
        class="shrink-0 border-t border-slate-500/30 bg-slate-950/90 px-4 py-2 sm:px-7"
      >
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <strong class="text-amber-200">Cross-check favorites:</strong>
          <span
            v-for="entry in store.leaderboard.slice(0, 3)"
            :key="entry.key"
            class="text-slate-300"
          >
            {{ entry.title }}:
            {{
              entry.average === null
                ? 'unrated'
                : entry.average.toFixed(1) + '/5'
            }}
          </span>
          <div class="ml-auto flex flex-wrap gap-3">
            <NuxtLink class="text-sky-200 underline" to="/admin/playbook-forge"
              >Playbook Forge</NuxtLink
            >
            <NuxtLink
              class="text-sky-200 underline"
              to="/admin/every-villain-tactics"
              >Tactics</NuxtLink
            >
          </div>
        </div>
      </footer>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CapesCastAtlas from '~/components/admin/capes-cast-atlas.vue'
import { useUserStore } from '~/stores/userStore'
import { useCapesStyleCheckStore } from '~/stores/capesStyleCheckStore'
import {
  CAPES_STYLE_CRITERIA,
  CAPES_STYLE_LANES,
  CAPES_STYLE_SUBJECTS,
} from '~/utils/capesStyleCheck'

const userStore = useUserStore()
const view = ref<'checkpoints' | 'cast' | 'production'>('checkpoints')
const sections = [
  { key: 'checkpoints', number: '01', label: 'Style Check' },
  { key: 'cast', number: '02', label: 'Cast & Crews' },
  { key: 'production', number: '03', label: 'Asset Plans' },
] as const
const totalCells = CAPES_STYLE_SUBJECTS.length * CAPES_STYLE_LANES.length
const artFamilies = [
  {
    group: 'Permanent hero/villain',
    quantity: '96',
    title: 'Core poster fronts',
    detail:
      '48 hero posters + 48 villain posters, each a collectible card with a templated stats reverse.',
  },
  {
    group: 'Villain support cast',
    quantity: '96',
    title: 'Crew and lieutenant posters',
    detail:
      'One unique one-hit species and one independent, powered lieutenant per villain.',
  },
  {
    group: 'First appearances',
    quantity: '192',
    title: 'Comic introductions',
    detail:
      'A stylized reveal for each hero, villain, henchman family and lieutenant, with real on-screen lettering.',
  },
  {
    group: 'Tactical play',
    quantity: '192',
    title: '2:1 standees',
    detail:
      'Hero and villain forms, 48 lieutenant models and 48 species units with simple transform-based animation.',
  },
] as const
const store = useCapesStyleCheckStore()
const activeSubject = computed(
  () =>
    CAPES_STYLE_SUBJECTS.find((item) => item.key === store.selectedSubject) ??
    CAPES_STYLE_SUBJECTS[0],
)
function statusFor(lane: string): string {
  const job = store.jobFor(activeSubject.value.key, lane)
  if (!job) return 'Not submitted'
  return job.status === 'DONE' ? 'Done' : job.status.toLowerCase()
}
function statusClass(lane: string): string {
  const status = statusFor(lane)
  if (status === 'Done') return 'bg-emerald-800 text-emerald-100'
  if (status === 'failed') return 'bg-rose-800 text-rose-100'
  return 'bg-slate-700 text-slate-200'
}

onMounted(() => {
  if (!userStore.isAdmin) return
  store.restoreReviews()
  void store.refresh()
})
</script>

<style scoped>
.capes-section-nav {
  display: flex;
  gap: 3px;
  padding: 8px clamp(12px, 2vw, 28px);
  background: #0d1728;
  border-bottom: 1px solid #d5bb8955;
  overflow-x: auto;
}
.capes-section-nav button {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 145px;
  justify-content: center;
  padding: 9px 12px;
  background: #1a2a44;
  color: #bfcce0;
  border: 1px solid #65748d55;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 900;
}
.capes-section-nav button span {
  color: #e7bb7d;
  font-size: 10px;
}
.capes-section-nav button.active {
  background: #ddba80;
  color: #152036;
  border-color: #ffdbab;
}
.capes-section-nav button.active span {
  color: #603927;
}
.capes-section-nav button:focus-visible {
  outline: 2px solid #ffe7ab;
  outline-offset: 2px;
}
.capes-board {
  background: #101828;
}
.capes-hero {
  background: radial-gradient(
    ellipse at 75% 10%,
    #5d423b,
    #172338 61%,
    #101828
  );
}
.capes-deck {
  background: linear-gradient(135deg, #17233a, #0b1525);
}
.capes-card {
  box-shadow: 0 12px 30px #0004;
}
.capes-image {
  background-image: radial-gradient(ellipse at 50% 25%, #394a63, #172235 75%);
  min-height: 155px;
}
</style>
