<!-- /components/conductor/watchlist-page.vue -->
<template>
  <project-front-page class="kr-surface" slug="media-watchlist" :fallback="config">
    <template #interactive>
      <WatchlistBrowse />
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'media-watchlist',
  title: 'Media Watchlist',
  icon: 'kind-icon:movie',
  tagline: 'A decade-plus of books, games, movies, TV, comics, and more.',
  description:
    'A structured personal media log spanning 12 media types. Browse what you consumed, filter by year, type, month, season, or favorites, review individual entries, and explore the patterns in more than a decade of media history.',
  stats: [
    { label: 'entries logged', value: '2,440', icon: 'kind-icon:list' },
    { label: 'years tracked', value: '12', icon: 'kind-icon:calendar' },
    { label: 'starred favorites', value: '60', icon: 'kind-icon:star' },
  ],
  sections: [
    {
      key: 'browse',
      title: 'Browse the log',
      body: 'Search and filter the full history by media type, year, month, season, or starred favorites.',
      icon: 'kind-icon:list',
    },
    {
      key: 'patterns',
      title: 'See the patterns',
      body: 'Compare years, media types, active months, reading totals, listening hours, and favorite entries.',
      icon: 'kind-icon:chart',
    },
  ],
  deliverables: {
    done: [
      'Real viewing log parsed and validated (2,440 entries, 12 years)',
      'Import + normalization rules for 12 media types',
      'MediaEntry data model, browse + stats API, and a full browse UI',
      'Entry detail view with private review editor and rating control',
      'CSV export of the current filtered view',
    ],
    next: [],
  },
}
</script>
