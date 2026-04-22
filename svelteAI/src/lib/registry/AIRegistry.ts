import { AINode } from './AINode.js'
import type {
	AIComponentType,
	AIComponentTypeSnapshot,
	AIEntry,
	AIEntryInit,
	AIAction,
	AIActionInit,
	AISnapshot,
	AINodeSnapshot,
} from './types.js'

/**
 * Root registry. Holds the component type catalogue and the root AINode
 * (which acts as the global/module-level registration point).
 *
 * One singleton is created in runtime/globalRegistry.ts and shared across
 * the app via Svelte context (AI_REGISTRY_KEY).
 */
export class AIRegistry {
	private _componentTypes: Map<string, AIComponentType> = new Map()
	private _root: AINode

	constructor() {
		this._root = new AINode('__root__', null)
	}

	// ── Component type catalogue ──────────────────────────────────────────────

	registerComponentType(type: AIComponentType): void {
		this._componentTypes.set(type.name, type)
	}

	getComponentTypes(): AIComponentTypeSnapshot[] {
		return [...this._componentTypes.values()].map((t) => ({
			name: t.name,
			description: t.description,
		}))
	}

	// ── Instance tree ─────────────────────────────────────────────────────────

	/** Create a top-level child node (used by module-level .svelte.ts stores). */
	createChild(name: string): AINode {
		return this._root.createChild(name)
	}

	getTree(): AINode {
		return this._root
	}

	// ── Root-level entry registration (global / .svelte.ts state) ────────────

	register(entry: AIEntryInit): AIEntry {
		return this._root.register(entry)
	}

	unregister(entry: AIEntry): void {
		this._root.unregister(entry)
	}

	registerAction(action: AIActionInit): AIAction {
		return this._root.registerAction(action)
	}

	unregisterAction(action: AIAction): void {
		this._root.unregisterAction(action)
	}

	// ── Serialization ─────────────────────────────────────────────────────────

	getSnapshot(): AISnapshot {
		return {
			componentTypes: this.getComponentTypes(),
			tree: this._root.snapshot(),
		}
	}

	/**
	 * Flat dotted-path map of all entry values.
	 * Root entries: `entryName`
	 * Component instance entries: `ComponentName:shortId.entryName`
	 */
	getState(): Record<string, unknown> {
		const result: Record<string, unknown> = {}
		this._collectState(this._root, '', result)
		return result
	}

	private _collectState(
		node: AINode,
		prefix: string,
		result: Record<string, unknown>,
	): void {
		for (const entry of node.entries) {
			const key = prefix ? `${prefix}.${entry.name}` : entry.name
			result[key] = entry.getValue()
		}
		for (const child of node.children) {
			const childPrefix = prefix ? `${prefix}.${child.id}` : child.id
			this._collectState(child, childPrefix, result)
		}
	}

	/**
	 * Flat list of all mounted nodes (BFS order, excludes root).
	 */
	getNodes(): AINodeSnapshot[] {
		const result: AINodeSnapshot[] = []
		const queue: AINode[] = [...this._root.children]
		while (queue.length > 0) {
			const node = queue.shift()!
			result.push(node.snapshot())
			queue.push(...node.children)
		}
		return result
	}
}
