---
title: Checkout Cancelled
room: Butterfly Checkout
description: Return safely from Stripe without losing the cart.
icon: kind-icon:cart
image: splash/sanctuary.png
loadingMessage: Restoring the cart...
refreshLabel: Refresh checkout status
# Stage 3 backdrop art, resolved by slug via /api/art/backdrop/<page>-<variant>.
# The route finds the completed ArtJob for this page and redirects to its
# image, so art appears on its own once generation finishes. Until then the
# route 404s and the page renders exactly as before.
backgroundMobile: /api/art/backdrop/shop-cancel-mobile
backgroundTablet: /api/art/backdrop/shop-cancel-tablet
backgroundDesktop: /api/art/backdrop/shop-cancel-desktop
---

:checkout-cancel
