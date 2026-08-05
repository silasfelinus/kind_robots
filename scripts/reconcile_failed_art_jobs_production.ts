// scripts/reconcile_failed_art_jobs_production.ts
//
// One-time production wrapper. The underlying reconciler already retries a
// transient database failure three times; this outer window lets a deployment
// survive a longer ProxySQL pool outage without weakening the manual script's
// normal bounded behavior.

import { main as reconcileFailedArtJobs } from './reconcile_failed_art_jobs'
import { withDatabaseRetry } from './lib/databaseRetry'

await withDatabaseRetry(
  'production failed ArtJob reconciliation',
  async () => reconcileFailedArtJobs(),
  3,
  10_000,
)
