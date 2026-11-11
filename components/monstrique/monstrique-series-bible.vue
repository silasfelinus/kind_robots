<template>
  <section
    class="mb-bible @container flex h-full min-h-0 w-full flex-col overflow-hidden"
    data-testid="monstrique-series-bible"
  >
    <div class="flex min-h-0 flex-1 flex-col gap-3 p-3 @3xl:flex-row">
      <MonstriqueBibleRoster />

      <article
        v-if="model"
        class="mb-detail flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-content/10 bg-base-200"
      >
        <header class="flex shrink-0 items-center gap-3 p-3">
          <div class="mb-portrait">
            <img v-if="coverOf(model.id)" :src="coverOf(model.id)!" alt="" />
            <MonstriqueCharacterSprite v-else :character="model.id" bust />
          </div>
          <div class="min-w-0 flex-1">
            <p class="mb-eyebrow">
              {{ model.species }} · {{ model.apparentAge }}
            </p>
            <h2 class="truncate text-xl font-black">
              {{ bible.nameOf(model.id) }}
            </h2>
            <p class="truncate text-xs opacity-70">{{ model.role }}</p>
          </div>
        </header>
        <div class="flex shrink-0 gap-1 px-3" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            role="tab"
            class="mb-tab"
            :aria-selected="pane === tab.id"
            :data-testid="'bible-tab-' + tab.id"
            @click="pane = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="kr-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <div v-if="pane === 'sheet'" class="space-y-4">
            <label class="mb-field">
              <span class="mb-eyebrow">Display name</span>
              <div class="flex gap-2">
                <input
                  v-model="draftName"
                  class="input input-sm input-bordered min-w-0 flex-1"
                  :placeholder="model.name"
                  data-testid="bible-rename"
                />
                <button
                  type="button"
                  class="btn btn-sm btn-primary"
                  :disabled="bible.saving"
                  @click="saveName"
                >
                  Rename
                </button>
              </div>
              <small class="opacity-60"
                >Canonical: {{ model.name }} · LoRA trigger
                {{ model.lora.trigger }}</small
              >
            </label>
            <p v-if="model.bio" class="leading-relaxed">{{ model.bio }}</p>
            <dl class="mb-sheet">
              <dt>Silhouette</dt>
              <dd>{{ model.silhouette }}</dd>
              <dt>Identity</dt>
              <dd>
                <ul>
                  <li v-for="trait in model.identity" :key="trait">
                    {{ trait }}
                  </li>
                </ul>
              </dd>
              <dt>Wardrobe</dt>
              <dd>{{ model.wardrobe }}</dd>
              <dt>Acting</dt>
              <dd>{{ model.acting }}</dd>
              <dt>Expressions</dt>
              <dd>
                {{ model.expressions.map((entry) => entry.id).join(' · ') }}
              </dd>
              <dt>Never draw</dt>
              <dd>{{ model.never.join(', ') || '—' }}</dd>
              <template v-if="model.canonNotes?.length">
                <dt>Running jokes and canon</dt>
                <dd>
                  <ul>
                    <li v-for="note in model.canonNotes" :key="note">
                      {{ note }}
                    </li>
                  </ul>
                </dd>
              </template>
            </dl>
          </div>

          <div v-else-if="pane === 'art'" class="space-y-4">
            <div class="mb-request space-y-2">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="kind in requestKinds"
                  :key="kind.id"
                  type="button"
                  class="btn btn-xs"
                  :class="artKind === kind.id ? 'btn-primary' : 'btn-ghost'"
                  @click="artKind = kind.id"
                >
                  {{ kind.label }}
                </button>
              </div>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="lane in BIBLE_LANES"
                  :key="lane.key"
                  class="mb-lane"
                >
                  <input
                    v-model="lanes"
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    :value="lane.key"
                  />
                  {{ lane.label }}
                </label>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="bible.saving || !lanes.length"
                data-testid="bible-request-art"
                @click="requestArt(artKind)"
              >
                Queue {{ lanes.length }} render{{
                  lanes.length === 1 ? '' : 's'
                }}
              </button>
            </div>
            <section v-for="group in galleryGroups" :key="group.kind">
              <h3 class="mb-eyebrow pb-2">
                {{ kindLabel(group.kind) }} · {{ group.items.length }}
              </h3>
              <div class="mb-gallery">
                <figure
                  v-for="item in group.items"
                  :key="item.jobId"
                  class="mb-tile"
                  :class="{
                    'is-hero': item.artImageId === entry?.heroArtImageId,
                  }"
                >
                  <img
                    v-if="item.imagePath"
                    :src="item.imagePath"
                    :alt="bible.nameOf(model.id) + ', ' + item.lane"
                    loading="lazy"
                  />
                  <span v-else class="mb-pending">{{ item.status }}</span>
                  <figcaption>
                    <span>{{ laneLabel(item.lane) }}</span>
                    <button
                      v-if="item.artImageId"
                      type="button"
                      class="btn btn-ghost btn-xs"
                      @click="setHero(item.artImageId)"
                    >
                      Hero
                    </button>
                  </figcaption>
                </figure>
              </div>
            </section>
            <p v-if="!galleryGroups.length" class="opacity-60">
              Nothing requested yet. Pick a kind and lanes above.
            </p>
          </div>

          <div v-else-if="pane === 'lora'" class="space-y-4">
            <p>
              Identity LoRA trained on ten style-neutral model-sheet renders, so
              it stacks with the 2D, pixel and 3D styles. Trigger
              <code>{{ model.lora.trigger }}</code
              >.
            </p>
            <label class="mb-field">
              <span class="mb-eyebrow">Status</span>
              <select
                v-model="draftLoraStatus"
                class="select select-sm select-bordered"
              >
                <option
                  v-for="status in LORA_STATUSES"
                  :key="status"
                  :value="status"
                >
                  {{ status }}
                </option>
              </select>
            </label>
            <label class="mb-field">
              <span class="mb-eyebrow">Trained resource name</span>
              <input
                v-model="draftLoraResource"
                class="input input-sm input-bordered"
                placeholder="mnstq_iris_v1.safetensors"
              />
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-sm"
                :disabled="bible.saving"
                @click="saveLora"
              >
                Save LoRA status
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="bible.saving"
                data-testid="bible-request-lora"
                @click="requestArt('lora-dataset')"
              >
                Request dataset renders
              </button>
            </div>
          </div>

          <div v-else class="space-y-2">
            <textarea
              v-model="draftNotes"
              class="textarea textarea-bordered min-h-64 w-full"
              placeholder="Writers' notes, voice, running jokes, continuity…"
              data-testid="bible-notes"
            />
            <button
              type="button"
              class="btn btn-sm btn-primary"
              :disabled="bible.saving"
              @click="saveNotes"
            >
              Save notes
            </button>
          </div>
        </div>
        <p
          v-if="bible.message"
          class="shrink-0 border-t border-base-content/10 px-3 py-2 text-sm"
          role="status"
        >
          {{ bible.message }}
        </p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMonstriqueBibleStore } from '~/stores/monstriqueBibleStore'
import {
  BIBLE_ART_KINDS,
  BIBLE_LANES,
  LORA_STATUSES,
  type BibleArtKind,
  type LoraStatus,
} from '~/utils/monstrique/bibleLanes'
import {
  CHARACTER_MODELS,
  type MonstriqueCharacterId,
} from '~/utils/monstrique/characterModels'

const bible = useMonstriqueBibleStore()
const tabs = [
  { id: 'sheet', label: 'Sheet' },
  { id: 'art', label: 'Art' },
  { id: 'lora', label: 'LoRA' },
  { id: 'notes', label: 'Notes' },
] as const
const pane = ref<(typeof tabs)[number]['id']>('sheet')
const artKind = ref<BibleArtKind>('portrait')
const lanes = ref<string[]>(['arthemy', 'krea2'])
const draftName = ref('')
const draftNotes = ref('')
const draftLoraStatus = ref<LoraStatus>('dataset-needed')
const draftLoraResource = ref('')

const model = computed(() => CHARACTER_MODELS[bible.selectedKey])
const entry = computed(() => bible.selected)
const requestKinds = computed(() =>
  BIBLE_ART_KINDS.filter(
    (kind) =>
      kind.id !== 'lora-dataset' &&
      (!kind.monsterStarsOnly || model.value.monsterStar),
  ),
)
const galleryGroups = computed(() => {
  const items = entry.value?.gallery ?? []
  const kinds = [...new Set(items.map((item) => item.kind))]
  return kinds.map((kind) => ({
    kind,
    items: items.filter((item) => item.kind === kind),
  }))
})

function coverOf(key: MonstriqueCharacterId): string | null {
  return bible.coverOf(key)
}

function kindLabel(kind: string): string {
  return BIBLE_ART_KINDS.find((entry) => entry.id === kind)?.label ?? kind
}

function laneLabel(lane: string): string {
  return BIBLE_LANES.find((entry) => entry.key === lane)?.label ?? lane
}

function syncDrafts(): void {
  draftName.value = entry.value?.displayName ?? ''
  draftNotes.value = entry.value?.notes ?? ''
  draftLoraStatus.value = entry.value?.loraStatus ?? 'dataset-needed'
  draftLoraResource.value = entry.value?.loraResourceName ?? ''
  if (!requestKinds.value.some((kind) => kind.id === artKind.value))
    artKind.value = 'portrait'
}

watch(() => [bible.selectedKey, bible.characters], syncDrafts)
onMounted(async () => {
  await bible.load()
  syncDrafts()
})

function saveName(): void {
  void bible.save(bible.selectedKey, {
    displayName: draftName.value.trim() || null,
  })
}

function saveNotes(): void {
  void bible.save(bible.selectedKey, { notes: draftNotes.value })
}

function saveLora(): void {
  void bible.save(bible.selectedKey, {
    loraStatus: draftLoraStatus.value,
    loraResourceName: draftLoraResource.value.trim() || null,
  })
}

function setHero(artImageId: number): void {
  void bible.save(bible.selectedKey, { heroArtImageId: artImageId })
}

function requestArt(kind: BibleArtKind): void {
  void bible.requestArt(bible.selectedKey, kind, lanes.value)
}
</script>

<style scoped>
.mb-bible {
  background:
    radial-gradient(circle at 85% 0%, #e3477f22, transparent 40%),
    var(--color-base-300);
}
.mb-eyebrow {
  font-size: 0.62rem;
  font-weight: 850;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.7;
}
.mb-portrait {
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0.9rem;
  background: #2a1d3a;
}
.mb-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mb-tab {
  padding: 0.4rem 0.8rem;
  border-radius: 0.6rem 0.6rem 0 0;
  font-size: 0.8rem;
  font-weight: 800;
  opacity: 0.65;
}
.mb-tab[aria-selected='true'] {
  opacity: 1;
  background: var(--color-base-100);
}
.mb-field {
  display: grid;
  gap: 0.3rem;
}
.mb-sheet {
  display: grid;
  gap: 0.25rem 1rem;
}
.mb-sheet dt {
  font-size: 0.65rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.6;
  padding-top: 0.5rem;
}
.mb-sheet ul {
  list-style: disc;
  padding-left: 1.1rem;
}
.mb-lane {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
}
.mb-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.6rem;
}
.mb-tile {
  overflow: hidden;
  border-radius: 0.9rem;
  border: 2px solid transparent;
  background: var(--color-base-300);
}
.mb-tile.is-hero {
  border-color: var(--color-primary);
}
.mb-tile img,
.mb-pending {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 832 / 1216;
  object-fit: cover;
  font-size: 0.7rem;
  font-weight: 800;
  opacity: 0.85;
}
.mb-tile figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.25rem 0.4rem;
  font-size: 0.68rem;
}
</style>
