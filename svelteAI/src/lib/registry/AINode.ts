import type {
	AIEntry,
	AIEntryInit,
	AIAction,
	AIActionInit,
	AINodeInterface,
	AINodeSnapshot,
	AIEntrySnapshot,
	AIActionSnapshot,
} from './types.js'

function shortId(): string {
	return Math.random().toString(16).slice(2, 6)
}

export class AINode implements AINodeInterface {
	readonly id: string
	readonly name: string
	entries: AIEntry[] = []
	actions: AIAction[] = []
	children: AINode[] = []

	private _parent: AINode | null

	constructor(name: string, parent: AINode | null = null) {
		this.name = name
		this.id = `${name}:${shortId()}`
		this._parent = parent
	}

	register(entry: AIEntryInit): AIEntry {
		const live = entry as AIEntry
		this.entries.push(live)
		return live
	}

	registerAction(action: AIActionInit): AIAction {
		const live = action as AIAction
		this.actions.push(live)
		return live
	}

	unregister(entry: AIEntry): void {
		const idx = this.entries.indexOf(entry)
		if (idx !== -1) this.entries.splice(idx, 1)
	}

	unregisterAction(action: AIAction): void {
		const idx = this.actions.indexOf(action)
		if (idx !== -1) this.actions.splice(idx, 1)
	}

	createChild(name: string): AINode {
		const child = new AINode(name, this)
		this.children.push(child)
		return child
	}

	destroy(): void {
		// Remove self from parent's children list
		if (this._parent) {
			const idx = this._parent.children.indexOf(this)
			if (idx !== -1) this._parent.children.splice(idx, 1)
		}
		// Recursively destroy children
		for (const child of [...this.children]) {
			child.destroy()
		}
		this.entries = []
		this.actions = []
		this.children = []
	}

	snapshot(): AINodeSnapshot {
		const entries: AIEntrySnapshot[] = this.entries.map((e) => ({
			name: e.name,
			access: e.access,
			description: e.description,
			value: e.getValue(),
		}))

		const actions: AIActionSnapshot[] = this.actions.map((a) => ({
			name: a.name,
			description: a.description,
			...(a.params ? { params: a.params } : {}),
			...(a.returns ? { returns: a.returns } : {}),
		}))

		return {
			id: this.id,
			name: this.name,
			entries,
			actions,
			children: this.children.map((c) => c.snapshot()),
		}
	}
}
