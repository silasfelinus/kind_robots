<template>
  <div
    class="grid min-w-0 gap-2"
    :class="effectiveColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'"
  >
    <section
      v-for="(group, index) in groups"
      :key="group.key"
      class="min-w-0"
      :class="{
        'border-t border-base-300/70 pt-2':
          index > 0 && effectiveColumns === 1,
        'border-l border-base-300/70 pl-2':
          index > 0 && effectiveColumns === 2,
      }"
      :aria-label="group.label || channel.label + ' tabs'"
    >
      <p
        v-if="group.label"
        class="px-3 pb-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-base-content/45"
      >
        {{ group.label }}
      </p>

      <ul class="menu w-full flex-nowrap gap-1 p-0">
        <li v-for="tab in group.tabs" :key="tab.tabKey">
          <button
            type="button"
            class="flex min-h-11 w-full items-center gap-2 rounded-xl text-left"
            :class="
              isActiveTab(tab)
                ? 'active bg-secondary text-secondary-content'
                : ''
            "
            @click="emit('select', tab)"
          >
            <span
              class="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-base-200"
            >
              <img
                v-if="tab.image"
                :src="tab.image"
                :alt="tab.title || tab.label"
                class="h-full w-full object-cover"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-base-content/20"
              >
                <Icon
                  :name="tab.icon || channel.icon"
                  class="h-4 w-4 text-base-100 drop-shadow"
                />
              </span>
            </span>

            <span
              class="flex min-w-0 flex-1 flex-col items-start leading-tight"
            >
              <span class="flex max-w-full items-center gap-1">
                <span class="truncate text-sm font-black">
                  {{ tab.label }}
                </span>
                <span
                  v-if="isAdminOnlyTab(channel, tab)"
                  class="badge badge-warning badge-xs shrink-0 font-bold uppercase"
                  title="Admin-only page"
                >
                  Admin
                </span>
              </span>
              <span
                v-if="tab.summary || tab.description"
                class="line-clamp-1 text-xs font-medium opacity-65"
              >
                {{ tab.summary || tab.description }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import {
  channelTabGroups,
  isAdminOnlyTab,
} from '@/utils/channelTabGroups'

const props = withDefaults(
  defineProps<{
    channel: ResolvedChannel
    activeChannelKey?: string
    activeTabKey?: string
    columns?: 1 | 2
  }>(),
  {
    activeChannelKey: '',
    activeTabKey: '',
    columns: 1,
  },
)

const emit = defineEmits<{
  select: [tab: ResolvedTab]
}>()

const groups = computed(() => channelTabGroups(props.channel))
const effectiveColumns = computed<1 | 2>(() => {
  return props.columns === 2 && groups.value.length > 1 ? 2 : 1
})

function isActiveTab(tab: ResolvedTab): boolean {
  return (
    props.activeChannelKey === props.channel.channelKey &&
    props.activeTabKey === tab.tabKey
  )
}
</script>
