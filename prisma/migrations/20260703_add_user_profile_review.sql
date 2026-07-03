-- Migration: Add UserProfileReview model for user-to-user reviews
-- Execute this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS "UserProfileReview" (
    "id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewerId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,

    CONSTRAINT "UserProfileReview_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one review per reviewer-target pair
CREATE UNIQUE INDEX IF NOT EXISTS "UserProfileReview_reviewerId_targetUserId_key"
    ON "UserProfileReview"("reviewerId", "targetUserId");

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS "UserProfileReview_targetUserId_idx"
    ON "UserProfileReview"("targetUserId");

CREATE INDEX IF NOT EXISTS "UserProfileReview_reviewerId_idx"
    ON "UserProfileReview"("reviewerId");

-- Foreign keys
ALTER TABLE "UserProfileReview"
    ADD CONSTRAINT "UserProfileReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserProfileReview"
    ADD CONSTRAINT "UserProfileReview_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
