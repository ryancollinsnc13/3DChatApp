# React Spatial Chat MVP Plan

## Summary

Build a new Vite React TypeScript app from the empty repo, but first create a root-level `ai docs/` folder to preserve project lineage before implementation. The MVP will use npm, Tailwind, Zustand, React Router, React Three Fiber, and a Supabase-ready data layer that defaults to mock data.

## Lineage Docs

- Create `ai docs/` before app scaffolding.
- Save the original pasted product/design brief as `ai docs/product-brief.md`.
- Save this implementation plan as `ai docs/implementation-plan.md`.
- Add `ai docs/lineage-log.md` to record major decisions and future implementation milestones.

## Key Changes

- Scaffold the app with `npm create vite@latest . -- --template react-ts`.
- Add dependencies: `react-router-dom`, `zustand`, `@supabase/supabase-js`, `three`, `@react-three/fiber`, `@react-three/drei`, `lucide-react`, Tailwind, Vitest, Testing Library, and Playwright.
- Implement typed models for players, houses, conversations, messages, neighborhoods, friend requests, avatar presets, and house presets.
- Create a Supabase-ready API boundary with a mock default adapter.
- Add `.env.example` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Implementation

- App flow: dev mock login, avatar setup gate, then authenticated shell with bottom tabs: `Home | Chat`.
- Home tab: player house/profile room, privacy controls, status, bio, presets, Add Neighbor flow, friend requests, and a React Three Fiber neighborhood scene.
- Neighborhood scene: clickable houses, unread badges, presence indicators, preset colors, and a visit/profile panel that can open related chat context.
- Chat tab: conversation list, DM/group threads, unread counts, previews, timestamps, message sending, and fast switching.
- State: `useSessionStore`, `useChatStore`, and `useNeighborhoodStore`.
- Design: cozy, readable, mobile-first, playful but practical; spatial UI supports chat/navigation, not MMO gameplay.

## Test Plan

- Unit/component tests for stores and key UI flows.
- Playwright smoke tests for login, avatar setup, Home, Chat, profile updates, house selection, message sending, and friend request flows.
- Playwright canvas checks at mobile and desktop sizes to confirm the React Three Fiber neighborhood renders nonblank and remains clickable.
- Verify with `npm run lint`, `npm run build`, and the Playwright suite.

## Assumptions

- Use the exact folder name `ai docs/` at the repository root, matching the request.
- The MVP uses mock seeded data through the Supabase-ready adapter unless real Supabase credentials are added later.
- React Three Fiber is included immediately for the neighborhood, but only as navigation and identity UI.
