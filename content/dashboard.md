---
title: 'Human'
room: 'Dashboard Room'
subtitle: 'Your Private Page'
description: This is your space!
image: splash/dashboard.png
icon: kind-icon:settings
tooltip: User customizations and art sharing settings live here.
dottiTip: Everyone needs a personal space all to their own.
amiTip: Even I've got a bungalow in the cloud where I unwind.
channelKey: home
tabKey: dashboard
dashboardKey: user
dashboardTab: profile
cards: navCards
loadingMessage: Loading user dashboard
refreshLabel: Refresh dashboard
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/dashboard-mobile
backgroundTablet: /api/art/backdrop/dashboard-tablet
backgroundDesktop: /api/art/backdrop/dashboard-desktop
---

:user-manager
