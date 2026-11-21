/**
 * Session overview — one Conversation View tab that reads the whole session.
 *
 * Every figure comes from a Host-computed session projection (`tokenUsage`,
 * `contextPressure`, `contextBreakdown`, `sessionStats`, `sessionActivity`,
 * `modelSelection`, `subagentCatalog`), so paging history or compacting cannot
 * change it. A projection the profile does not mount drops its card, and a card
 * appears only when it has a figure to show.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-session-overview',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'session-overview'

    const zh = {
      'view.title': '概览',
      'board.title': '会话概览',
      'board.sub': '整段会话日志的统计，翻页与压缩不会改变',
      'state.running': '运行中',
      'state.idle': '空闲',
      'tile.total': '总词元',
      'tile.total.sub': '提示词 {prompt} · 输出 {output}',
      'tile.cache': '缓存命中',
      'tile.cache.sub': '缓存读 {read}',
      'tile.cache.none': '没有计费输入',
      'tile.calls': '工具调用',
      'tile.calls.sub': '失败 {failed} · 用时 {time}',
      'tile.steps': '轮次 / 步数',
      'tile.steps.sub': '模型用时 {time}',
      'tile.cost': '会话费用',
      'tile.cost.sub': '峰时 {peak} · 空闲 {offPeak}',
      'tokens.title': '词元构成',
      'tokens.note': '提示词 {prompt} · 合计 {total}',
      'bucket.input': '未缓存输入',
      'bucket.cacheRead': '缓存读取',
      'bucket.cacheWrite': '缓存写入',
      'bucket.output': '输出',
      'tools.title': '工具与扩展',
      'tools.note': '{kinds} 种 · {calls} 次 · 失败 {failed}',
      'tools.ptc': '含代码模式子调用 {count} 次',
      'tools.failed': '失败 {count}',
      'kind.core': '内置',
      'kind.mcp': 'MCP',
      'kind.plugin': '插件',
      'kind.skill': '技能',
      'models.title': '模型与费用',
      'models.note': '当前 {route}',
      'models.detail': '{requests} 次 · {tokens} · 峰 {peak} / 谷 {offPeak}',
      'models.pricing': '价格：DeepSeek 官方价目表（{since} 起），峰时工作日 09–12、14–18，其余时段按峰时半价',
      'models.unpriced': '{count} 条路由无价目，未计入总额',
      'skills.title': '技能',
      'skills.note': '{count} 个 · 加载 {loads} 次',
      'skills.row': '{loads} 次',
      'subagents.title': '子代理',
      'subagents.note': '{count} 个',
      'subagents.mode.one-shot': '一次性',
      'subagents.mode.continuable': '可续',
      'subagents.mode.external': '外部',
      'subagents.mode.unknown': '未知',
      'context.title': '上下文占用',
      'context.figures': '约 {used} / {window}',
      'context.figuresNoWindow': '约 {used} / 窗口未知',
      'context.noWindow': '当前模型未报告上下文容量',
      'context.system': '系统提示词',
      'context.tools': '工具定义',
      'context.messages': '对话消息',
      'context.note': '构成按本地估算，比例仅供参考',
      'time.title': '时间',
      'time.llm': '模型用时',
      'time.tool': '工具用时',
      'time.ttft': '首字延迟（均值）',
      'time.speed': '输出速度',
      'time.note': '模型用时含首字与生成',
      'errors.title': '异常',
      'errors.tool': '工具失败',
      'errors.turn': '轮次错误',
      'errors.aborted': '中断',
      'errors.maxTokens': '触顶截断',
      'errors.retries': '请求重试',
      'errors.compactions': '上下文压缩',
      'errors.last': '第 {turn} 轮：{message}',
      'detail.title': '逐轮明细',
      'detail.note': '{turns} 轮 · {steps} 步',
      'detail.turn': '第 {turn} 轮',
      'detail.step': '第 {step} 步',
      'detail.turnSteps': '{count} 步',
      'detail.answer': '回答',
      'detail.retried': '重试',
      'detail.interrupted': '中断',
      'detail.context': '上下文 {value}',
      'detail.output': '输出 {value}',
      'detail.cache': '缓存 {percent}',
      'detail.ttft': '首字 {value}',
      'detail.tool': '工具 {value}',
      'detail.model': '模型 {value}',
      'empty.title': '还没有会话数据',
      'empty.body': '本会话完成一次模型请求后，这里会出现词元、模型、工具、子代理和异常统计。',
      'num.thousand': '{value}K',
      'num.million': '{value}M',
      'unit.tps': '{value} tok/s',
      'duration.instant': '<1 秒',
      'duration.seconds': '{value} 秒',
      'duration.minutes': '{minutes} 分 {seconds} 秒',
      'duration.hours': '{hours} 小时 {minutes} 分',
    }

    const en = {
      'view.title': 'Overview',
      'board.title': 'Session overview',
      'board.sub': 'Whole-log figures; paging and compaction cannot change them',
      'state.running': 'Running',
      'state.idle': 'Idle',
      'tile.total': 'Total tokens',
      'tile.total.sub': 'Prompt {prompt} · output {output}',
      'tile.cache': 'Cache hit',
      'tile.cache.sub': '{read} read',
      'tile.cache.none': 'No billed input',
      'tile.calls': 'Tool calls',
      'tile.calls.sub': '{failed} failed · {time}',
      'tile.steps': 'Turns / steps',
      'tile.steps.sub': 'Model time {time}',
      'tile.cost': 'Session cost',
      'tile.cost.sub': 'Peak {peak} · off-peak {offPeak}',
      'tokens.title': 'Token composition',
      'tokens.note': 'Prompt {prompt} · total {total}',
      'bucket.input': 'Uncached input',
      'bucket.cacheRead': 'Cached input',
      'bucket.cacheWrite': 'Cache write',
      'bucket.output': 'Output',
      'tools.title': 'Tools and extensions',
      'tools.note': '{kinds} kinds · {calls} calls · {failed} failed',
      'tools.ptc': '{count} of them inside code mode',
      'tools.failed': '{count} failed',
      'kind.core': 'Built-in',
      'kind.mcp': 'MCP',
      'kind.plugin': 'Plugin',
      'kind.skill': 'Skill',
      'models.title': 'Models and cost',
      'models.note': 'Now {route}',
      'models.detail': '{requests} requests · {tokens} · peak {peak} / off-peak {offPeak}',
      'models.pricing': 'Rates: DeepSeek official price list (since {since}); peak on weekdays 09–12 and 14–18, half rate otherwise',
      'models.unpriced': '{count} routes have no price entry and are not counted in the total',
      'skills.title': 'Skills',
      'skills.note': '{count} skills · {loads} loads',
      'skills.row': '{loads} loads',
      'subagents.title': 'Subagents',
      'subagents.note': '{count} children',
      'subagents.mode.one-shot': 'One-shot',
      'subagents.mode.continuable': 'Continuable',
      'subagents.mode.external': 'External',
      'subagents.mode.unknown': 'Unknown',
      'context.title': 'Context occupancy',
      'context.figures': '~{used} / {window}',
      'context.figuresNoWindow': '~{used} / window unknown',
      'context.noWindow': 'The current model reports no context capacity',
      'context.system': 'System prompt',
      'context.tools': 'Tool schemas',
      'context.messages': 'Messages',
      'context.note': 'Composition is estimated locally; shares are approximate',
      'time.title': 'Time',
      'time.llm': 'Model time',
      'time.tool': 'Tool time',
      'time.ttft': 'First token (avg)',
      'time.speed': 'Output speed',
      'time.note': 'Model time includes first token and generation',
      'errors.title': 'Failures',
      'errors.tool': 'Tool failures',
      'errors.turn': 'Turn errors',
      'errors.aborted': 'Interrupted',
      'errors.maxTokens': 'Output ceiling',
      'errors.retries': 'Request retries',
      'errors.compactions': 'Compactions',
      'errors.last': 'Turn {turn}: {message}',
      'detail.title': 'Turn detail',
      'detail.note': '{turns} turns · {steps} steps',
      'detail.turn': 'Turn {turn}',
      'detail.step': 'Step {step}',
      'detail.turnSteps': '{count} steps',
      'detail.answer': 'answer',
      'detail.retried': 'retried',
      'detail.interrupted': 'interrupted',
      'detail.context': 'context {value}',
      'detail.output': 'output {value}',
      'detail.cache': 'cache {percent}',
      'detail.ttft': 'first token {value}',
      'detail.tool': 'tools {value}',
      'detail.model': 'model {value}',
      'empty.title': 'No session data yet',
      'empty.body': 'Send a message and this board will show tokens, models, tools, subagents and failures.',
      'num.thousand': '{value}K',
      'num.million': '{value}M',
      'unit.tps': '{value} tok/s',
      'duration.instant': '<1s',
      'duration.seconds': '{value}s',
      'duration.minutes': '{minutes}m {seconds}s',
      'duration.hours': '{hours}h {minutes}m',
    }

    const CSS = `
.so-root {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 48px;
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.5;
}
.so-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; }
.so-title { margin: 0; font-size: 15px; font-weight: 600; }
.so-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.so-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); }
.so-badge[data-running='true'] .so-dot { background: var(--dsw-alias-state-success-primary); }
.so-sub { margin-left: auto; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.so-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
.so-tile { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg, 10px); background: var(--dsw-alias-bg-layer-1); }
.so-tile-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.so-tile-value { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
.so-tile-sub { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.so-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px; }
.so-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 14px 16px 16px; border: 1px solid var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg, 10px); background: var(--dsw-alias-bg-layer-1); }
.so-wide { grid-column: 1 / -1; }
.so-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.so-card-title { margin: 0; font-size: 13px; font-weight: 600; }
.so-card-note { font-size: 11px; color: var(--dsw-alias-label-secondary); text-align: right; }
.so-note-left { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.so-bar { display: flex; height: 10px; overflow: hidden; border-radius: 5px; background: var(--dsw-alias-bg-layer-2); }
.so-seg { height: 100%; min-width: 0; }
.so-rows { display: flex; flex-direction: column; gap: 6px; }
.so-row { display: flex; align-items: center; gap: 8px; min-height: 18px; }
.so-row-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.so-swatch { flex: none; width: 8px; height: 8px; border-radius: 2px; }
.so-row-right { display: inline-flex; align-items: baseline; gap: 10px; margin-left: auto; }
.so-row-share { font-size: 11px; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.so-row-value { font-variant-numeric: tabular-nums; }
.so-model { display: flex; flex-direction: column; gap: 2px; }
.so-model-sub { font-size: 11px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.so-turns { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; padding-right: 4px; }
.so-turn { display: flex; flex-direction: column; gap: 2px; padding: 6px 0 2px; border-top: 1px solid var(--dsw-alias-border-l1); }
.so-turn:first-child { padding-top: 0; border-top: 0; }
.so-turn-head { display: flex; align-items: baseline; gap: 8px; width: 100%; padding: 2px 0; border: 0; background: none; color: inherit; font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.so-turn-head:hover .so-turn-label { color: var(--dsw-alias-brand-primary); }
.so-caret { flex: none; width: 10px; color: var(--dsw-alias-label-secondary); }
.so-turn-label { flex: none; font-weight: 600; }
.so-turn-prompt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); }
.so-turn-right { display: inline-flex; align-items: baseline; gap: 10px; margin-left: auto; }
.so-detail { padding-left: 18px; font-size: 11px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.so-steps { display: flex; flex-direction: column; gap: 5px; margin-top: 5px; padding-left: 18px; }
.so-step { display: flex; flex-direction: column; gap: 1px; }
.so-step-head { display: flex; align-items: baseline; gap: 8px; }
.so-step-label { flex: none; color: var(--dsw-alias-label-secondary); }
.so-step-did { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.so-step-detail { font-size: 11px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.so-track { flex: 1; height: 6px; overflow: hidden; border-radius: 3px; background: var(--dsw-alias-bg-layer-2); }
.so-fill { height: 100%; border-radius: 3px; background: var(--dsw-alias-brand-primary); }
.so-headline { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
.so-headline-value { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
.so-headline-sub { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.so-chip { flex: none; padding: 0 6px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px; font-size: 10px; line-height: 16px; color: var(--dsw-alias-label-secondary); }
.so-chip-mcp { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.so-chip-plugin { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.so-chip-skill { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.so-fail { font-size: 11px; color: var(--dsw-alias-state-error-primary); font-variant-numeric: tabular-nums; }
.so-muted { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.so-lasterror { padding: 8px 10px; border-radius: 8px; background: var(--dsw-alias-bg-layer-2); font-size: 12px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
.so-empty { display: flex; flex-direction: column; gap: 6px; padding: 26px 20px; border: 1px dashed var(--dsw-alias-border-l1); border-radius: var(--dsw-radius-lg, 10px); }
.so-empty-title { font-size: 14px; font-weight: 600; }
.so-empty-body { color: var(--dsw-alias-label-secondary); }
.so-c-input { background: var(--dsw-alias-label-secondary); }
.so-c-read { background: var(--dsw-alias-state-success-primary); }
.so-c-write { background: var(--dsw-alias-state-warn-primary); }
.so-c-output { background: var(--dsw-alias-brand-primary); }
.so-c-system { background: var(--dsw-alias-state-idle-primary); }
.so-c-tools { background: var(--dsw-alias-state-success-primary); }
.so-c-messages { background: var(--dsw-alias-brand-primary); }
@media (max-width: 560px) {
  .so-root { padding: 16px 16px 40px; }
  .so-head { flex-direction: column; align-items: flex-start; gap: 4px; }
  .so-sub { margin-left: 0; }
  .so-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .so-card-head { flex-direction: column; gap: 2px; }
  .so-card-note { text-align: left; }
}
`

    /** True for a finite non-negative count; every projection figure passes this. */
    function isCount(value) {
      return typeof value === 'number' && Number.isFinite(value) && value >= 0
    }

    function scaled(value) {
      return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
    }

    /** Exact count with digit grouping; the visible figure stays compact. */
    function group(value) {
      return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    /** Compact token count: 517, 12.2K, 1.2M. */
    function tokens(value, t) {
      if (!isCount(value)) return '—'
      if (value < 1_000) return String(Math.round(value))
      if (value < 999_500) return t('num.thousand', { value: scaled(value / 1_000) })
      return t('num.million', { value: scaled(value / 1_000_000) })
    }

    /** 45.2 秒 under a minute, 2 分 42 秒 from there on, hours past 60 minutes. */
    function clock(ms, t) {
      if (!isCount(ms)) return '—'
      const seconds = ms / 1_000
      if (seconds < 1) return t('duration.instant')
      if (seconds < 60) return t('duration.seconds', { value: Math.round(seconds * 10) / 10 })
      const whole = Math.round(seconds)
      if (whole < 3_600) return t('duration.minutes', { minutes: Math.floor(whole / 60), seconds: whole % 60 })
      return t('duration.hours', { hours: Math.floor(whole / 3_600), minutes: Math.floor(whole % 3_600 / 60) })
    }

    function percentText(value) {
      return `${Math.round(value * 10) / 10}%`
    }

    /**
     * Cache-hit share that never rounds a partial hit to 100% or a small hit to
     * 0%: both readings would contradict the buckets shown next to them.
     */
    function hitPercent(cacheRead, prompt) {
      if (prompt <= 0) return null
      let value = Math.round(cacheRead / prompt * 1000) / 10
      if (cacheRead < prompt && value >= 100) value = 99.9
      if (cacheRead > 0 && value <= 0) value = 0.1
      return percentText(value)
    }

    function cacheHitText(usage) {
      return hitPercent(usage.cacheReadTokens, usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens)
    }

    function share(part, whole) {
      return isCount(part) && isCount(whole) && whole > 0 ? part / whole * 100 : 0
    }

    function exact(text, value) {
      return isCount(value) ? `${text} ${group(value)}` : text
    }

    function statTile(key, label, value, sub, title) {
      return h('div', { key, className: 'so-tile', title },
        h('span', { className: 'so-tile-label' }, label),
        h('span', { className: 'so-tile-value' }, value),
        h('span', { className: 'so-tile-sub' }, sub))
    }

    /** One card; `wide` spans every grid column. */
    function card(key, title, note, children, wide) {
      return h('div', { key, className: wide === true ? 'so-card so-wide' : 'so-card' },
        h('div', { className: 'so-card-head' },
          h('h3', { className: 'so-card-title' }, title),
          note === null ? null : h('span', { className: 'so-card-note' }, note)),
        ...children)
    }

    /** Decorative stacked bar; the legend rows below carry the same figures as text. */
    function stackedBar(segments) {
      return h('div', { className: 'so-bar', 'aria-hidden': true }, segments.map(segment =>
        h('div', {
          key: segment.key,
          className: `so-seg ${segment.cls}`,
          style: { width: `${segment.width}%` },
          title: segment.title,
        })))
    }

    function legendRow(key, cls, name, value, shareText, title) {
      return h('div', { key, className: 'so-row', title },
        h('span', { className: `so-swatch ${cls}`, 'aria-hidden': true }),
        h('span', { className: 'so-row-name' }, name),
        h('span', { className: 'so-row-right' },
          shareText === null ? null : h('span', { className: 'so-row-share' }, shareText),
          h('span', { className: 'so-row-value' }, value)))
    }

    function timeRow(key, name, ms, longest, t) {
      return h('div', { key, className: 'so-row', title: isCount(ms) ? `${Math.round(ms)} ms` : undefined },
        h('span', { className: 'so-row-name' }, name),
        h('div', { className: 'so-track' },
          h('div', { className: 'so-fill', style: { width: `${Math.min(100, isCount(ms) ? ms / longest * 100 : 0)}%` } })),
        h('span', { className: 'so-row-right' }, h('span', { className: 'so-row-value' }, clock(ms, t))))
    }

    /** A reading without a bar: figures that are not a share of something else. */
    function valueRow(key, name, value, title) {
      return h('div', { key, className: 'so-row', title },
        h('span', { className: 'so-row-name' }, name),
        h('span', { className: 'so-row-right' }, h('span', { className: 'so-row-value' }, value)))
    }

    /** A named entry with one chip and right-aligned readings. */
    function entryRow(key, name, chip, right, title) {
      return h('div', { key, className: 'so-row', title },
        h('span', { className: 'so-row-name' }, name),
        chip === null ? null : h('span', { className: `so-chip ${chip.cls}` }, chip.label),
        h('span', { className: 'so-row-right' }, right))
    }

    /**
     * DeepSeek 官方价目表，峰时价，单位：元 / 百万 tokens；谷时价为峰时价的一半。
     * 来源见 PRICING_SOURCE，2026-08-17 起生效。改价时同步 PRICING_SINCE；
     * 模型不在表里就不计价，在页面上单独标出。
     */
    const PRICES = {
      'deepseek-flash': { cacheRead: 0.04, input: 2, output: 8 },
      'deepseek-v4-flash': { cacheRead: 0.04, input: 2, output: 8 },
      'deepseek-v4-flash-vision-exp': { cacheRead: 0.04, input: 2, output: 8 },
      'deepseek-v4-pro': { cacheRead: 0.30, input: 9, output: 27 },
    }
    const PRICING_SINCE = '2026-08-17'
    const PRICING_SOURCE = 'https://api-docs.deepseek.com/zh-cn/quick_start/pricing'

    /** The peak-period price of one model route, or null when the model has no official price. */
    function priceOf(model) {
      return Object.hasOwn(PRICES, model) ? PRICES[model] : null
    }

    /** Cost of one period's buckets at that model's peak rates, in yuan. */
    function bucketCost(buckets, price) {
      if (buckets === null || typeof buckets !== 'object') return 0
      // DeepSeek bills uncached prompt input and (rarely reported) cache writes
      // at the same miss rate; reads and output carry their own rates.
      return (buckets.input * price.input + buckets.cacheWrite * price.input
        + buckets.cacheRead * price.cacheRead + buckets.output * price.output) / 1_000_000
    }

    /** Peaked cost of one route: peak buckets at full rate, off-peak buckets at half. */
    function routeCost(model, price) {
      return bucketCost(model.peak, price) + bucketCost(model.offPeak, price) * 0.5
    }

    /** Yuan amount: two decimals from one yuan up, four below, so cheap sessions stay readable. */
    function money(value) {
      if (!isCount(value)) return '—'
      if (value === 0) return '¥0'
      return value >= 1 ? `¥${value.toFixed(2)}` : `¥${value.toFixed(4)}`
    }

    /** Prompt and output tokens of one period's buckets. */
    function periodTokens(buckets) {
      return {
        prompt: buckets.input + buckets.cacheRead + buckets.cacheWrite,
        output: buckets.output,
      }
    }

    /** One model route: name, cost, and the request/token/period line beneath it. */
    function modelBlock(model, t) {
      const price = priceOf(model.model)
      const cost = price === null ? null : routeCost(model, price)
      const peak = periodTokens(model.peak)
      const offPeak = periodTokens(model.offPeak)
      return h('div', { key: `${model.provider}/${model.model}`, className: 'so-model' },
        h('div', { className: 'so-row', title: cost === null ? undefined : `¥${cost.toFixed(5)}` },
          h('span', { className: 'so-row-name' }, `${model.provider}/${model.model}`),
          h('span', { className: 'so-row-right' },
            h('span', { className: 'so-row-value' }, cost === null ? '—' : money(cost)))),
        h('div', { className: 'so-model-sub' }, t('models.detail', {
          requests: model.requests,
          tokens: `${tokens(peak.prompt + offPeak.prompt, t)} → ${tokens(peak.output + offPeak.output, t)}`,
          peak: tokens(peak.prompt + peak.output, t),
          offPeak: tokens(offPeak.prompt + offPeak.output, t),
        })))
    }

    /** Turn/step counts and decode speed, from the shipped whole-log stats unit. */
    function statsFigures(stats) {
      return {
        turns: stats.turns,
        steps: stats.steps,
        llmMs: stats.llmMs,
        toolMs: stats.toolMs,
        speed: stats.decodeMs > 0 ? stats.decodeTokens / (stats.decodeMs / 1_000) : null,
        ttft: stats.ttftSteps > 0 ? stats.ttftMs / stats.ttftSteps : null,
        show: stats.turns > 0 || stats.steps > 0 || stats.llmMs > 0 || stats.toolMs > 0,
      }
    }

    /** Joined "a · b · c" reading line; null parts drop out. */
    function metricLine(parts) {
      return parts.filter(part => part !== null && part !== undefined && part !== '').join(' · ')
    }

    /** Cost of one step row under its own model and price period. */
    function stepCostOf(row) {
      const price = priceOf(row.m)
      if (price === null) return null
      const cost = bucketCost({ input: row.i, cacheRead: row.r, cacheWrite: row.w, output: row.o }, price)
      return row.p === 'peak' ? cost : cost * 0.5
    }

    /** The step's tool calls as "read×2 · edit", or a plain answer marker. */
    function describeTools(names, t) {
      if (typeof names !== 'string' || names === '') return t('detail.answer')
      const counts = new Map()
      for (const name of names.split(',')) counts.set(name, (counts.get(name) ?? 0) + 1)
      const parts = []
      for (const [name, count] of counts) parts.push(count > 1 ? `${name}×${count}` : name)
      return parts.join(' · ')
    }

    /** Step rows grouped into their turns, in log order. */
    function groupTurns(steps) {
      const turns = []
      let current = null
      for (const row of steps) {
        if (row === null || typeof row !== 'object' || row.k !== 's') continue
        if (current === null || current.turn !== row.t) {
          current = { turn: row.t, rows: [] }
          turns.push(current)
        }
        current.rows.push(row)
      }
      return turns
    }

    /** Aggregated figures of one turn's steps. */
    function turnTotals(rows) {
      const total = { steps: 0, prompt: 0, output: 0, cacheRead: 0, modelMs: 0, toolMs: 0, cost: null }
      for (const row of rows) {
        total.steps += 1
        total.prompt += row.i + row.r + row.w
        total.output += row.o
        total.cacheRead += row.r
        total.modelMs += row.mm
        total.toolMs += row.tm
        const cost = stepCostOf(row)
        if (cost !== null) total.cost = (total.cost ?? 0) + cost
      }
      return total
    }

    function Overview(props, t) {
      const usage = props.useProjection('tokenUsage')
      const pressure = props.useProjection('contextPressure')
      const breakdown = props.useProjection('contextBreakdown')
      const stats = props.useProjection('sessionStats')
      const activity = props.useProjection('sessionActivity')
      const selection = props.useProjection('modelSelection')
      const catalog = props.useProjection('subagentCatalog')
      const outline = props.useProjection('turnOutline')
      const running = props.useSession(snapshot => snapshot.running)
      /** Per-turn open state; a turn follows its default until the reader toggles it. */
      const [toggled, setToggled] = React.useState({})

      const promptTokens = usage === undefined
        ? 0
        : usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens
      const outputTokens = usage === undefined ? 0 : usage.outputTokens
      const totalTokens = promptTokens + outputTokens
      const showUsage = totalTokens > 0
      const cacheHit = usage === undefined ? null : cacheHitText(usage)
      const figures = stats === undefined
        ? { turns: 0, steps: 0, llmMs: 0, toolMs: 0, speed: null, ttft: null, show: false }
        : statsFigures(stats)

      const usedTokens = pressure === undefined
        ? undefined
        : pressure.projectedTokens ?? pressure.pressureTokens
      const contextWindow = pressure === undefined ? undefined : pressure.contextWindow
      const breakdownTotal = breakdown === undefined
        ? 0
        : breakdown.systemTokens + breakdown.toolsTokens + breakdown.messageTokens
      const contextReady = isCount(usedTokens) || breakdownTotal > 0
      const occupancy = isCount(usedTokens) && isCount(contextWindow) && contextWindow > 0
        ? Math.min(100, Math.round(usedTokens / contextWindow * 100))
        : null

      const tools = activity === undefined ? [] : activity.tools
      const models = activity === undefined ? [] : activity.models
      const skills = activity === undefined ? [] : activity.skills
      const calls = activity === undefined ? null : activity.totals
      const failureRows = activity === undefined
        ? []
        : [
          ['tool', t('errors.tool'), activity.totals.failed],
          ['turn', t('errors.turn'), activity.turns.error],
          ['aborted', t('errors.aborted'), activity.turns.aborted],
          ['maxTokens', t('errors.maxTokens'), activity.turns.maxTokens],
          ['retries', t('errors.retries'), activity.retries],
          ['compactions', t('errors.compactions'), activity.compactions],
        ].filter(([, , value]) => value > 0)
      const lastError = activity === undefined ? null : activity.lastError
      const showCalls = calls !== null && (calls.calls > 0 || calls.failed > 0)
      const steps = activity === undefined || !Array.isArray(activity.steps) ? [] : activity.steps
      const turnGroups = groupTurns(steps)
      const promptByTurn = new Map()
      if (Array.isArray(outline)) {
        for (const entry of outline) {
          if (entry !== null && typeof entry === 'object') promptByTurn.set(entry.turn, entry.prompt)
        }
      }
      const children = Array.isArray(catalog) ? catalog : []
      const currentRoute = selection === null || selection === undefined
        ? null
        : selection.next ?? selection.lastUsed ?? null
      // Route costs are recomputed here from the folded period buckets, so a
      // price-table edit applies to the whole log without refolding the cache.
      let totalCost = 0
      let peakCost = 0
      let unpriced = 0
      for (const model of models) {
        const price = priceOf(model.model)
        if (price === null) { unpriced += 1; continue }
        const peak = bucketCost(model.peak, price)
        peakCost += peak
        totalCost += peak + bucketCost(model.offPeak, price) * 0.5
      }
      const offPeakCost = totalCost - peakCost
      const showCost = models.length > unpriced
      const hasAny = showUsage || figures.show || contextReady || showCalls
        || failureRows.length > 0 || lastError !== null || children.length > 0

      const childrenUi = []
      childrenUi.push(h('style', { key: 'style' }, CSS))
      childrenUi.push(h('div', { key: 'head', className: 'so-head' },
        h('h2', { className: 'so-title' }, t('board.title')),
        h('span', { className: 'so-badge', 'data-running': running ? 'true' : 'false' },
          h('span', { className: 'so-dot', 'aria-hidden': true }),
          running ? t('state.running') : t('state.idle')),
        h('span', { className: 'so-sub' }, t('board.sub'))))

      if (!hasAny) {
        childrenUi.push(h('div', { key: 'empty', className: 'so-empty' },
          h('span', { className: 'so-empty-title' }, t('empty.title')),
          h('span', { className: 'so-empty-body' }, t('empty.body'))))
        return h('div', { className: 'so-root' }, childrenUi)
      }

      // One tile per mounted projection: a profile without `sessionStats` must
      // not show a 0/0 turn count, and without `sessionActivity` no 0 calls.
      const tiles = []
      if (showUsage) {
        tiles.push(statTile('total', t('tile.total'), tokens(totalTokens, t),
          t('tile.total.sub', { prompt: tokens(promptTokens, t), output: tokens(outputTokens, t) }),
          exact(t('tile.total'), totalTokens)))
      }
      if (showCost) {
        tiles.push(statTile('cost', t('tile.cost'), money(totalCost),
          t('tile.cost.sub', { peak: money(peakCost), offPeak: money(offPeakCost) }),
          `¥${totalCost.toFixed(5)}`))
      }
      if (showUsage) {
        tiles.push(statTile('cache', t('tile.cache'), cacheHit ?? '—',
          cacheHit === null ? t('tile.cache.none') : t('tile.cache.sub', { read: tokens(usage.cacheReadTokens, t) }),
          null))
      }
      if (showCalls) {
        tiles.push(statTile('calls', t('tile.calls'), String(calls.calls),
          t('tile.calls.sub', { failed: String(calls.failed), time: clock(calls.ms, t) }),
          null))
      }
      if (figures.show) {
        tiles.push(statTile('steps', t('tile.steps'), `${figures.turns} / ${figures.steps}`,
          t('tile.steps.sub', { time: clock(figures.llmMs, t) }),
          null))
      }
      if (tiles.length > 0) childrenUi.push(h('div', { key: 'tiles', className: 'so-tiles' }, tiles))

      const cards = []
      /** Built here, appended last: the drill-down stays below the aggregate cards. */
      let detailCard = null

      if (turnGroups.length > 0) {
        const stepCount = turnGroups.reduce((sum, group) => sum + group.rows.length, 0)
        const anyOpen = Object.keys(toggled).some(turn => toggled[turn] === true)
        const renderStep = (row) => {
          const stepPrompt = row.i + row.r + row.w
          const hit = hitPercent(row.r, stepPrompt)
          const cost = stepCostOf(row)
          const decode = row.tt > 0 && row.mm > row.tt && row.o > 0
            ? row.o / ((row.mm - row.tt) / 1_000)
            : null
          return h('div', { key: `s${row.s}`, className: 'so-step' },
            h('div', { className: 'so-step-head' },
              h('span', { className: 'so-step-label' }, t('detail.step', { step: row.s })),
              h('span', { className: 'so-step-did' }, describeTools(row.tn, t)),
              row.x.includes('r') ? h('span', { className: 'so-chip' }, t('detail.retried')) : null,
              row.x.includes('i') ? h('span', { className: 'so-chip' }, t('detail.interrupted')) : null,
              cost === null
                ? null
                : h('span', { className: 'so-row-right' }, h('span', { className: 'so-row-value' }, money(cost)))),
            h('div', { className: 'so-step-detail' }, metricLine([
              t('detail.context', { value: tokens(stepPrompt, t) }),
              t('detail.output', { value: tokens(row.o, t) }),
              hit === null ? null : t('detail.cache', { percent: hit }),
              row.tt > 0 ? t('detail.ttft', { value: clock(row.tt, t) }) : null,
              decode === null ? null : t('unit.tps', { value: String(Math.round(decode * 10) / 10) }),
              row.tc > 0 ? t('detail.tool', { value: clock(row.tm, t) }) : null,
            ])))
        }
        const renderTurn = (group) => {
          const totals = turnTotals(group.rows)
          const prompt = promptByTurn.get(group.turn) ?? null
          const open = toggled[group.turn] === true
          const hit = hitPercent(totals.cacheRead, totals.prompt)
          return h('div', { key: `t${group.turn}`, className: 'so-turn' },
            h('button', {
              type: 'button',
              className: 'so-turn-head',
              'aria-expanded': open,
              onClick: () => { setToggled({ ...toggled, [group.turn]: !open }) },
            },
              h('span', { className: 'so-caret', 'aria-hidden': true }, open ? '▾' : '▸'),
              h('span', { className: 'so-turn-label' }, t('detail.turn', { turn: group.turn })),
              typeof prompt === 'string' && prompt !== ''
                ? h('span', { className: 'so-turn-prompt' }, prompt)
                : null,
              h('span', { className: 'so-turn-right' },
                h('span', { className: 'so-muted' }, t('detail.turnSteps', { count: totals.steps })),
                totals.cost === null
                  ? null
                  : h('span', { className: 'so-row-value' }, money(totals.cost)))),
            h('div', { className: 'so-detail' }, metricLine([
              t('detail.context', { value: tokens(totals.prompt, t) }),
              t('detail.output', { value: tokens(totals.output, t) }),
              hit === null ? null : t('detail.cache', { percent: hit }),
              t('detail.model', { value: clock(totals.modelMs, t) }),
              totals.toolMs > 0 ? t('detail.tool', { value: clock(totals.toolMs, t) }) : null,
            ])),
            open ? h('div', { className: 'so-steps' }, group.rows.map(renderStep)) : null)
        }
        detailCard = card('detail', t('detail.title'),
          t('detail.note', { turns: turnGroups.length, steps: stepCount }),
          [h('div', {
            className: 'so-turns',
            // About three collapsed turns fit; an opened turn gets room to breathe.
            style: { maxHeight: anyOpen ? '60vh' : '156px' },
          }, turnGroups.map(renderTurn))], true)
      }

      if (showUsage) {
        const buckets = [
          { key: 'input', cls: 'so-c-input', label: t('bucket.input'), value: usage.uncachedInputTokens },
          { key: 'read', cls: 'so-c-read', label: t('bucket.cacheRead'), value: usage.cacheReadTokens },
          { key: 'write', cls: 'so-c-write', label: t('bucket.cacheWrite'), value: usage.cacheWriteTokens },
          { key: 'output', cls: 'so-c-output', label: t('bucket.output'), value: outputTokens },
        ]
        cards.push(card('tokens', t('tokens.title'),
          t('tokens.note', { prompt: tokens(promptTokens, t), total: tokens(totalTokens, t) }), [
          stackedBar(buckets.map(bucket => ({
            key: bucket.key,
            cls: bucket.cls,
            width: share(bucket.value, totalTokens),
            title: exact(bucket.label, bucket.value),
          }))),
          h('div', { className: 'so-rows' }, buckets.map(bucket => legendRow(
            bucket.key,
            bucket.cls,
            bucket.label,
            tokens(bucket.value, t),
            percentText(share(bucket.value, totalTokens)),
            exact(bucket.label, bucket.value),
          ))),
        ]))
      }

      if (contextReady) {
        const body = []
        const figuresText = isCount(usedTokens) && isCount(contextWindow)
          ? t('context.figures', { used: tokens(usedTokens, t), window: tokens(contextWindow, t) })
          : isCount(usedTokens)
            ? t('context.figuresNoWindow', { used: tokens(usedTokens, t) })
            : null
        if (occupancy !== null) {
          body.push(h('div', { key: 'headline', className: 'so-headline' },
            h('span', { className: 'so-headline-value' }, percentText(occupancy)),
            figuresText === null ? null : h('span', { className: 'so-headline-sub' }, figuresText)))
        } else if (figuresText !== null) {
          body.push(h('div', { key: 'headline', className: 'so-headline' },
            h('span', { className: 'so-headline-sub' }, figuresText)))
        }
        if (breakdownTotal > 0) {
          const parts = [
            { key: 'system', cls: 'so-c-system', label: t('context.system'), value: breakdown.systemTokens },
            { key: 'tools', cls: 'so-c-tools', label: t('context.tools'), value: breakdown.toolsTokens },
            { key: 'messages', cls: 'so-c-messages', label: t('context.messages'), value: breakdown.messageTokens },
          ]
          // One meter: composition shares the occupancy scale, so the bar reads
          // as "how full is the window and what fills it". Without a capacity
          // the composition fills the track proportionally on its own.
          const scale = occupancy === null ? 100 : occupancy
          body.push(stackedBar(parts.map(part => ({
            key: part.key,
            cls: part.cls,
            width: scale * part.value / breakdownTotal,
            title: exact(part.label, part.value),
          }))))
          body.push(h('div', { key: 'rows', className: 'so-rows' }, parts.map(part => legendRow(
            part.key,
            part.cls,
            part.label,
            tokens(part.value, t),
            percentText(share(part.value, breakdownTotal)),
            exact(part.label, part.value),
          ))))
          body.push(h('div', { key: 'note', className: 'so-note-left' }, t('context.note')))
        } else if (figuresText === null) {
          body.push(h('div', { key: 'note', className: 'so-note-left' }, t('context.noWindow')))
        }
        cards.push(card('context', t('context.title'), null, body))
      }

      if (calls !== null) {
        const shown = tools.slice(0, 8)
        const body = shown.map(tool => entryRow(
          tool.name,
          tool.name,
          { cls: `so-chip-${tool.kind}`, label: t(`kind.${tool.kind}`) },
          [
            h('span', { key: 'calls', className: 'so-row-value' }, String(tool.calls)),
            tool.failed > 0
              ? h('span', { key: 'failed', className: 'so-fail' }, t('tools.failed', { count: tool.failed }))
              : null,
            h('span', { key: 'ms', className: 'so-muted' }, clock(tool.ms, t)),
          ],
          exact(tool.name, tool.calls),
        ))
        if (tools.length > shown.length) {
          body.push(h('div', { key: 'more', className: 'so-muted' }, `+${tools.length - shown.length}`))
        }
        if (activity.ptcCalls > 0) {
          body.push(h('div', { key: 'ptc', className: 'so-note-left' }, t('tools.ptc', { count: activity.ptcCalls })))
        }
        cards.push(card('tools', t('tools.title'),
          t('tools.note', {
            kinds: String(tools.length),
            calls: String(calls.calls),
            failed: String(calls.failed),
          }),
          [h('div', { className: 'so-rows' }, body)], true))
      }

      if (models.length > 0) {
        const body = models.map(model => modelBlock(model, t))
        body.push(h('div', { key: 'pricing', className: 'so-note-left', title: PRICING_SOURCE },
          t('models.pricing', { since: PRICING_SINCE })))
        if (unpriced > 0) {
          body.push(h('div', { key: 'unpriced', className: 'so-note-left' },
            t('models.unpriced', { count: unpriced })))
        }
        cards.push(card('models', t('models.title'),
          currentRoute === null
            ? null
            : t('models.note', { route: `${currentRoute.provider}/${currentRoute.model}` }),
          [h('div', { className: 'so-rows' }, body)]))
      }

      if (children.length > 0) {
        const body = children.map(child => entryRow(
          child.id,
          child.name ?? child.label ?? String(child.id).slice(0, 8),
          { cls: 'so-chip', label: t(`subagents.mode.${child.mode ?? 'unknown'}`) },
          [],
        ))
        cards.push(card('subagents', t('subagents.title'), t('subagents.note', { count: children.length }), [
          h('div', { className: 'so-rows' }, body),
        ]))
      }

      if (skills.length > 0) {
        const loads = skills.reduce((sum, skill) => sum + skill.loads, 0)
        const body = skills.map(skill => entryRow(
          skill.name,
          skill.name,
          null,
          [h('span', { key: 'loads', className: 'so-row-value' }, t('skills.row', { loads: skill.loads }))],
        ))
        cards.push(card('skills', t('skills.title'),
          t('skills.note', { count: skills.length, loads }), [h('div', { className: 'so-rows' }, body)]))
      }

      if (figures.show && (figures.llmMs > 0 || figures.toolMs > 0 || figures.ttft !== null || figures.speed !== null)) {
        const body = []
        if (figures.llmMs > 0 || figures.toolMs > 0) {
          const longest = Math.max(figures.llmMs, figures.toolMs, 1)
          body.push(timeRow('llm', t('time.llm'), figures.llmMs, longest, t))
          body.push(timeRow('tool', t('time.tool'), figures.toolMs, longest, t))
        }
        // A per-step average is not a share of session wall time, so it stays a
        // plain reading beside the two totals.
        if (figures.ttft !== null) {
          body.push(valueRow('ttft', t('time.ttft'), clock(figures.ttft, t), `${Math.round(figures.ttft)} ms`))
        }
        if (figures.speed !== null) {
          body.push(valueRow('speed', t('time.speed'),
            t('unit.tps', { value: String(Math.round(figures.speed * 10) / 10) }),
            `${figures.speed.toFixed(2)} tok/s`))
        }
        cards.push(card('time', t('time.title'), t('time.note'), [h('div', { className: 'so-rows' }, body)]))
      }

      if (failureRows.length > 0 || lastError !== null) {
        const body = failureRows.map(([key, label, value]) => valueRow(key, label, String(value)))
        if (lastError !== null) {
          body.push(h('div', { key: 'last', className: 'so-lasterror' },
            t('errors.last', { turn: lastError.turn, message: lastError.message || '—' })))
        }
        cards.push(card('errors', t('errors.title'), null, body.length === 0 ? [] : [
          h('div', { className: 'so-rows' }, body),
        ]))
      }

      if (cards.length > 0) {
        if (detailCard !== null) cards.push(detailCard)
        childrenUi.push(h('div', { key: 'cards', className: 'so-cards' }, cards))
      }
      return h('div', { className: 'so-root' }, childrenUi)
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(NS)
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-overview: dictionaries')
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: 'overview',
          order: 20,
          locale: NS,
          label: () => t('view.title'),
        }, props => Overview(props, props.t ?? t)))
      },
    }
  },
})
