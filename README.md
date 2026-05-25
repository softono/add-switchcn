# add-switchcn

Install the SwitchCN theme switcher component directly into a React or Next.js
project using Tailwind CSS v4.

```bash
npx add-switchcn
```

## Requirements

- Node.js 20 or newer
- React or Next.js App Router project
- Tailwind CSS v4 installed in the project

## What It Does

`add-switchcn` detects your project and package manager, fetches the current
SwitchCN registry manifest from GitHub, and copies only the files declared by
that manifest into your project.

Files are installed to the first applicable location:

```text
src/components/switchcn   when src/components exists
components/switchcn       when components exists or neither directory exists
```

Existing files are reported and skipped. They are never overwritten. Any
runtime dependencies listed in the remote registry are installed with the
detected `npm`, `pnpm`, `yarn`, or `bun` package manager.

## Usage

Run the installer from your application root:

```bash
npx add-switchcn
```

Example output:

```text
✔ Detecting project
✔ Detecting Tailwind CSS v4
✔ Resolving install path -> src/components/switchcn
✔ Fetching registry
✔ Downloading files
✔ Done

Files added to: src/components/switchcn
```

## Manual App Router Setup

The installer intentionally does not edit `src/app/layout.tsx`, since layout
composition and server-side cookie handling are specific to each application.
After installation:

1. Open the installed `switchcn/index.ts` to use the exported provider and
   server color-mode helpers in your application.
2. Wrap the application content with the installed theme provider in
   `src/app/layout.tsx`.
3. Read the theme cookie in the server layout using the installed server helper
   and pass its initial mode to the provider so the first render matches the
   saved theme.
4. Render the installed theme switcher somewhere in your application UI.

For React applications without an App Router layout, place the provider at the
application root and render the switcher in the appropriate navigation or
settings UI.

## Development

```bash
npm install
npm test
```

The CLI does not contain SwitchCN component source. The remote
`registry-item.json` manifest remains the source of truth for installed files.
