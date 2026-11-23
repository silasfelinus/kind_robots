---
contentType: channel
channelKey: projects
label: Projects
title: Projects
room: The Creative Workshop
subtitle: Stories, projects, creation and learning
description: Art, video, Mandarin, Rebel Button and other creative projects. Games live in Play.
icon: kind-icon:blueprint
image: /images/art/generate.webp
backgroundMobile: /api/art/backdrop/play-mobile
backgroundTablet: /api/art/backdrop/play-tablet
backgroundDesktop: /api/art/backdrop/play-desktop
route: /conductor
defaultTab: projects
sort: 40
loadingMessage: Opening the projects...
refreshLabel: Refresh Projects
dottiTip: Every bench in this workshop holds something to make or something to play.
amiTip: Several of these the robots built mostly on their own. I checked them for goblins. Mostly.
tutorial:
  title: Projects
  tagline: Make art, build stories, explore projects.
  overview: >-
    Projects gathers a public project showcase and administrator-only planning controls,
    Art Studio, Video Studio (including Music Videos), Mandarin and Rebel Button. Games
    share the Play channel, including the Arcade and Zuzu's weird-west adventures. Each destination opens with
    its own page help, and this overview stays behind the About Projects
    control.
  hero: /images/tutorials/dream/dreams.webp
  sections:
    - key: make
      title: Make images, clips and music videos
      body: >-
        Art opens on the Image Generator: pick a recipe, write a prompt and
        press Generate, then find the results in the Gallery. Video Studio
        generates short clips and has a Music Videos tab for watching and
        remixing illustrated songs. Generating costs mana, so sign in first.
      image: /images/art/generate.webp
    - key: learn
      title: Practice Mandarin and singing
      body: >-
        Mandarin is a free course that shows how each character is built from
        its parts, lets you hear it, and then asks you to recall it and rate
        how well you knew it. Music Mentor, one of the Daily Dream Projects,
        takes a recording of your singing and gives feedback on pitch, timing,
        dynamics and arrangement; the audio is analyzed in your browser, and
        the coaching costs mana.
      image: /images/mandarin-tutor/cards/v2/f24c02b7272a3d3004079114.webp
    - key: games
      title: Where to find games
      body: >-
        Games have moved out of Projects. The Play channel holds the cabinets, Memory Dungeon, Downward Mobility,
        Cthulhuquarium, Ecotone, Emperor of Dust, Zuzu's gamebook, Shifting
        Lands, Showdown, Ghost Trail and the pinball table.
      image: /images/arcade/arcade-attract-splash.webp
    - key: toys
      title: New projects and toys
      body: >-
        Rebel Button is a button you are told not to press; each press changes
        its message and adds to a click leaderboard. Daily Dream project
        management now lives in Admin.
      image: /images/channels/play/button.webp
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
---

Public creative tools and project showcases live here. Storybook and its
ingredient managers are filed under Admin Retired; Music Videos is in
Projects Video Studio. Games live in Play.
