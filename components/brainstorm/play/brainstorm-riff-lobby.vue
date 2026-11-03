<template>
  <div class="kr-scroll bs-lobby" data-testid="brainstorm-lobby">
    <header class="bs-hero">
      <svg
        class="bs-hero-mark"
        viewBox="0 0 120 120"
        role="img"
        aria-label="Brainstorm"
      >
        <defs>
          <linearGradient id="bs-brain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="var(--color-primary)" />
            <stop offset="1" stop-color="var(--color-accent)" />
          </linearGradient>
        </defs>
        <path
          d="M60 18c-10-9-30-6-33 9-13 2-19 17-11 28-7 10-1 25 12 26 2 13 18 20 29 12h6c11 8 27 1 29-12 13-1 19-16 12-26 8-11 2-26-11-28-3-15-23-18-33-9z"
          fill="url(#bs-brain)"
          stroke="var(--color-base-content)"
          stroke-width="3"
        />
        <path
          d="M60 22v70M40 38c6 4 6 12 0 16M80 38c-6 4-6 12 0 16M34 66c8-2 14 4 14 10M86 66c-8-2-14 4-14 10"
          fill="none"
          stroke="var(--color-base-200)"
          stroke-width="3"
          stroke-linecap="round"
        />
        <path
          d="M66 70l-12 22h10l-6 20 18-28H64l8-14z"
          fill="var(--color-secondary)"
          stroke="var(--color-base-200)"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
      </svg>
      <div class="min-w-0">
        <h1 class="bs-title">Brain<span>storm</span></h1>
        <p class="bs-tagline">Show me what you got.</p>
      </div>
      <button
        type="button"
        class="btn btn-secondary btn-sm bs-deal"
        :disabled="!dealable.length"
        data-testid="brainstorm-deal"
        @click="deal"
      >
        🎲 Deal me a prompt
      </button>
    </header>

    <section class="bs-section" aria-labelledby="bs-start-heading">
      <h2 id="bs-start-heading" class="bs-section-title">Start a round</h2>
      <div class="bs-flavors">
        <button
          v-for="flavor in flavors"
          :key="flavor.id"
          type="button"
          class="bs-flavor"
          :data-testid="`brainstorm-start-${flavor.id}`"
          @click="emit('start', flavor.id)"
        >
          <span class="bs-flavor-icon" aria-hidden="true">{{
            flavor.icon
          }}</span>
          <strong>{{ flavor.label }}</strong>
          <span class="bs-flavor-blurb">{{ flavor.blurb }}</span>
        </button>
      </div>
    </section>

    <section class="bs-section" aria-labelledby="bs-hot-heading">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 id="bs-hot-heading" class="bs-section-title">Hot tables</h2>
        <div
          class="flex flex-wrap gap-1"
          role="group"
          aria-label="Filter tables"
        >
          <button
            v-for="option in filters"
            :key="option.id"
            type="button"
            class="btn btn-xs rounded-full"
            :class="filter === option.id ? 'btn-accent' : 'btn-ghost'"
            @click="filter = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="store.riffsState === 'loading'" class="bs-empty">
        Warming up the tables…
      </p>
      <p v-else-if="store.riffsState === 'error'" class="bs-empty">
        {{ store.riffsError }}
        <button
          type="button"
          class="btn btn-xs btn-ghost"
          @click="store.fetchRiffs()"
        >
          Retry
        </button>
      </p>
      <p v-else-if="!visible.length" class="bs-empty">
        Nobody is at these tables yet. Start one.
      </p>

      <ul v-else class="bs-tables" data-testid="brainstorm-tables">
        <li v-for="(riff, index) in visible" :key="riff.id">
          <button
            type="button"
            class="bs-table"
            :data-testid="`brainstorm-table-${riff.id}`"
            @click="emit('open', riff.id)"
          >
            <span class="bs-table-art" :data-flavor="riff.flavor">
              <img
                v-if="riff.coverUrl && !brokenCovers.has(riff.id)"
                :src="riff.coverUrl"
                :alt="riff.bestLine?.text || riff.title"
                loading="lazy"
                @error="brokenCovers.add(riff.id)"
              />
              <span v-else class="bs-table-glyph" aria-hidden="true">
                {{ flavorIcon(riff.flavor) }}
              </span>
              <span v-if="index < 3 && riff.lineCount" class="bs-table-rank">
                🔥 #{{ index + 1 }}
              </span>
            </span>
            <span class="bs-table-body">
              <span class="bs-table-kind">{{ flavorLabel(riff.flavor) }}</span>
              <strong class="bs-table-title">{{ riff.title }}</strong>
              <span v-if="riff.bestLine" class="bs-table-best">
                “{{ previewLine(riff, riff.bestLine.text) }}”
              </span>
              <span v-else-if="riff.vibe" class="bs-table-best">{{
                riff.vibe
              }}</span>
              <span class="bs-table-stats">
                <span>💬 {{ riff.lineCount }}</span>
                <span>❤️ {{ riff.points }}</span>
                <span v-if="riff.isMine">⭐ Yours</span>
              </span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  useBrainstormRiffStore,
  type BrainstormRiffCard,
} from '@/stores/brainstormRiffStore'
import {
  BRAINSTORM_RIFF_FLAVORS,
  fullLineText,
  type BrainstormRiffFlavor,
} from '@/utils/brainstormRiffs'

const emit = defineEmits<{
  open: [id: number]
  start: [flavor: BrainstormRiffFlavor]
}>()

const store = useBrainstormRiffStore()
const flavors = BRAINSTORM_RIFF_FLAVORS
const filters: Array<{ id: BrainstormRiffFlavor | 'all'; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'persona', label: 'People' },
  { id: 'list', label: 'Lists' },
  { id: 'yes-but', label: 'Yes, but' },
  { id: 'crossover', label: 'Crossovers' },
]
const filter = ref<BrainstormRiffFlavor | 'all'>('all')
const brokenCovers = reactive(new Set<number>())

const visible = computed(() =>
  filter.value === 'all'
    ? store.riffs
    : store.riffs.filter((riff) => riff.flavor === filter.value),
)
const dealable = computed(() => store.riffs.filter((riff) => riff.isOpen))

function flavorIcon(id: string) {
  return (
    BRAINSTORM_RIFF_FLAVORS.find((flavor) => flavor.id === id)?.icon ?? '🧠'
  )
}

function flavorLabel(id: string) {
  return (
    BRAINSTORM_RIFF_FLAVORS.find((flavor) => flavor.id === id)?.label ?? 'Riff'
  )
}

function previewLine(riff: BrainstormRiffCard, text: string) {
  return fullLineText(riff, text)
}

function deal() {
  const pool = dealable.value
  if (!pool.length) return
  const pick = pool[Math.floor(Math.random() * pool.length)]
  if (pick) emit('open', pick.id)
}
</script>

<style scoped>
.bs-lobby {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1rem;
}

.bs-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
  border-radius: 1.25rem;
  padding: 0.9rem 1rem;
  background:
    linear-gradient(
      120deg,
      color-mix(in oklch, var(--color-primary) 28%, transparent),
      color-mix(in oklch, var(--color-accent) 18%, transparent)
    ),
    var(--color-base-100);
  box-shadow: inset 0 0 0 1px color-mix(in oklch, white 10%, transparent);
}

.bs-hero-mark {
  width: clamp(3.5rem, 12vw, 5.5rem);
  height: auto;
  filter: drop-shadow(0 6px 10px color-mix(in oklch, black 50%, transparent));
  animation: bs-bob 3.2s ease-in-out infinite;
}

.bs-title {
  font-size: clamp(2rem, 7vw, 3.4rem);
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  text-shadow: 0 3px 0 color-mix(in oklch, black 45%, transparent);
}

.bs-title span {
  color: var(--color-secondary);
}

.bs-tagline {
  margin-top: 0.2rem;
  font-weight: 700;
  color: color-mix(in oklch, var(--color-base-content) 75%, transparent);
}

.bs-deal {
  margin-left: auto;
}

.bs-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.bs-section-title {
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.bs-flavors {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr));
  gap: 0.6rem;
}

.bs-flavor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  border-radius: 1.1rem;
  padding: 0.75rem 0.85rem;
  text-align: left;
  background: var(--color-base-100);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, white 8%, transparent),
    0 4px 0 color-mix(in oklch, black 40%, transparent);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease;
}

.bs-flavor:hover,
.bs-flavor:focus-visible {
  transform: translateY(-3px);
  box-shadow:
    inset 0 0 0 2px var(--color-primary),
    0 7px 0 color-mix(in oklch, black 40%, transparent);
}

.bs-flavor-icon {
  font-size: 1.8rem;
}

.bs-flavor-blurb {
  font-size: 0.8rem;
  color: color-mix(in oklch, var(--color-base-content) 70%, transparent);
}

.bs-empty {
  border-radius: 1rem;
  padding: 1rem;
  background: var(--color-base-100);
  color: color-mix(in oklch, var(--color-base-content) 75%, transparent);
}

.bs-tables {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: 0.8rem;
}

.bs-table {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border-radius: 1.2rem;
  text-align: left;
  background: var(--color-base-100);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, white 8%, transparent),
    0 5px 0 color-mix(in oklch, black 45%, transparent);
  transition: transform 140ms ease;
}

.bs-table:hover,
.bs-table:focus-visible {
  transform: translateY(-3px) rotate(-0.4deg);
}

.bs-table-art {
  position: relative;
  display: grid;
  aspect-ratio: 16 / 10;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-primary) 55%, var(--color-base-300)),
    color-mix(in oklch, var(--color-accent) 45%, var(--color-base-300))
  );
}

.bs-table-art[data-flavor='persona'] {
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-secondary) 55%, var(--color-base-300)),
    color-mix(in oklch, var(--color-primary) 45%, var(--color-base-300))
  );
}

.bs-table-art[data-flavor='yes-but'] {
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-accent) 55%, var(--color-base-300)),
    color-mix(in oklch, var(--color-secondary) 40%, var(--color-base-300))
  );
}

.bs-table-art[data-flavor='crossover'] {
  background: linear-gradient(
    135deg,
    color-mix(in oklch, var(--color-success) 45%, var(--color-base-300)),
    color-mix(in oklch, var(--color-primary) 45%, var(--color-base-300))
  );
}

.bs-table-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bs-table-glyph {
  font-size: 3.4rem;
  filter: drop-shadow(0 6px 8px color-mix(in oklch, black 45%, transparent));
}

.bs-table-rank {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--color-secondary-content);
  background: var(--color-secondary);
}

.bs-table-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.7rem 0.85rem 0.8rem;
}

.bs-table-kind {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.bs-table-title {
  font-size: 1.1rem;
  line-height: 1.2;
}

.bs-table-best {
  font-size: 0.85rem;
  line-height: 1.35;
  color: color-mix(in oklch, var(--color-base-content) 78%, transparent);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bs-table-stats {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
  padding-top: 0.3rem;
  font-size: 0.78rem;
  font-weight: 800;
}

@keyframes bs-bob {
  0%,
  100% {
    transform: translateY(0) rotate(-3deg);
  }
  50% {
    transform: translateY(-5px) rotate(3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bs-hero-mark {
    animation: none;
  }
}
</style>
