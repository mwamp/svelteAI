# Functions

Annotating a function with `@ai({...})` exposes it as a callable **tool** — the AI agent can invoke it with arguments, and the result is returned to the agent.

## Basic Annotation

Place the decorator on the line immediately before a `function` or `async function` declaration:

```svelte
<script lang="ts">
  @ai({ description: 'Submits the current cart as an order. Irreversible.' })
  async function submitOrder() {
    await fetch('/api/order', { method: 'POST' })
  }
</script>
```

The function remains usable in the template exactly as before — the decorator is the only addition.

## Functions with Parameters

Describe parameters in the decorator to give the agent enough context to call the function correctly:

```svelte
<script lang="ts">
  @ai({ description: 'Adds an item to the cart. productId: product identifier. quantity: number of units.' })
  function addToCart(productId: string, quantity: number) {
    cartItems.push({ productId, quantity })
  }
</script>
```

## What Gets Registered

Each annotated function becomes an action entry in the registry with:

- The function name
- The description from the decorator
- A callable reference tied to the component instance

## Lifecycle

Registration follows the same `$effect` pattern as state — the action is registered on component mount and automatically unregistered on unmount. No manual cleanup needed.

## Safety

Only annotate functions that are safe for the agent to call. The library does not enforce authorization — that is the application's responsibility. For irreversible actions, make this clear in the description so the agent can decide whether to confirm with the user first.
