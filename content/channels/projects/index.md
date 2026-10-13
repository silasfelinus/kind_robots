---
contentType: channel
channelKey: projects
label: Play
title: Play
room: The Workshop
subtitle: Storybook, creative tools, and playful experiments
description: Make stories in Storybook, create art and video, practice skills, and explore playful experiments. Arcade and Zuzu adventures have their own channels.
icon: kind-icon:blueprint
image: /images/arcade/arcade-hall-backdrop.webp
backgroundMobile: /api/art/backdrop/play-mobile
backgroundTablet: /api/art/backdrop/play-tablet
backgroundDesktop: /api/art/backdrop/play-desktop
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
    Play starts with Storybook; open its submenu for characters, dreams, bots,
    facets, rewards, scenarios and model tools. Play also holds art and video
    studios, skill practice, and experiments. Arcade and Zuzu now have their
    own channels. Each destination explains its controls in this sidebar.
  hero: /images/arcade/arcade-hall-backdrop.webp
  sections:
    - key: storybook
      title: Storybook and its ingredients
      body: >-
        Start with Storybook to weave an interactive narrative. Expand the
        Storybook submenu for its ingredient galleries and model tools.
      image: /images/channels/play/channel.webp
    - key: make
      title: Make images, clips and music videos
      body: >-
        Art opens on the Image Generator: pick a recipe, write a prompt and
        press Generate, then find the results in the Gallery. Video Gen turns a
        still image into a short animated clip. Music Video shows finished
        videos and lets you remix one into your own draft. Generating costs mana,
        so sign in first.
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
        Arcade now has its own channel of free cabinets and leaderboards.
        Zuzu has a separate channel for his story, Shifting Lands board,
        fighting game and pinball. Memory
        Dungeon is a card-matching game with lives, power-ups and floors to
        clear. Zuzu Gamebook is an illustrated adventure with choices, dice
        rolls and several endings. Daily Dream Projects shows approved
        pitches, their coming-soon previews, and experiences ready for play.
        Administrators can also find in-development Zuzu playtests in this menu.
      image: /images/background/memorydungeon.webp
    - key: toys
      title: Try the toys and the gallery
      body: >-
        Rebel Button is a button you are told not to press; each press changes
        its message and adds to a click leaderboard. Cthulhuquarium is an idle
        aquarium where you collect coins, feed and breed strange creatures, and
        decorate the tank once you sign in. Other experiments and creative toys are also available
        from this menu.
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
