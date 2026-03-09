ALTER TABLE rm_feedback
  ADD COLUMN IF NOT EXISTS correccio_contrast TEXT,
  ADD COLUMN IF NOT EXISTS correccio_bomba TEXT;
