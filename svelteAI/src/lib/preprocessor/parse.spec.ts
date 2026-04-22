import { describe, it, expect } from 'vitest'
import { parseMetaBody, parseDecorators } from './parse.js'

// ── parseMetaBody ─────────────────────────────────────────────────────────────

describe('parseMetaBody', () => {
	it('parses a single-quoted string value', () => {
		expect(parseMetaBody("description: 'hello world'")).toEqual({
			description: 'hello world',
		})
	})

	it('parses a double-quoted string value', () => {
		expect(parseMetaBody('description: "hello world"')).toEqual({
			description: 'hello world',
		})
	})

	it('parses a bare identifier value', () => {
		expect(parseMetaBody('access: rw')).toEqual({ access: 'rw' })
	})

	it('parses multiple keys', () => {
		expect(parseMetaBody("access: 'rw', description: 'Current temperature.'")).toEqual({
			access: 'rw',
			description: 'Current temperature.',
		})
	})

	it('handles extra whitespace around keys and values', () => {
		expect(parseMetaBody("  access :  'r'  ,  description :  'foo'  ")).toEqual({
			access: 'r',
			description: 'foo',
		})
	})

	it('handles bare identifiers: true, false', () => {
		expect(parseMetaBody('required: true, optional: false')).toEqual({
			required: 'true',
			optional: 'false',
		})
	})

	it('handles a trailing comma', () => {
		expect(parseMetaBody("access: 'rw',")).toEqual({ access: 'rw' })
	})

	it('handles an empty body', () => {
		expect(parseMetaBody('')).toEqual({})
	})

	it('handles whitespace-only body', () => {
		expect(parseMetaBody('   ')).toEqual({})
	})

	it('handles escaped single quote inside single-quoted string', () => {
		expect(parseMetaBody("description: 'it\\'s hot'")).toEqual({
			description: "it's hot",
		})
	})

	it('handles a comma inside a quoted string value', () => {
		expect(parseMetaBody("description: 'one, two, three'")).toEqual({
			description: 'one, two, three',
		})
	})

	it('handles a colon inside a quoted string value', () => {
		expect(parseMetaBody("description: 'ratio: 1:2'")).toEqual({
			description: 'ratio: 1:2',
		})
	})

	it('handles a newline inside a quoted string value', () => {
		expect(parseMetaBody("description: 'line one\nline two'")).toEqual({
			description: 'line one\nline two',
		})
	})

	it('handles an empty quoted string value', () => {
		expect(parseMetaBody("description: ''")).toEqual({ description: '' })
	})

	it('handles a numeric-like bare identifier value', () => {
		expect(parseMetaBody('min: 16')).toEqual({ min: '16' })
	})

	it('handles multiple keys with mixed value types', () => {
		expect(parseMetaBody("access: rw, min: 16, description: 'Temp in C.'")).toEqual({
			access: 'rw',
			min: '16',
			description: 'Temp in C.',
		})
	})

	it('throws on missing colon', () => {
		expect(() => parseMetaBody('access rw')).toThrow()
	})

	it('throws on unterminated single-quoted string', () => {
		expect(() => parseMetaBody("description: 'unterminated")).toThrow(/unterminated/)
	})

	it('throws on unterminated double-quoted string', () => {
		expect(() => parseMetaBody('description: "unterminated')).toThrow(/unterminated/)
	})

	it('throws on missing value', () => {
		expect(() => parseMetaBody('access: ')).toThrow()
	})
})

// ── parseDecorators ───────────────────────────────────────────────────────────

describe('parseDecorators', () => {
	it('finds a single @ai decorator on a let declaration', () => {
		const source = `@ai({ access: 'rw', description: 'Temperature.' })\nlet temperature = $state(22)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('ai')
		expect(result[0].keyword).toBe('let')
		expect(result[0].name).toBe('temperature')
		expect(result[0].exportPrefix).toBe('')
		expect(result[0].meta).toEqual({ access: 'rw', description: 'Temperature.' })
	})

	it('finds a single @ai decorator on a function declaration', () => {
		const source = `@ai({ description: 'Reset.' })\nfunction reset() {}`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].keyword).toBe('function')
		expect(result[0].name).toBe('reset')
		expect(result[0].exportPrefix).toBe('')
	})

	it('finds a single @ai decorator on an async function declaration', () => {
		const source = `@ai({ description: 'Submit guess.' })\nasync function enterGuess() {}`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].keyword).toBe('async function')
		expect(result[0].name).toBe('enterGuess')
		expect(result[0].exportPrefix).toBe('')
		expect(result[0].meta).toEqual({ description: 'Submit guess.' })
	})

	it('finds a single @ai decorator on an export async function declaration', () => {
		const source = `@ai({ description: 'Fetch data.' })\nexport async function fetchData() {}`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].keyword).toBe('async function')
		expect(result[0].name).toBe('fetchData')
		expect(result[0].exportPrefix).toBe('export ')
	})

	it('treats async function as an action (not a state entry)', () => {
		const source = `@ai({ description: 'Do something async.' })\nasync function doSomething() {}`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		// async function should be treated as an action, same as function
		expect(result[0].keyword).toBe('async function')
	})

	it('finds a single @ai decorator on an export let declaration', () => {
		const source = `@ai({ access: 'r', description: 'Watts.' })\nexport let total_watts = $state(1240)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('ai')
		expect(result[0].keyword).toBe('let')
		expect(result[0].name).toBe('total_watts')
		expect(result[0].exportPrefix).toBe('export ')
		expect(result[0].meta).toEqual({ access: 'r', description: 'Watts.' })
	})

	it('finds a single @ai decorator on an export const declaration', () => {
		const source = `@ai({ access: 'r', description: 'Max.' })\nexport const max_power = $derived(peak * 1.1)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].keyword).toBe('const')
		expect(result[0].name).toBe('max_power')
		expect(result[0].exportPrefix).toBe('export ')
	})

	it('finds a single @ai decorator on an export function declaration', () => {
		const source = `@ai({ description: 'Reset all.' })\nexport function resetAll() {}`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].keyword).toBe('function')
		expect(result[0].name).toBe('resetAll')
		expect(result[0].exportPrefix).toBe('export ')
	})

	it('finds a @component decorator', () => {
		const source = `@component({ description: 'A thermostat widget.' })`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('component')
		expect(result[0].keyword).toBeNull()
		expect(result[0].name).toBeNull()
		expect(result[0].meta).toEqual({ description: 'A thermostat widget.' })
	})

	it('finds multiple @ai decorators in order', () => {
		const source = [
			`@ai({ access: 'r', description: 'Room name.' })`,
			`let room_name = $derived(room.name)`,
			``,
			`@ai({ access: 'rw', description: 'Temperature.' })`,
			`let temperature = $state(22)`,
		].join('\n')
		const result = parseDecorators(source)
		expect(result).toHaveLength(2)
		expect(result[0].name).toBe('room_name')
		expect(result[1].name).toBe('temperature')
	})

	it('returns empty array when no decorators present', () => {
		const source = `let temperature = $state(22)`
		expect(parseDecorators(source)).toHaveLength(0)
	})

	it('returns decorators sorted by source position', () => {
		const source = [
			`@component({ description: 'Widget.' })`,
			``,
			`@ai({ access: 'rw', description: 'Temp.' })`,
			`let temperature = $state(22)`,
		].join('\n')
		const result = parseDecorators(source)
		expect(result[0].type).toBe('component')
		expect(result[1].type).toBe('ai')
	})

	it('handles an @ai decorator with an empty metadata object', () => {
		const source = `@ai({})\nlet value = $state(0)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].meta).toEqual({})
		expect(result[0].name).toBe('value')
	})

	it('handles variable names with underscores and numbers', () => {
		const source = `@ai({ access: 'r', description: 'Peak.' })\nlet peak_today_2 = $state(0)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].name).toBe('peak_today_2')
	})

	it('handles an indented @ai decorator (tabs before @ai)', () => {
		const source = `\t@ai({ access: 'rw', description: 'Temp.' })\n\tlet temperature = $state(22)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].name).toBe('temperature')
	})

	it('does not match @ai inside a line comment', () => {
		const source = `// @ai({ access: 'rw', description: 'Temp.' })\nlet temperature = $state(22)`
		const result = parseDecorators(source)
		expect(result).toHaveLength(0)
	})

	it('handles adjacent @ai decorators with no blank line between', () => {
		const source = [
			`@ai({ access: 'r', description: 'Name.' })`,
			`let room_name = $derived(room.name)`,
			`@ai({ access: 'rw', description: 'Temp.' })`,
			`let temperature = $state(22)`,
		].join('\n')
		const result = parseDecorators(source)
		expect(result).toHaveLength(2)
		expect(result[0].name).toBe('room_name')
		expect(result[1].name).toBe('temperature')
	})

	it('handles a description with a comma inside quotes in @ai decorator', () => {
		const source = `@ai({ access: 'rw', description: 'One of: heat, cool, auto.' })\nlet mode = $state('heat')`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].meta.description).toBe('One of: heat, cool, auto.')
		expect(result[0].name).toBe('mode')
	})

	it('handles @component with no description key', () => {
		const source = `@component({})`
		const result = parseDecorators(source)
		expect(result).toHaveLength(1)
		expect(result[0].type).toBe('component')
		expect(result[0].meta).toEqual({})
	})
})
