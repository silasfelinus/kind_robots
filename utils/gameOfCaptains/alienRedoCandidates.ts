import { COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS } from './alienArtJobs'

// The art ledger pins a consecutive Krea2 output batch. Registering these
// renders only makes them reviewable; DONE never implies art acceptance.
export const COUCH_ALIEN_REDO_CANDIDATES = Object.entries(
  COUCH_ALIEN_REDO_CANDIDATE_JOB_IDS,
).map(([key, jobId]) => ({
  key,
  jobId,
  artImageId: 262131 + jobId - 60625,
}))
