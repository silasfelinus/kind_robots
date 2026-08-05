<!-- /components/content/butterfly/butterfly-demo.vue -->
<template>
  <div
    class="relative flex h-full w-full items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <div
      class="butterfly-card relative flex h-full w-full max-w-md flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-base-content shadow-lg"
    >
      <template v-if="currentButterfly">
        <div
          class="butterfly relative z-10 mx-auto"
          :style="{
            transform: `rotate3d(1, 1, 0, ${currentButterfly.rotation}deg) scale(${currentButterfly.scale})`,
          }"
        >
          <div class="left-wing">
            <div
              class="top"
              :style="{ background: currentButterfly.wingTopColor }"
            />
            <div
              class="bottom"
              :style="{ background: currentButterfly.wingBottomColor }"
            />
          </div>

          <div class="right-wing">
            <div
              class="top"
              :style="{ background: currentButterfly.wingTopColor }"
            />
            <div
              class="bottom"
              :style="{ background: currentButterfly.wingBottomColor }"
            />
          </div>
        </div>

        <div class="mt-8 flex w-full flex-col items-center gap-3 text-center">
          <div
            class="rounded-2xl border border-base-300 bg-base-200 px-4 py-2 text-sm font-semibold"
          >
            {{ currentButterfly.id }}
          </div>

          <p class="max-w-xs text-sm italic text-base-content/80">
            {{
              currentButterfly.message ||
              'A mysterious butterfly with no comment. Very dramatic.'
            }}
          </p>

          <div class="grid w-full grid-cols-2 gap-3 pt-2 text-sm">
            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">Rotation</div>
              <div class="mt-1 font-semibold">
                {{ currentButterfly.rotation }}°
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div class="text-xs uppercase text-base-content/60">Scale</div>
              <div class="mt-1 font-semibold">
                {{ currentButterfly.scale }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-base-300 bg-base-200/60 p-6 text-center"
        >
          <icon
            name="kind-icon:butterfly"
            class="h-12 w-12 text-base-content/40"
          />
          <div class="space-y-2">
            <div class="text-lg font-semibold text-base-content/80">
              No butterfly selected
            </div>
            <p class="max-w-sm text-sm text-base-content/60">
              Pick a butterfly from the swarm and it will show off here like the
              tiny diva it is.
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-demo.vue
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'

const butterflyStore = useButterflyStore()

const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)
</script>

<style scoped>
.butterfly-card {
  min-height: 22rem;
}

.butterfly {
  width: 68px;
  height: 72px;
}

@keyframes flutter-left {
  0% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, 70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, 20deg);
  }
}

@keyframes flutter-right {
  0% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
  50% {
    transform: rotate3d(0, 1, 0, -70deg);
  }
  100% {
    transform: rotate3d(0, 1, 0, -20deg);
  }
}

.left-wing,
.right-wing {
  position: absolute;
  top: 10px;
  width: 24px;
  height: 42px;
  pointer-events: none;
}

.left-wing {
  left: 10px;
  transform-origin: 24px 50%;
  animation: flutter-left 0.3s infinite;
}

.right-wing {
  left: 34px;
  transform-origin: 0px 50%;
  animation: flutter-right 0.3s infinite;
}

.top,
.bottom {
  position: absolute;
  opacity: 0.78;
}

.top {
  width: 20px;
  height: 20px;
  border-radius: 9999px;
}

.bottom {
  top: 18px;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
}
</style>
