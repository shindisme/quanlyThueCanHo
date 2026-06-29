# Production database migration deployment

The database is the source of truth. The current live-database audit was
read-only; no migration, resolution, reset, push, or data-changing command was
run. That audit found that these repository migrations do not have matching
history entries in the live database:

- `20260615165626_init_structure`
- `20260615170307_make_admin_id_optional`

Do not change application data to make a migration pass. If the live schema or
data differs from the expected state, stop and reconcile the discrepancy with
the database owner.

## Read-only preflight

Run the following queries against the deployment target. Every query must
return zero rows before approval:

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
```

Also compare the live schema with both historical migration files and confirm
that their effects already exist. This inspection must remain read-only.

## Approved production procedure

The following commands are documented for the deployment operator only. This
task does **not** run them. Execute them only after explicit production
approval:

1. Take and verify a restorable database backup.
2. Schedule a maintenance window and pause conflicting writes.
3. Record the preflight results and schema comparison in the change ticket.
4. Baseline the two already-present historical changes by marking them as
   applied:

   ```powershell
   npx prisma migrate resolve --applied 20260615165626_init_structure
   npx prisma migrate resolve --applied 20260615170307_make_admin_id_optional
   ```

   `migrate resolve --applied` records migration-history metadata in
   `_prisma_migrations`; it does not execute those migration SQL files or
   change the existing application schema. It is still a production database
   write and therefore requires the explicit approval and verified backup
   above.

5. Deploy repository migrations:

   ```powershell
   npx prisma migrate deploy
   ```

6. Verify the new column, foreign keys, and unique indexes in the live
   database. Confirm application health and review deployment logs before
   ending the maintenance window.

If any preflight query returns rows, if either historical migration is not
already represented in the live schema, or if backup verification fails, do
not resolve or deploy migrations. Escalate for an explicit data/schema
reconciliation plan.
