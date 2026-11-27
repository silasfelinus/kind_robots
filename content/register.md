---
title: 'Create a free account'
room: 'Registration Room'
subtitle: Welcome to the community
description: Create a free Kind Robots account to save game progress, keep the art you make and join the leaderboards. Games and stories stay free without one.
image: splash/register.png
tooltip: Make a free account to save game progress and keep the art you make.
amiTip: And keep track of who tries to beat me on the leaderboards!
icon: kind-icon:register
sort: highlight
dottiTip: If people register for an account, then we can customize their experience.
channelKey: home
tabKey: registration
dashboardKey: user
dashboardTab: profile
cards: navCards
loadingMessage: Loading registration
refreshLabel: Refresh registration
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/register-mobile
backgroundTablet: /api/art/backdrop/register-tablet
backgroundDesktop: /api/art/backdrop/register-desktop
---

:registration-page
