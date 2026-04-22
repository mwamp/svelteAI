# State and Components

SvelteAI annotations use a decorator syntax placed directly above Svelte 5 `$state` / `$derived` declarations or in `<script module>` for component-level descriptions. The preprocessor reads them at build time and emits registry registration calls.

## Annotating State

Place an `@ai({...})` decorator on the line immediately before any `$state` or `$derived` variable:

```svelte
<script lang="ts">
  @ai({ access: 'rw', description: 'Current temperature setpoint in Celsius.' })
  let temperature = $state(21)

  @ai({ access: 'r', description: 'Whether the heating system is currently active.' })
  let heatingOn = $derived(temperature > 18)
</script>
```

The decorator takes a flat object with these keys:

| Key | Required | Values | Meaning |
|---|---|---|---|
| `description` | yes | string | Shown to the model as context |
| `access` | no | `rw`, `r` | Read-write or read-only. Defaults to `r` for `$derived`, `rw` for `$state` |

## Annotating Components

Add a `@component({...})` decorator inside `<script module>` to describe the component type to the AI. This runs once when the module is first imported — before any instance is mounted.

```svelte
<script module>
  @component({ description: 'A thermostat control widget. Displays and controls the temperature for a single room.' })
</script>

<script lang="ts">
  @ai({ access: 'r', description: 'The name of the room this widget controls.' })
  let room_name = $derived(room.name)

  @ai({ access: 'rw', description: 'Current temperature in Celsius. Agent may adjust between 16 and 30.' })
  let temperature = $state(21)
</script>
```

## What Gets Registered

Each annotated item becomes a node in the registry with:

- A unique path derived from the component tree
- The current reactive value (kept live via Svelte effects)
- The description from the decorator
- The access mode (`r` or `rw`)

## Reactivity

Registered state values are kept live. When `temperature` changes in the UI, the registry reflects the new value immediately — the AI always sees the current state.

## Lifecycle

Registration happens on component mount via a `$effect`. When the component unmounts, the entry is automatically removed from the registry — no manual cleanup needed.
