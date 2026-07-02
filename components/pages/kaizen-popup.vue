<!-- /components/pages/kaizen-popup.vue -->
<!-- A small trigger chip + modal explaining the Kaizen principle the
     project system is founded on. Drop-in anywhere on the conductor pages. -->
<template>
  <button
    type="button"
    class="btn btn-ghost btn-xs gap-1 rounded-lg text-secondary"
    title="Kaizen — how projects get done here"
    @click="open = true"
  >
    <Icon name="kind-icon:sparkles" class="size-3" />
    <span class="hidden sm:inline">Kaizen</span>
  </button>

  <Teleport to="body">
    <div
      v-if="open"
      class="modal modal-open"
      role="dialog"
      aria-modal="true"
      aria-label="About Kaizen"
      @click.self="open = false"
    >
      <div class="modal-box max-w-lg rounded-2xl border border-secondary/30">
        <div class="flex items-start justify-between gap-3">
          <h3 class="flex items-center gap-2 text-lg font-black">
            <Icon name="kind-icon:sparkles" class="size-5 text-secondary" />
            Kaizen — 改善
          </h3>
          <button
            type="button"
            class="btn btn-ghost btn-xs rounded-lg"
            @click="open = false"
          >
            <Icon name="kind-icon:x" class="size-3.5" />
          </button>
        </div>
        <p class="mt-3 text-sm leading-relaxed text-base-content/80">
          Kaizen means "change for the better" — the practice of improving
          through many small, incremental steps rather than heroic leaps. It is
          the founding principle of this whole workspace: every project here
          moves forward one tiny, finishable step at a time. A roadmap pin
          checked, a honey-do answered, a single task reviewed — each one is
          small enough to actually happen today, and together they compound into
          finished projects. When something feels too big, we don't push harder;
          we cut a smaller step. Progress you can repeat beats progress you have
          to summon.
        </p>
        <p class="mt-3 text-xs italic text-base-content/50">
          "A journey of a thousand miles begins with a single step — and then
          another, and another."
        </p>
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-secondary btn-sm rounded-xl"
            @click="open = false"
          >
            One step at a time
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const open = ref(false)
</script>
