# SvelteAI

A developer-friendly library for building AI-integrated Svelte 5 web apps. Annotate your components with `@ai` decorators — the library handles registration, context formatting, and tool generation for your AI agent.

## Why

Agents can browse the web autonomously, but deep app integration gives you:

- **Controllability** — expose only what you choose; no agent touching credit card data or destructive actions without validation
- **Accuracy at lower cost** — one tool call can trigger a complex, pre-validated action instead of fragile DOM manipulation
- **Better UX** — the model reads live reactive state, not a stale screenshot

## How it works

SvelteAI runs a **Svelte preprocessor** (for `.svelte` files) and a **Vite plugin** (for `.svelte.ts` shared state). Both scan for `@ai` and `@component` decorator annotations and emit `$effect` registration blocks that wire your reactive state and functions into a live registry tree.

At runtime, a [`SvelteAI`](svelteAI/src/lib/facade/SvelteAI.ts) facade reads the registry and exposes:

- `getContext()` — a formatted string for LLM system prompt injection
- `getState()` / `getSnapshot()` — flat map or nested tree of current values
- `setState()` / `callAction()` — write back to reactive state or invoke annotated functions
- `tools` — ready-made [Vercel AI SDK](https://sdk.vercel.ai) `tool()` definitions (`callAction`, `setState`, `lookupComponent`)

The model always sees live values — `getContext()` is called on every turn, not cached.

## Annotation syntax

### Component description

```svelte
<!-- ThermostatWidget.svelte -->
<script module>
  @component({ description: 'A thermostat control widget for a single room.' })
</script>
```

### Reactive state and actions

```svelte
<script lang="ts">
  let { room }: { room: Room } = $props()

  @ai({ access: 'r', description: 'The name of the room this widget controls.' })
  let room_name = $derived(room.name)

  @ai({ access: 'rw', description: 'Current target temperature in Celsius. Agent may set between 16 and 30.' })
  let temperature = $state(room.defaultTemp)

  @ai({ description: 'Resets the temperature to the room default.' })
  function resetTemperature() {
    temperature = room.defaultTemp
  }
</script>
```

### Shared state (`.svelte.ts`)

```ts
// energy.svelte.ts
@ai({ access: 'r', description: 'Current total energy consumption in watts.' })
export let total_watts = $state(1240)
```

## What the model sees

`svelteAI.getContext()` produces a formatted block injected into the system prompt:

```
App state:

[ThermostatWidget:a3f2]
  A thermostat control widget for a single room.
  room_name (r): 'bedroom'
  temperature (rw): 22
  resetTemperature() — Resets the temperature to the room default.

[ThermostatWidget:b7e0]
  A thermostat control widget for a single room.
  room_name (r): 'living room'
  temperature (rw): 19

Global state:
  total_watts (r): 1240
```

## Agent wiring

```ts
// svelteai.ts
import { SvelteAI } from 'svelteai'
export const svelteAI = new SvelteAI()
```

```ts
// agent.ts
import { ToolLoopAgent, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { svelteAI } from './svelteai'
import { goto } from '$app/navigation'
import { z } from 'zod'

export const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),
  instructions: () => `
You are a smart home assistant.

Current app state:
${svelteAI.getContext()}
  `.trim(),
  tools: {
    navigate: tool({
      description: 'Navigate to a different page.',
      parameters: z.object({ path: z.string() }),
      execute: async ({ path }) => { await goto(path); return { ok: true } }
    }),
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState,
  }
})
```

## Build setup

Add to [`svelte.config.js`](svelteAI-demo/svelte.config.ts):

```js
import { svelteAIPreprocess } from 'svelteai'

export default {
  preprocess: [svelteAIPreprocess()]
}
```

Add to [`vite.config.ts`](svelteAI-demo/vite.config.ts):

```ts
import { svelteAIVitePlugin } from 'svelteai'

export default defineConfig({
  plugins: [sveltekit(), svelteAIVitePlugin()]
})
```

---

## Repo structure

```
svelteAI/                        # The library (npm: svelteai)
├── src/lib/
│   ├── index.ts                 # Public API re-exports
│   ├── registry/
│   │   ├── types.ts             # All interfaces: AIEntry, AIAction, AINode, AISnapshot, …
│   │   ├── AIRegistry.ts        # Root registry — component type catalogue + tree root
│   │   ├── AINode.ts            # Tree node — entries, actions, children, lifecycle
│   │   └── context.ts           # AI_REGISTRY_KEY + getAIContext() Svelte context helper
│   ├── facade/
│   │   ├── SvelteAI.ts          # User-facing facade over the registry
│   │   └── tools.ts             # Vercel AI SDK tool() definitions
│   ├── preprocessor/
│   │   ├── index.ts             # svelteAIPreprocess() — Svelte preprocessor entry point
│   │   ├── vite.ts              # svelteAIVitePlugin() — Vite plugin entry point
│   │   ├── transform.ts         # Pure transform(source, filename): string
│   │   ├── parse.ts             # Regex-based decorator + declaration extractor
│   │   └── emit.ts              # Code generation: registration call strings
│   └── runtime/
│       └── globalRegistry.ts    # Module-level AIRegistry singleton

svelteAI-demo/                   # SvelteKit demo app
└── src/routes/demo/full-context/
    ├── +page.svelte             # Two-panel layout: live demo + inline dev docs
    ├── ThermostatWidget.svelte  # @ai-annotated component
    ├── ChatPanel.svelte         # Chat UI
    ├── energy.svelte.ts         # @ai-annotated shared state
    ├── agent.ts                 # ToolLoopAgent wiring
    └── svelteai.ts              # SvelteAI instance export
```

## Workspace setup

This is a Yarn workspaces monorepo. The demo app resolves `svelteai` directly from source via a Vite alias — no build step needed during development.

```bash
yarn install
yarn dev          # starts svelteAI-demo at http://localhost:5173
```

| Script | Action |
|---|---|
| `yarn dev` | Run the demo app with HMR |
| `yarn dev:lib` | Run the library dev server |
| `yarn build:lib` | Build the library to `svelteAI/dist/` |
| `yarn build:demo` | Build the demo app |
| `yarn build` | Build both |

## Peer dependencies

| Package | Version |
|---|---|
| `svelte` | `^5.0.0` |
| `ai` (Vercel AI SDK) | `^6.0.0` |
| `zod` | `^4.0.0` |

## Design docs

- [`Design/general_aim.md`](Design/general_aim.md) — goals and motivation
- [`Implementation/plan.md`](Implementation/plan.md) — full implementation plan, module architecture, transform engine spec
- [`Docs/how-to-full-context.md`](Docs/how-to-full-context.md) — full-context integration pattern with Vercel AI SDK
- [`Docs/how-to-context-digger.md`](Docs/how-to-context-digger.md) — lazy-loading pattern for larger apps
