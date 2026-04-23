import { tool } from 'ai'
import { goto } from '$app/navigation'
import { z } from 'zod'
import type { SvelteAI } from './SvelteAI.ts'

/**
 * Builds the ready-made Vercel AI SDK tool definitions for a SvelteAI instance.
 * Each property is a Record<string, Tool> so it can be spread directly into
 * the agent's `tools` object:
 *
 *   tools: {
 *     ...svelteAI.tools.callAction,
 *     ...svelteAI.tools.setState,
 *     ...svelteAI.tools.lookupComponent,
 *     ...svelteAI.tools.lookupRoute,
 *     ...svelteAI.tools.navigateByUrl,
 *     ...svelteAI.tools.navigateByIndex,
 *   }
 */
export function makeTools(svelteAI: SvelteAI) {
	return {
		callAction: {
			callAction: tool({
				description:
					'Call a registered action on a component instance. ' +
					'Use getContext() output to find the correct instance ID and action name. ' +
					'Path format: "ComponentName:shortId.actionName".',
				inputSchema: z.object({
					path: z
						.string()
						.describe(
							'Dotted path to the action, e.g. "ThermostatWidget:a3f2.resetTemperature"',
						),
					args: z
						.record(z.string(), z.unknown())
						.optional()
						.describe('Arguments to pass to the action'),
				}),
				execute: async ({ path, args }) => {
					const result = await svelteAI.callAction(path, (args ?? {}) as Record<string, unknown>)
					return { ok: true, result: result ?? null }
				},
			}),
		},

		setState: {
			setState: tool({
				description:
					'Set one or more state values on component instances or global state. ' +
					'Use getContext() output to find the correct instance ID and entry name. ' +
					'Path format: "ComponentName:shortId.entryName" or "entryName" for global state.',
				inputSchema: z.object({
					updates: z
						.record(z.string(), z.unknown())
						.describe(
							'Map of dotted paths to new values, e.g. { "ThermostatWidget:a3f2.temperature": 21 }',
						),
				}),
				execute: async ({ updates }) => {
					svelteAI.setState(updates as Record<string, unknown>)
					return { ok: true }
				},
			}),
		},

		lookupComponent: {
			lookupComponent: tool({
				description:
					'Find all mounted instances of a component by name and return their current state. ' +
					'Useful when you need to identify which instance to act on.',
				inputSchema: z.object({
					name: z.string().describe('Component name, e.g. "ThermostatWidget"'),
				}),
				execute: async ({ name }) => {
					const nodes = svelteAI.findComponent(name)
					return { nodes: svelteAI.describeNodes(nodes) }
				},
			}),
		},

		lookupRoute: {
			lookupRoute: tool({
				description:
					'Search the route registry by keyword. Returns matching routes with their index, ' +
					'path pattern, description, and any param hints. ' +
					'Call this when the user mentions a page by approximate name or topic, ' +
					'to get the exact path and index before navigating.',
				inputSchema: z.object({
					query: z.string().describe('Keyword to search for, e.g. "thermostat" or "energy"'),
				}),
				execute: async ({ query }) => {
					const routes = svelteAI.lookupRoute(query)
					return { routes }
				},
			}),
		},

		navigateByUrl: {
			navigateByUrl: tool({
				description:
					'Navigate to a page by its fully resolved URL path. ' +
					'You are responsible for constructing the full path — replace any [param] placeholders ' +
					'with actual values before calling this tool. ' +
					'Use lookupRoute first if you are unsure of the exact path.',
				inputSchema: z.object({
					path: z
						.string()
						.describe(
							'Fully resolved URL path with no placeholders, e.g. "/demo/local-context/thermostats" or "/sverdle/crane"',
						),
				}),
				execute: async ({ path }) => {
					await goto(path)
					return { ok: true, path }
				},
			}),
		},

		navigateByIndex: {
			navigateByIndex: tool({
				description:
					'Navigate to a page by its route index (from the Available pages list in context or from lookupRoute). ' +
					'Supply a params map if the route has [param] placeholders — the library resolves the final URL. ' +
					'Prefer this over navigateByUrl for dynamic routes to avoid URL construction errors.',
				inputSchema: z.object({
					index: z
						.number()
						.int()
						.describe('Route index from the Available pages list, e.g. 2'),
					params: z
						.record(z.string(), z.string())
						.optional()
						.describe(
							'Param values to substitute into the path pattern, e.g. { "word": "crane" }',
						),
				}),
				execute: async ({ index, params }) => {
					const routes = svelteAI.getRoutes()
					const route = routes.find((r) => r.index === index)
					if (!route) {
						return { ok: false, error: `No route with index ${index}` }
					}
					// Substitute [param] placeholders
					let resolvedPath = route.path
					if (params) {
						for (const [key, value] of Object.entries(params)) {
							resolvedPath = resolvedPath.replace(`[${key}]`, value)
						}
					}
					// Check for unresolved placeholders
					if (resolvedPath.includes('[')) {
						return {
							ok: false,
							error: `Unresolved params in path: ${resolvedPath}. Required params: ${Object.keys(route.params ?? {}).join(', ')}`,
						}
					}
					await goto(resolvedPath)
					return { ok: true, path: resolvedPath }
				},
			}),
		},
	}
}
