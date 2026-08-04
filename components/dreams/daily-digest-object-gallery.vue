<template>
  <section
    v-if="items.length"
    class="border-t border-base-300 bg-base-200/25 px-3 py-3 sm:px-4 sm:py-4"
  >
    <header class="flex items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p class="text-[0.65rem] font-black uppercase tracking-[0.16em] text-primary">
          Complete bundle
        </p>
        <div class="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="text-lg font-black">Objects in this Daily Dream</h3>
          <p class="hidden text-xs text-base-content/50 lg:block">
            Open any object for full details, editing, and artwork controls.
          </p>
        </div>
      </div>
      <span class="badge badge-primary badge-sm shrink-0 rounded-lg">
        {{ items.length }} objects
      </span>
    </header>

    <div
      class="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0"
    >
      <article
        v-for="item in items"
        :key="item.key"
        class="group min-w-40 snap-start overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md sm:min-w-44 lg:min-w-0"
      >
        <button
          type="button"
          class="flex min-h-32 w-full flex-col text-left"
          :aria-label="`Open ${item.title}`"
          @click="selectedItem = item"
        >
          <figure class="relative h-16 shrink-0 overflow-hidden bg-base-200">
            <img
              v-if="item.image"
              :src="item.image"
              :alt="`${item.title} artwork`"
              class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div
              v-else
              class="absolute inset-0 flex items-center justify-center gap-2 px-2 text-center text-base-content/30"
            >
              <Icon :name="item.icon" class="size-6 opacity-45" />
              <span class="text-[0.58rem] font-bold uppercase tracking-wide">
                Awaiting art
              </span>
            </div>
            <span
              class="badge badge-neutral badge-xs absolute left-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-md shadow"
            >
              {{ item.role }}
            </span>
          </figure>

          <div class="flex min-h-0 flex-1 flex-col p-2.5">
            <div class="flex items-start gap-1.5">
              <div class="min-w-0 flex-1">
                <p class="truncate text-[0.58rem] font-black uppercase tracking-[0.12em] text-primary/70">
                  {{ item.typeLabel }}
                </p>
                <h4 class="mt-0.5 line-clamp-2 text-sm font-black leading-tight">
                  {{ item.title }}
                </h4>
              </div>
              <Icon
                name="kind-icon:external-link"
                class="mt-0.5 size-3.5 shrink-0 text-base-content/25 transition group-hover:text-primary"
              />
            </div>

            <div v-if="item.meta.length" class="mt-1 flex min-w-0 gap-1">
              <span
                v-for="meta in item.meta.slice(0, 1)"
                :key="meta"
                class="badge badge-ghost badge-xs max-w-full truncate rounded-md"
              >
                {{ meta }}
              </span>
            </div>

            <span class="mt-auto inline-flex items-center gap-1 pt-1.5 text-[0.65rem] font-black text-primary">
              Open details
              <Icon name="kind-icon:chevron-right" class="size-3" />
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
