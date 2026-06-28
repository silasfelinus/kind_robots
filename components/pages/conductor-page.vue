<!-- /components/pages/conductor-page.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <div v-if="!userStore.isAdmin" class="flex flex-col gap-6">
      <header v-if="showHeader" class="flex shrink-0 items-center gap-2">
        <Icon name="kind-icon:gearhammer" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">Projects</h2>
        <div class="ml-auto flex items-center gap-1">
          <button
            v-for="mode in galleryModeOptions"
            :key="mode.value"
            type="button"
            class="btn btn-xs rounded-xl"
            :class="projectGalleryMode === mode.value ? 'btn-primary' : 'btn-ghost'"
            @click="projectGalleryMode = mode.value"
          >{{ mode.label }}</button>
        </div>
      </header>
      <div v-if="!dreamStore.hasLoaded" class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <div v-for="n in 4" :key="n" class="h-20 animate-pulse rounded-2xl border border-base-300 bg-base-200" />
      </div>
      <template v-else>
        <div v-if="projectGalleryMode === 'icons'" class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div
            v-for="dream in dreamStore.publicProjectDreams"
            :key="dream.id"
            class="group flex flex-col items-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 text-center transition-all hover:border-primary/40 hover:shadow-md"
          >
            <img :src="projectIconPath(dream.slug)" :alt="dream.title" class="size-12 rounded-xl border border-base-300 object-cover" />
            <p class="w-full truncate text-xs font-semibold">{{ dream.title }}</p>
          </div>
        </div>
        <div v-else-if="projectGalleryMode === 'list'" class="flex flex-col gap-2">
          <div
            v-for="dream in dreamStore.publicProjectDreams"
            :key="dream.id"
            class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <img :src="projectIconPath(dream.slug)" :alt="dream.title" class="size-9 shrink-0 rounded-xl border border-base-300 object-cover" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-bold">{{ dream.title }}</p>
              <p class="truncate text-xs text-base-content/50">{{ dream.flavorText }}</p>
            </div>
            <span v-if="dream.projectStatus" class="badge badge-xs shrink-0 opacity-60">{{ dream.projectStatus }}</span>
          </div>
        </div>
        <div v-else-if="projectGalleryMode === 'heroes'" class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="dream in dreamStore.publicProjectDreams"
            :key="dream.id"
            class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition-all hover:border-primary/40 hover:shadow-lg"
            style="aspect-ratio: 16/9"
          >
            <img :src="projectHeroPath(dream.slug)" :alt="dream.title" class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-12">
              <p class="truncate text-sm font-bold">{{ dream.title }}</p>
              <p class="text-xs text-base-content/60">{{ dream.flavorText }}</p>
            </div>
          </div>
        </div>
        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="dream in dreamStore.publicProjectDreams"
            :key="dream.id"
            class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition-all hover:border-primary/40 hover:shadow-lg"
            style="aspect-ratio: 2/3"
          >
            <img :src="projectCardPath(dream.slug)" :alt="dream.title" class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-8">
              <div class="flex items-center gap-2">
                <img :src="projectIconPath(dream.slug)" alt="" class="size-7 shrink-0 rounded-lg border border-white/20 object-cover" />
                <p class="min-w-0 truncate text-sm font-bold leading-tight">{{ dream.title }}</p>
              </div>
              <p class="mt-1 text-xs text-base-content/60">{{ dream.flavorText }}</p>
            </div>
          </div>
        </div>
        <p v-if="!dreamStore.publicProjectDreams.length" class="py-8 text-center text-sm text-base-content/50">No public projects yet.</p>
      </template>
    </div>

    <template v-else>
      <header v-if="showHeader" class="flex shrink-0 items-center gap-2">
        <Icon name="kind-icon:gearhammer" class="size-5 text-primary" />
        <h2 class="text-lg font-semibold">Conductor Workspace</h2>
        <span class="badge badge-primary badge-sm ml-1">ADMIN</span>
        <div class="ml-auto flex items-center gap-2">
          <span v-if="conductorStore.fetchedAt" class="text-xs text-base-content/50"
            >Updated {{ fetchedLabel }}</span
          >
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="pending"
            @click="refreshWorkspace"
          >
            <span v-if="pending" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="size-4" />
            Refresh
          </button>
        </div>
      </header>

      <div
        v-if="error"
        class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
      >
        <Icon name="kind-icon:warning" class="mr-1 inline size-4" />
        {{ error.message }}
      </div>

      <div
        v-if="pending && !conductorStore.hasLoaded"
        class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="h-20 animate-pulse rounded-2xl border border-base-300 bg-base-200"
        />
      </div>

      <div v-if="conductorStore.hasLoaded" class="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <!-- OVERVIEW -->
        <div v-if="viewMode === 'overview'" class="flex flex-col gap-6 pb-4">
          <div class="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            <div
              class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <p class="text-2xl font-black text-primary">
                {{ activeProjects.length }}
              </p>
              <p class="text-xs font-semibold text-base-content/60">
                Active Projects
              </p>
            </div>
            <div
              class="rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <p class="text-2xl font-black text-success">{{ totalDone }}</p>
              <p class="text-xs font-semibold text-base-content/60">
                Tasks Done
              </p>
            </div>
            <button
              type="button"
              class="rounded-2xl border px-4 py-3 text-left transition-colors"
              :class="
                todoStore.openTodos.length
                  ? 'cursor-pointer border-primary/40 bg-primary/5 hover:border-primary/60'
                  : 'border-base-300 bg-base-200'
              "
              @click="goTo('tasks')"
            >
              <p class="text-2xl font-black text-primary">
                {{ todoStore.openTodos.length }}
              </p>
              <p class="text-xs font-semibold text-base-content/60">
                Open Tasks
                <Icon
                  v-if="todoStore.openTodos.length"
                  name="kind-icon:chevron-right"
                  class="ml-0.5 inline size-3"
                />
              </p>
            </button>
            <button
              type="button"
              class="rounded-2xl border px-4 py-3 text-left transition-colors"
              :class="
                hasBrainstormContent
                  ? 'cursor-pointer border-secondary/60 bg-secondary/10 hover:border-secondary'
                  : 'border-base-300 bg-base-200'
              "
              :disabled="!hasBrainstormContent"
              @click="goTo('brainstorm')"
            >
              <p class="text-2xl font-black text-secondary">
                {{ pendingPitches.length + brainstormProjects.length }}
              </p>
              <p class="text-xs font-semibold text-base-content/60">
                Brainstorm
                <Icon
                  v-if="hasBrainstormContent"
                  name="kind-icon:chevron-right"
                  class="ml-0.5 inline size-3"
                />
              </p>
            </button>
          </div>

          <div v-if="activeProjects.length" class="space-y-3">
            <div class="flex items-center gap-2">
              <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">
                Active Projects
              </h3>
              <div class="ml-auto flex items-center gap-1">
                <button
                  v-for="mode in galleryModeOptions"
                  :key="mode.value"
                  type="button"
                  class="btn btn-xs rounded-xl"
                  :class="projectGalleryMode === mode.value ? 'btn-primary' : 'btn-ghost'"
                  @click="projectGalleryMode = mode.value"
                >{{ mode.label }}</button>
              </div>
            </div>

            <!-- Cards -->
            <div v-if="projectGalleryMode === 'cards'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="project in sortedActiveProjects"
                :key="project.slug"
                type="button"
                class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition-all hover:border-primary/50 hover:shadow-lg"
                style="aspect-ratio: 2/3"
                @click="selectProject(project.slug)"
              >
                <img
                  :src="projectCardPath(project.slug)"
                  :alt="project.name"
                  class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div class="absolute left-2 top-2">
                  <span
                    class="badge badge-sm font-bold"
                    :class="priorityBadgeClass(getProjectPriority(projectDreamForSlug(project.slug)?.id))"
                  >{{ getProjectPriority(projectDreamForSlug(project.slug)?.id) }}</span>
                </div>
                <div v-if="blockedCount(project) > 0 || needsHumanCount(project) > 0" class="absolute right-2 top-2">
                  <span v-if="blockedCount(project) > 0" class="badge badge-error badge-sm">{{ blockedCount(project) }} blocked</span>
                  <span v-else class="badge badge-accent badge-sm">{{ needsHumanCount(project) }} need you</span>
                </div>
                <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-8">
                  <div class="flex items-center gap-2">
                    <img :src="projectIconPath(project.slug)" alt="" class="size-7 shrink-0 rounded-lg border border-white/20 object-cover" />
                    <p class="min-w-0 truncate text-sm font-bold leading-tight">{{ project.name || project.slug }}</p>
                  </div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-base-content/20">
                    <div class="h-full rounded-full transition-all" :class="kindProgressClass(project.kind)" :style="{ width: `${project.progress}%` }" />
                  </div>
                  <p class="mt-1 text-right text-xs font-semibold text-base-content/60">{{ project.progress }}%</p>
                </div>
              </button>
            </div>

            <!-- Heroes -->
            <div v-else-if="projectGalleryMode === 'heroes'" class="grid gap-4 sm:grid-cols-2">
              <button
                v-for="project in sortedActiveProjects"
                :key="project.slug"
                type="button"
                class="group relative overflow-hidden rounded-2xl border border-base-300 bg-base-200 text-left transition-all hover:border-primary/50 hover:shadow-lg"
                style="aspect-ratio: 16/9"
                @click="selectProject(project.slug)"
              >
                <img :src="projectHeroPath(project.slug)" :alt="project.name" class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div v-if="blockedCount(project) > 0 || needsHumanCount(project) > 0" class="absolute right-2 top-2">
                  <span v-if="blockedCount(project) > 0" class="badge badge-error badge-sm">{{ blockedCount(project) }} blocked</span>
                  <span v-else class="badge badge-accent badge-sm">{{ needsHumanCount(project) }} need you</span>
                </div>
                <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-8">
                  <div class="flex items-center gap-2">
                    <img :src="projectIconPath(project.slug)" alt="" class="size-7 shrink-0 rounded-lg border border-white/20 object-cover" />
                    <p class="min-w-0 truncate text-sm font-bold leading-tight">{{ project.name || project.slug }}</p>
                  </div>
                  <div class="mt-1 h-1 overflow-hidden rounded-full bg-base-content/20">
                    <div class="h-full rounded-full transition-all" :class="kindProgressClass(project.kind)" :style="{ width: `${project.progress}%` }" />
                  </div>
                </div>
              </button>
            </div>

            <!-- Icons -->
            <div v-else-if="projectGalleryMode === 'icons'" class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <button
                v-for="project in sortedActiveProjects"
                :key="project.slug"
                type="button"
                class="group flex flex-col items-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-3 text-center transition-all hover:border-primary/40 hover:shadow-md"
                @click="selectProject(project.slug)"
              >
                <img :src="projectIconPath(project.slug)" :alt="project.name" class="size-12 rounded-xl border border-base-300 object-cover" />
                <p class="w-full truncate text-xs font-semibold">{{ project.name || project.slug }}</p>
              </button>
            </div>

            <!-- List -->
            <div v-else class="flex flex-col gap-2">
              <button
                v-for="project in sortedActiveProjects"
                :key="project.slug"
                type="button"
                class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-4 py-3 text-left transition-all hover:border-primary/40"
                @click="selectProject(project.slug)"
              >
                <img :src="projectIconPath(project.slug)" :alt="project.name" class="size-9 shrink-0 rounded-xl object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-bold">{{ project.name || project.slug }}</p>
                  <p class="text-xs text-base-content/50">{{ projectDreamForSlug(project.slug)?.flavorText }}</p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1">
                  <span class="badge badge-xs" :class="priorityBadgeClass(getProjectPriority(projectDreamForSlug(project.slug)?.id))">{{ getProjectPriority(projectDreamForSlug(project.slug)?.id) }}</span>
                  <span v-if="blockedCount(project) > 0" class="badge badge-error badge-xs">{{ blockedCount(project) }} blocked</span>
                  <span v-else-if="needsHumanCount(project) > 0" class="badge badge-accent badge-xs">{{ needsHumanCount(project) }} need you</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Missing from DB -->
          <div v-if="missingProjectSlugs.length" class="space-y-2">
            <div class="flex items-center gap-2">
              <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/50">Not in DB</h3>
              <span class="badge badge-warning badge-xs">{{ missingProjectSlugs.length }}</span>
              <div class="ml-auto flex items-center gap-2">
                <span v-if="syncMessage" class="text-xs" :class="syncError ? 'text-error' : 'text-success'">{{ syncMessage }}</span>
                <button
                  type="button"
                  class="btn btn-warning btn-xs rounded-xl"
                  :disabled="syncingMissing"
                  @click="syncMissingProjects"
                >
                  <span v-if="syncingMissing" class="loading loading-spinner loading-xs" />
                  Sync to DB
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-for="slug in missingProjectSlugs" :key="slug" class="badge badge-outline badge-sm">{{ slug }}</span>
            </div>
          </div>
        </div>

        <!-- TASKS -->
        <div v-else-if="viewMode === 'tasks'" class="flex flex-col gap-4 pb-4">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              @click="goToOverview"
            >
              <Icon name="kind-icon:chevron-left" class="size-4" /> Overview
            </button>
            <h3 class="text-sm font-bold">Tasks</h3>
            <span
              v-if="todoStore.openTodos.length"
              class="badge badge-primary badge-sm"
              >{{ todoStore.openTodos.length }} open</span
            >
            <span
              v-if="todoStore.loading"
              class="loading loading-spinner loading-xs ml-auto text-primary"
            />
          </div>
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
              placeholder="Context for the agent — project name, specific instructions, relevant files..."
              class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
              rows="3"
              :disabled="todoStore.loading"
            />
            <div class="flex items-center gap-2">
              <select
                v-model="newTodoPriority"
                class="select select-bordered select-sm rounded-xl"
              >
                <option value="HIGH">🔴 High priority</option>
                <option value="NORMAL">🟡 Normal priority</option>
                <option value="LOW">🟢 Low priority</option>
              </select>
              <button
                type="submit"
                class="btn btn-primary btn-sm ml-auto rounded-xl"
                :disabled="!newTodoTitle.trim() || todoStore.loading"
              >
                <Icon name="kind-icon:plus" class="size-4" /> Add Task
              </button>
            </div>
          </form>
          <div role="tablist" class="tabs tabs-boxed w-fit">
            <button
              v-for="f in todoFilterOptions"
              :key="f"
              type="button"
              role="tab"
              class="tab text-xs"
              :class="todoFilter === f ? 'tab-active' : ''"
              @click="todoFilter = f"
            >
              {{ f.charAt(0) + f.slice(1).toLowerCase() }}
              <span
                v-if="f === 'OPEN' && todoStore.openTodos.length"
                class="ml-1 badge badge-xs badge-primary"
                >{{ todoStore.openTodos.length }}</span
              >
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-if="todoStore.loading && !filteredTodos.length"
              v-for="n in 3"
              :key="n"
              class="h-16 animate-pulse rounded-2xl border border-base-300 bg-base-200"
            />
            <div
              v-for="todo in filteredTodos"
              :key="todo.id"
              class="flex flex-col gap-1 rounded-2xl border border-base-300 bg-base-100 px-4 py-3 transition-colors"
              :class="todo.status === 'DONE' ? 'opacity-60' : ''"
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
            <p
              v-if="!todoStore.loading && !filteredTodos.length"
              class="py-6 text-center text-sm text-base-content/50"
            >
              No {{ todoFilter.toLowerCase() }} tasks.
            </p>
          </div>
        </div>

        <!-- BRAINSTORM -->
        <div
          v-else-if="viewMode === 'brainstorm'"
          class="flex flex-col gap-4 pb-4"
        >
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm rounded-xl"
              @click="goToOverview"
            >
              <Icon name="kind-icon:chevron-left" class="size-4" /> Overview
            </button>
            <h3 class="text-sm font-bold">Brainstorm</h3>
          </div>
          <div v-if="brainstormProjects.length" class="space-y-2">
            <h4
              class="text-xs font-bold uppercase tracking-wide text-base-content/50"
            >
              Future Project Ideas
            </h4>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="project in brainstormProjects"
                :key="project.slug"
                type="button"
                class="group relative overflow-hidden rounded-2xl border border-secondary/30 bg-secondary/5 text-left transition-all hover:border-secondary/60 hover:shadow-lg"
                style="aspect-ratio: 2/3"
                @click="selectProject(project.slug)"
              >
                <img
                  :src="projectCardPath(project.slug)"
                  :alt="project.name"
                  class="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-300/95 via-base-300/60 to-transparent p-3 pt-8"
                >
                  <p class="truncate text-sm font-bold">
                    {{ project.name || project.slug }}
                  </p>
                  <p class="text-xs text-base-content/50">
                    {{
                      projectDreamForSlug(project.slug)?.flavorText ??
                      'Future project'
                    }}
                  </p>
                  <span class="badge badge-secondary badge-xs mt-1"
                    >brainstorm</span
                  >
                </div>
              </button>
            </div>
          </div>
          <div v-if="allPitches.length" class="space-y-2">
            <h4
              class="text-xs font-bold uppercase tracking-wide text-base-content/50"
            >
              Pitches Awaiting Vote
              <span
                v-if="pendingPitches.length"
                class="ml-1 badge badge-warning badge-xs"
                >{{ pendingPitches.length }} pending</span
              >
            </h4>
            <div class="grid gap-4 sm:grid-cols-2">
              <article
                v-for="pitch in allPitches"
                :key="pitch.slug"
                class="flex flex-col gap-3 rounded-2xl border p-4 transition-shadow"
                :class="pitchArticleClass(pitch.slug)"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-bold leading-tight">{{ pitch.title }}</h4>
                  <span
                    class="badge badge-sm shrink-0"
                    :class="
                      pitchVotedChoice(pitch.slug)
                        ? 'badge-ghost'
                        : 'badge-warning'
                    "
                    >{{ pitchVotedChoice(pitch.slug) ?? 'vote' }}</span
                  >
                </div>
                <p
                  v-if="pitch.projectTarget"
                  class="text-xs text-base-content/50"
                >
                  <Icon
                    name="kind-icon:folder"
                    class="mr-0.5 inline size-3"
                  />{{ pitch.projectTarget
                  }}<span v-if="pitch.date" class="ml-2"
                    >&middot; {{ pitch.date }}</span
                  >
                </p>
                <div
                  v-if="editingPitchSlug === pitch.slug"
                  class="flex flex-col gap-2"
                >
                  <textarea
                    v-model="pitchEditTexts[pitch.slug]"
                    class="textarea textarea-bordered rounded-xl text-sm"
                    rows="4"
                  />
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs rounded-xl"
                      @click="editingPitchSlug = ''"
                    >
                      Cancel</button
                    ><button
                      type="button"
                      class="btn btn-primary btn-xs rounded-xl"
                      @click="editingPitchSlug = ''"
                    >
                      Done
                    </button>
                  </div>
                </div>
                <div v-else class="group/idea relative">
                  <p class="text-sm text-base-content/75">
                    {{ pitchEditTexts[pitch.slug] ?? pitch.idea }}
                  </p>
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs absolute right-0 top-0 rounded-lg opacity-0 transition-opacity group-hover/idea:opacity-100"
                    @click="startEditPitch(pitch)"
                  >
                    <Icon name="kind-icon:edit" class="size-3" />
                  </button>
                </div>
                <p
                  v-if="pitch.whyDoIt"
                  class="text-xs italic text-base-content/50"
                >
                  {{ pitch.whyDoIt }}
                </p>
                <div
                  v-if="!pitchVotedChoice(pitch.slug)"
                  class="flex gap-2 pt-1"
                >
                  <button
                    type="button"
                    class="btn btn-success btn-sm flex-1 gap-1 rounded-xl"
                    @click="voteOnPitch(pitch.slug, 'approved')"
                  >
                    <Icon name="kind-icon:check" class="size-3.5" /> Approve
                  </button>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm flex-1 gap-1 rounded-xl border border-base-300"
                    @click="voteOnPitch(pitch.slug, 'passed')"
                  >
                    <Icon name="kind-icon:x" class="size-3.5" /> Pass
                  </button>
                </div>
                <div v-else class="flex items-center justify-between pt-1">
                  <span
                    class="text-xs font-semibold"
                    :class="
                      pitchVotedChoice(pitch.slug) === 'approved'
                        ? 'text-success'
                        : 'text-base-content/40'
                    "
                    ><Icon
                      :name="
                        pitchVotedChoice(pitch.slug) === 'approved'
                          ? 'kind-icon:check'
                          : 'kind-icon:x'
                      "
                      class="mr-1 inline size-3"
                    />{{
                      pitchVotedChoice(pitch.slug) === 'approved'
                        ? 'Approved'
                        : 'Passed'
                    }}</span
                  >
                  <button
                    type="button"
                    class="btn btn-ghost btn-xs rounded-xl"
                    @click="clearVote(pitch.slug)"
                  >
                    Undo
                  </button>
                </div>
              </article>
            </div>
          </div>
          <p
            v-if="!allPitches.length && !brainstormProjects.length"
            class="py-8 text-center text-sm text-base-content/50"
          >
            Nothing in the brainstorm queue.
          </p>
        </div>

        <!-- PROJECT DETAIL -->
        <div v-else-if="selectedProject" class="flex flex-col gap-4 pb-4">
          <div
            class="relative overflow-hidden rounded-2xl"
            style="min-height: 180px"
          >
            <img
              v-if="linkedDream?.heroPath"
              :src="linkedDream.heroPath"
              :alt="selectedProject.name"
              class="absolute inset-0 h-full w-full object-cover"
            />
            <div
              v-else
              class="absolute inset-0"
              :class="kindBgGradient(selectedProject.kind)"
            />
            <div
              class="absolute inset-0 bg-linear-to-t from-base-300/90 via-base-300/30 to-transparent"
            />
            <button
              class="absolute left-3 top-3 btn btn-ghost btn-sm rounded-xl bg-base-300/60 backdrop-blur-sm"
              type="button"
              @click="goToOverview"
            >
              <Icon name="kind-icon:chevron-left" class="size-4" /> Back
            </button>
            <div class="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4">
              <div
                class="relative size-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white/20 shadow-xl"
              >
                <img
                  v-if="linkedDream?.imagePath"
                  :src="linkedDream.imagePath"
                  :alt="selectedProject.name"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center"
                  :class="kindIconClass(selectedProject.kind)"
                >
                  <Icon :name="kindIcon(selectedProject.kind)" class="size-8" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-xl font-black leading-tight">
                  {{ selectedProject.name || selectedProject.slug }}
                </h3>
                <p class="text-xs text-base-content/60">
                  {{ selectedProject.progress }}% complete &middot;
                  {{ selectedProject.tasks.length }} tasks
                </p>
              </div>
              <span
                v-if="linkedDream?.projectStatus === 'BRAINSTORM'"
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
              ><Icon :name="taskIcon(status)" class="size-3" />{{ count }}
              {{ status }}</span
            >
          </div>

          <div
            v-if="linkedDream"
            class="flex shrink-0 flex-wrap items-center gap-2"
          >
            <select
              class="select select-bordered select-sm rounded-xl font-bold"
              :class="prioritySelectClass(getProjectPriority(linkedDream.id))"
              :value="getProjectPriority(linkedDream.id)"
              :disabled="dreamSaving"
              @change="handlePriorityChange"
            >
              <option value="HIGH">🔴 HIGH</option>
              <option value="NORMAL">🟡 NORMAL</option>
              <option value="LOW">🟢 LOW</option>
            </select>
            <select
              class="select select-bordered select-sm rounded-xl text-xs font-semibold"
              :value="linkedDream.projectStatus ?? 'ACTIVE'"
              :disabled="dreamSaving"
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
                linkedDream.isPublic
                  ? 'btn-success'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="dreamSaving"
              @click="patchDream({ isPublic: !linkedDream.isPublic })"
            >
              <Icon
                :name="
                  linkedDream.isPublic ? 'kind-icon:eye' : 'kind-icon:eye-off'
                "
                class="size-3.5"
              />{{ linkedDream.isPublic ? 'Public' : 'Private' }}
            </button>
            <button
              type="button"
              class="btn btn-sm gap-1.5 rounded-xl"
              :class="
                linkedDream.isMature
                  ? 'btn-warning'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="dreamSaving"
              @click="patchDream({ isMature: !linkedDream.isMature })"
            >
              <Icon name="kind-icon:warning" class="size-3.5" />{{
                linkedDream.isMature ? 'Mature' : 'Safe'
              }}
            </button>
            <button
              type="button"
              class="btn btn-sm gap-1.5 rounded-xl"
              :class="
                linkedDream.allowReviews
                  ? 'btn-accent'
                  : 'btn-ghost border border-base-300'
              "
              :disabled="dreamSaving"
              @click="patchDream({ allowReviews: !linkedDream.allowReviews })"
            >
              <Icon name="kind-icon:chat" class="size-3.5" />{{
                linkedDream.allowReviews ? 'Reviews On' : 'Reviews Off'
              }}
            </button>
            <span
              v-if="dreamSaving"
              class="loading loading-spinner loading-xs self-center text-primary"
            />
            <span
              v-if="dreamSaveMessage"
              class="self-center text-xs"
              :class="dreamSaveError ? 'text-error' : 'text-success'"
              >{{ dreamSaveMessage }}</span
            >
          </div>

          <div
            v-if="linkedDream"
            class="shrink-0 space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4"
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
                  >Description</span
                ></label
              >
              <textarea
                class="textarea textarea-bordered rounded-xl text-sm"
                rows="3"
                placeholder="What is this project?"
                :value="linkedDream.description ?? ''"
                :disabled="dreamSaving"
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
                class="textarea textarea-bordered rounded-xl text-sm"
                rows="2"
                placeholder="Core constraint or north star"
                :value="linkedDream.pitch ?? ''"
                :disabled="dreamSaving"
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
                :value="linkedDream.flavorText ?? ''"
                :disabled="dreamSaving"
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
                  :value="linkedDream.liveUrl ?? ''"
                  :disabled="dreamSaving"
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
                  :value="linkedDream.repoUrl ?? ''"
                  :disabled="dreamSaving"
                  @blur="autosave('repoUrl', $event)"
                />
              </div>
            </div>
            <div class="flex flex-wrap gap-2 pt-1">
              <a
                v-if="linkedDream.liveUrl"
                :href="linkedDream.liveUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
                ><Icon name="kind-icon:external-link" class="size-3" /> Live
                Site</a
              >
              <a
                v-if="linkedDream.repoUrl"
                :href="linkedDream.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-xs btn-outline gap-1"
                ><Icon name="kind-icon:code" class="size-3" /> Repo</a
              >
            </div>
          </div>

          <div
            v-else
            class="shrink-0 rounded-2xl border border-dashed border-base-300 bg-base-100/50 p-4 text-center text-xs text-base-content/40"
          >
            <Icon
              name="kind-icon:dream"
              class="mx-auto mb-1 size-5 opacity-40"
            />
            No dream linked for <strong>{{ selectedProject.slug }}</strong>
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
                  v-for="task in selectedProject.tasks"
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
                        <span v-if="task.owner">&middot; {{ task.owner }}</span>
                        <span v-if="task.passes > 0" class="text-warning"
                          >&middot; pass {{ task.passes }}/3</span
                        >
                      </div>
                    </div>
                    <span
                      class="badge badge-sm shrink-0"
                      :class="taskBadgeClass(task.status)"
                      >{{ task.status }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ConductorProject, ConductorPitch } from '@/server/api/conductor/projects.get'
import { useDreamStore } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'
import { usePageStore } from '@/stores/pageStore'
import { useTodoStore } from '@/stores/todoStore'
import { useConductorStore } from '@/stores/conductorStore'
import type { DreamPriority } from '@/stores/conductorStore'
import type { BuilderCard } from '@/stores/helpers/builderCards'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })

type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'DONE' | 'ARCHIVED' | 'BRAINSTORM'

type ProjectPatch = {
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  liveUrl?: string | null
  repoUrl?: string | null
  isPublic?: boolean
  isMature?: boolean
  allowReviews?: boolean
  projectStatus?: ProjectStatus
}

const userStore = useUserStore()
const dreamStore = useDreamStore()
const pageStore = usePageStore()
const todoStore = useTodoStore()
const conductorStore = useConductorStore()

const CONDUCTOR_IMG_BASE = 'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

type GalleryMode = 'cards' | 'heroes' | 'icons' | 'list'
const galleryModeOptions: { value: GalleryMode; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'heroes', label: 'Heroes' },
  { value: 'icons', label: 'Icons' },
  { value: 'list', label: 'List' },
]
const projectGalleryMode = ref<GalleryMode>('cards')

const syncingMissing = ref(false)
const syncMessage = ref('')
const syncError = ref(false)

const dreamSaving = ref(false)
const dreamSaveMessage = ref('')
const dreamSaveError = ref(false)

const editingPitchSlug = ref('')
const pitchEditTexts = ref<Record<string, string>>({})

const newTodoTitle = ref('')
const newTodoDescription = ref('')
const newTodoPriority = ref<DreamPriority>('NORMAL')
const todoFilter = ref<'OPEN' | 'DONE' | 'ARCHIVED'>('OPEN')
const todoFilterOptions = ['OPEN', 'DONE', 'ARCHIVED'] as const

let saveMessageTimer: ReturnType<typeof setTimeout> | null = null

const pending = computed(() => conductorStore.pending)
const error = computed(() => conductorStore.error ? { message: conductorStore.error } : null)

const projects = computed(() => conductorStore.projects)
const allPitches = computed(() => conductorStore.pitches)
const pendingPitches = computed(() => conductorStore.pendingPitches)

function projectDreamForSlug(slug: string) {
  return dreamStore.projectDreams.find((d) => d.slug === slug) ?? null
}

function projectCardPath(slug: string): string {
  return projectDreamForSlug(slug)?.cardPath ?? `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`
}
function projectHeroPath(slug: string): string {
  return projectDreamForSlug(slug)?.heroPath ?? `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`
}
function projectIconPath(slug: string): string {
  return projectDreamForSlug(slug)?.imagePath ?? `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`
}

const activeProjects = computed(() =>
  projects.value.filter(
    (p) => projectDreamForSlug(p.slug)?.projectStatus !== 'BRAINSTORM',
  ),
)

const sortedActiveProjects = computed(() =>
  [...activeProjects.value].sort((a, b) => {
    const order: Record<DreamPriority, number> = { HIGH: 0, NORMAL: 1, LOW: 2 }
    const pa = getProjectPriority(projectDreamForSlug(a.slug)?.id)
    const pb = getProjectPriority(projectDreamForSlug(b.slug)?.id)
    return (order[pa] ?? 1) - (order[pb] ?? 1)
  }),
)

const brainstormProjects = computed(() =>
  projects.value.filter(
    (p) => projectDreamForSlug(p.slug)?.projectStatus === 'BRAINSTORM',
  ),
)

const missingProjectSlugs = computed(() => {
  if (!conductorStore.hasLoaded || !dreamStore.hasLoaded) return []
  const dbSlugs = new Set(dreamStore.projectDreams.map((d) => d.slug))
  return conductorStore.projects.filter((p) => !dbSlugs.has(p.slug)).map((p) => p.slug)
})

const hasBrainstormContent = computed(
  () => pendingPitches.value.length > 0 || brainstormProjects.value.length > 0,
)

const filteredTodos = computed(() => {
  switch (todoFilter.value) {
    case 'OPEN':
      return todoStore.openTodos
    case 'DONE':
      return todoStore.doneTodos
    case 'ARCHIVED':
      return todoStore.archivedTodos
  }
})

const viewMode = computed(() => {
  const key = pageStore.workspaceCardKey
  if (!key || key === 'overview') return 'overview'
  if (key === 'tasks') return 'tasks'
  if (key === 'brainstorm') return 'brainstorm'
  if (projects.value.some((p) => p.slug === key)) return key
  return 'overview'
})

const selectedProject = computed<ConductorProject | null>(() => {
  if (['overview', 'tasks', 'brainstorm'].includes(viewMode.value)) return null
  return projects.value.find((p) => p.slug === viewMode.value) ?? null
})

const linkedDream = computed(() =>
  selectedProject.value
    ? projectDreamForSlug(selectedProject.value.slug)
    : null,
)

const fetchedLabel = computed(() => {
  if (!conductorStore.fetchedAt) return ''
  return new Date(conductorStore.fetchedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

const totalDone = computed(() =>
  activeProjects.value.reduce(
    (sum, p) => sum + p.tasks.filter((t) => t.status === 'done').length,
    0,
  ),
)

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
    const dream = projectDreamForSlug(project.slug)
    result.push(
      makeCard(
        project.slug,
        project.name || project.slug,
        kindIcon(project.kind),
        dream?.cardPath ?? undefined,
      ),
    )
  })
  return result
})

function getProjectPriority(dreamId?: number | null): DreamPriority {
  return conductorStore.getProjectPriority(dreamId)
}

async function setPriority(dreamId: number, priority: DreamPriority) {
  dreamSaving.value = true
  dreamSaveMessage.value = ''
  dreamSaveError.value = false
  const result = await conductorStore.setProjectPriority(dreamId, priority)
  dreamSaving.value = false
  if (result.ok) showSaveMessage('Priority saved')
  else showSaveMessage(result.message ?? 'Priority save failed', true)
}

async function autosave(field: keyof ProjectPatch, event: FocusEvent) {
  if (!linkedDream.value) return
  const el = event.target as HTMLInputElement | HTMLTextAreaElement | null
  if (!el) return
  const value = el.value.trim() || null
  const current = (linkedDream.value[field as keyof typeof linkedDream.value] ??
    null) as string | null
  if (value === current) return
  await patchDream({ [field]: value })
}

function showSaveMessage(msg: string, isError = false) {
  dreamSaveMessage.value = msg
  dreamSaveError.value = isError
  if (saveMessageTimer) clearTimeout(saveMessageTimer)
  saveMessageTimer = setTimeout(() => {
    dreamSaveMessage.value = ''
  }, 3000)
}

watch(viewMode, async (mode) => {
  if (mode === 'tasks' && !todoStore.hasLoaded) await todoStore.fetchTodos(true)
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
  if (!userStore.isAdmin) return
  const work: Promise<unknown>[] = [
    conductorStore.fetchProjects(true),
    ensureProjectDreams(),
  ]
  if (todoStore.hasLoaded) work.push(todoStore.fetchTodos(true))
  await Promise.all(work)
}

async function ensureProjectDreams() {
  if (!dreamStore.hasLoaded)
    await dreamStore.fetchDreams({ dreamType: 'PROJECT' })
}

async function syncMissingProjects() {
  if (!missingProjectSlugs.value.length) return
  syncingMissing.value = true
  syncMessage.value = ''
  syncError.value = false
  try {
    const dreams = missingProjectSlugs.value.map((slug) => {
      const project = conductorStore.projects.find((p) => p.slug === slug)
      return {
        title: project?.name || slug,
        slug,
        dreamType: 'PROJECT',
        imagePath: `${CONDUCTOR_IMG_BASE}/${slug}-icon.webp`,
        cardPath: `${CONDUCTOR_IMG_BASE}/${slug}-card.webp`,
        heroPath: `${CONDUCTOR_IMG_BASE}/${slug}-hero.webp`,
        isPublic: true,
        isMature: false,
        isActive: true,
        userId: 1,
      }
    })
    await $fetch('/api/dreams/batch', { method: 'POST', body: { dreams } })
    await dreamStore.fetchDreams({ dreamType: 'PROJECT' })
    syncMessage.value = `Synced ${dreams.length} project(s)`
    setTimeout(() => { syncMessage.value = '' }, 4000)
  } catch {
    syncError.value = true
    syncMessage.value = 'Sync failed'
  } finally {
    syncingMissing.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('conductor-gallery-mode') as GalleryMode | null
  if (saved && ['cards', 'heroes', 'icons', 'list'].includes(saved)) projectGalleryMode.value = saved
  if (!userStore.isAdmin && !dreamStore.hasLoaded) dreamStore.fetchDreams({ dreamType: 'PROJECT' })
})

watch(projectGalleryMode, (mode) => {
  localStorage.setItem('conductor-gallery-mode', mode)
})

function selectProject(slug: string) {
  pageStore.setWorkspaceCardKey(slug)
}
function goToOverview() {
  pageStore.setWorkspaceCardKey('overview')
}
function goTo(key: string) {
  pageStore.setWorkspaceCardKey(key)
}

async function submitNewTodo() {
  const title = newTodoTitle.value.trim()
  if (!title) return
  await todoStore.createTodo({
    title,
    priority: newTodoPriority.value,
    description: newTodoDescription.value.trim() || null,
  })
  newTodoTitle.value = ''
  newTodoDescription.value = ''
  newTodoPriority.value = 'NORMAL'
  todoFilter.value = 'OPEN'
}

function pitchVotedChoice(slug: string): 'approved' | 'passed' | null {
  return conductorStore.pitchVote(slug)
}

function voteOnPitch(slug: string, choice: 'approved' | 'passed') {
  conductorStore.voteOnPitch(slug, choice)
}

function clearVote(slug: string) {
  conductorStore.clearVote(slug)
}

function pitchArticleClass(slug: string): string {
  const choice = pitchVotedChoice(slug)
  if (choice === 'approved') return 'border-success/40 bg-success/5'
  if (choice === 'passed') return 'border-base-300 bg-base-200/50 opacity-60'
  return 'border-warning/40 bg-warning/5 hover:shadow-md'
}

function startEditPitch(pitch: ConductorPitch) {
  if (!pitchEditTexts.value[pitch.slug])
    pitchEditTexts.value = { ...pitchEditTexts.value, [pitch.slug]: pitch.idea }
  editingPitchSlug.value = pitch.slug
}

async function patchDream(patch: ProjectPatch) {
  if (!linkedDream.value) return
  dreamSaving.value = true
  dreamSaveMessage.value = ''
  dreamSaveError.value = false
  const result = await dreamStore.updateDream(linkedDream.value.id, patch)
  dreamSaving.value = false
  if (result?.success) showSaveMessage('Saved')
  else showSaveMessage(result?.message || 'Save failed', true)
}

function handleProjectStatusChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  patchDream({ projectStatus: target.value as ProjectStatus })
}

function handlePriorityChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (!target || !linkedDream.value) return
  setPriority(linkedDream.value.id, target.value as DreamPriority)
}

function blockedCount(project: ConductorProject) {
  return project.tasks.filter((t) => t.status === 'blocked').length
}
function needsHumanCount(project: ConductorProject) {
  return project.tasks.filter((t) => t.status === 'needs-human').length
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

function priorityBadgeClass(priority: DreamPriority): string {
  if (priority === 'HIGH') return 'badge-error'
  if (priority === 'LOW') return 'badge-ghost'
  return 'badge-warning'
}

function prioritySelectClass(priority: DreamPriority): string {
  if (priority === 'HIGH') return 'border-error/50 text-error'
  if (priority === 'LOW') return 'border-success/50 text-success'
  return 'border-warning/50 text-warning'
}

function kindIcon(kind: string) {
  if (kind === 'software') return 'kind-icon:code'
  if (kind === 'proposal') return 'kind-icon:sparkles'
  return 'kind-icon:document'
}

function kindProgressClass(kind: string) {
  if (kind === 'software') return 'bg-primary'
  if (kind === 'proposal') return 'bg-info'
  return 'bg-secondary'
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
</script>

<style scoped>
.kind-glow-primary {
  color: hsl(var(--p, 280 90% 70%));
  filter: drop-shadow(0 0 10px hsl(var(--p, 280 90% 70%) / 0.9));
}
.kind-glow-secondary {
  color: hsl(var(--s, 316 70% 60%));
  filter: drop-shadow(0 0 10px hsl(var(--s, 316 70% 60%) / 0.9));
}
.kind-glow-info {
  color: hsl(var(--in, 198 93% 60%));
  filter: drop-shadow(0 0 10px hsl(var(--in, 198 93% 60%) / 0.9));
}
</style>
