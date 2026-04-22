import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-auto';
import { svelteAIPreprocess } from '../svelteAI/src/lib/preprocessor/index.ts';
import { fileURLToPath } from 'url';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			svelteai: fileURLToPath(new URL('../svelteAI/src/lib/index.ts', import.meta.url))
		}
	},
	preprocess: [svelteAIPreprocess(), mdsvex({ extensions: ['.svx', '.md'] })],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
