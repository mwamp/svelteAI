# Context Building

Context building is how you describe the current app state to the AI model. SvelteAI provides several methods on the `svelteAI` facade to read the registry and format it for model consumption.

## `getContext(): string`

The primary method for full-context integrations. Returns a formatted string describing all currently mounted components and their state — ready to inject into a system prompt.

```ts
const systemPrompt = `
You are a smart home assistant.

${svelteAI.getContext()}
`.trim()
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

Call `getContext()` inside the `instructions` function (not at construction time) so the model always sees the current state on every turn:

```ts
const agent = new ToolLoopAgent({
  instructions: () => `You are an assistant.\n\n${svelteAI.getContext()}`
})
```

## `getState(): Record<string, unknown>`

Flat map of all state entries keyed by dotted path. Useful when you want to inject state as structured data rather than prose:

```ts
const state = svelteAI.getState()
// {
//   'ThermostatWidget:a3f2.room_name': 'bedroom',
//   'ThermostatWidget:a3f2.temperature': 22,
//   'energyToday': 14.2
// }
```

## `getComponentTypes(): AIComponentTypeSnapshot[]`

Returns all component types registered at module load time — independent of what is currently mounted. Use this for the [Digging Context](/guide/recipes/digging-context) pattern where the model gets an overview first:

```ts
const types = svelteAI.getComponentTypes()
const overview = types.map(t => `- ${t.name}: ${t.description}`).join('\n')
```

## `getSnapshot(): AISnapshot`

Full nested tree snapshot with resolved values. Use when you need the component hierarchy for custom serialization:

```ts
const snapshot = svelteAI.getSnapshot()
// {
//   componentTypes: [...],
//   tree: { id, name, entries, actions, children }
// }
```

## Choosing a Strategy

| Strategy | Method | Best for |
|---|---|---|
| Full context | `getContext()` | Small apps, full state fits in prompt |
| Component overview | `getComponentTypes()` | Dense apps, lazy lookup |
| Flat state map | `getState()` | Custom serialization |
| Full tree | `getSnapshot()` | Custom adapters, debugging |
