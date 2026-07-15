<!-- /components/conductor/scoop-cms-page.vue -->
<template>
  <ProjectFrontPage slug="humboldt-scoop-cms" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'humboldt-scoop-cms',
  title: 'Humboldt Scoop CMS',
  channelKey: 'conductor',
  tabKey: 'scoop-cms',
  icon: 'kind-icon:heart',
  tagline: 'The back office behind the tidy yards.',
  description:
    'The admin console for the Humboldt Scoop service: customers, their yards and pets, recurring service schedules, visit logs, and draft invoicing so the real-world pet-waste business runs on rails. Internal, admin-only tooling — dummy data until Silas approves real customer data.',
  sections: [
    {
      key: 'customers',
      title: 'Customers, properties & pets',
      body: 'One customer can have multiple properties (yards); pets stay tied to the property where they are actually encountered so service notes stay accurate.',
      icon: 'kind-icon:person',
    },
    {
      key: 'scheduling',
      title: 'Service plans & visits',
      body: 'Recurring service plans track frequency, preferred weekday, and pricing; visits record scheduled and completed work without live billing.',
      icon: 'kind-icon:calendar',
    },
    {
      key: 'invoicing',
      title: 'Draft invoicing',
      body: 'Invoice previews are built from visits, in cents to avoid floating-point drift, and stay draft-only until a human-gated task approves live billing.',
      icon: 'kind-icon:money',
    },
    {
      key: 'routing',
      title: 'Mapped route planning',
      body: 'A deterministic (not LLM-driven) route planner will build a mapped route from a selected set of customers — Android-first for the field crew.',
      icon: 'kind-icon:map',
    },
  ],
  stats: [
    { label: 'Data model', value: '6 entities', icon: 'kind-icon:database' },
    { label: 'Billing', value: 'Draft-only', icon: 'kind-icon:money' },
    { label: 'Data', value: 'Dummy only', icon: 'kind-icon:shield' },
  ],
  collectionLabel: 'humboldt-scoop-cms',
  deliverables: {
    done: ['Service domain modeled', 'Customer + route-card API scaffolded'],
    next: [
      'Mapped route planner',
      'Dispatcher map UI',
      'Android crew route view',
    ],
  },
}
</script>
