<!-- /components/ui/ui-gallery.vue -->
<!--
  UI Gallery — the shared "kitchen sink" and living style guide for the
  Kind Robots front end (global-ui). Rendered as an MDC component from
  content/ui.md at the /ui route.

  Two jobs:
    1. Document the style plan — design tokens, container/surface classes,
       and the rules for when to use each (the "Conventions" section).
    2. Render every core DaisyUI component live against the real theme
       store, so humans and AI can iterate on design in code with a
       rendered reference. Answers the global-ui prompt "How can I make
       this look better?" by making "better" observable.

  Working with an AI on design:
    · Pick a theme from the switcher.
    · Screenshot it (or ask Claude/ChatGPT to).
    · Talk in tokens and kr-* class names, not hex codes — they re-map
      automatically per theme and keep components consistent.
-->
<template>
  <div
    class="kr-gallery h-full min-h-0 overflow-y-auto bg-base-200 text-base-content"
  >
    <!-- Header + theme switcher -->
    <header
      class="sticky top-0 z-20 border-b border-base-300 bg-base-100/90 backdrop-blur"
    >
      <div
        class="kr-container flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6"
      >
        <div class="mr-auto">
          <h1 class="text-smart-title font-bold">UI Gallery</h1>
          <p class="text-smart-caption opacity-70">
            Living style guide · DaisyUI components on the real theme store
          </p>
        </div>

        <label class="flex items-center gap-2">
          <span class="text-smart-caption opacity-70">Theme</span>
          <select
            class="select select-bordered select-sm max-w-[12rem]"
            :value="currentTheme"
            @change="onThemeChange"
          >
            <option v-for="name in themes" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </label>
      </div>

      <!-- Section nav -->
      <nav
        class="kr-container flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 no-scrollbar"
      >
        <a
          v-for="s in sections"
          :key="s.id"
          :href="`#${s.id}`"
          class="btn btn-ghost btn-xs whitespace-nowrap"
        >
          {{ s.label }}
        </a>
      </nav>
    </header>

    <div class="kr-container space-y-12 px-4 py-8 sm:px-6">
      <!-- Conventions: the style plan itself -->
      <section id="conventions" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Conventions"
          hint="The style plan. Follow these and components stay consistent across themes without per-file guesswork."
        />
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="kr-panel space-y-3">
            <h3 class="text-smart-heading font-semibold">Surfaces</h3>
            <ul class="space-y-2 text-smart-compact">
              <li class="flex items-center gap-3">
                <span
                  class="inline-block h-5 w-5 rounded bg-base-200 ring-1 ring-base-300"
                />
                <code class="font-mono">base-200</code>
                <span class="opacity-70"
                  >app / page background (the canvas)</span
                >
              </li>
              <li class="flex items-center gap-3">
                <span
                  class="inline-block h-5 w-5 rounded bg-base-100 ring-1 ring-base-300"
                />
                <code class="font-mono">base-100</code>
                <span class="opacity-70"
                  >raised surfaces: panels, cards, headers</span
                >
              </li>
              <li class="flex items-center gap-3">
                <span class="inline-block h-5 w-5 rounded bg-base-300" />
                <code class="font-mono">base-300</code>
                <span class="opacity-70">borders & dividers</span>
              </li>
            </ul>
            <p class="text-smart-caption opacity-60">
              Rule: use primary / secondary / accent for action & emphasis — not
              for plain surfaces. Status colors are for status only.
            </p>
          </div>

          <div class="kr-panel space-y-3">
            <h3 class="text-smart-heading font-semibold">Container classes</h3>
            <ul class="space-y-2 text-smart-compact font-mono">
              <li>
                <code>.kr-page</code>
                <span class="font-sans opacity-70"
                  >— page shell, standard gutter</span
                >
              </li>
              <li>
                <code>.kr-container</code>
                <span class="font-sans opacity-70"
                  >— centered max-w-6xl column</span
                >
              </li>
              <li>
                <code>.kr-container-wide</code>
                <span class="font-sans opacity-70"
                  >— max-w-7xl for dashboards</span
                >
              </li>
              <li>
                <code>.kr-section</code>
                <span class="font-sans opacity-70">— titled block rhythm</span>
              </li>
              <li>
                <code>.kr-panel</code>
                <span class="font-sans opacity-70">— raised card surface</span>
              </li>
              <li>
                <code>.kr-panel-muted</code>
                <span class="font-sans opacity-70"
                  >— recessed nested panel</span
                >
              </li>
              <li>
                <code>.kr-panel-flat</code>
                <span class="font-sans opacity-70"
                  >— flat surface for lists</span
                >
              </li>
            </ul>
            <p class="text-smart-caption opacity-60">
              Defined in <code class="font-mono">assets/css/tailwind.css</code>.
            </p>
          </div>
        </div>
      </section>

      <!-- Design tokens: the shared vocabulary -->
      <section id="tokens" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Design tokens"
          hint="The semantic color vocabulary. Talk to AI in these names, not hex codes — they re-map automatically per theme."
        />
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="token in tokens"
            :key="token.name"
            class="overflow-hidden rounded-xl border border-base-300 bg-base-100"
          >
            <div
              class="flex h-16 items-center justify-center text-smart-caption font-semibold"
              :class="token.swatch"
            >
              {{ token.sample }}
            </div>
            <div class="px-3 py-2">
              <p class="text-smart-caption font-mono font-semibold">
                {{ token.name }}
              </p>
              <p class="text-smart-caption opacity-60">{{ token.use }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section id="type" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Typography"
          hint="Responsive text-smart-* utilities (assets/css/tailwind.css). Prefer these over raw text-* sizes for consistent scaling."
        />
        <div class="kr-panel space-y-2">
          <p class="text-smart-title font-bold">text-smart-title</p>
          <p class="text-smart-heading font-semibold">text-smart-heading</p>
          <p class="text-smart">text-smart — default body copy</p>
          <p class="text-smart-compact">text-smart-compact — dense body copy</p>
          <p class="text-smart-caption opacity-70">
            text-smart-caption — captions & metadata
          </p>
        </div>
      </section>

      <!-- Buttons -->
      <section id="buttons" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Buttons"
          hint="Semantic variants, sizes, and states."
        />
        <div class="kr-panel space-y-4">
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-primary">Primary</button>
            <button class="btn btn-secondary">Secondary</button>
            <button class="btn btn-accent">Accent</button>
            <button class="btn btn-neutral">Neutral</button>
            <button class="btn btn-ghost">Ghost</button>
            <button class="btn btn-link">Link</button>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-info">Info</button>
            <button class="btn btn-success">Success</button>
            <button class="btn btn-warning">Warning</button>
            <button class="btn btn-error">Error</button>
            <button class="btn btn-outline btn-primary">Outline</button>
            <button class="btn btn-primary" disabled>Disabled</button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button class="btn btn-primary btn-xs">xs</button>
            <button class="btn btn-primary btn-sm">sm</button>
            <button class="btn btn-primary">md</button>
            <button class="btn btn-primary btn-lg">lg</button>
            <button class="btn btn-primary">
              <span class="loading loading-spinner loading-sm" />
              Loading
            </button>
          </div>
        </div>
      </section>

      <!-- Badges & indicators -->
      <section id="badges" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Badges & status"
          hint="Compact status and count indicators."
        />
        <div class="kr-panel flex flex-wrap items-center gap-2">
          <span class="badge badge-primary">primary</span>
          <span class="badge badge-secondary">secondary</span>
          <span class="badge badge-accent">accent</span>
          <span class="badge badge-info">info</span>
          <span class="badge badge-success">success</span>
          <span class="badge badge-warning">warning</span>
          <span class="badge badge-error">error</span>
          <span class="badge badge-outline">outline</span>
          <span class="badge badge-ghost">ghost</span>
        </div>
      </section>

      <!-- Alerts -->
      <section id="alerts" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Alerts"
          hint="Inline feedback for the four status intents."
        />
        <div class="space-y-3">
          <div class="alert alert-info">
            <span>Heads up — this is an informational message.</span>
          </div>
          <div class="alert alert-success">
            <span>Saved. Your changes are live.</span>
          </div>
          <div class="alert alert-warning">
            <span>Careful — this action needs review.</span>
          </div>
          <div class="alert alert-error">
            <span>Something went wrong. Try again.</span>
          </div>
        </div>
      </section>

      <!-- Cards -->
      <section id="cards" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Cards"
          hint="The workhorse container for projects, tasks, and dreams."
        />
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="card bg-base-100 shadow-md">
            <div class="card-body">
              <h3 class="card-title text-smart-heading">Project card</h3>
              <p class="text-smart-compact opacity-70">
                A dream with an orderable wishlist of desired features.
              </p>
              <div class="card-actions justify-end">
                <button class="btn btn-primary btn-sm">Open</button>
              </div>
            </div>
          </div>
          <div class="card bg-primary text-primary-content shadow-md">
            <div class="card-body">
              <h3 class="card-title text-smart-heading">Highlighted</h3>
              <p class="text-smart-compact opacity-80">
                Uses primary as the surface with primary-content text.
              </p>
              <div class="card-actions justify-end">
                <button class="btn btn-sm">Act</button>
              </div>
            </div>
          </div>
          <div class="card kr-panel-flat">
            <div class="card-body">
              <h3 class="card-title text-smart-heading">Bordered</h3>
              <p class="text-smart-compact opacity-70">
                Flat kr-panel-flat variant for dense lists and inboxes.
              </p>
              <div class="card-actions justify-end">
                <button class="btn btn-ghost btn-sm">Dismiss</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Form controls -->
      <section id="forms" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Form controls"
          hint="Inputs, toggles, and selects used across creation flows."
        />
        <div class="kr-panel grid gap-6 sm:grid-cols-2">
          <div class="space-y-3">
            <input
              type="text"
              placeholder="Text input"
              class="input input-bordered w-full"
            />
            <textarea
              class="textarea textarea-bordered w-full"
              placeholder="How can I make this look better?"
              rows="3"
            />
            <select class="select select-bordered w-full">
              <option disabled selected>Priority</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div class="space-y-4">
            <label class="flex items-center gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-primary"
                checked
              />
              <span class="text-smart-compact">Checkbox</span>
            </label>
            <label class="flex items-center gap-3">
              <input type="checkbox" class="toggle toggle-primary" checked />
              <span class="text-smart-compact">Toggle</span>
            </label>
            <label class="flex items-center gap-3">
              <input
                type="radio"
                name="r"
                class="radio radio-primary"
                checked
              />
              <span class="text-smart-compact">Radio</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value="60"
              class="range range-primary"
            />
          </div>
        </div>
      </section>

      <!-- Navigation: tabs & breadcrumbs -->
      <section id="nav" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Navigation"
          hint="Tabs and breadcrumbs for in-page and cross-page movement."
        />
        <div class="kr-panel space-y-4">
          <div role="tablist" class="tabs tabs-boxed w-fit">
            <a role="tab" class="tab tab-active">Overview</a>
            <a role="tab" class="tab">Tasks</a>
            <a role="tab" class="tab">Wishlist</a>
          </div>
          <div class="breadcrumbs text-smart-caption">
            <ul>
              <li><a>Projects</a></li>
              <li><a>global-ui</a></li>
              <li>UI Gallery</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Data display: table & stats -->
      <section id="data" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Data display"
          hint="Stats and tables for dashboards and task surfaces."
        />
        <div
          class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow sm:stats-horizontal"
        >
          <div class="stat">
            <div class="stat-title">Ready tasks</div>
            <div class="stat-value text-primary">12</div>
            <div class="stat-desc">across 6 projects</div>
          </div>
          <div class="stat">
            <div class="stat-title">Honeydos</div>
            <div class="stat-value text-secondary">4</div>
            <div class="stat-desc">in your inbox</div>
          </div>
          <div class="stat">
            <div class="stat-title">Kaizens</div>
            <div class="stat-value text-accent">7</div>
            <div class="stat-desc">polish prompts</div>
          </div>
        </div>
        <div class="kr-panel-flat overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Build UI gallery</td>
                <td>global-ui</td>
                <td><span class="badge badge-success badge-sm">done</span></td>
              </tr>
              <tr>
                <td>Wire desired-features list</td>
                <td>global-ui</td>
                <td><span class="badge badge-warning badge-sm">ready</span></td>
              </tr>
              <tr>
                <td>Site-audit agent</td>
                <td>global-ui</td>
                <td><span class="badge badge-ghost badge-sm">claimed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Progress & loaders -->
      <section id="progress" class="scroll-mt-32 kr-section">
        <SectionHeading
          title="Progress & loading"
          hint="Determinate and indeterminate progress states."
        />
        <div class="kr-panel space-y-4">
          <progress
            class="progress progress-primary w-full"
            value="70"
            max="100"
          />
          <progress
            class="progress progress-accent w-full"
            value="30"
            max="100"
          />
          <div class="flex items-center gap-4">
            <span class="loading loading-spinner text-primary" />
            <span class="loading loading-dots text-secondary" />
            <span class="loading loading-ring text-accent" />
          </div>
        </div>
      </section>

      <footer class="pt-4 text-center">
        <p class="text-smart-caption opacity-60">
          Kind Robots · global-ui living style guide · edit
          <code class="font-mono">components/ui/ui-gallery.vue</code> to extend
          it
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { daisyuiThemes } from '@/stores/helpers/themeHelper'

const themeStore = useThemeStore()
const currentTheme = computed(() => themeStore.currentTheme)
const themes = daisyuiThemes

function onThemeChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  themeStore.setActiveTheme(value)
}

const sections = [
  { id: 'conventions', label: 'Conventions' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'type', label: 'Type' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'badges', label: 'Badges' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'cards', label: 'Cards' },
  { id: 'forms', label: 'Forms' },
  { id: 'nav', label: 'Nav' },
  { id: 'data', label: 'Data' },
  { id: 'progress', label: 'Progress' },
]

const tokens = [
  {
    name: 'primary',
    sample: 'Aa',
    use: 'Main actions',
    swatch: 'bg-primary text-primary-content',
  },
  {
    name: 'secondary',
    sample: 'Aa',
    use: 'Secondary actions',
    swatch: 'bg-secondary text-secondary-content',
  },
  {
    name: 'accent',
    sample: 'Aa',
    use: 'Highlights',
    swatch: 'bg-accent text-accent-content',
  },
  {
    name: 'neutral',
    sample: 'Aa',
    use: 'Muted UI',
    swatch: 'bg-neutral text-neutral-content',
  },
  {
    name: 'base-100',
    sample: 'Aa',
    use: 'Surfaces',
    swatch: 'bg-base-100 text-base-content border border-base-300',
  },
  {
    name: 'info',
    sample: 'Aa',
    use: 'Informational',
    swatch: 'bg-info text-info-content',
  },
  {
    name: 'success',
    sample: 'Aa',
    use: 'Positive',
    swatch: 'bg-success text-success-content',
  },
  {
    name: 'warning',
    sample: 'Aa',
    use: 'Caution',
    swatch: 'bg-warning text-warning-content',
  },
  {
    name: 'error',
    sample: 'Aa',
    use: 'Destructive',
    swatch: 'bg-error text-error-content',
  },
  {
    name: 'base-300',
    sample: 'Aa',
    use: 'Borders',
    swatch: 'bg-base-300 text-base-content',
  },
]
</script>
