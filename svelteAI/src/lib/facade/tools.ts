import { tool } from 'ai'
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
	}
}
