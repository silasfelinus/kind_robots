---
title: 'Wallet'
room: 'Wallet'
subtitle: 'Your karma and mana, in one place'
description: Check your karma balance, mana balance, and recent activity for both.
image: splash/dashboard.png
icon: kind-icon:bag
tooltip: Your karma and mana balances, and how you earned them.
dottiTip: Karma tracks how much good you've done here; mana is what you spend to make things.
amiTip: One tracks kindness, the other tracks fuel. Neither one runs out if you keep showing up.
channelKey: home
tabKey: wallet
dashboardKey: user
dashboardTab: profile
requiredPermission: authenticated
loadingMessage: Loading wallet...
refreshLabel: Refresh wallet
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/wallet-mobile
backgroundTablet: /api/art/backdrop/wallet-tablet
backgroundDesktop: /api/art/backdrop/wallet-desktop
---

:wallet-page
