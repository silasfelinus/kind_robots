---
contentType: tab
channelKey: admin
tabKey: site-stats
label: Site Stats
title: Site Stats
subtitle: Are real people visiting and playing?
description: First-party, cookie-free daily counts of page views, visits, referrers and feature events. Only daily totals are stored, never IP addresses, user agents or user ids.
summary: Daily views, visits, referrers, events.
icon: kind-icon:chart
route: /admin/site-stats
sort: 49
requiredRole: ADMIN
tutorial:
  title: Site Stats
  body: >-
    Every page change adds one to that page's count for the day (Pacific
    time), with numeric and id segments folded together so /art/12345 counts
    as /art/:id. The first page of a browser session also counts one visit,
    filed under the referring site's host or direct. Features can record
    named events such as support:shown. Bots, prefetches, admin pages, signed
    in admins and browsers sending Do Not Track are skipped. Pick 7, 30 or 90
    days to see the daily views and visits chart (hover a day for its
    numbers, or open the daily table), the totals, and the top pages,
    referrers and events. Nothing identifying is stored, so a visit is a
    browser session, not a unique person.
  image: /images/art/resources.webp
---

Daily page views, visits, referrers and feature events for kindrobots.org.
