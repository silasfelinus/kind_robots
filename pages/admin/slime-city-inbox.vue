<template>
  <main
    class="kr-surface flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3"
    data-testid="slime-city-inbox"
  >
    <header-page-bar console-theme="slime-city">
      <nav class="flex items-center gap-3 text-sm font-bold">
        <NuxtLink to="/play/slime-city">SLIME CITY</NuxtLink>
        <strong>VS. MATCHES</strong>
        <button type="button" class="btn btn-sm" @click="refresh">
          REFRESH
        </button>
      </nav>
    </header-page-bar>
    <section class="flex items-center justify-between gap-3">
      <div>
        <strong class="text-2xl font-black uppercase">VS. MATCHES</strong>
        <p class="text-sm opacity-75">
          Private multiplayer preview · your turns, invites and history
        </p>
      </div>
      <NuxtLink class="btn btn-primary" to="/admin/slime-city-pvp"
        >NEW DUEL</NuxtLink
      >
    </section>
    <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    <p v-else-if="loading" role="status">Checking the alleys…</p>
    <p v-else-if="!games.length">
      No duels yet. Start a match and invite another preview player.
    </p>
    <div
      v-else
      class="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3"
    >
      <NuxtLink
        v-for="game in games"
        :key="game.id"
        :to="{ path: '/admin/slime-city-pvp', query: { duel: game.id } }"
        class="flex min-h-24 items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-3 transition hover:border-primary"
      >
        <SlimeCityArtwork
          :image-id="slimeArtId('crews', game.team)"
          :alt="game.team"
          compact
          class="h-20 w-20 shrink-0"
        />
        <div class="min-w-0">
          <strong class="block truncate uppercase"
            >{{ game.team }} VS {{ game.opponentTeam || '?' }}</strong
          >
          <span
            class="text-sm font-bold"
            :class="game.status === 'your-turn' ? 'text-primary' : 'opacity-70'"
          >
            {{ labels[game.status] || game.status }}
          </span>
          <p class="text-xs opacity-60">
            {{ new Date(game.updatedAt).toLocaleDateString() }}
          </p>
        </div>
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { slimeArtId } from '~/utils/slimeCity/artManifest'

type InboxGame = {
  id: string
  team: string
  opponentTeam: string | null
  status: string
  updatedAt: string
}
const labels: Record<string, string> = {
  'your-turn': 'YOUR TURN',
  'their-turn': 'WAITING FOR RIVAL',
  invitation: 'INVITE OPEN',
  finished: 'FINISHED',
}
const games = ref<InboxGame[]>([])
const loading = ref(true)
const error = ref('')
async function refresh() {
  loading.value = true
  try {
    const response = await $fetch<{
      success: boolean
      data: { games: InboxGame[] }
    }>('/api/slime-city/pvp/inbox')
    games.value = response.data.games
    error.value = ''
  } catch {
    error.value = 'Could not load your matches.'
  } finally {
    loading.value = false
  }
}
onMounted(() => void refresh())
</script>
