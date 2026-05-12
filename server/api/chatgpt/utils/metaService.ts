// /server/api/chatgpt/utils/metaService.ts
import { fail } from './access'
import { isRecord } from './validate'
import {
  getActionContract as getSharedActionContract,
  getModelContract as getSharedModelContract,
  listActionContracts,
  listModelContracts,
} from './contracts'

export function listActions() {
  return {
    ok: true,
    data: listActionContracts().map((contract) => ({
      action: contract.action,
      summary: contract.summary,
      primaryModel: contract.primaryModel ?? null,
      relatedModels: contract.relatedModels ?? [],
      requiresAuth: contract.requiresAuth,
    })),
  }
}

export function listActionContractsResponse() {
  return {
    ok: true,
    data: listActionContracts(),
  }
}

export function getActionContract(input: Record<string, unknown>) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  const actionName = String(input.actionName || input.action || '').trim()

  if (!actionName) {
    fail('actionName is required', 400)
  }

  return {
    ok: true,
    data: getSharedActionContract(actionName),
  }
}

export function getModelContract(input: Record<string, unknown>) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  const model = String(input.model || '').trim()

  if (!model) {
    return {
      ok: true,
      data: listModelContracts(),
    }
  }

  return {
    ok: true,
    data: getSharedModelContract(model),
  }
}
