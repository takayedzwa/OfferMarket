-- Store the export data snapshot so re-downloads serve the original data
-- rather than re-gathering live data. GDPR Art. 15/20 require providing a
-- copy of the data as it existed at the time of the request.

ALTER TABLE "DataExportRequest" ADD COLUMN "snapshotData" JSONB;