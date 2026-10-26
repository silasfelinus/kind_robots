<template>
  <aside
    v-if="entry && adjustment"
    class="pf-panel @container flex min-h-0 flex-col overflow-hidden"
    aria-label="Adjust the plan"
  >
    <div
      class="flex shrink-0 items-start justify-between gap-3 border-b border-base-content/10 p-3 @5xl:px-5"
    >
      <div class="min-w-0">
        <p class="pf-kicker text-secondary">
          Adjust · posts to {{ issueLabel }}
        </p>
        <p class="pf-display mt-1 text-2xl">Adjust the plan</p>
      </div>
      <button
        type="button"
        data-nav
        class="pf-label btn btn-sm btn-ghost pf-focusable"
        @click="forge.ledgerPanel = 'detail'"
      >
        Close
      </button>
    </div>

    <div class="kr-scroll flex min-h-0 flex-1 flex-col gap-5 p-3 @5xl:p-5">
      <section class="flex flex-col gap-1.5" aria-label="Plan numbers">
        <div class="flex items-baseline justify-between gap-2">
          <p class="pf-kicker text-[0.65rem] opacity-80">Plan numbers</p>
          <button
            v-if="changedCount"
            type="button"
            class="text-xs underline opacity-70 hover:opacity-100"
            @click="forge.clearOverrides()"
          >
            Back to the Conductor plan ({{ changedCount }} changed)
          </button>
        </div>
        <button
          v-for="row in rows"
          :key="row.key"
          type="button"
          data-nav
          data-adjust
          class="pf-row pf-focusable"
          :aria-label="`${row.label}: ${display(row)}`"
          :title="row.help"
          @click="forge.stepOverride(row, 1)"
          @pf-adjust="
            forge.stepOverride(row, ($event as CustomEvent<1 | -1>).detail)
          "
          @mouseenter="($event.currentTarget as HTMLElement).focus()"
        >
          <span class="flex min-w-0 flex-1 flex-col text-left">
            <span class="pf-label truncate text-sm">{{ row.label }}</span>
            <span class="text-[0.7rem] opacity-60">
              <template v-if="builtValue(row) !== null"
                >built {{ builtValue(row) }}</template
              >
              <template v-if="changed(row)">
                · plan was {{ planDisplay(row) }}</template
              >
              <template v-if="added(row)"> · +{{ added(row) }} added</template>
            </span>
          </span>
          <span class="pf-value">
            <span
              class="pf-chev"
              aria-hidden="true"
              @click.stop="forge.stepOverride(row, -1)"
              >◀</span
            >
            <span
              class="pf-display min-w-[4.5rem] text-center text-sm"
              :class="changed(row) ? 'text-primary' : ''"
              >{{ display(row) }}</span
            >
            <span
              class="pf-chev"
              aria-hidden="true"
              @click.stop="forge.stepOverride(row, 1)"
              >▶</span
            >
          </span>
        </button>
        <p class="pf-help mt-1 text-xs leading-snug">
          <span class="pf-kicker mr-1 text-[0.6rem] text-secondary"
            >Openings → endings</span
          >
          {{ adjustment.combos }}
        </p>
      </section>

      <section class="flex flex-col gap-2" aria-label="Add an element">
        <p class="pf-kicker text-[0.65rem] opacity-80">Add an element</p>
        <div class="flex flex-wrap gap-1.5" role="group" aria-label="Kind">
          <button
            v-for="kind in ADDITION_KINDS"
            :key="kind.id"
            type="button"
            class="pf-chip pf-focusable"
            :class="
              newKind === kind.id
                ? 'border-primary text-primary'
                : 'border-base-content/20 opacity-80'
            "
            :aria-pressed="newKind === kind.id"
            @click="newKind = kind.id"
          >
            {{ kind.label }}
          </button>
        </div>
        <input
          v-model="newTitle"
          type="text"
          maxlength="120"
          class="pf-field text-sm"
          :placeholder="`Name the ${kindLabel.toLowerCase()}`"
          :aria-label="`${kindLabel} name`"
          @keydown.enter.prevent="add"
        />
        <textarea
          v-model="newNote"
          rows="2"
          maxlength="1200"
          class="pf-field text-sm"
          placeholder="What it is, where it goes, why it matters"
          aria-label="Element note"
        />
        <div class="flex justify-end">
          <button
            type="button"
            class="pf-label btn btn-sm btn-primary"
            :disabled="!newTitle.trim()"
            @click="add"
          >
            Add {{ kindLabel.toLowerCase() }}
          </button>
        </div>
        <ul v-if="edit.additions.length" class="flex flex-col gap-1">
          <li
            v-for="item in edit.additions"
            :key="item.id"
            class="flex items-start gap-2 border-l-2 border-primary/60 py-1 pl-2 text-sm"
          >
            <span class="min-w-0 flex-1">
              <span class="pf-kicker mr-1 text-[0.6rem] opacity-70">{{
                kindName(item.kind)
              }}</span>
              <span class="font-semibold">{{ item.title }}</span>
              <span v-if="item.note" class="block text-xs opacity-70">{{
                item.note
              }}</span>
            </span>
            <a
              v-if="item.postedUrl"
              :href="item.postedUrl"
              target="_blank"
              rel="noopener"
              class="pf-kicker shrink-0 text-[0.6rem] text-success"
              >Posted</a
            >
            <button
              type="button"
              class="shrink-0 px-1 opacity-60 hover:opacity-100"
              :aria-label="`Remove ${item.title}`"
              @click="forge.removeElement(item.id)"
            >
              ×
            </button>
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2" aria-label="Adjustment">
        <p class="pf-kicker text-[0.65rem] opacity-80">Type an adjustment</p>
        <textarea
          :value="edit.note"
          rows="5"
          maxlength="8000"
          class="pf-field text-sm leading-snug"
          placeholder="Direction for the agents: what to change, add or cut, and why."
          aria-label="Adjustment"
          @input="
            forge.setAdjustNote(($event.target as HTMLTextAreaElement).value)
          "
        />
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs opacity-70">{{ summary }}</p>
          <button
            type="button"
            class="pf-label btn btn-sm btn-primary"
            :disabled="forge.posting || !hasContent"
            @click="forge.postAdjustment()"
          >
            {{ forge.posting ? 'Posting…' : `Post to ${issueLabel}` }}
          </button>
        </div>
        <p v-if="forge.adjustStatus" class="text-xs opacity-80" role="status">
          {{ forge.adjustStatus }}
        </p>
        <ul v-if="edit.posts.length" class="flex flex-col gap-0.5 text-xs">
          <li v-for="post in edit.posts.slice(0, 5)" :key="post.url">
            <a
              :href="post.url"
              target="_blank"
              rel="noopener"
              class="underline opacity-80 hover:opacity-100"
              >Posted {{ new Date(post.at).toLocaleString() }}</a
            >
          </li>
        </ul>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlaybookForgeStore } from '~/stores/playbookForgeStore'
import {
  ADDITION_KINDS,
  EMPTY_PLAN_EDIT,
  PLAYBOOK_ISSUES,
  type AdditionKind,
} from '~/utils/playbookForge/adjust'
import {
  FACTOR_ROWS,
  displayValue,
  type FactorRow,
} from '~/utils/playbookForge/factors'
import type { Blueprint } from '~/utils/playbookForge/types'

// The ledger's adjust panel: change a plan number, add a named element or
// type direction, then post it all to the game's GitHub master issue.

const forge = usePlaybookForgeStore()
const entry = computed(() => forge.existing)
const adjustment = computed(() => forge.pendingAdjustment)
const edit = computed(
  () => (entry.value && forge.planEdits[entry.value.slug]) || EMPTY_PLAN_EDIT,
)

/** The factors a design conversation is usually about, in ledger order. */
const ADJUST_KEYS: (keyof Blueprint)[] = [
  'rosterSize',
  'followers',
  'partySize',
  'followerQuestSteps',
  'romances',
  'villains',
  'villainPerRun',
  'encounters',
  'quests',
  'locations',
  'endings',
  'endingVersions',
  'followerEpilogues',
]

/** The plan with changed numbers but without added elements, which is what ◀ ▶ edit. */
const base = computed<Blueprint | null>(() =>
  entry.value ? { ...entry.value.plan, ...edit.value.overrides } : null,
)

const rows = computed(() => {
  const b = base.value
  if (!b) return []
  return ADJUST_KEYS.map((key) => FACTOR_ROWS.find((r) => r.key === key)!)
    .filter(Boolean)
    .filter(
      (row) =>
        !row.visible ||
        row.visible(b) ||
        forge.built?.measured.includes(row.key),
    )
})

const changedCount = computed(() => adjustment.value?.changes.length ?? 0)

function display(row: FactorRow) {
  return base.value ? displayValue(row, base.value) : ''
}
function planDisplay(row: FactorRow) {
  return entry.value ? displayValue(row, entry.value.plan) : ''
}
function changed(row: FactorRow) {
  return row.key in edit.value.overrides
}
function builtValue(row: FactorRow) {
  const built = forge.built
  return built?.measured.includes(row.key)
    ? String(built.values[row.key] ?? 0)
    : null
}
function added(row: FactorRow) {
  const kinds = ADDITION_KINDS.filter((k) => k.factor === row.key).map(
    (k) => k.id,
  ) as string[]
  return edit.value.additions.filter((a) => kinds.includes(a.kind)).length
}

const issueLabel = computed(() => {
  const n = entry.value ? PLAYBOOK_ISSUES[entry.value.slug] : undefined
  return n ? `issue #${n}` : 'its adjustments issue'
})

const hasContent = computed(() => {
  const a = adjustment.value
  return !!a && (!!a.note || a.changes.length > 0 || a.additions.length > 0)
})

const summary = computed(() => {
  const a = adjustment.value
  if (!a) return ''
  const parts = [
    a.note ? 'your note' : '',
    a.changes.length
      ? `${a.changes.length} changed number${a.changes.length === 1 ? '' : 's'}`
      : '',
    a.additions.length
      ? `${a.additions.length} new element${a.additions.length === 1 ? '' : 's'}`
      : '',
  ].filter(Boolean)
  return parts.length
    ? `Posts ${parts.join(', ')}, with the openings line.`
    : 'Nothing to post yet.'
})

const newKind = ref<AdditionKind>('follower')
const newTitle = ref('')
const newNote = ref('')
const kindLabel = computed(
  () => ADDITION_KINDS.find((k) => k.id === newKind.value)?.label ?? 'Element',
)
function kindName(kind: string) {
  return ADDITION_KINDS.find((k) => k.id === kind)?.label ?? kind
}

function add() {
  if (!newTitle.value.trim()) return
  forge.addElement({
    kind: newKind.value,
    title: newTitle.value,
    note: newNote.value,
  })
  newTitle.value = ''
  newNote.value = ''
}
</script>
