import { defineEventHandler } from 'h3'
import { VIDEO_PRESETS } from '../../../utils/videoPresets'

export default defineEventHandler(() => ({
  presets: VIDEO_PRESETS,
}))
