---
name: worker-enum-transform-fix
description: Worker profile creation failed due to lowercase enum values from frontend
metadata:
  type: feedback
---

**Problem:** The frontend was sending lowercase enum values for `availability` (e.g., "immediate") and `profileVisibility` (e.g., "all_verified"), but the backend DTOs expected uppercase values (e.g., "IMMEDIATE", "ALL_VERIFIED"). This caused validation errors on worker profile creation.

**Why:** The frontend form uses lowercase values for UX reasons, but the backend enum validation is case-sensitive.

**How to apply:** Added `@Transform(({ value }) => value?.toUpperCase())` decorator from `class-transformer` to the `availability` and `profileVisibility` fields in both `CreateWorkerDto` and `UpdateWorkerDto` in `apps/api/src/modules/workers/dto/worker.dto.ts`. This automatically transforms lowercase input to uppercase before validation.

**Files changed:**
- `apps/api/src/modules/workers/dto/worker.dto.ts` - Added @Transform decorator to availability and profileVisibility fields
- `apps/api/src/main.ts` - Changed global ValidationPipe to use `transform: true` to enable class-transformer decorators

**Related:** [[global-validation-pipe-config]]
