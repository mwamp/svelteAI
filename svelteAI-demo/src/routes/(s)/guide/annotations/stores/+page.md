# Stores

SvelteAI can expose shared reactive state to the AI registry. In Svelte 5 there are two patterns for cross-component state, each handled differently.

## Runes in `.svelte.ts` files (recommended)

Svelte 5 runes (`$state`, `$derived`) work in `.svelte.ts` files. Use the same `@ai({...})` decorator syntax as in components:

```ts
// src/lib/stores/energy.svelte.ts

@ai({ access: 'rw', description: 'Total energy consumption in kWh today.' })
export let energyToday = $state(0)

@ai({ access: 'r', description: 'Current power draw in watts.' })
export let powerDraw = $derived(energyToday * 1000)
```

Because `.svelte.ts` files are not processed by the Svelte preprocessor, the **Vite plugin** is required to apply the same transform:

```ts
// vite.config.ts
import { svelteAIVite } from 'svelteai/vite'

export default defineConfig({
  plugins: [sveltekit(), svelteAIVite()]
})
```

Shared state registered this way has **global lifetime** — it is registered once on module load and lives for the full session.

## Svelte Stores (`writable` / `readable`)

Classic Svelte stores can also be annotated. The decorator syntax is the same:

```ts
// src/lib/stores/cart.ts
import { writable, derived } from 'svelte/store'

@ai({ access: 'rw', description: 'Items currently in the shopping cart.' })
export const cartItems = writable<Item[]>([])

@ai({ description: 'Total price of all items in the cart, in EUR.' })
export const cartTotal = derived(cartItems, ($items) => $items.reduce((s, i) => s + i.price, 0))
```

The Vite plugin detects whether the annotated declaration is a rune or a store and emits the appropriate registration code (`getValue` via `get(store)`, `setValue` via `store.set(v)`).

## Scoping

Shared state registers at the root level of the registry by default. Use the `scope` key to group related entries:

```ts
@ai({ access: 'rw', scope: 'cart', description: 'Items currently in the shopping cart.' })
export let cartItems = $state<Item[]>([])
// Registered as: root > cart > cartItems
```

## Runes vs Stores

| | `.svelte.ts` runes | Svelte stores |
|---|---|---|
| Syntax | `$state`, `$derived` | `writable`, `derived` |
| Reactivity | Rune-based | Subscription-based |
| Recommended for | New Svelte 5 code | Legacy or RxJS-style streams |
