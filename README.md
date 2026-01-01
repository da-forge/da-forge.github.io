# Da Forge

A React single-page application configured for GitHub Pages hosting.

## Features

- **React 19** with React Compiler for optimized performance
- **Tailwind CSS v4** with CSS-based configuration
- **Vite** for fast development and building
- **GitHub Pages SPA** routing support
- **React Router** for client-side routing

## Development

Install dependencies:

```bash
pnpm install
```

Run development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm run css:build
pnpm run build
```

## Deployment

This project is configured to be deployed to GitHub Pages at `da-forge.github.io`.

1. Build the project: `pnpm run css:build && pnpm run build`
2. Deploy the `dist` folder to the `gh-pages` branch or configure GitHub Pages to serve from the main branch's `/dist` folder

The SPA routing is handled by:

- `404.html` - Redirects all routes to the main app
- `index.html` - Contains the redirect handler script
- `.nojekyll` - Disables Jekyll processing on GitHub Pages

## How GitHub Pages SPA Works

This setup uses the [spa-github-pages](https://github.com/rafgraph/spa-github-pages) solution:

1. When a user navigates to a route (e.g., `/about`), GitHub Pages serves the `404.html` file
2. The `404.html` script converts the path into a query parameter and redirects to `index.html`
3. The `index.html` script reads the query parameter and restores the correct URL using the History API
4. React Router takes over and displays the correct component

This allows client-side routing to work seamlessly on GitHub Pages.
