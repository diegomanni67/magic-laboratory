-- Migration: Add studies and teacher fields to users table
-- These fields will be used for profile completion tracking

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS studies TEXT,
ADD COLUMN IF NOT EXISTS teacher TEXT;

CREATE INDEX IF NOT EXISTS idx_users_studies ON public.users(studies);
CREATE INDEX IF NOT EXISTS idx_users_teacher ON public.users(teacher);
