import type { RouteRecord, RouteParamSchema } from '../registry/types.js'

// ── Input shapes from import.meta.glob ───────────────────────────────────────

interface TsRouteMetaModule {
	_routeMeta?: {
		short: string
		long?: string
		params?: Record<string, RouteParamSchema>
	}
}

interface MdPageModule {
	metadata?: {
		routeMeta?: {
			short: string
			long?: string
		}
	}
}

interface BuildRouteRegistryOptions {
	/** Glob of `_routeMeta.ts` files: import.meta.glob('/src/routes/**\/_routeMeta.ts', { eager: true }) */
	tsModules: Record<string, unknown>
	/** Glob of `+page.md` files: import.meta.glob('/src/routes/**\/+page.md', { eager: true }) */
	mdModules: Record<string, unknown>
}

// ── Path derivation ───────────────────────────────────────────────────────────

/**
 * Converts a glob key like `/src/routes/(s)/guide/why/_routeMeta.ts`
 * or `/src/routes/(s)/guide/why/+page.md`
 * into a SvelteKit path like `/guide/why`.
 *
 * Rules:
 * - Strip leading `/src/routes`
 * - Remove route group segments `(...)`
 * - Remove trailing `/_routeMeta.*` or `/+page.*` filename
 * - Normalise empty string to `/`
 */
export function derivePath(globKey: string): string {
	// Remove /src/routes prefix
	let path = globKey.replace(/^\/src\/routes/, '')
	// Remove _routeMeta.* or +page.* filename
	path = path.replace(/\/(_routeMeta|\+page)\.[^/]+$/, '')
	// Remove route group segments like (s) or (fc)
	path = path.replace(/\/\([^)]+\)/g, '')
	// Normalise root
	return path || '/'
}

// ── Registry builder ──────────────────────────────────────────────────────────

/**
 * Builds a RouteRecord[] from Vite import.meta.glob results.
 *
 * The two glob calls must live in the app (Vite compile-time macro constraint).
 * This function owns all logic: path derivation, filtering, merging, index assignment.
 *
 * Usage in app:
 *   const tsModules = import.meta.glob('/src/routes/**\/+page.ts', { eager: true })
 *   const mdModules = import.meta.glob('/src/routes/**\/+page.md', { eager: true })
 *   export const routes = buildRouteRegistry({ tsModules, mdModules })
 */
export function buildRouteRegistry({
	tsModules,
	mdModules,
}: BuildRouteRegistryOptions): RouteRecord[] {
	const records: Omit<RouteRecord, 'index'>[] = []

	for (const [key, rawMod] of Object.entries(tsModules)) {
		const mod = rawMod as TsRouteMetaModule
		if (!mod._routeMeta) continue
		records.push({
			path: derivePath(key),
			short: mod._routeMeta.short,
			long: mod._routeMeta.long,
			params: mod._routeMeta.params,
		})
	}

	for (const [key, rawMod] of Object.entries(mdModules)) {
		const mod = rawMod as MdPageModule
		const routeMeta = mod.metadata?.routeMeta
		if (!routeMeta) continue
		const path = derivePath(key)
		// Skip if already registered from a .ts file
		if (records.some((r) => r.path === path)) continue
		records.push({
			path,
			short: routeMeta.short,
			long: routeMeta.long,
		})
	}

	// Sort for stable ordering: root first, then alphabetical
	records.sort((a, b) => {
		if (a.path === '/') return -1
		if (b.path === '/') return 1
		return a.path.localeCompare(b.path)
	})

	return records.map((r, index) => ({ ...r, index }))
}

// ── Pattern matching ──────────────────────────────────────────────────────────

/**
 * Converts a route pattern like `/sverdle/[word]` into a regex with named
 * capture groups, then tests it against the given pathname.
 *
 * Returns the matched RouteRecord and extracted param values, or null.
 */
export function matchRoute(
	pathname: string,
	routes: RouteRecord[],
): { record: RouteRecord; params: Record<string, string> } | null {
	for (const record of routes) {
		const regexSource = record.path
			.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex special chars (except [...])
			.replace(/\\\[([^\]]+)\\\]/g, '(?<$1>[^/]+)') // unescape [param] → named group
		const regex = new RegExp(`^${regexSource}$`)
		const match = regex.exec(pathname)
		if (match) {
			return {
				record,
				params: (match.groups ?? {}) as Record<string, string>,
			}
		}
	}
	return null
}
