<!-- /components/content/screenfx/screen-fx.vue -->
<template>
  <Teleport to="body">
    <div
      v-if="activeCount > 0"
      class="effect-container"
      :class="{ 'effect-container--interactive': hasBlockingEffect }"
      :style="animationStore.layerStyle"
    >
      <component
        :is="activeComponent.component"
        v-for="activeComponent in activeComponents"
        :key="activeComponent.id"
      />
    </div>

    <Transition name="fade-up">
      <button
        v-if="activeCount > 0"
        class="escape-btn"
        title="Clear all effects"
        type="button"
        @click="clearAll"
      >
        <Icon name="kind-icon:close" class="h-5 w-5" />
        <span>clear all</span>
        <strong>{{ activeCount }}</strong>
      </button>
    </Transition>
  </Teleport>

  <section class="screen-fx-shell">
    <div class="fx-panel">
      <div class="fx-header">
        <div class="fx-title">
          <span class="fx-logo">✦</span>
          <div>
            <h2>Screen FX</h2>
            <p>Layer chaos responsibly.</p>
          </div>
        </div>

        <div class="fx-header-right">
          <span v-if="activeCount > 0" class="fx-active-badge">
            {{ activeCount }} active
          </span>
          <span class="fx-total-label">{{ effects.length }} effects</span>
        </div>
      </div>

      <div class="fx-zone-section">
        <div class="fx-zone-header">
          <div>
            <span class="fx-zone-title">Coverage zones</span>
            <p class="fx-zone-subtitle">
              Choose where animations are allowed to wander.
            </p>
          </div>

          <button
            v-if="anyZoneActive"
            class="fx-zone-reset"
            type="button"
            @click="animationStore.resetZones()"
          >
            reset
          </button>
        </div>

        <div class="fx-zone-grid">
          <button
            v-for="zone in zoneOptions"
            :key="zone.id"
            class="fx-zone-btn"
            :class="{ 'fx-zone-btn--active': animationStore.zones[zone.id] }"
            :title="zone.tooltip"
            type="button"
            @click="animationStore.toggleZone(zone.id)"
          >
            <span class="fx-zone-icon-wrap">
              <Icon :name="zone.icon" class="fx-zone-icon" />
            </span>
            <span class="fx-zone-label">{{ zone.label }}</span>
            <span class="fx-zone-state">
              {{ animationStore.zones[zone.id] ? 'on' : 'off' }}
            </span>
          </button>
        </div>
      </div>

      <div class="fx-grid">
        <button
          v-for="effect in effects"
          :key="effect.id"
          class="fx-btn"
          :class="{
            'fx-btn--active': effect.isActive,
            'fx-btn--blocks': effect.blocksInput,
          }"
          :style="effect.isActive ? { '--ec': effect.color } : {}"
          type="button"
          :aria-pressed="effect.isActive"
          :aria-label="effect.label"
          @click="toggleEffect(effect.id)"
          @mouseenter="hoveredEffect = effect.id"
          @mouseleave="hoveredEffect = null"
        >
          <Transition name="tooltip">
            <div v-if="hoveredEffect === effect.id" class="fx-tooltip">
              <span>{{ effect.tooltip }}</span>
              <span v-if="effect.blocksInput" class="fx-tooltip-warn">
                captures clicks
              </span>
            </div>
          </Transition>

          <span v-if="effect.isActive" class="fx-pulse" />

          <span class="fx-icon-wrap">
            <Icon :name="effect.icon" class="fx-icon" />
          </span>

          <span class="fx-label">
            {{ effect.isActive ? effect.reveal : effect.label }}
          </span>

          <span v-if="effect.blocksInput" class="fx-block-chip">
            interactive
          </span>
        </button>
      </div>

      <div class="fx-footer">
        <span>Effects stack together.</span>
        <span>Several of these are absolutely unhinged. Good.</span>
      </div>
    </div>
  </section>
</template>