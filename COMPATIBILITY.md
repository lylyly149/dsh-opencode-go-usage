# Compatibility

## Matrix

| Component | Supported / tested |
|---|---|
| DeepSeek Harness host | `0.2.1-rc.3` tested; `>=0.2.1-rc.1` declared in `engines.dsh` |
| Node.js | 18+ at runtime; CI runs 20 and 22 |
| React (shell runtime) | 18.x; the client bundle uses the shell's React |
| Harness Web UI | Chromium-based Web/Desktop shell with `window.__ModuleLoader__`, slots, locale, and CSS theme tokens |
| Host services | `webServer`, `credentials` |
| Client services | `slots`, `locale`, `modelDirectories` |
| Upstream API | `https://opencode.ai/zen/go/v1/usage` |
| Package format | ESM host half + hand-authored `./client` factory bundle; no build step |

## Notes

- DSH client and Cordis APIs are prerelease. A new DSH rc can change slot names,
  service signatures, or the Loader patch dialect. Run `npm test` and a manual
  smoke test before widening the `engines.dsh` range.
- The composer indicator depends on the shipped
  `dsh-client-ui-conversation`, `dsh-client-ui-settings`,
  `dsh-client-ui-model-selection`, and `dsh-client-locale` packages. A minimal
  composition without them will leave the plugin inactive rather than partially
  rendered.
- The Host `Config` schema requires `@deepseek-ai/schemastery`; the package
  declares it as a runtime dependency.
- The 270° fan geometry is covered by jsdom/react-dom component tests; a full
  DSH browser session is still part of the manual release checklist.
