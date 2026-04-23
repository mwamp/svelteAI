import { buildRouteRegistry } from 'svelteai'

const tsModules = import.meta.glob('/src/routes/**/+page.ts', { eager: true })
const mdModules = import.meta.glob('/src/routes/**/+page.md', { eager: true })

export const routes = buildRouteRegistry({ tsModules, mdModules })
