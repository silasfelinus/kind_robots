<template>
  <article
    class="bs-line"
    :class="{ 'is-hidden': line.hidden, 'is-mine': line.isMine }"
    :data-testid="`brainstorm-line-${line.id}`"
  >
    <div class="bs-line-art">
      <img
        v-if="line.artUrl && !artBroken"
        :src="line.artUrl"
        :alt="fullText"
        loading="lazy"
        @error="artBroken = true"
      />
      <div v-else-if="line.artStatus === 'painting'" class="bs-line-painting">
        <span class="bs-brush" aria-hidden="true">🎨</span>
        <span>Painting…</span>
      </div>
      <div v-else class="bs-line-blank">
        <span class="text-3xl" aria-hidden="true">🖼️</span>
        <button
          type="button"
          class="btn btn-xs btn-secondary rounded-full"
          data-testid="brainstorm-paint-line"
          @click="store.paintLine(line.id)"
        >
          {{ line.artStatus === 'failed' ? 'Repaint' : 'Paint it' }}
        </button>
      </div>
      <span v-if="rank" class="bs-line-rank">{{ rank }}</span>
    </div>

    <div class="bs-line-body">
      <p class="bs-line-text">
        <span v-if="stemText" class="bs-line-stem">{{ stemText }}</span>
        {{ line.text }}
      </p>
      <p class="bs-line-meta">
        <span>— {{ line.authorName }}</span>
        <span
          v-if="line.aiSpark"
          class="bs-line-spark"
          title="Sparked by the coach"
        >
          ⚡ {{ line.aiSpark }}
        </span>
        <span v-if="line.hidden" class="text-warning"
          >Flagged by the table</span
        >
      </p>
      <div class="bs-line-actions">
        <button
          v-for="reaction in reactions"
          :key="reaction.type"
          type="button"
          class="bs-react"
          :class="{ 'is-on': line.myReaction === reaction.type }"
          :aria-pressed="line.myReaction === reaction.type"
          :aria-label="`${reaction.label} (${line.counts[reaction.type]})`"
          :data-testid="`brainstorm-react-${reaction.type.toLowerCase()}`"
          @click="store.react(line.id, reaction.type)"
        >
          <span aria-hidden="true">{{ reaction.icon }}</span>
          <span>{{ line.counts[reaction.type] }}</span>
        </button>
        <div class="dropdown dropdown-end ml-auto">
          <button
            type="button"
            tabindex="0"
            class="btn btn-ghost btn-xs btn-circle"
            aria-label="More"
          >
            ⋯
          </button>
          <ul
            tabindex="0"
            class="dropdown-content menu z-30 w-40 rounded-box bg-base-100 p-1 shadow-xl"
          >
            <li>
              <button type="button" @click="store.react(line.id, 'FLAGGED')">
                {{ line.myReaction === 'FLAGGED' ? 'Unflag' : '🚩 Not cool' }}
              </button>
            </li>
            <li v-if="line.artStatus === 'ready'">
              <button type="button" @click="store.paintLine(line.id)">
                🎨 Repaint
              </button>
            </li>
            <li v-if="line.canDelete">
              <button
                type="button"
                class="text-error"
                @click="store.deleteLine(line.id)"
              >
                Remove
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  useBrainstormRiffStore,
  type BrainstormRiffLine,
} from '@/stores/brainstormRiffStore'
import { BRAINSTORM_LINE_REACTIONS } from '@/utils/brainstormRiffs'

const props = defineProps<{
  line: BrainstormRiffLine
  stem: string | null
  rank?: string
}>()

const store = useBrainstormRiffStore()
const reactions = BRAINSTORM_LINE_REACTIONS
const artBroken = ref(false)

watch(
  () => props.line.artUrl,
  () => {
    artBroken.value = false
  },
)

const stemText = computed(() =>
  (props.stem || '').replace(/\s*(?:…|\.{2,})\s*$/, '').trim(),
)
const fullText = computed(() =>
  [stemText.value, props.line.text].filter(Boolean).join(' '),
)
</script>

<style scoped>
.bs-line {
  display: flex;
  flex-direction: column;
  overflow: visible;
  border-radius: 1.2rem;
  background: var(--color-base-100);
  box-shadow:
    inset 0 0 0 1px color-mix(in oklch, white 8%, transparent),
    0 5px 0 color-mix(in oklch, black 45%, transparent);
  animation: bs-pop 260ms cubic-bezier(0.3, 1.6, 0.5, 1);
}

.bs-line.is-mine {
  box-shadow:
    inset 0 0 0 2px color-mix(in oklch, var(--color-secondary) 55%, transparent),
    0 5px 0 color-mix(in oklch, black 45%, transparent);
}

.bs-line.is-hidden {
  opacity: 0.55;
}

.bs-line-art {
  position: relative;
  display: grid;
  aspect-ratio: 1;
  place-items: center;
  overflow: hidden;
  border-radius: 1.2rem 1.2rem 0 0;
  background: linear-gradient(
    145deg,
    color-mix(in oklch, var(--color-primary) 35%, var(--color-base-300)),
    color-mix(in oklch, var(--color-accent) 30%, var(--color-base-300))
  );
}

.bs-line-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bs-line-painting,
.bs-line-blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  font-size: 0.85rem;
}

.bs-line-painting {
  inset: 0;
  position: absolute;
  justify-content: center;
  background: linear-gradient(
    100deg,
    transparent 20%,
    color-mix(in oklch, white 14%, transparent) 50%,
    transparent 80%
  );
  background-size: 220% 100%;
  animation: bs-shimmer 1.6s linear infinite;
}

.bs-brush {
  font-size: 2rem;
  animation: bs-wiggle 0.9s ease-in-out infinite;
}

.bs-line-rank {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--color-secondary-content);
  background: var(--color-secondary);
}

.bs-line-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.8rem 0.6rem;
}

.bs-line-text {
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.35;
}

.bs-line-stem {
  color: var(--color-accent);
}

.bs-line-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: color-mix(in oklch, var(--color-base-content) 65%, transparent);
}

.bs-line-spark {
  color: var(--color-secondary);
}

.bs-line-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
}

.bs-react {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.85rem;
  font-weight: 800;
  background: var(--color-base-300);
  transition: transform 120ms ease;
}

.bs-react:active {
  transform: scale(0.92);
}

.bs-react.is-on {
  color: var(--color-primary-content);
  background: var(--color-primary);
  box-shadow: 0 0 12px
    color-mix(in oklch, var(--color-primary) 55%, transparent);
}

@keyframes bs-pop {
  from {
    transform: scale(0.94);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bs-shimmer {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
}

@keyframes bs-wiggle {
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(12deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bs-line,
  .bs-line-painting,
  .bs-brush {
    animation: none;
  }
}
</style>
