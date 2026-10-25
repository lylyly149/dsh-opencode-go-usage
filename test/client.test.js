import assert from 'node:assert/strict'
import test from 'node:test'

let definition
globalThis.window = {
  __ModuleLoader__: {
    load(value) { definition = value },
  },
}

await import('../client.js')

const React = {
  Component: class Component {
    constructor(props) { this.props = props }
  },
  createElement: (type, props, ...children) => ({ type, props, children }),
  useCallback: (fn) => fn,
  useEffect: () => {},
  useId: () => 'id',
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useSyncExternalStore: () => ({ status: 'idle' }),
}

test('registers the composer indicator and Settings page', () => {
  assert.equal(definition.id, '@lylyly149/dsh-opencode-go-usage')
  const plugin = definition.factory((name) => {
    if (name === 'react') return React
    throw new Error(`unexpected module: ${name}`)
  })
  assert.deepEqual(plugin.inject, ['slots', 'modelDirectories', 'locale'])

  const registrations = []
  let dictionaries
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
      bind: () => (key) => key,
    },
    slots: {
      inject: (_owner, callback) => callback(),
      register: (options, component) => {
        registrations.push({ options, component })
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

  assert.deepEqual(
    registrations.map((registration) => registration.options.name),
    ['conversation.input.right', 'settings.section'],
  )
  assert.equal(registrations[0].options.id, 'opencode-go-usage')
  assert.equal(registrations[1].options.id, 'opencode-go-usage')

  assert.ok(dictionaries.en)
  assert.ok(dictionaries.zh)
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.zh).sort())
  assert.equal(dictionaries.en.rolling, '5 hours')
  assert.equal(dictionaries.zh.rolling, '5 小时')
  assert.equal(dictionaries.zh.windowShortMonthly, '月')
  assert.equal(dictionaries.zh.tightestLabel, '{percent}%（{window}）')
  assert.equal(dictionaries.en.tightestLabel, '{percent}% ({window})')
})
