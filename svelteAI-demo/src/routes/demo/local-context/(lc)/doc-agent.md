### 2. Wire up the agent

Use `svelteAI.promptLocalContext()` to build the system prompt, and `svelteAI.tools` for ready-made tool definitions.

```ts
const agent = new ToolLoopAgent({
  model: openai('gpt-4o-mini'),
  instructions: 'You are a smart home assistant.',
  tools: {
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState,
  },
  prepareStep: async ({ messages }) => ({
    messages: [
      { role: 'system', content: svelteAI.promptLocalContext() },
      ...messages.filter(m => m.role !== 'system')
    ]
  })
})
```

<details>
<summary>▶ What svelteAI.tools provides</summary>

`svelteAI.tools.callAction` exposes a `call_action` tool — the model calls it with a dotted path (e.g. `ThermostatWidget[0].resetTemperature`) and optional arguments to invoke any `@ai`-annotated function.

`svelteAI.tools.setState` exposes a `set_state` tool — the model calls it with a dotted path and a value to write to any `@ai rw` state entry (e.g. `ThermostatWidget[0].temperature = 21`).

Both tools are fully generated from the registry; no boilerplate is needed in the agent.

</details>
