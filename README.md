# SvelteAI Workspace

This is a monorepo workspace containing:
- **svelteAI**: A Svelte library for AI components
- **svelteAI-demo**: A SvelteKit demo application showcasing the library

## Structure

```
svelteAI/                 # The library
├── src/lib/             # Library source code
│   ├── index.ts         # Main export file
│   └── TestComponent.svelte
└── package.json

svelteAI-demo/           # The demo app
├── src/routes/          # Demo pages
└── package.json

package.json             # Workspace root configuration
```

## Setup

This workspace uses Yarn workspaces to link the library and demo together. The demo app uses the library as a local dependency with HMR (Hot Module Replacement) support.

### Installation

```bash
yarn install
```

This will install all dependencies for both projects and link them together.

## Development

### Run the demo app (recommended)

```bash
yarn dev
# or
yarn dev:demo
```

This starts the demo app at `http://localhost:5173` with HMR enabled. Changes to the library source will automatically reload in the demo.

### Run the library dev server

```bash
yarn dev:lib
```

### Build

Build the library:
```bash
yarn build:lib
```

Build the demo:
```bash
yarn build:demo
```

Build both:
```bash
yarn build
```

## How it works

### Workspace Configuration

The root [`package.json`](package.json:1) defines the workspace:
- Links both `svelteAI` and `svelteAI-demo` as workspaces
- Provides convenient scripts to run both projects

### Library as Dependency

The demo app includes the library in its [`dependencies`](svelteAI-demo/package.json:18):
```json
"dependencies": {
  "svelteai": "*"
}
```

The `*` version means it will use the local workspace version.

### HMR Support

The demo's [`vite.config.ts`](svelteAI-demo/vite.config.ts:1) is configured for HMR:
- `resolve.alias` points `svelteai` to the library's source code (`../svelteAI/src/lib`)
- `server.fs.allow` permits Vite to serve files from the parent directory
- This enables instant updates when editing library components

## Adding Library Components

1. Create your component in `svelteAI/src/lib/`
2. Export it from `svelteAI/src/lib/index.ts`
3. Import and use it in the demo: `import { YourComponent } from 'svelteai'`

## Publishing

When ready to publish the library:

1. Build the library: `yarn build:lib`
2. Navigate to the library: `cd svelteAI`
3. Publish: `npm publish` or `yarn publish`

The built library will be in the `dist/` folder (configured in [`package.json`](svelteAI/package.json:1)).
