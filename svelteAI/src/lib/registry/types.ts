// Entry init shape (passed to register())
export interface AIEntryInit {
	name: string
	access: 'r' | 'rw'
	description: string
	getValue(): unknown
	setValue?(value: unknown): void
}

// Live entry — register() returns the init object as the handle
export interface AIEntry extends AIEntryInit {}

// Action init shape
export interface AIActionInit {
	name: string
	description: string
	params?: Record<string, AIParamSchema>
	returns?: string
	call(...args: unknown[]): unknown
}

export interface AIAction extends AIActionInit {}

export interface AIParamSchema {
	type: string
	description: string
}

// Component type (registered from <script module>)
export interface AIComponentType {
	name: string
	description: string
}

// Node — live tree node per component instance
export interface AINodeInterface {
	id: string
	name: string
	entries: AIEntry[]
	actions: AIAction[]
	children: AINodeInterface[]

	register(entry: AIEntryInit): AIEntry
	registerAction(action: AIActionInit): AIAction
	unregister(entry: AIEntry): void
	unregisterAction(action: AIAction): void
	createChild(name: string): AINodeInterface
	destroy(): void
}

// Snapshot types (serializable, values resolved at call time)
export interface AISnapshot {
	componentTypes: AIComponentTypeSnapshot[]
	tree: AINodeSnapshot
}

export interface AIComponentTypeSnapshot {
	name: string
	description: string
}

export interface AINodeSnapshot {
	id: string
	name: string
	entries: AIEntrySnapshot[]
	actions: AIActionSnapshot[]
	children: AINodeSnapshot[]
}

export interface AIEntrySnapshot {
	name: string
	access: 'r' | 'rw'
	description: string
	value: unknown
}

export interface AIActionSnapshot {
	name: string
	description: string
	params?: Record<string, AIParamSchema>
	returns?: string
}

// Change event (for subscribe — Phase 2 stub)
export interface AIChangeEvent {
	type: 'value' | 'mount' | 'unmount'
	path: string
	value?: unknown
}
