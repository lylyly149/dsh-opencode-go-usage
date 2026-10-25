# Contributing

## Development

Requirements: Node.js 18 or newer and npm.

```bash
npm install
npm test
npm pack --dry-run
```

The test suite has three layers:

- `test/host.test.js` — the Host route, credential fallback, HTTPS guard,
  cache/backoff, and credential invalidation.
- `test/client.test.js` — bundle identity, slot registration, and locale keys.
- `test/client-render.test.js` — the real client components in jsdom, covering
  the 270° fan geometry, colors, Settings page, and unavailable state.
- `test/manifest.test.js` — package metadata, patch/client identity, display
  metadata, and a privacy scan of published text files.

## Privacy rules for contributions

- Never commit API keys, tokens, DSH profiles, session logs, or absolute local
  paths.
- Never use a real account's quota screenshot. Use synthetic values and label
  them as illustrative.
- Keep the preview under `docs/` synthetic; the privacy test only checks text
  files, so also inspect any new image manually.
- Use a GitHub noreply address for commits if you do not want a private email
  published.

## Plugin changes

- Host and client halves are plain ESM and a hand-authored
  `window.__ModuleLoader__.load` bundle respectively. There is no build step.
- Keep the Loader row name, client bundle id, and package name identical.
- Keep the Host key on the Host. The browser must only call the same-origin
  route.
- Preserve the `engines.dsh` range or update it with the tested DSH version.
- Add or update tests for behavior changes, and run `npm pack --dry-run` to
  confirm the published file list.

## Release

1. Update `CHANGELOG.md` and the version in `package.json`.
2. Run `npm test` and `npm pack --dry-run`.
3. Commit and tag `v<version>`.
4. Push the tag, then run the **Release** workflow from GitHub Actions. It
   publishes to npm with provenance once npm Trusted Publishing is configured
   for this repository.
