<!-- /components/content/butterfly/butterfly-field-guide-card.vue -->
<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <div
      v-if="!butterfly"
      class="flex h-full items-center justify-center p-6 text-center text-sm text-base-content/60"
    >
      {{ emptyLabel }}
    </div>

    <div v-else class="flex h-full min-h-0 flex-col overflow-hidden">
      <div class="border-b border-base-300 p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="truncate text-xl font-bold">
              {{ butterfly.name || butterfly.id }}
            </div>
            <div
              class="mt-1 text-xs uppercase tracking-wide text-base-content/50"
            >
              {{ butterfly.status || 'random' }}
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{ background: butterfly.wingTopColor }"
            />
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{ background: butterfly.wingBottomColor }"
            />
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Message
            </div>
            <div class="mt-2 text-sm leading-relaxed">
              {{ butterfly.message || 'No butterfly gossip recorded.' }}
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Flight Stats
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Speed</div>
                <div class="font-semibold">{{ butterfly.speed ?? '—' }}</div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Wing Speed</div>
                <div class="font-semibold">
                  {{ butterfly.wingSpeed ?? '—' }}
                </div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Scale</div>
                <div class="font-semibold">{{ butterfly.scale ?? '—' }}</div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Rarity</div>
                <div class="font-semibold">{{ butterfly.rarity ?? '—' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Location
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">X</div>
                <div class="font-semibold">{{ butterfly.x }}</div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Y</div>
                <div class="font-semibold">{{ butterfly.y }}</div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Rotation</div>
                <div class="font-semibold">{{ butterfly.rotation }}</div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Z Index</div>
                <div class="font-semibold">
                  {{ Math.round(butterfly.zIndex ?? 0) }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Ownership
            </div>
            <div class="mt-2 grid grid-cols-1 gap-2 text-sm">
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Designer</div>
                <div class="font-semibold">
                  {{ butterfly.designer || 'Wild-type chaos' }}
                </div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Owner ID</div>
                <div class="font-semibold">
                  {{ butterfly.userId ?? 'Unknown' }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-3 lg:col-span-2"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Notes
            </div>
            <div class="mt-2 text-sm text-base-content/80">
              This panel is intentionally self-contained. The footer does not
              side-scroll between sections anymore, so the selected butterfly
              stays visible while the guide content scrolls internally if it
              needs more room.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ButterflyGuideModel {
  id: string
  name?: string
  message?: string
  status?: string
  speed?: number
  wingSpeed?: number
  scale?: number
  rarity?: number
  x?: number
  y?: number
  rotation?: number
  zIndex?: number
  wingTopColor?: string
  wingBottomColor?: string
  designer?: string
  userId?: number
}

defineProps<{
  butterfly: ButterflyGuideModel | null
  emptyLabel?: string
}>()
</script>
