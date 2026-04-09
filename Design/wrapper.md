# Wrapper Implementation

## Goal

Expose reactive Svelte state to an AI agent with minimal syntax overhead. The AI registry collects named, typed, described reactive values and actions — model-agnostic.

---

## Implementation Paths

### Path A — Factory functions

Replace `$state(val)` with `aiState(val, opts)`. Internally uses a Svelte 5 reactive class with a `$state` field.

```ts
const nSmurfs = aiState(12, {
  name: 'n_smurfs',
  access: 'rw',
  description: 'Counts the number of smurfs. Update if new smurfs are seen.'
})

const nImbeciles = aiDerived(
  () => Math.floor(0.1 * nSmurfs.value),
  {
    name: 'n_imbeciles',
    description: 'A fraction of the smurfs are dumb, nothing we can do about it.'
  }
)
```

Reading and writing the value — always via `.value`:

```svelte
<!-- Read in template -->
<p>Smurfs: {nSmurfs.value}</p>

<!-- Write via event -->
<button onclick={() => nSmurfs.value++}>Add smurf</button>

<!-- Two-way bind -->
<input type="range" min="0" max="100" bind:value={nSmurfs.value} />
```

In script, same accessor:
```ts
// Read
console.log(nSmurfs.value)

// Write (throws if access === 'r')
nSmurfs.value = 15
```

**Pros:** Works with Svelte 5, type-safe, self-registering, reactive
**Cons:**
- `.value` accessor — one extra token everywhere the variable is used
- Completely different syntax from native runes — not a drop-in, not natural to migrate from regular Svelte to this
- Developers familiar with `$state` / `$derived` must learn a parallel API
- Reactive class fields with `$state` inside are a Svelte 5 edge case — less documented, more footguns

---

### Path B — Side-effect registration

Keep `$state` as-is, register separately. Verbose and error-prone (name duplication).

```ts
let n_smurfs = $state(12)
registerAI('n_smurfs', {
  get: () => n_smurfs,
  set: (v) => { n_smurfs = v },
  type: Number,
  access: 'rw',
  description: 'Counts the number of smurfs.'
})
```

**Pros:** Zero change to `$state` usage
**Cons:** Redundant naming, verbose, easy to forget, no fluent API

---

### Path C — Preprocessor / compile-time transform

See [`preprocessor.md`](preprocessor.md) for full analysis. Closest to the "minimal syntax" goal — native rune syntax is preserved, annotation is additive.

```ts
/** @ai rw Counts the number of smurfs. Update if new smurfs are seen. */
let n_smurfs = $state(12)
```

---

## Recommended Design: Path A (factory functions)

### Reactive Box — `AIState<T>`

Internally a Svelte 5 class with a `$state` private field:

```ts
class AIState<T> {
  #value = $state<T>() as T

  constructor(
    initial: T,
    readonly meta: AIMeta<T>
  ) {
    this.#value = initial
    aiRegistry.register(this)
  }

  get value(): T { return this.#value }

  set value(v: T) {
    if (this.meta.access === 'r') throw new Error(`${this.meta.name} is read-only`)
    this.#value = v
  }
}
```

### Derived Box — `AIDerived<T>`

Wraps `$derived`:

```ts
class AIDerived<T> {
  #value = $derived(this.#compute())
  // NOTE: $derived must be initialized with an expression, not a function reference.
  // Use a getter pattern or inline expression.

  constructor(
    private readonly compute: () => T,
    readonly meta: AIMeta<T>
  ) {
    aiRegistry.register(this)
  }

  get value(): T { return this.#value }
  // No setter — derived is always read-only
}
```

### Public API

```ts
// Factory functions (preferred over `new`)
export function aiState<T>(initial: T, meta: AIMeta<T>): AIState<T>
export function aiDerived<T>(compute: () => T, meta: AIMeta<T>): AIDerived<T>
export function aiAction(fn: (...args: unknown[]) => unknown, meta: ActionMeta): AIAction
```

### Meta types

```ts
interface AIMeta<T> {
  name: string
  description: string
  access?: 'r' | 'rw'   // default 'rw' for state, always 'r' for derived
  type?: new (...args: unknown[]) => T  // optional runtime type hint
}

interface ActionMeta {
  name: string
  description: string
  params?: Record<string, { type: string; description: string }>
}
```

---

## AI Registry

The registry is the single source of truth exposed to the model layer. It is model-agnostic — any adapter (MCP, OpenAI tools, custom) reads from it.

```ts
interface AIEntry {
  name: string
  description: string
  access: 'r' | 'rw'
  getValue(): unknown
  setValue?(v: unknown): void
}

interface AIRegistry {
  register(entry: AIEntry): void
  unregister(name: string): void
  getAll(): AIEntry[]
  getState(): Record<string, unknown>   // snapshot for model context
}
```

### Scoping

The registry should be **component-scoped** (via Svelte context) so that mounting/unmounting a component automatically registers/unregisters its AI entries. A global fallback registry handles app-level state.

```ts
// In a component
import { getAIContext } from 'svelteai'

const ai = getAIContext()  // returns component-local registry, falls back to global

const count = aiState(0, { name: 'count', description: '...', access: 'rw' })
// auto-registered in ai context
```

---

## Developer Experience Examples

### Basic state

```svelte
<script lang="ts">
  import { aiState } from 'svelteai'

  const temperature = aiState(22, {
    name: 'temperature',
    access: 'rw',
    description: 'Current room temperature in Celsius. Agent may adjust it.'
  })
</script>

<p>Temperature: {temperature.value}°C</p>
<input type="range" min="16" max="30" bind:value={temperature.value} />
```

### Read-only derived

```svelte
<script lang="ts">
  import { aiState, aiDerived } from 'svelteai'

  const cartItems = aiState<Item[]>([], {
    name: 'cart_items',
    access: 'rw',
    description: 'Items currently in the shopping cart.'
  })

  const cartTotal = aiDerived(
    () => cartItems.value.reduce((sum, item) => sum + item.price, 0),
    {
      name: 'cart_total',
      description: 'Total price of all items in the cart, in EUR.'
    }
  )
</script>

<p>Total: {cartTotal.value} EUR</p>
```

### Action registration

```svelte
<script lang="ts">
  import { aiAction } from 'svelteai'

  const submitOrder = aiAction(
    async () => {
      await fetch('/api/order', { method: 'POST' })
    },
    {
      name: 'submit_order',
      description: 'Submits the current cart as an order. Irreversible.'
    }
  )
</script>

<button onclick={submitOrder.call}>Place Order</button>
```

### Accessing the registry (model adapter side)

```ts
import { globalRegistry } from 'svelteai'

// Get current snapshot for model context window
const context = globalRegistry.getState()
// => { temperature: 22, cart_items: [...], cart_total: 47.5 }

// Let model set a value
globalRegistry.setValue('temperature', 24)
```

---

## Coverage of General Aim

| Goal from `general_aim.md` | Covered by wrapper? |
|---|---|
| Reactive data access ro/rw | ✅ `aiState` (rw), `aiDerived` (ro) |
| Type + meaning + use description | ✅ `AIMeta.description`, `AIMeta.type` |
| Access to select functions/actions | ✅ `aiAction` |
| Component-level scoping | ✅ via Svelte context registry |
| Access to components | ❌ separate concern — component registry |
| Navigation awareness | ❌ separate concern — route registry |
| Backend route access | ❌ separate concern |
| Model-agnostic interface | ✅ registry is adapter-independent |

---

## Open Questions

- **Name inference**: Can we avoid passing `name` explicitly? Options: (a) preprocessor reads variable name, (b) use a `Symbol`-based key, (c) accept the redundancy as a tradeoff for simplicity.
- **Scoping strategy**: Global singleton vs. Svelte context tree — how do we handle the same state name in multiple component instances?
- **`$derived` in class fields**: Svelte 5 has constraints on `$derived` inside class bodies — needs validation during implementation.
- **Type safety for `setValue`**: The registry's `setValue(name, v: unknown)` loses type info. Consider a typed accessor pattern.
- **Preprocessor as Phase 2**: Path C (preprocessor) could be built on top of Path A as an optional DX enhancement once the runtime is stable.
