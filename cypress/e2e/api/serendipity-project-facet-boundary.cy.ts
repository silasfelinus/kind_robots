describe('Serendipity Project and Facet boundary', () => {
  it('keeps Project and Facet ownership first-class in source', () => {
    cy.readFile('stores/serendipityStore.ts').then((source: string) => {
      expect(source).to.include("import { useProjectStore } from '@/stores/projectStore'")
      expect(source).to.include('todo.projectId')
      expect(source).to.include('projectId: projectId.value')
      expect(source).not.to.include("entry.dreamType === 'PROJECT'")
      expect(source).not.to.include('projectDreamId')
    })

    cy.readFile('components/pages/serendipity-page.vue').then((source: string) => {
      expect(source).to.include("useFacetStore")
      expect(source).to.include("facet.kind === 'GENRE'")
      expect(source).not.to.include("dream.dreamType === 'GENRE'")
    })
  })
})
