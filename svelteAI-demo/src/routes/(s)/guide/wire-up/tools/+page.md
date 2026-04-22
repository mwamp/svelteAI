# Tools

SvelteAI provides ready-made Vercel AI SDK-compatible `tool()` objects. Spread them directly into your agent's `tools` object — no boilerplate to write.

## Available Tools

### `svelteAI.tools.callAction`

Invokes any `@ai`-annotated component function by dotted path. The model provides the action name and named arguments.

```ts
// What the model calls:
// call_action({ action: 'ShoppingCart:a3f2.addToCart', args: { productId: 'p1', quantity: 2 } })
```

### `svelteAI.tools.setState`

Writes to one or more `@ai rw` state entries by dotted path. The model provides a map of paths to new values.

```ts
// What the model calls:
// set_state({ updates: { 'ThermostatWidget:a3f2.temperature': 24 } })
```

Updates are applied independently, not as a transaction. Each assignment triggers its own reactive update.

### `svelteAI.tools.lookupComponent`

Finds all mounted instances of a named component and returns their full state and action descriptors. Useful for dense apps where the model needs to inspect a component before acting on it.

```ts
// What the model calls:
// lookup_component({ name: 'KanbanBoard' })
// Returns: { component, instances: [{ id, state: [...], actions: [...] }] }
```

## Usage

```ts
import { svelteAI } from 'svelteai'

const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  instructions: () => `You are a helpful assistant.\n\n${svelteAI.getContext()}`,
  tools: {
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState,
    ...svelteAI.tools.lookupComponent
  }
})
```

## Path Format

All tools use dotted paths to address state entries and actions:

| Path | Refers to |
|---|---|
| `entryName` | Root-level (global) entry |
| `ComponentName:shortId.entryName` | Entry on a specific component instance |
| `ComponentName:shortId.actionName` | Action on a specific component instance |

Use `svelteAI.getState()` to see all current paths and their values.
