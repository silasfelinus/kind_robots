<!-- /pages/play/aquarium/browse/[username]/[slug].vue
     One public tank, unauthenticated, read-only (cthulhuquarium/t-014).
     Addressed by (username, slug) together -- Aquarium.slug is unique per
     owner, not globally (see server/utils/aquarium.ts's own comment on
     this). Backed by GET /api/aquarium/browse/[username]/[slug]
     (cthulhuquarium/t-009). No feeding, no clicking, no writes of any kind
     -- this page never calls a mutating endpoint. -->
<template>
  <main class="kr-surface bg-base-200/40">
    <div
      class="kr-scroll kr-container max-w-4xl space-y-5 px-3 py-5 sm:px-6 sm:py-8"
    >
      <nav>
        <NuxtLink
          to="/play/aquarium/browse"
          class="btn btn-ghost btn-sm rounded-xl"
        >
          <Icon name="kind-icon:arrow-left" class="size-4" />
          Public tanks
        </NuxtLink>
      </nav>

      <div
        v-if="loading && !tank"
        class="grid min-h-[50vh] place-items-center rounded-3xl border border-base-300 bg-base-100"
      >
        <div class="text-center">
          <span class="loading loading-ring loading-lg text-primary" />
          <p class="mt-3 text-sm font-bold text-base-content/55">
            Peering into the tank…
          </p>
        </div>
      </div>

      <div
        v-else-if="errorMessage && !tank"
        class="rounded-3xl border border-error/30 bg-error/10 p-8 text-center"
      >
        <Icon name="kind-icon:warning" class="mx-auto size-10 text-error" />
        <p class="mt-3 text-xl font-black">Tank unavailable</p>
        <p class="mt-2 text-sm text-base-content/65">{{ errorMessage }}</p>
        <p class="mt-2 text-xs text-base-content/45">
          Either this tank doesn't exist, or its owner has kept it private.
        </p>
      </div>

      <template v-else-if="tank">
        <header
          class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-lg sm:p-7"
        >
          <div class="flex items-center gap-3">
            <div
              class="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-base-300 bg-base-200"
            >
              <img
                v-if="tank.User.avatarImage"
                :src="normalizeImagePath(tank.User.avatarImage)"
                :alt="tank.User.username"
                class="h-full w-full object-cover"
              />
              <Icon
                v-else
                name="kind-icon:user"
                class="size-6 text-primary/60"
              />
            </div>
            <div class="min-w-0">
              <p
                class="text-xs font-black uppercase tracking-widest text-primary"
              >
                @{{ tank.User.username }}'s tank
              </p>
              <h2 class="truncate text-2xl font-black sm:text-3xl">
                {{ tank.title }}
              </h2>
            </div>
          </div>
          <p
            class="mt-4 text-xs font-bold uppercase tracking-wide text-base-content/45"
          >
            Read-only -- visiting doesn't feed, clean, or change anything here.
          </p>
        </header>

        <!-- Decor (cthulhuquarium/t-017): "visible to visitors browsing that
             tank". This page has no canvas -- introducing one just for decor
             would be disproportionate to a static read-only listing, so the
             minimum-diff match is a simple absolutely-positioned overlay
             using the exact same x/y percentage contract the owner's own
             canvas places against. -->
        <section
          v-if="tank.Decor.length"
          class="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-base-300 bg-[#04100f]"
          aria-hidden="true"
        >
          <span
            v-for="decor in tank.Decor"
            :key="decor.id"
            class="absolute -translate-x-1/2 -translate-y-1/2 text-3xl"
            :style="{ left: `${decor.x}%`, top: `${decor.y}%` }"
          >
            {{ decorIcon(decor.kind) }}
          </span>
        </section>

        <section
          v-if="tank.Stock.length"
          class="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-3"
        >
          <div
            v-for="entry in tank.Stock"
            :key="entry.id"
            class="flex items-center gap-3 kr-panel-flat p-3 shadow-sm"
          >
            <kr-art-plate
              :source="entry.Monster"
              variant="icon"
              shape="plate"
              frame="thin"
              fit="cover"
              class="size-12 shrink-0"
              placeholder-icon="kind-icon:fish"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-bold">
                {{ entry.nickname || entry.Monster.name }}
              </p>
              <p class="truncate text-xs italic opacity-60">
                {{ entry.Monster.species || 'Unknown species' }}
              </p>
            </div>
          </div>
        </section>

        <section
          v-else
          class="rounded-3xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center"
        >
          <Icon name="kind-icon:fish" class="mx-auto size-12 text-primary/40" />
          <p class="mt-3 text-sm text-base-content/60">
            Nothing in this tank yet.
          </p>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { performFetch } from '@/stores/utils'

interface PublicTankMonster {
  id: number
  name: string
  slug: string
  species: string | null
  size: number
  icon: string | null
  iconPath: string | null
  cardPath: string | null
}

interface PublicTankStock {
  id: number
  nickname: string | null
  hunger: number
  mood: string | null
  placedAt: string
  Monster: PublicTankMonster
}

interface PublicTankOwner {
  username: string
  avatarImage: string | null
}

// cthulhuquarium/t-017: one placed decor object. x/y are percentages (0-100)
// of the tank, same contract the owner's own canvas places against -- kept
// local rather than imported from the store since this page is
// unauthenticated and doesn't use the tank store at all.
interface PublicTankDecor {
  id: number
  kind: string
  x: number
  y: number
  zIndex: number
}

interface PublicTankDetail {
  slug: string
  title: string
  coins: number
  backgroundKey: string | null
  debrisLevel: number
  sizeCap: number
  setSlotsCap: number
  updatedAt: string
  User: PublicTankOwner
  Stock: PublicTankStock[]
  Decor: PublicTankDecor[]
}

// Mirrors cthulhuquarium-game.vue's own DECOR_ICONS -- must stay in sync
// with server/utils/aquariumEconomy.ts's DECOR_CATALOG icons by hand, same
// convention as everywhere else the client mirrors a server-owned constant.
const DECOR_ICONS: Record<string, string> = {
  pebble_bed: '🪨',
  driftwood: '🪵',
  coral_spire: '🪸',
  sunken_chest: '🧰',
  glow_kelp: '🌿',
  ceramic_ruin: '🏺',
}

function decorIcon(kind: string): string {
  return DECOR_ICONS[kind] ?? '❖'
}

const route = useRoute()
const tank = ref<PublicTankDetail | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let requestSequence = 0

const username = computed(() => String(route.params.username || '').trim())
const slug = computed(() => String(route.params.slug || '').trim())

useHead(() => ({
  title: tank.value
    ? `${tank.value.title} · @${tank.value.User.username} · Cthulhuquarium`
    : 'Public tank · Cthulhuquarium',
}))

function normalizeImagePath(value: string): string {
  if (value.startsWith('/') || value.startsWith('http')) return value
  return `/images/${value}`
}

async function loadTank(): Promise<void> {
  if (!username.value || !slug.value) return

  const sequence = ++requestSequence
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await performFetch<PublicTankDetail>(
      `/api/aquarium/browse/${encodeURIComponent(username.value)}/${encodeURIComponent(slug.value)}`,
    )

    if (sequence !== requestSequence) return

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Could not load this tank.')
    }

    tank.value = response.data
  } catch (error: unknown) {
    if (sequence !== requestSequence) return
    errorMessage.value =
      error instanceof Error ? error.message : 'Could not load this tank.'
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

watch([username, slug], loadTank)
onMounted(loadTank)
</script>
