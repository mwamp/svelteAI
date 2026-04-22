# Recipe: Digging Context

**Use case:** A dense app with many components on the same page, most of which are unrelated to any given user request. The model receives a lightweight overview and uses `lookup_component` to fetch detailed context only for what it needs.

**Example:** A project management workspace — kanban board, timeline, analytics, team roster, and notification center all on the same page.

---

## What the model sees initially

The system prompt contains only component names and short descriptions — no state values:

```
You are a project management assistant.
Use lookup_component to get the full state and actions for any component before acting.

Available components:
- KanbanBoard: Displays tasks organized in columns by status.
- Timeline: Gantt-style view of project milestones and dependencies.
- AnalyticsDashboard: Charts and KPIs for project health and velocity.
- TeamRoster: Team members with roles, availability, and assignments.
- NotificationCenter: Inbox of project events, mentions, and alerts.
```

The model knows what exists. It fetches state only when it needs to act.

---

## 1. Annotate your components

```svelte
<!-- KanbanBoard.svelte -->
<script module>
  @component({ description: 'Displays tasks organized in columns by status. Supports drag-and-drop and inline editing.' })
</script>

<script lang="ts">
  @ai({ access: 'rw', description: 'All tasks grouped by column. Each task has id, title, assignee, priority, and dueDate.' })
  let columns = $state(initialColumns)

  @ai({ access: 'rw', description: 'Active filter. One of: all, mine, overdue, unassigned.' })
  let filter = $state('all')

  @ai({ description: 'Moves a task to a different column. taskId: task identifier. targetColumn: destination column name.' })
  function moveTask(taskId: string, targetColumn: string) { /* ... */ }

  @ai({ description: 'Creates a new task. title: task title. column: destination column. assignee: team member username.' })
  function createTask(title: string, column: string, assignee: string) { /* ... */ }
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

  // Overview only — no state values in the system prompt
  instructions: () => {
    const types = svelteAI.getComponentTypes()
    const overview = types.map(t => `- ${t.name}: ${t.description}`).join('\n')
    return `
You are a project management assistant.
Use lookup_component to get the full state and actions for any component before acting.

Available components:
${overview}
    `.trim()
  },

  tools: {
    navigate: tool({
      description: 'Navigate to a different page.',
      parameters: z.object({ path: z.string() }),
      execute: async ({ path }) => { await goto(path); return { ok: true } }
    }),
    ...svelteAI.tools.lookupComponent,
    ...svelteAI.tools.callAction,
    ...svelteAI.tools.setState
  }
})
```

---

## Example model interaction

**User:** "Move all overdue tasks to Blocked and assign them to Sarah."

**Turn 1:** Model calls `lookup_component({ name: 'KanbanBoard' })`

**Tool returns:** Full columns state + available actions with paths

**Turn 2:** Model reads overdue tasks, calls `call_action` for each:
```json
{ "action": "KanbanBoard:a3f2.moveTask", "args": { "taskId": "task-7", "targetColumn": "Blocked" } }
```

The other four components were never fetched.

---

## When to use this pattern

- Apps with 5+ components on a single page
- Components with large state (long lists, nested objects)
- When you want the model to reason about *which* component to interact with before acting
- Token-sensitive integrations where context cost matters

For simple apps, see [Full Context](/guide/recipes/full-context). For multi-page apps, see [Workflow Based](/guide/recipes/workflow-based).
