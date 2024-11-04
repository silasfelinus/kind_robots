/// <reference types="cypress" />
import type { Pinia } from 'pinia'
import { useArtStore } from '@/stores/artStore' // Adjust the import path as needed

// Extend Cypress window type to include `$pinia`
declare global {
  interface Window {
    $pinia: Pinia
  }
}

/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Art Store Tests with Cleanup', () => {
  let generatedArtId: number
  let collectedArtId: number

  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      // Access the artStore directly from the Pinia instance
      const artStore = useArtStore(win.$pinia)

      // Now you can interact with artStore directly
      expect(artStore).to.exist
    })
  })

  it('should initialize the artStore with default values', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        expect(artStore.art).to.have.length(0)
        expect(artStore.loading).to.be.false
        expect(artStore.error).to.be.empty
        expect(artStore.currentPage).to.eq(1)
      })
  })

  it('should fetch all art entries and update the store', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore.fetchAllArt().then(() => {
          expect(artStore.art).to.be.an('array').that.is.not.empty
          expect(artStore.loading).to.be.false
        })
      })
  })

  it('should create a new art entry and add it to the store', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        const artData = {
          promptString: 'A beautiful galaxy over the desert',
          path: ' ',
          seed: null,
          steps: 20,
          channelId: 1,
          galleryId: 2,
          promptId: null,
          pitchId: 5,
          userId: 9,
          designer: 'AI Designer',
          artImageId: null,
        }

        artStore.createArt(artData).then((createdArt: Art) => {
          generatedArtId = createdArt.id
          expect(createdArt).to.have.property('id')
          expect(artStore.art).to.include(createdArt)
        })
      })
  })

  it('should retrieve an art piece by ID', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore.fetchArtById(generatedArtId).then((art: Art) => {
          expect(art).to.have.property('id', generatedArtId)
          expect(art.promptString).to.include('galaxy')
        })
      })
  })

  it('should update an existing art entry in the store', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore.updateArtImageWithArtId(generatedArtId, 999).then(() => {
          const updatedArt = artStore.getArtById(generatedArtId)
          expect(updatedArt.artImageId).to.eq(999)
        })
      })
  })

  it('should fetch a user’s collected art and store it correctly', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore.fetchCollectedArt(9).then(() => {
          expect(artStore.collectedArt).to.be.an('array')
          expect(artStore.collectedArt).to.have.length.greaterThan(0)
          collectedArtId = artStore.collectedArt[0].id // For cleanup
        })
      })
  })

  it('should fetch an art image by art ID and cache it in store', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore
          .fetchArtImageByArtId(generatedArtId)
          .then((artImage: ArtImage) => {
            expect(artImage).to.have.property('artId', generatedArtId)
            expect(artStore.artImages).to.include(artImage)
          })
      })
  })

  // Cleanup: test the delete functionality and ensure no residue
  it('should delete the created art entry and confirm removal from the store', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        artStore.deleteArt(generatedArtId).then(() => {
          const deletedArt = artStore.getArtById(generatedArtId)
          expect(deletedArt).to.be.undefined
        })
      })
  })

  it('should delete the collected art entry for cleanup', () => {
    cy.window()
      .its('artStore')
      .then((artStore) => {
        if (collectedArtId) {
          artStore.deleteArt(collectedArtId).then(() => {
            const deletedCollectedArt = artStore.getArtById(collectedArtId)
            expect(deletedCollectedArt).to.be.undefined
          })
        }
      })
  })
})
