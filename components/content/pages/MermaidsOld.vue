<template>
  <div class="bg-base-200 p-8 flex flex-col md:flex-row">
    <!-- Main Content -->
    <section class="prose prose-lg max-w-3xl mb-12 md:mb-4 md:mr-12">
      <header class="text-center mb-12">
        <img :src="image" alt="Background Image" class="w-1/4 mx-auto mb-4" />
        <h1 class="text-4xl font-bold">
          {{ title }}
        </h1>
        <h2 class="text-2xl font-semibold">
          {{ subtitleRef }}
        </h2>
        <a :href="amazonLink" class="btn btn-primary block w-max mx-auto mb-8"
          >Amazon link</a
        >
      </header>

      <h2 class="text-3xl">
        The Many Literary Offenses of Silas Michael Knight
      </h2>
      <p class="text-xl">by Silas Michael Knight</p>
      <h2 class="text-2xl p-2 text-center">(Author's Disclaimer)</h2>
      <p class="text-xl p-2">
        Mermaids of Venice is a polytheistic love story with rhyming couplets at
        the start of each chapter. It features an attractive cover, perfect for
        adorning a coffee table or complementing a reader's face. It is also,
        unfortunately, not without its flaws
      </p>
      <ul class="list-disc list-inside text-xl p-2">
        <li>
          <strong>Overuse of $5 words:</strong> The narrative is laden with
          saccharine sesquipedalians, a deliberate choice to convince readers
          that the author was "VeRY SmaRt."
        </li>
        <li>
          <strong>Breaking character arc conventions:</strong> The first act
          ends with the abrupt death of the main character, a significant
          deviation from traditional rules for character arcs.
        </li>
        <li>
          <strong>Similarities to existing works:</strong> Readers familiar with
          <a
            href="https://www.amazon.com/Soul-Music-Discworld-Terry-Pratchett/dp/0062237411"
            class="underline text-blue-600 hover:text-blue-800"
            >Terry Pratchett's Soul Music</a
          >
          might recognize Bernard's "nearly invisible" superpower/personality.
        </li>
        <li>
          <strong>Use of the magical negro trope:</strong> Despite the affection
          for the character Hermes, the book utilizes the
          <a
            href="https://en.wikipedia.org/wiki/Magical_Negro"
            class="underline text-blue-600 hover:text-blue-800"
            >magical negro trope</a
          >, relegating him to a plot device role and discarding him after a
          single chapter.
        </li>
      </ul>

      <p class="text-xl p-2">
        I'm proud that my third act foreshadowed the Occupy Wall Street
        movement, but after #BLM, #MeToo, and raising two boy-children during
        extended quarantine, any modification to "Mermaids of Venice" stinks of
        revisionism. Nonetheless, the book reflects six years of dedicated work,
        a
        <a
          href="https://www.kickstarter.com/projects/silasknight/mermaids-of-venice"
          target="_blank"
          class="underline text-blue-600 hover:text-blue-800"
          rel="noopener noreferrer"
          >successful Kickstarter</a
        >, and a series of adventures as an acrobatic
        <span
          class="underline text-blue-600 hover:text-blue-800"
          @mouseover="showEuropeImage1 = true"
          @click="showEuropeImage1 = true"
          >street performer</span
        >
        which guided my narrative.
      </p>

      <p class="text-xl p-2">
        "Mermaids" was conceived as a force for good, but time has reshaped my
        perception of what constitutes "good." With this in mind, anyone lacking
        funds is invited to
        <a
          href="/mermaids.pdf"
          class="underline text-blue-600 hover:text-blue-800"
          >download the PDF for free</a
        >
        and everyone is invited to use their money instead to
        <a
          href="/projects/amibot"
          class="underline text-blue-600 hover:text-blue-800"
          >purchase mosquito nets</a
        >.
        <ami-link />
      </p>
    </section>

    <!-- Quotes on the Right Side Panel -->
    <aside class="w-full md:w-1/3 mt-8 md:mt-0">
      <blockquote
        class="p-4 mb-6 border-l-4 border-gray-800 italic text-center"
      >
        "Mermaids of Venice is a literary ballerina - supple, strong,
        astonishing, and captivating in a way that makes your heart race. From
        the first line to the last, I was thoroughly engrossed. It's akin to a
        roller-coaster - once you're on, you're committed to the ride." - Amazon
        Review
      </blockquote>

      <blockquote class="p-4 mb-6 border-l-4 border-gray-800 italic">
        "Smart, sexy, and delightfully subversive, I devoured 'Mermaids of
        Venice' the first time I read it. It made me laugh, cry, and gave me
        goosebumps. A linguistically unique treat I highly recommend!" -C Curtis
      </blockquote>

      <blockquote class="p-4 mb-6 border-l-4 border-gray-800 italic">
        "It's a rarity for a novel to make me laugh out loud, but this one
        managed that feat frequently – for its humor, surprises, wit, heart, and
        magical richness. Silas Knight is truly a master of prose." -C. Kinnamon
      </blockquote>
    </aside>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Mermaids of Venice')
const subtitleRef = ref('A subversive fairy tale of gods and street performers.')
const image = ref('/images/utility/mermaids/mermaids1.jpg')
const amazonLink = ref(
  'https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742',
)

const showEuropeImage1 = ref(false)
</script>
