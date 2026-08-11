<!-- /components/storybook/storybook-state-panel.vue -->
<template>
  <details
    class="rounded-2xl border border-secondary/25 bg-secondary/5 p-3"
    :open="session.branchHistory.length > 0 || session.inventory.length > 0"
  >
    <summary class="cursor-pointer text-sm font-black text-secondary">
      Story state · {{ session.branchHistory.length }}
      {{ session.branchHistory.length === 1 ? 'choice' : 'choices' }} ·
      {{ session.inventory.length }}
      {{ session.inventory.length === 1 ? 'reward' : 'rewards' }}
    </summary>

    <div class="mt-3 grid gap-3 lg:grid-cols-3">
      <section class="kr-panel-flat p-3">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
          Inventory
        </h3>
        <div v-if="session.inventory.length" class="mt-2 space-y-2">
          <article
            v-for="item in session.inventory"
            :key="item.ingredient.slug"
            class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-200/40 p-2"
          >
            <span
              class="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
            >
              <img
                v-if="item.ingredient.imagePath"
                :src="item.ingredient.imagePath"
                alt=""
                class="absolute inset-0 size-full object-cover"
              />
              <Icon
                v-else
                name="kind-icon:gift"
                class="size-5 text-base-content/40"
                aria-hidden="true"
              />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-black">
                {{ item.ingredient.title }}
              </span>
              <span
                v-if="item.ingredient.flavorText || item.ingredient.description"
                class="line-clamp-2 text-[0.68rem] leading-relaxed text-base-content/50"
              >
                {{ item.ingredient.flavorText || item.ingredient.description }}
              </span>
            </span>
          </article>
        </div>
        <p v-else class="mt-2 text-xs leading-relaxed text-base-content/45">
          The story has not placed a selected Reward in your hands yet.
        </p>
      </section>

      <section class="kr-panel-flat p-3">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
          Consequences
        </h3>
        <ol v-if="recentConsequences.length" class="mt-2 space-y-2">
          <li
            v-for="item in recentConsequences"
            :key="item.id"
            class="flex items-start gap-2 text-xs leading-relaxed"
          >
            <Icon
              :name="
                item.kind === 'relationship'
                  ? 'kind-icon:heart'
                  : 'kind-icon:sparkles'
              "
              class="mt-0.5 size-3.5 shrink-0 text-secondary"
              aria-hidden="true"
            />
            <span>{{ item.text }}</span>
          </li>
        </ol>
        <p v-else class="mt-2 text-xs leading-relaxed text-base-content/45">
          Consequences will accumulate as choices alter the story.
        </p>
      </section>

      <section class="kr-panel-flat p-3">
        <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
          Branch path
        </h3>
        <ol v-if="recentBranches.length" class="mt-2 space-y-2">
          <li
            v-for="(branch, index) in recentBranches"
            :key="branch.id"
            class="rounded-xl border border-base-300 bg-base-200/40 p-2 text-xs leading-relaxed"
          >
            <p class="font-bold text-base-content/55">
              Choice {{ session.branchHistory.length - recentBranches.length + index + 1 }}
            </p>
            <p class="mt-0.5 text-base-content/75">{{ branch.answer }}</p>
          </li>
        </ol>
        <p v-else class="mt-2 text-xs leading-relaxed text-base-content/45">
          Your first answer will begin this session’s branch history.
        </p>
      </section>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StorybookSession } from '@/stores/storybookStore'

const props = defineProps<{
  session: StorybookSession
}>()

const recentConsequences = computed(() =>
  props.session.consequences.slice(-6).reverse(),
)
const recentBranches = computed(() =>
  props.session.branchHistory.slice(-5),
)
</script>
