// /server/api/davinci/runs/[id]/choices.post.ts
//
// storybook/t-026: retired in place of
// /api/storybook/life/runs/[id]/choices.post.ts. Kept as a thin re-export so
// a cached pre-move client bundle (or a run in flight when this shipped)
// keeps working rather than 404ing mid-life.
export { default } from '../../../storybook/life/runs/[id]/choices.post'
