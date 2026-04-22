### 1. Annotate your components

Add `@ai({...})` decorators to reactive state and functions.
The preprocessor transforms them into registry registrations at build time.

```svelte
<!-- ThermostatWidget.svelte -->
<script module>
  @component({ description: 'A thermostat control widget.' })
</script>

<script lang="ts">
  @ai({ access: 'r', description: 'Room name.' })
  let room_name = $derived(room.name)

  @ai({ access: 'rw', description: 'Target temperature.' })
  let temperature = $state(room.defaultTemp)

  @ai({ description: 'Resets to default.' })
  function resetTemperature() { ... }
</script>
```

<details>
<summary>▶ Preprocessor output</summary>

```svelte
<!-- ThermostatWidget.svelte — after svelteAIPreprocess() -->
<script module>
  import { __globalAIRegistry as __globalAIRegistry_module } from 'svelteai'
  __globalAIRegistry_module.registerComponentType({
    name: 'ThermostatWidget',
    description: 'A thermostat control widget.',
  })
</script>

<script lang="ts">
  import { getContext as __getContext, setContext as __setContext } from 'svelte'
  import { __globalAIRegistry, AI_REGISTRY_KEY } from 'svelteai'

  const __aiParent = __getContext(AI_REGISTRY_KEY) ?? __globalAIRegistry
  const __aiNode = __aiParent.createChild('ThermostatWidget')
  __setContext(AI_REGISTRY_KEY, __aiNode)

  let room_name = $derived(room.name)

  let temperature = $state(room.defaultTemp)

  function resetTemperature() { ... }

  $effect(() => {
    const __e = __aiNode.register({
      name: 'room_name',
      access: 'r',
      description: 'Room name.',
      getValue: () => room_name,
    })
    return () => __aiNode.unregister(__e)
  })

  $effect(() => {
    const __e = __aiNode.register({
      name: 'temperature',
      access: 'rw',
      description: 'Target temperature.',
      getValue: () => temperature,
      setValue: (v) => { temperature = v as typeof temperature },
    })
    return () => __aiNode.unregister(__e)
  })

  $effect(() => {
    const __e = __aiNode.registerAction({
      name: 'resetTemperature',
      description: 'Resets to default.',
      call: (...args: unknown[]) => resetTemperature(...(args as Parameters<typeof resetTemperature>)),
    })
    return () => __aiNode.unregisterAction(__e)
  })

  $effect(() => {
    return () => __aiNode.destroy()
  })
</script>
```

</details>
