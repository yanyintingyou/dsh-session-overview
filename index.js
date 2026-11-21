/**
 * @local/dsh-session-overview — Host half.
 *
 * Registers one whole-log session projection (`sessionActivity`) that folds the
 * call-side facts a session overview needs: per-tool calls/failures/wall time,
 * per-route request and token counts, skill loads, turn outcomes, retries and
 * compactions. The Browser half reads it through the client projection store,
 * exactly like the shipped `tokenUsage` / `sessionStats` units, so paging or
 * compacting the history cannot change any figure.
 *
 * Tool names are classified with {@link CORE_TOOLS}, which lists the tools this
 * DSH build ships. A profile plugin or an MCP server registers names outside
 * that set, so an unknown name means an extension-provided tool.
 */

export const name = 'session-overview'

/** The projection registry owns the fold; without it this plugin stays pending. */
export const inject = ['sessionProjections']

/** Projection key read by the Browser half. */
const KEY = 'sessionActivity'

/** Tool wire names shipped with this DSH build. */
const CORE_TOOLS = new Set([
  'apply_patch', 'ask_user_question', 'bash', 'cordis_define', 'cordis_inspect_list',
  'cordis_inspect_query', 'cordis_inspect_self', 'cordis_run', 'cordis_stop', 'cordis_undefine',
  'create_goal', 'edit', 'exit_plan_mode', 'get_goal', 'glob', 'grep', 'interrupt_agent',
  'job_kill', 'job_list', 'job_output', 'list_agents', 'list_mcp_resource_templates',
  'list_mcp_resources', 'list_subagent_models', 'load_workspace_dependencies', 'lsp',
  'office_convert', 'office_recalculate', 'office_render', 'plugin_manager', 'present',
  'propose_action', 'pwsh', 'ralph', 'read', 'read_image', 'read_mcp_resource', 'run_code',
  'schedule_create', 'schedule_delete', 'schedule_edit', 'schedule_list', 'schedule_update',
  'schedule_view', 'send_message', 'session_event_read', 'session_event_search',
  'session_event_trace', 'session_search', 'session_trace', 'skill', 'spawn_teammate', 'subagent',
  'subagent_fork', 'team_task_create', 'team_task_get', 'team_task_list', 'team_task_update',
  'terminal_close', 'terminal_list', 'terminal_open', 'terminal_read', 'terminal_signal',
  'todo_write', 'update_goal', 'wait_agent', 'web_fetch', 'web_search', 'workflow',
  'working_directory', 'write',
])

/**
 * The projection seam validates through `.parse` and the Browser half receives
 * plain JSON, so these two parsers pass values through untouched.
 */
const ANY = { parse: (value) => value }

/** One counter for a possibly absent or malformed provider number. */
function count(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
}

/** Tool family shown beside the name: MCP, skill loader, shipped tool, extension tool. */
function kindOf(toolName) {
  if (toolName.startsWith('mcp__')) return 'mcp'
  if (toolName === 'skill') return 'skill'
  return CORE_TOOLS.has(toolName) ? 'core' : 'plugin'
}

/** One failed-turn message, bounded so the projection state stays small. */
function failureMessage(error) {
  if (error === null || typeof error !== 'object' || typeof error.message !== 'string') return ''
  return error.message.length > 240 ? `${error.message.slice(0, 240)}…` : error.message
}

/** Fold state; plain JSON because the projection cache checkpoints it. */
function init() {
  return {
    tools: {},
    pending: {},
    models: {},
    skills: {},
    turns: { error: 0, aborted: 0, maxTokens: 0 },
    retries: 0,
    compactions: 0,
    ptcCalls: 0,
    lastError: null,
    /** Dispatch time and row index of the step whose request is still open. */
    openStep: null,
    /**
     * Per-step detail rows, in log order. Keys stay short because the whole
     * array rides every wire push: k(s), t(turn), s(step), st(start ms),
     * tt(first-token ms), mm(model ms), i/r/w/o(usage buckets), tm(tool ms),
     * tc(tool calls), tf(tool failures), x(flags: i interrupted, r retried),
     * p(price period), m(model), tn(compact tool-call list).
     */
    steps: [],
  }
}

/** Remember a dispatched call so its result can be attributed its name and time. */
function trackCall(state, callId, toolName, time) {
  return { ...state, pending: { ...state.pending, [callId]: { name: toolName, time } } }
}

/** Attribute one settled call to its tool name. */
function settle(state, callId, fallbackName, time, failed) {
  const entry = Object.hasOwn(state.pending, callId) ? state.pending[callId] : undefined
  const pending = { ...state.pending }
  delete pending[callId]
  const name = entry === undefined ? fallbackName : entry.name
  const previous = Object.hasOwn(state.tools, name) ? state.tools[name] : { calls: 0, failed: 0, ms: 0 }
  const tools = {
    ...state.tools,
    [name]: {
      calls: previous.calls + 1,
      failed: previous.failed + (failed ? 1 : 0),
      ms: previous.ms + (entry === undefined ? 0 : Math.max(0, time - entry.time)),
    },
  }
  return { ...state, tools, pending }
}

/** Count one skill load: the loader tool's `name` argument carries the skill. */
function addSkill(state, rawArguments) {
  let parsed
  try {
    parsed = JSON.parse(rawArguments)
  } catch {
    return state
  }
  const skillName = parsed !== null && typeof parsed === 'object' && typeof parsed.name === 'string'
    ? parsed.name
    : null
  if (skillName === null || skillName === '') return state
  return { ...state, skills: { ...state.skills, [skillName]: (state.skills[skillName] ?? 0) + 1 } }
}

/**
 * Chinese statutory holidays as Beijing local dates — 国办发明电〔2025〕7号
 * (2026 年部分节假日安排). An off-peak weekday needs an entry here; weekends are
 * off-peak by rule. When the next year's notice lands, add its dates and bump
 * `stateVersion` so cached folds reclassify.
 */
const HOLIDAYS = new Set([
  '2026-01-01', '2026-01-02', '2026-01-03',
  '2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23',
  '2026-04-04', '2026-04-05', '2026-04-06',
  '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05',
  '2026-06-19', '2026-06-20', '2026-06-21',
  '2026-09-25', '2026-09-26', '2026-09-27',
  '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05',
  '2026-10-06', '2026-10-07',
])

/**
 * Which official price period a request ran in: peak covers Beijing-time
 * weekday 09:00–12:00 and 14:00–18:00 except statutory holidays; everything
 * else — nights, weekends, holidays — bills at the off-peak rate.
 * @param time - durable event time in epoch milliseconds.
 * @returns 'peak' or 'offPeak'.
 */
function periodOf(time) {
  const beijing = new Date(time + 8 * 3_600_000)
  const weekday = beijing.getUTCDay()
  if (weekday === 0 || weekday === 6) return 'offPeak'
  if (HOLIDAYS.has(beijing.toISOString().slice(0, 10))) return 'offPeak'
  const hour = beijing.getUTCHours()
  return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 18) ? 'peak' : 'offPeak'
}

/** The four disjoint usage buckets, zeroed. */
function emptyBuckets() {
  return { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }
}

/**
 * Time of the first output token inside one compact assistant stream, mirroring
 * the shipped `assistantStreamFirstTokenTime`: raw chunks carry their own time,
 * packed runs reconstruct member time from `time0 + Σ dt`.
 * @param stream - the durable settlement's compact records.
 * @returns epoch milliseconds, or 0 when the stream carries no token.
 */
function firstTokenTime(stream) {
  if (!Array.isArray(stream)) return 0
  for (const record of stream) {
    if (record === null || typeof record !== 'object') continue
    if (record.type === 'chunk') {
      const chunk = record.chunk
      if (chunk === null || typeof chunk !== 'object' || typeof record.time !== 'number') continue
      const token = (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta') && chunk.text !== ''
        || chunk.type === 'tool-call-delta' && (chunk.argumentsDelta !== '' || chunk.name !== undefined)
      if (token) return record.time
      continue
    }
    if (typeof record.time0 !== 'number') continue
    if (record.type === 'tool-call-chunks' && typeof record.name === 'string') return record.time0
    const fragments = record.type === 'tool-call-chunks' ? record.args : record.texts
    if (!Array.isArray(fragments) || !Array.isArray(record.dt)) continue
    let time = record.time0
    for (let index = 0; index < fragments.length; index += 1) {
      if (index > 0) time += typeof record.dt[index - 1] === 'number' ? record.dt[index - 1] : 0
      if (fragments[index] !== '') return time
    }
  }
  return 0
}

/** Cap on the tool names one step row keeps, so a long step cannot bloat the wire payload. */
const STEP_TOOL_NAMES = 6

/** Append one tool name to a step row's compact call list. */
function appendToolNames(names, toolName) {
  if (typeof toolName !== 'string' || toolName === '') return names
  const list = names === '' ? [] : names.split(',')
  if (list.length >= STEP_TOOL_NAMES) return names
  list.push(toolName)
  return list.join(',')
}

/** Index of the step row for one (turn, step), searched from the newest row back. */
function stepIndex(state, turn, step) {
  const open = state.openStep
  if (open !== null && open.turn === turn && open.step === step) return open.index
  for (let index = state.steps.length - 1; index >= 0; index -= 1) {
    const row = state.steps[index]
    if (row.k === 's' && row.t === turn && row.s === step) return index
  }
  return -1
}

/** Replace one step row through an updater; an unknown index leaves the state untouched. */
function updateStep(state, index, change) {
  if (index < 0 || index >= state.steps.length) return state
  const steps = state.steps.slice()
  steps[index] = change(steps[index])
  return { ...state, steps }
}

/**
 * Attribute one assembled assistant message, and its usage, to its model route
 * and to the price period it was billed in.
 * @param state - fold state.
 * @param source - the assistant message's provider/model source.
 * @param usage - provider-reported usage, if any.
 * @param time - durable event time in epoch milliseconds.
 * @returns the next state.
 */
function addModel(state, source, usage, time) {
  const provider = source !== null && typeof source === 'object' && typeof source.provider === 'string'
    ? source.provider
    : ''
  const model = source !== null && typeof source === 'object' && typeof source.model === 'string'
    ? source.model
    : ''
  if (provider === '' || model === '') return state
  const key = `${provider}\u0000${model}`
  const previous = Object.hasOwn(state.models, key)
    ? state.models[key]
    : { provider, model, requests: 0, peak: emptyBuckets(), offPeak: emptyBuckets() }
  const buckets = usage !== null && typeof usage === 'object' ? usage : {}
  const period = periodOf(time)
  const current = previous[period]
  return {
    ...state,
    models: {
      ...state.models,
      [key]: {
        ...previous,
        requests: previous.requests + 1,
        [period]: {
          input: current.input + count(buckets.inputTokens),
          cacheRead: current.cacheRead + count(buckets.cacheReadTokens),
          cacheWrite: current.cacheWrite + count(buckets.cacheWriteTokens),
          output: current.output + count(buckets.outputTokens),
        },
      },
    },
  }
}

/** One durable Session event, folded into the counters. Every ignored event returns the state. */
function fold(state, event) {
  switch (event.type) {
    case 'tool/call': {
      const next = trackCall(state, event.data.callId, event.data.name, event.time)
      const counted = updateStep(next, stepIndex(next, event.data.turn, event.data.step), row => ({
        ...row,
        tc: row.tc + 1,
        tn: appendToolNames(row.tn, event.data.name),
      }))
      return event.data.name === 'skill' ? addSkill(counted, event.data.arguments) : counted
    }
    case 'tool/ptc-dispatch-start': {
      const next = { ...trackCall(state, event.data.subCallId, event.data.name, event.time), ptcCalls: state.ptcCalls + 1 }
      return updateStep(next, stepIndex(next, event.data.turn, event.data.step), row => ({
        ...row,
        tc: row.tc + 1,
        tn: appendToolNames(row.tn, event.data.name),
      }))
    }
    case 'tool/result': {
      const callId = event.data.message.source.callId
      const started = Object.hasOwn(state.pending, callId) ? state.pending[callId] : undefined
      const failed = event.data.message.isError === true || event.data.error !== undefined
      const next = settle(state, callId, '?', event.time, failed)
      return updateStep(next, stepIndex(next, event.data.turn, event.data.step), row => ({
        ...row,
        tm: row.tm + (started === undefined ? 0 : Math.max(0, event.time - started.time)),
        tf: row.tf + (failed ? 1 : 0),
      }))
    }
    case 'tool/ptc-dispatch': {
      const started = Object.hasOwn(state.pending, event.data.subCallId) ? state.pending[event.data.subCallId] : undefined
      const failed = event.data.isError === true
      const next = settle(state, event.data.subCallId, event.data.name, event.time, failed)
      return updateStep(next, stepIndex(next, event.data.turn, event.data.step), row => ({
        ...row,
        tm: row.tm + (started === undefined ? 0 : Math.max(0, event.time - started.time)),
        tf: row.tf + (failed ? 1 : 0),
      }))
    }
    case 'step/start': {
      const row = {
        k: 's',
        t: event.data.turn,
        s: event.data.step,
        st: event.time,
        tt: 0,
        mm: 0,
        i: 0,
        r: 0,
        w: 0,
        o: 0,
        tm: 0,
        tc: 0,
        tf: 0,
        x: '',
        p: periodOf(event.time),
        m: '',
        tn: '',
      }
      return {
        ...state,
        steps: [...state.steps, row],
        openStep: { turn: event.data.turn, step: event.data.step, time: event.time, index: state.steps.length },
      }
    }
    case 'assistant/attempt': {
      const index = stepIndex(state, event.data.turn, event.data.step)
      if (index < 0 || state.steps[index].tt !== 0) return state
      const firstToken = firstTokenTime(event.data.stream)
      if (firstToken === 0) return state
      return updateStep(state, index, row => ({ ...row, tt: Math.max(0, firstToken - row.st) }))
    }
    case 'assistant/message': {
      // The price period follows the request's dispatch time: a long generation
      // crossing 12:00 or 18:00 keeps the window it started in.
      const open = state.openStep
      const matching = open !== null && open.turn === event.data.turn && open.step === event.data.step
      const dispatched = matching ? open.time : event.time
      const next = addModel(state, event.data.message.source, event.data.usage, dispatched)
      const index = stepIndex(next, event.data.turn, event.data.step)
      if (index < 0) return next
      const usage = event.data.usage !== null && typeof event.data.usage === 'object' ? event.data.usage : {}
      const source = event.data.message.source
      const model = source !== null && typeof source === 'object' && typeof source.model === 'string' ? source.model : ''
      const firstToken = firstTokenTime(event.data.stream)
      return updateStep(next, index, row => ({
        ...row,
        i: row.i + count(usage.inputTokens),
        r: row.r + count(usage.cacheReadTokens),
        w: row.w + count(usage.cacheWriteTokens),
        o: row.o + count(usage.outputTokens),
        mm: row.mm + Math.max(0, event.time - (matching ? open.time : event.time)),
        tt: row.tt !== 0 || firstToken === 0 ? row.tt : Math.max(0, firstToken - row.st),
        m: row.m === '' ? model : row.m,
        x: event.data.interrupted === true && !row.x.includes('i') ? `${row.x}i` : row.x,
      }))
    }
    case 'turn/end': {
      // A call whose result never landed belongs to a cancelled or failed turn;
      // results always land inside their turn, so drop the leftovers.
      const pending = Object.keys(state.pending).length === 0 ? state.pending : {}
      const kind = event.data.reason !== null && typeof event.data.reason === 'object' ? event.data.reason.kind : undefined
      if (kind === 'error') {
        return {
          ...state,
          pending,
          turns: { ...state.turns, error: state.turns.error + 1 },
          lastError: {
            turn: event.data.turn,
            message: failureMessage(event.data.reason.error) || event.data.reason.error?.code || '',
          },
        }
      }
      if (kind === 'aborted') return { ...state, pending, turns: { ...state.turns, aborted: state.turns.aborted + 1 } }
      if (kind === 'max-tokens') {
        return { ...state, pending, turns: { ...state.turns, maxTokens: state.turns.maxTokens + 1 } }
      }
      return state.pending === pending ? state : { ...state, pending }
    }
    case 'llm/retry': {
      const next = { ...state, retries: state.retries + 1 }
      const open = state.openStep
      if (open === null) return next
      return updateStep(next, open.index, row => (row.x.includes('r') ? row : { ...row, x: `${row.x}r` }))
    }
    case 'compaction/start':
      return { ...state, compactions: state.compactions + 1 }
    default:
      return state
  }
}

/** Sorted, client-ready view of the folded counters. */
function viewOf(state) {
  const tools = Object.entries(state.tools)
    .map(([toolName, value]) => ({ name: toolName, kind: kindOf(toolName), ...value }))
    .sort((left, right) => right.calls - left.calls || left.name.localeCompare(right.name))
  const models = Object.values(state.models).sort((left, right) => right.requests - left.requests)
  const skills = Object.entries(state.skills)
    .map(([skillName, loads]) => ({ name: skillName, loads }))
    .sort((left, right) => right.loads - left.loads || left.name.localeCompare(right.name))
  let calls = 0
  let failed = 0
  let ms = 0
  for (const tool of tools) {
    calls += tool.calls
    failed += tool.failed
    ms += tool.ms
  }
  return {
    tools,
    models,
    skills,
    steps: state.steps,
    totals: { calls, failed, ms },
    turns: state.turns,
    retries: state.retries,
    compactions: state.compactions,
    ptcCalls: state.ptcCalls,
    lastError: state.lastError,
  }
}

/**
 * Register the activity unit on the projection registry.
 * @param ctx - plugin context carrying the registry.
 */
export async function apply(ctx) {
  await ctx.sessionProjections.register({
    key: KEY,
    // v4 adds the per-step detail rows (`steps`).
    stateVersion: 4,
    stateSchema: ANY,
    init,
    apply: fold,
    wire: { viewSchema: ANY, view: viewOf, summary: false },
  })
}
