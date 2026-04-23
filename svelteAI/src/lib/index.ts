// Public API for the svelteAI library

// Facade — user-facing class
export { SvelteAI } from './facade/SvelteAI.ts'
export type { SvelteAIConfig, PromptRouteMapOptions } from './facade/SvelteAI.ts'

// Route registry helpers
export { buildRouteRegistry, matchRoute, derivePath } from './facade/routes.js'

// Registry types — for consumers who want to type their own code
export type {
	AIEntry,
	AIEntryInit,
	AIAction,
	AIActionInit,
	AIParamSchema,
	AIComponentType,
	AINodeInterface,
	AISnapshot,
	AIComponentTypeSnapshot,
	AINodeSnapshot,
	AIEntrySnapshot,
	AIActionSnapshot,
	AIChangeEvent,
	RouteRecord,
	RouteParamSchema,
} from './registry/types.js'

// Preprocessor exports (Svelte preprocessor + Vite plugin)
export { svelteAIPreprocess } from './preprocessor/index.js'
export { svelteAIVitePlugin } from './preprocessor/vite.js'

// Context key — needed by the preprocessor-emitted boilerplate at runtime
export { AI_REGISTRY_KEY } from './registry/context.js'

// Internal runtime — exported for preprocessor-emitted boilerplate only
// (not intended for direct use by library consumers)
export { __globalAIRegistry } from './runtime/globalRegistry.js'
