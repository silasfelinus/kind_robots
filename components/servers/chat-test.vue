<script setup lang="ts">
// ─── Types ───────────────────────────────────────────────────────────────────
type Provider = 'anthropic' | 'openai' | 'ollama'

interface ProviderConfig {
  label: string
  route: string
  defaultModel: string
  models: string[]
  color: string
  icon: string
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PROVIDERS: Record<Provider, ProviderConfig> = {
  anthropic: {
    label: 'Anthropic',
    route: '/api/chats/anthropic/stream',
    defaultModel: 'claude-sonnet-4-6',
    models: [
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-haiku-4-5-20251001',
    ],
    color: '#d4a853',
    icon: '◈',
  },
  openai: {
    label: 'OpenAI',
    route: '/api/chats/openai/stream',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
    color: '#4ade80',
    icon: '◎',
  },
  ollama: {
    label: 'Ollama',
    route: '/api/chats/ollama/stream',
    defaultModel: 'llama3.2',
    models: ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'gemma2'],
    color: '#60a5fa',
    icon: '◉',
  },
}

// ─── State ────────────────────────────────────────────────────────────────────
const provider = ref<Provider>('anthropic')
const model = ref(PROVIDERS.anthropic.defaultModel)
const prompt = ref('Hello! Tell me a one-sentence joke about robots.')
const system = ref('')
const temperature = ref(0.7)
const maxTokens = ref(512)
const streamEnabled = ref(true)
const showPayload = ref(false)
const showErrors = ref(true)
const ollamaBaseUrl = ref('http://localhost:11434')

const isLoading = ref(false)
const output = ref('')
const errorMsg = ref('')
const elapsedMs = ref(0)
const tokenCount = ref(0)
const startTime = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const cfg = computed(() => PROVIDERS[provider.value])

// keep model in sync when provider changes
watch(provider, (p) => {
  model.value = PROVIDERS[p].defaultModel
  errorMsg.value = ''
  output.value = ''
})

// ─── Payload preview ──────────────────────────────────────────────────────────
const payloadPreview = computed(() => {
  const base: Record<string, unknown> = {
    model: model.value,
    prompt: prompt.value,
    stream: streamEnabled.value,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
  }
  if (system.value) base.system = system.value
  if (provider.value === 'ollama') base.baseUrl = ollamaBaseUrl.value
  return JSON.stringify(base, null, 2)
})

// ─── Stream helpers ───────────────────────────────────────────────────────────
function countTokens(text: string) {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
}

function startTimer() {
  startTime.value = Date.now()
  elapsedMs.value = 0
  timerInterval = setInterval(() => {
    elapsedMs.value = Date.now() - startTime.value
  }, 50)
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval)
  elapsedMs.value = Date.now() - startTime.value
}

function extractDelta(raw: string, prov: Provider): string {
  try {
    const parsed = JSON.parse(raw)
    if (prov === 'anthropic') {
      if (parsed.type === 'content_block_delta') {
        return parsed.delta?.text ?? ''
      }
      return ''
    }
    if (prov === 'openai') {
      return parsed.choices?.[0]?.delta?.content ?? ''
    }
    if (prov === 'ollama') {
      return parsed.message?.content ?? parsed.response ?? ''
    }
  } catch {
    // ignore parse errors on partial lines
  }
  return ''
}

// ─── Main executor ────────────────────────────────────────────────────────────
async function run() {
  if (isLoading.value) return
  output.value = ''
  errorMsg.value = ''
  tokenCount.value = 0
  isLoading.value = true
  startTimer()

  const body: Record<string, unknown> = {
    model: model.value,
    prompt: prompt.value,
    stream: streamEnabled.value,
    temperature: temperature.value,
    maxTokens: maxTokens.value,
  }
  if (system.value) body.system = system.value
  if (provider.value === 'ollama') body.baseUrl = ollamaBaseUrl.value

  try {
    const res = await fetch(cfg.value.route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    if (!streamEnabled.value) {
      // Non-stream: just read JSON
      const data = await res.json()
      const text =
        data?.content?.[0]?.text ??
        data?.choices?.[0]?.message?.content ??
        data?.message?.content ??
        JSON.stringify(data, null, 2)
      output.value = text
      tokenCount.value = countTokens(text)
    } else {
      // Stream
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (
            !trimmed ||
            trimmed === 'data: [DONE]' ||
            trimmed.startsWith('event:')
          )
            continue
          const jsonStr = trimmed.startsWith('data: ')
            ? trimmed.slice(6)
            : trimmed
          const delta = extractDelta(jsonStr, provider.value)
          if (delta) {
            output.value += delta
            tokenCount.value = countTokens(output.value)
          }
        }
      }
    }
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : String(err)
  } finally {
    stopTimer()
    isLoading.value = false
  }
}

function copyOutput() {
  if (typeof window !== 'undefined') {
    window.navigator.clipboard.writeText(output.value)
  }
}

function clear() {
  output.value = ''
  errorMsg.value = ''
  tokenCount.value = 0
  elapsedMs.value = 0
}
</script>

<template>
  <div class="stream-test">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="st-header">
      <div class="st-header-left">
        <span class="st-logo">⟨/⟩</span>
        <div>
          <h1 class="st-title">Stream Test</h1>
          <p class="st-subtitle">API Route Diagnostics</p>
        </div>
      </div>
      <div class="st-badge-row">
        <span class="st-badge" :style="{ '--accent': cfg.color }">
          {{ cfg.icon }} {{ cfg.label }}
        </span>
        <span class="st-badge st-badge-mono">
          {{ streamEnabled ? '⇶ STREAM' : '⬡ BATCH' }}
        </span>
      </div>
    </header>

    <div class="st-layout">
      <!-- ── Left panel: controls ─────────────────────────────────────────── -->
      <aside class="st-sidebar">
        <!-- Provider select -->
        <section class="st-section">
          <label class="st-label">Provider</label>
          <div class="st-provider-tabs">
            <button
              v-for="(pcfg, key) in PROVIDERS"
              :key="key"
              class="st-provider-tab"
              :class="{ active: provider === key }"
              :style="provider === key ? { '--accent': pcfg.color } : {}"
              @click="provider = key as Provider"
            >
              <span class="st-provider-icon">{{ pcfg.icon }}</span>
              {{ pcfg.label }}
            </button>
          </div>
        </section>

        <!-- Model -->
        <section class="st-section">
          <label class="st-label">Model</label>
          <select v-model="model" class="st-select">
            <option v-for="m in cfg.models" :key="m" :value="m">{{ m }}</option>
          </select>
        </section>

        <!-- Ollama base URL -->
        <section v-if="provider === 'ollama'" class="st-section">
          <label class="st-label">Ollama Base URL</label>
          <input v-model="ollamaBaseUrl" class="st-input" type="text" />
        </section>

        <!-- Route display -->
        <section class="st-section">
          <label class="st-label">Route</label>
          <div class="st-route">{{ cfg.route }}</div>
        </section>

        <hr class="st-divider" />

        <!-- Toggles -->
        <section class="st-section">
          <label class="st-label">Options</label>
          <div class="st-toggles">
            <label class="st-toggle">
              <input type="checkbox" v-model="streamEnabled" />
              <span class="st-toggle-track"
                ><span class="st-toggle-thumb"
              /></span>
              Streaming
            </label>
            <label class="st-toggle">
              <input type="checkbox" v-model="showPayload" />
              <span class="st-toggle-track"
                ><span class="st-toggle-thumb"
              /></span>
              Show Payload
            </label>
            <label class="st-toggle">
              <input type="checkbox" v-model="showErrors" />
              <span class="st-toggle-track"
                ><span class="st-toggle-thumb"
              /></span>
              Show Errors
            </label>
          </div>
        </section>

        <hr class="st-divider" />

        <!-- Temperature + Tokens -->
        <section class="st-section">
          <label class="st-label"
            >Temperature <span class="st-val">{{ temperature }}</span></label
          >
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            v-model.number="temperature"
            class="st-range"
          />
        </section>
        <section class="st-section">
          <label class="st-label"
            >Max Tokens <span class="st-val">{{ maxTokens }}</span></label
          >
          <input
            type="range"
            min="64"
            max="4096"
            step="64"
            v-model.number="maxTokens"
            class="st-range"
          />
        </section>
      </aside>

      <!-- ── Right panel: prompt + output ──────────────────────────────────── -->
      <main class="st-main">
        <!-- System prompt -->
        <section class="st-section">
          <label class="st-label"
            >System Prompt <span class="st-optional">(optional)</span></label
          >
          <textarea
            v-model="system"
            class="st-textarea st-textarea--sm"
            placeholder="You are a helpful assistant…"
          />
        </section>

        <!-- User prompt -->
        <section class="st-section">
          <label class="st-label">User Prompt</label>
          <textarea
            v-model="prompt"
            class="st-textarea"
            placeholder="Enter your prompt…"
          />
        </section>

        <!-- Actions -->
        <div class="st-actions">
          <button
            class="st-btn st-btn--primary"
            :disabled="isLoading"
            @click="run"
          >
            <span v-if="isLoading" class="st-spinner" />
            <span v-else>▶ Run</span>
          </button>
          <button
            class="st-btn st-btn--ghost"
            :disabled="isLoading"
            @click="clear"
          >
            ✕ Clear
          </button>
          <div class="st-stats" v-if="elapsedMs > 0">
            <span>{{ (elapsedMs / 1000).toFixed(2) }}s</span>
            <span>~{{ tokenCount }} tok</span>
          </div>
          <div v-if="isLoading" class="st-live-pill">● LIVE</div>
        </div>

        <!-- Payload preview -->
        <Transition name="slide">
          <section v-if="showPayload" class="st-section">
            <label class="st-label">Request Payload</label>
            <pre class="st-code">{{ payloadPreview }}</pre>
          </section>
        </Transition>

        <!-- Error panel -->
        <Transition name="slide">
          <section v-if="showErrors && errorMsg" class="st-section">
            <label class="st-label st-label--error">⚠ Error</label>
            <div class="st-error">{{ errorMsg }}</div>
          </section>
        </Transition>

        <!-- Output -->
        <section class="st-section st-section--grow">
          <div class="st-output-header">
            <label class="st-label">Output</label>
            <button v-if="output" class="st-copy" @click="copyOutput">
              ⧉ Copy
            </button>
          </div>
          <div class="st-output" :class="{ 'st-output--empty': !output }">
            <span v-if="!output && !isLoading" class="st-placeholder"
              >Response will appear here…</span
            >
            <span v-else>{{ output }}</span>
            <span v-if="isLoading" class="st-cursor">▌</span>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ─── Tokens ──────────────────────────────────────────────────────────────── */
.stream-test {
  --bg: #0d0f14;
  --surface: #13161e;
  --surface2: #1a1e2a;
  --border: rgba(255 255 255 / 0.07);
  --text: #e2e8f0;
  --muted: #64748b;
  --accent: #d4a853;
  --red: #f87171;
  --green: #4ade80;

  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
.st-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  flex-shrink: 0;
}
.st-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.st-logo {
  font-size: 1.5rem;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: -0.05em;
}
.st-title {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}
.st-subtitle {
  font-size: 0.65rem;
  color: var(--muted);
  margin: 0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.st-badge-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.st-badge {
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 3px;
  border: 1px solid var(--accent, var(--border));
  color: var(--accent, var(--muted));
  background: transparent;
}
.st-badge-mono {
  color: var(--muted);
  border-color: var(--border);
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */
.st-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  flex: 1;
  overflow: hidden;
}

/* ─── Sidebar ─────────────────────────────────────────────────────────────── */
.st-sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border);
  padding: 1.25rem 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
.st-main {
  padding: 1.25rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ─── Sections ────────────────────────────────────────────────────────────── */
.st-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.st-section--grow {
  flex: 1;
}
.st-label {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.st-label--error {
  color: var(--red);
}
.st-optional {
  opacity: 0.5;
  text-transform: lowercase;
  letter-spacing: 0;
  font-size: 0.6rem;
}
.st-val {
  font-size: 0.75rem;
  color: var(--accent);
  text-transform: lowercase;
  letter-spacing: 0;
}
.st-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0.5rem 0;
}

/* ─── Provider tabs ───────────────────────────────────────────────────────── */
.st-provider-tabs {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.st-provider-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-family: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}
.st-provider-tab:hover {
  background: var(--surface2);
  color: var(--text);
}
.st-provider-tab.active {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
.st-provider-icon {
  font-size: 0.9rem;
}

/* ─── Route display ───────────────────────────────────────────────────────── */
.st-route {
  font-size: 0.65rem;
  color: var(--accent);
  background: var(--surface2);
  padding: 0.4rem 0.6rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  word-break: break-all;
}

/* ─── Form elements ───────────────────────────────────────────────────────── */
.st-select,
.st-input {
  width: 100%;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.45rem 0.6rem;
  outline: none;
  transition: border-color 0.15s;
}
.st-select:focus,
.st-input:focus {
  border-color: var(--accent);
}
.st-textarea {
  width: 100%;
  min-height: 80px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
  padding: 0.6rem 0.75rem;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.st-textarea--sm {
  min-height: 52px;
}
.st-textarea:focus {
  border-color: var(--accent);
}

.st-range {
  width: 100%;
  accent-color: var(--accent);
}

/* ─── Toggles ─────────────────────────────────────────────────────────────── */
.st-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.st-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--text);
}
.st-toggle input {
  display: none;
}
.st-toggle-track {
  width: 28px;
  height: 15px;
  border-radius: 999px;
  background: var(--surface2);
  border: 1px solid var(--border);
  position: relative;
  flex-shrink: 0;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.st-toggle input:checked ~ .st-toggle-track {
  background: color-mix(in srgb, var(--accent) 30%, transparent);
  border-color: var(--accent);
}
.st-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--muted);
  transition:
    left 0.2s,
    background 0.2s;
}
.st-toggle input:checked ~ .st-toggle-track .st-toggle-thumb {
  left: 15px;
  background: var(--accent);
}

/* ─── Actions ─────────────────────────────────────────────────────────────── */
.st-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.st-btn {
  font-family: inherit;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 0.5rem 1.2rem;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.15s;
}
.st-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.st-btn--primary {
  background: var(--accent);
  color: #0d0f14;
  font-weight: 700;
}
.st-btn--primary:not(:disabled):hover {
  background: color-mix(in srgb, var(--accent) 80%, white);
}
.st-btn--ghost {
  background: transparent;
  color: var(--muted);
  border-color: var(--border);
}
.st-btn--ghost:not(:disabled):hover {
  color: var(--text);
  border-color: var(--muted);
}

.st-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.65rem;
  color: var(--muted);
  letter-spacing: 0.05em;
}
.st-live-pill {
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--green);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
.st-spinner {
  width: 10px;
  height: 10px;
  border: 2px solid rgba(0 0 0 / 0.2);
  border-top-color: #0d0f14;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── Code / error ────────────────────────────────────────────────────────── */
.st-code {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.7rem;
  line-height: 1.6;
  color: var(--green);
  overflow-x: auto;
  margin: 0;
  white-space: pre;
}
.st-error {
  background: color-mix(in srgb, var(--red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--red) 40%, transparent);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--red);
  line-height: 1.5;
}

/* ─── Output ──────────────────────────────────────────────────────────────── */
.st-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.st-copy {
  font-family: inherit;
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}
.st-copy:hover {
  color: var(--text);
  border-color: var(--muted);
}

.st-output {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.8rem;
  line-height: 1.7;
  min-height: 160px;
  white-space: pre-wrap;
  word-break: break-word;
  flex: 1;
}
.st-output--empty {
  border-style: dashed;
}
.st-placeholder {
  color: var(--muted);
  font-style: italic;
}
.st-cursor {
  display: inline-block;
  animation: blink 0.8s step-end infinite;
  color: var(--accent);
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* ─── Transitions ─────────────────────────────────────────────────────────── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ─── Scrollbar ───────────────────────────────────────────────────────────── */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>
