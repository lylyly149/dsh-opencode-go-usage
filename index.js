/**
 * Host half of the OpenCode Go usage plugin.
 *
 * Reads the OpenCode Go API key through the credentials service, asks the
 * official quota endpoint for the rolling/weekly/monthly windows, and exposes
 * the normalized result on a same-origin route. The key never leaves the Host.
 * @module @lylyly149/dsh-opencode-go-usage
 */

import z from '@deepseek-ai/schemastery'

/** Stable plugin name used by diagnostics. */
export const name = 'dsh-opencode-go-usage'

/** Services this plugin needs before it can register its route. */
export const inject = ['webServer', 'credentials']

/** Official OpenCode Go quota endpoint. */
const DEFAULT_USAGE_URL = 'https://opencode.ai/zen/go/v1/usage'
/** Credential reference used by the profile's `opencode-go` route by default. */
const DEFAULT_API_KEY_ENV = 'OPENCODE_GO_API_KEY'
/** Common native reference, tried when the configured reference is empty. */
const FALLBACK_API_KEY_ENVS = ['OPENCODE_API_KEY']
/** Same-origin route consumed by the browser half. */
const USAGE_PATH = '/plugins/dsh-opencode-go/usage'
/** Upstream response cache; the browser polls once a minute. */
const DEFAULT_CACHE_MS = 30_000
const MIN_CACHE_MS = 5_000
const MAX_CACHE_MS = 300_000
/** Bound on one upstream request. */
const REQUEST_TIMEOUT_MS = 15_000
/** Stable order and identifiers of the metered windows. */
const WINDOW_IDS = ['rolling', 'weekly', 'monthly']
/** Upper bound on a server-provided backoff, so a bad header cannot park us forever. */
const MAX_RETRY_AFTER_MS = 60 * 60 * 1000

/** Loader-visible configuration schema. */
export const Config = z.object({
  apiKeyEnv: z.string().default(DEFAULT_API_KEY_ENV),
  usageUrl: z.string().default(DEFAULT_USAGE_URL),
  cacheMs: z.number().step(1).min(MIN_CACHE_MS).max(MAX_CACHE_MS).default(DEFAULT_CACHE_MS),
})

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function positiveInteger(value, fallback, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const rounded = Math.round(value)
  if (rounded < min) return min
  if (rounded > max) return max
  return rounded
}

function credentialRef(value) {
  const raw = typeof value === 'string' ? value.trim() : ''
  return /^[A-Za-z_][A-Za-z0-9_]*$/u.test(raw) ? raw : DEFAULT_API_KEY_ENV
}

function usageUrl(value) {
  if (typeof value !== 'string') return DEFAULT_USAGE_URL
  try {
    const parsed = new URL(value)
    const loopback = parsed.hostname === 'localhost'
      || parsed.hostname === '127.0.0.1'
      || parsed.hostname === '::1'
      || parsed.hostname === '[::1]'
    // Never send the bearer key over plaintext to a non-local host.
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
      return DEFAULT_USAGE_URL
    }
    return parsed.toString()
  } catch {
    return DEFAULT_USAGE_URL
  }
}

function retryAfterMs(response) {
  const header = response.headers.get('retry-after')
  if (typeof header !== 'string') return undefined
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_AFTER_MS, Math.round(seconds * 1000))
  }
  const date = Date.parse(header)
  if (Number.isFinite(date)) {
    return Math.min(MAX_RETRY_AFTER_MS, Math.max(0, date - Date.now()))
  }
  return undefined
}

function normalizeWindow(id, value) {
  if (!isRecord(value)) return undefined
  const rateLimited = value.status === 'rate-limited'
  const status = rateLimited ? 'rate-limited' : 'ok'
  const percent = typeof value.percent === 'number' && Number.isFinite(value.percent)
    ? Math.min(100, Math.max(0, value.percent))
    : rateLimited ? 100 : undefined
  if (percent === undefined) return undefined
  let resetsAt
  if (typeof value.resetsAt === 'string') {
    const parsed = Date.parse(value.resetsAt)
    if (Number.isFinite(parsed)) resetsAt = new Date(parsed).toISOString()
  }
  return {
    id,
    status,
    usedPercent: percent,
    ...resetsAt === undefined ? {} : { resetsAt },
  }
}

function normalizeUsage(value) {
  if (!isRecord(value) || !isRecord(value.usage)) return undefined
  const windows = []
  for (const id of WINDOW_IDS) {
    const window = normalizeWindow(id, value.usage[id])
    if (window !== undefined) windows.push(window)
  }
  return windows.length === 0 ? undefined : windows
}

/**
 * Try the configured credential reference first, then the common native
 * reference. The first non-empty value wins; a credential service failure is
 * reported separately so it is not mistaken for a missing key.
 */
async function resolveApiKey(credentials, refs) {
  let failed = false
  for (const ref of refs) {
    try {
      const resolved = await credentials.resolve(ref)
      const value = isRecord(resolved) ? resolved.value : undefined
      if (typeof value === 'string' && value.length > 0) return { value }
    } catch {
      failed = true
    }
  }
  return failed ? { error: 'credential-error' } : {}
}

/**
 * Ask the upstream endpoint once. Every failure is a contained result so the
 * browser can explain it without ever seeing credential or response contents.
 */
async function requestUsage(credentials, options) {
  const resolved = await resolveApiKey(credentials, options.apiKeyEnvs)
  if (resolved.error !== undefined) {
    return { status: 'unavailable', reason: resolved.error }
  }
  const apiKey = resolved.value
  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    return { status: 'unavailable', reason: 'missing-key' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => { controller.abort() }, REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(options.usageUrl, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${apiKey}`,
        accept: 'application/json',
      },
      signal: controller.signal,
    })
    if (response.status === 401) return { status: 'unavailable', reason: 'invalid-key' }
    if (response.status === 403) return { status: 'unavailable', reason: 'no-subscription' }
    if (response.status === 429) {
      const retryAfter = retryAfterMs(response)
      return {
        status: 'unavailable',
        reason: 'rate-limited',
        ...retryAfter === undefined ? {} : { retryAfterMs: retryAfter },
      }
    }
    if (!response.ok) {
      const retryAfter = retryAfterMs(response)
      return {
        status: 'unavailable',
        reason: response.status >= 500 ? 'server-error' : 'http-error',
        httpStatus: response.status,
        ...retryAfter === undefined ? {} : { retryAfterMs: retryAfter },
      }
    }
    let payload
    try {
      payload = await response.json()
    } catch {
      return { status: 'unavailable', reason: 'bad-response' }
    }
    const windows = normalizeUsage(payload)
    if (windows === undefined) return { status: 'unavailable', reason: 'bad-response' }
    return {
      status: 'ok',
      plan: 'go',
      fetchedAt: new Date().toISOString(),
      windows,
    }
  } catch {
    return {
      status: 'unavailable',
      reason: controller.signal.aborted ? 'timeout' : 'network',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Whether the request demonstrably came from this page rather than a
 * cross-site document. The route returns only quota percentages, but usage is
 * account data and should still stay on the same origin.
 */
function sameOriginRequest(req) {
  const fetchSite = req.headers['sec-fetch-site']
  if (typeof fetchSite === 'string' && fetchSite.trim().toLowerCase() === 'cross-site') {
    return false
  }
  const host = req.headers.host
  if (typeof host !== 'string' || host.length === 0) return false
  const origin = req.headers.origin
  if (typeof origin !== 'string') return true
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

/**
 * Register the usage proxy.
 * @param ctx - plugin context carrying `webServer` and `credentials`.
 * @param config - optional `apiKeyEnv`, `usageUrl`, and `cacheMs` overrides.
 */
export function apply(ctx, config) {
  const settings = isRecord(config) ? config : {}
  const apiKeyEnv = credentialRef(settings.apiKeyEnv)
  const apiKeyEnvs = [...new Set([apiKeyEnv, ...FALLBACK_API_KEY_ENVS])]
  const endpoint = usageUrl(settings.usageUrl)
  const cacheMs = positiveInteger(settings.cacheMs, DEFAULT_CACHE_MS, MIN_CACHE_MS, MAX_CACHE_MS)
  const requestOptions = { apiKeyEnvs, usageUrl: endpoint }

  let cache
  let pending

  const readUsage = (force) => {
    const now = Date.now()
    if (!force && cache !== undefined && now - cache.at < cache.ttl) {
      return Promise.resolve(cache.value)
    }
    if (pending !== undefined) return pending
    pending = requestUsage(ctx.credentials, requestOptions)
      .then((value) => {
        const stable = value.status === 'ok'
          || value.reason === 'missing-key'
          || value.reason === 'invalid-key'
          || value.reason === 'no-subscription'
          || value.reason === 'credential-error'
        const retryAfter = typeof value.retryAfterMs === 'number' ? value.retryAfterMs : 0
        if (stable || retryAfter > 0) {
          cache = {
            at: Date.now(),
            value,
            ttl: retryAfter > 0 ? Math.max(cacheMs, retryAfter) : cacheMs,
          }
        }
        return value
      })
      .finally(() => { pending = undefined })
    return pending
  }

  if (typeof ctx.on === 'function') {
    ctx.effect(() => ctx.on('credentials/reference-updated', (ref) => {
      if (apiKeyEnvs.includes(ref)) cache = undefined
    }), 'dsh-opencode-go-usage: credential cache')
  }

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: USAGE_PATH,
    handler: async (req, res) => {
      if (req.method !== 'GET') {
        json(res, 405, { error: 'method not allowed' })
        return
      }
      if (!sameOriginRequest(req)) {
        json(res, 403, { error: 'forbidden' })
        return
      }
      let force = false
      try {
        force = new URL(req.url ?? USAGE_PATH, 'http://localhost').searchParams.get('refresh') === '1'
      } catch {
        force = false
      }
      try {
        const value = await readUsage(force)
        json(res, 200, value)
      } catch {
        json(res, 500, { status: 'unavailable', reason: 'internal-error' })
      }
    },
  }), 'dsh-opencode-go-usage: usage route')
}
