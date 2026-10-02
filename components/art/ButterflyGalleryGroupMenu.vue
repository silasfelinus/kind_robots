<template>
  <div ref="rootRef" class="group-menu">
    <button
      type="button"
      class="group-menu-trigger"
      :class="{ 'group-menu-trigger-active': Boolean(active) }"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon :name="icon" class="kr-icon-3" />
      <span class="group-menu-title">{{ activeLabel || heading }}</span>
      <span class="group-menu-count">{{ items.length }}</span>
      <Icon
        :name="open ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
        class="kr-icon-3"
      />
    </button>

    <button
      v-if="active"
      type="button"
      class="group-menu-clear"
      title="Clear filter"
      @click="$emit('select', active)"
    >
      <Icon name="kind-icon:close" class="kr-icon-3" />
      <span class="sr-only">Clear {{ heading }} filter</span>
    </button>

    <div v-if="open" class="group-menu-list kr-panel">
      <input
        v-model="query"
        type="search"
        class="kr-input-sm"
        :placeholder="`Find ${heading.toLowerCase()}`"
      />
      <ul class="group-menu-items">
        <li v-for="item in visibleItems" :key="item.value">
          <div v-if="editing === item.value" class="group-menu-edit">
            <input
              v-model="draft"
              class="kr-input-sm"
              type="text"
              @keydown.enter.prevent="commitRename(item.value)"
              @keydown.esc="editing = null"
            />
            <button
              type="button"
              class="kr-btn btn-ghost btn-xs"
              @click="commitRename(item.value)"
            >
              Save
            </button>
          </div>
          <div v-else class="group-menu-item">
            <button
              type="button"
              class="group-menu-pick"
              :class="{ 'group-menu-pick-active': active === item.value }"
              @click="pick(item.value)"
            >
              <span class="group-menu-name">{{ item.label || item.value }}</span>
              <span class="group-menu-count">{{ item.count }}</span>
            </button>
            <button
              v-if="renamable && item.id !== undefined"
              type="button"
              class="group-menu-rename"
              title="Rename"
              @click="startRename(item)"
            >
              <Icon name="kind-icon:edit" class="kr-icon-3" />
              <span class="sr-only">Rename {{ item.label || item.value }}</span>
            </button>
          </div>
        </li>
        <li v-if="!visibleItems.length" class="kr-text-dim-xs px-2 py-1">
          {{ items.length ? 'No matches.' : `No ${heading.toLowerCase()} yet.` }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ButterflyGroupSummary } from '@/types/butterflyGallery'

const props = defineProps<{
  heading: string
  icon: string
  items: ButterflyGroupSummary[]
  active: string | null
  renamable?: boolean
}>()

const emit = defineEmits<{
  select: [value: string]
  rename: [value: string, label: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const editing = ref<string | null>(null)
const draft = ref('')

const activeLabel = computed(() => {
  const match = props.items.find((item) => item.value === props.active)
  return match ? match.label || match.value : props.active
})

const visibleItems = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return props.items
  return props.items.filter((item) =>
    `${item.label ?? ''} ${item.value}`.toLowerCase().includes(needle),
  )
})

function pick(value: string): void {
  emit('select', value)
  open.value = false
}

function startRename(item: ButterflyGroupSummary): void {
  editing.value = item.value
  draft.value = item.label || item.value
}

function commitRename(value: string): void {
  const label = draft.value.trim()
  if (label) emit('rename', value, label)
  editing.value = null
}

function closeOnOutsideClick(event: MouseEvent): void {
  if (!rootRef.value?.contains(event.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() =>
  document.removeEventListener('click', closeOnOutsideClick),
)
</script>

<style scoped>
.group-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.group-menu-trigger {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  max-width: 16rem;
  padding: 0.3rem 0.7rem;
  border: 1px solid var(--color-base-300);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
}

.group-menu-trigger-active {
  border-color: var(--color-primary);
  background: color-mix(in oklch, var(--color-primary) 16%, transparent);
  color: var(--color-primary);
}

.group-menu-title,
.group-menu-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-menu-count {
  opacity: 0.6;
  font-size: 0.68rem;
}

.group-menu-clear {
  padding: 0.25rem;
  border-radius: 999px;
  opacity: 0.7;
}

.group-menu-list {
  position: absolute;
  z-index: 50;
  top: calc(100% + 0.35rem);
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: min(22rem, 80vw);
  padding: 0.5rem;
  border-radius: 0.9rem;
  background: var(--color-base-100);
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.25);
}

.group-menu-items {
  max-height: 14rem;
  overflow-y: auto;
}

.group-menu-item,
.group-menu-edit {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.group-menu-pick {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.3rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: left;
}

.group-menu-pick:hover,
.group-menu-pick-active {
  background: color-mix(in oklch, var(--color-primary) 14%, transparent);
}

.group-menu-rename {
  padding: 0.25rem;
  border-radius: 0.4rem;
  opacity: 0.6;
}

.group-menu-rename:hover {
  opacity: 1;
}
</style>
