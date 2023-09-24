import { defineEventHandler, readBody } from 'h3'
import { Art, createArt, updateArt, deleteArt, fetchAllArt, fetchArtById } from './art'

export default defineEventHandler({
  // Fetch all Art entries
  'GET /': async () => {
    try {
      const artEntries = await fetchAllArt()
      return { success: true, artEntries }
    } catch (error: any) {
      return errorHandler(error)
    }
  },

  // Create a new Art entry
  'POST /': async (event) => {
    try {
      const artData: Partial<Art> = await readBody(event)
      const newArt = await createArt(artData)
      return { success: true, newArt }
    } catch (error: any) {
      return errorHandler(error)
    }
  },

  // Update an existing Art entry by ID
  'PATCH /:id': async (event) => {
    try {
      const id = parseInt(event.pathParameters?.id || '', 10)
      const updatedArtData: Partial<Art> = await readBody(event)
      const updatedArt = await updateArt(id, updatedArtData)
      return { success: true, updatedArt }
    } catch (error: any) {
      return errorHandler(error)
    }
  },

  // Delete an Art entry by ID
  'DELETE /:id': async (event) => {
    try {
      const id = parseInt(event.pathParameters?.id || '', 10)
      const isDeleted = await deleteArt(id)
      return { success: isDeleted }
    } catch (error: any) {
      return errorHandler(error)
    }
  },

  // Fetch a single Art entry by ID
  'GET /:id': async (event) => {
    try {
      const id = parseInt(event.pathParameters?.id || '', 10)
      const art = await fetchArtById(id)
      return { success: true, art }
    } catch (error: any) {
      return errorHandler(error)
    }
  }
})
