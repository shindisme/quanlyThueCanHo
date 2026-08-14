import assert from "node:assert/strict";
import test from "node:test";

import { getReservationTenantId } from "../src/features/Admin/apartments/utils/reservationTenant.js";

test("uses nested tenant id when reservation tenant_id is missing", () => {
  assert.equal(getReservationTenantId({ tenant: { id: 42 } }), 42);
});
