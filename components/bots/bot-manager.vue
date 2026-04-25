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
        <span class="text-2xl leading-none bm-amber">⬡</span>
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
              ? 'bg-base-100 shadow-sm bm-tab-active'
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
        <div
          class="flex items-center gap-4 flex-wrap px-5 py-3 border-b border-base-300 bg-base-100 shrink-0"
        >
          <input
            v-model="searchQuery"
            class="flex-1 min-w-44 px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm outline-none transition-colors bm-focus"
            placeholder="Search bots…"
            type="search"
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

        <div
          v-if="filteredBots.length"
          class="bm-roster-grid overflow-y-auto flex-1 p-5 gap-4"
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
            <div class="w-full min-w-0">
              <p class="text-sm font-bold mb-1 truncate">
                {{ bot.name || 'Unnamed Bot' }}
              </p>
              <p class="text-xs opacity-55 line-clamp-2 leading-relaxed">
                {{ bot.subtitle || bot.description || '—' }}
              </p>
            </div>
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

        <transition name="bm-slide-up">
          <div
            v-if="botStore.currentBot"
            class="absolute bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-3 bg-base-100 flex-wrap z-10 bm-border-top-amber"
          >
            <img
              :src="botStore.currentBot.avatarImage || '/images/bot.webp'"
              :alt="botStore.currentBot.name || 'Bot'"
              class="w-10 h-10 rounded-full object-cover border-2 border-amber-500 shrink-0"
            />
            <div class="flex-1 min-w-0">
              <span class="block font-bold text-sm truncate">{{
                botStore.currentBot.name
              }}</span>
              <span class="block text-xs opacity-55 truncate">{{
                botStore.currentBot.description
              }}</span>
            </div>
            <button
              class="px-4 py-1.5 text-sm font-bold rounded-lg text-white bm-btn-primary transition-all active:scale-95 shrink-0"
              @click="goToMode('command')"
            >
              Chat →
            </button>
          </div>
        </transition>
      </section>

      <!-- ══ COMMAND ══════════════════════════════════════════════ -->
      <section
        v-if="activeMode === 'command'"
        class="flex-1 flex overflow-hidden"
      >
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
                class="w-16 h-16 rounded-xl object-cover border-2 border-amber-500 shrink-0"
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
              <div class="flex flex-col items-end gap-1 shrink-0">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono opacity-55">temperature</span>
                  <span class="text-sm font-bold font-mono bm-amber">{{
                    temperature.toFixed(1)
                  }}</span>
                </div>
                <input
                  v-model.number="temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-36 bm-range"
                />
                <div
                  class="flex justify-between w-36 text-[0.6rem] opacity-40 font-mono"
                >
                  <span>precise</span><span>balanced</span><span>wild</span>
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
              class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4"
            >
              <div
                v-if="!sessionChats.length"
                class="flex flex-col items-center justify-center h-full gap-2 opacity-25 select-none"
              >
                <span class="text-6xl">⬡</span>
                <p class="text-sm font-semibold">Start the conversation</p>
              </div>

              <div
                v-for="chat in sessionChats"
                :key="chat.id"
                class="flex flex-col gap-3"
              >
                <!-- User bubble -->
                <div class="flex flex-row-reverse gap-3">
                  <div
                    class="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed bm-user-bubble text-white whitespace-pre-wrap"
                  >
                    {{ chat.content }}
                  </div>
                </div>
                <!-- Bot bubble -->
                <div class="flex flex-row gap-3">
                  <img
                    :src="
                      botStore.currentBot?.avatarImage || '/images/bot.webp'
                    "
                    class="w-8 h-8 rounded-full object-cover shrink-0 border border-base-300 self-end"
                    alt="bot"
                  />
                  <div
                    class="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed bg-base-200"
                  >
                    <span
                      v-if="!chat.botResponse"
                      class="flex gap-1 items-center py-0.5"
                    >
                      <span class="bm-dot" style="animation-delay: 0ms" />
                      <span class="bm-dot" style="animation-delay: 160ms" />
                      <span class="bm-dot" style="animation-delay: 320ms" />
                    </span>
                    <span v-else class="whitespace-pre-wrap">{{
                      chat.botResponse
                    }}</span>
                  </div>
                </div>
              </div>

              <div
                v-if="chatError"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                <span>⚠️</span>
                <span class="flex-1">{{ chatError }}</span>
                <button
                  class="text-xs underline opacity-70 hover:opacity-100"
                  @click="chatError = ''"
                >
                  dismiss
                </button>
              </div>
            </div>

            <!-- Composer -->
            <div
              class="shrink-0 border-t border-base-300 bg-base-100 pt-2 px-4 pb-4"
            >
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
                  v-if="sessionChatIds.length"
                  class="text-xs px-2.5 py-1 rounded-lg border border-base-300 opacity-60 hover:opacity-100 transition-opacity font-semibold ml-auto"
                  @click="clearChat"
                >
                  New chat
                </button>
              </div>
              <div class="flex items-end gap-2">
                <textarea
                  v-model="launchMessage"
                  class="flex-1 bg-base-200 border border-base-300 rounded-xl px-3 py-2.5 text-sm leading-relaxed resize-none outline-none transition-colors min-h-12 max-h-40 bm-focus"
                  rows="2"
                  placeholder="Message the bot… (Enter to send)"
                  :disabled="isResponding"
                  @keydown.enter.exact.prevent="sendMessage"
                />
                <button
                  class="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  :class="
                    launchMessage.trim() && !isResponding
                      ? 'bm-btn-primary text-white'
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
      <section
        v-if="activeMode === 'server'"
        class="flex-1 flex overflow-hidden"
      >
        <!-- Left: server list -->
        <aside
          class="w-64 shrink-0 flex flex-col border-r border-base-300 bg-base-100 overflow-hidden"
        >
          <div
            class="flex items-center justify-between px-4 pt-3 pb-2 shrink-0"
          >
            <p
              class="text-[0.65rem] font-mono uppercase tracking-widest opacity-45"
            >
              Text Servers
            </p>
            <span class="text-[0.6rem] font-mono opacity-30"
              >{{ serverStore.textServers.length }} active</span
            >
          </div>

          <div class="flex-1 overflow-y-auto flex flex-col gap-1 p-1">
            <button
              v-for="opt in serverStore.textServerOptions"
              :key="opt.value"
              class="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-100 cursor-pointer"
              :class="
                serverStore.activeTextServer?.id === opt.value
                  ? 'bm-sidebar-active border-amber-500'
                  : serverStore.selectedServer?.id === opt.value
                    ? 'bg-base-200 border-base-300'
                    : 'border-transparent hover:bg-base-200'
              "
              @click="selectTextServer(opt.value)"
            >
              <div class="flex items-center gap-2">
                <!-- Health dot -->
                <span
                  class="w-1.5 h-1.5 rounded-full shrink-0"
                  :class="serverHealthClass(opt.value)"
                />
                <span class="text-sm font-semibold truncate flex-1">{{
                  opt.label
                }}</span>
                <!-- Active badge -->
                <span
                  v-if="serverStore.activeTextServer?.id === opt.value"
                  class="text-[0.55rem] font-bold font-mono px-1.5 py-px rounded-full bm-active-badge shrink-0"
                  >ACTIVE</span
                >
                <span
                  v-if="opt.isOfficial"
                  class="text-[0.55rem] font-bold font-mono px-1.5 py-px rounded-full bg-teal-100 text-teal-700 border border-teal-200 shrink-0"
                  >OFC</span
                >
              </div>
              <p class="text-[0.7rem] opacity-50 truncate pl-3.5">
                {{ opt.description || '—' }}
              </p>
            </button>

            <div
              v-if="!serverStore.textServerOptions.length"
              class="flex flex-col items-center justify-center gap-2 py-8 opacity-40 text-xs text-center"
            >
              <span class="text-2xl">⚙</span>
              <p>No text servers available</p>
            </div>
          </div>

          <!-- Set active button -->
          <div
            class="p-2 shrink-0 border-t border-base-300 flex flex-col gap-1.5"
          >
            <button
              v-if="
                serverStore.selectedServer &&
                serverStore.selectedServer.id !==
                  serverStore.activeTextServer?.id
              "
              class="w-full flex items-center justify-center px-3 py-1.5 text-xs font-bold rounded-lg text-white bm-btn-primary transition-all active:scale-95"
              @click="setAsActiveServer"
            >
              Set as Active Text Server
            </button>
            <button
              v-if="serverStore.activeTextServer"
              class="w-full flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 transition-colors opacity-70 hover:opacity-100"
              @click="serverStore.setActiveTextServer(null)"
            >
              Clear active server
            </button>
          </div>
        </aside>

        <!-- Right: server detail / edit form -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="serverStore.selectedServer"
            class="max-w-2xl mx-auto px-6 py-6 flex flex-col gap-6"
          >
            <!-- Server identity header -->
            <div class="flex items-start gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-xl font-extrabold tracking-tight">
                    {{
                      serverStore.selectedServer.label ||
                      serverStore.selectedServer.title
                    }}
                  </h2>
                  <span
                    class="text-[0.6rem] font-bold font-mono px-1.5 py-px rounded-full border"
                    :class="
                      serverStore.selectedServer.isActive
                        ? 'bg-teal-100 text-teal-700 border-teal-200'
                        : 'bg-base-300 opacity-50'
                    "
                    >{{ serverStore.selectedServer.serverType }}</span
                  >
                </div>
                <p class="text-sm opacity-55 mt-0.5">
                  {{
                    serverStore.selectedServer.description || 'No description.'
                  }}
                </p>
              </div>

              <!-- Health status widget -->
              <div class="flex flex-col items-end gap-1.5 shrink-0">
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    :class="serverHealthClass(serverStore.selectedServer.id)"
                  />
                  <span
                    class="text-xs font-mono font-bold"
                    :class="
                      serverHealthTextClass(serverStore.selectedServer.id)
                    "
                  >
                    {{ serverHealthLabel(serverStore.selectedServer.id) }}
                  </span>
                </div>
                <span
                  v-if="activeHealth"
                  class="text-[0.65rem] font-mono opacity-50"
                >
                  {{ activeHealth.latencyMs }}ms
                </span>
                <button
                  class="text-xs px-3 py-1 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 transition-colors font-semibold disabled:opacity-40"
                  :disabled="serverStore.testingHealth"
                  @click="testHealth"
                >
                  {{ serverStore.testingHealth ? 'Testing…' : 'Test Health' }}
                </button>
              </div>
            </div>

            <!-- Editable form fields -->
            <div class="flex flex-col gap-5">
              <!-- Base URL -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                  >Base URL</label
                >
                <input
                  v-model="serverStore.serverForm.baseUrl"
                  type="url"
                  class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none bm-focus transition-colors"
                  placeholder="http://localhost:11434"
                />
              </div>

              <!-- Endpoint path + health path side by side -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Endpoint Path</label
                  >
                  <input
                    v-model="serverStore.serverForm.endpointPath"
                    class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none bm-focus transition-colors"
                    placeholder="/v1/chat/completions"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Health Path</label
                  >
                  <input
                    v-model="serverStore.serverForm.healthPath"
                    class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none bm-focus transition-colors"
                    placeholder="/health"
                  />
                </div>
              </div>

              <!-- Title / Label -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Title</label
                  >
                  <input
                    v-model="serverStore.serverForm.title"
                    class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm outline-none bm-focus transition-colors"
                    placeholder="My Text Server"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Label (display)</label
                  >
                  <input
                    v-model="serverStore.serverForm.label"
                    class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm outline-none bm-focus transition-colors"
                    placeholder="My Server"
                  />
                </div>
              </div>

              <!-- Description -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                  >Description</label
                >
                <textarea
                  v-model="serverStore.serverForm.description"
                  class="px-3 py-2.5 rounded-lg border border-base-300 bg-base-200 text-sm leading-relaxed outline-none bm-focus transition-colors resize-y min-h-16"
                  rows="2"
                  placeholder="What this server is for…"
                />
              </div>

              <!-- API key section -->
              <div
                class="flex flex-col gap-3 p-4 rounded-xl border border-base-300 bg-base-100"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-semibold">Requires API Key</p>
                    <p class="text-xs opacity-55">
                      Enable if this server needs authentication
                    </p>
                  </div>
                  <input
                    v-model="serverStore.serverForm.requiresApiKey"
                    type="checkbox"
                    class="toggle toggle-warning toggle-sm"
                  />
                </div>
                <div
                  v-if="serverStore.serverForm.requiresApiKey"
                  class="flex flex-col gap-2"
                >
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >API Key Name / Header</label
                  >
                  <input
                    v-model="serverStore.serverForm.apiKeyName"
                    class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none bm-focus transition-colors"
                    placeholder="Authorization"
                  />
                  <p class="text-xs opacity-40">
                    Actual key value is stored securely — use the key manager to
                    update it.
                  </p>
                </div>
              </div>

              <!-- Notes -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                  >Notes</label
                >
                <textarea
                  v-model="serverStore.serverForm.notes"
                  class="px-3 py-2.5 rounded-lg border border-base-300 bg-base-200 text-sm leading-relaxed outline-none bm-focus transition-colors resize-y min-h-16 font-mono"
                  rows="2"
                  placeholder="Internal notes…"
                />
              </div>

              <!-- Toggles row -->
              <div class="grid grid-cols-2 gap-3">
                <div
                  class="flex items-center justify-between p-3 rounded-xl border border-base-300 bg-base-100"
                >
                  <span class="text-sm font-semibold">Public</span>
                  <input
                    v-model="serverStore.serverForm.isPublic"
                    type="checkbox"
                    class="toggle toggle-success toggle-sm"
                  />
                </div>
                <div
                  class="flex items-center justify-between p-3 rounded-xl border border-base-300 bg-base-100"
                >
                  <span class="text-sm font-semibold">Active</span>
                  <input
                    v-model="serverStore.serverForm.isActive"
                    type="checkbox"
                    class="toggle toggle-warning toggle-sm"
                  />
                </div>
              </div>
            </div>

            <!-- Chat defaults (local prefs, not on Server schema) -->
            <div class="flex flex-col gap-4 pt-2 border-t border-base-300">
              <p
                class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50 mt-2"
              >
                Chat Defaults (local prefs)
              </p>

              <div class="flex flex-col gap-1.5">
                <label
                  class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                  >Model name</label
                >
                <input
                  v-model="chatPrefs.model"
                  class="px-3 py-2 rounded-lg border border-base-300 bg-base-200 text-sm font-mono outline-none bm-focus transition-colors"
                  placeholder="e.g. gpt-4o, llama-3-70b, mistral…"
                />
                <p class="text-xs opacity-40">
                  Passed as the model field in chat requests.
                </p>
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Max Tokens</label
                  >
                  <span class="text-sm font-bold font-mono bm-amber">{{
                    chatPrefs.maxTokens
                  }}</span>
                </div>
                <input
                  v-model.number="chatPrefs.maxTokens"
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  class="w-full bm-range"
                />
                <div
                  class="flex justify-between text-[0.65rem] opacity-40 font-mono"
                >
                  <span>256</span><span>2048</span><span>4096</span
                  ><span>8192</span>
                </div>
              </div>

              <div class="flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <label
                    class="text-[0.68rem] font-mono uppercase tracking-widest opacity-50"
                    >Default Temperature</label
                  >
                  <span class="text-sm font-bold font-mono bm-amber">{{
                    chatPrefs.defaultTemp.toFixed(1)
                  }}</span>
                </div>
                <input
                  v-model.number="chatPrefs.defaultTemp"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full bm-range"
                />
                <div
                  class="flex justify-between text-[0.65rem] opacity-40 font-mono"
                >
                  <span>0.0 precise</span><span>1.0</span><span>2.0 wild</span>
                </div>
              </div>
            </div>

            <!-- Action row -->
            <div class="flex items-center gap-3 pb-4">
              <button
                class="px-5 py-2 rounded-lg font-bold text-sm text-white bm-btn-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="serverStore.isSaving"
                @click="saveServer"
              >
                {{ serverStore.isSaving ? 'Saving…' : 'Save Server' }}
              </button>
              <button
                class="px-5 py-2 rounded-lg border border-base-300 bg-base-200 hover:bg-base-300 font-semibold text-sm transition-colors"
                @click="saveChatPrefs"
              >
                Save Chat Prefs
              </button>
              <transition name="bm-fade">
                <span
                  v-if="serverSaveMsg"
                  class="text-xs font-semibold font-mono text-teal-600"
                  >{{ serverSaveMsg }}</span
                >
              </transition>
            </div>
          </div>

          <!-- Nothing selected -->
          <div
            v-else
            class="flex flex-col items-center justify-center h-full gap-3 opacity-40 text-sm p-8 text-center"
          >
            <span class="text-5xl">⚙</span>
            <p class="font-semibold">Select a text server from the list</p>
            <p class="text-xs max-w-xs">
              Click any server in the sidebar to view and edit its
              configuration.
            </p>
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
              class="text-sm font-bold bm-amber"
              >{{ botStore.currentBot.name }}</span
            >
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
              class="px-2.5 py-1.5 rounded-lg border border-base-300 bg-base-200 text-xs cursor-pointer outline-none bm-focus transition-colors"
              @change="onForgeSelect"
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

    <!-- ── Loading overlay ─────────────────────────────────────── -->
    <transition name="bm-fade">
      <div
        v-if="isLoading"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 text-sm font-mono bm-loading-bg"
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
import { useChatStore } from '@/stores/chatStore'
import { useServerStore } from '@/stores/serverStore'

type Mode = 'roster' | 'command' | 'server' | 'forge'

const botStore = useBotStore()
const chatStore = useChatStore()
const serverStore = useServerStore()

// ── Types ──────────────────────────────────────────────────────────
interface ChatPrefs {
  model: string
  maxTokens: number
  defaultTemp: number
}

// ── State ──────────────────────────────────────────────────────────
const activeMode = ref<Mode>('roster')
const searchQuery = ref('')
const showConstructionOnly = ref(false)
const showPublicOnly = ref(false)
const isLoading = ref(false)
const launchMessage = ref('')

// Chat
const temperature = ref(0.7)
const chatLog = ref<HTMLElement | null>(null)
const chatError = ref('')
const sessionChatIds = ref<number[]>([])

// Server tab
const serverSaveMsg = ref('')
const defaultChatPrefs: ChatPrefs = {
  model: '',
  maxTokens: 2048,
  defaultTemp: 0.7,
}
const chatPrefs = ref<ChatPrefs>({ ...defaultChatPrefs })

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

const sessionChats = computed(() =>
  chatStore.chats.filter((c) => sessionChatIds.value.includes(c.id)),
)

const isResponding = computed(() =>
  sessionChats.value.some((c) => !c.botResponse),
)

/** Health result for the currently selected server (if tested). */
const activeHealth = computed(() =>
  serverStore.selectedServer
    ? serverStore.healthResults[serverStore.selectedServer.id]
    : null,
)

// ── Server tab helpers ─────────────────────────────────────────────
function serverHealthClass(serverId: number): string {
  const h = serverStore.healthResults[serverId]
  if (!h) return 'bg-base-300'
  return h.ok ? 'bg-teal-500' : 'bg-red-500'
}

function serverHealthTextClass(serverId: number): string {
  const h = serverStore.healthResults[serverId]
  if (!h) return 'opacity-30'
  return h.ok ? 'text-teal-600' : 'text-red-600'
}

function serverHealthLabel(serverId: number): string {
  const h = serverStore.healthResults[serverId]
  if (!h) return 'untested'
  return h.ok ? 'online' : 'offline'
}

function selectTextServer(serverId: number) {
  serverStore.selectServer(serverId)
}

async function setAsActiveServer() {
  if (!serverStore.selectedServer) return
  const result = await serverStore.setActiveTextServer(
    serverStore.selectedServer.id,
  )
  serverSaveMsg.value =
    result.message || (result.success ? '✓ Active server updated' : '✗ Failed')
  setTimeout(() => {
    serverSaveMsg.value = ''
  }, 2500)
}

async function testHealth() {
  if (!serverStore.selectedServer) return
  await serverStore.testServerHealth(serverStore.selectedServer.id)
}

async function saveServer() {
  const result = await serverStore.saveServer()
  serverSaveMsg.value =
    result.message || (result.success ? '✓ Server saved' : '✗ Save failed')
  setTimeout(() => {
    serverSaveMsg.value = ''
  }, 2500)
}

function saveChatPrefs() {
  try {
    localStorage.setItem('bm-chat-prefs', JSON.stringify(chatPrefs.value))
    temperature.value = chatPrefs.value.defaultTemp
  } catch {
    /* SSR guard */
  }
  serverSaveMsg.value = '✓ Chat prefs saved'
  setTimeout(() => {
    serverSaveMsg.value = ''
  }, 2500)
}

function loadChatPrefs() {
  try {
    const stored = localStorage.getItem('bm-chat-prefs')
    if (stored) {
      chatPrefs.value = { ...defaultChatPrefs, ...JSON.parse(stored) }
      temperature.value = chatPrefs.value.defaultTemp
    }
  } catch {
    /* SSR guard */
  }
}

// ── Roster ─────────────────────────────────────────────────────────
async function selectBot(botId: number) {
  await botStore.selectBot(botId)
  sessionChatIds.value = []
  chatError.value = ''
  activeMode.value = 'command'
}

function clearBot() {
  botStore.deselectBot()
  launchMessage.value = ''
  sessionChatIds.value = []
  chatError.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  showConstructionOnly.value = false
  showPublicOnly.value = false
}

function goToMode(mode: Mode) {
  activeMode.value = mode
}

// ── Command ────────────────────────────────────────────────────────
async function selectBotNoNav(botId: number) {
  if (botStore.currentBot?.id === botId) return
  await botStore.selectBot(botId)
  sessionChatIds.value = []
  chatError.value = ''
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
  sessionChatIds.value = []
  chatError.value = ''
}

function scrollToBottom() {
  if (chatLog.value) chatLog.value.scrollTop = chatLog.value.scrollHeight
}

async function sendMessage() {
  if (!launchMessage.value.trim() || isResponding.value || !botStore.currentBot)
    return
  const userText = launchMessage.value.trim()
  launchMessage.value = ''
  chatError.value = ''

  try {
    const newChat = await chatStore.addChat({
      botId: botStore.currentBot.id,
      content: userText,
      isPublic: false,
      userId: 0,
      type: 'ToBot',
      recipientId: null,
      characterId: null,
    })
    sessionChatIds.value.push(newChat.id)
    await nextTick()
    scrollToBottom()
    await chatStore.streamResponse(newChat.id)
    await nextTick()
    scrollToBottom()
  } catch (err: unknown) {
    chatError.value =
      err instanceof Error ? err.message : 'Send failed — check server config.'
  }
}

// ── Forge ──────────────────────────────────────────────────────────
function onForgeSelect(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (id) botStore.selectBot(id)
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
  loadChatPrefs()

  if (!bots.value.length) {
    isLoading.value = true
    await botStore.initialize() // also initializes serverStore internally
    isLoading.value = false
  }

  // Ensure serverStore is initialized (botStore.initialize calls it, but be safe)
  if (!serverStore.isInitialized) {
    await serverStore.initialize()
  }

  await chatStore.initialize()

  // Pre-select the active text server in the sidebar if one exists
  if (serverStore.activeTextServer) {
    serverStore.selectServer(serverStore.activeTextServer.id)
  }

  if (botStore.currentBot) activeMode.value = 'command'
})

watch(
  () => botStore.currentBot?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId && activeMode.value !== 'command') {
      sessionChatIds.value = []
      chatError.value = ''
      activeMode.value = 'command'
    }
  },
)

watch(
  () => sessionChats.value.map((c) => c.botResponse).join(''),
  async () => {
    await nextTick()
    scrollToBottom()
  },
)
</script>

<style scoped>
.bot-manager {
  --bm-amber: #d97706;
  --bm-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}

.bm-amber {
  color: var(--bm-amber);
}
.bm-tab-active {
  color: var(--bm-amber);
}
.bm-btn-primary {
  background: var(--bm-amber);
}
.bm-btn-primary:hover:not(:disabled) {
  background: color-mix(in oklch, var(--bm-amber) 82%, black);
}
.bm-user-bubble {
  background: var(--bm-amber);
}
.bm-border-top-amber {
  border-top: 1px solid var(--bm-amber);
}
.bm-loading-bg {
  background: color-mix(in oklch, var(--b1, white) 85%, transparent);
}
.bm-sidebar-active {
  background: color-mix(in oklch, var(--bm-amber) 10%, var(--b2, white));
}
.bm-active-badge {
  background: color-mix(in oklch, var(--bm-amber) 15%, white);
  color: var(--bm-amber);
  border: 1px solid color-mix(in oklch, var(--bm-amber) 40%, white);
}

.bm-bot-card {
  border: 1px solid;
}
.bm-card-selected {
  border-color: var(--bm-amber);
  background: color-mix(in oklch, var(--bm-amber) 6%, var(--b1, white));
}

.bm-focus:focus {
  border-color: var(--bm-amber);
}
.bm-range {
  accent-color: var(--bm-amber);
}

.bm-roster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
@media (min-width: 1280px) {
  .bm-roster-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
@media (max-width: 640px) {
  .bm-roster-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .tab-label {
    display: none;
  }
}

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
</style>
