<!-- components/bots/bot-modules.vue -->
<!-- Module selector — chip toggles + future expansion note. -->
<template>
  <div class="flex flex-col gap-4">
    <!-- Future expansion notice -->
    <div class="rounded-xl border border-warning/30 bg-warning/8 p-3">
      <p class="text-xs font-bold text-warning/80">Under Active Development</p>
      <p class="mt-1 text-xs text-base-content/60">
        Module support is being built out. Selections are saved now and will
        activate as each module is implemented.
      </p>
    </div>

    <!-- Module chips -->
    <div class="flex flex-col gap-2">
      <label
        class="text-xs font-bold uppercase tracking-widest text-base-content/50"
        >Available Modules</label
      >
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="mod in MODULE_PRESETS"
          :key="mod.value"
          type="button"
          class="flex items-start gap-3 rounded-2xl border p-3 text-left transition-all"
          :class="
            isActive(mod.value)
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-base-300 bg-base-100 text-base-content/70 hover:border-primary/30 hover:bg-primary/5'
          "
          @click="builder.toggleModule(mod.value)"
        >
          <div
            class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors"
            :class="
              isActive(mod.value)
                ? 'border-primary bg-primary'
                : 'border-base-300'
            "
          >
            <Icon
              v-if="isActive(mod.value)"
              name="kind-icon:check"
              class="h-3 w-3 text-primary-content"
            />
          </div>
          <div>
            <p class="text-xs font-bold leading-tight">{{ mod.label }}</p>
            <p class="mt-0.5 text-xs text-base-content/50 leading-snug">
              {{ mod.subtext }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Active modules summary -->
    <div v-if="activeModuleList.length" class="rounded-xl bg-base-200 p-3">
      <p
        class="text-xs font-bold uppercase tracking-widest text-base-content/40"
      >
        Active modules
      </p>
      <p class="mt-1 font-mono text-xs text-base-content/60">
        {{ botStore.botForm.modules }}
      </p>
    </div>

    <p v-else class="text-xs text-base-content/30">
      No modules selected. This bot runs without additional capabilities.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotBuilderStore } from '@/stores/botBuilderStore'
import { useBotStore } from '@/stores/botStore'
import { MODULE_PRESETS } from '@/stores/helpers/botCards'

const builder = useBotBuilderStore()
const botStore = useBotStore()

const activeModuleList = computed(() => builder.activeModules())

function isActive(value: string): boolean {
  return activeModuleList.value.includes(value)
}
</script>
