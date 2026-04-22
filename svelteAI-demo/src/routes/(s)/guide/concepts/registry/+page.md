# Registry

The registry is the runtime data structure that holds all AI-visible state and actions. It is a live tree that mirrors the Svelte component tree.

## Structure

The registry is a tree of **nodes**. Each mounted component instance that has `@ai`-annotated members gets its own node. Nodes are nested to reflect the component hierarchy.

```
root
├── ThermostatWidget:a3f2   (bedroom)
│   ├── room_name (r): 'bedroom'
│   └── temperature (rw): 22
├── ThermostatWidget:b7e0   (living room)
│   ├── room_name (r): 'living room'
│   └── temperature (rw): 19
└── [global entries]
    └── energyToday (r): 14.2
```

Each node has:

- **`id`** — a stable UUID assigned on mount, used as a handle for path-based access
- **`name`** — the component name (e.g. `ThermostatWidget`)
- **`entries`** — `@ai`-annotated state variables with live `getValue` / `setValue` closures
- **`actions`** — `@ai`-annotated functions with a callable `call` reference
- **`children`** — nested component nodes

## Component Types

Separately from the instance tree, the registry holds a **component type catalogue** — one entry per component that has a `@component` annotation. This is populated once when the module is first imported, before any instance is mounted.

The type catalogue lets the AI know what components the app *can* render, independently of what is currently in the DOM.

## Lifecycle

Nodes are created and destroyed automatically:

- **Mount** — when a component with `@ai` annotations is mounted, a `$effect` registers its entries and actions under a new child node
- **Unmount** — the `$effect` cleanup removes all entries, actions, and the node itself

No developer action is required. The registry always reflects the currently mounted component tree.

## Path Addressing

State entries and actions are addressed by dotted path:

| Path format | Refers to |
|---|---|
| `entryName` | Root-level (global) entry |
| `ComponentName:shortId.entryName` | Entry on a specific component instance |
| `ComponentName:shortId.actionName` | Action on a specific component instance |

The `shortId` is the first 6 characters of the node's UUID. Use `svelteAI.getState()` to see all current paths.

## Global Registry

The global registry singleton is available as `__globalAIRegistry` internally, and exposed through the `svelteAI` facade. You should not need to interact with the registry directly — use the `svelteAI` API instead.

## SSR

The registry is client-side only. `$effect` does not run on the server, so no entries are registered during SSR. All registry reads return empty results server-side.
