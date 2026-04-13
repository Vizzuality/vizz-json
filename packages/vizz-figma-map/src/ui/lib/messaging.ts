export type UIToMain =
  | { type: 'INSERT_IMAGE'; bytes: Uint8Array; width: number; height: number }
  | { type: 'CLOSE' }

export type MainToUI =
  | { type: 'INSERT_DONE' }
  | { type: 'INSERT_ERROR'; error: string }

export function postToMain(message: UIToMain): void {
  // Figma plugin spec: UI → main via window.parent.postMessage({ pluginMessage })
  parent.postMessage({ pluginMessage: message }, '*')
}

export function onMessageFromMain(
  handler: (msg: MainToUI) => void,
): () => void {
  const listener = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage as MainToUI | undefined
    if (msg && typeof msg === 'object' && 'type' in msg) {
      handler(msg)
    }
  }
  window.addEventListener('message', listener)
  return () => window.removeEventListener('message', listener)
}
