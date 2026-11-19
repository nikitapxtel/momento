# Contributing and coding conventions

These conventions keep the codebase consistent. Follow the existing patterns when adding code.

## Workflow

1. Create a branch from `main` (`feature/…`, `fix/…`).
2. Make the change **with tests**.
3. Run `npm run check` and `npm run test:e2e` locally.
4. Open a pull request. CI must be green (lint, types, unit, browser, database and CodeQL)
   before merging. Merging to `main` deploys automatically.

## TypeScript and React

- TypeScript is `strict` with `noUncheckedIndexedAccess`. No `any`; prefer narrow types.
- Function components and hooks only. Name components in `PascalCase`, hooks `useThing`.
- Keep **logic out of components**: pure functions live in `src/lib/` and have a
  `*.test.ts` file beside them. Components call them.
- Data access goes through `src/lib/api.ts` only. Components never call Supabase directly.
- Derive values during render instead of copying props into state inside effects.
- Styles live in `src/styles.css` as classes. Inline `style` is only for values that change
  at runtime (positions, rotations, colours).
- Copy is British English, sentence case, friendly and short.

## Accessibility

- Real `<button>` and `<a>` elements, never clickable `<div>`s.
- Every icon-only button has an `aria-label`. Decorative images use `alt=""`.
- Keep touch targets at least 44 × 44 px and text contrast at least 4.5:1.
- Motion must respect `prefers-reduced-motion`.

## Testing

| Kind       | Where                  | Tool                         |
| ---------- | ---------------------- | ---------------------------- |
| Logic      | `src/lib/*.test.ts`    | Vitest                       |
| Components | `src/**/*.test.tsx`    | Vitest + Testing Library     |
| User flows | `tests/e2e/*.spec.ts`  | Playwright (desktop, mobile) |
| Privacy    | `supabase/tests/*.sql` | SQL run against Postgres     |

Query elements by role and accessible name, the way people and assistive technology find them.

## Database changes

- Add a new file in `supabase/migrations/` (never edit one that has been applied).
- Every table has Row Level Security enabled, with explicit policies.
- Add a test to `supabase/tests/rls_test.sql` for every rule: who **can** and who **cannot**.
- Keep limits in `src/lib/api.ts` (`validateNewMemory`) in step with database `check`s.
