<!-- /components/content/social/social-publisher.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-300 p-3"
  >
    <!-- Header -->
    <header
      class="flex shrink-0 flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            Social Publisher
          </h2>
          <p class="text-sm text-base-content/60">
            Compose once, send everywhere. Auto-post where we can, copy-ready
            blocks where we can't.
          </p>
        </div>
        <span class="badge badge-ghost shrink-0">
          {{ socialStore.ownedItems.length }} posts
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="socialStore.startNew()"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" /> New post
        </button>
        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="socialStore.loading"
          @click="socialStore.fetchAll()"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" /> Refresh
        </button>
      </div>
    </header>

    <div
      v-if="status.message"
      class="shrink-0 rounded-2xl border p-3 text-sm"
      :class="
        status.tone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      {{ status.message }}
    </div>

    <!-- Two-column cockpit: compose | preview -->
    <section
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]"
    >
      <!-- Compose -->
      <main
        class="flex min-h-0 flex-col gap-3 overflow-auto rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <div>
          <label class="mb-1 block text-sm font-bold text-base-content/70"
            >Title</label
          >
          <input
            v-model="form.title"
            type="text"
            placeholder="What's this post about?"
            class="input input-bordered w-full rounded-xl bg-base-200"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-bold text-base-content/70"
            >Body (markdown)</label
          >
          <textarea
            v-model="form.body"
            class="textarea textarea-bordered min-h-40 w-full rounded-xl bg-base-200"
            placeholder="Write your post. Markdown is fine — we degrade it per platform."
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-bold text-base-content/70"
            >Canonical URL (optional)</label
          >
          <input
            v-model="form.url"
            type="url"
            placeholder="https://kindrobots.org/..."
            class="input input-bordered w-full rounded-xl bg-base-200"
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-bold text-base-content/70"
            >Media URLs</label
          >
          <textarea
            v-model="mediaText"
            class="textarea textarea-bordered min-h-20 w-full rounded-xl bg-base-200"
            placeholder="One URL per line. Used as attachments / references."
          />
        </div>

        <div>
          <label class="mb-1 block text-sm font-bold text-base-content/70"
            >Hashtags</label
          >
          <input
            v-model="hashtagText"
            type="text"
            placeholder="malaria, kindrobots, ai (comma separated)"
            class="input input-bordered w-full rounded-xl bg-base-200"
          />
        </div>

        <!-- Audience: who the post is FOR (distinct from platforms = where it GOES) -->
        <div>
          <span class="mb-1 block text-sm font-bold text-base-content/70"
            >Audience</span
          >
          <div class="flex flex-wrap gap-2">
            <button
              v-for="a in audiences"
              :key="a"
              type="button"
              class="btn btn-sm rounded-xl"
              :class="form.audience === a ? 'btn-primary' : 'btn-outline'"
              @click="setAudience(a)"
            >
              {{ a }}
            </button>
          </div>
        </div>

        <!-- Platforms: where it GOES -->
        <div>
          <span class="mb-1 block text-sm font-bold text-base-content/70"
            >Platforms</span
          >
          <div class="flex flex-wrap gap-2">
            <button
              v-for="p in allPlatforms"
              :key="p"
              type="button"
              class="btn btn-sm rounded-xl"
              :class="isSelected(p) ? 'btn-primary' : 'btn-outline'"
              @click="togglePlatform(p)"
            >
              <Icon :name="platformIcon(p)" class="h-4 w-4" />
              {{ p }}
              <span v-if="!automatable(p)" class="badge badge-ghost badge-xs"
                >manual</span
              >
            </button>
          </div>
        </div>

        <label
          class="flex cursor-pointer items-center gap-2 text-sm text-base-content/70"
        >
          <input
            v-model="form.isMature"
            type="checkbox"
            class="checkbox checkbox-sm"
          />
          Mature content
        </label>

        <!-- TODO: scheduling not yet wired. scheduledAt + SCHEDULED status need a
             cron/queue worker to actually fire. Field exists; UI intentionally omitted. -->

        <footer class="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button
            class="btn btn-secondary rounded-xl"
            type="button"
            :disabled="socialStore.isSaving || !canSave"
            @click="onSave"
          >
            <span
              v-if="socialStore.isSaving"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:save" class="h-5 w-5" />
            {{ form.id ? 'Update' : 'Save draft' }}
          </button>
          <button
            class="btn btn-primary rounded-xl"
            type="button"
            :disabled="socialStore.isPublishing || !form.id || !hasAutomatable"
            @click="onPublish"
          >
            <span
              v-if="socialStore.isPublishing"
              class="loading loading-spinner loading-sm"
            />
            <Icon v-else name="kind-icon:rocket" class="h-5 w-5" />
            Publish auto
          </button>
        </footer>
      </main>

      <!-- Preview cards -->
      <aside class="flex min-h-0 flex-col gap-3 overflow-auto">
        <div
          v-if="!socialStore.variants.length"
          class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:sparkles" class="h-12 w-12 text-primary/60" />
          <p class="text-base font-bold">Pick platforms to preview</p>
          <p class="text-sm">Each gets its own formatted, copy-ready card.</p>
        </div>

        <article
          v-for="variant in socialStore.variants"
          :key="variant.platform"
          class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Icon
                :name="platformIcon(variant.platform)"
                class="h-5 w-5 text-primary"
              />
              <span class="font-bold text-base-content">{{
                variant.platform
              }}</span>
              <span :class="['badge badge-sm', statusBadge(variant.platform)]">
                {{ targetStatus(variant.platform) }}
              </span>
            </div>
            <span
              v-if="variant.limit !== null"
              class="text-xs font-mono"
              :class="
                variant.isOverLimit ? 'text-error' : 'text-base-content/50'
              "
            >
              {{ variant.remaining }}/{{ variant.limit }}
            </span>
          </div>

          <div
            v-for="block in variant.copyBlocks"
            :key="block.label"
            class="mb-2"
          >
            <div class="mb-1 flex items-center justify-between gap-2">
              <span class="text-xs font-bold uppercase text-base-content/50">{{
                block.label
              }}</span>
              <button
                class="btn btn-ghost btn-xs rounded-lg"
                type="button"
                @click="copy(block.value, `${variant.platform} ${block.label}`)"
              >
                <Icon name="kind-icon:copy" class="h-3.5 w-3.5" /> Copy
              </button>
            </div>
            <pre
              class="whitespace-pre-wrap rounded-xl bg-base-200 p-2 text-xs leading-relaxed text-base-content/80"
              >{{ block.value }}</pre
            >
          </div>

          <ul v-if="variant.warnings.length" class="mb-2 space-y-1">
            <li
              v-for="(w, i) in variant.warnings"
              :key="i"
              class="text-xs text-warning"
            >
              <Icon name="kind-icon:alert" class="inline h-3 w-3" /> {{ w }}
            </li>
          </ul>

          <div class="flex flex-wrap gap-2">
            <button
              v-if="!variant.isAutomatable && openUrl(variant.platform)"
              class="btn btn-outline btn-xs rounded-lg"
              type="button"
              @click="openExternal(variant.platform)"
            >
              <Icon name="kind-icon:external" class="h-3.5 w-3.5" /> Open
              {{ variant.platform }}
            </button>
            <button
              v-if="!variant.isAutomatable && form.id"
              class="btn btn-success btn-xs rounded-lg"
              type="button"
              @click="onMarkCopied(variant.platform)"
            >
              <Icon name="kind-icon:check" class="h-3.5 w-3.5" /> Mark copied
            </button>
          </div>
        </article>
      </aside>
    </section>

    <!-- Saved posts strip -->
    <section
      v-if="socialStore.ownedItems.length"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-2"
    >
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="post in socialStore.ownedItems"
          :key="post.id"
          type="button"
          class="btn btn-sm shrink-0 rounded-xl"
          :class="
            socialStore.selected?.id === post.id ? 'btn-primary' : 'btn-ghost'
          "
          @click="socialStore.select(post.id)"
        >
          {{ post.title || `Post #${post.id}` }}
          <span :class="['badge badge-xs', postStatusBadge(post.status)]">{{
            post.status
          }}</span>
        </button>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useSocialStore } from '@/stores/socialStore'
import type { SocialPlatform, PostAudience } from '@/stores/socialStore'

const socialStore = useSocialStore()
const form = computed(() => socialStore.form)

const status = reactive<{ message: string; tone: 'success' | 'error' }>({
  message: '',
  tone: 'success',
})

const allPlatforms: SocialPlatform[] = [
  'DISCORD',
  'MASTODON',
  'BLUESKY',
  'RSS',
  'REDDIT',
  'FACEBOOK',
  'INSTAGRAM',
] as unknown as SocialPlatform[]

const audiences: PostAudience[] = [
  'PUBLIC',
  'SOCIAL',
  'WORK',
  'FRIENDS',
  'FAMILY',
  'PRIVATE',
] as unknown as PostAudience[]

const automatableSet = new Set(['DISCORD', 'MASTODON', 'BLUESKY', 'RSS'])
const automatable = (p: SocialPlatform) => automatableSet.has(p as string)

// ── Media + hashtag text bridges (textarea <-> array) ──
const mediaText = ref('')
const hashtagText = ref('')

watch(
  () => socialStore.form,
  (f) => {
    mediaText.value = (f.media ?? []).map((m) => m.url).join('\n')
    hashtagText.value = (f.hashtags ?? []).join(', ')
  },
  { immediate: true, deep: false },
)

watch(mediaText, (val) => {
  socialStore.form.media = val
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((url) => ({ url }))
})

watch(hashtagText, (val) => {
  socialStore.form.hashtags = val
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
})

// ── Audience ──
function setAudience(a: PostAudience) {
  socialStore.form.audience = a
  if (form.value.id) void socialStore.updatePost(form.value.id, { audience: a })
}

// ── Platform selection ──
const isSelected = (p: SocialPlatform) =>
  (form.value.platforms ?? []).includes(p)

function togglePlatform(p: SocialPlatform) {
  const set = new Set(form.value.platforms ?? [])
  set.has(p) ? set.delete(p) : set.add(p)
  socialStore.form.platforms = [...set]
  // Keep targets in sync on an already-saved post.
  if (form.value.id) {
    void socialStore.updatePost(form.value.id, { platforms: [...set] })
  }
}

const hasAutomatable = computed(() =>
  (form.value.platforms ?? []).some((p) => automatable(p)),
)

const canSave = computed(() =>
  Boolean(form.value.title?.trim() && form.value.body?.trim()),
)

// ── Target status lookups ──
function targetStatus(platform: SocialPlatform): string {
  const t = socialStore.selected?.targets?.find((x) => x.platform === platform)
  return t?.status ?? 'PENDING'
}

function statusBadge(platform: SocialPlatform): string {
  const s = targetStatus(platform)
  return (
    {
      SENT: 'badge-success',
      COPIED: 'badge-info',
      FAILED: 'badge-error',
      SKIPPED: 'badge-ghost',
      PENDING: 'badge-warning',
    }[s] ?? 'badge-ghost'
  )
}

function postStatusBadge(s: string): string {
  return (
    {
      PUBLISHED: 'badge-success',
      PUBLISHING: 'badge-warning',
      FAILED: 'badge-error',
      SCHEDULED: 'badge-info',
      DRAFT: 'badge-ghost',
    }[s] ?? 'badge-ghost'
  )
}

// ── Icons + external links ──
function platformIcon(p: SocialPlatform): string {
  return (
    {
      DISCORD: 'kind-icon:discord',
      MASTODON: 'kind-icon:mastodon',
      BLUESKY: 'kind-icon:bluesky',
      REDDIT: 'kind-icon:reddit',
      FACEBOOK: 'kind-icon:facebook',
      INSTAGRAM: 'kind-icon:instagram',
      RSS: 'kind-icon:rss',
    }[p as string] ?? 'kind-icon:share'
  )
}

function openUrl(p: SocialPlatform): string | null {
  return (
    {
      REDDIT: 'https://www.reddit.com/submit',
      FACEBOOK: 'https://www.facebook.com',
      INSTAGRAM: 'https://www.instagram.com',
    }[p as string] ?? null
  )
}

function openExternal(p: SocialPlatform) {
  const url = openUrl(p)
  if (url) window.open(url, '_blank', 'noopener')
}

// ── Actions ──
function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  status.message = message
  status.tone = tone
  if (tone === 'success') setTimeout(() => (status.message = ''), 3000)
}

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    setStatus(`Copied ${label}.`)
  } catch {
    setStatus('Copy failed — select and copy manually.', 'error')
  }
}

async function onSave() {
  const res = await socialStore.save()
  setStatus(
    res.success ? 'Saved.' : res.message || 'Save failed.',
    res.success ? 'success' : 'error',
  )
}

async function onPublish() {
  if (!form.value.id) return
  const res = await socialStore.publish(form.value.id)
  setStatus(
    res.success ? 'Published.' : res.message || 'Publish failed.',
    res.success ? 'success' : 'error',
  )
}

async function onMarkCopied(platform: SocialPlatform) {
  if (!form.value.id) return
  const res = await socialStore.markTargetCopied(form.value.id, platform)
  setStatus(
    res.success ? `${platform} marked copied.` : res.message || 'Failed.',
    res.success ? 'success' : 'error',
  )
}

onMounted(() => socialStore.initialize())
</script>
