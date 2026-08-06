---
title: 'Account'
room: 'Account & Privacy'
subtitle: 'Your settings, your consent'
description: Change your password, verify your email, tune privacy and consent, and manage newsletter updates.
image: splash/dashboard.png
icon: kind-icon:settings
tooltip: Manage your password, privacy, and email preferences.
dottiTip: This is the room where you decide who gets to see the good stuff.
amiTip: Consent-first controls — your visibility, your inbox, your call.
channelKey: home
tabKey: account
requiredPermission: authenticated
loadingMessage: Loading account settings...
refreshLabel: Refresh account
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/account-mobile
backgroundTablet: /api/art/backdrop/account-tablet
backgroundDesktop: /api/art/backdrop/account-desktop
---

:account-settings
