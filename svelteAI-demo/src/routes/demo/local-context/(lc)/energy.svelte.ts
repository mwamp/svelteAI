/**
 * Shared energy state for the local-context demo.
 *
 * Annotated with @ai so the model can read current energy consumption.
 * The svelteAIVitePlugin() transforms these @ai decorators into
 * module-level registrations on the global AIRegistry at build time.
 *
 * The @ai decorator syntax is non-standard TypeScript — the Vite plugin
 * strips it before the TypeScript compiler sees the output.
 * @ts-nocheck is used here to suppress TS errors on the decorator lines.
 */
// @ts-nocheck

// svelte-ignore state_referenced_locally
@ai({ access: 'r', description: 'Current total energy consumption in watts.' })
export let total_watts = $state(1240)

// svelte-ignore state_referenced_locally
@ai({ access: 'r', description: 'Peak consumption today in watts.' })
export let peak_today = $state(2100)
