import type { Plugin } from 'vite'
import { transformModuleFile, componentNameFromFilename } from './transform.js'

/**
 * Vite plugin for svelteAI.
 *
 * Processes @ai({...}) decorator annotations in .svelte.ts shared state files.
 * Emits module-level registration calls with SSR guards.
 *
 * Usage in vite.config.ts:
 *   import { svelteAIVitePlugin } from 'svelteai'
 *   export default defineConfig({ plugins: [svelteAIVitePlugin()] })
 */
export function svelteAIVitePlugin(): Plugin {
	return {
		name: 'svelteai-vite',
		enforce: 'pre',

		transform(code, id) {
			// Only process .svelte.ts files
			if (!id.endsWith('.svelte.ts')) return null

			const componentName = componentNameFromFilename(id)
			const result = transformModuleFile(code, componentName, id)
			if (!result.changed) return null

			return {
				code: result.code,
				map: null,
			}
		},
	}
}
