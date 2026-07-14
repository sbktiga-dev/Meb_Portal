-- AlterTable: Add moderation fields to UserProfileReview
ALTER TABLE "UserProfileReview" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "UserProfileReview" ADD COLUMN "disputeText" TEXT;
ALTER TABLE "UserProfileReview" ADD COLUMN "disputeImages" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "UserProfileReview" ADD COLUMN "disputedAt" TIMESTAMP(3);
ALTER TABLE "UserProfileReview" ADD COLUMN "respondedAt" TIMESTAMP(3);
ALTER TABLE "UserProfileReview" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- DropIndex: Remove unique constraint to allow multiple reviews
DROP INDEX IF EXISTS "UserProfileReview_reviewerId_targetUserId_key";

-- CreateIndex: Index on status for filtering
CREATE INDEX IF NOT EXISTS "UserProfileReview_status_idx" ON "UserProfileReview"("status");
