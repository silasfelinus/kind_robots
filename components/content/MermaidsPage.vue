<template>
  <div class="bg-base p-8 text-gray-800">
    <header class="text-center mb-12">
      <img :src="image" alt="Background Image" class="w-1/4 mx-auto" />
      <h1 class="text-4xl font-bold">{{ title }}</h1>
      <h2 class="text-2xl font-semibold">{{ subtitle }}</h2>
    </header>

    <section class="prose prose-lg max-w-3xl mx-auto">
      <a :href="amazonLink" class="btn btn-primary block w-max mx-auto mb-8">Amazon link</a>
      <h2 class="text-3xl">Author's disclaimer</h2>
      <p>This was a book written by a young man.</p>
      <p>I share his body, but I no longer hold his perspectives.</p>

      <p>
        "Mermaids of Venice" is fun (though the first act ends aggressively abruptly with the death
        of its main character). There are gems within it, but it commits at least three cardinal
        sins that make me unable to recommend it without qualifications:
      </p>
      <p>
        "Mermaids" is drenched with $5 words, reminiscent of the shortest horror story: "2 cups of
        vanilla extract", enough sweet sequipedalians to ensure the reader knew that the writer wAs
        vERy SmArT, and a flagrant literary theft of Pratchett's "almost invisible" concept. [Fans
        of
        <a
          href="https://www.amazon.com/Soul-Music-Discworld-Terry-Pratchett/dp/0062237411"
          class="underline text-blue-500"
          >Soul Music</a
        >
        should easily grok Bernard's "nearly invisible" superpower-slash-personality].
      </p>
      <p></p>
      <p>
        However, the most egregious sin (one that's truthfully restrained me from promoting the
        novel) is my unironic use of the
        <a href="https://en.wikipedia.org/wiki/Magical_Negro" class="underline text-blue-500"
          >magical negro trope</a
        >
      </p>
      <p>
        I was informed of the trope before publication (by my esteemed friend and hive-editor Adam
        Creighton), but I brushed it aside, caring more about getting the Kickstarter to
        publication. And besides, I thought: wasn't I doing good by including Hermes, my
        magician-slash-busker? Wasn't he charming? World-traveled? An idealized POC male character
        to demonstrate that I was a considerate liberal writer comfortable with a multi-cultural
        cast?
      </p>
      <p>
        So what if he failed to make an appearance after handing our disaffected white male
        protagonist the magic ticket he needs to progress. Yes, he was a street magician, but did he
        need to disappear from the narrative, never to be seen again (even in an extensive, chaotic
        finale that manages to include everyone except the hero's dead mother and a single
        throw-away character I professed to care about, yet relegated to a plot device).
      </p>
      <p>
        Post-BLM, post-#MeToo, post-raising two boy-children during extended quarantine, any changes
        I could make to "Mermaids of Venice" feel like reconstructionism.
      </p>
      <p>
        Despite its flaws, Mermaids represents 6-years of effort and intent, and its release after a
        <a
          href="https://www.kickstarter.com/projects/silasknight/mermaids-of-venice"
          class="underline text-blue-500"
          >successful Kickstarter</a
        >
        was a personal milestone (as were my European adventures as a street performer which
        inspired the storyline).
      </p>
      <div class="flex justify-center space-x-2">
        <img :src="europePic1" alt="Europe 1" class="h-64" />
        <img :src="europePic3" alt="Europe 3" class="h-64" />
      </div>
      <p>
        I'm proudest that my third act takeover of the Ubermarkt foreshadowed the Occupy Wall-Street
        movement, but the simmering boil I recognized was only a tiny bubble in my pond. I had no
        idea the effects I was truly observing, or the extent of the consequences to come.
      </p>
      <p>
        I started work on a sequel to Mermaids as a pitch for a VR game experience "Mermaids of
        Europa". The planning for that was changed, as many things were, by extended quarantine,
        after I grew disenchanted with a project that was only going to be enjoyed by those
        fortunate enough to have access to a high-end digital toy. (Obviously, there was plenty of
        residual guilt, being that I was one of those people). In any case, what came out of that
        investigation is now a website that you are looking at.
      </p>
    </section>
    <footer>
      <p class="text-center">
        With all of that said, feel free to buy "Mermaids of Venice". It has a lot of great ideas,
        often more than was warranted by plot or narrative structure. It has rhyming couplets at the
        start of each chapter. It's polyamorous and aims to be gender and relationship subversive.
        It has an attactive cover that looks great sitting on a coffee table or being opened by
        someone that you think has the ability to read. [
        <a href="/mermaids.pdf">Or download the pdf for free</a>, and use the money to
        <a href="/amibot">buy mosquito nets]</a>.
      </p>
      <p class="text-center">
        "Mermaids of Venice is a literary ballerina - supple and strong, astounding, beautiful in a
        way that makes your heart fight to get out of your chest. I was fully engrossed from the
        very first line to the last, feeling something like I was on a roller-coaster - you don't
        just get off once you're strapped in."" - Amazon Review
      </p>

      <p class="text-center">
        "Smart, sexy and delightfully subversive, I devoured Mermaids of Venice the first time I
        read it. It made me laugh, made me cry and gave me goosebumps. A beautifully unique
        linguistic treat, highly recommended!" -C Curtis
      </p>

      <p class="text-center">
        "I rarely laugh-out-loud reading novels, but this one has me at it at least once a page-
        because it's funny, because it's surprising, because it's full of wit, heart and magical
        delisciousness. Silas Knight is an artisan of prose." -C. Kinnamon
      </p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Mermaids of Venice')
const subtitle = ref('A subversive fairy tale in a world of gods and street performers.')
const image = ref('/images/utility/mermaids/mermaids1.jpg')
const amazonLink = ref('https://www.amazon.com/Mermaids-Venice-Silas-Knight/dp/0615516742')
const downloadLink = ref('/mermaids.pdf')
const mosquitoNetsLink = ref('/amibot')
const europePic1 = ref('/images/utility/mermaids/europe1.jpg')
const europePic2 = ref('/images/utility/mermaids/europe2.jpg')
const europePic3 = ref('/images/utility/mermaids/europe3.jpg')
</script>
