<template>
  <div class="kr-unbound kr-container max-w-3xl p-6 space-y-8">
    <div
      v-if="userStore.isGuest"
      class="rounded-2xl border border-accent/30 bg-(--kr-surface) p-6 text-center space-y-3"
    >
      <p class="text-base-content/80">
        You're browsing as a guest. Sign up to keep a karma and mana balance
        that follows your account. ✨
      </p>
      <NuxtLink to="/register" class="btn btn-accent rounded-xl"
        >Create an account</NuxtLink
      >
    </div>

    <template v-else>
      <section
        class="rounded-2xl border border-primary/20 bg-base-100 shadow-lg p-6 space-y-4"
      >
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-sm text-base-content/60">Karma</h2>
            <div class="text-5xl font-extrabold text-primary tabular-nums">
              {{ karmaStore.balance }}
            </div>
          </div>
          <Icon name="kind-icon:sparkles" class="size-12 text-primary/30" />
        </div>
        <p class="text-sm text-base-content/60">
          Karma reflects positive participation across Kind Robots.
        </p>
      </section>

      <section
        class="rounded-2xl border border-secondary/20 bg-base-100 shadow-lg p-6 space-y-4"
      >
        <div class="flex items-end justify-between">
          <div>
            <h2 class="text-sm text-base-content/60">Mana</h2>
            <div class="text-5xl font-extrabold text-secondary tabular-nums">
              {{ manaStore.mana }}
            </div>
          </div>
          <Icon name="kind-icon:flame" class="size-12 text-secondary/30" />
        </div>
        <p class="text-sm text-base-content/60">
          Mana powers creative tools and refills over time.
        </p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useKarmaStore } from '@/stores/karmaStore'
import { useManaStore } from '@/stores/manaStore'
import { useUserStore } from '@/stores/userStore'

const karmaStore = useKarmaStore()
const manaStore = useManaStore()
const userStore = useUserStore()

onMounted(async () => {
  if (!userStore.isGuest) {
    await Promise.all([karmaStore.fetchKarma(), manaStore.fetchMana()])
  }
})
</script>
