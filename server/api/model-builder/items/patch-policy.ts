import { createError } from 'h3'
import type { ItemPatchBody } from '../runs/index'

export function assertItemPatchFieldsAreClientWritable(
  body: ItemPatchBody,
): void {
  if (body.targetType !== undefined || body.targetId !== undefined) {
    throw createError({
      statusCode: 400,
      message:
        'Build item target metadata is server-managed and may only be set by commit.',
    })
  }
}
