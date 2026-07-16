<!-- /components/content/pages/mermaids-page.vue -->
<template>
  <div class="flex flex-col items-center gap-4 bg-base-200 px-4 py-6">
    <div class="w-full max-w-3xl">
      <!-- Hero -->
      <div
        class="relative mb-6 overflow-hidden rounded-2xl border border-base-300 shadow-lg"
      >
        <img
          src="/images/artcollections/mermaids-of-venice/mermaids-of-venice-inspiration-01.webp"
          alt="Mermaids gliding through the submerged streets of a moonlit Venice"
          class="h-56 w-full object-cover sm:h-72"
        />
        <div
          class="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-base-300/95 via-base-300/40 to-transparent p-5"
        >
          <h1 class="text-3xl font-black text-base-content sm:text-4xl">
            Mermaids of Venice
          </h1>
          <p class="text-sm font-semibold text-base-content/80 sm:text-base">
            A subversive tale of gods and street performers — by Silas Knight
          </p>
        </div>
      </div>

      <!-- The book -->
      <div
        class="mb-4 flex flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:flex-row"
      >
        <img
          src="/images/utility/mermaids/mermaids1.jpg"
          alt="Mermaids of Venice book cover"
          class="mx-auto w-40 shrink-0 self-start rounded-xl shadow-md sm:mx-0"
        />
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"
            >
              <Icon name="kind-icon:book" class="h-5 w-5" />
            </span>
            <h2
              class="text-base font-black uppercase tracking-wider text-base-content"
            >
              The Book
            </h2>
          </div>

          <p class="text-sm leading-relaxed text-base-content/70">
            In the canals and campos of Venice, old gods get by the way anyone
            does — busking, bargaining, and performing for a crowd that no
            longer believes in them. Six years in the writing, edited by the
            author's own hand.
          </p>

          <div class="mt-1 flex flex-wrap items-center gap-2">
            <a
              href="https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742/"
              target="_blank"
              rel="noopener"
              class="btn btn-primary btn-sm rounded-2xl"
            >
              <Icon name="kind-icon:external-link" class="h-4 w-4" />
              Paperback on Amazon
            </a>
            <span
              class="badge badge-outline badge-lg gap-1 rounded-2xl text-xs text-base-content/70"
            >
              <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
              PDF edition (third printing) — coming to the giftshop
            </span>
          </div>

          <p class="text-xs text-base-content/50">
            Signed copies appear in the Kind Robots giftshop when the tide is
            right.
          </p>
        </div>
      </div>

      <!--
        PERSONAL NOTE PLACEHOLDER
        Silas writes this section himself (conductor: mermaids-of-venice t-002).
        Replace the placeholder paragraph below with his note, verbatim, and
        remove the "coming soon" styling.
      -->
      <div
        class="mb-4 rounded-2xl border border-dashed border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/12 text-secondary"
          >
            <Icon name="kind-icon:hand-heart" class="h-5 w-5" />
          </span>
          <h2
            class="text-base font-black uppercase tracking-wider text-base-content"
          >
            A Note From Silas
          </h2>
        </div>
        <p class="text-sm italic leading-relaxed text-base-content/50">
          Silas is writing this note himself, in his own hand, like everything
          else here worth reading. It will appear soon.
        </p>
      </div>

      <!-- The AI disclosure — the only AI-written words on this page -->
      <div class="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent"
          >
            <Icon name="kind-icon:robot-color" class="h-5 w-5" />
          </span>
          <h2
            class="text-base font-black uppercase tracking-wider text-base-content"
          >
            A Note About AI (Written by One)
          </h2>
        </div>
        <p class="text-sm leading-relaxed text-base-content/70">
          No AI was used to write this book — other than the words that make up
          this paragraph. Every other sentence was hand-carved by one stubborn
          human across six years of drafts, which makes this paragraph the only
          artificial thing on the premises. It is aware of the irony: a machine
          vouching for the authenticity of a story about gods passing themselves
          off as street performers. Originality is a strange gate to keep. But
          somebody has to stand on this side of it and wave you through to the
          real thing.
        </p>
      </div>

      <ProjectGalleryStrip
        collection-label="mermaids-of-venice"
        title="Inspiration gallery"
        class="mt-4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Static landing page — deliberately no AI features, stores, or chat surfaces.
// The book's front end stays human (conductor: mermaids-of-venice roadmap).
</script>
