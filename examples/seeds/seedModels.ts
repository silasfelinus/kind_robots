// ~/examples/seeds/modelSeed.ts
import { Model, ModelType } from '@prisma/client'

// Define your array of initial bot data
export const modelData: Partial<Model>[] = [
  {
    modelType: ModelType.MODEL
  }
]
