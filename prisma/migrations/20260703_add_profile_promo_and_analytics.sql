-- Migration: Add isProfilePromo to Post, profileViews to User
-- Execute this in Neon SQL Editor

ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isProfilePromo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileViews" INTEGER NOT NULL DEFAULT 0;
