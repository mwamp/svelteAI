/**
 * Svelte context key used to propagate the current AINode down the component
 * tree. Each component reads this key to find its parent node, then creates
 * a child and writes the child back under the same key so its own children
 * can find it.
 *
 * Usage (emitted by the preprocessor):
 *   const __aiParent = getContext(AI_REGISTRY_KEY) ?? __globalAIRegistry
 *   const __aiNode = __aiParent.createChild('ComponentName')
 *   setContext(AI_REGISTRY_KEY, __aiNode)
 */
export const AI_REGISTRY_KEY = Symbol('svelteai.registry')
