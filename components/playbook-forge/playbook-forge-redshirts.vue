<template>
  <section
    class="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3"
    aria-label="Space Couch redshirt atlas"
  >
    <header class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p class="pf-kicker text-secondary">
          Space Couch · The Drawer of Infinite Replacements
        </p>
        <p class="pf-display text-2xl @3xl:text-4xl">The 100 redshirts</p>
        <p class="text-xs opacity-75">
          {{ REDSHIRT_ROSTER.length }} unique recruits ·
          {{ renderedCount }} concept portraits rendered here ·
          {{ EXPEDITION_ENCOUNTERS.length }} expedition encounters
        </p>
      </div>
      <button
        type="button"
        data-nav
        class="btn btn-sm btn-ghost pf-focusable"
        @click="forge.back()"
      >
        Back to the Forge
      </button>
    </header>

    <div
      class="kr-scroll grid min-h-0 content-start items-start gap-3 @4xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]"
    >
      <div class="flex min-h-0 flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="query"
            class="pf-field min-w-0 flex-1 text-sm"
            aria-label="Search redshirts"
            placeholder="Find a recruit, alien design, history or power"
          />
          <select
            v-model="talent"
            class="pf-field max-w-32 text-sm"
            aria-label="Filter by talent"
          >
            <option value="all">All talents</option>
            <option v-for="skill in skills" :key="skill" :value="skill">
              {{ skill }}
            </option>
          </select>
        </div>
        <details class="pf-help">
          <summary class="pf-display cursor-pointer text-base">
            Ideas for the entire redshirt corps
          </summary>
          <p class="mt-1 text-xs opacity-75">
            Change the casting philosophy, story threads or alien design
            language for all 100 without overriding any one recruit.
          </p>
          <textarea
            v-model="overallIdea"
            class="pf-field mt-2 w-full text-sm"
            rows="3"
            maxlength="4000"
            aria-label="Overall redshirt roster direction"
            placeholder="For example: give every seventh recruit an unexpected tie to the other crews' personal quests."
          />
          <button
            type="button"
            data-nav
            class="btn btn-secondary btn-sm pf-focusable mt-2"
            :disabled="!overallIdea.trim() || atlas.posting"
            @click="sendOverall"
          >
            Send overall direction to GitHub
          </button>
        </details>
        <p class="pf-kicker text-xs opacity-70">
          {{ filtered.length }} recruits · one unique biography and prompt each
        </p>
        <div class="min-w-0 flex-1 pr-1" aria-label="Redshirt roster">
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,11rem),1fr))] gap-2"
          >
            <button
              v-for="person in filtered"
              :key="person.id"
              type="button"
              data-nav
              class="pf-art-card pf-focusable relative overflow-hidden text-left"
              :class="selectedId === person.id ? 'pf-art-card-on' : ''"
              :aria-pressed="selectedId === person.id"
              @click="selectedId = person.id"
            >
              <span class="pf-art-card-frame relative block h-32">
                <img
                  v-if="atlas.portraits[person.id]?.imageUrl"
                  :src="atlas.portraits[person.id]?.imageUrl ?? ''"
                  :alt="person.name + ' portrait concept'"
                  class="pf-art-card-img"
                />
                <span
                  v-else
                  class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-base-300/85 px-2 text-center"
                >
                  <span class="pf-display text-2xl text-primary/70">{{
                    person.id
                  }}</span>
                  <span class="text-xs leading-snug opacity-85">{{
                    person.anatomy
                  }}</span>
                  <span class="pf-kicker text-[0.6rem] text-secondary"
                    >Portrait pending</span
                  >
                </span>
              </span>
              <span class="block px-2 py-2">
                <span class="pf-display block truncate text-base">{{
                  person.name
                }}</span>
                <span class="pf-kicker block text-[0.6rem] text-secondary"
                  >{{ person.talent }} · {{ person.id }}</span
                >
              </span>
            </button>
          </div>
        </div>
      </div>

      <aside
        v-if="selected && working"
        class="pf-panel min-h-0 space-y-3 p-3 @4xl:p-4"
        aria-label="Selected redshirt details"
      >
        <div
          class="grid grid-cols-[minmax(6rem,0.65fr)_minmax(0,1.35fr)] gap-3"
        >
          <div
            class="relative aspect-[3/4] overflow-hidden rounded-lg bg-base-300"
          >
            <img
              v-if="atlas.portraits[selected.id]?.imageUrl"
              :src="atlas.portraits[selected.id]?.imageUrl ?? ''"
              :alt="selected.name + ' portrait concept'"
              class="size-full object-cover"
            />
            <span
              v-else
              class="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-xs"
            >
              <span class="pf-display text-3xl text-secondary">{{
                selected.id
              }}</span>
              <span>{{ selected.anatomy }}</span>
              <span class="opacity-65">Original art not delivered</span>
            </span>
          </div>
          <div class="space-y-2">
            <p class="pf-kicker text-secondary">
              {{ selected.id }} · {{ selected.talent }} specialist
            </p>
            <h3 class="pf-display text-2xl">{{ selected.name }}</h3>
            <p class="text-sm">{{ selected.history }}</p>
            <p class="text-sm">
              <strong>Secret:</strong> {{ selected.secretPower }}
            </p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="(rating, skill) in selected.stats"
                :key="skill"
                class="rounded bg-base-300 px-1.5 py-1 text-[0.68rem]"
              >
                {{ skill }} {{ rating }}
              </span>
            </div>
          </div>
        </div>

        <div class="pf-help flex flex-col gap-2">
          <p class="pf-kicker text-secondary">Portrait production</p>
          <p class="text-xs leading-snug">{{ portraitPreview }}</p>
          <p class="text-xs opacity-75">
            Rendered concepts are saved in this browser. They count as game art
            only after being delivered and wired to the Space Couch manifest.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              data-nav
              class="btn btn-primary btn-sm pf-focusable"
              :disabled="atlas.posting || isRendering"
              @click="atlas.render(selected.id)"
            >
              {{
                atlas.portraits[selected.id]
                  ? 'New concept render'
                  : 'Render portrait with Krea 2'
              }}
            </button>
            <button
              v-if="atlas.portraits[selected.id]"
              type="button"
              data-nav
              class="btn btn-ghost btn-sm pf-focusable"
              @click="atlas.refresh(selected.id)"
            >
              Check ArtJob #{{ atlas.portraits[selected.id]?.id }}
            </button>
          </div>
          <p v-if="atlas.portraits[selected.id]" class="text-xs">
            ArtJob {{ atlas.portraits[selected.id]?.id }} ·
            {{ atlas.portraits[selected.id]?.status }}
          </p>
        </div>

        <details class="pf-help" open>
          <summary class="pf-display cursor-pointer text-lg">
            Expedition / quest intersections · {{ links.length }}
          </summary>
          <p class="mb-2 text-xs opacity-70">
            Actual deployable encounters requiring {{ selected.talent }}. The
            secret ability activates on this skill. These are shared mission
            cards, not authored personal arcs.
          </p>
          <ul class="space-y-2 pr-1">
            <li
              v-for="encounter in links"
              :key="encounter.id"
              class="border-b border-base-content/10 pb-2 text-sm"
            >
              <strong>{{ encounter.title }}</strong>
              <span class="ml-1 text-xs opacity-65"
                >{{ encounter.scope }} · {{ encounter.priority }} ·
                {{ encounter.id }}</span
              >
              <p class="text-xs opacity-80">{{ encounter.setup }}</p>
              <p class="mt-1 text-xs text-secondary">
                Redshirt consequence: {{ encounter.outcome }}
              </p>
            </li>
          </ul>
        </details>

        <div class="pf-help space-y-2">
          <p class="pf-kicker text-secondary">
            Propose an edit to this recruit
          </p>
          <label class="block text-xs"
            >Name<input
              v-model="working.name"
              class="pf-field mt-1 w-full text-sm"
              maxlength="120"
          /></label>
          <label class="block text-xs"
            >Alien design / anatomy<textarea
              v-model="working.anatomy"
              rows="2"
              class="pf-field mt-1 w-full text-sm"
              maxlength="500"
            />
          </label>
          <label class="block text-xs"
            >Biography<textarea
              v-model="working.history"
              rows="2"
              class="pf-field mt-1 w-full text-sm"
              maxlength="800"
            />
          </label>
          <label class="block text-xs"
            >Hidden ability<textarea
              v-model="working.secretPower"
              rows="2"
              class="pf-field mt-1 w-full text-sm"
              maxlength="500"
            />
          </label>
          <p class="text-xs opacity-70">
            {{ changes.length }} proposed changes. Edits auto-save in this
            browser; submitting requests agents to update the game's canonical
            roster.
          </p>
          <button
            type="button"
            data-nav
            class="btn btn-secondary btn-sm pf-focusable"
            :disabled="!changes.length || atlas.posting"
            @click="submit('edit')"
          >
            Submit proposed edits
          </button>
        </div>

        <div class="pf-help space-y-2">
          <p class="pf-kicker text-secondary">
            Connect an existing Kind Robots design
          </p>
          <p class="text-xs opacity-75">
            A Character link casts that character as this redshirt. A Facet,
            Location or Reward link provides inspiration for a redesign.
          </p>
          <div
            class="flex flex-wrap gap-1"
            role="group"
            aria-label="Reference category"
          >
            <button
              v-for="tab in referenceTabs"
              :key="tab.id"
              type="button"
              data-nav
              class="pf-tab pf-focusable"
              :class="sourceTab === tab.id ? 'pf-tab-on' : ''"
              @click="chooseTab(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>
          <input
            v-model="sourceSearch"
            class="pf-field w-full text-sm"
            aria-label="Find an existing reference"
            placeholder="Search existing designs"
          />
          <p v-if="forge.catalogLoading === sourceTab" class="text-xs">
            Loading {{ sourceTab }}…
          </p>
          <p v-else-if="forge.catalogError" class="text-xs text-error">
            {{ forge.catalogError }}
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in sourcesShown"
              :key="item.key"
              type="button"
              data-nav
              class="pf-art-card pf-focusable flex items-center gap-2 p-1 text-left"
              :class="working.referenceKey === item.key ? 'pf-art-card-on' : ''"
              @click="connect(item)"
            >
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                alt=""
                class="size-12 shrink-0 rounded object-cover"
              />
              <span class="min-w-0 truncate text-xs"
                >{{ item.title
                }}<span class="block truncate opacity-60">{{
                  item.label
                }}</span></span
              >
            </button>
          </div>
          <button
            v-if="sourceLimit < sources.length"
            type="button"
            class="btn btn-ghost btn-xs"
            @click="sourceLimit += 12"
          >
            Show more ({{ sources.length - sourceLimit }} left)
          </button>
          <div
            v-if="working.referenceKey"
            class="flex items-center justify-between gap-2 rounded border border-secondary/40 p-2 text-xs"
          >
            <span
              >Linked: {{ working.referenceTitle }} ({{
                working.referenceTab
              }})</span
            >
            <button
              type="button"
              class="btn btn-xs btn-ghost"
              @click="clearReference"
            >
              Remove
            </button>
          </div>
          <label
            v-if="working.referenceTab === 'characters'"
            class="block text-xs"
            >Relationship
            <select
              v-model="working.intent"
              class="pf-field mt-1 w-full text-sm"
            >
              <option value="appearance">Appear as this redshirt</option>
              <option value="redesign">Appearance inspiration only</option>
            </select>
          </label>
          <label class="block text-xs"
            >Overall ideas, comments or redesign request
            <textarea
              v-model="working.note"
              rows="3"
              class="pf-field mt-1 w-full text-sm"
              maxlength="2000"
              placeholder="Example: use the kangaroo Facet to redesign the alien's spring-powered silhouette while keeping their red uniform and biography."
            />
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              data-nav
              class="btn btn-primary btn-sm pf-focusable"
              :disabled="
                atlas.posting || (!working.note.trim() && !working.referenceKey)
              "
              @click="submit('design')"
            >
              Request redesign
            </button>
            <button
              type="button"
              data-nav
              class="btn btn-ghost btn-sm pf-focusable"
              :disabled="atlas.posting || !working.note.trim()"
              @click="submit('comment')"
            >
              Comment
            </button>
          </div>
          <p class="text-xs opacity-70">
            Every submission goes to Space Couch's GitHub master issue with the
            redshirt ID, linked entity ID, specific relationship and proposed
            changes.
          </p>
        </div>
        <p v-if="atlas.status" role="status" class="pf-help text-xs">
          {{ atlas.status }}
        </p>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import { usePlaybookForgeRedshirtsStore } from '~/stores/playbookForgeRedshirtsStore'
import {
  REDSHIRT_ROSTER,
  redshirtChanges,
  redshirtQuestLinks,
  redshirtPortraitPrompt,
  type RedshirtAction,
  type RedshirtDraft,
} from '~/utils/playbookForge/redshirtAtlas'
import { EXPEDITION_ENCOUNTERS } from '~/utils/gameOfCaptains/expedition'
import type { CatalogItem, CatalogTab } from '~/utils/playbookForge/catalog'

const forge = usePlaybookForgeStore()
const atlas = usePlaybookForgeRedshirtsStore()
const selectedId = ref(REDSHIRT_ROSTER[0]?.id ?? '')
const selected = computed(() =>
  REDSHIRT_ROSTER.find((person) => person.id === selectedId.value),
)
const working = ref<RedshirtDraft | null>(null)
const query = ref('')
const overallIdea = ref('')
const talent = ref('all')
const skills = ['rescue', 'science', 'diplomacy', 'tactics', 'luck', 'culture']
const sourceTab = ref<CatalogTab>('facets')
const referenceTabs = [
  { id: 'facets', label: 'Facet' },
  { id: 'characters', label: 'Character' },
  { id: 'locations', label: 'Location' },
  { id: 'rewards', label: 'Reward' },
] as const
const sourceSearch = ref('')
const sourceLimit = ref(12)
const filtered = computed(() =>
  REDSHIRT_ROSTER.filter(
    (p) =>
      (talent.value === 'all' || p.talent === talent.value) &&
      [p.name, p.anatomy, p.history, p.secretPower, p.id]
        .join(' ')
        .toLowerCase()
        .includes(query.value.trim().toLowerCase()),
  ),
)
const links = computed(() =>
  selected.value ? redshirtQuestLinks(selected.value) : [],
)
const changes = computed(() =>
  selected.value && working.value
    ? redshirtChanges(selected.value, working.value)
    : [],
)
const portraitPreview = computed(() =>
  selected.value && working.value
    ? redshirtPortraitPrompt(selected.value, working.value)
    : '',
)
const renderedCount = computed(
  () => Object.values(atlas.portraits).filter((p) => !!p.imageUrl).length,
)
const isRendering = computed(() =>
  ['QUEUED', 'RUNNING'].includes(
    atlas.portraits[selectedId.value]?.status ?? '',
  ),
)
const sources = computed(() =>
  (forge.catalog[sourceTab.value] ?? []).filter((item) =>
    [item.title, item.label, item.blurb]
      .join(' ')
      .toLowerCase()
      .includes(sourceSearch.value.trim().toLowerCase()),
  ),
)
const sourcesShown = computed(() => sources.value.slice(0, sourceLimit.value))

watch(
  selectedId,
  (id) => {
    working.value = atlas.forPerson(id)
  },
  { immediate: true },
)
watch(
  working,
  (draft) => {
    if (draft && selectedId.value) atlas.save(selectedId.value, draft)
  },
  { deep: true },
)
watch(sourceSearch, () => {
  sourceLimit.value = 12
})
function chooseTab(tab: CatalogTab) {
  sourceTab.value = tab
  sourceLimit.value = 12
  void forge.loadCatalog(tab)
}
function connect(item: CatalogItem) {
  if (!working.value) return
  working.value.referenceKey = item.key
  working.value.referenceTitle = item.title
  working.value.referenceTab = item.tab
  working.value.intent = item.tab === 'characters' ? 'appearance' : 'redesign'
}
function clearReference() {
  if (!working.value) return
  working.value.referenceKey = ''
  working.value.referenceTitle = ''
  working.value.referenceTab = ''
}
async function sendOverall() {
  if (await atlas.submitRosterDirection(overallIdea.value))
    overallIdea.value = ''
}
async function submit(action: RedshirtAction) {
  if (working.value) await atlas.submit(selectedId.value, working.value, action)
}
onMounted(() => {
  atlas.load()
  working.value = atlas.forPerson(selectedId.value)
  void forge.loadCatalog(sourceTab.value)
})
</script>
