import assert from 'node:assert/strict'
import test from 'node:test'

import { JSDOM } from 'jsdom'
import React from 'react'
import { createRoot } from 'react-dom/client'
const { act } = React

const dom = new JSDOM('<!doctype html><html lang="zh-CN"><body></body></html>', {
  url: 'http://127.0.0.1:64937/',
})
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Node = dom.window.Node
globalThis.MutationObserver = dom.window.MutationObserver
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let definition
dom.window.__ModuleLoader__ = {
  load(value) { definition = value },
}

await import('../client.js')

const usagePayload = {
  status: 'ok',
  plan: 'go',
  fetchedAt: '2026-10-25T12:00:00.000Z',
  windows: [
    { id: 'rolling', status: 'ok', usedPercent: 25, resetsAt: '2026-11-01T05:00:00.000Z' },
    { id: 'weekly', status: 'ok', usedPercent: 65, resetsAt: '2026-11-03T00:00:00.000Z' },
    { id: 'monthly', status: 'ok', usedPercent: 90, resetsAt: '2026-11-08T06:00:00.000Z' },
  ],
}

let response = {
  status: 200,
  body: JSON.stringify(usagePayload),
}
globalThis.fetch = async () => new Response(response.body, {
  status: response.status,
  headers: { 'content-type': 'application/json' },
})

function interpolate(template, params) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params?.[key] ?? ''))
}

function createPlugin() {
  let dictionaries
  const components = new Map()
  const plugin = definition.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected module: ${name}`)
  })

  const ctx = {
    effect: (callback) => {
      callback()
      return () => {}
    },
    locale: {
      register: (_namespace, value) => {
        dictionaries = value
        return () => {}
      },
      bind: () => (key, params) => interpolate(dictionaries.zh[key] ?? key, params),
    },
    slots: {
      inject: (_owner, callback) => callback(),
      register: (options, component) => {
        components.set(options.name, component)
        return () => {}
      },
    },
    modelDirectories: {
      directoryFor: () => ({
        store: {
          subscribe: () => () => {},
          getSnapshot: () => ({ status: 'idle' }),
        },
      }),
    },
  }

  plugin.apply(ctx)
  const translate = (key, params) => interpolate(dictionaries.zh[key] ?? key, params)
  return { components, translate }
}

const directorySnapshot = {
  status: 'ready',
  current: { provider: 'opencode-go', model: 'deepseek-v4.1-flash' },
}
const directory = {
  subscribe: () => () => {},
  getSnapshot: () => directorySnapshot,
}

async function render(element) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(element)
  })
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25))
  })
  return {
    container,
    unmount: async () => {
      await act(async () => { root.unmount() })
      container.remove()
    },
  }
}

test('renders the 270° fan with colors, geometry, and the tightest label', async () => {
  response = { status: 200, body: JSON.stringify(usagePayload) }
  const { components, translate } = createPlugin()
  const Indicator = components.get('conversation.input.right')
  const view = await render(React.createElement(Indicator, { directory, t: translate }))

  try {
    const plan = view.container.querySelector('[data-opencode-go-usage="plan"]')
    assert.ok(plan, 'plan indicator should render')
    assert.equal(plan.querySelectorAll('[data-opencode-go-window]').length, 3)
    assert.equal(plan.textContent, '10%（月）')
    assert.match(plan.getAttribute('aria-label'), /OpenCode Go 用量/)

    const rings = [...plan.querySelectorAll('[data-opencode-go-window]')]
    assert.deepEqual(rings.map((ring) => ring.getAttribute('data-opencode-go-window')), [
      'rolling',
      'weekly',
      'monthly',
    ])
    assert.deepEqual(rings.map((ring) => ring.getAttribute('transform')), [
      'rotate(135 14 14)',
      'rotate(135 14 14)',
      'rotate(135 14 14)',
    ])
    assert.deepEqual(rings.map((ring) => {
      const fill = ring.querySelector('[data-opencode-go-window-color]')
      return fill.getAttribute('data-opencode-go-window-color')
    }), ['green', 'yellow', 'red'])
    assert.deepEqual(rings.map((ring) => {
      const fill = ring.querySelector('[data-opencode-go-window-color]')
      return fill.getAttribute('stroke-dasharray')
    }), ['75 125', '75 125', '75 125'])
    assert.deepEqual(rings.map((ring) => {
      const fill = ring.querySelector('[data-opencode-go-window-color]')
      return Number(fill.getAttribute('stroke-dashoffset'))
    }), [18.75, 48.75, 67.5])

    await act(async () => {
      plan.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }))
    })
    const tooltip = view.container.querySelector('[role="tooltip"]')
    assert.ok(tooltip, 'tooltip should open on hover')
    assert.match(tooltip.textContent, /5 小时/)
    assert.match(tooltip.textContent, /剩余 75%/)
    assert.match(tooltip.textContent, /月/)
    assert.match(tooltip.textContent, /后/)
  } finally {
    await view.unmount()
  }
})

test('renders the Settings page with bars and reset labels', async () => {
  response = { status: 200, body: JSON.stringify(usagePayload) }
  const { components, translate } = createPlugin()
  const Settings = components.get('settings.section')
  const view = await render(React.createElement(Settings, { t: translate }))

  try {
    const section = view.container.querySelector('[aria-labelledby="opencode-go-usage-title"]')
    assert.ok(section, 'settings section should render')
    assert.match(section.textContent, /剩余 75%/)
    assert.match(section.textContent, /已用 25%/)
    assert.match(section.textContent, /剩余 10%/)
    assert.match(section.textContent, /月/)
    assert.match(section.textContent, /更新于/)
  } finally {
    await view.unmount()
  }
})

test('explains an unavailable quota instead of rendering nothing', async () => {
  response = {
    status: 401,
    body: JSON.stringify({ status: 'unavailable', reason: 'invalid-key' }),
  }
  const { components, translate } = createPlugin()
  const Indicator = components.get('conversation.input.right')
  const view = await render(React.createElement(Indicator, { directory, t: translate }))

  try {
    const warning = view.container.querySelector('[data-opencode-go-usage="unavailable"]')
    assert.ok(warning, 'warning indicator should render')
    assert.match(warning.getAttribute('aria-label'), /OpenCode Go 用量不可用/)
    assert.match(warning.getAttribute('aria-label'), /密钥被拒绝/)

    await act(async () => {
      warning.dispatchEvent(new dom.window.MouseEvent('mouseover', { bubbles: true }))
    })
    const tooltip = view.container.querySelector('[role="tooltip"]')
    assert.ok(tooltip)
    assert.match(tooltip.textContent, /密钥被拒绝/)
  } finally {
    await view.unmount()
  }
})
