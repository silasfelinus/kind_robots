---
title: 'Newsfeed'
room: 'Newsfeed'
subtitle: 'The front page the swarm writes itself.'
description: A programmable, remixable homepage feed of fresh art, stories, and milestones.
image: nav/heroes/home.webp
icon: kind-icon:scroll
tooltip: See what the swarm is making right now.
channelKey: plan
tabKey: newsfeed
dashboardKey: wonder
dashboardTab: newsfeed
cards: navCards
loadingMessage: Setting the front page...
refreshLabel: Refresh the feed
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/newsfeed-mobile
backgroundTablet: /api/art/backdrop/newsfeed-tablet
backgroundDesktop: /api/art/backdrop/newsfeed-desktop
---

:newsfeed-page
