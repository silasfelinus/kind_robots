// /cypress/e2e/api/creative-dream-projections.cy.ts

describe('Creative Dream projections', () => {
  it('keeps Project and Genre compatibility rows out of normal Dream lists', () => {
    cy.readFile('stores/dreamStore.ts').then((source: string) => {
      expect(source).to.include('const creativeDreams = computed')
      expect(source).to.include("dream.dreamType !== 'PROJECT'")
      expect(source).to.include("dream.dreamType !== 'GENRE'")
      expect(source).to.include('const dreamTypes = CREATABLE_DREAM_TYPES')
      expect(source).to.include('creativeDreams,')
    })

    cy.readFile('components/dreams/dream-gallery.vue').then((source: string) => {
      expect(source).to.include('dreamStore.creativeDreams')
      expect(source).not.to.include('let dreams = dreamStore.dreams ?? []')
    })

    cy.readFile('components/dreams/dream-relationship-gallery.vue').then(
      (source: string) => {
        expect(source).to.include('let dreams = dreamStore.creativeDreams ?? []')
      },
    )
  })

  it('preserves raw Dream storage for explicit compatibility access', () => {
    cy.readFile('stores/dreamStore.ts').then((source: string) => {
      expect(source).to.include('dreams,')
      expect(source).to.include('fetchDreamById,')
      expect(source).to.include('dreamType?: DreamType | string')
    })
  })
})
