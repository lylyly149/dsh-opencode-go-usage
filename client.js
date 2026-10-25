window.__ModuleLoader__.load({
  id: '@lylyly149/dsh-opencode-go-usage',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    /** Same-origin route registered by this package's Host half. */
    const USAGE_PATH = '/plugins/dsh-opencode-go/usage'
    /** Provider id configured in this profile's `llm-pi-ai` patch. */
    const PROVIDER_ID = 'opencode-go'
    const POLL_INTERVAL_MS = 60_000
    const WINDOW_ORDER = ['rolling', 'weekly', 'monthly']
    const WINDOW_SHORT_KEYS = {
      rolling: 'windowShortRolling',
      weekly: 'windowShortWeekly',
      monthly: 'windowShortMonthly',
    }
    /** Outer-to-inner radii for the three nested quota rings. */
    const RING_RADII = [11.5, 8.5, 5.5]
    const RING_STROKE_WIDTH = 2
    /** Each ring keeps 270° of its circle; the bottom 90° stays open as a fan. */
    const RING_SWEEP = 75
    /**
     * Dash gap long enough that the offset-shifted dash never wraps back into
     * view; a gap of 25 (period 100) would always show 75 units regardless of
     * the offset.
     */
    const RING_DASH_GAP = 125
    /** Clockwise start angle putting the opening at the bottom (7:30 to 4:30). */
    const RING_START_DEGREES = 135

    const en = {
      nav: 'OpenCode Go',
      title: 'OpenCode Go plan usage',
      intro: 'Live usage for your OpenCode Go subscription, read from the official usage endpoint. The API key stays on this device.',
      rolling: '5 hours',
      weekly: 'Weekly',
      monthly: 'Monthly',
      percentRemaining: '{percent}% remaining',
      usedPercent: '{percent}% used',
      resetsAt: 'Resets {time}',
      resetCountdown: '({time})',
      resetUnavailable: 'Reset time unavailable',
      rateLimited: 'Rate limited',
      loading: 'Loading usage…',
      unavailable: 'Plan usage is unavailable right now.',
      warning: 'OpenCode Go usage unavailable',
      reasonMissingKey: 'No OpenCode Go API key is configured for this profile.',
      reasonInvalidKey: 'The OpenCode Go API key was rejected. Check the key under Settings → Models.',
      reasonNoSubscription: 'This workspace has no active OpenCode Go subscription.',
      reasonNetwork: 'The usage endpoint could not be reached. Check the network and try again.',
      reasonBadResponse: 'The usage endpoint returned an unexpected response.',
      reasonCredential: 'The stored OpenCode Go credential could not be read.',
      reasonForbidden: 'This page is not allowed to read usage from this host.',
      reasonRateLimited: 'The usage endpoint is rate-limiting requests. Try again later.',
      reasonServer: 'The usage endpoint is temporarily unavailable.',
      reasonHttp: 'The usage endpoint returned an error.',
      reasonInternal: 'The usage request failed inside the plugin.',
      reasonUnknown: 'The usage request failed.',
      refresh: 'Refresh',
      updatedAt: 'Updated {time}',
      summary: 'OpenCode Go usage: {summary}',
      windowSummary: '{label} {percent}% remaining',
      windowShortRolling: '5h',
      windowShortWeekly: 'week',
      windowShortMonthly: 'month',
      tightestLabel: '{percent}% ({window})',
      tooltipTitle: 'OpenCode Go plan',
    }

    const zh = {
      nav: 'OpenCode Go',
      title: 'OpenCode Go 套餐用量',
      intro: '来自 OpenCode 官方接口的 Go 套餐实时用量。API 密钥只保存在本机。',
      rolling: '5 小时',
      weekly: '每周',
      monthly: '每月',
      percentRemaining: '剩余 {percent}%',
      usedPercent: '已用 {percent}%',
      resetsAt: '{time} 重置',
      resetCountdown: '（{time}）',
      resetUnavailable: '无法获取重置时间',
      rateLimited: '已触发限流',
      loading: '正在读取用量…',
      unavailable: '暂时无法读取套餐用量。',
      warning: 'OpenCode Go 用量不可用',
      reasonMissingKey: '当前配置没有 OpenCode Go API 密钥。',
      reasonInvalidKey: 'OpenCode Go API 密钥被拒绝，请在“设置 → 模型”中检查。',
      reasonNoSubscription: '当前工作区没有有效的 OpenCode Go 订阅。',
      reasonNetwork: '无法连接用量接口，请检查网络后重试。',
      reasonBadResponse: '用量接口返回了无法识别的响应。',
      reasonCredential: '无法读取已保存的 OpenCode Go 凭据。',
      reasonForbidden: '当前页面无权从此主机读取用量。',
      reasonRateLimited: '用量接口正在限流，请稍后再试。',
      reasonServer: '用量接口暂时不可用。',
      reasonHttp: '用量接口返回错误。',
      reasonInternal: '插件内部请求失败。',
      reasonUnknown: '用量请求失败。',
      refresh: '刷新',
      updatedAt: '更新于 {time}',
      summary: 'OpenCode Go 用量：{summary}',
      windowSummary: '{label}剩余 {percent}%',
      windowShortRolling: '5h',
      windowShortWeekly: '周',
      windowShortMonthly: '月',
      tightestLabel: '{percent}%（{window}）',
      tooltipTitle: 'OpenCode Go 套餐',
    }

    const pageStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      maxWidth: 720,
    }
    const titleStyle = {
      margin: 0,
      fontSize: 20,
      lineHeight: '28px',
      fontWeight: 600,
      color: 'var(--dsw-alias-label-primary)',
    }
    const bodyStyle = {
      margin: 0,
      fontSize: 14,
      lineHeight: '22px',
      color: 'var(--dsw-alias-label-secondary)',
    }
    const cardStyle = {
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      padding: '18px 20px',
      border: '1px solid var(--dsw-alias-border-l2)',
      borderRadius: 12,
      background: 'var(--dsw-alias-bg-module-platform)',
    }
    const buttonStyle = {
      boxSizing: 'border-box',
      minHeight: 34,
      padding: '6px 14px',
      border: '1px solid var(--dsw-alias-border-l2)',
      borderRadius: 18,
      background: 'var(--dsw-alias-bg-layer-1)',
      color: 'var(--dsw-alias-label-primary)',
      font: 'inherit',
      fontSize: 14,
      cursor: 'pointer',
    }
    const errorStyle = {
      ...bodyStyle,
      color: 'var(--dsw-alias-state-error-primary)',
    }
    const tooltipStyle = {
      position: 'absolute',
      right: 0,
      bottom: 'calc(100% + 8px)',
      zIndex: 1000,
      minWidth: 232,
      padding: '8px 10px',
      borderRadius: 8,
      backgroundColor: 'var(--dsw-specific-tip, #1f2329)',
      color: 'var(--dsw-alias-label-primary, #ffffff)',
      boxShadow: 'var(--dsw-shadow-lv2, 0 4px 12px rgb(0 0 0 / 12%))',
      fontSize: 12,
      lineHeight: '18px',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      textAlign: 'left',
    }

    function isRecord(value) {
      return typeof value === 'object' && value !== null && !Array.isArray(value)
    }

    function normalizeUsage(value) {
      if (!isRecord(value) || value.status !== 'ok' || !Array.isArray(value.windows)) return undefined
      const windows = []
      for (const raw of value.windows) {
        if (!isRecord(raw) || typeof raw.id !== 'string' || !WINDOW_ORDER.includes(raw.id)) continue
        const used = raw.usedPercent
        if (typeof used !== 'number' || !Number.isFinite(used)) continue
        const resetsAt = typeof raw.resetsAt === 'string' && Number.isFinite(Date.parse(raw.resetsAt))
          ? raw.resetsAt
          : undefined
        windows.push({
          id: raw.id,
          status: raw.status === 'rate-limited' ? 'rate-limited' : 'ok',
          usedPercent: Math.max(0, Math.min(100, used)),
          ...resetsAt === undefined ? {} : { resetsAt },
        })
      }
      if (windows.length === 0) return undefined
      windows.sort((left, right) => WINDOW_ORDER.indexOf(left.id) - WINDOW_ORDER.indexOf(right.id))
      return {
        windows,
        ...typeof value.fetchedAt === 'string' ? { fetchedAt: value.fetchedAt } : {},
      }
    }

    function remainingOf(window) {
      if (window.status === 'rate-limited') return 0
      return Math.max(0, Math.min(100, 100 - window.usedPercent))
    }

    function quotaColor(remaining) {
      if (remaining >= 50) return { name: 'green', value: 'var(--dsw-alias-state-success-primary, #22c55e)' }
      if (remaining >= 20) return { name: 'yellow', value: 'var(--dsw-alias-state-warn-primary, #eab308)' }
      return { name: 'red', value: 'var(--dsw-alias-state-error-primary, #ef4444)' }
    }

    function formatPercent(value) {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value)
    }

    /**
     * The DSH locale, not the browser/OS locale. The shell keeps
     * `<html lang>` in sync with the active Harness language, so dates and
     * relative times follow the UI instead of mixing English dates into a
     * Chinese page.
     */
    function uiLocale() {
      try {
        const lang = globalThis.document?.documentElement?.lang
        return typeof lang === 'string' && lang.length > 0 ? lang : undefined
      } catch {
        return undefined
      }
    }

    function formatReset(value) {
      if (typeof value !== 'string') return undefined
      const time = Date.parse(value)
      if (!Number.isFinite(time)) return undefined
      try {
        return new Intl.DateTimeFormat(uiLocale(), {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(time))
      } catch {
        return undefined
      }
    }

    function formatUpdatedAt(value) {
      if (typeof value !== 'string') return undefined
      const time = Date.parse(value)
      if (!Number.isFinite(time)) return undefined
      try {
        return new Intl.DateTimeFormat(uiLocale(), {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(time))
      } catch {
        return undefined
      }
    }

    function formatCountdown(value) {
      if (typeof value !== 'string') return undefined
      const time = Date.parse(value)
      if (!Number.isFinite(time)) return undefined
      try {
        const formatter = new Intl.RelativeTimeFormat(uiLocale(), { numeric: 'auto' })
        const minutes = Math.max(0, Math.round((time - Date.now()) / 60_000))
        if (minutes < 60) return formatter.format(minutes, 'minute')
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return formatter.format(hours, 'hour')
        return formatter.format(Math.floor(hours / 24), 'day')
      } catch {
        return undefined
      }
    }

    function resetLabel(window, t) {
      const time = formatReset(window.resetsAt)
      if (time === undefined) return t('resetUnavailable')
      const countdown = formatCountdown(window.resetsAt)
      return countdown === undefined
        ? t('resetsAt', { time })
        : `${t('resetsAt', { time })} ${t('resetCountdown', { time: countdown })}`
    }

    function unavailableReason(reason, t) {
      switch (reason) {
        case 'missing-key': return t('reasonMissingKey')
        case 'invalid-key': return t('reasonInvalidKey')
        case 'no-subscription': return t('reasonNoSubscription')
        case 'network':
        case 'timeout': return t('reasonNetwork')
        case 'bad-response': return t('reasonBadResponse')
        case 'credential-error': return t('reasonCredential')
        case 'forbidden': return t('reasonForbidden')
        case 'rate-limited': return t('reasonRateLimited')
        case 'server-error': return t('reasonServer')
        case 'http-error': return t('reasonHttp')
        case 'internal-error': return t('reasonInternal')
        default: return t('reasonUnknown')
      }
    }

    function isOpenCodeGoModel(state) {
      return isRecord(state)
        && state.status === 'ready'
        && isRecord(state.current)
        && state.current.provider === PROVIDER_ID
    }

    /** Poll the Host route while `enabled`; `reloadToken` forces one refetch. */
    function useUsage(enabled, reloadToken) {
      // Start on `loading` when the caller is already enabled, so the Settings
      // page never flashes its unavailable card before the first effect runs.
      const [state, setState] = React.useState(() => enabled
        ? { status: 'loading' }
        : { status: 'idle' })

      React.useEffect(() => {
        if (!enabled) {
          setState({ status: 'idle' })
          return undefined
        }

        let disposed = false
        let timer
        let inFlight = false
        const controller = new AbortController()

        const load = async () => {
          if (disposed || inFlight) return
          inFlight = true
          try {
            const response = await fetch(USAGE_PATH, {
              method: 'GET',
              headers: { accept: 'application/json' },
              credentials: 'same-origin',
              signal: controller.signal,
            })
            const payload = await response.json().catch(() => undefined)
            if (disposed || controller.signal.aborted) return
            const usage = response.ok ? normalizeUsage(payload) : undefined
            if (usage !== undefined) {
              setState({ status: 'ready', usage })
              return
            }
            const reason = isRecord(payload) && typeof payload.reason === 'string'
              ? payload.reason
              : response.status === 403 ? 'forbidden' : 'unknown'
            setState((previous) => previous.status === 'ready' ? previous : { status: 'unavailable', reason })
          } catch {
            if (!disposed && !controller.signal.aborted) {
              setState((previous) => previous.status === 'ready' ? previous : { status: 'unavailable', reason: 'network' })
            }
          } finally {
            inFlight = false
          }
        }

        const stopTimer = () => {
          if (timer !== undefined) {
            window.clearInterval(timer)
            timer = undefined
          }
        }
        const startTimer = () => {
          stopTimer()
          timer = window.setInterval(() => { void load() }, POLL_INTERVAL_MS)
        }
        const onVisibilityChange = () => {
          if (typeof globalThis.document === 'undefined') return
          if (globalThis.document.visibilityState === 'hidden') {
            stopTimer()
            return
          }
          void load()
          startTimer()
        }

        setState({ status: 'loading' })
        void load()
        startTimer()
        if (typeof globalThis.document?.addEventListener === 'function') {
          globalThis.document.addEventListener('visibilitychange', onVisibilityChange)
        }
        return () => {
          disposed = true
          stopTimer()
          if (typeof globalThis.document?.removeEventListener === 'function') {
            globalThis.document.removeEventListener('visibilitychange', onVisibilityChange)
          }
          controller.abort()
        }
      }, [enabled, reloadToken])

      return state
    }

    /** Keep one broken slot entry from taking down the composer or Settings page. */
    class SlotErrorBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      render() {
        return this.state.failed ? (this.props.fallback ?? null) : this.props.children
      }
    }

    /** Explain why the composer indicator is absent instead of silently hiding. */
    function QuotaWarning({ t, reason }) {
      const [hovered, setHovered] = React.useState(false)
      const [focused, setFocused] = React.useState(false)
      const tooltipId = React.useId()
      const text = unavailableReason(reason, t)
      const label = `${t('warning')}: ${text}`
      const visible = hovered || focused

      return h('span', {
        role: 'status',
        tabIndex: 0,
        'data-opencode-go-usage': 'unavailable',
        'aria-label': label,
        'aria-describedby': visible ? tooltipId : undefined,
        onMouseEnter: () => { setHovered(true) },
        onMouseLeave: () => { setHovered(false) },
        onFocus: () => { setFocused(true) },
        onBlur: () => { setFocused(false) },
        style: {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 28,
          outline: 'none',
          cursor: 'help',
          color: 'var(--dsw-alias-state-warn-primary, #eab308)',
        },
      }, [
        h('span', {
          key: 'mark',
          'aria-hidden': true,
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: 999,
            border: '1px solid currentColor',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
          },
        }, '!'),
        visible ? h('span', {
          key: 'tooltip',
          id: tooltipId,
          role: 'tooltip',
          style: { ...tooltipStyle, minWidth: 200, maxWidth: 280, whiteSpace: 'normal' },
        }, [
          h('span', {
            key: 'title',
            style: { display: 'block', fontWeight: 600, marginBottom: 4 },
          }, t('warning')),
          h('span', { key: 'reason', style: { display: 'block' } }, text),
        ]) : null,
      ])
    }

    /** Slot wrapper keeps hooks out of the early return for a missing directory. */
    function OpenCodeGoIndicator({ directory, t }) {
      if (directory === undefined || directory === null) return null
      return h(SlotErrorBoundary, null, h(OpenCodeGoIndicatorBody, { directory, t }))
    }

    function OpenCodeGoIndicatorBody({ directory, t }) {
      const subscribe = React.useCallback((listener) => directory.subscribe(listener), [directory])
      const getSnapshot = React.useCallback(() => directory.getSnapshot(), [directory])
      const directoryState = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
      const eligible = isOpenCodeGoModel(directoryState)
      const usageState = useUsage(eligible, 0)
      const [hovered, setHovered] = React.useState(false)
      const [focused, setFocused] = React.useState(false)
      const tooltipId = React.useId()

      if (!eligible) return null
      if (usageState.status === 'unavailable') {
        return h(QuotaWarning, { t, reason: usageState.reason })
      }
      if (usageState.status !== 'ready') return null
      const windows = usageState.usage.windows
      if (windows.length === 0) return null

      const summary = windows
        .map((window) => t('windowSummary', {
          label: t(window.id),
          percent: formatPercent(remainingOf(window)),
        }))
        .join('; ')
      const tightest = windows.reduce(
        (lowest, window) => remainingOf(window) < remainingOf(lowest) ? window : lowest,
        windows[0],
      )
      const tightestText = t('tightestLabel', {
        percent: formatPercent(remainingOf(tightest)),
        window: t(WINDOW_SHORT_KEYS[tightest.id]),
      })
      const tooltipVisible = hovered || focused

      return h('span', {
        role: 'status',
        tabIndex: 0,
        'data-opencode-go-usage': 'plan',
        'aria-label': t('summary', { summary }),
        'aria-describedby': tooltipVisible ? tooltipId : undefined,
        onMouseEnter: () => { setHovered(true) },
        onMouseLeave: () => { setHovered(false) },
        onFocus: () => { setFocused(true) },
        onBlur: () => { setFocused(false) },
        style: {
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 6,
          height: 28,
          outline: 'none',
          cursor: 'default',
        },
      }, [
        h('svg', {
          key: 'rings',
          viewBox: '0 0 28 28',
          width: 28,
          height: 28,
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block', flex: '0 0 auto' },
        }, windows.map((window, index) => {
          const remaining = remainingOf(window)
          const color = quotaColor(remaining)
          const radius = RING_RADII[index] ?? RING_RADII[RING_RADII.length - 1]
          return h('g', {
            key: window.id,
            'data-opencode-go-window': window.id,
            transform: `rotate(${RING_START_DEGREES} 14 14)`,
          }, [
            h('circle', {
              key: 'track',
              cx: 14,
              cy: 14,
              r: radius,
              fill: 'none',
              stroke: 'var(--dsw-alias-border-l2)',
              strokeWidth: RING_STROKE_WIDTH,
              pathLength: 100,
              strokeDasharray: `${RING_SWEEP} ${RING_DASH_GAP}`,
            }),
            remaining <= 0 ? null : h('circle', {
              key: 'value',
              'data-opencode-go-window-color': color.name,
              cx: 14,
              cy: 14,
              r: radius,
              fill: 'none',
              stroke: color.value,
              strokeWidth: RING_STROKE_WIDTH,
              strokeLinecap: 'round',
              pathLength: 100,
              strokeDasharray: `${RING_SWEEP} ${RING_DASH_GAP}`,
              strokeDashoffset: RING_SWEEP - remaining * RING_SWEEP / 100,
              style: { transition: 'stroke-dashoffset 400ms ease, stroke 400ms ease' },
            }),
          ])
        })),
        h('span', {
          key: 'tightest',
          'data-opencode-go-tightest': tightest.id,
          style: {
            fontSize: 11,
            lineHeight: '16px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: quotaColor(remainingOf(tightest)).value,
          },
        }, tightestText),
        tooltipVisible ? h('span', {
          key: 'tooltip',
          id: tooltipId,
          role: 'tooltip',
          style: tooltipStyle,
        }, [
          h('span', {
            key: 'title',
            style: { display: 'block', fontWeight: 600, marginBottom: 4 },
          }, t('tooltipTitle')),
          ...windows.map((window) => h('span', {
            key: window.id,
            style: { display: 'flex', alignItems: 'center', gap: 6 },
          }, [
            h('span', {
              key: 'dot',
              style: {
                width: 7,
                height: 7,
                flex: '0 0 auto',
                borderRadius: 999,
                backgroundColor: quotaColor(remainingOf(window)).value,
              },
            }),
            h('span', {
              key: 'label',
              style: { minWidth: 64, color: 'var(--dsw-alias-label-secondary, #c9cdd4)' },
            }, t(window.id)),
            h('span', {
              key: 'percent',
              style: { fontVariantNumeric: 'tabular-nums' },
            }, t('percentRemaining', { percent: formatPercent(remainingOf(window)) })),
            h('span', {
              key: 'reset',
              style: { opacity: 0.72 },
            }, `· ${resetLabel(window, t)}`),
          ])),
        ]) : null,
      ])
    }

    function OpenCodeGoWindow({ window, t }) {
      const remaining = remainingOf(window)
      const color = quotaColor(remaining)
      return h('div', {
        style: { display: 'flex', flexDirection: 'column', gap: 8 },
      }, [
        h('div', {
          key: 'label',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--dsw-alias-label-secondary)',
          },
        }, [
          h('span', {
            key: 'name',
            style: { fontWeight: 600, color: 'var(--dsw-alias-label-primary)' },
          }, t(window.id)),
          h('span', {
            key: 'percent',
            style: { fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: color.value },
          }, t('percentRemaining', { percent: formatPercent(remaining) })),
        ]),
        h('div', {
          key: 'track',
          style: {
            height: 8,
            overflow: 'hidden',
            borderRadius: 999,
            background: 'var(--dsw-alias-bg-layer-2, rgba(0, 0, 0, 0.08))',
          },
        }, h('div', {
          style: {
            width: `${remaining}%`,
            height: '100%',
            borderRadius: 'inherit',
            backgroundColor: color.value,
          },
        })),
        h('div', {
          key: 'meta',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--dsw-alias-label-tertiary, #8a919f)',
          },
        }, [
          h('span', { key: 'used' }, window.status === 'rate-limited'
            ? t('rateLimited')
            : t('usedPercent', { percent: formatPercent(window.usedPercent) })),
          h('span', { key: 'reset' }, resetLabel(window, t)),
        ]),
      ])
    }

    function OpenCodeGoSettings({ t }) {
      const translate = typeof t === 'function' ? t : (key) => key
      return h(SlotErrorBoundary, {
        fallback: h('p', { style: errorStyle }, translate('unavailable')),
      }, h(OpenCodeGoSettingsBody, { t }))
    }

    function OpenCodeGoSettingsBody({ t }) {
      const translate = typeof t === 'function' ? t : (key) => key
      const [reloadToken, setReloadToken] = React.useState(0)
      const usageState = useUsage(true, reloadToken)
      const fetchedAt = usageState.status === 'ready' ? formatUpdatedAt(usageState.usage.fetchedAt) : undefined

      return h('section', {
        style: pageStyle,
        'aria-labelledby': 'opencode-go-usage-title',
      }, [
        h('div', { key: 'heading' }, [
          h('h2', {
            key: 'title',
            id: 'opencode-go-usage-title',
            style: titleStyle,
          }, translate('title')),
          h('p', { key: 'intro', style: { ...bodyStyle, marginTop: 6 } }, translate('intro')),
        ]),
        h('div', { key: 'card', style: cardStyle }, [
          usageState.status === 'ready'
            ? h('div', {
                key: 'windows',
                style: { display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 2 },
              }, usageState.usage.windows.map((window) => h(OpenCodeGoWindow, {
                key: window.id,
                window,
                t: translate,
              })))
            : usageState.status === 'loading'
              ? h('p', { key: 'loading', style: bodyStyle }, translate('loading'))
              : h('div', {
                  key: 'error',
                  style: { display: 'flex', flexDirection: 'column', gap: 10 },
                }, [
                  h('p', { key: 'message', style: errorStyle }, translate('unavailable')),
                  h('p', { key: 'reason', style: bodyStyle }, unavailableReason(usageState.reason, translate)),
                  h('div', { key: 'actions' }, h('button', {
                    type: 'button',
                    style: buttonStyle,
                    onClick: () => { setReloadToken((value) => value + 1) },
                  }, translate('refresh'))),
                ]),
          fetchedAt === undefined ? null : h('p', {
            key: 'updated',
            style: { ...bodyStyle, fontSize: 12, opacity: 0.72 },
          }, translate('updatedAt', { time: fetchedAt })),
        ]),
      ])
    }

    return {
      inject: ['slots', 'modelDirectories', 'locale'],
      apply(ctx) {
        const namespace = 'settings.opencode-go-usage'
        ctx.effect(() => ctx.locale.register(namespace, { zh, en }), 'dsh-opencode-go-usage: copy')
        const t = ctx.locale.bind(namespace)

        ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
          name: 'conversation.input.right',
          id: 'opencode-go-usage',
          order: 20,
          locale: namespace,
          inject: (sessionId) => ({
            directory: ctx.modelDirectories.directoryFor(sessionId).store,
          }),
        }, OpenCodeGoIndicator))

        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'opencode-go-usage',
          order: 25,
          label: () => t('nav'),
          inject: () => ({ t }),
        }, OpenCodeGoSettings))
      },
    }
  },
})
