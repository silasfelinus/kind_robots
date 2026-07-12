<!-- /components/model-builder/model-builder-recipe-selector.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-black text-base-content">
          2. Choose a recipe &amp; outputs
        </h3>
        <p class="mt-1 text-xs text-base-content/60">
          Building from
          <span class="font-bold text-base-content">{{ sourceLabel }}</span>
          <span class="text-base-content/40"> ({{ store.sourceType }})</span>.
          Defaults are a convenience — toggle whatever you want.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-xs btn-ghost shrink-0 rounded-xl text-base-content/60"
        @click="store.goToStep('source')"
      >
        <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
        Change source
      </button>
    </div>

    <!-- Recipe chips -->
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="recipe in recipes"
        :key="recipe.key"
        type="button"
        class="btn btn-sm h-auto min-h-9 flex-col items-start gap-0 rounded-xl px-3 py-1.5 text-left"
        :class="
          store.recipeKey === recipe.key
            ? 'btn-primary'
            : 'btn-ghost border border-base-300'
        "
        @click="store.selectRecipe(recipe.key)"
      >
        <span class="flex items-center gap-1.5 text-xs font-bold">
          <Icon :name="recipe.icon" class="h-4 w-4" />
          {{ recipe.label }}
        </span>
      </button>
    </div>

    <p
      v-if="store.selectedRecipe"
      class="rounded-xl bg-base-100 px-3 py-2 text-xs text-base-content/60"
    >
      {{ store.selectedRecipe.summary }}
    </p>

    <!-- Outputs -->
    <div class="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
      <label
        v-for="output in store.recipeOutputs"
        :key="output.key"
        class="flex cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-2.5 transition hover:border-primary/50"
        :class="store.selections[output.key]?.on ? 'border-primary/60 bg-primary/5' : ''"
      >
        <input
          type="checkbox"
          class="checkbox checkbox-sm checkbox-primary"
          :checked="store.selections[output.key]?.on"
          @change="store.toggleOutput(output.key)"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="truncate text-sm font-bold text-base-content">
              {{ output.label }}
            </span>
            <span class="badge badge-xs badge-ghost">{{ output.generation }}</span>
            <span v-if="output.size" class="text-[10px] text-base-content/40">
              {{ output.size }}
            </span>
          </div>
          <p class="truncate text-xs text-base-content/50">
            {{ output.description }}
          </p>
        </div>

        <div
          v-if="output.quantity && store.selections[output.key]?.on"
          class="flex shrink-0 items-center gap-1"
          @click.prevent
        >
          <span class="text-[10px] uppercase text-base-content/40">qty</span>
          <input
            type="number"
            min="1"
            max="12"
            class="input input-xs input-bordered w-14 rounded-lg text-center"
            :value="store.selections[output.key]?.quantity"
            @input="onQuantity(output.key, $event)"
          />
        </div>

        <span
          class="badge badge-sm shrink-0"
          :class="actionBadge(output.action)"
        >
          {{ output.action }}
        </span>
      </label>
    </div>

    <!-- Footer -->
    <div
      class="flex shrink-0 items-center justify-between gap-2 border-t border-base-300 pt-2"
    >
      <span class="text-xs text-base-content/60">
        {{ store.selectedOutputCount }} output{{ store.selectedOutputCount === 1 ? '' : 's' }} selected
      </span>
      <button
        type="button"
        class="btn btn-primary btn-sm rounded-xl"
        :disabled="!store.canStartRun"
        @click="store.startRun()"
      >
        <Icon name="kind-icon:play" class="h-4 w-4" />
        Start build run
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import {
  getRecipesForSource,
  type BuildAction,
} from '@/stores/helpers/modelBuilderRecipes'

const store = useModelBuilderStore()

const recipes = computed(() =>
  store.sourceType ? getRecipesForSource(store.sourceType) : [],
)

const sourceLabel = computed(() => store.sourceLabel(store.selectedSource))

function onQuantity(key: string, event: Event): void {
  const value = Number((event.target as HTMLInputElement).value)
  store.setOutputQuantity(key, value)
}

function actionBadge(action: BuildAction): string {
  if (action === 'CREATE') return 'badge-secondary'
  if (action === 'UPDATE') return 'badge-accent'
  return 'badge-ghost'
}
</script>
