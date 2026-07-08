-- Migration: Create triggers for automatic notifications
-- This creates notifications when users vote or when new submissions are made to bookmarked challenges

-- Function to create notification when a user votes
CREATE OR REPLACE FUNCTION notify_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the submission owner that someone voted on their video
  INSERT INTO notifications (user_id, type, title, message, link, read)
  SELECT 
    cs.user_id,
    'vote',
    '¡Nuevo voto en tu video! ✨',
    'Alguien votó tu participación en el desafío semanal.',
    '/desafios',
    false
  FROM challenge_submissions cs
  WHERE cs.id = NEW.submission_id
  AND cs.user_id != NEW.user_id; -- Don't notify yourself
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vote notifications
DROP TRIGGER IF EXISTS on_vote_insert ON challenge_votes;
CREATE TRIGGER on_vote_insert
  AFTER INSERT ON challenge_votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_vote();

-- Function to create notification when new submission is made to bookmarked challenge
CREATE OR REPLACE FUNCTION notify_on_submission()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all users who bookmarked this challenge
  INSERT INTO notifications (user_id, type, title, message, link, read)
  SELECT 
    b.user_id,
    'new_submission',
    'Nueva participación en desafío guardado 🎬',
    'Alguien subió un video al desafío que seguís.',
    '/desafios',
    false
  FROM bookmarks b
  WHERE b.challenge_id = NEW.challenge_id
  AND b.user_id != NEW.user_id; -- Don't notify yourself
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for submission notifications
DROP TRIGGER IF EXISTS on_submission_insert ON challenge_submissions;
CREATE TRIGGER on_submission_insert
  AFTER INSERT ON challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_submission();
