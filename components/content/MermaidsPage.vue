<template>
  <div class="bg-base p-8 text-gray-800 flex flex-col md:flex-row">
    <!-- Main Content -->
    <section class="prose prose-lg max-w-3xl mb-12 md:mb-4 md:mr-12">
      <header class="text-center mb-12">
        <img :src="image" alt="Background Image" class="w-1/4 mx-auto mb-4" />
        <h1 class="text-4xl font-bold">{{ title }}</h1>
        <h2 class="text-2xl font-semibold">{{ subtitle }}</h2>
        <a :href="amazonLink" class="btn btn-primary block w-max mx-auto mb-8">Amazon link</a>
      </header>

      <h2 class="text-3xl p-2">Author's Disclaimer</h2>
      <p class="text-xl p-2">
        Mermaids of Venice is a polytheistic love story with rhyming couplets at the start of each
        chapter. It features an attractive cover, perfect for adorning a coffee table or
        complementing a reader's face. It's also laden with $5 words, overstuffed with saccharine
        sesquipedalians to convince readers that its author was VeRY SmaRt. The first act ends with
        the abrupt death of the main character, and admirers of
        <a
          href="https://www.amazon.com/Soul-Music-Discworld-Terry-Pratchett/dp/0062237411"
          class="underline text-blue-600 hover:text-blue-800"
          >Terry Pratchett's Soul Music</a
        >
        should easily recognize Bernard's "nearly invisible" superpower/personality.
      </p>

      <p class="text-xl p-2">
        Those are the venial sins of a young writer searching for a voice. I am much more critical
        of my unexamined use of the
        <a
          href="https://en.wikipedia.org/wiki/Magical_Negro"
          class="underline text-blue-600 hover:text-blue-800"
          >magical negro trope</a
        >. To be clear, I was educated of the trope before publication by my respected friend and
        hive-editor Adam Creighton. But I brushed the note aside, caring more about getting the
        Kickstarter to publication.
      </p>

      <p class="text-xl p-2">
        I intended Hermes, my street performing magician, to be a delightful, affirmative figure.
        Like many other characters, Hermes had a real life analogue. But Hermes was a plot device, a
        token POC appearing long enough to gift our white-male protagonist a magical Mcguffin before
        disappearing from the narrative. Hermes' chapter lacked the investigations of sex, gender,
        and intimacy that play out in the rest of the novel, and in an evening I once shared with
        the kind stranger that Hermes inspired, when I was stuck overnight with a backpack and three
        juggling clubs at a San Francisco bus depot.
      </p>

      <p class="text-xl p-2">
        Absent the contextual personalization, I relegated Hermes to a social device, existing to
        demonstrate that I was a liberal writer comfortable with a multi-cultural cast. I cannot
        deny that even now, I use him to contextualize my personal growth and my work's relevance to
        contemporary culture.
      </p>
      <p class="text-xl p-2">
        If I was to rewrite Mermaids, Bernard's arc would culminate not with a reunion with his
        estranged father, but with Hermes. Instead of a cathartic confrontion with the past, Bernard
        would be given an opportunity to examine the nuanced context of generational trauma and
        cultural privilege that elevated him to his divine status.
      </p>

      <p class="text-xl p-2">
        But I wrote "Mermaids" as a young man, with self-doubt and imperfections. I'm proud that my
        third act foreshadowed the Occupy Wall Street movement, but I was calling out undercurrents
        of social unrest that were only ripples in my pond. After #BLM and #MeToo, after raising two
        boy-identified children during extended quarantine, any modification to "Mermaids of Venice"
        stinks of revisionism. Nonetheless, the book reflects six years of dedicated work, a
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
        "Mermaids" was conceived as a force for good, but time has reshaped my perception of what
        constitutes "good." With this in mind, anyone lacking funds is invited to
        <a href="/mermaids.pdf" class="underline text-blue-600 hover:text-blue-800"
          >download the PDF for free</a
        >
        and everyone is invited to use their money instead to
        <a href="/projects/amibot" class="underline text-blue-600 hover:text-blue-800"
          >purchase mosquito nets</a
        >.
        <ami-link />
      </p>
    </section>

    <!-- Quotes on the Right Side Panel -->
    <aside class="w-full md:w-1/3 mt-8 md:mt-0">
      <blockquote class="p-4 mb-6 border-l-4 border-gray-800 italic text-center">
        "Mermaids of Venice is a literary ballerina - supple, strong, astonishing, and captivating
        in a way that makes your heart race. From the first line to the last, I was thoroughly
        engrossed. It's akin to a roller-coaster - once you're on, you're committed to the ride." -
        Amazon Review
      </blockquote>

      <blockquote class="p-4 mb-6 border-l-4 border-gray-800 italic">
        "Smart, sexy, and delightfully subversive, I devoured 'Mermaids of Venice' the first time I
        read it. It made me laugh, cry, and gave me goosebumps. A linguistically unique treat I
        highly recommend!" -C Curtis
      </blockquote>

      <blockquote class="p-4 mb-6 border-l-4 border-gray-800 italic">
        "It's a rarity for a novel to make me laugh out loud, but this one managed that feat
        frequently – for its humor, surprises, wit, heart, and magical richness. Silas Knight is
        truly a master of prose." -C. Kinnamon
      </blockquote>
    </aside>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const title = ref('Mermaids of Venice')
const subtitle = ref('A subversive fairy tale of gods and street performers.')
const image = ref('/images/utility/mermaids/mermaids1.jpg')
const amazonLink = ref('https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742')
const downloadLink = ref('/mermaids.pdf')
const mosquitoNetsLink = ref('/projects/amibot')
const europePic1 = ref('/images/utility/mermaids/europe1.png')
const europePic2 = ref('/images/utility/mermaids/europe2.jpg')
const europePic3 = ref('/images/utility/mermaids/europe3.jpg')

const showEuropeImage1 = ref(false)
const showEuropeImage3 = ref(false)

function toggleEurope1Image() {
  showEuropeImage1.value = !showEuropeImage1.value
}

function toggleEurope3Image() {
  showEuropeImage3.value = !showEuropeImage3.value
}
</script>
