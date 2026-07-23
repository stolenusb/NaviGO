# NaviGO Frontend

This is the React + TypeScript + Tailwind CSS frontend for **NaviGO**, a multi-role intercity transport booking platform.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- npm

## Environment variables

Copy `.env.example` to `.env` and adjust the backend URL if needed:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Available scripts

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Folder structure

The frontend is intended to grow with a clean structure such as:

```txt
src/
  assets/
  components/
  layouts/
  pages/
  routes/
  services/
  styles/
  types/
  utils/
```

## Development notes

- `npm run dev` starts the local development server.
- `npm run build` checks that the app compiles for production.
- `npm run preview` previews the production build locally.
- `npm run lint` runs Oxlint on the project.

## Next steps

When you begin building the app shell, add:

- a shared layout
- placeholder route pages
- a typed API client
- auth handling for JWT login
- role-based route guards

## Backend integration

This frontend is designed to connect to the Symfony API backend using the `VITE_API_BASE_URL` environment variable.
