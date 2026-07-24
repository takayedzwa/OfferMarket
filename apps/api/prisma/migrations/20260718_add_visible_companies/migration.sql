-- CreateTable
CREATE TABLE "VisibleCompany" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisibleCompany_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisibleCompany_workerId_employerId_key" ON "VisibleCompany"("workerId", "employerId");

-- CreateIndex
CREATE INDEX "VisibleCompany_workerId_idx" ON "VisibleCompany"("workerId");

-- CreateIndex
CREATE INDEX "VisibleCompany_employerId_idx" ON "VisibleCompany"("employerId");

-- AddForeignKey
ALTER TABLE "VisibleCompany" ADD CONSTRAINT "VisibleCompany_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibleCompany" ADD CONSTRAINT "VisibleCompany_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;