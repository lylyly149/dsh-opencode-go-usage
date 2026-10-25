import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')
const manifest = JSON.parse(read('package.json'))

test('manifest is publication-ready', () => {
  assert.equal(manifest.name, '@lylyly149/dsh-opencode-go-usage')
  assert.equal(manifest.version, '1.1.2')
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.license, 'MIT')
  assert.equal(manifest.publishConfig?.access, 'public')
  assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh?.client?.platform, 'web')
  assert.equal(manifest.engines?.node, '>=18')
  assert.match(manifest.engines?.dsh ?? '', /^>=0\.2\./)
  assert.match(manifest.repository?.url ?? '', /^git\+https:\/\/github\.com\/lylyly149\//)
  assert.ok(manifest.files.includes('LICENSE'))
  assert.ok(manifest.files.includes('README.zh.md'))
  assert.ok(manifest.files.includes('SECURITY.md'))
  assert.ok(manifest.files.includes('CONTRIBUTING.md'))
  assert.ok(manifest.files.includes('client.js'))
  assert.ok(manifest.files.includes('index.js'))
  assert.equal(typeof manifest.dependencies?.['@deepseek-ai/schemastery'], 'string')
})

test('bundle patch and client module use the published package name', () => {
  const patch = read('cordis.patch.yml')
  assert.match(patch, /name: '@lylyly149\/dsh-opencode-go-usage'/)
  assert.match(patch, /id: opencode-go-usage/)
  assert.match(read('client.js'), /id: '@lylyly149\/dsh-opencode-go-usage'/)
})

test('display metadata and icon are present in both locales', () => {
  for (const locale of ['en', 'zh']) {
    const meta = JSON.parse(read(`locale/${locale}.json`))
    assert.equal(typeof meta.meta?.title, 'string')
    assert.ok(meta.meta.title.length > 0)
    assert.equal(typeof meta.meta.description, 'string')
    assert.ok(meta.meta.description.length > 0)
  }
  assert.match(read('icon.svg'), /^<svg[\s>]/)
  assert.ok(existsSync(new URL('LICENSE', root)))
})

test('published text files contain no local paths or obvious secrets', () => {
  const files = [
    'index.js',
    'client.js',
    'cordis.patch.yml',
    'README.md',
    'README.zh.md',
    'CHANGELOG.md',
    'SECURITY.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'icon.svg',
    'locale/en.json',
    'locale/zh.json',
  ]
  const forbidden = [
    '/Users/',
    'C:\\Users\\',
    '/home/',
    'sk-',
    'ghp_',
    'gho_',
    'github_pat_',
    'BEGIN PRIVATE KEY',
    'BEGIN OPENSSH PRIVATE KEY',
  ]
  for (const file of files) {
    const text = read(file)
    for (const marker of forbidden) {
      assert.equal(
        text.includes(marker),
        false,
        `${file} contains a private marker: ${marker}`,
      )
    }
  }
})
