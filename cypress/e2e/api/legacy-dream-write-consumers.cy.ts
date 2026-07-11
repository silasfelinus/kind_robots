// /cypress/e2e/api/legacy-dream-write-consumers.cy.ts

describe('Legacy Project and Genre Dream write consumers', () => {
  it('uses the shared creatable Dream type list in Brainstorm', () => {
    cy.readFile('components/dreams/dream-brainstorm.vue').then((source: string) => {
      expect(source).to.include('CREATABLE_DREAM_TYPES')
      expect(source).to.include('CreatableDreamType')
      expect(source).not.to.include("const saveDreamTypes: DreamType[]")
      expect(source).not.to.include("  'GENRE',")
      expect(source).not.to.include("  'PROJECT',")
    })
  })

  it('rejects legacy Project and Genre targets in PitchSheet batches', () => {
    cy.readFile('server/api/sheets/batch.post.ts').then((source: string) => {
      expect(source).to.include('LEGACY_DREAM_TYPES')
      expect(source).to.include("new Set(['PROJECT', 'GENRE'])")
      expect(source).to.include('/api/projects or /api/facets')
      expect(source).not.to.match(/const DREAM_TYPES = \[[\s\S]*?'GENRE'/)
    })
  })
})
