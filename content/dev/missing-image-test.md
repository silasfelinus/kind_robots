---
title: Missing Image Pipeline Test
subtitle: Deliberately broken images for Conductor art-request testing
description: Admin-only smoke test instructions for the Kind Robots missing-image reporter.
icon: kind-icon:warning
image: /images/dev/conductor-missing-image-pipeline-test-card.webp
navigation: false
---

# Missing Image Pipeline Test

This page intentionally contains missing image URLs so the global Kind Robots image-error reporter can create Conductor art prompt requests.

Use it only while logged in as an admin. Non-admin users may load the page, but the reporter should not write to Conductor unless admin auth is available.

## Expected behavior

1. Open this page as an admin.
2. The broken image below should fail to load.
3. The browser plugin should POST to `/api/conductor/art-request`.
4. The server route should verify the image is still missing in GitHub.
5. Conductor should receive a new `requests:` entry in `projects/art-prompts.yaml`.
6. Refresh the Conductor workspace and confirm the request is visible in the Art Prompts section.

## Local Kind Robots public image test

This image should map to `silasfelinus/kind_robots` → `public/images/dev/conductor-missing-image-pipeline-test-card.webp`.

![Conductor missing image pipeline test card](/images/dev/conductor-missing-image-pipeline-test-card.webp)

## Raw Conductor project image test

This image should map to `silasfelinus/conductor` → `projects/images/conductor-missing-image-pipeline-test-hero.webp`.

![Conductor missing image pipeline test hero](https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images/conductor-missing-image-pipeline-test-hero.webp)

## Cleanup after the smoke test

After the test is confirmed, either generate and commit the requested images or remove the test entries from Conductor’s `requests:` queue. This page can stay as a smoke-test route, but it should not be linked from public navigation.
