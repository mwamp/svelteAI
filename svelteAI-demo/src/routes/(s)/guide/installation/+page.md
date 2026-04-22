# Installation

## Install the Package

```bash
yarn add svelteai
```

## Configure the Preprocessor

Add the SvelteAI preprocessor to your `svelte.config.ts`. It must run before `mdsvex` or other preprocessors that transform script blocks.

```ts
import { svelteAIPreprocess } from 'svelteai/preprocessor';
import adapter from '@sveltejs/adapter-auto';

const config = {
  kit: { adapter: adapter() },
  preprocess: [svelteAIPreprocess()],
  extensions: ['.svelte']
};

export default config;
```

## Configure the Vite Plugin

Add the Vite plugin to `vite.config.ts` to enable HMR-aware registry updates during development:

```ts
import { sveltekit } from '@sveltejs/vite-plugin-svelte';
import { svelteAIVite } from 'svelteai/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), svelteAIVite()]
});
```

## TypeScript

SvelteAI ships with full TypeScript types. No additional `@types` package is needed.

Ensure your `tsconfig.json` extends the SvelteKit generated config:

```json
{
  "extends": "./.svelte-kit/tsconfig.json"
}
```
