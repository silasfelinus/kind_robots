<!-- /components/dev/icon-debugger.vue -->
<!-- Drop this on any dev-only route, e.g. /dev or wrapped in v-if="isDev" -->
<template>
  <div class="debugger">
    <div class="debugger-header">
      <span class="debugger-title">smartbar icon debugger</span>
      <div class="debugger-meta">
        <span
          class="badge"
          :class="customIconsEnabled ? 'badge-ok' : 'badge-warn'"
        >
          customIcons {{ customIconsEnabled ? 'on' : 'off' }}
        </span>
        <span class="badge badge-neutral"
          >{{ icons.length }} icons in store</span
        >
        <span class="badge badge-neutral"
          >{{ smartBarIds.length }} ids in smartBar</span
        >
      </div>
    </div>

    <!-- Parse section -->
    <section class="block">
      <h3 class="block-title">smartBarIds parse</h3>
      <div class="kv-row">
        <span class="kv-key">raw smartBar</span>
        <code class="kv-val">{{ rawSmartBar || '(empty)' }}</code>
      </div>
      <div class="kv-row">
        <span class="kv-key">resolved IDs</span>
        <code class="kv-val">[ {{ smartBarIds.join(', ') || '—' }} ]</code>
      </div>
      <div class="kv-row">
        <span class="kv-key">dropped tokens</span>
        <span class="kv-val">
          <template v-if="droppedTokens.length">
            <span
              v-for="t in droppedTokens"
              :key="t"
              class="badge badge-warn"
              >{{ t || '(empty)' }}</span
            >
          </template>
          <span v-else class="badge badge-ok">none</span>
        </span>
      </div>
      <div class="kv-row">
        <span class="kv-key">customIconsEnabled</span>
        <span
          class="badge"
          :class="customIconsEnabled ? 'badge-ok' : 'badge-warn'"
          >{{ customIconsEnabled }}</span
        >
      </div>
      <div v-if="!customIconsEnabled" class="notice notice-warn">
        ⚠ customIconsEnabled is false — smartBar string ignored, defaultIconIds
        [{{ smartbarStore.defaultIconIds.join(', ') }}] used instead
      </div>
    </section>

    <!-- Per-icon resolution -->
    <section class="block">
      <h3 class="block-title">icon resolution — per ID</h3>
      <div class="table-wrap">
        <table class="icon-table">
          <thead>
            <tr>
              <th>id</th>
              <th>label</th>
              <th>in store?</th>
              <th>type</th>
              <th>type=nav?</th>
              <th>link / comp</th>
              <th>verdict</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in resolvedRows"
              :key="row.id"
              :class="rowClass(row)"
            >
              <td class="mono">{{ row.id }}</td>
              <td>{{ row.label }}</td>
              <td>
                <span :class="row.inStore ? 'chip-ok' : 'chip-err'">{{
                  row.inStore ? '✓' : '✗'
                }}</span>
              </td>
              <td class="mono">{{ row.typeRaw ?? '—' }}</td>
              <td>
                <span :class="row.isNav ? 'chip-ok' : 'chip-warn'">{{
                  row.isNav ? '✓' : `✗`
                }}</span>
              </td>
              <td class="mono">{{ row.linkOrComp || '—' }}</td>
              <td>
                <span :class="verdictChip(row.verdict)">{{ row.verdict }}</span>
              </td>
            </tr>
            <tr v-if="!resolvedRows.length">
              <td
                colspan="7"
                style="text-align: center; color: var(--debug-muted)"
              >
                no IDs to resolve
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Active icons vs rowIcons delta -->
    <section class="block">
      <h3 class="block-title">activeIcons vs rowIcons (nav only)</h3>
      <div class="kv-row">
        <span class="kv-key">activeIcons</span>
        <span class="kv-val">{{
          activeIcons.map((i) => `#${i.id} ${i.label}`).join(', ') || '—'
        }}</span>
      </div>
      <div class="kv-row">
        <span class="kv-key">rowIcons (nav)</span>
        <span class="kv-val">{{
          navIcons.map((i) => `#${i.id} ${i.label}`).join(', ') || '—'
        }}</span>
      </div>
      <div v-if="droppedByNavFilter.length" class="notice notice-warn">
        ⚠ dropped by type≠nav filter:
        <span
          v-for="i in droppedByNavFilter"
          :key="i.id"
          class="badge badge-warn"
          >#{{ i.id }} {{ i.label }} ({{ i.type || 'no type' }})</span
        >
      </div>
    </section>

    <!-- Trace log -->
    <section class="block">
      <h3 class="block-title">trace log</h3>
      <pre class="trace">{{ traceLog }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSmartbarStore, type SmartIcon } from '@/stores/smartbarStore'
import { useUserStore } from '@/stores/userStore'

const smartbarStore = useSmartbarStore()
const userStore = useUserStore()

const { icons, activeIcons, customIconsEnabled } = storeToRefs(smartbarStore)
const { user } = storeToRefs(userStore)

// --- Raw smartBar string from the user record ---
const rawSmartBar = computed(() => user.value?.smartBar ?? '')

// --- Replicate smartBarIds exactly as the store does ---
const smartBarIds = computed<number[]>(() => {
  const raw = rawSmartBar.value
  return (
    raw
      ?.split(',')
      .map((v: string) => Number(v))
      .filter((n: number) => Number.isFinite(n) && n > 0) ?? []
  )
})

// --- Tokens that got silently dropped by the filter ---
const droppedTokens = computed(() => {
  const raw = rawSmartBar.value
  if (!raw) return []
  return raw.split(',').filter((v) => {
    const n = Number(v)
    return !Number.isFinite(n) || n <= 0
  })
})

// --- rowIcons equivalent (nav only) ---
const navIcons = computed(() =>
  activeIcons.value.filter((i) => (i.type ?? '').toLowerCase() === 'nav'),
)

// --- Icons in activeIcons that got filtered out because type !== 'nav' ---
const droppedByNavFilter = computed(() =>
  activeIcons.value.filter((i) => (i.type ?? '').toLowerCase() !== 'nav'),
)

// --- Per-ID resolution rows ---
interface ResolvedRow {
  id: number
  label: string
  inStore: boolean
  typeRaw: string | null
  isNav: boolean
  linkOrComp: string | null
  verdict: string
}

const resolvedRows = computed<ResolvedRow[]>(() => {
  const ids = customIconsEnabled.value
    ? smartBarIds.value
    : smartbarStore.defaultIconIds

  return ids.map((id) => {
    const icon = icons.value.find((i: SmartIcon) => i.id === id)
    if (!icon) {
      return {
        id,
        label: '— not found',
        inStore: false,
        typeRaw: null,
        isNav: false,
        linkOrComp: null,
        verdict: 'silent drop',
      }
    }
    const typeRaw = icon.type ?? null
    const isNav = (typeRaw ?? '').toLowerCase() === 'nav'
    const hasLink = !!icon.link
    const hasComponent = !!icon.component
    const linkOrComp = icon.link ?? icon.component ?? null
    let verdict = 'filtered out'
    if (isNav) verdict = 'visible'
    else if (hasComponent) verdict = 'utility'

    return {
      id,
      label: icon.label || icon.title || '—',
      inStore: true,
      typeRaw,
      isNav,
      linkOrComp,
      verdict,
    }
  })
})

// --- Trace log string ---
const traceLog = computed(() => {
  const lines: string[] = []
  const log = (...args: unknown[]) => lines.push(args.join(' '))

  log('[smartbar] customIconsEnabled:', customIconsEnabled.value)
  if (!customIconsEnabled.value) {
    log(
      '[smartbar] ⚠ falling back to defaultIconIds:',
      JSON.stringify(smartbarStore.defaultIconIds),
    )
  }
  log('[smartbar] raw smartBar:', JSON.stringify(rawSmartBar.value))
  log('[smartbar] parsed IDs:', JSON.stringify(smartBarIds.value))
  if (droppedTokens.value.length) {
    log('[smartbar] ⚠ dropped tokens:', JSON.stringify(droppedTokens.value))
  }
  log('[smartbar] --- per-ID resolution ---')
  resolvedRows.value.forEach((row) => {
    if (!row.inStore) {
      log(`[id=${row.id}] ❌ NOT in icons.value — load race or wrong ID`)
      return
    }
    if (!row.isNav) {
      log(
        `[id=${row.id}] ⚠ type="${row.typeRaw ?? ''}" — excluded by rowIcons nav filter`,
      )
      if (row.verdict === 'utility')
        log(`[id=${row.id}]    → has component, shows as utility`)
      else log(`[id=${row.id}]    → no component either — silent drop`)
      return
    }
    if (row.typeRaw !== 'nav') {
      log(
        `[id=${row.id}] ⚠ type="${row.typeRaw}" — casing mismatch, passes toLowerCase check but not strict`,
      )
    }
    if (!row.linkOrComp) {
      log(
        `[id=${row.id}] ⚠ type=nav but no link — renders fallback icon, no navigation`,
      )
    } else {
      log(`[id=${row.id}] ✓ visible → ${row.linkOrComp}`)
    }
  })
  log(
    '[smartbar] activeIcons:',
    activeIcons.value.map((i: SmartIcon) => `#${i.id}`).join(', ') || '(none)',
  )
  log(
    '[smartbar] navIcons (rowIcons):',
    navIcons.value.map((i: SmartIcon) => `#${i.id}`).join(', ') || '(none)',
  )
  if (droppedByNavFilter.value.length) {
    log(
      '[smartbar] ⚠ dropped by nav filter:',
      droppedByNavFilter.value
        .map((i: SmartIcon) => `#${i.id} (${i.type})`)
        .join(', '),
    )
  }
  return lines.join('\n')
})

// --- CSS helpers ---
function rowClass(row: ResolvedRow) {
  if (!row.inStore) return 'row-err'
  if (row.verdict === 'silent drop' || row.verdict === 'filtered out')
    return 'row-warn'
  return ''
}

function verdictChip(v: string) {
  if (v === 'visible') return 'chip-ok'
  if (v === 'utility') return 'chip-ok'
  if (v === 'filtered out') return 'chip-warn'
  return 'chip-err'
}
</script>

<style scoped>
.debugger {
  font-family: 'Menlo', 'Consolas', 'Monaco', ui-monospace, monospace;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  --debug-ok: oklch(40% 0.12 145);
  --debug-warn: oklch(50% 0.14 70);
  --debug-err: oklch(45% 0.15 25);
  --debug-muted: oklch(55% 0 0);
  --debug-border: oklch(80% 0 0 / 0.15);
  --debug-bg: oklch(97% 0 0);
  --debug-surface: oklch(94% 0 0);
}

@media (prefers-color-scheme: dark) {
  .debugger {
    --debug-ok: oklch(72% 0.14 145);
    --debug-warn: oklch(78% 0.14 75);
    --debug-err: oklch(68% 0.14 25);
    --debug-muted: oklch(55% 0 0);
    --debug-border: oklch(100% 0 0 / 0.1);
    --debug-bg: oklch(18% 0 0);
    --debug-surface: oklch(22% 0 0);
  }
}

.debugger-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.debugger-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--debug-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.debugger-meta {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.block {
  background: var(--debug-surface);
  border: 1px solid var(--debug-border);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.block-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--debug-muted);
  margin-bottom: 0.25rem;
}

.kv-row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  line-height: 1.6;
}

.kv-key {
  color: var(--debug-muted);
  min-width: 130px;
  flex-shrink: 0;
}

.kv-val {
  color: inherit;
  word-break: break-all;
}

code.kv-val {
  background: var(--debug-bg);
  padding: 1px 5px;
  border-radius: 4px;
}

/* badges */
.badge {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  border: 1px solid transparent;
}
.badge-ok {
  color: var(--debug-ok);
  border-color: var(--debug-ok);
}
.badge-warn {
  color: var(--debug-warn);
  border-color: var(--debug-warn);
}
.badge-neutral {
  color: var(--debug-muted);
  border-color: var(--debug-border);
}

/* table chips */
.chip-ok {
  color: var(--debug-ok);
  font-weight: 600;
}
.chip-warn {
  color: var(--debug-warn);
  font-weight: 600;
}
.chip-err {
  color: var(--debug-err);
  font-weight: 600;
}

.notice {
  font-size: 11px;
  padding: 0.5rem 0.6rem;
  border-radius: 5px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
  line-height: 1.6;
}
.notice-warn {
  background: oklch(97% 0.04 75);
  color: var(--debug-warn);
  border: 1px solid oklch(85% 0.08 75);
}
@media (prefers-color-scheme: dark) {
  .notice-warn {
    background: oklch(20% 0.04 75);
    border-color: oklch(35% 0.08 75);
  }
}

.table-wrap {
  overflow-x: auto;
}

.icon-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.icon-table th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--debug-muted);
  padding: 0 8px 6px 0;
  border-bottom: 1px solid var(--debug-border);
}
.icon-table td {
  padding: 5px 8px 5px 0;
  border-bottom: 1px solid var(--debug-border);
  vertical-align: middle;
}
.icon-table tbody tr:last-child td {
  border-bottom: none;
}
.icon-table tbody .row-err td {
  background: oklch(97% 0.03 25);
}
.icon-table tbody .row-warn td {
  background: oklch(98% 0.03 75);
}
@media (prefers-color-scheme: dark) {
  .icon-table tbody .row-err td {
    background: oklch(18% 0.03 25);
  }
  .icon-table tbody .row-warn td {
    background: oklch(18% 0.03 75);
  }
}
.mono {
  font-family: inherit;
}

.trace {
  background: var(--debug-bg);
  border: 1px solid var(--debug-border);
  border-radius: 5px;
  padding: 0.6rem 0.75rem;
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 280px;
  overflow-y: auto;
  color: inherit;
}
</style>
