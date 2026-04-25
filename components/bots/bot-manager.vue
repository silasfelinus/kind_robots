<!-- /components/content/bots/bot-manager.vue -->
<template>
  <div
    class="bot-manager flex flex-col min-h-dvh bg-base-300 text-base-content relative overflow-hidden"
    :class="`mode-${activeMode}`"
  >
    <!-- ── Header ──────────────────────────────────────────────── -->
    <header
      class="flex items-center gap-4 px-5 py-3 bg-base-100 border-b border-base-300 shrink-0 flex-wrap"
    >
      <div class="flex items-center gap-2 mr-auto">
        <span class="text-2xl leading-none" style="color: var(--bm-amber)"
          >⬡</span
        >
        <span class="text-lg font-bold tracking-tight">Bot Manager</span>
        <span class="text-[0.7rem] font-mono opacity-50 self-end pb-px"
          >{{ bots.length }} available</span
        >
      </div>

      <nav class="flex gap-1 bg-base-200 p-1 rounded-xl border border-base-300">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150"
          :class="
            activeMode === tab.id
              ? 'bg-base-100 shadow-sm opacity-100 bm-tab-active'
              : 'opacity-55 hover:opacity-85 hover:bg-base-300'
          "
          @click="activeMode = tab.id"
        >
          <span class="text-base">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </nav>

      <button
        v-if="botStore.currentBot"
        class="text-xs px-3 py-1.5 rounded border border-current opacity-55 hover:opacity-100 transition-opacity font-medium"
        @click="clearBot"
      >
        Clear Selection
      </button>
    </header>

    <!-- ── Body ───────────────────────────────────────────────── -->
    <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
      <!-- ══ ROSTER ══════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'roster'"
        class="flex-1 flex flex-col overflow-hidden"
      >
        <!-- Search + filters -->
        <div
          class="flex items-center gap-4 flex-wrap px-5 py-3 border-b border-base-300 bg-base-100 shrink-0"
        >
          <input
            v-model="searchQuery"
            class="flex-1 min-w-44 px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm outline-none transition-colors"
            style="--tw-ring-color: var(--bm-amber)"
            placeholder="Search bots…"
            type="search"
            @focus="
              ($event.target as HTMLInputElement).style.borderColor =
                'var(--bm-amber)'
            "
            @blur="($event.target as HTMLInputElement).style.borderColor = ''"
          />
          <label
            class="flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100 cursor-pointer select-none"
          >
            <input
              v-model="showConstructionOnly"
              type="checkbox"
              class="checkbox checkbox-xs checkbox-warning"
            />
            <span>WIP only</span>
          </label>
          <label
            class="flex items-center gap-1.5 text-sm opacity-70 hover:opacity-100 cursor-pointer select-none"
          >
            <input
              v-model="showPublicOnly"
              type="checkbox"
              class="checkbox checkbox-xs checkbox-success"
            />
            <span>Public only</span>
          </label>
          <span class="text-xs font-mono opacity-40 ml-auto"
            >{{ filteredBots.length }} shown</span
          >
        </div>

        <!-- Bot grid — large cards for XL displays -->
        <div
          v-if="filteredBots.length"
          class="bm-grid overflow-y-auto flex-1 p-5 gap-4"
          :style="{ paddingBottom: botStore.currentBot ? '5.5rem' : '1.25rem' }"
        >
          <button
            v-for="bot in filteredBots"
            :key="bot.id"
            class="bm-bot-card relative flex flex-col items-center gap-3 pt-7 pb-5 px-4 rounded-2xl border transition-all duration-150 text-center cursor-pointer group"
            :class="
              botStore.currentBot?.id === bot.id
                ? 'bm-card-selected shadow-lg'
                : 'bg-base-100 border-base-300 hover:border-amber-400 hover:-translate-y-1 hover:shadow-md'
            "
            @click="selectBot(bot.id)"
          >
            <!-- Avatar -->
            <div class="relative shrink-0">
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot avatar'"
                class="w-24 h-24 object-cover rounded-full border-2 transition-colors duration-150"
                :class="
                  botStore.currentBot?.id === bot.id
                    ? 'border-amber-500'
                    : 'border-base-300 group-hover:border-amber-400'
                "
              />
              <span
                v-if="bot.underConstruction"
                class="absolute -bottom-1 -right-1 text-[0.55rem] font-bold font-mono px-1.5 py-px rounded-full bg-amber-100 text-amber-700 border border-amber-200"
                >WIP</span
              >
              <span
                v-else-if="bot.isPublic"
                class="absolute -bottom-1 -right-1 text-[0.55rem] font-bold font-mono px-1.5 py-px rounded-full bg-teal-100 text-teal-700 border border-teal-200"
                >PUB</span
              >
            </div>

            <!-- Info -->
            <div class="w-full min-w-0">
              <p class="text-sm font-bold mb-1 truncate">
                {{ bot.name || 'Unnamed Bot' }}
              </p>
              <p class="text-xs opacity-55 line-clamp-2 leading-relaxed">
                {{ bot.subtitle || bot.description || '—' }}
              </p>
            </div>

            <!-- Selected dot -->
            <div
              v-if="botStore.currentBot?.id === bot.id"
              class="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-amber-500"
            />
          </button>
        </div>

        <div
          v-else
          class="flex-1 flex flex-col items-center justify-center gap-3 opacity-60 text-sm"
        >
          <p>No bots match your filter.</p>
          <button
            class="px-4 py-2 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 text-sm font-semibold transition-colors"
            @click="resetFilters"
          >
            Reset filters
          </button>
        </div>

        <!-- Selected bot sticky bar -->
        <transition name="bm-slide-up">
          <div
            v-if="botStore.currentBot"
            class="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-3 bg-base-100 flex-wrap z-10"
            style="border-top: 1px solid var(--bm-amber)"
          >
            <img
              :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
              :alt="botStore.currentBot.name || 'Bot'"
              class="w-10 h-10 rounded-full object-cover border-2 shrink-0"
              style="border-color: var(--bm-amber)"
            />
            <div class="flex-1 min-w-0">
              <span class="block font-bold text-sm truncate">{{
                botStore.currentBot.name
              }}</span>
              <span class="block text-xs opacity-55 truncate">{{
                botStore.currentBot.description
              }}</span>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                class="px-4 py-1.5 text-sm font-bold rounded-lg text-white transition-all active:scale-95"
                style="background: var(--bm-amber)"
                @click="goToMode('command')"
              >
                Chat →
              </button>
            </div>
          </div>
        </transition>
      </section>

      <!-- ══ COMMAND ══════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'command'"
        class="flex-1 flex overflow-hidden"
      >
        <!-- Bot picker sidebar -->
        <aside
          class="w-56 shrink-0 flex flex-col border-r border-base-300 bg-base-100 overflow-hidden"
        >
          <p
            class="text-[0.65rem] font-mono uppercase tracking-widest opacity-45 px-4 pt-3 pb-2 shrink-0"
          >
            Select a bot
          </p>
          <div class="flex-1 overflow-y-auto flex flex-col gap-1 p-1">
            <button
              v-for="bot in bots"
              :key="`cmd-${bot.id}`"
              class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all duration-100 text-left cursor-pointer"
              :class="
                botStore.currentBot?.id === bot.id
                  ? 'bm-sidebar-active border-amber-500'
                  : 'border-transparent hover:bg-base-200'
              "
              @click="selectBotNoNav(bot.id)"
            >
              <img
                :src="bot.avatarImage || '/images/bot.webp'"
                :alt="bot.name || 'Bot'"
                class="w-8 h-8 rounded-full object-cover shrink-0 border border-base-300"
              />
              <span class="text-sm font-semibold truncate">{{
                bot.name || 'Unnamed'
              }}</span>
            </button>
          </div>
          <div class="p-2 shrink-0 border-t border-base-300">
            <button
              class="w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 transition-colors"
              @click="goToMode('forge')"
            >
              + Create Bot
            </button>
          </div>
        </aside>

        <!-- Main panel -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div
            v-if="botStore.currentBot"
            class="flex-1 flex flex-col overflow-hidden"
          >
            <!-- Bot hero + temperature -->
            <div
              class="flex items-center gap-4 px-5 py-3 bg-base-100 border-b border-base-300 shrink-0 flex-wrap"
            >
              <img
                :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
                :alt="botStore.currentBot.name || 'Bot'"
                class="w-16 h-16 rounded-xl object-cover border-2 shrink-0"
                style="border-color: var(--bm-amber)"
              />
              <div class="flex-1 min-w-0">
                <h2
                  class="text-xl font-extrabold tracking-tight leading-tight truncate"
                >
                  {{ botStore.currentBot.name }}
                </h2>
                <p
                  v-if="botStore.currentBot.subtitle"
                  class="text-xs italic opacity-60 truncate"
                >
                  {{ botStore.currentBot.subtitle }}
                </p>
                <p class="text-sm opacity-75 line-clamp-1">
                  {{ botStore.currentBot.description || 'A bot of mystery.' }}
                </p>
              </div>

              <!-- Temperature slider -->
              <div class="flex flex-col items-end gap-1 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono opacity-55">temperature</span>
                  <span
                    class="text-sm font-bold font-mono"
                    style="color: var(--bm-amber)"
                  >
                    {{ temperature.toFixed(1) }}
                  </span>
                </div>
                <input
                  v-model.number="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-36 bm-range-amber"
                />
                <div
                  class="flex justify-between w-36 text-[0.6rem] opacity-40 font-mono"
                >
                  <span>precise</span>
                  <span>balanced</span>
                  <span>wild</span>
                </div>
              </div>
            </div>

            <!-- Quick-start chips -->
            <div
              v-if="parsedUserPrompts.length"
              class="flex gap-2 flex-wrap items-center px-5 py-2 border-b border-base-300 bg-base-100/60 shrink-0"
            >
              <span
                class="text-[0.65rem] font-mono uppercase tracking-widest opacity-40"
                >Quick:</span
              >
              <button
                v-for="p in parsedUserPrompts"
                :key="p.id"
                class="px-3 py-1 rounded-full border border-base-300 bg-base-200 text-xs hover:border-amber-400 transition-all font-medium"
                @click="usePrompt(p.text)"
              >
                {{ p.text }}
              </button>
            </div>

            <!-- Chat log -->
            <div
              ref="chatLog"
              class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
            >
              <div
                v-if="!chatMessages.length"
                class="flex flex-col items-center justify-center h-full gap-2 opacity-25 select-none"
              >
                <span class="text-6xl">⬡</span>
                <p class="text-sm font-semibold">Start the conversation</p>
              </div>

              <div
                v-for="msg in chatMessages"
                :key="msg.id"
                class="flex gap-3"
                :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
              >
                <img
                  v-if="msg.role === 'assistant'"
                  :src="botStore.currentBot?.avatarImage || '/images/bot.webp'"
                  class="w-8 h-8 rounded-full object-cover shrink-0 border border-base-300 self-end"
                  alt="bot"
                />
                <div
                  class="max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  :class="
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm bm-user-bubble'
                      : 'bg-base-200 rounded-bl-sm'
                  "
                >
                  <!-- Loading dots -->
                  <span
                    v-if="msg.isLoading"
                    class="flex gap-1 items-center py-0.5"
                  >
                    <span class="bm-dot" style="animation-delay: 0ms" />
                    <span class="bm-dot" style="animation-delay: 160ms" />
                    <span class="bm-dot" style="animation-delay: 320ms" />
                  </span>
                  <span v-else class="whitespace-pre-wrap">{{
                    msg.content
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Composer -->
            <div
              class="shrink-0 border-t border-base-300 bg-base-100 pt-2 px-4 pb-4"
            >
              <!-- Helper row -->
              <div class="flex items-center gap-2 mb-2">
                <button
                  class="text-xs px-2.5 py-1 rounded-lg border border-base-300 opacity-60 hover:opacity-100 transition-opacity font-semibold"
                  @click="fillStarter"
                >
                  Starter
                </button>
                <button
                  class="text-xs px-2.5 py-1 rounded-lg border border-base-300 opacity-60 hover:opacity-100 transition-opacity font-semibold"
                  @click="fillWeird"
                >
                  Weird
                </button>
                <button
                  class="text-xs px-2.5 py-1 rounded-lg border border-base-300 opacity-60 hover:opacity-100 transition-opacity font-semibold"
                  @click="clearMessage"
                >
                  Clear
                </button>
                <button
                  v-if="chatMessages.length"
                  class="text-xs px-2.5 py-1 rounded-lg border border-base-300 opacity-60 hover:opacity-100 transition-opacity font-semibold ml-auto"
                  @click="clearChat"
                >
                  New chat
                </button>
              </div>

              <!-- Textarea + send -->
              <div class="flex items-end gap-2">
                <textarea
                  v-model="launchMessage"
                  class="flex-1 bg-base-200 border border-base-300 rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none outline-none transition-colors min-h-12 max-h-40"
                  rows="2"
                  placeholder="Message the bot… (Enter to send)"
                  :disabled="isResponding"
                  @keydown.enter.exact.prevent="sendMessage"
                  @focus="
                    ($event.target as HTMLTextAreaElement).style.borderColor =
                      'var(--bm-amber)'
                  "
                  @blur="
                    ($event.target as HTMLTextAreaElement).style.borderColor =
                      ''
                  "
                />
                <button
                  class="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  :class="
                    launchMessage.trim() && !isResponding
                      ? 'text-white bm-btn-send'
                      : 'bg-base-300 text-base-content'
                  "
                  :disabled="!launchMessage.trim() || isResponding"
                  @click="sendMessage"
                >
                  {{ isResponding ? '…' : 'Send' }}
                </button>
              </div>
            </div>
          </div>

          <!-- No-bot empty state -->
          <div
            v-else
            class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center"
          >
            <div class="text-7xl opacity-10 leading-none">⬡</div>
            <p class="text-lg font-bold mt-2">No bot selected</p>
            <p class="text-sm opacity-55 max-w-xs">
              Pick one from the sidebar, or browse the full roster.
            </p>
            <button
              class="mt-2 px-5 py-2 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 text-sm font-semibold transition-colors"
              @click="goToMode('roster')"
            >
              Browse Bots
            </button>
          </div>
        </div>
      </section>

      <!-- ══ SERVER ════════════════════════════════════════════════ -->
      <section v-if="activeMode === 'server'" class="flex-1 overflow-y-auto">
        <div class="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-7">
          <div>
            <h2 class="text-xl font-extrabold tracking-tight mb-1">
              Server Configuration
            </h2>
            <p class="text-sm opacity-55">
              AI backend settings and default generation parameters.
            </p>
          </div>

          <!-- Model -->
          <div class="flex flex-col gap-2">
            <label
              class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
              >Model</label
            >
            <select
              v-model="serverConfig.model"
              class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm outline-none font-mono transition-colors"
              @focus="
                ($event.target as HTMLSelectElement).style.borderColor =
                  'var(--bm-amber)'
              "
              @blur="
                ($event.target as HTMLSelectElement).style.borderColor = ''
              "
            >
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="claude-opus-4-6">claude-opus-4-6</option>
              <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
              <option value="claude-haiku-4-5">claude-haiku-4-5</option>
              <option value="llama-3-70b">llama-3-70b</option>
              <option value="custom">custom…</option>
            </select>
            <input
              v-if="serverConfig.model === 'custom'"
              v-model="serverConfig.customModel"
              class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none transition-colors mt-1"
              placeholder="model-name-here"
              @focus="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--bm-amber)'
              "
              @blur="($event.target as HTMLInputElement).style.borderColor = ''"
            />
          </div>

          <!-- API Endpoint -->
          <div class="flex flex-col gap-2">
            <label
              class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
              >API Endpoint</label
            >
            <input
              v-model="serverConfig.endpoint"
              type="url"
              class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none transition-colors"
              placeholder="https://api.openai.com/v1/chat/completions"
              @focus="
                ($event.target as HTMLInputElement).style.borderColor =
                  'var(--bm-amber)'
              "
              @blur="($event.target as HTMLInputElement).style.borderColor = ''"
            />
          </div>

          <!-- System Prompt -->
          <div class="flex flex-col gap-2">
            <label
              class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
            >
              Default System Prompt
            </label>
            <textarea
              v-model="serverConfig.systemPrompt"
              class="px-3 py-2.5 rounded-lg border border-base-300 bg-base-200 text-sm leading-relaxed outline-none transition-colors resize-y min-h-28 font-mono"
              rows="5"
              placeholder="You are a helpful, creative assistant…"
              @focus="
                ($event.target as HTMLTextAreaElement).style.borderColor =
                  'var(--bm-amber)'
              "
              @blur="
                ($event.target as HTMLTextAreaElement).style.borderColor = ''
              "
            />
            <p class="text-xs opacity-40">
              Per-bot personality overrides this. Used as a fallback when a bot
              has no personality set.
            </p>
          </div>

          <!-- Max Tokens -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label
                class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                >Max Tokens</label
              >
              <span
                class="text-sm font-bold font-mono"
                style="color: var(--bm-amber)"
                >{{ serverConfig.maxTokens }}</span
              >
            </div>
            <input
              v-model.number="serverConfig.maxTokens"
              type="range"
              min="256"
              max="8192"
              step="256"
              class="w-full bm-range-amber"
            />
            <div
              class="flex justify-between text-[0.65rem] opacity-40 font-mono"
            >
              <span>256</span><span>2048</span><span>4096</span
              ><span>8192</span>
            </div>
          </div>

          <!-- Default Temperature -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <label
                class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                >Default Temperature</label
              >
              <span
                class="text-sm font-bold font-mono"
                style="color: var(--bm-amber)"
                >{{ serverConfig.defaultTemp.toFixed(1) }}</span
              >
            </div>
            <input
              v-model.number="serverConfig.defaultTemp"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="w-full bm-range-amber"
            />
            <div
              class="flex justify-between text-[0.65rem] opacity-40 font-mono"
            >
              <span>0.0 precise</span><span>1.0</span><span>2.0 wild</span>
            </div>
          </div>

          <!-- Streaming toggle -->
          <div
            class="flex items-center justify-between p-4 rounded-xl border border-base-300 bg-base-100"
          >
            <div>
              <p class="text-sm font-semibold">Streaming responses</p>
              <p class="text-xs opacity-55">
                Stream tokens as they are generated
              </p>
            </div>
            <input
              v-model="serverConfig.streaming"
              type="checkbox"
              class="toggle toggle-warning"
            />
          </div>

          <!-- Save / Reset -->
          <div class="flex items-center gap-3 pt-1">
            <button
              class="px-5 py-2 rounded-lg font-bold text-sm text-white transition-all active:scale-95 bm-btn-send"
              @click="saveServerConfig"
            >
              Save Configuration
            </button>
            <button
              class="px-5 py-2 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 font-semibold text-sm transition-colors"
              @click="resetServerConfig"
            >
              Reset to defaults
            </button>
            <transition name="bm-fade">
              <span
                v-if="serverSaveMsg"
                class="text-xs font-semibold font-mono text-teal-600"
              >
                {{ serverSaveMsg }}
              </span>
            </transition>
          </div>
        </div>
      </section>

      <!-- ══ FORGE ════════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'forge'"
        class="flex-1 flex flex-col overflow-hidden"
      >
        <div
          class="flex items-center justify-between gap-4 px-5 py-3 border-b border-base-300 bg-base-100 shrink-0 flex-wrap"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="text-[0.7rem] font-mono uppercase tracking-widest opacity-50"
            >
              {{ botStore.selectedBotId ? 'Editing' : 'Creating new bot' }}
            </span>
            <span
              v-if="botStore.currentBot"
              class="text-sm font-bold"
              style="color: var(--bm-amber)"
            >
              {{ botStore.currentBot.name }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="botStore.currentBot"
              class="text-xs px-3 py-1.5 rounded-lg border border-base-300 opacity-65 hover:opacity-100 transition-opacity font-semibold"
              @click="botStore.deselectBot()"
            >
              New Bot instead
            </button>
            <select
              class="px-2.5 py-1.5 rounded-lg border border-base-300 bg-base-200 text-xs cursor-pointer outline-none transition-colors"
              @change="onForgeSelect"
              @focus="
                ($event.target as HTMLSelectElement).style.borderColor =
                  'var(--bm-amber)'
              "
              @blur="
                ($event.target as HTMLSelectElement).style.borderColor = ''
              "
            >
              <option value="">— Edit existing bot —</option>
              <option v-for="bot in bots" :key="bot.id" :value="bot.id">
                {{ bot.name || `Bot #${bot.id}` }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <add-bot />
        </div>
      </section>
    </div>
    <!-- /bm-body -->

    <!-- ── Loading overlay ─────────────────────────────────────── -->
    <transition name="bm-fade">
      <div
        v-if="isLoading"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 text-sm font-mono"
        style="
          background: color-mix(in oklch, var(--b1, white) 85%, transparent);
        "
      >
        <span class="bm-spinner" />
        <span>Loading bots…</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useBotStore } from '@/stores/botStore'

type Mode = 'roster' | 'command' | 'server' | 'forge'

const botStore = useBotStore()

// ── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
}

interface ServerConfig {
  model: string
  customModel: string
  endpoint: string
  systemPrompt: string
  maxTokens: number
  defaultTemp: number
  streaming: boolean
}

// ── State ──────────────────────────────────────────────────────────
const activeMode = ref<Mode>('roster')
const searchQuery = ref('')
const showConstructionOnly = ref(false)
const showPublicOnly = ref(false)
const isLoading = ref(false)
const launchMessage = ref('')

// Command / chat
const temperature = ref(0.7)
const chatMessages = ref<ChatMessage[]>([])
const isResponding = ref(false)
const chatLog = ref<HTMLElement | null>(null)

// Server
const serverSaveMsg = ref('')
const defaultServerConfig: ServerConfig = {
  model: 'gpt-4o',
  customModel: '',
  endpoint: '/api/chat',
  systemPrompt: '',
  maxTokens: 2048,
  defaultTemp: 0.7,
  streaming: true,
}
const serverConfig = ref<ServerConfig>({ ...defaultServerConfig })

// ── Tabs ───────────────────────────────────────────────────────────
const tabs = [
  { id: 'roster' as Mode, label: 'Roster', icon: '⊞' },
  { id: 'command' as Mode, label: 'Command', icon: '⌖' },
  { id: 'server' as Mode, label: 'Server', icon: '⚙' },
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
  if (showConstructionOnly.value)
    result = result.filter((b) => b.underConstruction)
  if (showPublicOnly.value) result = result.filter((b) => b.isPublic)
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

// ── Roster methods ─────────────────────────────────────────────────
async function selectBot(botId: number) {
  await botStore.selectBot(botId)
  activeMode.value = 'command'
}

function clearBot() {
  botStore.deselectBot()
  launchMessage.value = ''
  chatMessages.value = []
}

function resetFilters() {
  searchQuery.value = ''
  showConstructionOnly.value = false
  showPublicOnly.value = false
}

function goToMode(mode: Mode) {
  activeMode.value = mode
}

// ── Command methods ────────────────────────────────────────────────
// Selects a bot from the sidebar without navigating away from command
async function selectBotNoNav(botId: number) {
  if (botStore.currentBot?.id === botId) return
  await botStore.selectBot(botId)
  chatMessages.value = []
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

function clearChat() {
  chatMessages.value = []
}

function scrollToBottom() {
  if (chatLog.value) {
    chatLog.value.scrollTop = chatLog.value.scrollHeight
  }
}

async function sendMessage() {
  if (!launchMessage.value.trim() || isResponding.value || !botStore.currentBot)
    return

  const userText = launchMessage.value.trim()
  launchMessage.value = ''

  chatMessages.value.push({
    id: Date.now(),
    role: 'user',
    content: userText,
  })

  const loadingId = Date.now() + 1
  chatMessages.value.push({
    id: loadingId,
    role: 'assistant',
    content: '',
    isLoading: true,
  })

  isResponding.value = true
  await nextTick()
  scrollToBottom()

  try {
    const systemPrompt =
      (botStore.currentBot as any).personality ||
      botStore.currentBot.description ||
      serverConfig.value.systemPrompt ||
      'You are a helpful assistant.'

    const historyForApi = chatMessages.value
      .filter((m) => !m.isLoading && m.id !== loadingId)
      .map((m) => ({ role: m.role, content: m.content }))

    const response = await fetch(serverConfig.value.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botId: botStore.currentBot.id,
        message: userText,
        temperature: temperature.value,
        model:
          serverConfig.value.model === 'custom'
            ? serverConfig.value.customModel
            : serverConfig.value.model,
        maxTokens: serverConfig.value.maxTokens,
        systemPrompt,
        messages: historyForApi,
      }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    const idx = chatMessages.value.findIndex((m) => m.id === loadingId)
    if (idx !== -1) {
      chatMessages.value[idx] = {
        id: loadingId,
        role: 'assistant',
        content:
          data.message ??
          data.content ??
          data.response ??
          'No response received.',
        isLoading: false,
      }
    }
  } catch (err) {
    const idx = chatMessages.value.findIndex((m) => m.id === loadingId)
    if (idx !== -1) {
      chatMessages.value[idx] = {
        id: loadingId,
        role: 'assistant',
        content:
          '⚠️ Could not reach the bot. Check the endpoint in Server settings.',
        isLoading: false,
      }
    }
  } finally {
    isResponding.value = false
    await nextTick()
    scrollToBottom()
  }
}

// ── Server methods ─────────────────────────────────────────────────
function saveServerConfig() {
  try {
    localStorage.setItem('bm-server-config', JSON.stringify(serverConfig.value))
    temperature.value = serverConfig.value.defaultTemp
  } catch {}
  serverSaveMsg.value = '✓ Saved'
  setTimeout(() => {
    serverSaveMsg.value = ''
  }, 2500)
}

function resetServerConfig() {
  serverConfig.value = { ...defaultServerConfig }
  serverSaveMsg.value = '✓ Reset to defaults'
  setTimeout(() => {
    serverSaveMsg.value = ''
  }, 2500)
}

function loadServerConfig() {
  try {
    const stored = localStorage.getItem('bm-server-config')
    if (stored) {
      serverConfig.value = { ...defaultServerConfig, ...JSON.parse(stored) }
      temperature.value = serverConfig.value.defaultTemp
    }
  } catch {}
}

// ── Forge ──────────────────────────────────────────────────────────
function onForgeSelect(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (id) botStore.selectBot(id)
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  loadServerConfig()
  if (!bots.value.length) {
    isLoading.value = true
    await botStore.initialize()
    isLoading.value = false
  }
  if (botStore.currentBot) {
    activeMode.value = 'command'
  }
})

watch(
  () => botStore.currentBot?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId && activeMode.value !== 'command') {
      activeMode.value = 'command'
    }
  },
)
</script>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────── */
.bot-manager {
  --bm-amber: #d97706;
  --bm-amber-l: #fef3c7;
  --bm-teal: #0f766e;
  --bm-teal-l: #ccfbf1;
  --bm-radius: 0.75rem;
  --bm-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

/* ── Active tab color ──────────────────────────────────────── */
.bm-tab-active {
  color: var(--bm-amber);
}

/* ── Card states ───────────────────────────────────────────── */
.bm-bot-card {
  border: 1px solid;
}
.bm-card-selected {
  border-color: var(--bm-amber);
  background: color-mix(in oklch, var(--bm-amber) 6%, var(--b1, white));
}

/* ── Roster grid ───────────────────────────────────────────── */
.bm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* ── Sidebar active state ──────────────────────────────────── */
.bm-sidebar-active {
  background: color-mix(in oklch, var(--bm-amber) 10%, var(--b2, white));
}

/* ── Chat bubbles ──────────────────────────────────────────── */
.bm-user-bubble {
  background: var(--bm-amber);
}

/* ── Send / save button ────────────────────────────────────── */
.bm-btn-send {
  background: var(--bm-amber);
}
.bm-btn-send:hover:not(:disabled) {
  background: color-mix(in oklch, var(--bm-amber) 82%, black);
}

/* ── Range accent ──────────────────────────────────────────── */
.bm-range-amber {
  accent-color: var(--bm-amber);
}

/* ── Loading dots ──────────────────────────────────────────── */
.bm-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: bm-bounce 1s ease-in-out infinite;
}
@keyframes bm-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── Spinner ───────────────────────────────────────────────── */
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

/* ── Transitions ───────────────────────────────────────────── */
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
  .bm-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .tab-label {
    display: none;
  }
}

@media (min-width: 1280px) {
  .bm-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
