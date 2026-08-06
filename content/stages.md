---
title: 'Stages'
room: 'Stage Manager'
subtitle: 'A Infinite Rolodex of performances'
description: 'Create scenes between 1 or more Performers'
image: stage/splash.webp
icon: fa-solid:mask
tooltip: 'Meet the characters behind the chaos.'
dottiTip: I setup a stage for the bots to perform, and it's now devolved into utter chaos!
amiTip: You know what they say, You can't make a Hamlet without breaking some legs.
dashboardKey: character
dashboardTab: stage
cards: navCards
loadingMessage: Loading stage manager...
refreshLabel: Refresh Stages
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/stages-mobile
backgroundTablet: /api/art/backdrop/stages-tablet
backgroundDesktop: /api/art/backdrop/stages-desktop
---

:character-manager
