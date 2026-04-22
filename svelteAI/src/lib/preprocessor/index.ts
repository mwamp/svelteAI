import type { PreprocessorGroup } from 'svelte/compiler'
import { transformScriptBlock, componentNameFromFilename } from './transform.ts'

/**
 * Svelte preprocessor for svelteAI.
 *
 * Processes @ai({...}) and @component({...}) decorator annotations in .svelte files.
 * Must run before the Svelte compiler sees the source.
 *
 * Usage in svelte.config.js:
 *   import { svelteAIPreprocess } from 'svelteai'
 *   export default { preprocess: [svelteAIPreprocess()] }
 */
export function svelteAIPreprocess(): PreprocessorGroup {
	return {
		name: 'svelteai',

		script({ content, filename, attributes }) {
			if (!filename) return { code: content }

			const componentName = componentNameFromFilename(filename)
			const isModule = attributes.context === 'module' || 'module' in attributes

			const result = transformScriptBlock(content, componentName, isModule, 'svelte')
			if (!result.changed) return { code: content }
			return { code: result.code }
		},
	}
}
