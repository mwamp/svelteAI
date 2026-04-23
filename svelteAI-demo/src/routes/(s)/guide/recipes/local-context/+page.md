# Recipe: Local context

**Use case:** A focused app with a small number of components. The model receives the complete app state on every turn — no lazy loading, no lookup tools. Simple and effective for apps where the total context fits comfortably in a system prompt.

**Example:** A smart home dashboard with a thermostat widget, a lighting panel, and a global energy summary.

---

## What the model sees

On every chat turn, the system prompt includes the full current state:

```
App state:

[ThermostatWidget — living room]
  Controls the temperature for a single room.
  room_name (r): 'living room'
  temperature (rw): 21
  mode (rw): 'heat'

[ThermostatWidget — bedroom]
  Controls the temperature for a single room.
  room_name (r): 'bedroom'
  temperature (rw): 19
  mode (rw): 'off'

Global state:
  energyToday (r): 14.2
```

---

## 1. Annotate your components

```html
<!-- ThermostatWidget.svelte -->
<script module>
  @component({ description: 'Controls the temperature for a single room.' })
</script>

<script lang="ts">
  let { room } = $props()

  @ai({ access: 'r', description: 'The name of the room this widget controls.' })
  let room_name = $derived(room.name)

  @ai({ access: 'rw', description: 'Current target temperature in Celsius.' })
  let temperature = $state(room.defaultTemp)

  @ai({ access: 'rw', description: 'Heating/cooling mode. One of: heat, cool, auto, off.' })
  let mode = $state(room.defaultMode)

  @ai({ description: 'Sets temperature and mode together.' })
  function configure(temp, newMode) {
    temperature = temp
    mode = newMode
  }
</script>
```

## 2. Build the agent

```ts
// src/lib/agent.ts
import { ToolLoopAgent, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { svelteAI } from 'svelteai'
import { goto } from '$app/navigation'
import { z } from 'zod'

export const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),

  // Re-evaluated on every turn — model always sees current state
  instructions: () => [
    'You are a smart home assistant. You can read and control the home\'s devices.',
    '',
    svelteAI.getContext()
  ].join('\n'),

  tools: {
    navigate: tool({
      description: 'Navigate to a different page in the app.',
      parameters: z.object({ path: z.string() }),
      execute: async ({ path }) => { await goto(path); return { ok: true } }
    }),
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState
  }
})
```

## 3. Wire up the chat UI

Use `@ai-sdk/svelte`'s `Chat` class with a `DirectChatTransport` pointing at your agent. Render `chat.messages` and call `chat.sendMessage()` on form submit. The agent receives the full app state on every turn via the `instructions` function.

---

## When to use this pattern

- Small to medium apps where total state fits in a system prompt (inf ~2000 tokens of state)
- Apps where the model needs full awareness to reason correctly
- Stateless request/response integrations — no persistent session needed

For larger apps, see [Digging Context](/guide/recipes/digging-context).
