import type { DecoratorMeta } from './parse.js'

export type FileType = 'svelte' | 'svelte.ts' | 'ts'

/**
 * Emits the boilerplate injected once at the top of a <script> block.
 * Sets up the parent/child AINode relationship via Svelte context.
 *
 * componentName is derived from the filename (e.g. ThermostatWidget).
 */
export function emitBoilerplate(componentName: string): string {
	return [
		`import { getContext as __getContext, setContext as __setContext } from 'svelte'`,
		`import { __globalAIRegistry, AI_REGISTRY_KEY } from 'svelteai'`,
		``,
		`const __aiParent = __getContext(AI_REGISTRY_KEY) ?? __globalAIRegistry`,
		`const __aiNode = __aiParent.createChild('${componentName}')`,
		`__setContext(AI_REGISTRY_KEY, __aiNode)`,
	].join('\n')
}

/**
 * Emits the boilerplate for a .svelte.ts module-level file.
 * Uses the global registry directly (no Svelte context).
 */
export function emitModuleBoilerplate(): string {
	return `import { __globalAIRegistry } from 'svelteai'`
}

/**
 * Emits a $effect block that registers a $state or $derived entry.
 *
 * @param name - variable name
 * @param meta - parsed decorator metadata
 * @param isReadOnly - true for $derived (no setValue)
 */
export function emitStateEffect(name: string, meta: DecoratorMeta, isReadOnly: boolean): string {
	const access = meta.access ?? (isReadOnly ? 'r' : 'rw')
	const description = meta.description ?? ''
	const lines: string[] = [
		`$effect(() => {`,
		`\tconst __e = __aiNode.register({`,
		`\t\tname: '${name}',`,
		`\t\taccess: '${access}',`,
		`\t\tdescription: '${escapeString(description)}',`,
		`\t\tgetValue: () => ${name},`,
	]
	if (!isReadOnly) {
		lines.push(`\t\tsetValue: (v) => { ${name} = v as typeof ${name} },`)
	}
	lines.push(`\t})`)
	lines.push(`\treturn () => __aiNode.unregister(__e)`)
	lines.push(`})`)
	return lines.join('\n')
}

/**
 * Emits a $effect block that registers a function as an action.
 *
 * @param name - function name
 * @param meta - parsed decorator metadata
 */
export function emitActionEffect(name: string, meta: DecoratorMeta): string {
	const description = meta.description ?? ''
	return [
		`$effect(() => {`,
		`\tconst __e = __aiNode.registerAction({`,
		`\t\tname: '${name}',`,
		`\t\tdescription: '${escapeString(description)}',`,
		`\t\tcall: (...args: unknown[]) => ${name}(...(args as Parameters<typeof ${name}>)),`,
		`\t})`,
		`\treturn () => __aiNode.unregisterAction(__e)`,
		`})`,
	].join('\n')
}

/**
 * Emits the node cleanup $effect (appended once after all entry effects).
 */
export function emitDestroyEffect(): string {
	return [`$effect(() => {`, `\treturn () => __aiNode.destroy()`, `})`].join('\n')
}

/**
 * Emits a registerComponentType call for @component decorators.
 * Used in <script module> blocks.
 *
 * @param componentName - inferred from filename
 * @param meta - parsed decorator metadata
 */
export function emitComponentTypeRegistration(
	componentName: string,
	meta: DecoratorMeta,
): string {
	const description = meta.description ?? ''
	return [
		`__globalAIRegistry_module.registerComponentType({`,
		`\tname: '${componentName}',`,
		`\tdescription: '${escapeString(description)}',`,
		`})`,
	].join('\n')
}

/**
 * Emits a module-level registration for .svelte.ts shared state.
 * Wrapped in an SSR guard.
 *
 * @param name - variable name
 * @param meta - parsed decorator metadata
 * @param isReadOnly - true if no setter should be emitted
 */
export function emitModuleStateRegistration(
	name: string,
	meta: DecoratorMeta,
	isReadOnly: boolean,
): string {
	const access = meta.access ?? (isReadOnly ? 'r' : 'rw')
	const description = meta.description ?? ''
	const lines: string[] = [
		`if (typeof window !== 'undefined') {`,
		`\t__globalAIRegistry.register({`,
		`\t\tname: '${name}',`,
		`\t\taccess: '${access}',`,
		`\t\tdescription: '${escapeString(description)}',`,
		`\t\tgetValue: () => ${name},`,
	]
	if (!isReadOnly) {
		// Module-level exported $state cannot be reassigned (Svelte 5 constraint).
		// Mutate via Object.assign so the binding is never replaced.
		// The developer must use an object shape for mutable module state.
		lines.push(`\t\tsetValue: (v) => { Object.assign(${name}, v) },`)
	}
	lines.push(`\t})`)
	lines.push(`}`)
	return lines.join('\n')
}

function escapeString(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
}
