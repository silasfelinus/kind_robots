<!-- /components/conductor/aquarium-page.vue
     The aquarium is a console game, not a scrolling project landing page.
     The app shell owns viewport height and the page's only kr-stage fills it.
     Existing project metadata remains in Kind Robots/Conductor and the site
     navbar still provides route identity and tutorial navigation. Admin
     monster curation lives in the game's World & story room. -->
<template>
  <div class="kr-surface relative bg-base-200">
    <div class="kr-stage">
      <CthulhuquariumPlay />
    </div>
  </div>
</template>
