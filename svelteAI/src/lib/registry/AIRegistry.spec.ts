import { describe, it, expect, beforeEach } from 'vitest'
import { AIRegistry } from './AIRegistry.js'

describe('AIRegistry', () => {
	let registry: AIRegistry

	beforeEach(() => {
		registry = new AIRegistry()
	})

	// ── Component type catalogue ──────────────────────────────────────────────

	it('registers and retrieves component types', () => {
		registry.registerComponentType({ name: 'ThermostatWidget', description: 'A thermostat.' })
		const types = registry.getComponentTypes()
		expect(types).toHaveLength(1)
		expect(types[0]).toEqual({ name: 'ThermostatWidget', description: 'A thermostat.' })
	})

	it('overwrites a component type with the same name', () => {
		registry.registerComponentType({ name: 'Widget', description: 'v1' })
		registry.registerComponentType({ name: 'Widget', description: 'v2' })
		const types = registry.getComponentTypes()
		expect(types).toHaveLength(1)
		expect(types[0].description).toBe('v2')
	})

	// ── Root-level entry registration ─────────────────────────────────────────

	it('registers and unregisters a root entry', () => {
		let val = 42
		const entry = registry.register({
			name: 'total_watts',
			access: 'r',
			description: 'Total watts.',
			getValue: () => val,
		})
		expect(registry.getTree().entries).toHaveLength(1)
		registry.unregister(entry)
		expect(registry.getTree().entries).toHaveLength(0)
	})

	it('resolves getValue at snapshot time', () => {
		let val = 10
		registry.register({
			name: 'counter',
			access: 'rw',
			description: 'A counter.',
			getValue: () => val,
			setValue: (v) => { val = v as number },
		})
		val = 99
		const snap = registry.getSnapshot()
		expect(snap.tree.entries[0].value).toBe(99)
	})

	// ── Instance tree ─────────────────────────────────────────────────────────

	it('creates child nodes and lists them in getNodes()', () => {
		const child = registry.createChild('ThermostatWidget')
		let temp = 22
		child.register({
			name: 'temperature',
			access: 'rw',
			description: 'Temperature.',
			getValue: () => temp,
			setValue: (v) => { temp = v as number },
		})
		const nodes = registry.getNodes()
		expect(nodes).toHaveLength(1)
		expect(nodes[0].name).toBe('ThermostatWidget')
		expect(nodes[0].entries[0].value).toBe(22)
	})

	it('removes a child node after destroy()', () => {
		const child = registry.createChild('Widget')
		expect(registry.getNodes()).toHaveLength(1)
		child.destroy()
		expect(registry.getNodes()).toHaveLength(0)
	})

	// ── getState() flat map ───────────────────────────────────────────────────

	it('builds a flat dotted-path state map', () => {
		let watts = 1240
		registry.register({
			name: 'total_watts',
			access: 'r',
			description: 'Watts.',
			getValue: () => watts,
		})
		const child = registry.createChild('ThermostatWidget')
		let temp = 22
		child.register({
			name: 'temperature',
			access: 'rw',
			description: 'Temp.',
			getValue: () => temp,
			setValue: (v) => { temp = v as number },
		})
		const state = registry.getState()
		expect(state['total_watts']).toBe(1240)
		// child id is dynamic — just check that some key ends with .temperature
		const tempKey = Object.keys(state).find((k) => k.endsWith('.temperature'))
		expect(tempKey).toBeDefined()
		expect(state[tempKey!]).toBe(22)
	})

	// ── getSnapshot() ─────────────────────────────────────────────────────────

	it('returns a full snapshot with component types and tree', () => {
		registry.registerComponentType({ name: 'Widget', description: 'A widget.' })
		const snap = registry.getSnapshot()
		expect(snap.componentTypes).toHaveLength(1)
		expect(snap.tree.name).toBe('__root__')
	})

	// ── Action registration ───────────────────────────────────────────────────

	it('registers and unregisters a root action', () => {
		const action = registry.registerAction({
			name: 'reset',
			description: 'Reset.',
			call: () => 'done',
		})
		expect(registry.getTree().actions).toHaveLength(1)
		registry.unregisterAction(action)
		expect(registry.getTree().actions).toHaveLength(0)
	})
})
