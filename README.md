# dsh-session-overview

[English](README.md) | [中文](README.zh.md)

A Web plugin for DeepSeek Harness (dsh). It adds an **Overview** tab to the session header: what a session did, and what it cost.

## The view

Five tiles across the top: total tokens, session cost split into peak and off-peak, cache hit share, tool calls with failures and elapsed time, turns and steps with model time.

The cards below:

- Token composition. Uncached input, cache read, cache write and output as one stacked bar, with each share.
- Context occupancy. The last request's prompt against the context window, plus an estimate of what fills it: system prompt, tool definitions, messages.
- Tools and extensions. Sorted by call count, up to 8 rows, one tool per row with calls, failures, total time and a tag for core, MCP, plugin or skill. PTC sub-calls count on their own.
- Models and cost. For each route: requests, prompt and output tokens, peak and off-peak tokens, and the cost at the official price list. The footer names the price source and any route it could not price.
- Subagents. The subagents this session created directly, with their type.
- Skills. Which skills loaded, and how often.
- Timing. Model time, tool time, mean first-token latency, output rate.
- Anomalies. Counts for tool failures, turn errors, aborts, max-token hits, request retries and compactions, with the last error message on its own line.

Per-turn detail sits at the bottom of the page. A row per turn carries the prompt that started it, steps, context, output, cache hit, model time, tool time and the turn cost. Open it to see every step: the tools it called and how often, context, output, cache, first-token delay, output rate, tool time and the step cost. Retried and interrupted steps get a marker. Rows start collapsed, and the box holds about three turns before it scrolls.

## Where the numbers come from

Every number comes from a Host projection, so paging the chat or compacting history moves nothing: `tokenUsage`, `contextPressure`, `contextBreakdown`, `sessionStats`, `modelSelection`, `subagentCatalog`, and `sessionActivity`, which this plugin registers.

`sessionActivity` folds `step/start`, `assistant/attempt`, `assistant/message`, `tool/call`, `tool/result`, `tool/ptc-dispatch*`, `turn/end`, `llm/retry` and `compaction/start` across the whole log. Tool calls pair with results by call id. A call still waiting when its turn ends gets dropped.

A tool name decides its category: the `mcp__` prefix means MCP, `skill` means the skill loader, names in `CORE_TOOLS` are core tools, everything else is a plugin tool.

## Pricing

The table comes from DeepSeek platform's [models and pricing](https://api-docs.deepseek.com/zh-cn/quick_start/pricing), in CNY per million tokens, with peak and off-peak rates since 2026-08-17:

| Model | Cache hit | Cache miss | Output |
|---|---|---|---|
| `deepseek-flash` (also `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`) | ¥0.04 peak / ¥0.02 off-peak | ¥2 / ¥1 | ¥8 / ¥4 |
| `deepseek-v4-pro` | ¥0.30 / ¥0.15 | ¥9 / ¥4.50 | ¥27 / ¥13.50 |

Peak is Beijing time, weekdays 09:00-12:00 and 14:00-18:00. Everything else bills at half price, including nights, weekends and statutory holidays all day. A request's dispatch time (`step/start`) picks the bucket, so a long generation that crosses 12:00 or 18:00 stays where it started. With no dispatch time in the log, the `assistant/message` time decides.

Holidays come from a 2026 list built into `index.js` (国办发明电〔2025〕7号). When the next year's notice lands, add the dates to `HOLIDAYS` and bump `stateVersion` so cached folds recompute.

Prices live in `PRICES` in `client.js`. The page multiplies the folded peak and off-peak token buckets by that table, so editing it reprices the whole history without rebuilding the projection cache.

Two things stay out of the total: web search and fetch fees (¥5 per 1,000 calls, billed apart from tokens), and non-DeepSeek models. A route with no price still shows its tokens and requests, leaves the cost blank and stays out of the total.

## Install

Keep this directory somewhere stable. In dsh, run `plugin_manager` with action `install_bundle` and the absolute path, or open Plugins → Add plugin and pick the directory. Reload the page and an Overview tab appears in the session header.

The package holds both halves: `index.js` registers the `sessionActivity` projection, `client.js` renders the view.

## Limits

- The context breakdown is a local estimate, so it will not match the occupancy percentage.
- After a dsh upgrade adds core tools, put their names in `CORE_TOOLS` or they count as plugin tools.
- The plugin only reads: no session writes, no model requests, no config changes.
- Tested on dsh `0.2.2-rc.5` (Desktop, Windows). The package declares no `engines.dsh`.

## License

MIT. See [LICENSE](LICENSE).

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
