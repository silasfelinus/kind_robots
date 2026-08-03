<!-- /components/pages/conductor-page.vue -->
<template>
  <section class="kr-surface p-1.5 sm:p-2.5">
    <SnapshotModeBanner />

    <!-- COCKPIT BAR: unified slim context strip -->
    <div
      class="kr-toolbar rounded-xl border border-base-300/70 bg-base-100/90 px-3 py-1.5"
    >
      <!-- Left: breadcrumb or page label -->
      <div class="flex min-w-0 items-center gap-1.5">
        <button
          v-if="isSubView"
          type="button"
          class="btn btn-ghost btn-xs gap-0.5 rounded-lg px-1.5"
          @click="goToOverview"
        >
          <Icon name="kind-icon:chevron-left" class="size-3" />
          Back
        </button>
        <span v-else class="flex items-center gap-1.5">
          <Icon
            name="kind-icon:gearhammer"
            class="size-3.5 shrink-0 text-primary/70"
          />
          <span class="text-xs font-semibold text-base-content/50">
            {{ userStore.isAdmin ? 'Conductor' : 'Projects' }}
          </span>
          <span v-if="userStore.isAdmin" class="badge badge-primary badge-xs"
            >ADMIN</span
          >
        </span>

        <!-- Sub-view context label -->
        <span
          v-if="viewMode === 'tasks'"
          class="text-xs font-bold text-base-content/70"
          >· Tasks
          <span
            v-if="todoStore.openTodos.length"
            class="badge badge-primary badge-xs ml-1"
            >{{ todoStore.openTodos.length }}</span
          >
        </span>
        <span
          v-else-if="selectedProject"
          class="flex min-w-0 items-center gap-1.5"
        >
          <span class="text-[0.65rem] text-base-content/30">·</span>
          <img
            :src="projectIconPath(selectedProject.slug)"
            :alt="selectedProject.name"
            class="size-4 shrink-0 rounded-sm object-cover"
          />
          <span class="truncate text-xs font-bold">{{
            selectedProject.name || selectedProject.slug
          }}</span>
        </span>
      </div>

      <!-- Non-admin project count -->
      <template v-if="!userStore.isAdmin && projectStore.loaded">
        <span class="mx-0.5 h-3.5 w-px shrink-0 bg-base-content/10" />
        <span class="flex items-baseline gap-0.5">
          <span class="text-sm font-black leading-none text-primary">{{
            projectStore.publicProjects.length
          }}</span>
          <span class="text-[0.62rem] font-semibold text-base-content/50"
            >projects</span
          >
        </span>
      </template>

      <div class="flex-1" />

      <!-- Error indicator -->
      <span v-if="error" class="flex items-center gap-1 text-xs text-error">
        <Icon name="kind-icon:warning" class="size-3" />
        <span class="hidden max-w-32 truncate sm:inline">{{
          error.message
        }}</span>
      </span>

      <!-- Loading spinner (initial load only) -->
      <span
        v-if="pending && !conductorStore.hasLoaded"
        class="loading loading-spinner loading-xs text-primary"
      />
      <span
        v-if="todoStore.loading && viewMode === 'tasks'"
        class="loading loading-spinner loading-xs text-primary"
      />

      <!-- Missing projects sync (admin) -->
      <template v-if="userStore.isAdmin && missingProjectSlugs.length">
        <button
          type="button"
          class="btn btn-warning btn-xs gap-1 rounded-lg"
          :disabled="syncingMissing"
          @click="syncMissingProjects"
        >
          <span
            v-if="syncingMissing"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:warning" class="size-3" />
          Sync {{ missingProjectSlugs.length }}
        </button>
        <span
          v-if="syncMessage"
          class="text-xs"
          :class="syncError ? 'text-error' : 'text-success'"
          >{{ syncMessage }}</span
        >
      </template>

      <!-- Kaizen philosophy popup -->
      <KaizenPopup />

      <!-- Gallery mode toggle -->
      <div class="flex items-center gap-0.5">
        <button
          v-for="mode in galleryModeOptions"
          :key="mode.value"
          type="button"
          class="btn btn-xs rounded-md px-1.5"
          :class="
            projectGalleryMode === mode.value ? 'btn-primary' : 'btn-ghost'
          "
          :title="mode.label"
          @click="projectGalleryMode = mode.value"
        >
          {{ mode.abbr }}
        </button>
      </div>

      <!-- Refresh + timestamp (admin) -->
      <template v-if="userStore.isAdmin">
        <span
          v-if="conductorStore.fetchedAt"
          class="hidden text-[0.58rem] text-base-content/25 2xl:inline"
          >{{ fetchedLabel }}</span
        >
        <button
          type="button"
          class="btn btn-ghost btn-xs rounded-lg"
          :disabled="pending"
          @click="refreshWorkspace"
        >
          <span v-if="pending" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="size-3.5" />
        </button>
      </template>
    </div>

    <!-- Shared scroll owner: admin and non-admin bodies are mutually
         exclusive (fixed per user role, never both mounted at once), so
         one region covers both instead of each declaring its own. -->
    <div class="kr-scroll">
      <!-- NON-ADMIN: public project gallery -->
      <div v-if="!userStore.isAdmin" class="w-full overflow-x-hidden pb-4">
        <div
          v-if="!projectStore.loaded"
          class="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="h-20 animate-pulse rounded-2xl border border-base-300 bg-base-200"
          />
        </div>
        <template v-else>
          <div
            v-if="projectGalleryMode === 'icons'"
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3"
          >
            <div
              v-for="project in projectStore.publicProjects"
              :key="project.id"
              class="group flex flex-col items-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 text-center transition-all hover:border-primary/40 hover:shadow-md"
            >
              <img
                :src="projectIconPath(project.slug)"
                :alt="project.title"
                class="size-12 rounded-xl border border-base-300 object-cover"
              />
              <p class="w-full truncate text-xs font-semibold">
                {{ project.title }}
              </p>
              <p
                v-if="project.flavorText"
                class="line-clamp-2 w-full text-xs text-base-content/50"
              >
                {{ project.flavorText }}
              </p>
            </div>
          </div>
          <div
            v-else-if="projectGalleryMode === 'heroes'"
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4"
          >
            <div
              v-for="project in projectStore.publicProjects"
              :key="project.id"
              class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition-all hover:border-primary/40 hover:shadow-lg"
              style="aspect-ratio: 16/9"
            >
              <img
                :src="projectHeroPath(project.slug)"
                :alt="project.title"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-12"
              >
                <p class="truncate text-sm font-bold">{{ project.title }}</p>
                <p class="text-xs text-base-content/60">
                  {{ project.flavorText }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-else
            class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4"
          >
            <div
              v-for="project in projectStore.publicProjects"
              :key="project.id"
              class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition-all hover:border-primary/40 hover:shadow-lg"
              style="aspect-ratio: 2/3"
            >
              <img
                :src="projectCardPath(project.slug)"
                :alt="project.title"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-8"
              >
                <div class="flex items-center gap-2">
                  <img
                    :src="projectIconPath(project.slug)"
                    alt=""
                    class="size-7 shrink-0 rounded-lg border border-white/20 object-cover"
                  />
                  <p class="min-w-0 truncate text-sm font-bold leading-tight">
                    {{ project.title }}
                  </p>
                </div>
                <p class="mt-1 text-xs text-base-content/60">
                  {{ project.flavorText }}
                </p>
              </div>
            </div>
          </div>
          <p
            v-if="!projectStore.publicProjects.length"
            class="py-8 text-center text-sm text-base-content/50"
          >
            No public projects yet.
          </p>
        </template>
      </div>

      <!-- ADMIN VIEW -->
      <template v-else>
        <!-- Initial load skeleton -->
        <div
          v-if="pending && !conductorStore.hasLoaded"
          class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="h-16 animate-pulse rounded-2xl border border-base-300 bg-base-200"
          />
        </div>

        <div v-if="conductorStore.hasLoaded" class="flex flex-col">
          <!-- TASKS -->
          <div v-if="viewMode === 'tasks'" class="flex flex-col gap-4 pb-4">
            <form
              class="rounded-2xl border border-base-300 bg-base-100 p-4 space-y-3"
              @submit.prevent="submitNewTodo"
            >
              <h4
                class="text-xs font-bold uppercase tracking-wide text-base-content/50"
              >
                New Task
              </h4>
              <input
                v-model="newTodoTitle"
                type="text"
                placeholder="What needs doing?"
                class="input input-bordered w-full rounded-xl"
                :disabled="todoStore.loading"
              />
              <textarea
                v-model="newTodoDescription"
                :placeholder="
                  newTodoCategory === 'AGENT'
                    ? 'Context for the agent — project name, specific instructions, relevant files...'
                    : newTodoCategory === 'KAIZEN'
                      ? 'What improvement do you want to make?'
                      : 'What do you need to do?'
                "
                class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
                rows="3"
                :disabled="todoStore.loading"
              />
              <div class="flex flex-wrap items-center gap-2">
                <select
                  v-model="newTodoCategory"
                  class="select select-bordered select-sm rounded-xl"
                >
                  <option value="AGENT">🤖 Agent Task</option>
                  <option value="KAIZEN">✨ Kaizen</option>
                  <option value="HONEYDO">🍯 Honey Do</option>
                </select>
                <select
                  v-model="newTodoPriority"
                  class="select select-bordered select-sm rounded-xl"
                >
                  <option value="HIGH">🔴 High</option>
                  <option value="NORMAL">🟡 Normal</option>
                  <option value="LOW">🟢 Low</option>
                </select>
                <button
                  type="submit"
                  class="btn btn-primary btn-sm ml-auto rounded-xl"
                  :disabled="!newTodoTitle.trim() || todoStore.loading"
                >
                  <Icon name="kind-icon:plus" class="size-4" /> Add
                </button>
              </div>
            </form>

            <div class="kr-toolbar">
              <div
                v-if="todoFilter === 'OPEN'"
                role="tablist"
                class="tabs tabs-boxed"
              >
                <button
                  type="button"
                  role="tab"
                  class="tab gap-1 text-xs"
                  :class="taskTab === 'AGENT' ? 'tab-active' : ''"
                  @click="taskTab = 'AGENT'"
                >
                  🤖 Agent
                  <span
                    v-if="todoStore.regularAgentTodos.length"
                    class="badge badge-xs badge-primary"
                    >{{ todoStore.regularAgentTodos.length }}</span
                  >
                </button>
                <button
                  type="button"
                  role="tab"
                  class="tab gap-1 text-xs"
                  :class="taskTab === 'SERENDIPITY' ? 'tab-active' : ''"
                  @click="taskTab = 'SERENDIPITY'"
                >
                  ✨ Story
                  <span
                    v-if="todoStore.serendipityAgentTodos.length"
                    class="badge badge-xs badge-secondary"
                    >{{ todoStore.serendipityAgentTodos.length }}</span
                  >
                </button>
                <button
                  type="button"
                  role="tab"
                  class="tab gap-1 text-xs"
                  :class="taskTab === 'KAIZEN' ? 'tab-active' : ''"
                  @click="taskTab = 'KAIZEN'"
                >
                  ✨ Kaizen
                  <span
                    v-if="todoStore.kaizenTodos.length"
                    class="badge badge-xs badge-secondary"
                    >{{ todoStore.kaizenTodos.length }}</span
                  >
                </button>
                <button
                  type="button"
                  role="tab"
                  class="tab gap-1 text-xs"
                  :class="taskTab === 'HONEYDO' ? 'tab-active' : ''"
                  @click="taskTab = 'HONEYDO'"
                >
                  🍯 Honey Do
                  <span
                    v-if="todoStore.honeyDoTodos.length"
                    class="badge badge-xs badge-accent"
                    >{{ todoStore.honeyDoTodos.length }}</span
                  >
                </button>
              </div>
              <select
                v-model="todoFilter"
                class="select select-bordered select-xs ml-auto rounded-xl text-xs font-semibold"
              >
                <option v-for="f in todoFilterOptions" :key="f" :value="f">
                  {{ f.charAt(0) + f.slice(1).toLowerCase() }}
                </option>
              </select>
            </div>

            <!-- Honeydo inbox context banner (t-003) -->
            <div
              v-if="taskTab === 'HONEYDO' && todoFilter === 'OPEN'"
              class="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3"
            >
              <p class="text-xs font-semibold text-accent/80">
                🍯 Honey-Do Queue
              </p>
              <p class="mt-0.5 text-xs text-base-content/50">
                Action items your AI assigned to you. These help your projects
                along — check them off as you go.
              </p>
              <p
                v-if="highPriorityHoneyDos > 0"
                class="mt-1 text-xs font-semibold text-error"
              >
                {{ highPriorityHoneyDos }} high-priority item{{
                  highPriorityHoneyDos > 1 ? 's' : ''
                }}
                need your attention.
              </p>
            </div>

            <div class="space-y-2">
              <template v-if="todoStore.loading && !filteredTodos.length">
                <div
                  v-for="n in 3"
                  :key="n"
                  class="h-16 animate-pulse rounded-2xl border border-base-300 bg-base-200"
                />
              </template>
              <template v-for="todo in filteredTodos" :key="todo.id">
                <honeydo-card
                  v-if="todo.category === 'HONEYDO'"
                  :todo="todo"
                  :show-relative-time="false"
                  :show-category-badge="todoFilter !== 'OPEN'"
                  show-archive-action
                  show-delete-action
                  @toggle-done="todoStore.toggleDone(todo)"
                  @archive="todoStore.archiveTodo(todo.id)"
                  @delete="todoStore.deleteTodo(todo.id)"
                />
                <div
                  v-else
                  class="flex flex-col gap-1 rounded-2xl border px-4 py-3 transition-colors"
                  :class="[
                    todo.status === 'DONE'
                      ? 'opacity-60 border-base-300 bg-base-100'
                      : 'border-base-300 bg-base-100',
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="shrink-0 transition-colors"
                      :class="
                        todo.status === 'DONE'
                          ? 'text-success'
                          : 'text-base-content/30 hover:text-success'
                      "
                      @click="todoStore.toggleDone(todo)"
                    >
                      <Icon
                        :name="
                          todo.status === 'DONE'
                            ? 'kind-icon:check-circle'
                            : 'kind-icon:circle'
                        "
                        class="size-5"
                      />
                    </button>
                    <span
                      class="min-w-0 flex-1 truncate text-sm font-medium"
                      :class="
                        todo.status === 'DONE'
                          ? 'line-through text-base-content/40'
                          : ''
                      "
                      >{{ todo.title }}</span
                    >
                    <span
                      v-if="todo.priority === 'HIGH'"
                      class="badge badge-error badge-xs shrink-0"
                      >🔴 high</span
                    >
                    <span
                      v-else-if="todo.priority === 'LOW'"
                      class="badge badge-ghost badge-xs shrink-0"
                      >🟢 low</span
                    >
                    <span
                      v-if="todoFilter !== 'OPEN' && todo.category === 'KAIZEN'"
                      class="badge badge-secondary badge-xs shrink-0"
                      >✨ kaizen</span
                    >
                    <span
                      v-if="todoStore.isSerendipityAgentTodo(todo)"
                      class="badge badge-secondary badge-xs shrink-0"
                      >✨ story</span
                    >
                    <div class="flex shrink-0 gap-1">
                      <button
                        v-if="todo.status !== 'ARCHIVED'"
                        type="button"
                        class="btn btn-ghost btn-xs rounded-lg text-base-content/30 hover:text-base-content"
                        title="Archive"
                        @click="todoStore.archiveTodo(todo.id)"
                      >
                        <Icon name="kind-icon:archive" class="size-3" />
                      </button>
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs rounded-lg text-base-content/20 hover:text-error"
                        title="Delete"
                        @click="todoStore.deleteTodo(todo.id)"
                      >
                        <Icon name="kind-icon:x" class="size-3" />
                      </button>
                    </div>
                  </div>
                  <p
                    v-if="todo.description"
                    class="ml-8 text-xs leading-relaxed text-base-content/50"
                  >
                    {{ todo.description }}
                  </p>
                </div>
              </template>
              <div
                v-if="!todoStore.loading && !filteredTodos.length"
                class="py-8 text-center"
              >
                <template v-if="taskTab === 'HONEYDO' && todoFilter === 'OPEN'">
                  <Icon
                    name="kind-icon:check-circle"
                    class="mx-auto mb-2 size-8 text-success/40"
                  />
                  <p class="text-sm font-semibold text-base-content/50">
                    No honey-dos right now.
                  </p>
                  <p class="mt-1 text-xs text-base-content/30">
                    When your AI assigns you an action item, it shows up here.
                  </p>
                </template>
                <p v-else class="text-sm text-base-content/50">
                  No {{ todoFilter.toLowerCase() }} tasks.
                </p>
              </div>
            </div>
          </div>

          <!-- PROJECT DETAIL -->
          <div v-else-if="selectedProject" class="flex flex-col gap-4 pb-4">
            <div
              class="relative min-h-[180px] overflow-hidden rounded-2xl sm:min-h-[220px] xl:min-h-[260px]"
            >
              <div
                class="absolute inset-0"
                :class="kindBgGradient(selectedProject.kind)"
              />
              <img
                v-if="!heroFailed"
                :src="projectHeroPath(selectedProject.slug)"
                :alt="selectedProject.name"
                class="absolute inset-0 h-full w-full object-cover"
                @error="heroFailed = true"
              />
              <div
                class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/30 to-transparent"
              />
              <div class="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4">
                <div
                  class="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl"
                >
                  <img
                    v-if="!iconFailed"
                    :src="projectIconPath(selectedProject.slug)"
                    :alt="selectedProject.name"
                    class="h-full w-full object-cover"
                    @error="iconFailed = true"
                  />
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center"
                    :class="kindIconClass(selectedProject.kind)"
                  >
                    <Icon
                      :name="kindIcon(selectedProject.kind)"
                      class="size-7"
                    />
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-xl font-black leading-tight">
                    {{
                      linkedProject?.title ||
                      selectedProject.name ||
                      selectedProject.slug
                    }}
                  </h3>
                  <p class="text-xs text-base-content/60">
                    {{ selectedProject.progress }}% complete &middot;
                    {{ selectedProject.tasks.length }} tasks
                  </p>
                </div>
                <span
                  v-if="linkedProject?.status === 'BRAINSTORM'"
                  class="badge badge-secondary badge-sm shrink-0"
                  >brainstorm</span
                >
                <span
                  v-else
                  class="badge badge-sm shrink-0"
                  :class="kindBadgeClass(selectedProject.kind)"
                  >{{ selectedProject.kind }}</span
                >
              </div>
            </div>

            <div class="flex shrink-0 flex-wrap gap-2">
              <span
                v-for="[status, count] in taskStatusSummary(selectedProject)"
                :key="status"
                class="badge badge-sm gap-1"
                :class="taskBadgeClass(status)"
              >
                <Icon :name="taskIcon(status)" class="size-3" />{{ count }}
                {{ status }}
              </span>
            </div>

            <div
              v-if="linkedProject"
              class="flex shrink-0 flex-wrap items-center gap-2"
            >
              <select
                class="select select-bordered select-sm rounded-xl font-bold"
                :class="
                  prioritySelectClass(
                    linkedProject.priority as ProjectPriorityLevel,
                  )
                "
                :value="linkedProject.priority"
                :disabled="projectSaving"
                @change="handlePriorityChange"
              >
                <option value="HIGH">🔴 HIGH</option>
                <option value="NORMAL">🟡 NORMAL</option>
                <option value="LOW">🟢 LOW</option>
              </select>
              <select
                class="select select-bordered select-sm rounded-xl text-xs font-semibold"
                :value="linkedProject.status"
                :disabled="projectSaving"
                @change="handleProjectStatusChange"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PAUSED">PAUSED</option>
                <option value="BRAINSTORM">BRAINSTORM</option>
                <option value="DONE">DONE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
              <button
                type="button"
                class="btn btn-sm gap-1.5 rounded-xl"
                :class="
                  linkedProject.isPublic
                    ? 'btn-success'
                    : 'btn-ghost border border-base-300'
                "
                :disabled="projectSaving"
                @click="patchProject({ isPublic: !linkedProject.isPublic })"
              >
                <Icon
                  :name="
                    linkedProject.isPublic
                      ? 'kind-icon:eye'
                      : 'kind-icon:eye-off'
                  "
                  class="size-3.5"
                />
                {{ linkedProject.isPublic ? 'Public' : 'Private' }}
              </button>
              <button
                type="button"
                class="btn btn-sm gap-1.5 rounded-xl"
                :class="
                  linkedProject.isMature
                    ? 'btn-warning'
                    : 'btn-ghost border border-base-300'
                "
                :disabled="projectSaving"
                @click="patchProject({ isMature: !linkedProject.isMature })"
              >
                <Icon name="kind-icon:warning" class="size-3.5" />{{
                  linkedProject.isMature ? 'Mature' : 'Safe'
                }}
              </button>
              <allow-reviews-toggle
                :allow-reviews="Boolean(linkedProject.allowReviews)"
                :saving="projectSaving"
                @toggle="
                  patchProject({ allowReviews: !linkedProject.allowReviews })
                "
              />
              <span
                v-if="projectSaving"
                class="loading loading-spinner loading-xs self-center text-primary"
              />
              <span
                v-if="projectSaveMessage"
                class="self-center text-xs"
                :class="projectSaveError ? 'text-error' : 'text-success'"
                >{{ projectSaveMessage }}</span
              >
            </div>

            <div
              class="grid shrink-0 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
            >
              <div
                v-if="linkedProject"
                class="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <div class="flex items-center gap-2">
                  <Icon name="kind-icon:dream" class="size-4 text-primary" />
                  <h4
                    class="text-xs font-bold uppercase tracking-wide text-base-content/60"
                  >
                    Project Intent
                  </h4>
                  <span class="ml-auto text-xs text-base-content/30"
                    >Click any field to edit — saves on blur</span
                  >
                </div>
                <div class="form-control">
                  <label class="label py-0.5"
                    ><span class="label-text text-xs font-semibold"
                      >Goal — what does 100% look like?</span
                    ></label
                  >
                  <textarea
                    class="textarea textarea-bordered rounded-xl text-sm leading-relaxed"
                    rows="3"
                    placeholder="One clear paragraph: what precisely does this project look like when it's complete?"
                    :value="linkedProject.goal ?? ''"
                    :disabled="projectSaving"
                    @blur="autosave('goal', $event)"
                  />
                </div>
                <div class="form-control">
                  <label class="label py-0.5"
                    ><span class="label-text text-xs font-semibold"
                      >Description</span
                    ></label
                  >
                  <textarea
                    class="textarea textarea-bordered rounded-xl text-sm leading-relaxed"
                    rows="8"
                    placeholder="What is this project?"
                    :value="linkedProject.description ?? ''"
                    :disabled="projectSaving"
                    @blur="autosave('description', $event)"
                  />
                </div>
                <div class="form-control">
                  <label class="label py-0.5"
                    ><span class="label-text text-xs font-semibold"
                      >Intent / Pitch</span
                    ></label
                  >
                  <textarea
                    class="textarea textarea-bordered rounded-xl text-sm leading-relaxed"
                    rows="6"
                    placeholder="Core constraint or north star"
                    :value="linkedProject.pitch ?? ''"
                    :disabled="projectSaving"
                    @blur="autosave('pitch', $event)"
                  />
                </div>
                <div class="form-control">
                  <label class="label py-0.5"
                    ><span class="label-text text-xs font-semibold"
                      >Flavor Text</span
                    ></label
                  >
                  <input
                    type="text"
                    class="input input-bordered rounded-xl text-sm"
                    placeholder="Short tagline"
                    :value="linkedProject.flavorText ?? ''"
                    :disabled="projectSaving"
                    @blur="autosave('flavorText', $event)"
                  />
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="form-control">
                    <label class="label py-0.5"
                      ><span class="label-text text-xs font-semibold"
                        >Live URL</span
                      ></label
                    >
                    <input
                      type="url"
                      class="input input-bordered rounded-xl text-sm"
                      placeholder="https://..."
                      :value="linkedProject.liveUrl ?? ''"
                      :disabled="projectSaving"
                      @blur="autosave('liveUrl', $event)"
                    />
                  </div>
                  <div class="form-control">
                    <label class="label py-0.5"
                      ><span class="label-text text-xs font-semibold"
                        >Repo URL</span
                      ></label
                    >
                    <input
                      type="url"
                      class="input input-bordered rounded-xl text-sm"
                      placeholder="https://github.com/..."
                      :value="linkedProject.repoUrl ?? ''"
                      :disabled="projectSaving"
                      @blur="autosave('repoUrl', $event)"
                    />
                  </div>
                </div>
                <div class="flex flex-wrap gap-2 pt-1">
                  <a
                    v-if="linkedProject.liveUrl"
                    :href="linkedProject.liveUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-xs btn-outline gap-1"
                  >
                    <Icon name="kind-icon:external-link" class="size-3" /> Live
                    Site
                  </a>
                  <a
                    v-if="linkedProject.repoUrl"
                    :href="linkedProject.repoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-xs btn-outline gap-1"
                  >
                    <Icon name="kind-icon:code" class="size-3" /> Repo
                  </a>
                </div>
              </div>
              <div
                v-else
                class="rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-4 text-center text-xs text-base-content/40"
              >
                <Icon
                  name="kind-icon:dream"
                  class="mx-auto mb-1 size-5 opacity-40"
                />
                No Project record linked for
                <strong>{{ selectedProject.slug }}</strong>
              </div>

              <ConductorArtGallery
                :slug="selectedProject.slug"
                :hero-path="projectHeroPath(selectedProject.slug)"
                :card-path="projectCardPath(selectedProject.slug)"
                :icon-path="projectIconPath(selectedProject.slug)"
              />
            </div>

            <!-- PROJECT ASSISTANT -->
            <div v-if="linkedProject" class="shrink-0">
              <ConductorProjectChat
                :project-id="linkedProject.id"
                :project-title="linkedProject.title || selectedProject.slug"
                :project-context="projectContextText"
              />
            </div>

            <div
              v-if="selectedProject.notesFromSilas"
              class="shrink-0 rounded-2xl border border-info/30 bg-info/5 p-4 text-sm text-base-content/80"
            >
              <p
                class="mb-1 text-xs font-bold uppercase tracking-wide text-info/70"
              >
                Notes from Silas
              </p>
              {{ selectedProject.notesFromSilas }}
            </div>

            <div class="grid min-h-0 gap-4 sm:grid-cols-2">
              <div v-if="selectedProject.milestones.length">
                <h4
                  class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  Milestones
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="milestone in selectedProject.milestones"
                    :key="milestone.id"
                    class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
                  >
                    <div
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                      :class="milestoneIconClass(milestone.status)"
                    >
                      <Icon
                        :name="milestoneIcon(milestone.status)"
                        class="size-3.5"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-semibold">
                        {{ milestone.title }}
                      </p>
                      <p class="text-xs text-base-content/50">
                        weight {{ milestone.weight }}
                        <span
                          v-if="milestoneTaskCounts.get(milestone.id)?.total"
                          >&middot;
                          {{ milestoneTaskCounts.get(milestone.id)?.done }}/{{
                            milestoneTaskCounts.get(milestone.id)?.total
                          }}
                          done</span
                        >
                      </p>
                    </div>
                    <span
                      class="badge badge-sm shrink-0"
                      :class="milestoneBadgeClass(milestone.status)"
                      >{{ milestone.status }}</span
                    >
                  </div>
                </div>
              </div>
              <div v-if="selectedProject.tasks.length">
                <h4
                  class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  Tasks ({{ selectedProject.tasks.length }})
                </h4>
                <div class="space-y-2">
                  <div
                    v-for="task in activeTasks"
                    :key="task.id"
                    class="rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
                  >
                    <div class="flex items-start gap-3">
                      <div
                        class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                        :class="taskIconClass(task.status)"
                      >
                        <Icon :name="taskIcon(task.status)" class="size-3" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold leading-snug">
                          {{ task.title }}
                        </p>
                        <div
                          class="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-base-content/50"
                        >
                          <span>{{ task.id }}</span>
                          <span v-if="task.milestone"
                            >&middot; {{ task.milestone }}</span
                          >
                          <span v-if="task.gateHuman" class="text-accent"
                            >&middot; gate</span
                          >
                          <span v-if="task.owner"
                            >&middot; {{ task.owner }}</span
                          >
                          <span v-if="task.passes > 0" class="text-warning"
                            >&middot; pass {{ task.passes }}/3</span
                          >
                        </div>
                        <div
                          class="mt-1 flex flex-wrap items-center gap-1.5 text-xs"
                        >
                          <span
                            v-if="task.stakes && task.stakes !== 'reversible'"
                            class="badge badge-xs"
                            :class="stakesBadgeClass(task.stakes)"
                            >{{ task.stakes }}</span
                          >
                          <span
                            v-if="task.dependsOn"
                            class="text-base-content/30"
                            >depends:
                            {{
                              Array.isArray(task.dependsOn)
                                ? task.dependsOn.join(', ')
                                : task.dependsOn
                            }}</span
                          >
                          <span
                            v-if="task.gateHuman && task.approvedByHuman"
                            class="text-success"
                            >✓ approved</span
                          >
                          <span
                            v-if="task.gateHuman && !task.approvedByHuman"
                            class="text-accent/70"
                            >awaiting approval</span
                          >
                          <span
                            v-if="task.updated"
                            class="ml-auto text-base-content/25"
                            >{{ relativeTime(task.updated) }}</span
                          >
                        </div>
                        <p
                          v-if="task.note"
                          class="mt-1.5 line-clamp-3 text-xs leading-relaxed text-base-content/50"
                        >
                          {{ task.note }}
                        </p>
                      </div>
                      <span
                        class="badge badge-sm shrink-0"
                        :class="taskBadgeClass(task.status)"
                        >{{ task.status }}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- COMPLETED TASKS DISCLOSURE, PER MILESTONE (t-015) -->
                <div v-if="doneTasksByMilestone.length" class="mt-2 space-y-2">
                  <details
                    v-for="group in doneTasksByMilestone"
                    :key="group.id"
                    class="group rounded-2xl border border-base-300 bg-base-200/50"
                  >
                    <summary
                      class="flex cursor-pointer list-none items-center gap-2 px-4 py-2 text-xs font-semibold text-base-content/50 marker:content-none"
                    >
                      <Icon
                        name="kind-icon:chevron-right"
                        class="size-3.5 shrink-0 transition-transform group-open:rotate-90"
                      />
                      <span class="truncate">{{ group.title }}</span>
                      <span class="text-base-content/40"
                        >&middot; Completed ({{ group.tasks.length }})</span
                      >
                    </summary>
                    <div class="space-y-1.5 px-3 pb-3 pt-1">
                      <div
                        v-for="task in group.tasks"
                        :key="task.id"
                        class="flex items-start gap-2 rounded-xl border border-base-300/60 bg-base-100/60 px-3 py-2"
                      >
                        <Icon
                          name="kind-icon:check"
                          class="mt-0.5 size-3.5 shrink-0 text-success/70"
                        />
                        <div class="min-w-0 flex-1">
                          <p
                            class="truncate text-xs font-medium text-base-content/70"
                          >
                            {{ task.title }}
                          </p>
                          <div
                            class="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-base-content/40"
                          >
                            <span>{{ task.id }}</span>
                            <span
                              v-if="task.gateHuman && task.approvedByHuman"
                              class="text-success"
                              >&middot; ✓ approved</span
                            >
                            <span v-if="task.updated" class="ml-auto">{{
                              relativeTime(task.updated)
                            }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            <!-- PROJECT TASK CREATION (t-002) -->
            <div
              v-if="linkedProject"
              class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <h4
                class="mb-3 text-xs font-bold uppercase tracking-wide text-base-content/50"
              >
                Add Task to This Project
              </h4>
              <form class="space-y-2" @submit.prevent="submitProjectTask">
                <input
                  v-model="projectTaskTitle"
                  type="text"
                  placeholder="What needs doing?"
                  class="input input-bordered w-full rounded-xl text-sm"
                  :disabled="projectTaskSubmitting"
                />
                <textarea
                  v-model="projectTaskDescription"
                  placeholder="Optional context..."
                  class="textarea textarea-bordered w-full rounded-xl text-sm"
                  rows="2"
                  :disabled="projectTaskSubmitting"
                />
                <div class="flex flex-wrap items-center gap-2">
                  <select
                    v-model="projectTaskCategory"
                    class="select select-bordered select-sm rounded-xl"
                  >
                    <option value="AGENT">🤖 Agent Task</option>
                    <option value="KAIZEN">✨ Kaizen</option>
                    <option value="HONEYDO">🍯 Honey Do</option>
                    <option value="DESIRED_FEATURE">⭐ Feature Idea</option>
                  </select>
                  <select
                    v-model="projectTaskPriority"
                    class="select select-bordered select-sm rounded-xl"
                  >
                    <option value="HIGH">🔴 High</option>
                    <option value="NORMAL">🟡 Normal</option>
                    <option value="LOW">🟢 Low</option>
                  </select>
                  <button
                    type="submit"
                    class="btn btn-primary btn-sm ml-auto rounded-xl"
                    :disabled="
                      !projectTaskTitle.trim() || projectTaskSubmitting
                    "
                  >
                    <span
                      v-if="projectTaskSubmitting"
                      class="loading loading-spinner loading-xs"
                    />
                    Add Task
                  </button>
                </div>
              </form>
            </div>

            <!-- KAIZEN + POLISH PROMPT (t-004, t-006) -->
            <div
              v-if="linkedProject"
              class="shrink-0 space-y-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4"
            >
              <div class="flex items-center gap-2">
                <Icon name="kind-icon:sparkles" class="size-4 text-secondary" />
                <h4
                  class="text-xs font-bold uppercase tracking-wide text-secondary/70"
                >
                  Kaizen — Improvements
                </h4>
              </div>
              <div v-if="projectKaizens.length" class="space-y-2">
                <div
                  v-for="kaizen in projectKaizens"
                  :key="kaizen.id"
                  class="flex items-start gap-2 rounded-xl border border-secondary/20 bg-base-100 px-3 py-2"
                >
                  <Icon
                    name="kind-icon:sparkles"
                    class="mt-0.5 size-3.5 shrink-0 text-secondary/50"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm leading-snug">{{ kaizen.title }}</p>
                    <p
                      v-if="kaizen.description"
                      class="mt-0.5 text-xs text-base-content/50"
                    >
                      {{ kaizen.description }}
                    </p>
                  </div>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-lg text-success"
                    :disabled="todoStore.loading"
                    @click="todoStore.updateTodo(kaizen.id, { status: 'DONE' })"
                  >
                    done
                  </button>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40">
                No active kaizens for this project.
              </p>
              <form
                class="flex flex-col gap-2"
                @submit.prevent="submitPolishPrompt"
              >
                <label class="label py-0"
                  ><span
                    class="label-text text-xs font-semibold text-secondary/80"
                    >How can I make this look better?</span
                  ></label
                >
                <div class="flex gap-2">
                  <input
                    v-model="polishPrompt"
                    type="text"
                    placeholder="Any visual or UX idea for this project..."
                    class="input input-bordered input-sm flex-1 rounded-xl text-sm"
                    :disabled="polishSubmitting"
                  />
                  <button
                    type="submit"
                    class="btn btn-secondary btn-sm rounded-xl"
                    :disabled="!polishPrompt.trim() || polishSubmitting"
                  >
                    <span
                      v-if="polishSubmitting"
                      class="loading loading-spinner loading-xs"
                    />
                    <Icon v-else name="kind-icon:sparkles" class="size-3.5" />
                  </button>
                </div>
                <p v-if="polishMessage" class="text-xs text-success">
                  {{ polishMessage }}
                </p>
              </form>
            </div>

            <!-- DESIRED FEATURES (t-007) -->
            <div
              v-if="linkedProject"
              class="shrink-0 space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <div class="flex items-center gap-2">
                <Icon name="kind-icon:check" class="size-4 text-primary" />
                <h4
                  class="text-xs font-bold uppercase tracking-wide text-base-content/50"
                >
                  Feature Wishlist
                </h4>
              </div>
              <div v-if="projectFeatures.length" class="space-y-1.5">
                <div
                  v-for="(feature, idx) in projectFeatures"
                  :key="feature.id"
                  class="group flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
                  :class="
                    feature.status === 'ARCHIVED'
                      ? 'border-base-300/50 bg-base-200/50 opacity-50'
                      : 'border-base-300 bg-base-200'
                  "
                >
                  <div class="flex shrink-0 flex-col">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs h-4 min-h-0 rounded px-1 py-0 opacity-40 hover:opacity-100 disabled:opacity-20"
                      :disabled="idx === 0 || todoStore.loading"
                      @click="moveFeatureUp(idx)"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs h-4 min-h-0 rounded px-1 py-0 opacity-40 hover:opacity-100 disabled:opacity-20"
                      :disabled="
                        idx === projectFeatures.length - 1 || todoStore.loading
                      "
                      @click="moveFeatureDown(idx)"
                    >
                      ▼
                    </button>
                  </div>
                  <p
                    class="min-w-0 flex-1 text-sm leading-snug"
                    :class="
                      feature.status === 'ARCHIVED'
                        ? 'line-through text-base-content/40'
                        : ''
                    "
                  >
                    {{ feature.title }}
                  </p>
                  <div
                    v-if="feature.status !== 'ARCHIVED'"
                    class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs rounded-lg text-xs text-primary"
                      :disabled="todoStore.loading"
                      @click="promoteFeatureToTask(feature.id)"
                    >
                      → task
                    </button>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs rounded-lg text-xs text-base-content/30"
                      :disabled="todoStore.loading"
                      @click="retireFeature(feature.id)"
                    >
                      retire
                    </button>
                  </div>
                </div>
              </div>
              <p v-else class="text-xs text-base-content/40">
                No feature ideas yet.
              </p>
              <form class="flex gap-2" @submit.prevent="addDesiredFeature">
                <input
                  v-model="newFeatureTitle"
                  type="text"
                  placeholder="New feature idea..."
                  class="input input-bordered input-sm flex-1 rounded-xl text-sm"
                  :disabled="newFeatureSubmitting"
                />
                <button
                  type="submit"
                  class="btn btn-outline btn-sm rounded-xl"
                  :disabled="!newFeatureTitle.trim() || newFeatureSubmitting"
                >
                  <span
                    v-if="newFeatureSubmitting"
                    class="loading loading-spinner loading-xs"
                  />
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type {
  ConductorProject,
  ConductorTask,
} from '@/server/api/conductor/projects.get'
import {
  useProjectStore,
  type ProjectPriorityLevel,
  type ProjectWithRelations,
} from '@/stores/projectStore'
import { useUserStore } from '@/stores/userStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import type { TodoCategory } from '@/stores/todoStore'
import { useConductorStore } from '@/stores/conductorStore'
import {
  getProjectPlacement,
  placementLiveUrl,
} from '~/utils/projectPlacements'
import type { BuilderCard } from '@/stores/helpers/builderCards'
import {
  GALLERY_MODES,
  IS_GALLERY_MODE,
  type GalleryMode,
} from '@/utils/galleryVocabulary'
import ConductorArtGallery from '@/components/conductor/conductor-art-gallery.vue'
import ConductorProjectChat from '@/components/conductor/conductor-project-chat.vue'
import KaizenPopup from '@/components/conductor/kaizen-popup.vue'
import SnapshotModeBanner from '@/components/navigation/snapshot-mode-banner.vue'

type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' | 'BRAINSTORM'

type ProjectPatch = {
  description?: string | null
  pitch?: string | null
  goal?: string | null
  flavorText?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  isPublic?: boolean
  isMature?: boolean
  allowReviews?: boolean
  status?: ProjectStatus
  priority?: ProjectPriorityLevel
}

const userStore = useUserStore()
const projectStore = useProjectStore()
const pageStore = usePageStore()
const todoStore = useTodoStore()
const conductorStore = useConductorStore()

const CONDUCTOR_IMG_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

const galleryModeOptions = GALLERY_MODES
const projectGalleryMode = ref<GalleryMode>('cards')

const syncingMissing = ref(false)
const syncMessage = ref('')
const syncError = ref(false)

const projectSaving = ref(false)
const projectSaveMessage = ref('')
const projectSaveError = ref(false)

const newTodoTitle = ref('')
const newTodoDescription = ref('')
const newTodoPriority = ref<ProjectPriorityLevel>('NORMAL')
const newTodoCategory = ref<TodoCategory>('AGENT')
const todoFilter = ref<'OPEN' | 'DONE' | 'ARCHIVED'>('OPEN')
const todoFilterOptions = ['OPEN', 'DONE', 'ARCHIVED'] as const
const taskTab = ref<'AGENT' | 'SERENDIPITY' | 'KAIZEN' | 'HONEYDO'>('AGENT')

let saveMessageTimer: ReturnType<typeof setTimeout> | null = null

const pending = computed(() => conductorStore.pending || projectStore.loading)
const error = computed(() =>
  conductorStore.error || projectStore.error
    ? { message: conductorStore.error || projectStore.error || '' }
    : null,
)

const projects = computed<ConductorProject[]>(() => {
  const conductorProjects = conductorStore.projects
  const conductorSlugs = new Set(
    conductorProjects.map((project) => project.slug),
  )
  const databaseOnlyProjects = projectStore.projects.flatMap((project) => {
    const slug = project.conductorSlug || project.slug
    if (!slug || conductorSlugs.has(slug)) return []
    return [projectRecordToConductor(project)]
  })
  return [...conductorProjects, ...databaseOnlyProjects]
})
const pendingPitches = computed(() => conductorStore.pendingPitches)

function projectRecordForSlug(slug: string) {
  return projectStore.projectForSlug(slug)
}

function projectRecordToConductor(
  project: ProjectWithRelations,
): ConductorProject {
  const slug = project.conductorSlug || project.slug || `project-${project.id}`
  return {
    slug,
    name: project.title,
    kind: 'project',
    milestones: [],
    tasks: [],
    progress: project.status === 'DONE' ? 100 : 0,
    imagePath: project.imagePath || `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`,
    cardPath: project.cardPath || `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`,
    heroPath: project.heroPath || `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`,
  }
}

function projectCardPath(slug: string | null): string {
  slug = slug || 'project'
  return (
    projectRecordForSlug(slug)?.cardPath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`
  )
}
function projectHeroPath(slug: string | null): string {
  slug = slug || 'project'
  return (
    projectRecordForSlug(slug)?.heroPath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`
  )
}
function projectIconPath(slug: string | null): string {
  slug = slug || 'project'
  return (
    projectRecordForSlug(slug)?.imagePath ??
    `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`
  )
}

const activeProjects = computed(() =>
  projects.value.filter((project) => {
    const status = projectRecordForSlug(project.slug)?.status
    return status !== 'BRAINSTORM' && status !== 'ARCHIVED'
  }),
)

const sortedActiveProjects = computed(() =>
  [...activeProjects.value].sort((a, b) => {
    const order: Record<ProjectPriorityLevel, number> = {
      HIGH: 0,
      NORMAL: 1,
      LOW: 2,
    }
    const pa =
      (projectRecordForSlug(a.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    const pb =
      (projectRecordForSlug(b.slug)?.priority as
        ProjectPriorityLevel | undefined) ?? 'NORMAL'
    return (order[pa] ?? 1) - (order[pb] ?? 1)
  }),
)

const brainstormProjects = computed(() =>
  projects.value.filter(
    (project) => projectRecordForSlug(project.slug)?.status === 'BRAINSTORM',
  ),
)

const missingProjectSlugs = computed(() => {
  if (!conductorStore.hasLoaded || !projectStore.loaded) return []
  return conductorStore.projects
    .filter((project) => !projectRecordForSlug(project.slug))
    .map((project) => project.slug)
})

const hasBrainstormContent = computed(
  () => pendingPitches.value.length > 0 || brainstormProjects.value.length > 0,
)

const filteredTodos = computed(() => {
  if (todoFilter.value === 'DONE') return todoStore.doneTodos
  if (todoFilter.value === 'ARCHIVED') return todoStore.archivedTodos
  switch (taskTab.value) {
    case 'SERENDIPITY':
      return todoStore.serendipityAgentTodos
    case 'KAIZEN':
      return todoStore.kaizenTodos
    case 'HONEYDO':
      return todoStore.honeyDoTodos
    default:
      return todoStore.regularAgentTodos
  }
})

const highPriorityHoneyDos = computed(
  () => todoStore.honeyDoTodos.filter((t) => t.priority === 'HIGH').length,
)

const viewMode = computed(() => {
  const key = pageStore.workspaceCardKey
  if (!key || key === 'overview') return 'overview'
  if (key === 'tasks') return 'tasks'
  if (key === 'brainstorm') return 'brainstorm'
  if (projects.value.some((project) => project.slug === key)) return key
  if (projectStore.projectForSlug(key)) return key
  return 'overview'
})

const isSubView = computed(() => viewMode.value !== 'overview')

const selectedProject = computed<ConductorProject | null>(() => {
  if (['overview', 'tasks', 'brainstorm'].includes(viewMode.value)) return null
  return projects.value.find((p) => p.slug === viewMode.value) ?? null
})

const linkedProject = computed(() =>
  selectedProject.value
    ? projectRecordForSlug(selectedProject.value.slug)
    : null,
)

// Compact project state handed to the Project Assistant as system context.
const projectContextText = computed(() => {
  const project = selectedProject.value
  const record = linkedProject.value
  if (!project || !record) return ''

  const lines: string[] = [
    `Project: ${record.title || project.slug} (${project.kind}, ${project.progress}% complete)`,
  ]
  if (record.goal) lines.push(`Goal (100% looks like): ${record.goal}`)
  if (record.pitch) lines.push(`Pitch: ${record.pitch}`)
  if (record.description) lines.push(`Description: ${record.description}`)
  if (project.milestones.length)
    lines.push(
      `Milestones: ${project.milestones
        .map((milestone) => `${milestone.title} (${milestone.status})`)
        .join('; ')}`,
    )
  if (project.notesFromSilas)
    lines.push(`Notes from Silas: ${project.notesFromSilas}`)

  const summary = taskStatusSummary(project)
    .map(([status, count]) => `${count} ${status}`)
    .join(', ')
  if (summary) lines.push(`Tasks: ${summary}`)

  const needsHuman = project.tasks
    .filter((task) => task.status === 'needs-human')
    .map((task) => `- ${task.id}: ${task.title}`)
  if (needsHuman.length)
    lines.push(`Waiting on a human decision:\n${needsHuman.join('\n')}`)

  return lines.join('\n')
})

// Banner art failure flags — reset whenever the selected project changes so a
// missing image for one project doesn't blank the banner for the next.
const heroFailed = ref(false)
const iconFailed = ref(false)

watch(
  () => selectedProject.value?.slug,
  () => {
    heroFailed.value = false
    iconFailed.value = false
  },
)

const fetchedLabel = computed(() => {
  if (!conductorStore.fetchedAt) return ''
  return new Date(conductorStore.fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const workspaceCards = computed<BuilderCard[]>(() => {
  if (!conductorStore.hasLoaded) return []
  function makeCard(
    key: string,
    label: string,
    icon: string,
    deckImage?: string,
  ): BuilderCard {
    return {
      key,
      label,
      title: label,
      icon,
      tagline: '',
      narrative: '',
      restoresFields: [],
      steps: [],
      deckImage,
      payload: {},
    }
  }
  const result: BuilderCard[] = [
    makeCard(
      'overview',
      'Overview',
      'kind-icon:gearhammer',
      '/images/projects/overview-card.webp',
    ),
    makeCard(
      'tasks',
      todoStore.openTodos.length
        ? `Tasks (${todoStore.openTodos.length})`
        : 'Tasks',
      'kind-icon:check',
      '/images/projects/tasks-card.webp',
    ),
  ]
  if (hasBrainstormContent.value) {
    result.push(
      makeCard(
        'brainstorm',
        `Brainstorm (${pendingPitches.value.length + brainstormProjects.value.length})`,
        'kind-icon:sparkles',
        '/images/projects/brainstorm-card.webp',
      ),
    )
  }
  sortedActiveProjects.value.forEach((project) => {
    const record = projectRecordForSlug(project.slug)
    result.push(
      makeCard(
        project.slug,
        record?.title || project.name || project.slug,
        kindIcon(project.kind),
        record?.cardPath ?? undefined,
      ),
    )
  })
  return result
})

async function setPriority(priority: ProjectPriorityLevel) {
  if (!linkedProject.value) return
  await patchProject({ priority })
}

async function autosave(field: keyof ProjectPatch, event: FocusEvent) {
  if (!linkedProject.value) return
  const el = event.target as HTMLInputElement | HTMLTextAreaElement | null
  if (!el) return
  const value = el.value.trim() || null
  const current = (linkedProject.value[
    field as keyof typeof linkedProject.value
  ] ?? null) as string | null
  if (value === current) return
  await patchProject({ [field]: value })
}

function showSaveMessage(msg: string, isError = false) {
  projectSaveMessage.value = msg
  projectSaveError.value = isError
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  saveMessageTimer = setTimeout(() => {
    projectSaveMessage.value = ''
  }, 3000)
}

watch(viewMode, async (mode) => {
  if (mode === 'tasks' && !todoStore.hasLoaded) await todoStore.fetchTodos(true)
})

watch(taskTab, (tab) => {
  newTodoCategory.value = tab === 'SERENDIPITY' ? 'AGENT' : tab
})

watch(
  workspaceCards,
  (cards) => {
    if (cards.length) {
      pageStore.setCards(cards)
      if (!pageStore.workspaceCardKey) pageStore.setWorkspaceCardKey('overview')
    }
  },
  { immediate: true },
)

watch(
  () => userStore.isAdmin,
  async (isAdmin) => {
    if (isAdmin) await refreshWorkspace()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  pageStore.clearCards()
})

async function refreshWorkspace() {
  const projectOptions = userStore.isAdmin
    ? { includeInactive: true, includeMature: true }
    : {}
  const work: Promise<unknown>[] = [
    projectStore.fetchProjects(projectOptions, true),
  ]
  if (userStore.isAdmin) work.push(conductorStore.fetchProjects(true))
  if (todoStore.hasLoaded) work.push(todoStore.fetchTodos(true))
  await Promise.all(work)
}

async function syncMissingProjects() {
  if (!missingProjectSlugs.value.length) return
  syncingMissing.value = true
  syncMessage.value = ''
  syncError.value = false
  try {
    const count = missingProjectSlugs.value.length
    for (const slug of missingProjectSlugs.value) {
      const project = conductorStore.projects.find(
        (entry) => entry.slug === slug,
      )
      const placement = getProjectPlacement(slug)
      await projectStore.createProject({
        title: project?.name || slug,
        slug,
        conductorSlug: slug,
        imagePath: `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`,
        cardPath: `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`,
        heroPath: `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`,
        // Seed navigation placement from the canonical map when we know it.
        ...(placement
          ? {
              channelKey: placement.channelKey,
              tabKey: placement.tabKey,
              liveUrl: placementLiveUrl(placement),
            }
          : {}),
        isPublic: true,
        isMature: false,
        isActive: true,
        status: 'ACTIVE',
      })
    }
    syncMessage.value = `Synced ${count} project(s)`
    setTimeout(() => {
      syncMessage.value = ''
    }, 4000)
  } catch {
    syncError.value = true
    syncMessage.value = 'Sync failed'
  } finally {
    syncingMissing.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('conductor-gallery-mode')
  if (saved && IS_GALLERY_MODE(saved)) projectGalleryMode.value = saved
  if (!projectStore.loaded) projectStore.fetchProjects()
})

watch(projectGalleryMode, (mode) => {
  localStorage.setItem('conductor-gallery-mode', mode)
})

function goToOverview() {
  pageStore.setWorkspaceCardKey('overview')
}

async function submitNewTodo() {
  const title = newTodoTitle.value.trim()
  if (!title) return
  const created = await todoStore.createTodo({
    title,
    priority: newTodoPriority.value,
    category: newTodoCategory.value,
    description: newTodoDescription.value.trim() || null,
  })
  if (!created) return
  newTodoTitle.value = ''
  newTodoDescription.value = ''
  newTodoPriority.value = 'NORMAL'
  newTodoCategory.value =
    taskTab.value === 'SERENDIPITY' ? 'AGENT' : taskTab.value
  todoFilter.value = 'OPEN'
}

async function patchProject(patch: ProjectPatch) {
  if (!linkedProject.value) return
  projectSaving.value = true
  projectSaveMessage.value = ''
  projectSaveError.value = false
  try {
    await projectStore.updateProject(linkedProject.value.id, patch)
    showSaveMessage('Saved')
  } catch (error) {
    showSaveMessage(
      error instanceof Error ? error.message : 'Save failed',
      true,
    )
  } finally {
    projectSaving.value = false
  }
}

function handleProjectStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  patchProject({ status: target.value as ProjectStatus })
}

function handlePriorityChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  setPriority(target.value as ProjectPriorityLevel)
}

const statusOrder = [
  'done',
  'review',
  'claimed',
  'ready',
  'waiting',
  'blocked',
  'needs-human',
]

function taskStatusSummary(project: ConductorProject): [string, number][] {
  const counts: Record<string, number> = {}
  for (const task of project.tasks)
    counts[task.status] = (counts[task.status] ?? 0) + 1
  return Object.entries(counts).sort(([a], [b]) => {
    const ai = statusOrder.indexOf(a),
      bi = statusOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

// Completed tasks default to a collapsed "Completed (N)" disclosure grouped
// per milestone (TASK-SURFACE-SPEC.md section 7); everything else stays flat.
const activeTasks = computed(
  () => selectedProject.value?.tasks.filter((t) => t.status !== 'done') ?? [],
)

const doneTasksByMilestone = computed(() => {
  const project = selectedProject.value
  if (!project) return []

  const doneByMilestone = new Map<string, ConductorTask[]>()
  for (const task of project.tasks) {
    if (task.status !== 'done') continue
    const key = task.milestone || ''
    const bucket = doneByMilestone.get(key)
    if (bucket) bucket.push(task)
    else doneByMilestone.set(key, [task])
  }

  const groups: { id: string; title: string; tasks: ConductorTask[] }[] = []
  for (const milestone of project.milestones) {
    const tasks = doneByMilestone.get(milestone.id)
    if (tasks?.length)
      groups.push({ id: milestone.id, title: milestone.title, tasks })
    doneByMilestone.delete(milestone.id)
  }
  for (const [key, tasks] of doneByMilestone) {
    if (tasks.length) groups.push({ id: key || 'other', title: 'Other', tasks })
  }
  return groups
})

// Per-milestone "N/M done" counts (t-018), a side effect of the same
// done/active split doneTasksByMilestone and activeTasks already compute.
const milestoneTaskCounts = computed(() => {
  const counts = new Map<string, { done: number; total: number }>()
  const project = selectedProject.value
  if (!project) return counts
  for (const task of project.tasks) {
    const key = task.milestone || ''
    const entry = counts.get(key) ?? { done: 0, total: 0 }
    entry.total += 1
    if (task.status === 'done') entry.done += 1
    counts.set(key, entry)
  }
  return counts
})

function prioritySelectClass(priority: ProjectPriorityLevel): string {
  if (priority === 'HIGH') return 'border-error/50 text-error'
  if (priority === 'LOW') return 'border-success/50 text-success'
  return 'border-warning/50 text-warning'
}

function kindIcon(kind: string) {
  if (kind === 'software') return 'kind-icon:code'
  if (kind === 'proposal') return 'kind-icon:sparkles'
  return 'kind-icon:document'
}
function kindIconClass(kind: string) {
  if (kind === 'software') return 'border-primary/40 bg-primary/10 text-primary'
  if (kind === 'proposal') return 'border-info/40 bg-info/10 text-info'
  return 'border-secondary/40 bg-secondary/10 text-secondary'
}
function kindBadgeClass(kind: string) {
  if (kind === 'software') return 'badge-primary'
  if (kind === 'proposal') return 'badge-info'
  return 'badge-secondary'
}
function kindBgGradient(kind: string) {
  if (kind === 'software')
    return 'bg-gradient-to-br from-primary/30 to-primary/10'
  if (kind === 'proposal') return 'bg-gradient-to-br from-info/30 to-info/10'
  return 'bg-gradient-to-br from-secondary/30 to-secondary/10'
}

function taskBadgeClass(status: string) {
  const map: Record<string, string> = {
    done: 'badge-success',
    review: 'badge-secondary',
    claimed: 'badge-warning',
    ready: 'badge-info',
    waiting: 'badge-ghost',
    blocked: 'badge-error',
    'needs-human': 'badge-accent',
  }
  return map[status] ?? 'badge-ghost'
}
function stakesBadgeClass(stakes: string): string {
  if (stakes === 'irreversible') return 'badge-error'
  if (stakes === 'outward-facing') return 'badge-warning'
  if (stakes === 'needs-human') return 'badge-accent'
  return 'badge-ghost'
}
function relativeTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.round(ms / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.round(d / 30)
  return `${mo}mo ago`
}
function taskIcon(status: string) {
  const map: Record<string, string> = {
    done: 'kind-icon:check',
    review: 'kind-icon:eye',
    claimed: 'kind-icon:hammer',
    ready: 'kind-icon:arrow-right',
    waiting: 'kind-icon:clock',
    blocked: 'kind-icon:warning',
    'needs-human': 'kind-icon:user',
  }
  return map[status] ?? 'kind-icon:sparkles'
}
function taskIconClass(status: string) {
  const map: Record<string, string> = {
    done: 'border-success/40 bg-success/10 text-success',
    review: 'border-secondary/40 bg-secondary/10 text-secondary',
    claimed: 'border-warning/40 bg-warning/10 text-warning',
    ready: 'border-info/40 bg-info/10 text-info',
    waiting: 'border-base-300 bg-base-200 text-base-content/40',
    blocked: 'border-error/40 bg-error/10 text-error',
    'needs-human': 'border-accent/40 bg-accent/10 text-accent',
  }
  return map[status] ?? 'border-base-300 bg-base-200 text-base-content/40'
}
function milestoneIcon(status: string) {
  if (status === 'done') return 'kind-icon:check'
  if (status === 'in-progress') return 'kind-icon:hammer'
  return 'kind-icon:clock'
}
function milestoneIconClass(status: string) {
  if (status === 'done') return 'border-success/40 bg-success/10 text-success'
  if (status === 'in-progress')
    return 'border-warning/40 bg-warning/10 text-warning'
  return 'border-base-300 bg-base-200 text-base-content/40'
}
function milestoneBadgeClass(status: string) {
  if (status === 'done') return 'badge-success'
  if (status === 'in-progress') return 'badge-warning'
  return 'badge-ghost'
}

// Project-scoped task creation (t-002)
const projectTaskTitle = ref('')
const projectTaskDescription = ref('')
const projectTaskCategory = ref<TodoCategory>('AGENT')
const projectTaskPriority = ref<ProjectPriorityLevel>('NORMAL')
const projectTaskSubmitting = ref(false)

// Kaizen / polish prompt (t-004, t-006)
const polishPrompt = ref('')
const polishSubmitting = ref(false)
const polishMessage = ref('')

// Desired features (t-007)
const newFeatureTitle = ref('')
const newFeatureSubmitting = ref(false)

const projectKaizens = computed(() => {
  if (!linkedProject.value) return []
  return todoStore.openTodos.filter(
    (todo) =>
      todo.projectId === linkedProject.value?.id && todo.category === 'KAIZEN',
  )
})

const projectFeatures = computed(() => {
  if (!linkedProject.value) return []
  return [
    ...todoStore.todos.filter(
      (todo) =>
        todo.projectId === linkedProject.value?.id &&
        todo.category === 'DESIRED_FEATURE',
    ),
  ].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999))
})

watch(
  linkedProject,
  async (project) => {
    if (project?.id) await todoStore.fetchProjectTodos(project.id)
  },
  { immediate: true },
)

async function submitProjectTask() {
  if (!linkedProject.value || !projectTaskTitle.value.trim()) return
  projectTaskSubmitting.value = true
  try {
    await todoStore.createTodo({
      title: projectTaskTitle.value.trim(),
      description: projectTaskDescription.value.trim() || null,
      category: projectTaskCategory.value,
      priority: projectTaskPriority.value,
      projectId: linkedProject.value.id,
    })
    projectTaskTitle.value = ''
    projectTaskDescription.value = ''
    projectTaskCategory.value = 'AGENT'
    projectTaskPriority.value = 'NORMAL'
  } finally {
    projectTaskSubmitting.value = false
  }
}

async function submitPolishPrompt() {
  if (!linkedProject.value || !polishPrompt.value.trim()) return
  polishSubmitting.value = true
  polishMessage.value = ''
  try {
    await todoStore.createTodo({
      title: polishPrompt.value.trim(),
      category: 'KAIZEN',
      priority: 'NORMAL',
      projectId: linkedProject.value.id,
    })
    polishPrompt.value = ''
    polishMessage.value = 'Kaizen logged!'
    setTimeout(() => {
      polishMessage.value = ''
    }, 3000)
  } finally {
    polishSubmitting.value = false
  }
}

async function addDesiredFeature() {
  if (!linkedProject.value || !newFeatureTitle.value.trim()) return
  newFeatureSubmitting.value = true
  try {
    await todoStore.createTodo({
      title: newFeatureTitle.value.trim(),
      category: 'DESIRED_FEATURE',
      priority: 'NORMAL',
      projectId: linkedProject.value.id,
      order: projectFeatures.value.length,
    })
    newFeatureTitle.value = ''
    await todoStore.fetchProjectTodos(linkedProject.value.id)
  } finally {
    newFeatureSubmitting.value = false
  }
}

async function promoteFeatureToTask(featureId: number) {
  await todoStore.updateTodo(featureId, { category: 'AGENT' })
}

async function retireFeature(featureId: number) {
  await todoStore.updateTodo(featureId, { status: 'ARCHIVED' })
}

async function moveFeatureUp(index: number) {
  const features = projectFeatures.value
  if (index === 0) return
  await Promise.all([
    todoStore.updateTodo(features[index]!.id, { order: index - 1 }),
    todoStore.updateTodo(features[index - 1]!.id, { order: index }),
  ])
  if (linkedProject.value)
    await todoStore.fetchProjectTodos(linkedProject.value.id)
}

async function moveFeatureDown(index: number) {
  const features = projectFeatures.value
  if (index >= features.length - 1) return
  await Promise.all([
    todoStore.updateTodo(features[index]!.id, { order: index + 1 }),
    todoStore.updateTodo(features[index + 1]!.id, { order: index }),
  ])
  if (linkedProject.value)
    await todoStore.fetchProjectTodos(linkedProject.value.id)
}
</script>
