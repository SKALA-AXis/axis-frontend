# Frontend Rearchitecture Notes

## Why

The current UI is strong as a mockup, but most screens mix these concerns in one file:

- mock data
- view state
- business actions
- preview logic

That makes backend and AI integration expensive because every screen owns its data shape and loading behavior.

## Safe migration path

1. Keep the legacy mock screens running.
2. Move one feature at a time into `entities`, `features`, and `shared`.
3. Switch the repository implementation from mock to HTTP when the backend endpoint is ready.
4. Remove the legacy screen only after the replacement flow is stable.

## Recommended folders

```text
src/
├── app/
│   ├── App.tsx
│   └── components/
├── entities/
│   └── issue/
├── features/
│   ├── issues/
│   ├── reports/
│   └── search/
├── shared/
│   ├── api/
│   ├── config/
│   ├── mocks/
│   └── ui/
├── legacy-app-backup/
└── docs/
```

## Data rules

- Frontend calls backend APIs only.
- AI draft, reviewed content, and source documents are separate fields.
- Mock data lives in repository implementations, not in view components.
- Components receive typed data and callbacks, not raw fetch logic.
