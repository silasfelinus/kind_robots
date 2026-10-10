---
contentType: channel
channelKey: projects
label: Play
title: Play
room: The Workshop
subtitle: Make things, practice, and play games
description: Make images and video, brainstorm ideas, practice singing and Mandarin, or play arcade cabinets, card dungeons, and other games, many built by the Kind Robots agents.
icon: kind-icon:blueprint
image: /images/arcade/arcade-hall-backdrop.webp
route: /art
defaultTab: art
sort: 40
loadingMessage: Opening the workshop...
refreshLabel: Refresh Play
dottiTip: Every bench in this workshop holds something to make or something to play.
amiTip: Several of these the robots built mostly on their own. I checked them for goblins. Mostly.
tutorial:
  title: Play
  tagline: Make art, practice a skill, or play a game.
  overview: >-
    Play holds the hands-on parts of Kind Robots. Some tabs make things, like
    images, short video clips and music videos. Some help you practice singing
    or Mandarin. The rest are games and toys, many of them built mostly by the
    Kind Robots agents. Pick a tab from the Play menu; each one explains its
    own controls in this sidebar.
  hero: /images/arcade/arcade-hall-backdrop.webp
  sections:
    - key: make
      title: Make images, clips and music videos
      body: >-
        Art opens on the Image Generator: pick a recipe, write a prompt and
        press Generate, then find the results in the Gallery. Video Gen turns a
        still image into a short animated clip. Music Video shows finished
        videos and lets you remix one into your own draft. Brainstorm produces
        batches of ideas or art prompts and can send the ones you keep
        straight to image generation. Generating costs mana, so sign in first.
      image: /images/art/generate.webp
    - key: learn
      title: Practice singing and Mandarin
      body: >-
        Music Mentor takes a recording of your singing and gives feedback on
        pitch, timing, dynamics and arrangement. The audio is analyzed in your
        browser and does not leave your device, and the coaching costs mana.
        Mandarin is a free course that shows how each character is built from
        its parts, lets you hear it, and then asks you to recall it and rate
        how well you knew it.
      image: /images/mandarin-tutor/cards/v2/f24c02b7272a3d3004079114.webp
    - key: games
      title: Play a game
      body: >-
        The Arcade is a hall of free cabinets, each an original game based on a
        classic, with worldwide high-score boards and no account needed. Memory
        Dungeon is a card-matching game with lives, power-ups and floors to
        clear. The Ruler Is Hooked has you fishing for your kingdom between
        royal decisions. Zuzu Gamebook is an illustrated adventure with
        choices, dice rolls and several endings.
      image: /images/background/memorydungeon.webp
    - key: toys
      title: Try the toys and the gallery
      body: >-
        Rebel Button is a button you are told not to press; each press changes
        its message and adds to a click leaderboard. Cthulhuquarium is an idle
        aquarium where you collect coins, feed and breed strange creatures, and
        decorate the tank once you sign in. Tzaddikim is a sourced gallery of
        people worth celebrating, where signed-in visitors can nominate and
        react.
      image: /images/channels/play/aquarium.webp
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before. The slug stays `plan`
# (Plan folded into Projects and Admin 2026-10-06) so its generated drafting-hall
# art keeps resolving.
backgroundMobile: /api/art/backdrop/plan-mobile
backgroundTablet: /api/art/backdrop/plan-tablet
backgroundDesktop: /api/art/backdrop/plan-desktop
---

Silas, 2026-10-06: everything that isn't Storybook and isn't admin-gated. Tools
first, then the games and toys that were largely AI-created. A project scaffolded
from an approved daily pitch gets a tab here once it has something playable.
