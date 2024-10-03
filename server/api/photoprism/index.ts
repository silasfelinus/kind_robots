import { defineEventHandler } from 'h3'
import { createClient } from 'webdav'

export default defineEventHandler(async () => {
  // Retrieve the WebDAV login and server info from environment variables
  const webdavUrl =
    process.env.PHOTOPRISM_WEBDAV_URL || 'https://photos.acrocatranch.com'
  const username = process.env.PHOTOPRISM_USER
  const password = process.env.PHOTOPRISM_PASSWORD

  try {
    // Create WebDAV client
    const client = createClient(webdavUrl, {
      username,
      password,
    })

    // Fetch the list of folders from the root directory
    const folderList = await client.getDirectoryContents('/')

    return {
      success: true,
      data: folderList,
    }
  } catch (error) {
    console.error('Error connecting to PhotoPrism WebDAV:', error)
    return {
      success: false,
      message: 'Unable to connect to PhotoPrism WebDAV.',
      error: error,
    }
  }
})
