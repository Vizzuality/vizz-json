import { defineEventHandler, toWebRequest } from 'h3'
import {
  serverAsyncLocalStorage,
  overwriteServerAsyncLocalStorage,
  disableAsyncLocalStorage,
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
  if (!disableAsyncLocalStorage && !serverAsyncLocalStorage) {
    const { AsyncLocalStorage } = await import('async_hooks')
    overwriteServerAsyncLocalStorage(new AsyncLocalStorage())
  }

  const request = toWebRequest(event)
  const locale = extractLocaleFromUrl(request.url) ?? baseLocale
  const origin = new URL(request.url).origin

  // enterWith() is available on the real Node.js AsyncLocalStorage
  // (not on paraglide's mock, but disableAsyncLocalStorage is false
  // so the real one is always used)
  const store = serverAsyncLocalStorage as import('async_hooks').AsyncLocalStorage<{
    locale: string
    origin: string
    messageCalls: Set<string>
  }> | null
  store?.enterWith({ locale, origin, messageCalls: new Set() })
})
