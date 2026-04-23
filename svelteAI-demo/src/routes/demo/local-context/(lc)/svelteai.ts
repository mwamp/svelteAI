import { page } from '$app/state'
import { SvelteAI } from 'svelteai'
import { routes } from '$lib/routes.js'

/**
 * Shared SvelteAI instance for the local-context demo.
 * Routes + getPath enable active route context in promptCurrentPage() and promptRouteMap().
 */
export const svelteAI = new SvelteAI({
	routes,
	getPath: () => page.url.pathname,
})
