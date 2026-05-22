import type { AiSchema, Chat, Message } from './types'
import type { ParamConfig, ResolvedParams } from '#/lib/types'

const CURRENT_CHAT_VERSION = 2
const CURRENT_MESSAGE_VERSION = 2

type LegacyChatV1 = Omit<Chat, 'schemaVersion'> & {
  schemaVersion: 1
  activeParamValues?: ResolvedParams
}

type LegacyMessageV1 = Omit<Message, 'schemaVersion'> & {
  schemaVersion: 1
  paramValues?: ResolvedParams
}

export function migrateChat(row: Chat): Chat {
  const version = row.schemaVersion as number
  if (version === CURRENT_CHAT_VERSION) return row
  if (version === 1) {
    const legacy = row as unknown as LegacyChatV1
    const { activeParamValues: _drop, ...rest } = legacy
    return { ...rest, schemaVersion: 2 }
  }
  throw new Error(`Unknown chat schemaVersion: ${row.schemaVersion}`)
}

/**
 * v1 → v2: paramValues was a sibling record overriding params_config defaults.
 * Fold any user-set values into the snapshot's params_config[i].default so the
 * snapshot becomes the sole source of truth.
 */
function foldParamValuesIntoSnapshot(
  snapshot: AiSchema | undefined,
  paramValues: ResolvedParams | undefined,
): AiSchema | undefined {
  if (!snapshot) return snapshot
  if (!paramValues || Object.keys(paramValues).length === 0) return snapshot
  const nextParams: ParamConfig[] = snapshot.params_config.map((p) =>
    Object.prototype.hasOwnProperty.call(paramValues, p.key)
      ? { ...p, default: paramValues[p.key] }
      : p,
  )
  return { ...snapshot, params_config: nextParams }
}

export function migrateMessage(row: Message): Message {
  const version = row.schemaVersion as number
  if (version === CURRENT_MESSAGE_VERSION) return row
  if (version === 1) {
    const legacy = row as unknown as LegacyMessageV1
    const { paramValues, ...rest } = legacy
    const schemaSnapshot = foldParamValuesIntoSnapshot(
      legacy.schemaSnapshot,
      paramValues,
    )
    return { ...rest, schemaVersion: 2, schemaSnapshot }
  }
  throw new Error(`Unknown message schemaVersion: ${row.schemaVersion}`)
}
