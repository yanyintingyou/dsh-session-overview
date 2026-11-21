# dsh-session-overview

[English](README.md) | [中文](README.zh.md)

A DeepSeek Harness (dsh) Web plugin. It adds an **Overview** view to the session header: what the whole session did, and what it cost.

## The view

Five tiles at the top: total tokens, session cost split by peak and off-peak, cache hit share, tool calls with failures and elapsed time, turns and steps with model time.

Below them:

- **Token composition.** Uncached input, cache read, cache write and output as one stacked bar with shares.
- **Context occupancy.** Last request prompt against the context window, plus an estimate for system prompt, tool definitions and messages.
- **Tools and extensions.** One row per tool with calls, failures and total time, tagged core, MCP, plugin or skill. PTC sub-calls are counted separately.
- **Models and cost.** Per route: requests, prompt to output tokens, peak and off-peak tokens, and the cost at the official price list. The footer names the price source and any route without a price.
- **Skills** that loaded, with counts.
- **Subagents** the session created, by type.
- **Timing.** Model time, tool time, mean first-token latency, output rate.
- **Anomalies.** Tool failures, turn errors, aborts, max-token hits, request retries, compactions, plus the last error message.
- **Per-turn detail** at the bottom. One row per turn shows the prompt that started it, steps, context, output, cache hit, model and tool time, and the turn cost. Expanding a turn lists its steps: tools called, context, output, cache, first-token delay, output rate, tool time, step cost. Retried and interrupted steps carry a marker. Turns start collapsed and the box holds about three turns before it scrolls.

## Where the numbers come from

Every figure comes from a Host projection, so paging the chat or compacting the history changes nothing: `tokenUsage`, `contextPressure`, `contextBreakdown`, `sessionStats`, `modelSelection`, `subagentCatalog`, and this plugin's own `sessionActivity`.

`sessionActivity` folds `step/start`, `assistant/attempt`, `assistant/message`, `tool/call`, `tool/result`, `tool/ptc-dispatch*`, `turn/end`, `llm/retry` and `compaction/start` across the whole log. Tool calls pair with results by call id. A call whose result never arrives is dropped when its turn ends.

Tool names classify by prefix and membership: `mcp__` means MCP, `skill` means the skill loader, names in `CORE_TOOLS` are core tools, everything else is a plugin tool.

## Pricing

Cost uses the DeepSeek platform price list, CNY per million tokens, peak and off-peak since 2026-08-17:

| Model | Cache hit | Cache miss | Output |
|---|---|---|---|
| `deepseek-flash` (also `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`) | ¥0.04 peak / ¥0.02 off-peak | ¥2 / ¥1 | ¥8 / ¥4 |
| `deepseek-v4-pro` | ¥0.30 / ¥0.15 | ¥9 / ¥4.50 | ¥27 / ¥13.50 |

Peak covers weekdays 09:00-12:00 and 14:00-18:00 Beijing time. Nights, weekends and statutory holidays bill at half price. The bucket follows the request's dispatch time (`step/start`), so a long generation that crosses 12:00 or 18:00 stays in the window where it started. A request with no recorded dispatch time falls back to the `assistant/message` time.

Holidays come from a built-in 2026 list (国办发明电〔2025〕7号). When the next year's notice arrives, add its dates to `HOLIDAYS` and bump `stateVersion`, so cached folds reclassify.

Prices live in `client.js` (`PRICES`). Cost is computed in the browser from folded peak and off-peak token buckets, so editing the table applies to the whole history without rebuilding the projection cache.

Not included: web search and fetch per-request fees (¥5 per 1,000 calls, billed apart from tokens) and non-DeepSeek models. A route without a price still shows its tokens; its cost stays blank and out of the total.

## Install

1. Keep this directory somewhere stable.
2. In dsh, run `plugin_manager` with action `install_bundle` and the absolute directory path, or open **Plugins → Add plugin** and pick the directory.
3. Reload the page. An **Overview** tab appears in the session header.

The package carries both halves: `index.js` registers the `sessionActivity` projection and `client.js` renders the view.

## Limits

- Context composition is a local estimate and won't match the occupancy percentage exactly.
- After a dsh upgrade adds core tools, add their names to `CORE_TOOLS` so they classify as core.
- Read-only: no session writes, no model requests, no config changes.
- Tested on dsh `0.2.2-rc.5` (Desktop, Windows). The package declares no `engines.dsh`.

## License

MIT. See [LICENSE](LICENSE).
