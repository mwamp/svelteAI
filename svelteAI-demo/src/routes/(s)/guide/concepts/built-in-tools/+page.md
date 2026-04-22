# Built-in Tools

SvelteAI ships with three Vercel AI SDK-compatible tool definitions on `svelteAI.tools`. These cover the standard operations every agent needs — no boilerplate required.

## `callAction`

**Tool name exposed to model:** `call_action`

Invokes an `@ai`-annotated component function by dotted path. The model provides the action path and a named argument map.

**Parameters the model sends:**

| Parameter | Type | Description |
|---|---|---|
| `action` | string | Dotted path to the action, e.g. `ThermostatWidget:a3f2.resetTemperature` |
| `args` | object | Named arguments matching the function's parameter names |

**Returns:** The function's return value (or `undefined` for void functions).

## `setState`

**Tool name exposed to model:** `set_state`

Writes to one or more `@ai rw` state entries by dotted path. Throws if any path does not exist or is read-only.

**Parameters the model sends:**

| Parameter | Type | Description |
|---|---|---|
| `updates` | object | Map of dotted paths to new values |

**Example model call:**
```json
{
  "updates": {
    "ThermostatWidget:a3f2.temperature": 24,
    "ThermostatWidget:b7e0.temperature": 20
  }
}
```

Updates are applied independently — not as a transaction.

## `lookupComponent`

**Tool name exposed to model:** `lookup_component`

Finds all mounted instances of a named component and returns their full state and action descriptors. Use this in the [Digging Context](/guide/recipes/digging-context) pattern.

**Parameters the model sends:**

| Parameter | Type | Description |
|---|---|---|
| `name` | string | Component name, e.g. `KanbanBoard` |

**Returns:**
```json
{
  "component": "KanbanBoard",
  "instances": [{
    "id": "a3f2c1",
    "state": [{ "path": "...", "access": "rw", "value": "..." }],
    "actions": [{ "path": "...", "description": "..." }]
  }]
}
```

## Spreading into an Agent

```ts
import { svelteAI } from 'svelteai'

const agent = new ToolLoopAgent({
  tools: {
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState,
    ...svelteAI.tools.lookupComponent
  }
})
```

Each spread adds exactly one tool to the agent's tool map. You can include any combination — only include `lookupComponent` if your agent uses the lazy-lookup pattern.
