// /server/api/version.get.ts
// Public, read-only build-identity endpoint. Reports the git commit this
// deployment was built from so CI (and humans) can confirm which build is
// actually live before exercising the rest of the API. Vercel injects the
// VERCEL_GIT_* system environment variables at build and runtime.
//
// The Cypress workflow polls this after a push to main and only starts the API
// suite once `data.commit` matches the pushed SHA. That closes the race where
// `prisma migrate deploy` (run during `vercel-build`) has already changed the
// schema but the previous serverless functions are still being served — the
// window that made the subFolder -> parentFolder rename fail against production.
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || null

  return {
    success: true,
    message: 'ok',
    data: {
      commit,
      ref: process.env.VERCEL_GIT_COMMIT_REF || null,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    },
  }
})
