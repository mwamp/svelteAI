# Adapters

An adapter connects the SvelteAI registry to an AI SDK. SvelteAI ships with a `SvelteAI` facade class that provides everything an adapter needs to read state, write state, and invoke actions.

## The `svelteAI` Instance

Import the singleton from `svelteai`:

```ts
import { svelteAI } from 'svelteai'
```

This object wraps the global registry and exposes a clean API for agent code.

## Reading State

### `getContext(): string`

Returns a formatted string describing all currently mounted components and their state. Inject this into a model's system prompt or user message:

```ts
const systemPrompt = `You are a helpful assistant.\n\n${svelteAI.getContext()}`
```

Example output:

```
App state:

[ThermostatWidget:a3f2]
  A thermostat control for a single room.
  room_name (r): 'bedroom'
  temperature (rw): 22
  resetTemperature() — Resets the temperature to the room default.

Global state:
  energyToday (r): 14.2
```

### `getState(): Record<string, unknown>`

Flat map of all state entries keyed by dotted path. Useful for structured prompt injection.

### `getSnapshot(): AISnapshot`

Full nested tree snapshot with resolved values. Use when you need the component hierarchy.

## Writing State

### `setState(updates: Record<string, unknown>): void`

Sets one or more `rw` entries by dotted path:

```ts
svelteAI.setState({ 'ThermostatWidget:a3f2.temperature': 24 })
```

Throws if the path does not exist or the entry is read-only.

### `callAction(path: string, args: Record<string, unknown>): Promise<unknown>`

Invokes a registered action by dotted path:

```ts
await svelteAI.callAction('ShoppingCart.addToCart', { productId: 'p1', quantity: 2 })
```

## Ready-Made Tools

SvelteAI provides Vercel AI SDK-compatible `tool()` objects. Spread them directly into your agent's `tools` object:

```ts
import { svelteAI } from 'svelteai'

const agent = {
  tools: {
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState,
    ...svelteAI.tools.lookupComponent,
  }
}
```

| Tool | What the model can do |
|---|---|
| `callAction` | Invoke any `@ai`-annotated function by path |
| `setState` | Write to any `@ai rw` state entry by path |
| `lookupComponent` | Find all mounted instances of a named component |

## Finding Components

```ts
// All mounted ThermostatWidget instances
const thermostats = svelteAI.findComponent('ThermostatWidget')

// Format for model consumption
const described = svelteAI.describeNodes(thermostats)
```

## Notes

- SvelteAI is client-side only — no state is registered during SSR.
- `getState()` and `getSnapshot()` resolve values at call time, they are not cached.
- `setState` and `callAction` do not validate types or authorize callers — authorization is the application's responsibility.
