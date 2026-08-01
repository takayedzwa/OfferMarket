-- A-L6: Rename AdminAction.adminId -> actorId (data-preserving).
-- The actor may be an ADMIN or a SUPPORT user, so the old name was misleading
-- in the audit trail. Renamed via ALTER ... RENAME (not drop/recreate) to keep
-- existing audit rows intact.
ALTER TABLE "AdminAction" RENAME COLUMN "adminId" TO "actorId";
ALTER INDEX "AdminAction_adminId_idx" RENAME TO "AdminAction_actorId_idx";
