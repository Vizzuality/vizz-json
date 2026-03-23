import type { AsyncLocalStorage } from 'node:async_hooks'
import { defineEventHandler, getRequestURL } from 'h3'
import {
  serverAsyncLocalStorage,
  overwriteServerAsyncLocalStorage,
  extractLocaleFromUrl,
  baseLocale,
} from '../../src/paraglide/runtime.js'

/**
 * Nitro server middleware that establishes the paraglide locale context
 * for SSR. Without this, `getLocale()` falls back to baseLocale ("en")
 * on every server render, causing hydration mismatches when the URL
 * indicates a different locale (e.g. `/es/...`).
 *
 * Uses `enterWith()` instead of `run()` because Nitro middleware is a
 * pre-hook — it cannot wrap the downstream handler in a callback.
 * `enterWith()` transitions the current async context so all subsequent
 * handlers in this request see the correct locale store.
 */
export default defineEventHandler(async (event) => {
  if (!serverAsyncLocalStorage) {
    const { AsyncLocalStorage } = await import('node:async_hooks')
    overwriteServerAsyncLocalStorage(new AsyncLocalStorage())
  }

  const url = getRequestURL(event)
  const locale = extractLocaleFromUrl(url.href) ?? baseLocale
  const origin = url.origin

  // enterWith() is available on the real Node.js AsyncLocalStorage
  // (not on paraglide's mock)
  const store = serverAsyncLocalStorage as
    | AsyncLocalStorage<{
        locale: string
        origin: string
        messageCalls: Set<string>
      }>
    | null
  store?.enterWith({ locale, origin, messageCalls: new Set() })
})
