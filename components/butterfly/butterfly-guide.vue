<template>
  <div
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200"
  >
    <div
      v-if="!currentButterfly"
      class="flex h-full items-center justify-center p-6 text-center text-sm text-base-content/60"
    >
      {{ emptyLabel }}
    </div>

    <div v-else class="flex h-full min-h-0 flex-col overflow-hidden">
      <div class="border-b border-base-300 p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="truncate text-xl font-bold">
              {{ currentButterfly.name || currentButterfly.id }}
            </div>

            <div class="mt-1 flex flex-wrap items-center gap-2">
              <div class="badge badge-outline badge-sm">
                {{ currentButterfly.status || 'random' }}
              </div>

              <div
                class="badge badge-sm"
                :class="
                  currentButterfly.isExiting ? 'badge-warning' : 'badge-success'
                "
              >
                {{ currentButterfly.isExiting ? 'Exiting' : 'Active' }}
              </div>

              <div v-if="isToggleButterfly" class="badge badge-accent badge-sm">
                Toggle Butterfly
              </div>

              <div v-if="canEdit" class="badge badge-secondary badge-sm">
                Editable
              </div>
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{
                background: currentButterfly.wingTopColor || 'transparent',
              }"
            />
            <div
              class="h-6 w-6 rounded-full border border-base-300"
              :style="{
                background: currentButterfly.wingBottomColor || 'transparent',
              }"
            />
          </div>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Message
            </div>
            <div class="mt-2 text-sm leading-relaxed">
              {{ currentButterfly.message || 'No butterfly gossip recorded.' }}
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Identity
            </div>

            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div
                class="col-span-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">ID</div>
                <div class="break-all font-semibold">
                  {{ currentButterfly.id }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Name</div>
                <div class="font-semibold">
                  {{ currentButterfly.name || '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Status</div>
                <div class="font-semibold">
                  {{ currentButterfly.status || '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Art Image</div>
                <div class="font-semibold">
                  {{ currentButterfly.artImageId ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Rarity</div>
                <div class="font-semibold">
                  {{ currentButterfly.rarity ?? '—' }}
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

            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div
                class="col-span-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Designer</div>
                <div class="font-semibold">
                  {{ currentButterfly.designer || 'Wild-type chaos' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Owner ID</div>
                <div class="font-semibold">
                  {{ currentButterfly.userId ?? 'Unknown' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
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
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Speed</div>
                <div class="font-semibold">
                  {{ currentButterfly.speed ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Wing Speed</div>
                <div class="font-semibold">
                  {{ currentButterfly.wingSpeed ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Scale</div>
                <div class="font-semibold">
                  {{ currentButterfly.scale ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Scale Mod</div>
                <div class="font-semibold">
                  {{ currentButterfly.scaleMod ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Rotation</div>
                <div class="font-semibold">
                  {{ currentButterfly.rotation ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Z Depth</div>
                <div class="font-semibold">{{ currentButterfly.z ?? '—' }}</div>
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
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">X</div>
                <div class="font-semibold">{{ currentButterfly.x ?? '—' }}</div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Y</div>
                <div class="font-semibold">{{ currentButterfly.y ?? '—' }}</div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Goal X</div>
                <div class="font-semibold">
                  {{ currentButterfly.goal?.x ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Goal Y</div>
                <div class="font-semibold">
                  {{ currentButterfly.goal?.y ?? '—' }}
                </div>
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
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Z Index</div>
                <div class="font-semibold">
                  {{ currentButterfly.zIndex ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Base Z Index</div>
                <div class="font-semibold">
                  {{ currentButterfly.baseZIndex ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Top Wing</div>
                <div class="truncate font-semibold">
                  {{ currentButterfly.wingTopColor || '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Bottom Wing</div>
                <div class="truncate font-semibold">
                  {{ currentButterfly.wingBottomColor || '—' }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Internal Motion
            </div>

            <div class="mt-2 grid grid-cols-2 gap-2 text-sm xl:grid-cols-4">
              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Noise Offset X</div>
                <div class="font-semibold">
                  {{ currentButterfly.noiseOffsetX ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Noise Offset Y</div>
                <div class="font-semibold">
                  {{ currentButterfly.noiseOffsetY ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Exiting</div>
                <div class="font-semibold">
                  {{ currentButterfly.isExiting ? 'Yes' : 'No' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-200 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Toggle-bound</div>
                <div class="font-semibold">
                  {{ isToggleButterfly ? 'Yes' : 'No' }}
                </div>
              </div>
            </div>
          </div>

          <div
            class="rounded-2xl border border-base-300 bg-base-100 p-3 xl:col-span-2"
          >
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Notes
            </div>
            <div class="mt-2 text-sm text-base-content/80">
              Real live butterfly state. No fake résumé energy.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-guide.vue
import { computed } from 'vue'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useUserStore } from '@/stores/userStore'

const props = withDefaults(
  defineProps<{
    emptyLabel?: string
  }>(),
  {
    emptyLabel: 'Choose a butterfly to inspect its scandalous little life.',
  },
)

const butterflyStore = useButterflyStore()
const userStore = useUserStore()

const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)

const canEdit = computed(() => {
  const butterfly = currentButterfly.value
  if (!butterfly) return false

  const isAdmin = userStore.isAdmin === true || userStore.role === 'ADMIN'
  const isOwner =
    butterfly.userId != null &&
    userStore.userId != null &&
    butterfly.userId === userStore.userId

  return isAdmin || isOwner
})

const isToggleButterfly = computed(() => {
  const butterfly = currentButterfly.value
  if (!butterfly) return false
  return butterflyStore.isToggleButterfly(butterfly)
})
</script>
