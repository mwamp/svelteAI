import { AIRegistry } from '../registry/AIRegistry.js'

/**
 * Internal singleton registry shared across the entire app.
 *
 * - Component instances use Svelte context (AI_REGISTRY_KEY) to build the
 *   tree; the root of that tree is this registry.
 * - Module-level .svelte.ts shared state registers directly on this object.
 * - The SvelteAI facade reads from this registry.
 *
 * Not exported from the public index — only the preprocessor-emitted boilerplate
 * and the SvelteAI facade import this directly.
 */
export const __globalAIRegistry = new AIRegistry()
