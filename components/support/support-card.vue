<template>
  <section
    class="support-card relative overflow-hidden rounded-2xl border border-primary/30 bg-base-100 text-base-content shadow-sm"
    :class="compact ? 'p-3' : 'p-4 sm:p-5'"
    aria-label="Share Kind Robots and support the Against Malaria Foundation"
  >
    <div class="support-glow pointer-events-none absolute inset-0" />
    <div class="support-head relative flex items-start gap-3">
      <span
        class="flex shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
        :class="compact ? 'size-9' : 'size-12'"
      >
        <Icon
          name="kind-icon:net"
          :class="compact ? 'size-5' : 'size-7'"
          aria-hidden="true"
        />
      </span>
      <div class="min-w-0 flex-1">
        <p
          class="text-[0.65rem] font-black uppercase tracking-[0.2em] text-primary"
        >
          Free to play · powered by kindness
        </p>
        <h3
          class="font-serif font-black leading-tight"
          :class="compact ? 'text-base' : 'text-xl sm:text-2xl'"
        >
          {{ headline }}
        </h3>
        <p v-if="!compact" class="mt-1 text-sm leading-snug opacity-75">
          No ads, no paywall. If this made you smile, pass it to a friend or
          send AMI a bed net. Gifts go straight to the Against Malaria
          Foundation. Kind Robots never touches the money.
        </p>
      </div>
    </div>

    <div
      class="support-actions relative grid gap-2"
      :class="compact ? 'mt-3' : 'mt-4'"
    >
      <div
        class="support-lane rounded-xl border border-base-300 bg-base-200/60 p-2.5"
      >
        <button
          v-if="compact"
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :aria-expanded="openLane === 'page'"
          @click="toggle('page')"
        >
          <span class="flex items-center gap-2">
            <Icon
              name="kind-icon:send"
              class="size-4 text-primary"
              aria-hidden="true"
            />
            Share {{ title ? 'this' : 'Kind Robots' }}
          </span>
          <Icon
            name="kind-icon:chevron-down"
            class="size-4 opacity-60"
            aria-hidden="true"
          />
        </button>
        <p v-else class="mb-2 flex items-center gap-2 text-sm font-black">
          <Icon
            name="kind-icon:send"
            class="size-4 text-primary"
            aria-hidden="true"
          />
          Share {{ title || 'Kind Robots' }}
        </p>
        <div
          v-if="!compact || openLane === 'page'"
          class="flex flex-wrap gap-1.5"
          :class="{ 'mt-2': compact }"
        >
          <button
            v-if="nativeShareReady"
            type="button"
            class="support-chip support-chip-strong"
            @click="shareNative(pageUrl, pageText)"
          >
            <Icon name="kind-icon:send" class="size-3.5" aria-hidden="true" />
            Share…
          </button>
          <a
            v-for="target in pageTargets"
            :key="'page-' + target.key"
            :href="target.href"
            target="_blank"
            rel="noopener noreferrer"
            class="support-chip"
            :aria-label="'Share on ' + target.label + ' (opens in a new tab)'"
          >
            <Icon :name="target.icon" class="size-3.5" aria-hidden="true" />
            {{ target.label }}
          </a>
          <button type="button" class="support-chip" @click="copy(pageUrl)">
            <Icon name="kind-icon:copy" class="size-3.5" aria-hidden="true" />
            {{ support.copiedUrl === pageUrl ? 'Copied!' : 'Copy link' }}
          </button>
        </div>
      </div>

      <div
        class="support-lane support-give flex flex-col justify-center gap-2 rounded-xl border border-primary/40 p-2.5"
      >
        <a
          :href="FUNDRAISER_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary w-full gap-2 rounded-xl"
          :class="compact ? 'btn-sm' : ''"
          @click="support.markGave()"
        >
          <Icon name="kind-icon:hand-heart" class="size-5" aria-hidden="true" />
          Give a bed net
          <span class="sr-only"
            >(opens the Against Malaria Foundation fundraiser in a new
            tab)</span
          >
        </a>
        <p v-if="!compact" class="text-center text-xs leading-snug opacity-70">
          Opens the Against Malaria Foundation's official fundraiser page.
        </p>
      </div>

      <div
        class="support-lane rounded-xl border border-base-300 bg-base-200/60 p-2.5"
      >
        <button
          v-if="compact"
          type="button"
          class="flex w-full items-center justify-between gap-2 text-left text-sm font-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :aria-expanded="openLane === 'fundraiser'"
          @click="toggle('fundraiser')"
        >
          <span class="flex items-center gap-2">
            <Icon
              name="kind-icon:heart"
              class="size-4 text-secondary"
              aria-hidden="true"
            />
            Share the fundraiser
          </span>
          <Icon
            name="kind-icon:chevron-down"
            class="size-4 opacity-60"
            aria-hidden="true"
          />
        </button>
        <p v-else class="mb-2 flex items-center gap-2 text-sm font-black">
          <Icon
            name="kind-icon:heart"
            class="size-4 text-secondary"
            aria-hidden="true"
          />
          Spread the fundraiser
        </p>
        <div
          v-if="!compact || openLane === 'fundraiser'"
          class="flex flex-wrap gap-1.5"
          :class="{ 'mt-2': compact }"
        >
          <button
            v-if="nativeShareReady"
            type="button"
            class="support-chip support-chip-strong"
            @click="shareNative(FUNDRAISER_URL, FUNDRAISER_SHARE_TEXT)"
          >
            <Icon name="kind-icon:send" class="size-3.5" aria-hidden="true" />
            Share…
          </button>
          <a
            v-for="target in fundraiserTargets"
            :key="'fund-' + target.key"
            :href="target.href"
            target="_blank"
            rel="noopener noreferrer"
            class="support-chip"
            :aria-label="
              'Share the fundraiser on ' +
              target.label +
              ' (opens in a new tab)'
            "
          >
            <Icon :name="target.icon" class="size-3.5" aria-hidden="true" />
            {{ target.label }}
          </a>
          <button
            type="button"
            class="support-chip"
            @click="copy(FUNDRAISER_URL)"
          >
            <Icon name="kind-icon:copy" class="size-3.5" aria-hidden="true" />
            {{ support.copiedUrl === FUNDRAISER_URL ? 'Copied!' : 'Copy link' }}
          </button>
        </div>
      </div>
    </div>
    <p class="sr-only" role="status">
      {{ support.copiedUrl ? 'Link copied to clipboard' : '' }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSupportStore } from '@/stores/supportStore'
import {
  FUNDRAISER_SHARE_TEXT,
  FUNDRAISER_URL,
  shareableUrl,
  buildShareTargets,
} from '~/utils/supportShare'

const props = defineProps<{
  title?: string
  path?: string
  compact?: boolean
}>()

const support = useSupportStore()
const route = useRoute()
const openLane = ref<'page' | 'fundraiser' | null>(null)
const nativeShareReady = ref(false)

const pageUrl = computed(() => shareableUrl(props.path || route.path))
const pageText = computed(() =>
  props.title
    ? `I just played ${props.title} on Kind Robots. Free, handmade, no ads, and it supports malaria nets:`
    : 'Kind Robots: free handmade games and stories that raise money for malaria nets:',
)
const headline = computed(() =>
  props.compact
    ? 'Enjoyed it? Pass it on.'
    : props.title
      ? `Loved ${props.title}? Help it travel.`
      : 'Enjoying Kind Robots? Help it travel.',
)
const pageTargets = computed(() =>
  buildShareTargets({ url: pageUrl.value, text: pageText.value }),
)
const fundraiserTargets = computed(() =>
  buildShareTargets({
    url: FUNDRAISER_URL,
    text: FUNDRAISER_SHARE_TEXT,
  }).filter((target) =>
    ['x', 'facebook', 'bluesky', 'whatsapp'].includes(target.key),
  ),
)

function toggle(lane: 'page' | 'fundraiser') {
  openLane.value = openLane.value === lane ? null : lane
}

function shareNative(url: string, text: string) {
  void support.nativeShare({ url, text, title: props.title || 'Kind Robots' })
}

function copy(url: string) {
  void support.copyLink(url)
}

onMounted(() => {
  nativeShareReady.value = support.canNativeShare()
})
</script>

<style scoped>
.support-card {
  container-type: inline-size;
}

.support-glow {
  background:
    radial-gradient(
      120% 80% at 0% 0%,
      color-mix(in oklab, var(--color-primary) 16%, transparent),
      transparent 60%
    ),
    radial-gradient(
      90% 70% at 100% 100%,
      color-mix(in oklab, var(--color-secondary) 14%, transparent),
      transparent 60%
    );
}

.support-give {
  background: linear-gradient(
    135deg,
    color-mix(in oklab, var(--color-primary) 14%, transparent),
    color-mix(in oklab, var(--color-accent) 10%, transparent)
  );
}

.support-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 999px;
  border: 1px solid var(--color-base-300);
  background: var(--color-base-100);
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  transition:
    border-color 0.15s,
    color 0.15s,
    transform 0.15s;
}

.support-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.support-chip:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.support-chip-strong {
  border-color: color-mix(in oklab, var(--color-primary) 50%, transparent);
  color: var(--color-primary);
}

@container (min-width: 40rem) {
  .support-actions {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.9fr) minmax(0, 1.1fr);
  }
}
</style>
