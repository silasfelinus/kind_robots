<template>
  <section
    v-if="items.length"
    class="border-t border-base-300 bg-base-200/25 p-4 sm:p-6"
  >
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-[0.16em] text-primary">
          Complete bundle
        </p>
        <h3 class="mt-1 text-xl font-black">Objects in this Daily Dream</h3>
        <p class="mt-1 max-w-3xl text-sm leading-relaxed text-base-content/55">
          A compact catalog of the world, place, cast, discoveries, and scenario. Open any object for its full information, editable fields, and artwork workbench.
        </p>
      </div>
      <span class="badge badge-primary h-auto rounded-xl px-3 py-2">
        {{ items.length }} objects
      </span>
    </header>

    <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="item in items"
        :key="item.key"
        class="group overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
      >
        <button
          type="button"
          class="grid h-full w-full grid-cols-[6.5rem_minmax(0,1fr)] text-left sm:grid-cols-[7.5rem_minmax(0,1fr)]"
          :aria-label="`Open ${item.title}`"
          @click="selectedItem = item"
        >
          <figure class="relative min-h-40 overflow-hidden bg-base-200">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="`${item.title} artwork`"
              class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-base-content/30"
            >
              <Icon :name="item.icon" class="size-10 opacity-50" />
              <span class="text-[0.68rem] font-bold uppercase tracking-wide">
                Awaiting art
              </span>
            </div>
            <span
              class="badge badge-neutral badge-sm absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-lg shadow"
            >
              {{ item.role }}
            </span>
          </figure>

          <div class="flex min-w-0 flex-col p-3.5 sm:p-4">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p class="text-[0.68rem] font-black uppercase tracking-[0.13em] text-primary/70">
                  {{ item.typeLabel }}
                </p>
                <h4 class="mt-0.5 line-clamp-2 text-base font-black leading-tight sm:text-lg">
                  {{ item.title }}
                </h4>
              </div>
              <Icon name="kind-icon:external-link" class="mt-1 size-4 shrink-0 text-base-content/30 transition group-hover:text-primary" />
            </div>

            <div v-if="item.meta.length" class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="meta in item.meta"
                :key="meta"
                class="badge badge-ghost badge-sm max-w-full truncate rounded-lg"
              >
                {{ meta }}
              </span>
            </div>

            <p class="mt-2 line-clamp-3 text-xs leading-relaxed text-base-content/60 sm:text-sm">
              {{ item.summary }}
            </p>

            <span class="mt-auto inline-flex items-center gap-1.5 pt-3 text-xs font-black text-primary">
              Open details
              <Icon name="kind-icon:chevron-right" class="size-3.5" />
            </span>
          </div>
        </button>
      </article>
    </div>

    <daily-digest-object-dialog
      v-if="selectedItem"
      :key="selectedItem.key"
      :object-type="selectedItem.objectType"
      :entity="selectedItem.entity"
      @close="selectedItem = null"
      @updated="handleUpdated"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  DailyDreamArchiveEntry,
  DailyDreamArchiveObject,
  DailyDreamArchiveObjectType,
  DailyDreamRelatedDream,
} from '@/stores/dailyDreamArchiveStore'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

type BundleItem = {
  key: string
  objectType: DailyDreamArchiveObjectType
  role: string
  typeLabel: string
  icon: string
  title: string
  summary: string
  image: string
  meta: string[]
  entity: DailyDreamArchiveObject
}

const props = defineProps<{
  dream: DailyDreamArchiveEntry
}>()

const selectedItem = ref<BundleItem | null>(null)

function asEntity(value: unknown): DailyDreamArchiveObject {
  return value as DailyDreamArchiveObject
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function titleFor(
  objectType: DailyDreamArchiveObjectType,
  entity: DailyDreamArchiveObject,
): string {
  if (objectType === 'bot') return text(entity.name) || 'Unnamed narrator'
  if (objectType === 'character') return text(entity.name) || 'Unnamed character'
  if (objectType === 'reward') return text(entity.name) || 'Unnamed discovery'
  return text(entity.title) || `Untitled ${objectType}`
}

function summaryFor(
  objectType: DailyDreamArchiveObjectType,
  entity: DailyDreamArchiveObject,
): string {
  const candidates =
    objectType === 'dream'
      ? [entity.pitch, entity.description, entity.flavorText]
      : objectType === 'character'
        ? [entity.presentation, entity.personality, entity.drive, entity.backstory]
        : objectType === 'reward'
          ? [entity.description, entity.effect, entity.flavorText]
          : objectType === 'scenario'
            ? [entity.description, entity.intros]
            : [entity.subtitle, entity.tagline, entity.description, entity.personality]

  return (
    candidates.map(text).find(Boolean) ||
    'Open this object to inspect its complete record and artwork controls.'
  )
}

function imageFor(entity: DailyDreamArchiveObject): string {
  return (
    resolveEntityArtwork(entity.ArtImage) ||
    resolveEntityArtwork(entity) ||
    text(entity.PitchSheet && (entity.PitchSheet as { imagePath?: unknown }).imagePath) ||
    (entity.artImageId ? `/api/art/images/${entity.artImageId}/file` : '')
  )
}

function metaFor(
  objectType: DailyDreamArchiveObjectType,
  entity: DailyDreamArchiveObject,
): string[] {
  const values: unknown[] = []
  if (objectType === 'dream') {
    values.push(entity.dreamType)
  } else if (objectType === 'character') {
    values.push(entity.species, entity.class, entity.role)
  } else if (objectType === 'reward') {
    values.push(entity.rewardType, entity.rarity)
  } else if (objectType === 'scenario') {
    values.push(entity.tier, entity.genres)
  } else {
    values.push(entity.BotType, entity.subtitle)
  }

  return values.map(text).filter(Boolean).slice(0, 3)
}

function makeItem(
  objectType: DailyDreamArchiveObjectType,
  role: string,
  typeLabel: string,
  icon: string,
  entity: DailyDreamArchiveObject,
): BundleItem {
  return {
    key: `${objectType}:${entity.id}`,
    objectType,
    role,
    typeLabel,
    icon,
    title: titleFor(objectType, entity),
    summary: summaryFor(objectType, entity),
    image: imageFor(entity),
    meta: metaFor(objectType, entity),
    entity,
  }
}

const relatedDreams = computed<DailyDreamRelatedDream[]>(() => {
  const found = new Map<number, DailyDreamRelatedDream>()
  for (const relation of props.dream.RelationsFrom) {
    if (relation.ToDream.id !== props.dream.id) {
      found.set(relation.ToDream.id, relation.ToDream)
    }
  }
  for (const relation of props.dream.RelationsTo) {
    if (relation.FromDream.id !== props.dream.id) {
      found.set(relation.FromDream.id, relation.FromDream)
    }
  }
  return Array.from(found.values())
})

const items = computed<BundleItem[]>(() => [
  makeItem('dream', 'World', 'Dream', 'kind-icon:moon', asEntity(props.dream)),
  ...relatedDreams.value.map((dream) =>
    makeItem('dream', 'Place', 'Dream location', 'kind-icon:map', asEntity(dream)),
  ),
  ...props.dream.Characters.map((character) =>
    makeItem('character', 'Cast', 'Character', 'kind-icon:user', asEntity(character)),
  ),
  ...props.dream.Rewards.map((reward) =>
    makeItem('reward', 'Discovery', 'Reward', 'kind-icon:gift', asEntity(reward)),
  ),
  ...props.dream.Scenarios.map((scenario) =>
    makeItem('scenario', 'Scenario', 'Scenario', 'kind-icon:story', asEntity(scenario)),
  ),
  ...props.dream.Bots.map((bot) =>
    makeItem('bot', 'Narrator', 'Bot', 'kind-icon:robot', asEntity(bot)),
  ),
])

function handleUpdated(): void {
  if (!selectedItem.value) return
  selectedItem.value = {
    ...selectedItem.value,
    title: titleFor(selectedItem.value.objectType, selectedItem.value.entity),
    summary: summaryFor(selectedItem.value.objectType, selectedItem.value.entity),
    image: imageFor(selectedItem.value.entity),
    meta: metaFor(selectedItem.value.objectType, selectedItem.value.entity),
  }
}
</script>
