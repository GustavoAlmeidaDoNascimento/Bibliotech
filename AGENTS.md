## Cursor Cloud specific instructions

### Overview

Bibliotech is a React 18 + TypeScript SPA (Create React App) for school library management. It uses Firebase (Auth + Firestore) as backend-as-a-service -- there is no separate backend server to run. Firebase credentials are hardcoded in `src/config/firebase.ts` and `src/services/firebase.ts`.

### Running the app

- Dev server: `npm start` (runs on port 3000 by default)
- Build: `npm run build` (uses `CI=false` to avoid treating warnings as errors)
- Tests: `npm test` or `CI=true npm test -- --watchAll=false` for non-interactive mode
- Type check: `npx tsc --noEmit`

### Known issues

- Some test suites (Dashboard, etc.) have pre-existing failures due to missing `AuthProvider` context in test utilities. These are not environment issues -- 90/100 tests pass.
- ESLint is configured via `react-app` preset (built into react-scripts). There is no separate `lint` script; warnings appear during `npm start` and `npm run build`.
- The `build` script uses `CI=false` to prevent ESLint warnings from failing the build.

### Configuration

- Firebase config is hardcoded (no `.env` or secrets required for the app to start and display the landing page, user selection, and login forms).
- For full functionality (login, data), a valid Firebase project with Auth and Firestore is required. The hardcoded config points to the `shoollibsystem` project.
- Optional env vars (`REACT_APP_GUEST_*`) can be set in `.env.local` -- see `ENV_VARIABLES.md`.
