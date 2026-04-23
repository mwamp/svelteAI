import type { PreprocessorGroup } from 'svelte/compiler'
import { transformScriptBlock, componentNameFromFilename } from './transform.ts'

/**
 * Matches a full @ai({...}) or @component({...}) decorator line.
 * Used in the script hook fallback to strip decorators from unchanged blocks.
 */
const DECORATOR_LINE_RE = /^[ \t]*@(?:ai|component)\s*\(\s*\{[^}]*\}\s*\)[ \t]*$/gm

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
			if (!filename || !filename.endsWith('.svelte')) return { code: content }

			const componentName = componentNameFromFilename(filename)
			const isModule = attributes.context === 'module' || 'module' in attributes

			const result = transformScriptBlock(content, componentName, isModule, 'svelte')
			if (!result.changed) {
				// Strip any decorator lines so the Svelte compiler never sees them.
				DECORATOR_LINE_RE.lastIndex = 0
				if (!DECORATOR_LINE_RE.test(content)) return { code: content }
				DECORATOR_LINE_RE.lastIndex = 0
				return { code: content.replace(DECORATOR_LINE_RE, '') }
			}
			return { code: result.code }
		},
	}
}
