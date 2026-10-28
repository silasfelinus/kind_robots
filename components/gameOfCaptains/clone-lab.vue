<template>
  <div
    v-if="fallenCount || program.step"
    class="clone-lab"
    data-testid="space-couch-clone-console"
  >
    <button
      type="button"
      class="clone-launcher"
      :aria-expanded="opened"
      aria-controls="space-clone-lab-dialog"
      @click="opened = !opened"
    >
      <span aria-hidden="true">⌬</span>
      <span>THE CLONE LAB</span>
      <b>{{ program.step }}/5</b>
    </button>
    <div
      v-if="opened"
      id="space-clone-lab-dialog"
      class="clone-shade"
      role="presentation"
      @click.self="opened = false"
    >
      <section
        class="clone-console"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clone-title"
      >
        <header class="clone-head">
          <div>
            <span class="clone-kicker">SPACE COUCH // PERSONNEL RECORDS // RED THREAD</span>
            <h2 id="clone-title">A Second Chance at Being First</h2>
            <p>Last week they were dead. This week they have opinions about the paperwork.</p>
          </div>
          <button
            type="button"
            class="clone-close"
            aria-label="Close clone laboratory"
            @click="opened = false"
          >
            ✕
          </button>
        </header>
        <div class="clone-tracks" aria-label="Clone quest progress">
          <span
            v-for="n in 5"
            :key="n"
            :class="{ done: n <= program.step, active: n === program.step + 1 }"
          >
            {{ n < 5 ? 'ACT ' + n : 'FINALE' }}
          </span>
        </div>
        <div class="clone-body">
          <article class="clone-story">
            <span class="clone-kicker">MEMORIAL QUEST // ACT {{ Math.min(program.step + 1, 5) }}</span>
            <h3>{{ status.title }}</h3>
            <p>{{ status.hook }}</p>
            <strong class="clone-objective">OBJECTIVE: {{ status.goal }}</strong>
            <small :class="{ unlocked: status.ready }">{{ status.reason }}</small>
            <div v-if="status.ready" class="clone-choice">
              <button
                type="button"
                data-testid="space-couch-clone-ask"
                @click="emit('advance', 'ask')"
              >
                <b>ASK THE PERSON</b>
                <span>{{ nextOptions.ask }}</span>
              </button>
              <button
                type="button"
                data-testid="space-couch-clone-document"
                @click="emit('advance', 'document')"
              >
                <b>KEEP THE RECORD</b>
                <span>{{ nextOptions.document }}</span>
              </button>
              <button
                type="button"
                data-testid="space-couch-clone-override"
                @click="emit('advance', 'override')"
              >
                <b>TAKE THE SHORTCUT</b>
                <span>{{ nextOptions.override }}</span>
              </button>
            </div>
            <div v-else-if="program.beats.length" class="clone-history">
              <b>PREVIOUSLY ON SPACE COUCH</b>
              <p>{{ program.beats.at(-1)?.narrative }}</p>
            </div>
          </article>
          <aside class="clone-roster">
            <span class="clone-kicker">THE LITTLE PEOPLE / BIG CONTINUITY</span>
            <h3>Returnees</h3>
            <p>
              The originals stay on the memorial wall. Each clone becomes a new
              generation with its own assignments, memories and choices.
            </p>
            <div class="clone-returnees">
              <div
                v-for="entry in candidates"
                :key="entry.id"
                class="clone-returnee"
              >
                <div>
                  <strong>{{ entry.name }}</strong>
                  <small>
                    NEXT: GENERATION {{ entry.generation }} ·
                    {{ entry.cost }} SUPPLIES
                  </small>
                  <small>{{ entry.reason }}</small>
                </div>
                <button
                  type="button"
                  :disabled="!entry.available || (!run.redshirtRoster?.includes(entry.id) && (run.redshirtRoster?.length ?? 0) >= 12)"
                  :aria-label="'Grow Generation ' + entry.generation + ' of ' + entry.name"
                  data-testid="space-couch-print-clone"
                  @click="emit('print', entry.id)"
                >
                  {{
                    run.redshirtRoster?.includes(entry.id)
                      ? 'UPGRADE'
                      : 'REPRINT'
                  }}
                </button>
              </div>
              <p v-if="!candidates.length">
                The dormant printer displays {{ fallenCount }} memorials. It has
                not yet acquired a living subject.
              </p>
            </div>
            <div class="clone-memory">
              <b>MEMORY TAPES · {{ program.records.length }} VERSIONS</b>
              <p>
                {{ fallenCount }} historical losses are recorded.
                {{ livingClones }} clone lineages are currently aboard.
              </p>
            </div>
          </aside>
        </div>
        <footer class="clone-footer">
          <span>ONE ACT PER EPISODE · GENERATIONS REQUIRE FIELD EXPERIENCE</span>
          <button type="button" @click="opened = false">
            RETURN TO THE EPISODE ↗
          </button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { VoyageRun } from '~/utils/gameOfCaptains/rules'
import {
  cloneCandidates,
  cloneGeneration,
  cloneProgram,
  cloneQuestStatus,
  CLONE_CHAPTERS,
  type CloneChoice,
} from '~/utils/gameOfCaptains/cloneSaga'

const props = defineProps<{ run: VoyageRun }>()
const emit = defineEmits<{
  advance: [choice: CloneChoice]
  print: [id: string]
}>()
const opened = ref(false)
const fallenCount = computed(() => props.run.redshirtFallen?.length ?? 0)
const program = computed(() => cloneProgram(props.run))
const status = computed(() => cloneQuestStatus(props.run))
const candidates = computed(() => cloneCandidates(props.run))
const livingClones = computed(
  () =>
    new Set(
      (props.run.redshirtRoster ?? []).filter(
        (id) => cloneGeneration(props.run, id) > 0,
      ),
    ).size,
)
const nextOptions = computed(
  () => CLONE_CHAPTERS[Math.min(program.value.step, CLONE_CHAPTERS.length - 1)]!.options,
)
</script>

<style scoped>
.clone-lab {
  position: absolute;
  top: 0.9rem;
  right: 1rem;
  z-index: 12;
}
.clone-launcher {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.43rem 0.7rem;
  border: 1px solid #f1b577;
  border-radius: 0.45rem;
  background: #1b172ddd;
  box-shadow: 0 3px 20px #06071a99;
  color: #ffe1bc;
  font-size: 0.67rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}
.clone-launcher b { color: #8adee1; }
.clone-shade {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  padding: max(0.5rem, env(safe-area-inset-top));
  background: #020512dd;
  backdrop-filter: blur(0.35rem);
}
.clone-console {
  display: flex;
  flex-direction: column;
  width: min(66rem, 100%);
  max-height: min(94dvh, 57rem);
  min-height: 0;
  overflow: hidden;
  border: 2px solid #efb881;
  border-radius: 1rem;
  background: radial-gradient(ellipse at 20% 0%, #493446 0, #111c32 55%, #0d1323);
  box-shadow: 0 0 0 5px #0c1c33, 0 30px 90px #000b;
  color: #f6eadb;
}
.clone-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(0.7rem, 1.7vw, 1.3rem);
  border-bottom: 1px solid #a18c80a8;
}
.clone-head h2 {
  margin: 0.12rem 0;
  font-family: Georgia, serif;
  font-size: clamp(1.3rem, 2.8vw, 2.3rem);
  line-height: 1.08;
}
.clone-head p, .clone-story p, .clone-roster p {
  margin: 0.3rem 0;
  color: #d9dfe3;
  font-size: clamp(0.73rem, 1.1vw, 0.9rem);
  line-height: 1.48;
}
.clone-kicker {
  color: #f6c187;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  font-weight: 900;
}
.clone-close {
  border: 1px solid #879aa7;
  background: #15243c;
  border-radius: 0.4rem;
  min-width: 2rem;
  min-height: 2rem;
  color: #f6eadb;
}
.clone-tracks {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.25rem;
  padding: 0.5rem 0.8rem;
  background: #08172a;
}
.clone-tracks span {
  padding: 0.4rem 0.1rem;
  border: 1px solid #465a6f;
  border-radius: 0.3rem;
  text-align: center;
  font-size: clamp(0.51rem, 1vw, 0.73rem);
  color: #a7b7c2;
}
.clone-tracks .done {
  background: #1b4c4c;
  border-color: #9de2b8;
  color: #e5ffed;
}
.clone-tracks .active {
  background: #674237;
  border-color: #ffd096;
  color: #ffe4ba;
}
.clone-body {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: clamp(0.6rem, 1.5vw, 1.2rem);
  flex: 1;
  min-height: 0;
  padding: clamp(0.55rem, 1.5vw, 1rem);
  overflow-y: auto;
}
.clone-story, .clone-roster {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.5rem;
}
.clone-story h3, .clone-roster h3 {
  margin: 0;
  font-family: Georgia, serif;
  font-size: clamp(1.12rem, 2vw, 1.6rem);
}
.clone-objective {
  padding: 0.6rem;
  border-left: 3px solid #f6c187;
  background: #35425888;
  font-size: 0.75rem;
}
.clone-story small {
  color: #d4bba4;
  font-size: 0.7rem;
}
.clone-story .unlocked { color: #9de2b8; }
.clone-choice {
  display: grid;
  gap: 0.35rem;
  margin-top: 0.35rem;
}
.clone-choice button {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: 0.58rem;
  border: 1px solid #7e9db3;
  border-radius: 0.4rem;
  background: #1b3445;
  color: #f8ede1;
  text-align: left;
}
.clone-choice button:hover, .clone-choice button:focus-visible {
  border-color: #ffc68b;
  background: #344355;
}
.clone-choice b { color: #ffe0ab; font-size: 0.7rem; }
.clone-choice span { font-size: 0.68rem; line-height: 1.38; }
.clone-history {
  padding: 0.6rem;
  border: 1px solid #6c8d86;
  background: #223a39;
  font-size: 0.74rem;
}
.clone-returnees { display: grid; gap: 0.4rem; }
.clone-returnee {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem;
  background: #2a2339;
  border: 1px solid #916d77;
  border-radius: 0.4rem;
}
.clone-returnee div { display: grid; gap: 0.18rem; }
.clone-returnee strong { font-size: 0.76rem; }
.clone-returnee small {
  font-size: 0.65rem;
  color: #d7cbbf;
}
.clone-returnee button {
  padding: 0.44rem;
  color: #141722;
  font-size: 0.65rem;
  font-weight: 900;
  border-radius: 0.3rem;
  background: #f3c68e;
}
.clone-returnee button:disabled { opacity: 0.4; }
.clone-memory {
  margin-top: auto;
  border-top: 1px solid #998172;
  padding-top: 0.6rem;
  font-size: 0.7rem;
}
.clone-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-top: 1px solid #998172;
  padding: 0.65rem;
  color: #b7c9d2;
  font-size: 0.64rem;
}
.clone-footer button {
  padding: 0.45rem 0.6rem;
  background: #e6b681;
  color: #172134;
  border-radius: 0.3rem;
  font-weight: 900;
}
@media (max-width: 680px) {
  .clone-lab { right: 0.4rem; top: 0.4rem; }
  .clone-launcher { padding: 0.32rem; font-size: 0.59rem; }
  .clone-body { grid-template-columns: minmax(0, 1fr); }
  .clone-console { max-height: 96dvh; }
  .clone-footer span { display: none; }
  .clone-returnee { align-items: start; }
}
@media (prefers-reduced-motion: reduce) {
  .clone-shade { backdrop-filter: none; }
}
</style>
