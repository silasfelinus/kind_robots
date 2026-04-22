<!-- /components/content/butterfly/butterfly-guide.vue -->
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
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <div class="badge badge-outline badge-sm">
                {{ butterfly.status || 'random' }}
              </div>
              <div
                class="badge badge-sm"
                :class="butterfly.isExiting ? 'badge-warning' : 'badge-success'"
              >
                {{ butterfly.isExiting ? 'Exiting' : 'Active' }}
              </div>
              <div
                v-if="isToggleButterfly"
                class="badge badge-accent badge-sm"
              >
                Toggle Butterfly
              </div>
              <div
                v-if="canEdit"
                class="badge badge-secondary badge-sm"
              >
                Editable
              </div>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{ background: butterfly.wingTopColor || 'transparent' }"
            />
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{ background: butterfly.wingBottomColor || 'transparent' }"
            />
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2">
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
              Identity
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2 col-span-2">
                <div class="text-xs text-base-content/50">ID</div>
                <div class="break-all font-semibold">{{ butterfly.id }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Name</div>
                <div class="font-semibold">{{ butterfly.name || '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Status</div>
                <div class="font-semibold">{{ butterfly.status || '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Art Image</div>
                <div class="font-semibold">{{ butterfly.artImageId ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Rarity</div>
                <div class="font-semibold">{{ butterfly.rarity ?? '—' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Ownership
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2 col-span-2">
                <div class="text-xs text-base-content/50">Designer</div>
                <div class="font-semibold">
                  {{ butterfly.designer || 'Wild-type chaos' }}
                </div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Owner ID</div>
                <div class="font-semibold">{{ butterfly.userId ?? 'Unknown' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Editable</div>
                <div class="font-semibold">{{ canEdit ? 'Yes' : 'No' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Flight Stats
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Speed</div>
                <div class="font-semibold">{{ butterfly.speed ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Wing Speed</div>
                <div class="font-semibold">{{ butterfly.wingSpeed ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Scale</div>
                <div class="font-semibold">{{ butterfly.scale ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Scale Mod</div>
                <div class="font-semibold">{{ butterfly.scaleMod ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Rotation</div>
                <div class="font-semibold">{{ butterfly.rotation ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Z Depth</div>
                <div class="font-semibold">{{ butterfly.z ?? '—' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Position
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">X</div>
                <div class="font-semibold">{{ butterfly.x ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Y</div>
                <div class="font-semibold">{{ butterfly.y ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Goal X</div>
                <div class="font-semibold">{{ butterfly.goal?.x ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Goal Y</div>
                <div class="font-semibold">{{ butterfly.goal?.y ?? '—' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Rendering
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Z Index</div>
                <div class="font-semibold">{{ butterfly.zIndex ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Base Z Index</div>
                <div class="font-semibold">{{ butterfly.baseZIndex ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Top Wing</div>
                <div class="truncate font-semibold">{{ butterfly.wingTopColor || '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Bottom Wing</div>
                <div class="truncate font-semibold">{{ butterfly.wingBottomColor || '—' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Internal Motion
            </div>
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm xl:grid-cols-4">
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Noise Offset X</div>
                <div class="font-semibold">{{ butterfly.noiseOffsetX ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Noise Offset Y</div>
                <div class="font-semibold">{{ butterfly.noiseOffsetY ?? '—' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Exiting</div>
                <div class="font-semibold">{{ butterfly.isExiting ? 'Yes' : 'No' }}</div>
              </div>
              <div class="rounded-xl border border-base-300 bg-base-200 px-3 py-2">
                <div class="text-xs text-base-content/50">Toggle-bound</div>
                <div class="font-semibold">{{ isToggleButterfly ? 'Yes' : 'No' }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Notes
            </div>
            <div class="mt-2 text-sm text-base-content/80">
              This now shows the real live butterfly state instead of the tiny
              curated résumé version. Tiny résumé butterflies are canceled.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ButterflyGuideGoal {
  x?: number
  y?: number
}

interface ButterflyGuideModel {
  id: string
  name?: string
  message?: string
  status?: string
  speed?: number
  wingSpeed?: number
  scale?: number
  scaleMod?: number
  rarity?: number
  x?: number
  y?: number
  z?: number
  rotation?: number
  zIndex?: number
  baseZIndex?: number
  wingTopColor?: string
  wingBottomColor?: string
  designer?: string
  userId?: number
  artImageId?: number
  noiseOffsetX?: number
  noiseOffsetY?: number
  isExiting?: boolean
  goal?: ButterflyGuideGoal
}

defineProps<{
  butterfly: ButterflyGuideModel | null
  emptyLabel?: string
  canEdit?: boolean
  isToggleButterfly?: boolean
}>()
</script>