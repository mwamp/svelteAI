import { parseDecorators } from './parse.ts'
import {
	emitBoilerplate,
	emitModuleBoilerplate,
	emitStateEffect,
	emitActionEffect,
	emitDestroyEffect,
	emitComponentTypeRegistration,
	emitModuleStateRegistration,
	type FileType,
} from './emit.ts'
import path from 'node:path'

/**
 * Derives the component name from a filename.
 * e.g. '/path/to/ThermostatWidget.svelte' → 'ThermostatWidget'
 *      '/path/to/energy.svelte.ts'        → 'energy'
 */
export function componentNameFromFilename(filename: string): string {
	const base = path.basename(filename)
	// Strip known extensions
	return base.replace(/\.svelte\.ts$/, '').replace(/\.svelte$/, '').replace(/\.ts$/, '')
}

/**
 * Transforms a .svelte file source.
 *
 * - Processes <script module> for @component decorators
 * - Processes <script> for @ai decorators on $state, $derived, function
 * - Returns the modified source (or the original if no decorators found)
 *
 * This function is called by the Svelte preprocessor's `script` hook,
 * which receives the script block content separately from the template.
 * We therefore expose two entry points:
 *   - transformScriptBlock() for the preprocessor (receives script content only)
 *   - transform() for testing (receives full .svelte source)
 */

export interface TransformResult {
	code: string
	/** true if any transformation was applied */
	changed: boolean
}

/**
 * Transforms a single script block (content only, no <script> tags).
 *
 * @param content - the script block content
 * @param componentName - derived from filename
 * @param isModule - true if this is a <script module> block
 * @param fileType - 'svelte' for .svelte files
 */
export function transformScriptBlock(
	content: string,
	componentName: string,
	isModule: boolean,
	fileType: FileType,
): TransformResult {
	const decorators = parseDecorators(content)
	if (decorators.length === 0) return { code: content, changed: false }

	let result = content
	const effectLines: string[] = []
	let hasAiDecorators = false
	let hasComponentDecorator = false
	const componentTypeLines: string[] = []

	// Process decorators in reverse order so that splice positions remain valid
	const sorted = [...decorators].sort((a, b) => b.start - a.start)

	for (const dec of sorted) {
		if (dec.type === 'component') {
			hasComponentDecorator = true
			// Remove the @component({...}) line from source
			result = result.slice(0, dec.start) + result.slice(dec.end)
			componentTypeLines.unshift(emitComponentTypeRegistration(componentName, dec.meta))
		} else if (dec.type === 'ai') {
			hasAiDecorators = true
			// Determine if this is a read-only declaration ($derived or access:'r')
			const isReadOnly =
				dec.meta.access === 'r' ||
				(dec.meta.access === undefined && dec.keyword !== 'function')

			// Remove the @ai({...})\n decorator line from source
			// The decorator line ends just before the export/keyword — we remove up to and including the newline
			const decoratorLineEnd =
				dec.end -
				(dec.name?.length ?? 0) -
				(dec.keyword?.length ?? 0) -
				1 - // space between keyword and name
				dec.exportPrefix.length
			result = result.slice(0, dec.start) + result.slice(decoratorLineEnd)

			// Collect effect to append after all removals
			if (dec.keyword === 'function' || dec.keyword === 'async function') {
				effectLines.unshift(emitActionEffect(dec.name!, dec.meta))
			} else {
				effectLines.unshift(emitStateEffect(dec.name!, dec.meta, isReadOnly))
			}
		}
	}

	// Append component type registrations (for <script module>)
	if (componentTypeLines.length > 0) {
		const importLine = `import { __globalAIRegistry as __globalAIRegistry_module } from 'svelteai'`
		result = `${importLine}\n${componentTypeLines.join('\n')}\n${result}`
	}

	// Append boilerplate + effects (for <script> instance block)
	if (hasAiDecorators && !isModule) {
		const boilerplate = emitBoilerplate(componentName)
		const effects = effectLines.join('\n\n')
		const destroyEffect = emitDestroyEffect()
		result = `${boilerplate}\n\n${result}\n\n${effects}\n\n${destroyEffect}`
	}

	return { code: result, changed: hasAiDecorators || hasComponentDecorator }
}

/**
 * Returns true if the $state initialiser after the declaration is an object literal.
 * Looks for `$state(` followed (ignoring whitespace) by `{`.
 * Used to validate that rw module state uses an object shape.
 */
function isObjectStateInitialiser(source: string, declarationEnd: number): boolean {
	const after = source.slice(declarationEnd)
	const stateMatch = /\$state\s*\(/.exec(after)
	if (!stateMatch) return false
	const afterParen = after.slice(stateMatch.index + stateMatch[0].length).trimStart()
	return afterParen.startsWith('{')
}

/**
 * Transforms a .svelte.ts or plain .ts file.
 * Module-level registration with SSR guard, no $effect.
 */
export function transformModuleFile(
	content: string,
	_componentName: string,
	filename?: string,
): TransformResult {
	const decorators = parseDecorators(content)
	if (decorators.length === 0) return { code: content, changed: false }

	let result = content
	const registrationLines: string[] = []

	const sorted = [...decorators].sort((a, b) => b.start - a.start)

	for (const dec of sorted) {
		if (dec.type === 'ai' && dec.name) {
			const isReadOnly = dec.meta.access === 'r'

			// Validate: rw module state must use an object shape
			if (!isReadOnly && (dec.keyword === 'let' || dec.keyword === 'const')) {
				if (!isObjectStateInitialiser(content, dec.end)) {
					const file = filename ? ` in ${filename}` : ''
					throw new Error(
						`[svelteai]${file}: @ai({ access: 'rw' }) on '${dec.name}' — ` +
							`module-level rw state must use an object shape.\n` +
							`Svelte 5 forbids reassigning exported $state bindings.\n` +
							`Fix: export let ${dec.name} = $state({ value: <your value> })`,
					)
				}
			}
			// Remove decorator line
			const decoratorLineEnd =
				dec.end -
				dec.name.length -
				(dec.keyword?.length ?? 0) -
				1 - // space between keyword and name
				dec.exportPrefix.length
			result = result.slice(0, dec.start) + result.slice(decoratorLineEnd)
			registrationLines.unshift(emitModuleStateRegistration(dec.name, dec.meta, isReadOnly))
		}
	}

	if (registrationLines.length > 0) {
		const boilerplate = emitModuleBoilerplate()
		result = `${boilerplate}\n\n${result}\n\n${registrationLines.join('\n\n')}`
	}

	return { code: result, changed: registrationLines.length > 0 }
}
