// Figma main thread (sandboxed). Has access to figma.* but no DOM.
// Types come from @figma/plugin-typings (configured in tsconfig).

type UIToMain =
  | { type: 'INSERT_IMAGE'; bytes: Uint8Array; width: number; height: number }
  | { type: 'CLOSE' }

type MainToUI =
  | { type: 'INSERT_DONE' }
  | { type: 'INSERT_ERROR'; error: string }

figma.showUI(__html__, { width: 1200, height: 800, themeColors: true })

function postToUI(message: MainToUI): void {
  figma.ui.postMessage(message)
}

figma.ui.onmessage = async (msg: UIToMain) => {
  try {
    if (msg.type === 'INSERT_IMAGE') {
      const image = figma.createImage(msg.bytes)
      const rect = figma.createRectangle()
      rect.resize(msg.width, msg.height)
      rect.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }]
      const { x, y } = figma.viewport.center
      rect.x = x - msg.width / 2
      rect.y = y - msg.height / 2
      figma.currentPage.appendChild(rect)
      figma.currentPage.selection = [rect]
      figma.viewport.scrollAndZoomIntoView([rect])
      postToUI({ type: 'INSERT_DONE' })
      return
    }
    if (msg.type === 'CLOSE') {
      figma.closePlugin()
      return
    }
  } catch (err) {
    postToUI({
      type: 'INSERT_ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
