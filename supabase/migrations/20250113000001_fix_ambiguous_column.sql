/**
 * FIX AMBIGUOUS COLUMN REFERENCE IN set_auto_approve_at() TRIGGER
 * =================================================================
 *
 * PROBLEM:
 * PostgreSQL error 42702: "column reference 'auto_approve_days' is ambiguous"
 *
 * ROOT CAUSE:
 * The trigger function has a variable named 'auto_approve_days' and is selecting
 * a column with the same name, causing ambiguity.
 *
 * SOLUTION:
 * Fully qualify the column reference with table name: automation_schedule.auto_approve_days
 */

-- Drop and recreate the trigger function with fixed column reference
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  auto_approve_days INTEGER := 5; -- Default
  user_schedule RECORD;
BEGIN
  IF NEW.status = 'pending_review' AND (OLD.status IS NULL OR OLD.status != 'pending_review') THEN
    NEW.pending_since = NOW();

    -- Try to get user's custom auto_approve_days from automation_schedule
    -- FIX: Fully qualify column reference to avoid ambiguity
    SELECT automation_schedule.auto_approve_days INTO user_schedule
    FROM automation_schedule
    WHERE user_id = NEW.user_id AND enabled = true
    LIMIT 1;

    IF FOUND AND user_schedule.auto_approve_days IS NOT NULL THEN
      auto_approve_days := user_schedule.auto_approve_days;
    END IF;

    NEW.auto_approve_at = NOW() + (auto_approve_days || ' days')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger is already created, no need to recreate it
-- Just updating the function definition above
