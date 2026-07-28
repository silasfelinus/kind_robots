import { defineEventHandler } from 'h3'
import { errorHandler } from '@/server/utils/error'
import { conductorGet } from '@/server/utils/conductor-github'
import {
  COLORING_BOOK_PRINT_PACKAGE_PATH,
  COLORING_BOOK_PRINT_READINESS_PATH,
  parseColoringBookPackageData,
} from '@/server/utils/coloringBookPackage'

export default defineEventHandler(async (event) => {
  try {
    const [packageFile, readinessFile] = await Promise.all([
      conductorGet(COLORING_BOOK_PRINT_PACKAGE_PATH),
      conductorGet(COLORING_BOOK_PRINT_READINESS_PATH),
    ])
    if (!packageFile) {
      throw new Error('Canonical coloring-book print package manifest was not found.')
    }

    const data = parseColoringBookPackageData(
      readinessFile?.content ?? null,
      packageFile.content,
    )

    return {
      success: true,
      message: readinessFile
        ? `${data.books.length} print-package records loaded from Conductor.`
        : 'Print-package configuration loaded; generated readiness is awaiting refresh.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500
    event.node.res.statusCode = statusCode
    return {
      success: false,
      message: handled.message || 'Failed to load coloring-book package readiness.',
      statusCode,
    }
  }
})
