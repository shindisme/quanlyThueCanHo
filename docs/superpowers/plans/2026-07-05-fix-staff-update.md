# Fix Staff Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make staff updates pass strict backend validation and prevent the frontend from sending `user_id` again.

**Architecture:** Keep the backend contract unchanged and make the edit flow honor it. Narrow the frontend service type, remove redundant account provisioning from the edit hook, and leave account creation plus role synchronization in the backend paths that already own those responsibilities.

**Tech Stack:** React 19, TypeScript 6, Axios, Vite, Vitest

---

### Task 1: Reproduce the payload contract regression

**Files:**
- Create: `frontend/src/services/staffService.contract.test.ts`

- [ ] **Step 1: Add a compile-time regression check**

```ts
import { updateStaff } from "./staffService";

type UpdateStaffInput = Parameters<typeof updateStaff>[1];

const validUpdate: UpdateStaffInput = {
  full_name: "Nguyen Van A",
  phone: null,
  position: "Kỹ thuật",
  building_id: 1,
};
void validUpdate;

// @ts-expect-error user_id is not accepted by the staff update API
const invalidUpdate: UpdateStaffInput = { user_id: 1 };
void invalidUpdate;
```

- [ ] **Step 2: Run the check and verify RED**

Run from `frontend`:

```bash
npm run build
```

Expected: FAIL with `TS2578: Unused '@ts-expect-error' directive` because
`updateStaff` currently accepts every property in `Partial<Staff>`.

### Task 2: Enforce the API contract and simplify the edit flow

**Files:**
- Modify: `frontend/src/services/staffService.ts`
- Modify: `frontend/src/hooks/admin/useStaffModify.ts`
- Modify: `frontend/src/pages/Admin/staff/components/StaffModifyModal.tsx`
- Test: `frontend/src/services/staffService.contract.test.ts`

- [ ] **Step 1: Narrow the service payload type**

Replace the `updateStaff` signature in `frontend/src/services/staffService.ts`
with:

```ts
export async function updateStaff(
  id: number,
  data: Partial<Pick<Staff, "full_name" | "phone" | "position" | "building_id">>,
): Promise<Staff> {
  const res = await api.put(`/staff/${id}`, data);
  return res.data.data || res.data;
}
```

- [ ] **Step 2: Remove account provisioning from the update mutation**

In `frontend/src/hooks/admin/useStaffModify.ts`, remove these imports:

```ts
import * as authService from "../../services/authService";
import type { UserData } from "../../services/authService";
```

Replace `updateMutation` with:

```ts
const updateMutation = useMutation({
  mutationFn: async ({ id, fullName, phone, position, buildingId }: {
    id: number;
    fullName: string;
    phone: string | null;
    position: string;
    buildingId: number | "";
  }) => {
    await staffService.updateStaff(id, {
      full_name: fullName,
      phone: phone || null,
      position,
      building_id: buildingId ? Number(buildingId) : null,
    });
  },
  onSuccess: () => {
    toast.success("Cập nhật thông tin nhân viên thành công!");
    queryClient.invalidateQueries({ queryKey: ["staff"] });
    onSuccess();
    onClose();
  },
  onError: (error: unknown) => {
    const err = error as { response?: { data?: { error?: string; message?: string } } };
    toast.error(err.response?.data?.error || err.response?.data?.message || "Không thể cập nhật nhân viên");
  }
});
```

Delete the `users` and `nextUsername` state declarations and delete the effect
that calculates `nextUsername`:

```ts
const [users, setUsers] = useState<UserData[]>([]);
const [nextUsername, setNextUsername] = useState("");
```

Remove the users request from `fetchData`:

```ts
const uRes = await authService.getAllUsers();
setUsers(uRes);
```

Call the mutation from `handleSave` with only update fields:

```ts
updateMutation.mutate({
  id: editItem.id,
  fullName,
  phone: phone || null,
  position,
  buildingId,
});
```

Delete `hasLinkedUser`, `nextUsername`, and `hasLinkedUser` from the returned
hook object.

- [ ] **Step 3: Make the modal display-only for account information**

In `frontend/src/pages/Admin/staff/components/StaffModifyModal.tsx`, remove
`nextUsername` and `hasLinkedUser` from the hook result. Replace the conditional
account block with:

```tsx
<div className="col-span-12">
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    Tài khoản liên kết
  </label>
  <div className="premium-input rounded-md bg-gray-50 border border-gray-300 py-2.5 px-3 text-sm text-gray-500 font-semibold">
    {editItem?.user?.username
      ? `Tài khoản: @${editItem.user.username}`
      : "Chưa có tài khoản liên kết"}
  </div>
</div>
```

- [ ] **Step 4: Run the regression check and verify GREEN**

Run from `frontend`:

```bash
npm run build
```

Expected: PASS. The `@ts-expect-error` is now consumed because `user_id` is
outside the update contract, and the production bundle builds successfully.

- [ ] **Step 5: Commit the fix**

```bash
git add -- frontend/src/services/staffService.contract.test.ts frontend/src/services/staffService.ts frontend/src/hooks/admin/useStaffModify.ts frontend/src/pages/Admin/staff/components/StaffModifyModal.tsx
git commit -m "fix: update staff without user id"
```

### Task 3: Verify the repository

**Files:**
- Verify only; no additional files

- [ ] **Step 1: Run backend tests**

Run from `backend`:

```bash
npm test -- --passWithNoTests
```

Expected: PASS with no failing test files.

- [ ] **Step 2: Check formatting and unintended changes**

Run from the repository root:

```bash
git diff --check HEAD^
git status --short
```

Expected: `git diff --check HEAD^` prints nothing. `git status --short` prints
nothing after the implementation commit.
