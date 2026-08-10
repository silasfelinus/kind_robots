<template>
  <section
    class="mx-auto flex w-full max-w-6xl flex-col gap-5 px-1 pb-8 sm:gap-6 sm:px-2"
    aria-label="Brainstorm idea workbench"
    data-testid="brainstorm-manager"
  >
    <div
      class="kr-panel-flat overflow-hidden border border-base-content/10 bg-base-100/90 shadow-xl backdrop-blur"
    >
      <div class="p-5 sm:p-7 lg:p-8">
        <div
          class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
        >
          <div class="max-w-3xl">
            <div
              class="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary"
            >
              <span aria-hidden="true">🧠</span>
              Idea workbench
            </div>
            <h2
              class="text-2xl font-black tracking-tight text-base-content sm:text-3xl"
            >
              Start with one thought. Leave with the good weird stuff.
            </h2>
            <p
              class="mt-3 max-w-2xl text-sm leading-6 text-base-content/75 sm:text-base"
            >
              Brainstorm is for creative divergence: ask for a deliberate batch
              of different directions, keep the sparks, reject the beige, and
              shape the survivors into something worth using.
            </p>
          </div>

          <div
            class="shrink-0 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-base-content/80"
          >
            <p class="font-bold text-secondary">Text first</p>
            <p class="mt-1 max-w-48 leading-5">
              Ideas before images. Human taste stays in charge.
            </p>
          </div>
        </div>

        <div
          class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Brainstorm workflow"
        >
          <article
            v-for="step in workflow"
            :key="step.title"
            class="rounded-2xl border border-base-content/10 bg-base-200/55 p-4"
          >
            <div
              class="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-base-100 text-lg shadow-sm"
              aria-hidden="true"
            >
              {{ step.icon }}
            </div>
            <p
              class="text-xs font-black uppercase tracking-[0.16em] text-base-content/45"
            >
              {{ step.kicker }}
            </p>
            <h3 class="mt-1 font-black text-base-content">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-5 text-base-content/65">
              {{ step.body }}
            </p>
          </article>
        </div>
      </div>
    </div>

    <div
      class="kr-panel-flat border border-base-content/10 bg-base-100/85 p-5 shadow-lg backdrop-blur sm:p-7"
    >
      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p
            class="text-xs font-black uppercase tracking-[0.18em] text-base-content/45"
          >
            The useful part of the old machine
          </p>
          <h3 class="mt-2 text-xl font-black text-base-content sm:text-2xl">
            Every idea gets its own fate.
          </h3>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-base-content/70">
            A batch is not one disposable answer. Individual candidates can be
            kept, edited, rejected, regenerated, or branched without flattening
            the rest of the session. The model proposes. You decide what
            deserves oxygen.
          </p>
        </div>

        <div class="flex flex-wrap gap-2 lg:max-w-72 lg:justify-end">
          <span
            v-for="action in candidateActions"
            :key="action"
            class="rounded-full border border-base-content/10 bg-base-200/70 px-3 py-1.5 text-xs font-bold text-base-content/70"
          >
            {{ action }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="rounded-2xl border border-dashed border-base-content/20 bg-base-100/55 p-5 text-center sm:p-7"
    >
      <p class="text-sm font-bold text-base-content/75">
        The dedicated Brainstorm room is back in its proper place.
      </p>
      <p class="mx-auto mt-1 max-w-2xl text-sm leading-5 text-base-content/55">
        The restored generation and curation controls live here next, using the
        current text-server stack rather than the old Dream-gallery workaround.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const workflow = [
  {
    icon: '✎',
    kicker: '01 · Pitch',
    title: 'Give it a premise',
    body: 'A sentence, problem, joke setup, art target, half-formed thought, or suspiciously specific constraint.',
  },
  {
    icon: '✦',
    kicker: '02 · Diverge',
    title: 'Ask for real variety',
    body: 'Choose how many directions you want. Different concepts count; noun-swapped clones do not.',
  },
  {
    icon: '◇',
    kicker: '03 · Curate',
    title: 'Exercise human taste',
    body: 'Keep, reject, edit, regenerate, and branch ideas independently instead of accepting a whole batch at once.',
  },
  {
    icon: '↗',
    kicker: '04 · Reuse',
    title: 'Send survivors onward',
    body: 'Turn the chosen material into prompts, characters, Dreams, art directions, or whatever the next tool needs.',
  },
] as const

const candidateActions = [
  'Keep',
  'Edit',
  'Reject',
  'Regenerate',
  'More like this',
] as const
</script>
