<template>
  <section class="dh-title" data-testid="dh-title" aria-label="Deepheart title">
    <div class="dh-title-art">
      <PlaybookKitArt
        :art="spec.keyArt"
        tone="primary"
        icon="kind-icon:dungeon"
        class="h-full w-full"
      />
      <div class="dh-title-glow" aria-hidden="true" />
    </div>
    <div class="dh-title-card">
      <h1 class="dh-title-word">Deepheart</h1>
      <p class="dh-title-tag pk-prose">{{ spec.tagline }}</p>
      <div class="dh-title-menu">
        <button
          type="button"
          class="btn btn-primary rounded-2xl"
          data-testid="dh-new"
          @click="dh.newGame()"
        >
          <Icon name="kind-icon:dungeon" class="size-5" />
          New delve
        </button>
        <button
          type="button"
          class="btn btn-secondary rounded-2xl"
          :disabled="!dh.canContinue"
          data-testid="dh-continue"
          @click="dh.continueRun()"
        >
          <Icon name="kind-icon:play" class="size-5" />
          Continue
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-2xl border border-base-content/15"
          data-testid="dh-load"
          @click="dh.screen = 'saves'"
        >
          <Icon name="kind-icon:save" class="size-5" />
          Load
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-2xl border border-base-content/15"
          data-testid="dh-chronicle"
          @click="dh.screen = 'chronicle'"
        >
          <Icon name="kind-icon:book-open" class="size-5" />
          Chronicle
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-2xl border border-base-content/15"
          @click="kit.openPane('scrapbook')"
        >
          <Icon name="kind-icon:camera" class="size-5" />
          Scrapbook
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-2xl border border-base-content/15"
          @click="kit.openPane('achievements')"
        >
          <Icon name="kind-icon:trophy" class="size-5" />
          Achievements
        </button>
        <NuxtLink
          v-if="user.isAdmin && user.showMature"
          to="/admin/deepheart/bible"
          class="btn btn-outline rounded-2xl"
          data-testid="dh-art-bible"
        >
          <Icon name="kind-icon:palette-color" class="size-5" />
          Art bible
        </NuxtLink>
        <button
          type="button"
          class="btn btn-ghost rounded-2xl border border-base-content/15"
          @click="kit.openPane('settings')"
        >
          <Icon name="kind-icon:settings" class="size-5" />
          Settings
        </button>
      </div>
      <p v-if="dh.autosave && dh.canContinue" class="dh-title-save">
        {{ dh.autosave.label }}
      </p>
      <p class="dh-title-stats">
        {{ dh.chronicle.delves }} delves · {{ dh.chronicle.endings.length }} of
        {{ spec.endings.length }} endings · {{ dh.chronicle.met.length }} of 50
        delvers met
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDeepheartStore } from '~/stores/deepheartStore'
import { usePlaybookKitStore } from '~/stores/playbookKitStore'
import { useUserStore } from '~/stores/userStore'
import { DEEPHEART as spec } from '~/utils/playbookKit/games/deepheart'

const dh = useDeepheartStore()
const kit = usePlaybookKitStore()
const user = useUserStore()
</script>

<style scoped>
.dh-title {
  position: relative;
  display: grid;
  height: 100%;
  min-height: 0;
  overflow: clip;
  border-radius: var(--radius-box);
}
.dh-title-art {
  grid-area: 1 / 1;
  position: relative;
  min-height: 0;
}
.dh-title-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      60% 50% at 50% 85%,
      color-mix(in oklch, var(--color-secondary) 35%, transparent),
      transparent 70%
    ),
    linear-gradient(
      180deg,
      transparent 30%,
      color-mix(in oklch, var(--color-base-200) 92%, transparent) 85%
    );
}
.dh-title-card {
  grid-area: 1 / 1;
  z-index: 1;
  align-self: end;
  display: grid;
  justify-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1rem 1.5rem;
  text-align: center;
}
.dh-title-word {
  font-family: var(--pf-display, ui-serif, Georgia, serif);
  font-size: clamp(2.4rem, 9cqw, 5rem);
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
  text-shadow:
    0 0 24px color-mix(in oklch, var(--color-secondary) 60%, transparent),
    0 3px 0 color-mix(in oklch, black 70%, transparent);
  text-wrap: balance;
}
.dh-title-tag {
  max-width: 36rem;
  opacity: 0.9;
}
.dh-title-menu {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  max-width: 44rem;
}
.dh-title-save,
.dh-title-stats {
  font-size: 0.8rem;
  opacity: 0.75;
  font-variant-numeric: tabular-nums;
}
</style>
