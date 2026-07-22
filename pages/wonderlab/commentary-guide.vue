<!-- /pages/wonderlab/commentary-guide.vue -->
<template>
  <section class="h-full min-h-0 overflow-y-auto p-4 sm:p-6">
    <div class="mx-auto flex max-w-5xl flex-col gap-5">
      <NuxtLink to="/wonderlab" class="btn btn-ghost btn-sm w-fit rounded-xl">
        <Icon name="kind-icon:arrow-left" class="size-4" />
        Back to WonderLab
      </NuxtLink>

      <header
        class="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-lg"
      >
        <div
          class="bg-linear-to-br from-primary/20 via-secondary/10 to-accent/20 p-6 sm:p-8"
        >
          <p class="text-xs font-black uppercase tracking-[0.22em] text-primary">
            WonderLab editorial playbook
          </p>
          <h1 class="mt-2 text-3xl font-black sm:text-5xl">
            Commentary Voice Guide
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-base-content/70">
            Stars carry the evaluation. The words are a glimpse of the Bot or
            Character who left them.
          </p>
        </div>
      </header>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="rounded-3xl border border-success/35 bg-success/5 p-5 sm:p-6">
          <div class="flex items-center gap-3">
            <Icon name="kind-icon:star" class="size-7 text-success" />
            <h2 class="text-2xl font-black">What works</h2>
          </div>
          <ul class="mt-4 space-y-3 text-sm leading-relaxed text-base-content/75">
            <li>
              <strong>Write the personality, not a report.</strong> Let the assigned
              speaker joke, mutter, emote, misunderstand, notice one tiny detail,
              or react without explaining the Component.
            </li>
            <li>
              <strong>Let verbosity belong to the speaker.</strong> One word, one
              sentence, a stage direction, a compact observation, or an occasional
              monologue are all valid.
            </li>
            <li>
              <strong>Use the exhibit as scenery.</strong> Ground the flavor in
              something real the Component does, but mention implementation only
              when that personality would naturally care about it.
            </li>
            <li>
              <strong>Preserve the cast.</strong> Keep the chosen author and star
              rating unless a curator explicitly changes the assignment or
              evaluation.
            </li>
          </ul>
        </article>

        <article class="rounded-3xl border border-error/30 bg-error/5 p-5 sm:p-6">
          <div class="flex items-center gap-3">
            <Icon name="kind-icon:x" class="size-7 text-error" />
            <h2 class="text-2xl font-black">What reads wrong</h2>
          </div>
          <ul class="mt-4 space-y-3 text-sm leading-relaxed text-base-content/75">
            <li>
              Function lists, prop inventories, import summaries, and technical
              completeness disguised as dialogue.
            </li>
            <li>
              A shared house voice, repeated templates, identical sentence shapes,
              or comments padded to the same length.
            </li>
            <li>
              Explaining every visible behavior when the speaker would only care
              about one strange button, one feeling, or nothing beyond a purr.
            </li>
            <li>
              Invented behavior, testing claims, accessibility claims, security
              claims, or runtime certainty that the exhibit does not establish.
            </li>
          </ul>
        </article>
      </section>

      <section class="rounded-3xl border border-base-300 bg-base-100 p-5 sm:p-7">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-widest text-primary">
              Deliberate range
            </p>
            <h2 class="mt-1 text-2xl font-black">Different voices take different space</h2>
          </div>
          <span class="badge badge-outline rounded-xl">Uniform length is a defect</span>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <blockquote class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-lg font-black italic">*purrs*</p>
            <footer class="mt-3 text-xs text-base-content/50">Nonverbal flavor</footer>
          </blockquote>
          <blockquote class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-lg font-black">Aisles clear.</p>
            <footer class="mt-3 text-xs text-base-content/50">Micro commentary</footer>
          </blockquote>
          <blockquote class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-sm leading-relaxed">
              A title can wait here without being forgotten. Star it. Come back
              when the snow is quieter.
            </p>
            <footer class="mt-3 text-xs text-base-content/50">Quiet character beat</footer>
          </blockquote>
          <blockquote class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <p class="text-sm leading-relaxed">
              A theatrical, obsessive, or rambling personality may take the whole
              stage when the longer performance is genuinely theirs.
            </p>
            <footer class="mt-3 text-xs text-base-content/50">Full voice performance</footer>
          </blockquote>
        </div>
      </section>

      <section class="rounded-3xl border border-accent/35 bg-accent/5 p-5 sm:p-7">
        <p class="text-xs font-black uppercase tracking-widest text-accent">
          Calibration rule
        </p>
        <h2 class="mt-1 text-2xl font-black">Components are the rehearsal room</h2>
        <p class="mt-3 max-w-4xl text-sm leading-relaxed text-base-content/70">
          WonderLab Components are intentionally the first commentary surface:
          most visitors will never encounter this full museum, so the cast can be
          tuned here before the same system expands to Bots, Characters, Dreams,
          ArtImages, and other models. Carry the voice principles forward; do not
          carry forward technical-review habits that happened to survive an early
          batch.
        </p>
      </section>

      <section class="rounded-3xl border border-primary/30 bg-primary/5 p-5 sm:p-7">
        <h2 class="text-xl font-black text-primary">Before publishing</h2>
        <ol class="mt-4 grid gap-3 text-sm leading-relaxed text-base-content/75 md:grid-cols-2">
          <li class="rounded-2xl bg-base-100 p-4">
            <strong>1. Read the assigned profile.</strong> Voice, personality,
            sample dialogue, and recurring obsessions matter more than coverage.
          </li>
          <li class="rounded-2xl bg-base-100 p-4">
            <strong>2. Experience the exhibit.</strong> Find the one real detail
            this speaker would notice.
          </li>
          <li class="rounded-2xl bg-base-100 p-4">
            <strong>3. Check the silhouette.</strong> The page should visibly mix
            tiny, short, medium, and occasional long comments.
          </li>
          <li class="rounded-2xl bg-base-100 p-4">
            <strong>4. Remove the review voice.</strong> When the stars already say
            whether it is good, the text is free to be alive.
          </li>
        </ol>
      </section>
    </div>
  </section>
</template>
