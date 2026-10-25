import assert from 'node:assert/strict'
import test from 'node:test'

import { apply, Config } from '../index.js'

const PATH = '/plugins/dsh-opencode-go/usage'

const payload = {
  usage: {
    rolling: { status: 'ok', percent: 0, resetsAt: '2026-10-24T05:01:00.000Z' },
    weekly: { status: 'ok', percent: 2.6, resetsAt: '2026-10-26T00:00:00.000Z' },
    monthly: { status: 'rate-limited', percent: 100, resetsAt: '2026-10-29T06:26:35.000Z' },
  },
}

function createHarness(options = {}) {
  const values = new Map(Object.entries(options.credentials ?? {}))
  let handler
  let fetchCalls = 0
  let lastUrl
  let lastInit
  let credentialListener

  const ctx = {
    credentials: {
      async resolve(ref) {
        return values.has(ref) ? { value: values.get(ref) } : undefined
      },
    },
    webServer: {
      register(route) {
        handler = route.handler
        return () => {}
      },
    },
    on(name, listener) {
      if (name === 'credentials/reference-updated') credentialListener = listener
      return () => {}
    },
    effect(callback) {
      const cleanup = callback()
      return () => cleanup?.()
    },
  }

  apply(ctx, {
    apiKeyEnv: options.apiKeyEnv ?? 'TEST_KEY',
    usageUrl: options.usageUrl ?? 'https://usage.test/v1/usage',
    cacheMs: options.cacheMs ?? 5_000,
  })
  assert.equal(typeof handler, 'function')

  globalThis.fetch = async (url, init) => {
    fetchCalls += 1
    lastUrl = String(url)
    lastInit = init
    if (options.fetchError === true) throw new TypeError('network down')
    const status = options.status ?? 200
    const body = options.body ?? JSON.stringify(payload)
    return new Response(body, {
      status,
      headers: { 'content-type': 'application/json', ...options.headers },
    })
  }

  async function call(overrides = {}) {
    const req = {
      method: overrides.method ?? 'GET',
      url: overrides.url ?? PATH,
      headers: overrides.headers ?? { host: '127.0.0.1:64937' },
    }
    return await new Promise((resolve, reject) => {
      let status = 0
      const chunks = []
      const res = {
        writeHead(code) { status = code },
        end(chunk) {
          if (chunk !== undefined) chunks.push(Buffer.from(chunk))
          const text = Buffer.concat(chunks).toString('utf8')
          resolve({ status, body: text.length === 0 ? undefined : JSON.parse(text) })
        },
      }
      Promise.resolve(handler(req, res)).catch(reject)
    })
  }

  return {
    call,
    fetchCalls: () => fetchCalls,
    lastUrl: () => lastUrl,
    lastInit: () => lastInit,
    emitCredential: (ref) => credentialListener?.(ref),
  }
}

test('normalizes the three windows', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call()
  assert.equal(result.status, 200)
  assert.equal(result.body.status, 'ok')
  assert.equal(result.body.plan, 'go')
  assert.deepEqual(result.body.windows.map((window) => window.id), ['rolling', 'weekly', 'monthly'])
  assert.equal(result.body.windows[0].usedPercent, 0)
  assert.equal(result.body.windows[1].usedPercent, 2.6)
  assert.equal(result.body.windows[2].status, 'rate-limited')
  assert.equal(result.body.windows[2].usedPercent, 100)
  assert.equal(result.body.windows[0].resetsAt, '2026-10-24T05:01:00.000Z')
  assert.equal(harness.fetchCalls(), 1)
})

test('caches upstream responses and refreshes on demand', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  const first = await harness.call()
  const second = await harness.call()
  const refreshed = await harness.call({ url: `${PATH}?refresh=1` })

  assert.equal(first.status, 200)
  assert.equal(second.body.fetchedAt, first.body.fetchedAt)
  assert.equal(refreshed.status, 200)
  assert.equal(harness.fetchCalls(), 2)
})

test('rejects cross-site requests without calling upstream', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call({
    headers: { host: '127.0.0.1:64937', 'sec-fetch-site': 'cross-site' },
  })
  assert.equal(result.status, 403)
  assert.deepEqual(result.body, { error: 'forbidden' })
  assert.equal(harness.fetchCalls(), 0)
})

test('reports a missing credential', async (t) => {
  const harness = createHarness()
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call()
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { status: 'unavailable', reason: 'missing-key' })
  assert.equal(harness.fetchCalls(), 0)
})

test('falls back to OPENCODE_API_KEY', async (t) => {
  const harness = createHarness({
    apiKeyEnv: 'MISSING_KEY',
    credentials: { OPENCODE_API_KEY: 'fallback-key' },
  })
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call()
  assert.equal(result.status, 200)
  assert.equal(result.body.status, 'ok')
  assert.equal(harness.fetchCalls(), 1)
})

test('maps upstream authentication failures', async (t) => {
  t.after(() => { delete globalThis.fetch })

  const unauthorized = createHarness({ credentials: { TEST_KEY: 'test-key' }, status: 401 })
  assert.equal((await unauthorized.call()).body.reason, 'invalid-key')

  const forbidden = createHarness({ credentials: { TEST_KEY: 'test-key' }, status: 403 })
  assert.equal((await forbidden.call()).body.reason, 'no-subscription')
})

test('reports malformed payloads and network errors', async (t) => {
  t.after(() => { delete globalThis.fetch })

  const malformed = createHarness({
    credentials: { TEST_KEY: 'test-key' },
    body: JSON.stringify({ usage: { weekly: { percent: 'nope' } } }),
  })
  assert.equal((await malformed.call()).body.reason, 'bad-response')

  const offline = createHarness({ credentials: { TEST_KEY: 'test-key' }, fetchError: true })
  assert.equal((await offline.call()).body.reason, 'network')
})

test('rejects non-GET requests', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call({ method: 'POST' })
  assert.equal(result.status, 405)
  assert.equal(harness.fetchCalls(), 0)
})

test('sends the resolved key only to the configured HTTPS endpoint', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  await harness.call()
  assert.equal(harness.lastUrl(), 'https://usage.test/v1/usage')
  assert.equal(harness.lastInit().headers.authorization, 'Bearer test-key')
})

test('refuses to send the key over plaintext to a non-loopback host', async (t) => {
  const harness = createHarness({
    credentials: { TEST_KEY: 'test-key' },
    usageUrl: 'http://upstream.example.test/usage',
  })
  t.after(() => { delete globalThis.fetch })

  await harness.call()
  assert.equal(harness.lastUrl(), 'https://opencode.ai/zen/go/v1/usage')

  const loopback = createHarness({
    credentials: { TEST_KEY: 'test-key' },
    usageUrl: 'http://127.0.0.1:9999/usage',
  })
  await loopback.call()
  assert.equal(loopback.lastUrl(), 'http://127.0.0.1:9999/usage')
})

test('maps 429 backoff and serves it from the cache', async (t) => {
  const harness = createHarness({
    credentials: { TEST_KEY: 'test-key' },
    status: 429,
    headers: { 'retry-after': '120' },
  })
  t.after(() => { delete globalThis.fetch })

  const first = await harness.call()
  assert.equal(first.body.reason, 'rate-limited')
  assert.equal(first.body.retryAfterMs, 120_000)

  const second = await harness.call()
  assert.equal(second.body.reason, 'rate-limited')
  assert.equal(harness.fetchCalls(), 1)
})

test('maps 5xx responses to a server error', async (t) => {
  const harness = createHarness({
    credentials: { TEST_KEY: 'test-key' },
    status: 503,
    headers: { 'retry-after': '1' },
  })
  t.after(() => { delete globalThis.fetch })

  const result = await harness.call()
  assert.equal(result.body.reason, 'server-error')
  assert.equal(result.body.httpStatus, 503)
  assert.equal(result.body.retryAfterMs, 1_000)
})

test('clears the cache when the credential reference changes', async (t) => {
  const harness = createHarness({ credentials: { TEST_KEY: 'test-key' } })
  t.after(() => { delete globalThis.fetch })

  await harness.call()
  await harness.call()
  assert.equal(harness.fetchCalls(), 1)

  harness.emitCredential('TEST_KEY')
  await harness.call()
  assert.equal(harness.fetchCalls(), 2)

  await harness.call()
  assert.equal(harness.fetchCalls(), 2)
})

test('Config exposes safe defaults', () => {
  const config = Config({})
  assert.equal(config.apiKeyEnv, 'OPENCODE_GO_API_KEY')
  assert.equal(config.usageUrl, 'https://opencode.ai/zen/go/v1/usage')
  assert.equal(config.cacheMs, 30_000)
})
