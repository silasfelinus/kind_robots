<template>
  <section
    class="grid gap-3"
    aria-label="Fairy court relationships"
    data-testid="dh-court-flowchart"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="pf-display text-xl text-primary">The Glass Family</h2>
        <p class="max-w-lg text-xs opacity-75">
          A court of strangely human-faced gods. Meet them below, uncover
          grudges, then bargain, expose, or defy them to fill the diagram.
        </p>
      </div>
      <span class="badge badge-outline text-xs">
        {{ metCount }}/{{ COURT_DEITIES.length }} patrons ·
        {{ linkCount }}/{{ COURT_LINKS.length }} ties
      </span>
    </div>

    <div class="kr-scroll overflow-x-auto rounded-2xl border border-base-content/20 bg-base-200/80">
      <div class="relative mx-auto h-[390px] w-full min-w-[700px]">
        <svg
          class="absolute inset-0 size-full"
          viewBox="0 0 900 460"
          preserveAspectRatio="none"
          role="img"
          aria-label="Connections between six fairy nobles. Select a noble for relationship details."
        >
          <defs>
            <marker
              id="dh-court-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
          </defs>
          <g v-for="link in COURT_LINKS" :key="link.id">
            <line
              :x1="position(link.from).x"
              :y1="position(link.from).y"
              :x2="position(link.to).x"
              :y2="position(link.to).y"
              :stroke="linkColor(link)"
              :stroke-width="discovered(link.id) ? 3 : 1.5"
              :stroke-dasharray="discovered(link.id) ? '0' : '6 8'"
              :opacity="edgeOpacity(link)"
              :marker-end="
                discovered(link.id) && ['plot', 'scheme', 'revenge'].includes(link.kind)
                  ? 'url(#dh-court-arrow)'
                  : undefined
              "
            >
              <title>
                {{ discovered(link.id) ? link.label : 'Undiscovered court tie' }}
              </title>
            </line>
          </g>
          <g v-for="link in shownLinks" :key="'caption-' + link.id">
            <rect
              :x="(position(link.from).x + position(link.to).x) / 2 - 42"
              :y="(position(link.from).y + position(link.to).y) / 2 - 12"
              width="84"
              height="24"
              rx="12"
              fill="#171522"
              opacity=".9"
            />
            <text
              :x="(position(link.from).x + position(link.to).x) / 2"
              :y="(position(link.from).y + position(link.to).y) / 2 + 4"
              text-anchor="middle"
              fill="#f4e9dd"
              font-size="13"
              font-weight="600"
            >
              {{ link.kind }}
            </text>
          </g>
        </svg>

        <button
          v-for="deity in COURT_DEITIES"
          :key="deity.id"
          type="button"
          class="absolute grid w-[166px] -translate-x-1/2 -translate-y-1/2 gap-1 rounded-xl border p-2 text-left shadow-xl transition-colors"
          :class="
            selected === deity.id
              ? 'border-primary bg-primary/25'
              : discovered('court-meet-' + deity.id)
                ? 'border-secondary/60 bg-base-100'
                : 'border-base-content/20 bg-base-300'
          "
          :style="{
            left: (position(deity.id).x / 900) * 100 + '%',
            top: (position(deity.id).y / 460) * 100 + '%',
          }"
          :aria-pressed="selected === deity.id"
          :aria-label="
            discovered('court-meet-' + deity.id)
              ? 'Inspect ' + deity.name
              : 'Inspect an unknown court patron'
          "
          :data-testid="'dh-court-node-' + deity.id"
          @click="selected = deity.id"
        >
          <span
            class="text-[0.6rem] font-bold uppercase tracking-widest opacity-70"
          >
            {{ discovered('court-meet-' + deity.id) ? deity.pronouns : 'Unknown' }}
          </span>
          <strong class="truncate text-sm">
            {{
              discovered('court-meet-' + deity.id)
                ? deity.name
                : 'Unseen patron'
            }}
          </strong>
          <span class="line-clamp-2 min-h-7 text-[0.65rem] opacity-75">
            {{
              discovered('court-meet-' + deity.id)
                ? deity.epithet
                : 'A face you have yet to meet'
            }}
          </span>
        </button>
      </div>
    </div>

    <div class="grid gap-3 rounded-xl border border-base-content/15 bg-base-200 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div class="grid content-start gap-1">
        <h3 class="text-sm font-bold">
          {{
            unlockedSelected
              ? current.name + ' · ' + current.epithet
              : 'An unidentified patron'
          }}
        </h3>
        <p v-if="unlockedSelected" class="text-xs leading-relaxed">
          {{ current.voice }} {{ current.power }}
        </p>
        <p v-else class="text-xs opacity-70">
          Find this courtier during a delve. Their human appearance is a clue,
          not a species label for anyone else in this world.
        </p>
        <p v-if="unlockedSelected" class="text-xs opacity-70">
          {{ current.seat }}. {{ current.impact }}
        </p>
      </div>
      <div class="grid content-start gap-2">
        <h3 class="text-xs font-bold uppercase tracking-wider">
          Grudges, kinship, affairs, plots and breakups
        </h3>
        <div v-for="link in related" :key="link.id" class="rounded-lg bg-base-300/80 p-2 text-xs">
          <p class="font-semibold">
            {{
              discovered(link.id)
                ? link.label
                : 'A sealed relationship'
            }}
          </p>
          <p class="mt-1 leading-relaxed opacity-75">
            {{
              discovered(link.id)
                ? link.detail
                : 'An ending encounter or a successful court investigation may reveal this connection.'
            }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { COURT_DEITIES, COURT_LINKS } from '~/utils/deepheart/court'
import type { CourtRelation } from '~/utils/deepheart/court'

const kit = usePlaybookKitStore()
const selected = ref(COURT_DEITIES[0]!.id)
const positions: Record<string, { x: number; y: number }> = {
  aveline: { x: 145, y: 112 },
  ilex: { x: 450, y: 88 },
  vireo: { x: 755, y: 112 },
  serein: { x: 145, y: 360 },
  cauline: { x: 450, y: 380 },
  ludo: { x: 755, y: 360 },
}
const position = (id: string) => positions[id] ?? { x: 450, y: 230 }
const discovered = (id: string) => kit.isUnlocked('reveals', id)
const current = computed(
  () => COURT_DEITIES.find((deity) => deity.id === selected.value)!,
)
const unlockedSelected = computed(() =>
  discovered('court-meet-' + selected.value),
)
const metCount = computed(
  () =>
    COURT_DEITIES.filter((deity) => discovered('court-meet-' + deity.id))
      .length,
)
const linkCount = computed(
  () => COURT_LINKS.filter((link) => discovered(link.id)).length,
)
const related = computed(() =>
  COURT_LINKS.filter(
    (link) => link.from === selected.value || link.to === selected.value,
  ),
)
const shownLinks = computed(() =>
  related.value.filter((link) => discovered(link.id)),
)
const linkColor = (link: CourtRelation) => {
  if (!discovered(link.id)) return 'currentColor'
  if (link.kind === 'kinship') return '#c9b7e7'
  if (link.kind === 'affair' || link.kind === 'former') return '#ed89a9'
  if (link.kind === 'plot' || link.kind === 'revenge') return '#e6a656'
  return '#8cb8ad'
}
const edgeOpacity = (link: CourtRelation) => {
  if (!discovered(link.id)) return 0.13
  if (link.from === selected.value || link.to === selected.value) return 0.9
  return 0.22
}
</script>
