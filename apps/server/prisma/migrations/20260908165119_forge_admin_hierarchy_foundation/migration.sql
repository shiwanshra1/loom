-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "collegeId" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "cohortId" TEXT,
ADD COLUMN     "rollNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Course_collegeId_status_idx" ON "Course"("collegeId", "status");

-- CreateIndex
CREATE INDEX "StudentProfile_cohortId_idx" ON "StudentProfile"("cohortId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_collegeId_rollNumber_key" ON "StudentProfile"("collegeId", "rollNumber");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
