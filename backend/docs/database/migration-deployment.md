# Production database migration deployment

The database is the source of truth. The live-database audit was read-only and
matches the schema represented by
`20260627000000_baseline_current_database`, before the integrity hardening
changes.

The broken migration files `20260615165626_init_structure` and
`20260615170307_make_admin_id_optional` were replaced because they did not
describe the audited live schema. For example, they omitted current tables and
used obsolete user/building fields. Neither old migration has a history entry
in the audited live database.

This task only resets repository migration files. It does not reset the live
database or change its migration history.

## Read-only preflight

Before production approval:

1. Compare the live schema and constraints with the baseline migration using
   read-only catalog queries or a read-only schema diff. The comparison must
   show that the live database already has the complete baseline shape.
2. Confirm that `_prisma_migrations` has no entry for the removed migrations
   and no entry for `20260627000000_baseline_current_database`.
3. Run the following integrity queries. Every query must return zero rows:

   ```sql
   SELECT i.id, i.tenant_id
   FROM public.invoices AS i
   LEFT JOIN public.tenants AS t ON t.id = i.tenant_id
   WHERE t.id IS NULL;

   SELECT building_id, floor, room_number, COUNT(*)
   FROM public.apartments
   GROUP BY building_id, floor, room_number
   HAVING COUNT(*) > 1;

   SELECT apartment_id, month, year, COUNT(*)
   FROM public.utility_readings
   GROUP BY apartment_id, month, year
   HAVING COUNT(*) > 1;

   SELECT apartment_id, tenant_id, COUNT(*)
   FROM public.reviews
   GROUP BY apartment_id, tenant_id
   HAVING COUNT(*) > 1;

   SELECT apartment_id, COUNT(*)
   FROM public.rental_contracts
   WHERE status = 'ACTIVE'
   GROUP BY apartment_id
   HAVING COUNT(*) > 1;

   SELECT apartment_id, schedule_time, COUNT(*)
   FROM public.viewing_schedules
   WHERE status IN ('PENDING', 'CONFIRMED')
   GROUP BY apartment_id, schedule_time
   HAVING COUNT(*) > 1;
   ```

Do not change or delete application data to make a preflight pass. Stop and
reconcile any mismatch with the database owner.

## Existing live database

Do **not** execute the baseline SQL against an existing live database: its
tables and constraints already exist. Do **not** run `prisma migrate reset` on
live, even though resetting the repository migration-file history was
approved. `migrate reset` is destructive and can cause complete data loss.

Only after the read-only comparison passes, a restorable backup is verified,
and explicit production approval is recorded:

1. Schedule a maintenance window and pause application/background writes.
2. Mark the already-present baseline schema as applied:

   ```powershell
   npx prisma migrate resolve --applied 20260627000000_baseline_current_database
   ```

   This writes only baseline history metadata to `_prisma_migrations`; it does
   not execute the baseline SQL or change the existing application schema. It
   is still a production database write and requires approval.

3. Deploy the pending hardening migration:

   ```powershell
   npx prisma migrate deploy
   ```

4. Verify the onboarding column, both foreign keys, the three full unique
   indexes, and the two partial unique indexes
   `rental_contracts_one_active_per_apartment_key` and
   `viewing_schedules_one_active_slot_key`. Confirm their predicates are
   limited to `WHERE status = 'ACTIVE'` and
   `WHERE status IN ('PENDING', 'CONFIRMED')`, respectively, then rerun both
   duplicate queries above. Confirm application health and deployment logs
   before ending the maintenance window.

The hardening migration uses one explicit transaction. Its `ALTER TABLE` and
index operations acquire write-affecting locks that are held until `COMMIT`;
on large or busy tables, concurrent writes can block and the migration can wait
for existing transactions. Keep writes paused, monitor lock/statement
timeouts, and allow enough maintenance-window capacity. A failed preflight or
DDL statement rolls back the transaction without cleanup or partial data
changes. Creating the partial unique index also scans `rental_contracts` and
acquires a lock that conflicts with concurrent writes, so size the maintenance
window for that table and keep contract creation/end operations paused.
The viewing-schedule partial unique index likewise scans
`viewing_schedules` and locks against concurrent schedule writes. It is the
database-level backstop that prevents two PENDING or CONFIRMED rows for one
apartment and exact timestamp. Expired PENDING rows remain covered until the
booking transaction marks the exact expired slot CANCELLED; using a
time-dependent predicate would not be immutable enough for a PostgreSQL
partial index. Keep booking and schedule-management writes paused while this
index is created.

## Clean database

For an empty database, `prisma migrate deploy` runs the baseline first and the
hardening migration second. Do not mark the baseline as applied on an empty
database, because the baseline SQL must create the schema.

If the backup cannot be restored, the schema diff does not match, a preflight
returns rows, or the expected migration history differs, do not resolve or
deploy. Escalate for an explicit reconciliation plan.
