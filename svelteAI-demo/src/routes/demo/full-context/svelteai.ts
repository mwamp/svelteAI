import { SvelteAI } from 'svelteai'

/**
 * Shared SvelteAI instance for the full-context demo.
 * Wraps the global registry and exposes getContext(), tools, etc.
 */
export const svelteAI = new SvelteAI()
