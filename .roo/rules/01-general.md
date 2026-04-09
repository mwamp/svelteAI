# Roo Custom Rules

## General actions

- In case a file needs moving, use the shell mv command, do not rewrite the file in an other location (and then potentially fix paths)

## Tools
- Use yarn for js/ts projects

## Implementation

Do not add TODOs to code (unless demanded by user). Out of scope functionality should not have skeleton. For obvious missing functionality recap in a single markdown document for the task under plan/todos.




**Frontend**
- Prettier rules: tabs (not spaces), single quotes, no trailing commas.
- Factor code whenever possible, create appropriate components

**Svelte 5 (Runes Mode):**
- Use `onclick` not `on:click`, `oninput` not `on:input`, etc.
- No `<svelte:component>` - use `{#if}` or direct component
- Close all non-void tags: `<div></div>` not `<div />`
- Labels need `for="id"` matching input `id="id"`
- Buttons need `aria-label` if no text content
- NO `createEventDispatcher` - use callback props: `export let onsuccess: ((detail: T) => void) | undefined`
- always use { resolve } from '$app/paths' to resolve hrefs
- Each elements should have keys
- `$derived` must receive a value expression, not an arrow function: use `$derived(expr)` or `$derived((() => { ...; return val; })())` for multi-statement bodies — never `$derived(() => ...)`
- `$state` initialized from a `$props()` value (e.g. `$state(data.foo)`) triggers `state_referenced_locally`; suppress with `// svelte-ignore state_referenced_locally` on the preceding line — this is the correct pattern for mutable local copies of server data in `+page.svelte` files


## Backend

- Any fs access path should be accessed via the paths.ts file

## Documentation Standards

**Standalone docs : synthetic Documentation Only:**
- Keep docs minimal - essential info only
- NO code blocks or examples in docs
- Use file references: [`function()`](path/file.ts:line)
- Max 2-3 sentences per section
- Focus on "what" and "why", not "how"

**Structure:**
- Brief overview
- Key components (bullet list)
- File references for details