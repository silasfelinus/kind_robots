<!-- /components/content/bots/bot-manager.vue -->
<template>
  <div class="bot-manager" :class="`mode-${activeMode}`">
    <!-- ── Header bar ───────────────────────────────────────────── -->
    <header class="bm-header">
      <div class="bm-header-brand">
        <span class="bm-logo">⬡</span>
        <span class="bm-title">Bot Manager</span>
        <span class="bm-count">{{ bots.length }} available</span>
      </div>

      <nav class="bm-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="bm-tab"
          :class="{ active: activeMode === tab.id }"
          @click="activeMode = tab.id"
        >
          <span class="bm-tab-icon">{{ tab.icon }}</span>
          <span class="bm-tab-label">{{ tab.label }}</span>
        </button>
      </nav>

      <div class="bm-header-actions">
        <button
          v-if="botStore.currentBot"
          class="bm-clear-btn"
          @click="clearBot"
        >
          Clear Selection
        </button>
      </div>
    </header>

    <!-- ── Body ─────────────────────────────────────────────────── -->
    <div class="bm-body">
      <!-- ══ ROSTER MODE ══════════════════════════════════════════ -->
      <section v-if="activeMode === 'roster'" class="bm-roster">
        <!-- Search + filter -->
        <div class="bm-search-bar">
          <input
            v-model="searchQuery"
            class="bm-search-input"
            placeholder="Search bots…"
            type="search"
          />
          <label class="bm-filter-toggle">
            <input v-model="showConstructionOnly" type="checkbox" />
            <span>Under construction only</span>
          </label>
          <label class="bm-filter-toggle">
            <input v-model="showPublicOnly" type="checkbox" />
            <span>Public only</span>
          </label>
        </div>

        <!-- Bot grid -->
        <div v-if="filteredBots.length" class="bm-grid">
          <button
            v-for="bot in filteredBots"
            :key="bot.id"
            class="bm-bot-card"
            :class="{ selected: botStore.currentBot?.id === bot.id }"
            @click="selectBot(bot.id)"
          >
            <div class="bm-bot-card-avatar-wrap">
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot avatar'"
                class="bm-bot-card-avatar"
              />
              <span v-if="bot.underConstruction" class="bm-badge bm-badge-warn"
                >WIP</span
              >
              <span v-else-if="bot.isPublic" class="bm-badge bm-badge-ok"
                >PUB</span
              >
            </div>
            <div class="bm-bot-card-body">
              <p class="bm-bot-card-name">{{ bot.name || 'Unnamed Bot' }}</p>
              <p class="bm-bot-card-sub">
                {{ bot.subtitle || bot.description || '—' }}
              </p>
            </div>
            <div
              v-if="botStore.currentBot?.id === bot.id"
              class="bm-bot-card-selected-indicator"
              aria-label="Selected"
            />
          </button>
        </div>

        <div v-else class="bm-empty">
          <p>No bots match your filter.</p>
          <button class="bm-btn bm-btn-secondary" @click="resetFilters">
            Reset filters
          </button>
        </div>

        <!-- Sticky selected-bot bar -->
        <transition name="bm-slide-up">
          <div v-if="botStore.currentBot" class="bm-selected-bar">
            <img
              :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
              :alt="botStore.currentBot.name || 'Bot'"
              class="bm-selected-bar-avatar"
            />
            <div class="bm-selected-bar-info">
              <span class="bm-selected-bar-name">{{
                botStore.currentBot.name
              }}</span>
              <span class="bm-selected-bar-desc">{{
                botStore.currentBot.description
              }}</span>
            </div>
            <div class="bm-selected-bar-actions">
              <button
                class="bm-btn bm-btn-ghost bm-btn-sm"
                @click="goToMode('command')"
              >
                Chat →
              </button>
              <button
                class="bm-btn bm-btn-primary bm-btn-sm"
                @click="launchBot"
              >
                Open in Bots
              </button>
            </div>
          </div>
        </transition>
      </section>

      <!-- ══ COMMAND MODE ══════════════════════════════════════════ -->
      <section v-if="activeMode === 'command'" class="bm-command">
        <!-- Left: bot picker strip -->
        <aside class="bm-command-sidebar">
          <p class="bm-sidebar-label">Select a bot</p>
          <div class="bm-command-bot-list">
            <button
              v-for="bot in bots"
              :key="`cmd-${bot.id}`"
              class="bm-command-bot-item"
              :class="{ active: botStore.currentBot?.id === bot.id }"
              @click="selectBot(bot.id)"
            >
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot'"
                class="bm-command-bot-avatar"
              />
              <span class="bm-command-bot-name">{{
                bot.name || 'Unnamed'
              }}</span>
            </button>
          </div>
          <button
            class="bm-btn bm-btn-secondary bm-btn-sm bm-btn-full"
            @click="goToMode('forge')"
          >
            + Create Bot
          </button>
        </aside>

        <!-- Right: bot detail + composer -->
        <div class="bm-command-main">
          <div v-if="botStore.currentBot" class="bm-command-detail">
            <!-- Bot hero -->
            <div class="bm-bot-hero">
              <img
                :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                :alt="botStore.currentBot.name || 'Bot'"
                class="bm-bot-hero-avatar"
              />
              <div class="bm-bot-hero-info">
                <h2 class="bm-bot-hero-name">{{ botStore.currentBot.name }}</h2>
                <p v-if="botStore.currentBot.subtitle" class="bm-bot-hero-sub">
                  {{ botStore.currentBot.subtitle }}
                </p>
                <p class="bm-bot-hero-desc">
                  {{ botStore.currentBot.description || 'A bot of mystery.' }}
                </p>
              </div>
            </div>

            <!-- Quick-prompt chips -->
            <div v-if="parsedUserPrompts.length" class="bm-prompts">
              <p class="bm-prompts-label">Quick starts</p>
              <div class="bm-prompt-chips">
                <button
                  v-for="p in parsedUserPrompts"
                  :key="p.id"
                  class="bm-chip"
                  @click="usePrompt(p.text)"
                >
                  {{ p.text }}
                </button>
              </div>
            </div>

            <!-- Composer -->
            <div class="bm-composer">
              <div class="bm-composer-header">
                <span class="bm-composer-label">Opening message</span>
                <div class="bm-composer-helpers">
                  <button
                    class="bm-btn bm-btn-ghost bm-btn-xs"
                    @click="fillStarter"
                  >
                    Starter
                  </button>
                  <button
                    class="bm-btn bm-btn-ghost bm-btn-xs"
                    @click="fillWeird"
                  >
                    Weird
                  </button>
                  <button
                    class="bm-btn bm-btn-ghost bm-btn-xs"
                    @click="clearMessage"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                v-model="launchMessage"
                class="bm-textarea"
                rows="4"
                placeholder="Give your bot a first line…"
              />
              <div class="bm-composer-footer">
                <div class="bm-composer-preview">
                  <span class="bm-preview-label">Preview →</span>
                  <span class="bm-preview-text">{{
                    launchMessage || '…'
                  }}</span>
                </div>
                <button
                  class="bm-btn bm-btn-primary"
                  :disabled="!launchMessage.trim()"
                  @click="launchBot"
                >
                  Open in Bots
                </button>
              </div>
            </div>
          </div>

          <!-- No-bot empty state -->
          <div v-else class="bm-command-empty">
            <div class="bm-command-empty-icon">⬡</div>
            <p class="bm-command-empty-title">No bot selected</p>
            <p class="bm-command-empty-sub">
              Pick one from the sidebar, or browse the full roster.
            </p>
            <button class="bm-btn bm-btn-secondary" @click="goToMode('roster')">
              Browse Bots
            </button>
          </div>
        </div>
      </section>

      <!-- ══ FORGE MODE ════════════════════════════════════════════ -->
      <section v-if="activeMode === 'forge'" class="bm-forge">
        <!-- Inline bot selector for editing existing -->
        <div class="bm-forge-top-bar">
          <div class="bm-forge-top-info">
            <span class="bm-forge-mode-label">
              {{ botStore.selectedBotId ? 'Editing' : 'Creating new bot' }}
            </span>
            <span v-if="botStore.currentBot" class="bm-forge-editing-name">
              {{ botStore.currentBot.name }}
            </span>
          </div>
          <div class="bm-forge-top-actions">
            <button
              v-if="botStore.currentBot"
              class="bm-btn bm-btn-ghost bm-btn-sm"
              @click="botStore.deselectBot()"
            >
              New Bot instead
            </button>
            <select class="bm-select" @change="onForgeSelect">
              <option value="">— Edit existing bot —</option>
              <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                {{ bot.name || `Bot #${bot.id}` }}
              </option>
            </select>
          </div>
        </div>

        <!-- Delegate to the existing add-bot component -->
        <add-bot />
      </section>
    </div>
    <!-- /bm-body -->

    <!-- ── Loading overlay ──────────────────────────────────────── -->
    <transition name="bm-fade">
      <div v-if="isLoading" class="bm-loading-overlay">
        <span class="bm-spinner" />
        <span>Loading bots…</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBotStore } from '@/stores/botStore'

type Mode = 'roster' | 'command' | 'forge'

const router = useRouter()
const botStore = useBotStore()

// ── State ──────────────────────────────────────────────────────────
const activeMode = ref<Mode>('roster')
const searchQuery = ref('')
const showConstructionOnly = ref(false)
const showPublicOnly = ref(false)
const isLoading = ref(false)
const launchMessage = ref('')

// ── Tabs config ────────────────────────────────────────────────────
const tabs = [
  { id: 'roster' as Mode, label: 'Roster', icon: '⊞' },
  { id: 'command' as Mode, label: 'Command', icon: '⌖' },
  { id: 'forge' as Mode, label: 'Forge', icon: '⬡' },
]

// ── Computed ───────────────────────────────────────────────────────
const bots = computed(() => botStore.bots)

const filteredBots = computed(() => {
  let result = bots.value
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(
      (b) =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.subtitle || '').toLowerCase().includes(q),
    )
  }
  if (showConstructionOnly.value) {
    result = result.filter((b) => b.underConstruction)
  }
  if (showPublicOnly.value) {
    result = result.filter((b) => b.isPublic)
  }
  return result
})

const parsedUserPrompts = computed(() => {
  const raw = botStore.currentBot?.userIntro || ''
  return raw
    .split('|')
    .map((t: string) => t.trim())
    .filter(Boolean)
    .map((text: string, i: number) => ({ id: i, text }))
})

// ── Methods ────────────────────────────────────────────────────────
async function selectBot(botId: number) {
  await botStore.selectBot(botId)
}

function clearBot() {
  botStore.deselectBot()
  launchMessage.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  showConstructionOnly.value = false
  showPublicOnly.value = false
}

function goToMode(mode: Mode) {
  activeMode.value = mode
}

function usePrompt(text: string) {
  launchMessage.value = text
}

function fillStarter() {
  const name = botStore.currentBot?.name
  launchMessage.value = name
    ? `Hey ${name}, I want your help with something.`
    : 'Hey bot, I want your help with something.'
}

function fillWeird() {
  const name = botStore.currentBot?.name
  launchMessage.value = name
    ? `Hey ${name}, let's make something strange, clever, and unexpectedly excellent.`
    : "Let's make something strange, clever, and unexpectedly excellent."
}

function clearMessage() {
  launchMessage.value = ''
}

async function launchBot() {
  if (!botStore.currentBot || !launchMessage.value.trim()) return
  botStore.setPendingLaunchMessage(launchMessage.value)
  await router.push('/bots')
}

function onForgeSelect(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (id) botStore.selectBot(id)
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  if (!bots.value.length) {
    isLoading.value = true
    await botStore.initialize()
    isLoading.value = false
  }
})
</script>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────── */
.bot-manager {
  --bm-amber: #d97706;
  --bm-amber-l: #fef3c7;
  --bm-teal: #0f766e;
  --bm-teal-l: #ccfbf1;
  --bm-red: #b91c1c;
  --bm-green: #15803d;
  --bm-radius: 0.75rem;
  --bm-radius-sm: 0.375rem;
  --bm-font-display: 'Exo 2', 'Segoe UI', system-ui, sans-serif;
  --bm-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  font-family: var(--bm-font-display);
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: var(--b3, oklch(var(--b3)));
  color: var(--bc, currentColor);
  position: relative;
  overflow: hidden;
}

/* ── Header ────────────────────────────────────────────────── */
.bm-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: var(--b1, oklch(var(--b1)));
  border-bottom: 1px solid var(--b3, oklch(var(--b3)));
  flex-shrink: 0;
  flex-wrap: wrap;
}

.bm-header-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
}

.bm-logo {
  font-size: 1.5rem;
  color: var(--bm-amber);
  line-height: 1;
}

.bm-title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.bm-count {
  font-size: 0.7rem;
  font-family: var(--bm-font-mono);
  opacity: 0.5;
  align-self: flex-end;
  padding-bottom: 0.1rem;
}

/* ── Tabs ──────────────────────────────────────────────────── */
.bm-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--b2, oklch(var(--b2)));
  padding: 0.25rem;
  border-radius: var(--bm-radius);
  border: 1px solid var(--b3, oklch(var(--b3)));
}

.bm-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.85rem;
  border-radius: calc(var(--bm-radius) - 2px);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  color: var(--bc, currentColor);
  opacity: 0.55;
  transition: all 0.15s ease;
}

.bm-tab:hover {
  opacity: 0.85;
  background: var(--b3, oklch(var(--b3)));
}

.bm-tab.active {
  background: var(--b1, oklch(var(--b1)));
  opacity: 1;
  color: var(--bm-amber);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.bm-tab-icon {
  font-size: 0.95rem;
}

/* ── Clear btn ─────────────────────────────────────────────── */
.bm-clear-btn {
  font-size: 0.75rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--bm-radius-sm);
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
  opacity: 0.55;
  font-family: inherit;
  color: inherit;
  transition: opacity 0.15s;
}
.bm-clear-btn:hover {
  opacity: 1;
}

/* ── Body ──────────────────────────────────────────────────── */
.bm-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ══ ROSTER ════════════════════════════════════════════════════ */
.bm-roster {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bm-search-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--b3, oklch(var(--b3)));
  flex-shrink: 0;
  background: var(--b1, oklch(var(--b1)));
}

.bm-search-input {
  flex: 1;
  min-width: 180px;
  padding: 0.45rem 0.75rem;
  border-radius: var(--bm-radius-sm);
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b2, oklch(var(--b2)));
  font-family: inherit;
  font-size: 0.875rem;
  color: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.bm-search-input:focus {
  border-color: var(--bm-amber);
}

.bm-filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  opacity: 0.7;
  cursor: pointer;
  user-select: none;
}
.bm-filter-toggle:hover {
  opacity: 1;
}

/* Grid */
.bm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1;
  padding-bottom: 6rem; /* room for selected bar */
}

.bm-bot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem 0.85rem;
  border-radius: var(--bm-radius);
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b1, oklch(var(--b1)));
  cursor: pointer;
  text-align: center;
  transition:
    border-color 0.15s,
    transform 0.12s,
    box-shadow 0.15s;
  font-family: inherit;
  color: inherit;
}
.bm-bot-card:hover {
  border-color: var(--bm-amber);
  transform: translateY(-2px);
}
.bm-bot-card.selected {
  border-color: var(--bm-amber);
  background: color-mix(in oklch, var(--bm-amber) 6%, var(--b1, white));
}

.bm-bot-card-avatar-wrap {
  position: relative;
  width: 4rem;
  height: 4rem;
  flex-shrink: 0;
}

.bm-bot-card-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid var(--b3, oklch(var(--b3)));
}
.bm-bot-card.selected .bm-bot-card-avatar {
  border-color: var(--bm-amber);
}

.bm-badge {
  position: absolute;
  bottom: -2px;
  right: -4px;
  font-size: 0.55rem;
  font-weight: 700;
  font-family: var(--bm-font-mono);
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.05em;
}
.bm-badge-warn {
  background: var(--bm-amber-l);
  color: var(--bm-amber);
}
.bm-badge-ok {
  background: var(--bm-teal-l);
  color: var(--bm-teal);
}

.bm-bot-card-body {
  width: 100%;
}
.bm-bot-card-name {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bm-bot-card-sub {
  font-size: 0.72rem;
  opacity: 0.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bm-bot-card-selected-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bm-amber);
}

/* Empty state */
.bm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  opacity: 0.6;
  font-size: 0.9rem;
}

/* Selected bot sticky bar */
.bm-selected-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--b1, oklch(var(--b1)));
  border-top: 1px solid var(--bm-amber);
  flex-wrap: wrap;
}

.bm-selected-bar-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--bm-amber);
  flex-shrink: 0;
}

.bm-selected-bar-info {
  flex: 1;
  min-width: 0;
}

.bm-selected-bar-name {
  display: block;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-selected-bar-desc {
  display: block;
  font-size: 0.75rem;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bm-selected-bar-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Slide-up transition */
.bm-slide-up-enter-active,
.bm-slide-up-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.2s ease;
}
.bm-slide-up-enter-from,
.bm-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ══ COMMAND ═══════════════════════════════════════════════════ */
.bm-command {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.bm-command-sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b1, oklch(var(--b1)));
  overflow: hidden;
}

.bm-sidebar-label {
  font-size: 0.7rem;
  font-family: var(--bm-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.45;
  padding: 0.75rem 1rem 0.4rem;
  flex-shrink: 0;
}

.bm-command-bot-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bm-command-bot-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: calc(var(--bm-radius) - 2px);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  transition:
    background 0.12s,
    border-color 0.12s;
}
.bm-command-bot-item:hover {
  background: var(--b2, oklch(var(--b2)));
}
.bm-command-bot-item.active {
  background: color-mix(in oklch, var(--bm-amber) 10%, var(--b2, white));
  border-color: var(--bm-amber);
}

.bm-command-bot-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--b3, oklch(var(--b3)));
}

.bm-command-bot-name {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Command main */
.bm-command-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.bm-command-detail {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  max-width: 780px;
}

/* Bot hero */
.bm-bot-hero {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.25rem;
  border-radius: var(--bm-radius);
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b1, oklch(var(--b1)));
}

.bm-bot-hero-avatar {
  width: 6rem;
  height: 6rem;
  border-radius: var(--bm-radius);
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid var(--bm-amber);
}

.bm-bot-hero-info {
  flex: 1;
  min-width: 0;
}

.bm-bot-hero-name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 0.2rem;
}

.bm-bot-hero-sub {
  font-size: 0.85rem;
  opacity: 0.6;
  margin: 0 0 0.5rem;
  font-style: italic;
}

.bm-bot-hero-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.8;
}

/* Prompt chips */
.bm-prompts {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bm-prompts-label {
  font-size: 0.7rem;
  font-family: var(--bm-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.45;
  margin: 0;
}

.bm-prompt-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.bm-chip {
  padding: 0.35rem 0.85rem;
  border-radius: 99px;
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b2, oklch(var(--b2)));
  font-size: 0.8rem;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
  transition:
    border-color 0.12s,
    background 0.12s;
}
.bm-chip:hover {
  border-color: var(--bm-amber);
  background: color-mix(in oklch, var(--bm-amber) 8%, var(--b2, white));
}

/* Composer */
.bm-composer {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  border-radius: var(--bm-radius);
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b1, oklch(var(--b1)));
  overflow: hidden;
}

.bm-composer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.875rem;
  border-bottom: 1px solid var(--b3, oklch(var(--b3)));
}

.bm-composer-label {
  font-size: 0.8rem;
  font-weight: 700;
}

.bm-composer-helpers {
  display: flex;
  gap: 0.375rem;
}

.bm-textarea {
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.6;
  color: inherit;
  resize: vertical;
  outline: none;
  min-height: 6rem;
}

.bm-composer-footer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.875rem;
  border-top: 1px solid var(--b3, oklch(var(--b3)));
  flex-wrap: wrap;
}

.bm-composer-preview {
  flex: 1;
  min-width: 0;
  font-size: 0.78rem;
  opacity: 0.55;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.bm-preview-label {
  font-family: var(--bm-font-mono);
  margin-right: 0.375rem;
}

/* Command empty state */
.bm-command-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.bm-command-empty-icon {
  font-size: 3.5rem;
  opacity: 0.15;
}

.bm-command-empty-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.bm-command-empty-sub {
  font-size: 0.85rem;
  opacity: 0.55;
  margin: 0;
  max-width: 24rem;
}

/* ══ FORGE ══════════════════════════════════════════════════════ */
.bm-forge {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bm-forge-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b1, oklch(var(--b1)));
  flex-shrink: 0;
  flex-wrap: wrap;
}

.bm-forge-top-info {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.bm-forge-mode-label {
  font-size: 0.75rem;
  font-family: var(--bm-font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.5;
}

.bm-forge-editing-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--bm-amber);
}

.bm-forge-top-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ── Buttons ───────────────────────────────────────────────── */
.bm-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: var(--bm-radius-sm);
  border: 1px solid transparent;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.12s,
    border-color 0.12s,
    opacity 0.12s,
    transform 0.1s;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  line-height: 1;
  white-space: nowrap;
}
.bm-btn:active {
  transform: scale(0.97);
}
.bm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.bm-btn-primary {
  background: var(--bm-amber);
  color: #fff;
  border-color: var(--bm-amber);
}
.bm-btn-primary:hover:not(:disabled) {
  background: color-mix(in oklch, var(--bm-amber) 85%, black);
}

.bm-btn-secondary {
  background: var(--b2, oklch(var(--b2)));
  border-color: var(--b3, oklch(var(--b3)));
  color: inherit;
}
.bm-btn-secondary:hover {
  background: var(--b3, oklch(var(--b3)));
}

.bm-btn-ghost {
  background: transparent;
  border-color: transparent;
  color: inherit;
  opacity: 0.65;
}
.bm-btn-ghost:hover {
  opacity: 1;
  background: var(--b2, oklch(var(--b2)));
}

.bm-btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.78rem;
}
.bm-btn-xs {
  padding: 0.25rem 0.55rem;
  font-size: 0.72rem;
}
.bm-btn-full {
  width: 100%;
  justify-content: center;
}

/* ── Select ────────────────────────────────────────────────── */
.bm-select {
  padding: 0.35rem 0.625rem;
  border-radius: var(--bm-radius-sm);
  border: 1px solid var(--b3, oklch(var(--b3)));
  background: var(--b2, oklch(var(--b2)));
  font-family: inherit;
  font-size: 0.8rem;
  color: inherit;
  cursor: pointer;
  outline: none;
}
.bm-select:focus {
  border-color: var(--bm-amber);
}

/* ── Loading overlay ───────────────────────────────────────── */
.bm-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: color-mix(in oklch, var(--b1, white) 85%, transparent);
  font-size: 0.9rem;
  font-family: var(--bm-font-mono);
  z-index: 50;
}

.bm-spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid var(--b3, oklch(var(--b3)));
  border-top-color: var(--bm-amber);
  animation: bm-spin 0.7s linear infinite;
}

@keyframes bm-spin {
  to {
    transform: rotate(360deg);
  }
}

.bm-fade-enter-active,
.bm-fade-leave-active {
  transition: opacity 0.2s;
}
.bm-fade-enter-from,
.bm-fade-leave-to {
  opacity: 0;
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 640px) {
  .bm-command {
    flex-direction: column;
  }
  .bm-command-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--b3, oklch(var(--b3)));
    max-height: 10rem;
  }
  .bm-command-bot-list {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    flex: unset;
    padding: 0.25rem 0.5rem;
  }
  .bm-command-bot-item {
    flex-direction: column;
    min-width: 4.5rem;
    padding: 0.5rem;
  }
  .bm-command-bot-name {
    font-size: 0.65rem;
    text-align: center;
  }
  .bm-tab-label {
    display: none;
  }
  .bm-tab-icon {
    font-size: 1.1rem;
  }
}
</style>
