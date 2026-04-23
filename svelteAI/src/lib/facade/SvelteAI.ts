import { AIRegistry } from '../registry/AIRegistry.js'
import { __globalAIRegistry } from '../runtime/globalRegistry.js'
import type {
	AIChangeEvent,
	AIComponentTypeSnapshot,
	AINodeSnapshot,
	AISnapshot,
	RouteRecord,
} from '../registry/types.js'
import { makeTools } from './tools.ts'
import { matchRoute } from './routes.js'

/**
 * Formats an entry value for display in getContext() output.
 * Strings are single-quoted. Objects/arrays are JSON-serialised.
 * Primitives use String().
 */
function formatEntryValue(value: unknown): string {
	if (typeof value === 'string') return `'${value}'`
	if (value !== null && typeof value === 'object') {
		try {
			return JSON.stringify(value)
		} catch {
			return String(value)
		}
	}
	return String(value)
}

export interface SvelteAIConfig {
	routes?: RouteRecord[]
	/** Returns the current URL pathname. Called on every getContext() invocation. */
	getPath?: () => string
}

export class SvelteAI {
	private _registry: AIRegistry
	private _routes: RouteRecord[]
	private _getPath: (() => string) | undefined

	readonly tools: ReturnType<typeof makeTools>

	constructor(config?: SvelteAIConfig) {
		this._registry = __globalAIRegistry
		this._routes = config?.routes ?? []
		this._getPath = config?.getPath
		this.tools = makeTools(this)
	}

	// ── Read ──────────────────────────────────────────────────────────────────

	/**
	 * Returns a formatted string suitable for injection into an LLM system
	 * prompt. Includes:
	 * - Current page block (if getPath + routes are configured)
	 * - Component instance state
	 * - Global state
	 * - Available pages list (if routes are configured)
	 *
	 * Example output:
	 *   Current page: /demo/local-context/thermostats
	 *     Thermostat controls
	 *
	 *   App state:
	 *
	 *   [ThermostatWidget:a3f2]
	 *     A thermostat control for a single room.
	 *     room_name (r): 'bedroom'
	 *     temperature (rw): 22
	 *
	 *   Available pages:
	 *     [0] /demo/local-context — Smart home demo overview
	 *   * [1] /demo/local-context/thermostats — Thermostat controls
	 *     [2] /demo/local-context/energy — Energy consumption
	 */
	getContext(): string {
		const snapshot = this._registry.getSnapshot()
		const lines: string[] = []

		// ── Current page block ────────────────────────────────────────────────
		if (this._getPath) {
			const pathname = this._getPath()
			const match = this._routes.length > 0 ? matchRoute(pathname, this._routes) : null

			if (match) {
				lines.push(`Current page: ${pathname}`)
				lines.push(`  ${match.record.short}`)
				if (match.record.long) lines.push(`  ${match.record.long}`)
				const paramEntries = Object.entries(match.params)
				if (paramEntries.length > 0) {
					for (const [key, val] of paramEntries) {
						lines.push(`  ${key} = ${val}`)
					}
				}
			} else {
				lines.push(`Current page: ${pathname}  [not in route registry]`)
			}
			lines.push('')
		}

		// ── App state ─────────────────────────────────────────────────────────
		lines.push('App state:')

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
						const val = formatEntryValue(entry.value)
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
				const val = formatEntryValue(entry.value)
				lines.push(`  ${entry.name} (${entry.access}): ${val}`)
			}
		}

		// ── Available pages ───────────────────────────────────────────────────
		if (this._routes.length > 0) {
			lines.push('')
			lines.push('Available pages:')

			const activePath = this._getPath ? this._getPath() : null
			const activeMatch = activePath ? matchRoute(activePath, this._routes) : null
			const activeIndex = activeMatch?.record.index ?? -1

			for (const route of this._routes) {
				const prefix = route.index === activeIndex ? '* ' : '  '
				const paramHint =
					route.params && Object.keys(route.params).length > 0
						? `  [params: ${Object.keys(route.params).join(', ')}]`
						: ''
				lines.push(`${prefix}[${route.index}] ${route.path} — ${route.short}${paramHint}`)
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

	/** Returns the registered route list. */
	getRoutes(): RouteRecord[] {
		return this._routes
	}

	/**
	 * Case-insensitive substring search over path, short, and long.
	 * Returns matching RouteRecord entries.
	 */
	lookupRoute(query: string): RouteRecord[] {
		const q = query.toLowerCase()
		return this._routes.filter(
			(r) =>
				r.path.toLowerCase().includes(q) ||
				r.short.toLowerCase().includes(q) ||
				(r.long?.toLowerCase().includes(q) ?? false),
		)
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
