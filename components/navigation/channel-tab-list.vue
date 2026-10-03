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
        'border-t border-base-300/70 pt-2': index > 0 && effectiveColumns === 1,
        'border-l border-base-300/70 pl-2': index > 0 && effectiveColumns === 2,
      }"
      :aria-label="group.label || channel.label + ' tabs'"
    >
      <p
        v-if="group.label"
        class="kr-text-eyebrow px-3 pb-1 text-[0.65rem] tracking-[0.18em] text-base-content/45"
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
                : isActiveBranch(tab)
                  ? 'bg-base-200'
                  : ''
            "
            :aria-expanded="
              hasSubtabs(tab) ? expandedParentKey === tab.tabKey : undefined
            "
            @click="selectOrToggle(tab)"
          >
            <span
              class="kr-icon-8 relative flex shrink-0 overflow-hidden rounded-lg bg-base-200"
            >
              <img
                v-if="tab.image && !hasSubtabs(tab)"
                :src="tab.image"
                :alt="tab.title || tab.label"
                class="kr-img-cover"
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
              <span class="flex w-full max-w-full items-center gap-1">
                <span class="kr-text-black-sm min-w-0 truncate">
                  {{ tab.label }}
                </span>
                <span
                  v-if="isAdminOnlyTab(channel, tab)"
                  class="kr-text-eyebrow-bold kr-badge-warning-xs shrink-0"
                  title="Admin-only page"
                >
                  Admin
                </span>
              </span>
              <span
                v-if="tab.summary || tab.description"
                class="line-clamp-1 w-full text-xs font-medium opacity-65 sm:hidden xl:block"
              >
                {{ tab.summary || tab.description }}
              </span>
            </span>

            <Icon
              v-if="hasSubtabs(tab)"
              name="kind-icon:chevron-right"
              class="kr-icon-4 shrink-0 transition-transform"
              :class="expandedParentKey === tab.tabKey ? 'rotate-90' : ''"
            />
          </button>

          <ul
            v-if="hasSubtabs(tab) && expandedParentKey === tab.tabKey"
            class="ms-5 mt-1 flex flex-col gap-1 rounded-xl border border-base-300/70 border-s-2 border-s-primary/40 bg-base-200/45 p-1"
            :aria-label="tab.label + ' subtabs'"
          >
            <li v-for="subtab in subtabsFor(tab)" :key="subtab.tabKey">
              <button
                type="button"
                class="flex min-h-10 w-full items-center gap-2 rounded-lg text-left"
                :class="
                  isActiveTab(subtab)
                    ? 'active bg-secondary text-secondary-content'
                    : ''
                "
                @click="emit('select', subtab)"
              >
                <span
                  class="relative flex h-7 w-7 shrink-0 overflow-hidden rounded-md bg-base-200"
                >
                  <img
                    v-if="subtab.image"
                    :src="subtab.image"
                    :alt="subtab.title || subtab.label"
                    class="kr-img-cover"
                  />
                  <span
                    class="absolute inset-0 flex items-center justify-center bg-base-content/20"
                  >
                    <Icon
                      :name="subtab.icon || tab.icon || channel.icon"
                      class="h-3.5 w-3.5 text-base-100 drop-shadow"
                    />
                  </span>
                </span>

                <span
                  class="flex min-w-0 flex-1 flex-col items-start leading-tight"
                >
                  <span class="kr-text-black-sm w-full min-w-0 truncate">
                    {{ subtab.label }}
                  </span>
                  <span
                    v-if="subtab.summary || subtab.description"
                    class="line-clamp-1 w-full text-xs font-medium opacity-65 sm:hidden xl:block"
                  >
                    {{ subtab.summary || subtab.description }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import {
  channelTabGroups,
  isAdminOnlyTab,
  navigationSubtabs,
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

const expandedParentKey = ref('')
const groups = computed(() => channelTabGroups(props.channel))
const effectiveColumns = computed<1 | 2>(() => {
  return props.columns === 2 && groups.value.length > 1 ? 2 : 1
})

function subtabsFor(tab: ResolvedTab): ResolvedTab[] {
  return navigationSubtabs(props.channel, tab)
}

function hasSubtabs(tab: ResolvedTab): boolean {
  return subtabsFor(tab).length > 0
}

function isActiveTab(tab: ResolvedTab): boolean {
  return (
    props.activeChannelKey === props.channel.channelKey &&
    props.activeTabKey === tab.tabKey
  )
}

function isActiveBranch(tab: ResolvedTab): boolean {
  return (
    props.activeChannelKey === props.channel.channelKey &&
    subtabsFor(tab).some((subtab) => subtab.tabKey === props.activeTabKey)
  )
}

function selectOrToggle(tab: ResolvedTab): void {
  if (!hasSubtabs(tab)) {
    emit('select', tab)
    return
  }

  expandedParentKey.value =
    expandedParentKey.value === tab.tabKey ? '' : tab.tabKey
}

function syncExpandedParent(): void {
  if (props.activeChannelKey !== props.channel.channelKey) return

  const active = props.channel.tabs.find(
    (tab) => tab.tabKey === props.activeTabKey,
  )
  if (active?.parentTabKey) {
    expandedParentKey.value = active.parentTabKey
  }
}

watch(
  [
    () => props.activeChannelKey,
    () => props.activeTabKey,
    () => props.channel.channelKey,
    () => props.channel.tabs.length,
  ],
  syncExpandedParent,
  { immediate: true },
)
</script>
