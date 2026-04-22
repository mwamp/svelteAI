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
})
