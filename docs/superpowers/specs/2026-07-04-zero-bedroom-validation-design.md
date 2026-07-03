# Zero-bedroom apartment validation

## Scope

Allow an apartment to have `bedrooms = 0`. Keep `bathrooms >= 1` and every
other apartment validation rule unchanged.

## Design

- Frontend: replace the bedroom schema's positive-number constraint with a
  non-negative integer constraint and update its Vietnamese error message.
- Backend: apply the same non-negative integer constraint so API validation
  matches the form.
- UI: keep the existing numeric input and `min={0}` unchanged.

## Verification

Add regression coverage proving that:

- `bedrooms = 0` is accepted by both frontend and backend schemas.
- `bedrooms = -1` is rejected.
- The existing apartment schema tests and frontend production build pass.

## Non-goals

Do not change bathroom validation, database schema, form layout, or apartment
service logic.
