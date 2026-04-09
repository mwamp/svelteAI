# Preprocessor / Compile-time Transform

## Goal

Preserve native Svelte rune syntax (`$state`, `$derived`) while adding AI registration as a purely additive, optional annotation. No `.value` accessor, no parallel API to learn, no migration cost.

```ts
// Before (regular Svelte)
let n_smurfs = $state(12)

// After (with AI annotation)
/** @ai rw Counts the number of smurfs. Update if new smurfs are seen. */
let n_smurfs = $state(12)
```

The variable is used identically in both cases. The annotation is the only addition.

---

## Transform Pipeline Overview

Understanding *where* in the build pipeline a transform runs determines what it can see and what it must preserve.

```
.svelte source
      │
      ▼
┌─────────────────────────┐
│   Svelte Preprocessor   │  ← Option 1: runs here, sees raw source string
│   (svelte.config.js)    │     must output valid Svelte source
└────────────┬────────────┘
             │  transformed .svelte source
             ▼
┌─────────────────────────┐
│   Svelte Compiler       │  ← runes ($state, $derived) resolved here
│   (svelte/compiler)     │     outputs JS module + CSS
└────────────┬────────────┘
             │  compiled JS
             ▼
┌─────────────────────────┐
│   Vite transform hook   │  ← Option 2: runs here (or before Svelte plugin)
│   (vite.config.ts)      │     sees raw .svelte OR compiled JS depending on order
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   TypeScript / esbuild  │  ← Option 3 (tsc plugin): runs here
│   (type stripping)      │     too late — runes already compiled away
└────────────┬────────────┘
             │
             ▼
        browser bundle
```

**Key constraint:** any transform that needs to see `$state` / `$derived` declarations must run *before* the Svelte compiler (Options 1 or 2 with pre-ordering). After compilation, runes are gone.

---

## Transform Options

### Option 1 — Svelte Preprocessor

Svelte's `svelte.config.js` accepts a `preprocess` array. A preprocessor receives the raw `.svelte` file source and can transform the `<script>` block before the Svelte compiler sees it.

```js
// svelte.config.js
import { svelteAIPreprocess } from 'svelteai/preprocess'

export default {
  preprocess: [svelteAIPreprocess()]
}
```

**How it works:**
1. Receives raw `.svelte` source as a string
2. Parses the `<script>` block (regex or AST via `acorn` / `meriyah`)
3. Finds `$state` / `$derived` declarations preceded by an `@ai` annotation
4. Injects `__aiRegistry.register(...)` calls after each match
5. Returns the modified source — Svelte compiler then processes it normally

**Pros:**
- Integrates cleanly into existing Svelte toolchain
- Works with SvelteKit, Vite, any Svelte 5 project
- No changes to `tsconfig`, no extra build step
- Source maps can be maintained

**Cons:**
- Preprocessors run on `.svelte` files only — does not cover plain `.ts` / `.js` files where state might live in stores
- String/regex transforms are fragile; AST parsing adds a dependency (`acorn`, `meriyah`, or `@babel/parser`)
- Debugging transform errors can be opaque

---

### Option 2 — Vite Plugin

A Vite plugin with a `transform` hook intercepts `.svelte` files (and optionally `.ts` / `.js`) before they reach the Svelte plugin.

```ts
// vite.config.ts
import { svelteAIVitePlugin } from 'svelteai/vite'

export default defineConfig({
  plugins: [svelteAIVitePlugin(), sveltekit()]
})
```

**How it works:**
1. Vite plugin's `transform(code, id)` hook fires for matching file extensions
2. Parses and transforms the source (same AST approach as above)
3. Returns transformed code + source map
4. Svelte plugin then processes `.svelte` files as normal

**Pros:**
- Covers both `.svelte` and `.ts` / `.js` files — state defined in stores or utility files is also handled
- Full control over transform order (plugin ordering in Vite)
- Source map support built into Vite's transform pipeline
- Can be combined with HMR hooks for dev-time registry refresh

**Cons:**
- Slightly more complex setup than a Svelte preprocessor
- Must be careful not to conflict with the official `@sveltejs/vite-plugin-svelte`

---

### Option 3 — TypeScript Compiler Plugin (`ts-plugin`)

A TypeScript language service plugin or transformer (via `ts-patch` / `ttypescript`) that runs during `tsc` compilation.

**Verdict:** Not viable. By the time `tsc` processes output, Svelte runes have already been compiled away. `ts-plugin` (language service) does not transform output — only affects editor experience. Actual emit transforms require `ts-patch` or `ttypescript`, which are non-standard and fragile. Could complement a Vite plugin for type inference in the editor, but cannot drive the transform.

---

### Option 4 — Babel Plugin

A Babel transform plugin, used via `vite-plugin-babel` or a custom Vite plugin wrapping Babel.

**Verdict:** Overkill. Adds Babel as a dependency to a Vite/Svelte project for no meaningful gain over a native Vite plugin. Babel does not understand Svelte rune syntax natively and would need a custom parser. The Vite plugin (Option 2) covers the same ground with less overhead.

---

## Recommended Approach

**Svelte Preprocessor (Option 1) as primary, Vite Plugin (Option 2) as extension.**

- Start with a Svelte preprocessor: covers the main use case (state in `.svelte` components), integrates with zero extra tooling, ships as part of the library.
- Add a Vite plugin later to handle state defined in `.ts` store files outside of components.

---

## Annotation Syntax Options

### Option S — Svelte-native pseudo-rune `$ai(...)`

Introduce a new rune-like call that wraps or annotates the declaration. The preprocessor strips it before the Svelte compiler sees it.

```ts
let n_smurfs = $state($ai({ access: 'rw', description: 'Counts the number of smurfs.' }, 12))

// or as a wrapper around the whole declaration:
$ai({ access: 'rw', description: 'Counts the number of smurfs.' })
let n_smurfs = $state(12)
```

**Pros:**
- Visually consistent with Svelte's `$` rune convention
- Feels native to the Svelte ecosystem
- The preprocessor can strip `$ai(...)` before the Svelte compiler sees it, so no compiler changes needed

**Cons:**
- Parsing is harder: `$state($ai(...), 12)` nests calls in a non-standard way; a robust AST parser is required
- The Svelte compiler itself would need to be told to ignore `$ai` (or the preprocessor must fully strip it before compilation)
- Using the **Svelte parser itself** (the `svelte/compiler` `parse()` function) is an option here — it produces a full AST of the `.svelte` file including the script block, which would make `$ai(...)` detection reliable. However, the Svelte parser is not designed to be used as a general-purpose transform tool and its AST format may change between versions.

---

### Option J — JSDoc `@ai` tag (recommended)

Standard JSDoc comment immediately preceding the declaration.

```ts
/**
 * @ai
 * @access rw
 * @description Current room temperature in Celsius. Agent may adjust it.
 * @type {number}
 */
let temperature = $state(22)
```

**Parsing fields without ambiguity:**

Each piece of metadata is a separate named tag — no positional parsing, no ambiguity:

| Tag | Required | Values | Notes |
|---|---|---|---|
| `@ai` | yes | (presence flag) | Marks the declaration for registration |
| `@access` | no | `r`, `rw` | Defaults: `rw` for `$state`, `r` for `$derived` |
| `@description` | yes | free text | Multi-line supported — all lines until next tag are concatenated |
| `@type` | no | JSDoc type expression | Redundant with TypeScript type, but useful for runtime type hints |

**Multi-line description example:**

```ts
/**
 * @ai
 * @access rw
 * @description Items currently in the shopping cart.
 *   Each item has a name, price, and quantity.
 *   The agent may add or remove items but not modify prices.
 * @type {Item[]}
 */
let cart_items = $state<Item[]>([])
```

**Typed variable with inferred access:**

```ts
/**
 * @ai
 * @description Total price of all items in the cart, in EUR.
 *   Automatically computed from cart_items. Read-only.
 */
let cart_total = $derived(cart_items.reduce((s, i) => s + i.price, 0))
// access defaults to 'r' because $derived
```

**Compact single-line form** (for simple cases):

```ts
/** @ai @access rw @description Current page index. */
let page = $state(0)
```

**Parsing approach:** Use `comment-parser` (npm) or a small hand-rolled parser. The `@ai` tag acts as the opt-in marker — declarations without it are ignored entirely. Tags are unambiguous because each starts with `@`.

**Pros:**
- Standard, editor-friendly — hover tooltips show the JSDoc in IDEs
- Multi-line descriptions are natural
- Named tags eliminate positional ambiguity
- TypeScript type information is already present on the declaration itself; `@type` is optional

**Cons:**
- More verbose than a magic comment for simple cases
- Requires the preprocessor to correctly associate a JSDoc comment with the immediately following declaration

---

### Option M — Magic inline comment

```ts
let n_smurfs = $state(12) // @ai rw "Counts the number of smurfs."
```

**Pros:** Compact, inline  
**Cons:** Multi-line descriptions are awkward; quoting rules for the description string add parsing complexity; less editor support than JSDoc

---

### Option D — Decorator syntax

```ts
@ai({ access: 'rw', description: 'Counts the number of smurfs. Update if new smurfs are seen.' })
let n_smurfs = $state(12)
```

**On viability:** TC39 decorators (Stage 3) are defined for *classes and class members*, not for variable declarations. However, this is a preprocessor context — we are not constrained by what TypeScript or the browser accepts today. The preprocessor runs before any standard compiler and can define its own syntax.

The practical question is **parser support**:
- `acorn` and `meriyah` (standard JS parsers) will reject `@decorator` on a `let` declaration — they follow the spec
- `@babel/parser` with `decorators` plugin also only supports class decorators
- A **custom parser** or **regex-based transform** could handle this, but it would need to be robust against edge cases (decorators with complex expressions, stacked decorators, etc.)
- The **Svelte parser** does not support decorators at all currently

**Verdict:** Viable *if* we write or fork a parser that accepts this syntax. The transform itself is straightforward — strip the decorator, emit the registration call. The blocker is reliable parsing of `@decorator` on variable declarations without a spec-compliant parser supporting it. A regex approach (`/@ai\s*\([\s\S]*?\)\s*\nlet\s+(\w+)\s*=\s*\$state/`) is possible but brittle for complex decorator expressions.

**Pros:**
- Cleanest, most drop-in syntax — one line above the declaration
- Familiar to developers coming from Python, Java, or TypeScript class decorators
- Structured arguments (object literal) are unambiguous and type-checkable

**Cons:**
- No standard parser supports `@decorator` on variable declarations today
- Requires a custom or forked parser, or a carefully scoped regex
- May conflict with future TC39 proposals if the syntax is standardized differently

---
---


## Deregistration

Svelte 5 `$state` variables are scoped to the component instance closure. When a component unmounts, the closure is eligible for garbage collection — but the AI registry holds a `getValue` closure reference, which **prevents GC and leaves a stale entry** in the registry. Explicit deregistration is therefore necessary, not optional.

### Mechanism

Svelte 5 provides `$effect` with a cleanup callback (the function returned from the effect body runs when the effect is destroyed, i.e. when the component unmounts):

```ts
// Preprocessor-emitted code (inside component script)
$effect(() => {
  const entry = __aiRegistry.register({
    name: 'n_smurfs',
    access: 'rw',
    description: 'Counts the number of smurfs.',
    getValue: () => n_smurfs,
    setValue: (v) => { n_smurfs = v }
  })
  return () => __aiRegistry.unregister(entry)
})
```

The `$effect` lifecycle is tied to the component — registration happens on mount, deregistration on unmount. This is automatic and requires no developer action beyond the annotation.

### Edge cases

- **SSR**: `$effect` does not run on the server. Registry entries should only be created client-side, or the registry must be aware of the rendering context.
- **HMR**: On hot module replacement, the component is destroyed and re-created. The `$effect` cleanup handles deregistration, but the new instance must re-register with potentially updated metadata. This should work automatically if the preprocessor emits registration inside `$effect`.
- **Conditional rendering**: A component inside `{#if}` will register/deregister as the condition toggles. The AI view of available state will change dynamically — the model adapter must handle a registry that changes at runtime.

---

## Scoping

The user is correct that Svelte 5 runes have no inherent notion of component ownership — `$state` is a reactive variable in a closure, with no attached component identity. However, the **preprocessor knows which `.svelte` file it is processing**, so it can inject component-level scope metadata automatically.

### Why scoping matters for AI

An AI agent benefits from understanding structure, not just a flat list of variables:

```
// Flat (no scope) — hard to reason about
{ temperature: 22, cart_items: [...], page: 0, user_name: 'Alice', ... }

// Scoped — agent understands context
ThermostatWidget
  temperature: 22  (rw) — Current room temperature in Celsius

ShoppingCart
  cart_items: [...]  (rw) — Items in the cart
  cart_total: 47.5   (r)  — Total price in EUR

Pagination
  page: 0  (rw) — Current page index
```

### Implementation

The preprocessor injects the component filename (or a developer-provided name) as a `scope` field on each registration:

```ts
// Preprocessor-emitted code for a file named ThermostatWidget.svelte
$effect(() => {
  const entry = __aiRegistry.register({
    scope: 'ThermostatWidget',   // injected from filename
    name: 'temperature',
    access: 'rw',
    description: 'Current room temperature in Celsius.',
    getValue: () => temperature,
    setValue: (v) => { temperature = v }
  })
  return () => __aiRegistry.unregister(entry)
})
```

Developers can override the scope name via an annotation tag:

```ts
/**
 * @ai
 * @scope thermostat_panel
 * @description Current room temperature in Celsius.
 */
let temperature = $state(22)
```

### Multiple instances — inferring the tree

The component tree structure can be inferred automatically using **Svelte's context API**, without any developer-provided keys.

**Mechanism:** The library uses a context-propagated registry node. Each component, on mount:
1. Reads `getContext(AI_REGISTRY_KEY)` to find its nearest ancestor registry node (falls back to the global root)
2. Creates a **child node** under that parent, keyed by component name + sibling index within that parent
3. Registers its `@ai` variables into that child node
4. Calls `setContext(AI_REGISTRY_KEY, childNode)` so its own children nest under it automatically

```
App (root registry)
├── Header
│   └── UserMenu
│       └── user_name: 'Alice'
├── ThermostatWidget  [0]
│   └── temperature: 22
└── ThermostatWidget  [1]
    └── temperature: 19
```

The sibling index (`[0]`, `[1]`) is assigned by the parent node as children register — first to mount gets index 0. This mirrors the DOM order.

**Preprocessor-emitted code** (simplified):

```ts
// Injected at top of component script
import { getContext, setContext } from 'svelte'
import { AI_REGISTRY_KEY } from 'svelteai'

const __aiParent = getContext(AI_REGISTRY_KEY) ?? __globalAIRegistry
const __aiNode = __aiParent.createChild('ThermostatWidget')  // name from filename
setContext(AI_REGISTRY_KEY, __aiNode)

// Then per @ai variable:
$effect(() => {
  const entry = __aiNode.register({ name: 'temperature', ... })
  return () => __aiNode.unregister(entry)
})
```

**On sibling identity — unordered set with neutral IDs:**

Siblings are treated as an **unordered set**. Each instance gets a stable neutral ID (e.g. `crypto.randomUUID()`) on mount — purely as a registry handle for internal bookkeeping:

```
ThermostatWidget:a3f2c1  → { temperature: 22, room_name: 'bedroom' }
ThermostatWidget:b7e09d  → { temperature: 19, room_name: 'living room' }
```

- IDs are stable for the lifetime of the instance regardless of sibling order changes
- Conditional rendering of other siblings does not affect any instance's identity
- The AI registry always reflects the *current* mounted set — no stale references

**The agent does not use the ID to identify instances.** It reads the *state values* inside each node. If the developer has annotated meaningful state (e.g. `room_name`, `user_email`, `product_id`), the agent can distinguish instances from their content — which is the correct and only reliable approach. The ID is an opaque handle; the data is the identity.

This places the responsibility correctly: **the developer's job is to expose enough descriptive state** that the agent can understand what each instance represents. The library's job is to make that state accessible in a structured tree.

```svelte
{#each rooms as room (room.id)}
  <!-- Agent distinguishes these by reading room_name.value, not by the UUID -->
  <ThermostatWidget {room} />
{/each}
```

### Scope tree vs. flat registry

The registry exposes both views — adapters choose the representation that fits their model context format:

```ts
interface AIRegistry {
  // Flat — for simple model adapters
  getAll(): AIEntry[]
  getState(): Record<string, unknown>

  // Scoped tree — for structured model context
  getTree(): AITreeNode
}

interface AITreeNode {
  name: string
  entries: AIEntry[]
  children: AITreeNode[]
}
```

Example tree output:
```json
{
  "name": "root",
  "entries": [],
  "children": [
    {
      "name": "ThermostatWidget:a3f2c1",
      "entries": [
        { "name": "temperature", "value": 22, "access": "rw" },
        { "name": "room_name", "value": "bedroom", "access": "r" }
      ],
      "children": []
    },
    {
      "name": "ThermostatWidget:b7e09d",
      "entries": [
        { "name": "temperature", "value": 19, "access": "rw" },
        { "name": "room_name", "value": "living room", "access": "r" }
      ],
      "children": []
    }
  ]
}
```

---

## Open Questions

- **Multi-file state**: How does the registry handle state defined in a `.ts` store file and imported into multiple components? Needs the [Vite Plugin](#option-2--vite-plugin) extension — the Svelte preprocessor only covers `.svelte` files.
- **HMR**: On hot module replacement, the `$effect` cleanup handles deregistration, but the timing of destroy vs. re-create must be validated. See [Deregistration — HMR edge case](#deregistration).
- **SSR**: `$effect` does not run server-side. The registry must be client-only or the preprocessor must guard registration with a browser check. See [Deregistration — SSR edge case](#deregistration).
- **Parser choice**: Regex is fast to implement but fragile for complex annotation expressions (e.g. multi-line JSDoc, decorator with nested object). `acorn`/`meriyah` AST is robust but adds a dependency. Decision deferred to implementation.
- **Relationship to Path A**: The preprocessor can emit calls to the same `AIState` / `AIDerived` classes from [Path A](wrapper.md), making both approaches complementary rather than competing — the preprocessor is a DX layer on top of the same runtime.
- **Conditional rendering dynamics**: When `{#if}` toggles, components register/deregister. The model adapter must handle a registry that changes at runtime — snapshot-based adapters are unaffected, but session-persistent agents need a strategy for state that disappears mid-conversation.
