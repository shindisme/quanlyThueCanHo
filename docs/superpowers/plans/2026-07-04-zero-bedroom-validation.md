# Zero-bedroom Apartment Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow apartments with zero bedrooms while preserving the existing minimum of one bathroom.

**Architecture:** Keep frontend and backend validation aligned by changing only the shared apartment schemas. Reuse the existing Vitest schema test as the regression boundary; no UI, service, or database changes are needed.

**Tech Stack:** TypeScript, Zod, Vitest, Vite

---

### Task 1: Permit zero bedrooms across both validation boundaries

**Files:**
- Modify: `backend/tests/frontend-apartment-schema.test.ts`
- Modify: `frontend/src/schemas/apartment.schema.ts:18-21`
- Modify: `backend/src/schemas/apartment.schema.ts:14`

- [ ] **Step 1: Write the failing regression test**

Add the backend schema import:

```ts
import { createApartmentRequestSchema } from "../src/schemas/apartment.schema.ts";
```

Add this test inside `describe("apartment form schema", ...)`:

```ts
it("accepts zero bedrooms and rejects negative bedrooms", () => {
    const apartment = {
        room_number: "12",
        building_id: 1,
        floor: 1,
        area: 12,
        bedrooms: 0,
        bathrooms: 1,
        rental_price: 13_000_000,
        description: "",
        status: "AVAILABLE"
    };

    expect(apartmentSchema.safeParse(apartment).success).toBe(true);
    expect(createApartmentRequestSchema.safeParse({
        params: {},
        query: {},
        body: apartment
    }).success).toBe(true);

    const negativeBedrooms = { ...apartment, bedrooms: -1 };
    expect(apartmentSchema.safeParse(negativeBedrooms).success).toBe(false);
    expect(createApartmentRequestSchema.safeParse({
        params: {},
        query: {},
        body: negativeBedrooms
    }).success).toBe(false);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
cd backend
npm test -- tests/frontend-apartment-schema.test.ts
```

Expected: FAIL because both schemas currently use `.positive()` for `bedrooms`.

- [ ] **Step 3: Apply the minimal schema changes**

In `frontend/src/schemas/apartment.schema.ts`, replace the bedroom constraint with:

```ts
  bedrooms: z
    .number()
    .int({ message: "Số phòng ngủ phải là số" })
    .nonnegative({ message: "Số phòng ngủ không được nhỏ hơn 0" }),
```

In `backend/src/schemas/apartment.schema.ts`, replace the bedroom field with:

```ts
    bedrooms: z.coerce.number().int().nonnegative(),
```

Keep the bathroom constraints unchanged.

- [ ] **Step 4: Run test and build verification**

Run:

```powershell
cd backend
npm test
```

Expected: all test files PASS.

Run:

```powershell
cd ../frontend
npm run build
```

Expected: TypeScript and Vite build exit with code 0.

- [ ] **Step 5: Commit the implementation**

```powershell
git add -- backend/tests/frontend-apartment-schema.test.ts frontend/src/schemas/apartment.schema.ts backend/src/schemas/apartment.schema.ts
git commit -m "fix: allow apartments without bedrooms"
```
