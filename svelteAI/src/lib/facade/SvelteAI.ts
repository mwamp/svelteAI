import { AIRegistry } from '../registry/AIRegistry.js'
import { __globalAIRegistry } from '../runtime/globalRegistry.js'
import type {
	AIChangeEvent,
	AIComponentTypeSnapshot,
	AINodeSnapshot,
	AISnapshot,
} from '../registry/types.js'
import { makeTools } from './tools.ts'

export interface SvelteAIConfig {
	// Reserved for future adapter configuration
}

export class SvelteAI {
	private _registry: AIRegistry

	readonly tools: ReturnType<typeof makeTools>

	constructor(_config?: SvelteAIConfig) {
		this._registry = __globalAIRegistry
		this.tools = makeTools(this)
	}

	// ── Read ──────────────────────────────────────────────────────────────────

	/**
	 * Returns a formatted string suitable for injection into an LLM system
	 * prompt. Lists all mounted component instances with their state values,
	 * followed by global (root-level) state.
	 *
	 * Example output:
	 *   App state:
	 *
	 *   [ThermostatWidget:a3f2]
	 *     A thermostat control for a single room.
	 *     room_name (r): 'bedroom'
	 *     temperature (rw): 22
	 */
	getContext(): string {
		const snapshot = this._registry.getSnapshot()
		const lines: string[] = ['App state:']

		// Component instances (non-root nodes)
		const nodes = this._registry.getNodes()
		if (nodes.length > 0) {
			for (const node of nodes) {
				if (node.entries.length === 0 && node.actions.length === 0) continue
				lines.push('')
				lines.push(`[${node.id}]`)

				// Component description from type catalogue
				const typeName = node.name
				const typeDesc = snapshot.componentTypes.find((t) => t.name === typeName)?.description
				if (typeDesc) lines.push(`  ${typeDesc}`)

				for (const entry of node.entries) {
					const val = typeof entry.value === 'string' ? `'${entry.value}'` : String(entry.value)
					lines.push(`  ${entry.name} (${entry.access}): ${val}`)
				}
				for (const action of node.actions) {
					lines.push(`  ${action.name}() — ${action.description}`)
				}
			}
		}

		// Root-level (global) entries
		const rootEntries = snapshot.tree.entries
		if (rootEntries.length > 0) {
			lines.push('')
			lines.push('Global state:')
			for (const entry of rootEntries) {
				const val = typeof entry.value === 'string' ? `'${entry.value}'` : String(entry.value)
				lines.push(`  ${entry.name} (${entry.access}): ${val}`)
			}
		}

		return lines.join('\n')
	}

	/**
	 * Returns a flat dotted-path map of all entry values.
	 * Root entries: `entryName`
	 * Component instance entries: `ComponentName:shortId.entryName`
	 */
	getState(): Record<string, unknown> {
		return this._registry.getState()
	}

	/** Returns the full nested tree snapshot with resolved values. */
	getSnapshot(): AISnapshot {
		return this._registry.getSnapshot()
	}

	/** Returns a flat list of all mounted component instance nodes (BFS order). */
	getNodes(): AINodeSnapshot[] {
		return this._registry.getNodes()
	}

	/** Filters mounted nodes by component name. */
	findComponent(name: string): AINodeSnapshot[] {
		return this._registry.getNodes().filter((n) => n.name === name)
	}

	/** Formats a list of nodes as plain objects for model consumption. */
	describeNodes(nodes: AINodeSnapshot[]): object[] {
		return nodes.map((n) => ({
			id: n.id,
			name: n.name,
			entries: n.entries.map((e) => ({ name: e.name, access: e.access, value: e.value })),
			actions: n.actions.map((a) => ({ name: a.name, description: a.description })),
		}))
	}

	/** Returns all registered component types. */
	getComponentTypes(): AIComponentTypeSnapshot[] {
		return this._registry.getComponentTypes()
	}

	// ── Write ─────────────────────────────────────────────────────────────────

	/**
	 * Sets one or more entry values by dotted path.
	 * Path format: `ComponentName:shortId.entryName` or `entryName` for root.
	 * Throws if the path is not found or the entry is read-only.
	 */
	setState(updates: Record<string, unknown>): void {
		for (const [path, value] of Object.entries(updates)) {
			const entry = this._resolveEntry(path)
			if (!entry) throw new Error(`svelteAI.setState: path not found — '${path}'`)
			if (entry.access !== 'rw') throw new Error(`svelteAI.setState: '${path}' is read-only`)
			if (!entry.setValue) throw new Error(`svelteAI.setState: '${path}' has no setter`)
			entry.setValue(value)
		}
	}

	/**
	 * Calls a registered action by dotted path.
	 * Path format: `ComponentName:shortId.actionName` or `actionName` for root.
	 * Throws if the path is not found.
	 */
	async callAction(path: string, args: Record<string, unknown> = {}): Promise<unknown> {
		const action = this._resolveAction(path)
		if (!action) throw new Error(`svelteAI.callAction: path not found — '${path}'`)
		return action.call(args)
	}

	// ── Change notification (stub) ────────────────────────────────────────────

	/** Not implemented in Phase 1. */
	subscribe(_callback: (event: AIChangeEvent) => void): () => void {
		throw new Error('svelteAI.subscribe: not implemented')
	}

	// ── Path resolution helpers ───────────────────────────────────────────────

	private _resolveEntry(path: string) {
		const dot = path.lastIndexOf('.')
		if (dot === -1) {
			// Root-level entry
			return this._registry.getTree().entries.find((e) => e.name === path) ?? null
		}
		const nodeId = path.slice(0, dot)
		const entryName = path.slice(dot + 1)
		const node = this._findNodeById(nodeId)
		return node?.entries.find((e) => e.name === entryName) ?? null
	}

	private _resolveAction(path: string) {
		const dot = path.lastIndexOf('.')
		if (dot === -1) {
			return this._registry.getTree().actions.find((a) => a.name === path) ?? null
		}
		const nodeId = path.slice(0, dot)
		const actionName = path.slice(dot + 1)
		const node = this._findNodeById(nodeId)
		return node?.actions.find((a) => a.name === actionName) ?? null
	}

	private _findNodeById(id: string) {
		const queue = [...this._registry.getTree().children]
		while (queue.length > 0) {
			const node = queue.shift()!
			if (node.id === id) return node
			queue.push(...node.children)
		}
		return null
	}
}
