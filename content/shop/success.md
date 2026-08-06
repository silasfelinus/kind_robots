---
title: Payment Confirmation
room: Butterfly Checkout
description: Verify the completed Stripe payment before clearing the local cart.
icon: kind-icon:check
image: splash/sanctuary.png
loadingMessage: Confirming the Stripe receipt...
refreshLabel: Verify payment again
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/shop-success-mobile
backgroundTablet: /api/art/backdrop/shop-success-tablet
backgroundDesktop: /api/art/backdrop/shop-success-desktop
---

:checkout-success
