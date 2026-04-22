# Recipe: Workflow Based

**Use case:** A multi-page app organized around user journeys. The model understands the app in terms of flows — what each page is for, what the user can accomplish there, and how pages connect. The model navigates by intent and fetches context only for the current flow.

**Example:** A flight booking app with five distinct flows: Search, Seat Selection, Checkout, Confirmation, My Trips.

---

## The flow catalogue

The developer defines a static flow catalogue — a description of the app's major user journeys. This is authored once alongside the agent definition.

```ts
// src/lib/flows.ts
export const flows = [
  {
    name: 'Search',
    route: '/search',
    description: 'Search for available flights. User enters destination, travel dates, and passenger count.'
  },
  {
    name: 'Checkout',
    route: '/booking/:bookingId/checkout',
    description: 'Complete the booking. Enter payment details, apply promo codes, and confirm.'
  },
  {
    name: 'MyTrips',
    route: '/trips',
    description: 'View all past and upcoming trips. Options to manage or cancel.'
  }
]
```

---

## 1. Annotate your components

Each component is annotated as usual. The `lookup_flow` tool returns the state and actions of all components currently mounted on the matched route.

```svelte
<!-- SearchForm.svelte -->
<script module>
  @component({ description: 'Flight search form. Collects destination, travel dates, and passenger count.' })
</script>

<script lang="ts">
  @ai({ access: 'rw', description: 'Destination airport or city.' })
  let destination = $state('')

  @ai({ access: 'rw', description: 'Departure date in YYYY-MM-DD format.' })
  let departureDate = $state('')

  @ai({ access: 'rw', description: 'Number of passengers. Between 1 and 9.' })
  let passengers = $state(1)

  @ai({ description: 'Submits the search with the current form values. Navigates to results.' })
  function submitSearch() { /* ... */ }
</script>
```

## 2. Build the agent

The `lookup_flow` tool is developer-owned because it depends on the flow catalogue. Registry access is reduced to a single `svelteAI.getNodes()` call.

```ts
// src/lib/agent.ts
import { ToolLoopAgent, tool } from 'ai'
import { openai } from '@ai-sdk/openai'
import { svelteAI } from 'svelteai'
import { goto } from '$app/navigation'
import { flows } from './flows'
import { z } from 'zod'

const flowCatalogue = flows.map(f => `- ${f.name} (${f.route}): ${f.description}`).join('\n')

export const agent = new ToolLoopAgent({
  model: openai('gpt-4o'),

  instructions: `
You are a flight booking assistant.

The app is organized into the following flows:
${flowCatalogue}

Use navigate to move between flows.
Use lookup_flow to get the full state and actions for the current flow before acting.
  `.trim(),

  tools: {
    navigate: tool({
      description: 'Navigate to a flow by route path.',
      parameters: z.object({
        path: z.string().describe('The route path, e.g. /search'),
        reason: z.string().describe('Why you are navigating there.')
      }),
      execute: async ({ path, reason }) => { await goto(path); return { ok: true, path, reason } }
    }),

    lookup_flow: tool({
      description: 'Get the full current state and available actions for a specific flow.',
      parameters: z.object({
        flow: z.string().describe('The flow name from the catalogue, e.g. Search, Checkout.')
      }),
      execute: async ({ flow }) => {
        const target = flows.find(f => f.name === flow)
        if (!target) return { error: `Unknown flow: ${flow}` }
        const nodes = svelteAI.getNodes()
        if (nodes.length === 0) return { flow, note: 'No components mounted. Navigate to this flow first.' }
        return { flow, route: target.route, components: svelteAI.describeNodes(nodes) }
      }
    }),

    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState
  }
})
```

---

## Example model interaction

**User:** "Book me a flight to Lisbon next Friday, two passengers."

1. Model calls `navigate({ path: '/search', reason: 'Starting flight search' })`
2. Model calls `lookup_flow({ flow: 'Search' })` — gets form state and `submitSearch` action
3. Model calls `set_state` to fill destination, date, passengers
4. Model calls `call_action` to submit the search
5. Model follows the flow to seat selection, then checkout

The model never loaded trip management or analytics state.

---

## When to use this pattern

- Multi-page apps where each page represents a distinct user goal
- Booking, onboarding, or wizard-style flows with sequential steps
- When you want the model to mirror how a human user navigates the app

For single-page apps with many components, see [Digging Context](/guide/recipes/digging-context).
For simple apps, see [Full Context](/guide/recipes/full-context).
