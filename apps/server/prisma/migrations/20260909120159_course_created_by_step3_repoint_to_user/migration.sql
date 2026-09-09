-- Step 3 of the Course.createdBy repoint (CourseAdminProfile.id -> User.id).
-- Step 1 (add createdByUserId, nullable) and step 2 (backfill via
-- scripts/backfillCourseCreator.ts) already ran and were verified against
-- forgeloom_dev before this ships. All existing rows are backfilled by now,
-- so the NOT NULL below is safe.

-- Drop the old FK to CourseAdminProfile
ALTER TABLE "Course" DROP CONSTRAINT "Course_createdBy_fkey";

-- Drop the old createdBy column (still holds CourseAdminProfile ids)
ALTER TABLE "Course" DROP COLUMN "createdBy";

-- Promote createdByUserId into its place
ALTER TABLE "Course" RENAME COLUMN "createdByUserId" TO "createdBy";
ALTER TABLE "Course" ALTER COLUMN "createdBy" SET NOT NULL;

-- New FK points at User, not CourseAdminProfile
ALTER TABLE "Course" ADD CONSTRAINT "Course_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
