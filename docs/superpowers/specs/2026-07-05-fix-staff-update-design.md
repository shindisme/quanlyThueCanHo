# Fix Staff Update Design

## Problem

The staff edit hook always sends `user_id`, while the backend update schema
strictly accepts only `full_name`, `phone`, `position`, and `building_id`.
Validation therefore rejects every update before the staff service runs.

The edit hook also contains redundant account-provisioning logic. Staff
creation already provisions and links an account atomically in the backend.

## Design

- Send only the four fields accepted by the staff update API.
- Remove account creation, username calculation, and related user-list loading
  from the staff edit hook and modal.
- Keep the backend unchanged. It remains responsible for updating the linked
  user's role when `position` changes.
- Narrow the frontend `updateStaff` payload type to the accepted fields so
  TypeScript rejects future attempts to send `user_id`.

## Error Handling

Existing validation and toast handling remain unchanged. The strict backend
schema continues to reject unknown fields rather than silently ignoring them.

## Verification

- Add a compile-time regression check proving `user_id` is not a valid
  `updateStaff` field.
- Observe that the check fails before narrowing the payload type and passes
  afterward.
- Run the frontend build and backend test suite.

## Scope

This change does not add support for legacy staff records without linked
accounts. The current creation flow guarantees that newly created staff have
accounts; legacy-account recovery should be handled separately if such records
are found.
