# Context Building

Context building is how you describe the current app state to the AI model. SvelteAI exposes a set of **prompt-builder** methods on the `svelteAI` facade so you can compose exactly the context your agent needs.

## Prompt builders

Each method returns a plain string ready to embed in a system prompt. Call them inside `prepareStep` (or an `instructions` function) so the model always sees the current state on every turn.

### `promptLocalContext()`

The all-in-one helper for local-context integrations. Combines current page, component state, and route map into a single block. This is the recommended starting point.

```ts
prepareStep: async ({ messages }) => ({
  messages: [
    {
      role: 'system',
      content: `You are a smart home assistant.\n\n${svelteAI.promptLocalContext()}`,
    },
    ...messages.filter(m => m.role !== 'system'),
  ],
})
```

Example output:

```
Current page: /demo/local-context/thermostats
  Thermostat controls

App state:

[ThermostatWidget:a3f2]
  A thermostat control for a single room.
  room_name (r): 'bedroom'
  temperature (rw): 22
  resetTemperature() — Resets the temperature to the room default.

Global state:
  energyToday (r): 14.2

Available pages:
  [0] /demo/local-context — Smart home demo overview
* [1] /demo/local-context/thermostats — Thermostat controls
  [2] /demo/local-context/energy — Energy consumption
```

### `promptCurrentPage()`

Formats only the current page block. Requires `getPath` (and ideally `routes`) to be configured on the instance. Returns an empty string when `getPath` is absent.

```ts
const pageBlock = svelteAI.promptCurrentPage()
// Current page: /demo/local-context/thermostats
//   Thermostat controls
```

### `promptComponentContext()`

Formats all currently mounted component instances and their state, plus global (root-level) state. Independent of routing — works even without `routes` or `getPath`.

```ts
const stateBlock = svelteAI.promptComponentContext()
// App state:
//
// [ThermostatWidget:a3f2]
//   room_name (r): 'bedroom'
//   temperature (rw): 22
//
// Global state:
//   energyToday (r): 14.2
```

### `promptRouteMap(options?)`

Formats the available pages list. Accepts an optional options object:

| Option | Default | Description |
|---|---|---|
| `withIndex` | `true` | Prefix each line with `[N]` numeric index |
| `markActive` | `true` | Mark the current route with `*` |

```ts
// Full map with index and active marker (default)
svelteAI.promptRouteMap()

// Plain list without index numbers
svelteAI.promptRouteMap({ withIndex: false })

// Index only, no active marker (e.g. for a non-navigating agent)
svelteAI.promptRouteMap({ markActive: false })
```

Returns an empty string when no routes are configured.

## Composing a custom prompt

Because each builder returns a plain string, you can mix and match freely:

```ts
const systemPrompt = [
  'You are a smart home assistant.',
  svelteAI.promptCurrentPage(),
  svelteAI.promptComponentContext(),
  // Omit the route map for agents that cannot navigate
].filter(Boolean).join('\n\n')
```

## Lower-level accessors

When you need structured data rather than prose, use the raw accessors:

| Method | Returns | Use when |
|---|---|---|
| `getState()` | `Record<string, unknown>` | Custom serialization, structured tool input |
| `getSnapshot()` | `AISnapshot` | Full tree, custom adapters, debugging |
| `getComponentTypes()` | `AIComponentTypeSnapshot[]` | [Digging Context](/guide/recipes/digging-context) pattern |
| `getNodes()` | `AINodeSnapshot[]` | Filtering / inspecting specific instances |

## Choosing a strategy

| Strategy | Method | Best for |
|---|---|---|
| Local context (all-in-one) | `promptLocalContext()` | Small apps, full state fits in prompt |
| Custom composition | `promptCurrentPage` + `promptComponentContext` + `promptRouteMap` | Fine-grained control over what the model sees |
| Flat state map | `getState()` | Custom serialization |
| Full tree | `getSnapshot()` | Custom adapters, debugging |
