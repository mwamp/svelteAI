/**
 * Hand-rolled key-value parser for @ai({...}) and @component({...}) decorator metadata.
 *
 * Handles flat objects only — no nested objects or arrays.
 * Supported value types:
 *   - Single-quoted strings: 'value'
 *   - Double-quoted strings: "value"
 *   - Bare identifiers: rw, r, true, false
 *
 * No eval, no new Function — pure string parsing, fully unit-testable.
 */

export interface DecoratorMeta {
	[key: string]: string
}

/**
 * Parsed decorator found in source.
 */
export interface ParsedDecorator {
	/** Full matched text including the decorator line (to be removed from source) */
	fullMatch: string
	/** Decorator type: 'ai' or 'component' */
	type: 'ai' | 'component'
	/** Parsed metadata key-value pairs */
	meta: DecoratorMeta
	/** Declaration keyword following the decorator: 'let', 'const', 'function', or null for @component */
	keyword: 'let' | 'const' | 'function' | null
	/** Name of the declared variable or function */
	name: string | null
	/** 'export ' if the declaration has an export modifier, otherwise '' */
	exportPrefix: string
	/** Index in source where the decorator starts */
	start: number
	/** Index in source where the decorator ends (exclusive, after the declaration line start) */
	end: number
}

/**
 * Parses a flat key-value object body string into a plain object.
 *
 * Input:  `access: 'rw', description: 'Current temperature.'`
 * Output: `{ access: 'rw', description: 'Current temperature.' }`
 *
 * Throws a descriptive error for malformed input.
 */
export function parseMetaBody(body: string): DecoratorMeta {
	const result: DecoratorMeta = {}
	let i = 0
	const len = body.length

	function skipWhitespace() {
		while (i < len && /\s/.test(body[i])) i++
	}

	function parseKey(): string {
		skipWhitespace()
		const start = i
		while (i < len && /[\w$]/.test(body[i])) i++
		if (i === start) {
			throw new Error(
				`parseMetaBody: expected key at position ${i}, got '${body.slice(i, i + 10)}'`,
			)
		}
		return body.slice(start, i)
	}

	function parseColon() {
		skipWhitespace()
		if (body[i] !== ':') {
			throw new Error(`parseMetaBody: expected ':' at position ${i}, got '${body[i]}'`)
		}
		i++
	}

	function parseValue(): string {
		skipWhitespace()
		const ch = body[i]

		if (ch === "'" || ch === '"') {
			// Quoted string
			const quote = ch
			i++ // skip opening quote
			let value = ''
			while (i < len) {
				if (body[i] === '\\' && i + 1 < len) {
					// Simple escape: include the next char literally
					i++
					value += body[i]
					i++
				} else if (body[i] === quote) {
					i++ // skip closing quote
					return value
				} else {
					value += body[i]
					i++
				}
			}
			throw new Error(`parseMetaBody: unterminated string starting with ${quote}`)
		}

		// Bare identifier (rw, r, true, false, number-like)
		const start = i
		while (i < len && /[\w.-]/.test(body[i])) i++
		if (i === start) {
			throw new Error(
				`parseMetaBody: expected value at position ${i}, got '${body.slice(i, i + 10)}'`,
			)
		}
		return body.slice(start, i)
	}

	function skipComma() {
		skipWhitespace()
		if (i < len && body[i] === ',') i++
	}

	while (i < len) {
		skipWhitespace()
		if (i >= len) break

		const key = parseKey()
		parseColon()
		const value = parseValue()
		result[key] = value
		skipComma()
	}

	return result
}

/**
 * Regex patterns for decorator detection.
 *
 * @ai pattern: matches `@ai({...})` followed by `let`, `const`, or `function` + name
 * @component pattern: matches `@component({...})` standalone
 *
 * Both patterns are multiline and handle optional whitespace.
 */
const AI_DECORATOR_RE =
	/@ai\s*\(\s*\{([^}]*)\}\s*\)\s*\n[ \t]*(export\s+)?(let|const|function)\s+(\w+)/g

const COMPONENT_DECORATOR_RE = /@component\s*\(\s*\{([^}]*)\}\s*\)/g

/**
 * Finds all @ai and @component decorators in a source string.
 * Returns them in source order.
 */
export function parseDecorators(source: string): ParsedDecorator[] {
	const results: ParsedDecorator[] = []

	// Reset regex state
	AI_DECORATOR_RE.lastIndex = 0
	COMPONENT_DECORATOR_RE.lastIndex = 0

	let match: RegExpExecArray | null

	// Find @ai decorators
	while ((match = AI_DECORATOR_RE.exec(source)) !== null) {
		const [fullMatch, metaBody, exportKw, keyword, name] = match
		let meta: DecoratorMeta
		try {
			meta = parseMetaBody(metaBody)
		} catch (e) {
			throw new Error(
				`svelteAI preprocessor: failed to parse @ai decorator for '${name}': ${(e as Error).message}`,
			)
		}
		results.push({
			fullMatch,
			type: 'ai',
			meta,
			keyword: keyword as 'let' | 'const' | 'function',
			name,
			exportPrefix: exportKw ?? '',
			start: match.index,
			end: match.index + fullMatch.length,
		})
	}

	// Find @component decorators
	while ((match = COMPONENT_DECORATOR_RE.exec(source)) !== null) {
		const [fullMatch, metaBody] = match
		let meta: DecoratorMeta
		try {
			meta = parseMetaBody(metaBody)
		} catch (e) {
			throw new Error(
				`svelteAI preprocessor: failed to parse @component decorator: ${(e as Error).message}`,
			)
		}
		results.push({
			fullMatch,
			type: 'component',
			meta,
			keyword: null,
			name: null,
			exportPrefix: '',
			start: match.index,
			end: match.index + fullMatch.length,
		})
	}

	// Sort by position in source
	results.sort((a, b) => a.start - b.start)

	return results
}
