<template>
  <div
    class="kr-stage bs-root"
    data-theme="brainstorm"
    data-testid="brainstorm-play"
  >
    <shell-console-theme theme="brainstorm" />
    <header-page-bar console-theme="brainstorm">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          class="bs-logo-chip"
          data-testid="brainstorm-home"
          @click="goLobby"
        >
          <span aria-hidden="true">🧠</span>
          <span class="sr-only">Brainstorm tables</span>
        </button>
        <div class="join shrink-0">
          <button
            type="button"
            class="kr-btn-join-sm"
            :class="view === 'lobby' ? 'btn-primary' : 'btn-ghost'"
            data-testid="brainstorm-view-lobby"
            @click="goLobby"
          >
            Tables
          </button>
          <button
            type="button"
            class="kr-btn-join-sm"
            :class="view === 'new' ? 'btn-primary' : 'btn-ghost'"
            data-testid="brainstorm-view-new"
            @click="goNew()"
          >
            New round
          </button>
        </div>
        <span
          v-if="view === 'riff' && store.detail"
          class="bs-hud-chip min-w-0 truncate"
        >
          {{ store.detail.riff.title }}
        </span>
        <span
          v-if="store.activePlayer"
          class="bs-hud-chip bs-hud-turn ml-auto shrink-0"
          data-testid="brainstorm-turn-chip"
        >
          🎙️ {{ store.activePlayer }}
        </span>
      </div>
    </header-page-bar>
    <page-help label="How to play Brainstorm" @open="helpOpen = true" />

    <div class="bs-device">
      <div class="bs-device-top" aria-hidden="true">
        <span class="bs-led" :class="{ 'is-live': view === 'riff' }" />
        <span class="bs-speaker" />
        <span class="bs-speaker" />
        <span class="bs-speaker" />
      </div>
      <section class="bs-screen" aria-live="polite">
        <brainstorm-riff-lobby
          v-if="view === 'lobby'"
          @open="openRiff"
          @start="goNew"
        />
        <brainstorm-riff-new
          v-else-if="view === 'new'"
          :flavor="newFlavor"
          @created="openRiff"
          @cancel="goLobby"
        />
        <brainstorm-riff-stage v-else @back="goLobby" />
      </section>
    </div>

    <dialog
      class="modal"
      :open="helpOpen"
      data-testid="brainstorm-help"
      @close="helpOpen = false"
    >
      <div class="modal-box bs-help">
        <h2 class="text-2xl font-black">Show me what you got</h2>
        <p>
          Somebody puts a prompt on the table: a category, a made-up person, a
          "yes, but" swerve, or a crossover between characters. Everyone piles
          on with their own lines.
        </p>
        <ul>
          <li>
            <strong>Write your line</strong> and press A. The art modeler paints
            every line people write.
          </li>
          <li>
            <strong>Stuck?</strong> Press B for sparks. The coach never plays
            for you: it points at an angle and leaves the punchline to you.
          </li>
          <li>
            <strong>React</strong> with ❤️ Love it, 😂 LOL or 🍅 Groan. The
            board shows the hottest lines and tables first, and the coach steers
            toward what the table loves.
          </li>
          <li>
            <strong>Table mode</strong> passes one device around: add the
            players and each line goes under whoever's turn it is.
          </li>
        </ul>
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-primary"
            @click="helpOpen = false"
          >
            Let's play
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button type="submit" aria-label="Close help">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBrainstormRiffStore } from '@/stores/brainstormRiffStore'
import {
  normalizeRiffFlavor,
  type BrainstormRiffFlavor,
} from '@/utils/brainstormRiffs'

const store = useBrainstormRiffStore()
const route = useRoute()
const router = useRouter()
const helpOpen = ref(false)

function single(value: unknown): string | null {
  if (Array.isArray(value))
    return typeof value[0] === 'string' ? value[0] : null
  return typeof value === 'string' ? value : null
}

const riffQuery = computed(() => {
  const id = Number(single(route.query.riff))
  return Number.isInteger(id) && id > 0 ? id : null
})
const view = computed<'lobby' | 'new' | 'riff'>(() => {
  if (riffQuery.value) return 'riff'
  if (single(route.query.new)) return 'new'
  return 'lobby'
})
const newFlavor = computed<BrainstormRiffFlavor>(() =>
  normalizeRiffFlavor(single(route.query.new)),
)

function goLobby() {
  void router.push({ query: {} })
}

function goNew(flavor: BrainstormRiffFlavor = 'list') {
  void router.push({ query: { new: flavor } })
}

function openRiff(id: number) {
  void router.push({ query: { riff: String(id) } })
}

watch(
  riffQuery,
  (id) => {
    if (id) void store.openRiff(id)
    else if (store.activeRiffId) store.closeRiff()
  },
  { immediate: true },
)

onMounted(() => {
  if (!store.riffs.length) void store.fetchRiffs()
})
onBeforeUnmount(() => store.stopPolling())
</script>

<style scoped>
.bs-root {
  background:
    radial-gradient(
      120% 80% at 50% -10%,
      color-mix(in oklch, var(--color-primary) 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      80% 60% at 100% 100%,
      color-mix(in oklch, var(--color-accent) 18%, transparent),
      transparent 70%
    ),
    var(--color-base-200);
  color: var(--color-base-content);
  padding: 0.35rem;
}

.bs-logo-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--color-primary-content);
  background: linear-gradient(
    135deg,
    var(--color-primary),
    color-mix(in oklch, var(--color-primary) 60%, var(--color-secondary))
  );
  box-shadow: 0 2px 0 color-mix(in oklch, var(--color-primary) 50%, black);
}

.bs-hud-chip {
  border-radius: 999px;
  border: 1px solid color-mix(in oklch, var(--color-accent) 45%, transparent);
  background: color-mix(in oklch, var(--color-accent) 12%, transparent);
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 800;
}

.bs-hud-turn {
  border-color: color-mix(in oklch, var(--color-secondary) 60%, transparent);
  background: color-mix(in oklch, var(--color-secondary) 18%, transparent);
}

.bs-device {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  border-radius: 2rem;
  padding: 0.6rem;
  background: linear-gradient(
    160deg,
    color-mix(in oklch, var(--color-base-100) 80%, white 8%),
    var(--color-base-100) 40%,
    color-mix(in oklch, var(--color-base-100) 80%, black)
  );
  box-shadow:
    inset 0 2px 0 color-mix(in oklch, white 18%, transparent),
    inset 0 -4px 0 color-mix(in oklch, black 35%, transparent),
    0 18px 40px -18px color-mix(in oklch, black 80%, transparent);
}

.bs-device-top {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0 0.6rem 0.45rem;
}

.bs-led {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  margin-right: auto;
  background: color-mix(
    in oklch,
    var(--color-error) 40%,
    var(--color-base-300)
  );
  box-shadow: 0 0 0 2px color-mix(in oklch, black 30%, transparent);
}

.bs-led.is-live {
  background: var(--color-success);
  box-shadow:
    0 0 10px var(--color-success),
    0 0 0 2px color-mix(in oklch, black 30%, transparent);
}

.bs-speaker {
  width: 1.4rem;
  height: 0.25rem;
  border-radius: 999px;
  background: color-mix(in oklch, black 45%, transparent);
}

.bs-screen {
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow: clip;
  border-radius: 1.4rem;
  background:
    radial-gradient(
      140% 90% at 50% 0%,
      color-mix(in oklch, var(--color-accent) 10%, transparent),
      transparent 60%
    ),
    var(--color-base-200);
  box-shadow:
    inset 0 0 0 3px color-mix(in oklch, black 45%, transparent),
    inset 0 0 40px color-mix(in oklch, var(--color-accent) 8%, transparent);
}

.bs-help p,
.bs-help li {
  margin-top: 0.6rem;
  line-height: 1.5;
}

.bs-help ul {
  list-style: disc;
  padding-left: 1.25rem;
}

@media (min-width: 1024px) {
  .bs-root {
    padding: 0.75rem 1.5rem;
  }

  .bs-device {
    padding: 0.9rem 1.1rem;
    border-radius: 2.6rem;
  }
}
</style>
