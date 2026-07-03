# Chatbot Backend Unit Tests

## Goal

Add a focused Vitest suite for the existing Chatbot backend with successful
and failing paths. Coverage is measured only for the Chatbot route, schema,
controller, and service so unrelated untested backend modules do not dilute
or block the result.

Minimum thresholds:

- Lines, statements, and functions: 90%
- Branches: 85%

## Test boundary

Use one `tests/chatbot.test.ts` suite and exercise the real Express app through
Supertest. Keep the Chatbot schema, route, controller, prompt construction, and
service logic real. Mock only the three external boundaries:

- apartment service
- building service
- Google Gemini client

This verifies the complete Chatbot request flow without a database, network
access, or API key.

## Cases

The suite covers:

1. A valid request returns HTTP 200, trims the model reply, loads apartment and
   building data with the expected limits, includes available apartments in
   the prompt, and excludes unavailable apartments.
2. Missing building fields and an unmatched apartment building use the
   existing prompt fallbacks.
3. No available apartment and an empty model response use the existing
   Vietnamese fallback messages.
4. Empty, whitespace-only, over-2,000-character, and unknown request fields
   return HTTP 400 without calling backend data services or Gemini.
5. A rejected data-service or Gemini call returns the sanitized HTTP 500 API
   response and does not expose the underlying exception.

## Coverage and project changes

Add the matching `@vitest/coverage-v8` development dependency, scope Vitest
coverage to the four Chatbot source files, and add one `test:chatbot` script
that runs this suite with coverage enabled.

Remove the uncommitted `/tests/` rule from `backend/.gitignore`, as explicitly
approved, so the new test remains visible to Git. Do not alter the existing
tracked test files.

## TDD procedure

The production Chatbot behavior predates this work, so strict implementation-
first RED cannot be retroactively recreated. Tests are added before any
production correction they reveal. Existing behavior is validated with a
temporary mutation check: break the asserted behavior, observe the targeted
test fail for the expected reason, restore the implementation, and observe it
pass. Any newly discovered defect follows a normal RED-GREEN-REFACTOR cycle.

Final verification runs the focused coverage command, the full backend test
suite, and the TypeScript build.
